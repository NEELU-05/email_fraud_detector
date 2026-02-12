# Quick Start Guide

## 🚀 Running the Email Fraud Detector

Follow these simple steps to run the project:

---

## Option 1: Quick Start (Recommended)

### Step 1: Open Frontend

Simply double-click this file:

```
frontend/index.html
```

This will open the web interface in your default browser!

### Step 2: Start Backend API (Optional for full functionality)

Open a terminal in the `backend/` directory and run:

```powershell
# Activate virtual environment
.\venv\Scripts\activate

# Start the API server
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at: `http://localhost:8000`

---

## Option 2: Manual Setup

### 1. Check Python Installation

```powershell
python --version
# Should show Python 3.9 or higher
```

### 2. Navigate to Backend

```powershell
cd backend
```

### 3. Activate Virtual Environment

```powershell
# Windows PowerShell
.\venv\Scripts\activate

# Windows CMD
venv\Scripts\activate.bat
```

### 4. Install Dependencies (if needed)

```powershell
pip install -r requirements.txt
```

### 5. Train Model (First Time Only)

```powershell
python -m app.models.train_model
```

This will:

- Load datasets from `archive (1)/` or `data/`
- Train the RoBERTa model
- Save to `app/models/artifacts/roberta_fraud_model/`
- Takes ~10-30 minutes depending on your hardware

### 6. Start API Server

```powershell
python -m uvicorn app.main:app --reload
```

You should see:

```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### 7. Open Frontend

Open `frontend/index.html` in your browser or navigate to:

```
file:///C:/Users/neelo/OneDrive/Desktop/CODES/PY/email_fraud_detector/frontend/index.html
```

---

## 🎯 Quick Test

### Without Backend (Frontend Only)

1. Open `frontend/index.html`
2. You'll see the beautiful UI
3. Backend features won't work until API is running

### With Backend (Full Functionality)

1. Start backend API (see above)
2. Open `frontend/index.html`
3. Paste an email in the text area
4. Click "Analyze Email"
5. See the fraud detection results!

---

## 🧪 Test Email Examples

### Safe Email Example:

```
From: support@company.com
Subject: Your Monthly Report

Dear User,

Your monthly report is ready. You can view it in your dashboard.

Best regards,
Company Team
```

### Fraud Email Example:

```
From: security@paypa1.com
Subject: URGENT: Account Suspended

Dear User,

Your account has been suspended due to suspicious activity.
Click here immediately to verify: http://bit.ly/verify-now

Failure to act within 24 hours will result in permanent closure.

PayPal Security Team
```

---

## 🔧 Troubleshooting

### Issue: "Model not found"

**Solution:** Train the model first:

```powershell
cd backend
.\venv\Scripts\activate
python -m app.models.train_model
```

### Issue: "Module not found"

**Solution:** Install dependencies:

```powershell
pip install -r requirements.txt
```

### Issue: "Port 8000 already in use"

**Solution:** Use a different port:

```powershell
python -m uvicorn app.main:app --reload --port 8001
```

Then update the API URL in `frontend/app.js` line ~3:

```javascript
const API_URL = "http://localhost:8001";
```

### Issue: Virtual environment not activating

**Solution:** Create a new one:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

---

## 📱 Chrome Extension Setup

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `gmail-fraud-extension/` folder
5. Open Gmail and look for the scan button!

---

## 🎨 Features to Try

1. **Email Analysis** - Paste any email and get fraud score
2. **URL Detection** - Automatically detects and analyzes URLs
3. **History** - View past scans (stored in browser)
4. **Dark Mode** - Beautiful dark theme enabled by default
5. **Drag & Drop** - Drop .eml or .txt files

---

## 📊 API Endpoints

Once the backend is running, you can test the API:

### Health Check

```
GET http://localhost:8000/health
```

### Analyze Email

```
POST http://localhost:8000/predict
Content-Type: application/json

{
  "email_text": "Your email content here..."
}
```

### API Documentation

```
http://localhost:8000/docs
```

---

## 🎯 Next Steps

1. ✅ Open `frontend/index.html` to see the UI
2. ✅ Start the backend API for full functionality
3. ✅ Try analyzing some test emails
4. ✅ Install the Chrome extension
5. ✅ Check out the documentation in `docs/`

---

**Need Help?** Check the documentation:

- `README.md` - Main documentation
- `docs/PRD.md` - Product requirements
- `docs/design.md` - Architecture details
- `docs/techstack.md` - Technology stack

---

_Happy Fraud Detecting! 🛡️_
