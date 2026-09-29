# Double Navbar Fix

## Issue
Landing page was showing two navbars - one from the App.tsx Navbar component and one built into the Landing page itself.

## Root Cause
- `App.tsx` renders `<Navbar />` component for all pages
- `Landing.tsx` has its own navbar built-in as part of the government portal design
- The Navbar component was only hiding on facility portal and login pages, but not on landing page

## Fix Applied
Updated `src/components/layout/Navbar.tsx` to also hide on landing page:

```typescript
// Before
if (isFacilityPath || isLogin) {
  return null
}

// After  
if (isLanding || isFacilityPath || isLogin) {
  return null
}
```

## Result
- Landing page now shows only its own built-in navbar (government portal style)
- No duplicate navbar on landing page
- Other pages continue to show the application Navbar as expected

## Pages with Custom/No Navbar
1. **Landing Page** (`/`) - Has its own government portal navbar built-in
2. **Login Page** (`/login`) - Has its own login-specific navbar
3. **Facility Portal Pages** (`/facility/*`) - Have their own facility-specific navbars

## Pages Using App Navbar
- All ASHA portal pages
- All Doctor portal pages
- All Patient portal pages  
- All Admin portal pages
- Shared pages (Full Record, Chronic Care, etc.)
