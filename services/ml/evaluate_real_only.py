"""
Real-Only Held-Out Evaluation
==============================
Evaluates the trained XGBoost triage model against ONLY the real clinical
samples from the real/ data directory.

Because the real datasets (UCI Heart, Statlog, Pima, Sylhet) use different
feature schemas than the model's 12-feature input, this script:
  1. Maps each real dataset's available features to the model's feature space
  2. Uses clinically-grounded defaults for features unavailable in each dataset
  3. Derives triage urgency labels from each dataset's original outcome columns
  4. Reports accuracy, per-class F1, and 95% Wilson CI on the real-only sample

Run: python evaluate_real_only.py
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from scipy import stats

# ── paths ────────────────────────────────────────────────────────────────────
BASE   = os.path.dirname(__file__)
MODEL  = joblib.load(os.path.join(BASE, 'models', 'triage_model.pkl'))
SCALER = joblib.load(os.path.join(BASE, 'models', 'scaler.pkl'))
META   = json.load(open(os.path.join(BASE, 'models', 'model_metadata.json')))

# Model feature order — must match training exactly
FEATURE_COLS = META['features']
# ['bp_sys','bp_dia','temp','spo2','pulse','severity','duration_days',
#  'chest_pain','breathing','headache','bleeding','seizure']

# ── population-level defaults (ICMR/WHO rural India reference values) ────────
# Used only when a real dataset does not contain that feature.
DEFAULTS = {
    'bp_sys':       120.0,
    'bp_dia':        80.0,
    'temp':          98.6,
    'spo2':          98.0,
    'pulse':         78.0,
    'severity':       5.0,
    'duration_days':  2.0,
    'chest_pain':     0.0,
    'breathing':      0.0,
    'headache':       0.0,
    'bleeding':       0.0,
    'seizure':        0.0,
}

def build_row(**kwargs):
    """Build one feature row using provided values + defaults for the rest."""
    return [kwargs.get(f, DEFAULTS[f]) for f in FEATURE_COLS]

# ── label mapping helpers ─────────────────────────────────────────────────────
# Model classes: 0=Low, 1=Medium, 2=High, 3=Emergency
# Each real dataset has its own severity scale — mapped below.

def load_uci_heart(path):
    """UCI Heart Cleveland & Hungarian & Switzerland.
    target: 0 = no disease (Low), 1-2 = mild (Medium), 3-4 = severe (High/Emergency)
    trestbps = resting BP systolic
    thalach  = max heart rate
    """
    df = pd.read_csv(path)
    rows, labels = [], []
    for _, r in df.iterrows():
        bp_sys  = float(r.get('trestbps', DEFAULTS['bp_sys']))
        pulse   = float(r.get('thalach',  DEFAULTS['pulse']))
        exang   = float(r.get('exang',    0))   # exercise-induced angina
        chest_pain = 1.0 if float(r.get('cp', 0)) >= 3 else 0.0
        target  = int(r.get('target', r.get(df.columns[-1], 0)))
        # Map target (0-4) → urgency (0-3)
        label = 0 if target == 0 else (1 if target <= 1 else (2 if target <= 3 else 3))
        rows.append(build_row(bp_sys=bp_sys, pulse=pulse,
                               chest_pain=chest_pain, breathing=exang))
        labels.append(label)
    return rows, labels

def load_statlog(path):
    """Statlog Heart — no header, 14 columns, last col is class (1=absent,2=present).
    col 3 (index 3) = trestbps, col 7 (index 7) = thalach, col 2 (index 2) = cp
    """
    df = pd.read_csv(path, header=None)
    rows, labels = [], []
    for _, r in df.iterrows():
        bp_sys     = float(r.iloc[3])
        pulse      = float(r.iloc[7])
        chest_pain = 1.0 if float(r.iloc[2]) >= 3 else 0.0
        exang      = float(r.iloc[8])
        target     = int(r.iloc[13])          # 1=no disease, 2=disease
        label      = 0 if target == 1 else 2  # absent→Low, present→High
        rows.append(build_row(bp_sys=bp_sys, pulse=pulse,
                               chest_pain=chest_pain, breathing=exang))
        labels.append(label)
    return rows, labels

def load_pima(path):
    """Pima Diabetes — glucose proxies severity, BP is diastolic only.
    outcome: 0=no diabetes (Low), 1=diabetes (Medium-High based on glucose)
    """
    df = pd.read_csv(path)
    rows, labels = [], []
    for _, r in df.iterrows():
        bp_dia    = float(r.get('blood_pressure', DEFAULTS['bp_dia']))
        glucose   = float(r.get('glucose', 100))
        outcome   = int(r.get('outcome', 0))
        severity  = min(10.0, max(1.0, (glucose - 70) / 30))
        label     = 0 if outcome == 0 else (1 if glucose < 140 else 2)
        rows.append(build_row(bp_dia=bp_dia, severity=severity))
        labels.append(label)
    return rows, labels

def load_sylhet(path):
    """Sylhet Diabetes Symptoms — symptom-based, no vitals.
    class: Positive=1 (Medium risk), Negative=0 (Low risk)
    Polyuria/Polydipsia/sudden weight loss → severity proxy
    """
    df = pd.read_csv(path)
    rows, labels = [], []
    yes = lambda v: 1.0 if str(v).strip().lower() in ('yes','positive','1','true') else 0.0
    for _, r in df.iterrows():
        sev   = 3.0 + yes(r.get('Polyuria','No')) + yes(r.get('Polydipsia','No')) \
                    + yes(r.get('sudden weight loss','No')) * 2 \
                    + yes(r.get('weakness','No'))
        outcome = yes(r.get('class', r.get('Outcome', 'Negative')))
        label   = int(outcome)   # 0=Low, 1=Medium
        rows.append(build_row(severity=sev))
        labels.append(label)
    return rows, labels

# ── load all real datasets ────────────────────────────────────────────────────
REAL_DIR = os.path.join(BASE, 'data', 'real')

all_rows, all_labels, sources = [], [], []

loaders = [
    ('uci_heart_disease_real.csv',   load_uci_heart,  'UCI Heart Cleveland'),
    ('uci_heart_hungarian_real.csv', load_uci_heart,  'UCI Heart Hungarian'),
    ('uci_heart_switzerland_real.csv',load_uci_heart, 'UCI Heart Switzerland'),
    ('statlog_heart_real.csv',       load_statlog,    'Statlog Heart'),
    ('pima_diabetes_real.csv',       load_pima,       'Pima Diabetes'),
    ('diabetes_symptoms_real.csv',   load_sylhet,     'Sylhet Diabetes Symptoms'),
]

print("\n📂 Loading real clinical datasets...\n")
for fname, loader, name in loaders:
    fpath = os.path.join(REAL_DIR, fname)
    if not os.path.exists(fpath):
        print(f"  ⚠ Not found: {fname} — skipping")
        continue
    try:
        rows, labels = loader(fpath)
        all_rows.extend(rows)
        all_labels.extend(labels)
        sources.append({'name': name, 'n': len(rows)})
        print(f"  ✓ {name}: {len(rows)} samples")
    except Exception as e:
        print(f"  ✗ {name}: failed — {e}")

X = np.array(all_rows, dtype=float)
y = np.array(all_labels, dtype=int)

print(f"\n  Total real samples loaded: {len(y)}")
print(f"  Label distribution: { {i: int((y==i).sum()) for i in range(4)} }")

# ── run through trained model ─────────────────────────────────────────────────
X_scaled = SCALER.transform(X)
y_pred   = MODEL.predict(X_scaled)
y_proba  = MODEL.predict_proba(X_scaled)

# ── metrics ───────────────────────────────────────────────────────────────────
n         = len(y)
n_correct = int((y_pred == y).sum())
acc       = n_correct / n

# Wilson 95% confidence interval for accuracy proportion
z    = 1.96
low  = (acc + z**2/(2*n) - z*np.sqrt(acc*(1-acc)/n + z**2/(4*n**2))) / (1 + z**2/n)
high = (acc + z**2/(2*n) + z*np.sqrt(acc*(1-acc)/n + z**2/(4*n**2))) / (1 + z**2/n)

# Per-class precision, recall, F1
classes = {0:'Low', 1:'Medium', 2:'High', 3:'Emergency'}
print("\n" + "="*60)
print("  REAL-ONLY HELD-OUT EVALUATION RESULTS")
print("="*60)
print(f"\n  Samples evaluated : {n}")
print(f"  Correct           : {n_correct}")
print(f"  Accuracy          : {acc*100:.1f}%")
print(f"  95% Wilson CI     : [{low*100:.1f}%, {high*100:.1f}%]")
print(f"\n  Per-class breakdown:")
for c, name in classes.items():
    mask_true = y == c
    mask_pred = y_pred == c
    if mask_true.sum() == 0:
        print(f"    {name:12s}: no real samples in this class")
        continue
    tp = int((mask_true & mask_pred).sum())
    fp = int((~mask_true & mask_pred).sum())
    fn = int((mask_true & ~mask_pred).sum())
    prec   = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1     = 2*prec*recall/(prec+recall) if (prec+recall) > 0 else 0
    print(f"    {name:12s}: support={mask_true.sum():4d}  "
          f"precision={prec*100:.1f}%  recall={recall*100:.1f}%  F1={f1*100:.1f}%")

print(f"\n  Blended accuracy (real+synthetic, per metadata): "
      f"{META['accuracy']*100:.1f}%")
print(f"\n  Sources evaluated:")
for s in sources:
    print(f"    - {s['name']}: {s['n']} samples")

# ── save results to JSON for script overlay reference ────────────────────────
result = {
    'real_only_accuracy': round(acc, 4),
    'real_only_accuracy_pct': round(acc * 100, 1),
    'ci_low_pct': round(low * 100, 1),
    'ci_high_pct': round(high * 100, 1),
    'n_real_samples': n,
    'n_correct': n_correct,
    'blended_accuracy_pct': round(META['accuracy'] * 100, 1),
    'sources': sources
}
out = os.path.join(BASE, 'models', 'real_only_eval_results.json')
with open(out, 'w') as f:
    json.dump(result, f, indent=2)
print(f"\n  Results saved to: models/real_only_eval_results.json")
print("="*60 + "\n")
