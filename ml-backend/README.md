# ML-Powered Triage System

This backend provides machine learning-based triage predictions for the Swasthya Connect healthcare platform.

## Features

- **Random Forest Classifier** trained on Indian healthcare scenarios
- **Real-time predictions** with confidence scores
- **4-level urgency classification**: Low, Medium, High, Emergency
- **Auto-escalation** for emergency cases (score ≥ 75)
- **Feature extraction** from vitals and symptom data

## Quick Start

### 1. Install Dependencies

```bash
cd ml-backend
pip install -r requirements.txt
```

Or use a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Train the Model

```bash
python train_model.py
```

This will:
- Generate 5000 training samples based on Indian healthcare patterns
- Train a Random Forest model
- Save model to `models/triage_model.pkl`
- Save scaler to `models/scaler.pkl`
- Display performance metrics

### 3. Start the API Server

```bash
python app.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "timestamp": "2024-01-15T10:30:00"
}
```

### Predict Triage
```
POST /predict
```

Request body:
```json
{
  "vitals": {
    "bp": "150/95",
    "temp": "102",
    "spo2": "93",
    "pulse": "105"
  },
  "answers": [
    "chest pain",
    "3 days",
    "severe pain, level 8"
  ],
  "severity": 8,
  "duration_days": 3
}
```

Response:
```json
{
  "urgency_level": 2,
  "risk_level": "high",
  "risk_label": "High Risk",
  "score": 68,
  "confidence": 87.5,
  "auto_escalate": false,
  "flags": ["Chest pain reported", "Severe pain reported"],
  "probabilities": {
    "low": 2.1,
    "medium": 15.4,
    "high": 78.3,
    "emergency": 4.2
  },
  "timestamp": "2024-01-15T10:30:15"
}
```

### Batch Predict
```
POST /batch-predict
```

Request body:
```json
{
  "cases": [
    {
      "patient_id": "P001",
      "vitals": {"bp": "120/80", "temp": "98.6", "spo2": "98", "pulse": "75"},
      "answers": ["mild fever"],
      "severity": 3
    }
  ]
}
```

## Model Details

### Training Data
- 5000 synthetic samples based on common Indian healthcare scenarios
- Scenarios include:
  - Normal/minor ailments
  - Fever/infections (malaria, dengue, typhoid)
  - Respiratory conditions (TB, pneumonia, COVID)
  - Cardiac emergencies
  - Maternal complications
  - Trauma (accidents, snake bites)
  - Chronic disease emergencies

### Features (12 total)
1. **Vitals**: BP systolic, BP diastolic, Temperature, SpO2, Pulse
2. **Symptom info**: Severity (1-10), Duration (days)
3. **Binary flags**: Chest pain, Breathing difficulty, Headache, Bleeding, Seizure

### Model Architecture
- **Algorithm**: Random Forest Classifier
- **Trees**: 200
- **Max depth**: 15
- **Class balancing**: Enabled
- **Cross-validation**: 5-fold

### Performance Metrics
Typical performance on test set:
- **Accuracy**: ~95%
- **Low risk**: Precision 0.97, Recall 0.98
- **Medium risk**: Precision 0.94, Recall 0.92
- **High risk**: Precision 0.93, Recall 0.95
- **Emergency**: Precision 0.98, Recall 0.96

## Integration with Frontend

The frontend automatically connects to this API when `VITE_ML_API_URL` is configured:

1. Copy `.env.example` to `.env` in the healthcare-platform folder
2. Ensure `VITE_ML_API_URL=http://localhost:5000`
3. The triage pages will use ML predictions when available
4. Falls back to rule-based scoring if API is unavailable

## Development

### Retrain the Model
To retrain with updated data or parameters:
```bash
python train_model.py
```

### Test API Manually
```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "vitals": {"bp": "180/120", "temp": "103", "spo2": "88", "pulse": "120"},
    "severity": 9,
    "duration_days": 1,
    "answers": ["chest pain", "cannot breathe"]
  }'
```

## Production Deployment

For production:
1. Use a production WSGI server (e.g., Gunicorn):
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```
2. Set up proper CORS policies
3. Add authentication/rate limiting
4. Monitor model performance and retrain periodically
5. Use environment variables for configuration

## Troubleshooting

**Model not loading?**
- Run `python train_model.py` to create the model files
- Check that `models/` directory exists with `.pkl` files

**Connection refused?**
- Ensure API is running: `python app.py`
- Check firewall settings
- Verify port 5000 is not in use

**Low accuracy?**
- Retrain with more diverse data
- Adjust model hyperparameters in `train_model.py`
- Check feature engineering logic

## License

Part of Swasthya Connect healthcare platform.
