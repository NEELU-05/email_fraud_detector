# 🛡️ Email Fraud Detector

> AI-powered email fraud detection using deep learning and URL analysis.

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green.svg)](https://fastapi.tiangolo.com)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-red.svg)](https://pytorch.org)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 Overview

Email Fraud Detector is a comprehensive security tool that analyzes emails for phishing, scam, and fraudulent content. It combines:

- **🤖 Deep Learning**: Fine-tuned DistilRoBERTa model for text analysis
- **🔗 URL Analysis**: Rule-based detection of malicious URLs
- **🌐 Web Interface**: Modern, responsive frontend
- **📧 Gmail Extension**: Direct email scanning in Gmail

---

## 🚀 Quick Start

### Prerequisites

- Python 3.9 or higher
- Git
- Chrome Browser (for extension)

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd email_fraud_detector

# 2. Create virtual environment
cd backend
python -m venv venv

# 3. Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt
```

### Train the Model

```bash
# From backend directory (with venv activated)
python -m app.models.train_model
```

This will:

- Load datasets from `archive (1)/` directory
- Fine-tune DistilRoBERTa model
- Save model to `app/models/artifacts/roberta_fraud_model/`

### Start the API Server

```bash
# From backend directory
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: `http://localhost:8000`

### Launch the Frontend

Simply open `frontend/index.html` in your browser, or serve it:

```bash
# From frontend directory
python -m http.server 5500
```

Access at: `http://localhost:5500`

---

## 📁 Project Structure

```
email_fraud_detector/
├── backend/                     # Backend API server
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── preprocessing/       # Text cleaning utilities
│   │   ├── url_detection/       # URL analysis module
│   │   ├── inference/           # Model prediction
│   │   └── models/
│   │       ├── train_model.py   # Training script
│   │       └── artifacts/       # Saved models
│   ├── requirements.txt
│   └── venv/
│
├── frontend/                    # Web interface
│   ├── index.html               # Main web interface
│   ├── app.js                   # Application logic
│   ├── style.css                # Styling
│   └── script.js                # Utilities
│
├── gmail-fraud-extension/       # Chrome extension
│   ├── manifest.json            # Chrome extension manifest
│   ├── background.js            # Service worker
│   ├── content.js               # Gmail injector script
│   ├── popup.html               # Extension popup
│   ├── popup.js                 # Popup logic
│   └── icons/                   # Extension icons
│
├── docs/                        # Documentation
│   ├── PRD.md                   # Product requirements
│   ├── design.md                # Architecture design
│   ├── techstack.md             # Technology stack
│   └── IMPROVEMENT.md           # Future enhancements
│
├── data/                        # Training datasets
│   └── README.md                # Dataset documentation
│
├── .gitignore                   # Git ignore rules
├── LICENSE                      # MIT License
└── README.md                    # This file
```

---

## 🔌 API Reference

### Endpoints

| Method | Endpoint   | Description             |
| ------ | ---------- | ----------------------- |
| `GET`  | `/`        | API information         |
| `GET`  | `/health`  | Health check            |
| `POST` | `/predict` | Analyze email for fraud |

### POST /predict

**Request:**

```json
{
  "email_text": "Dear Customer, Your account has been compromised..."
}
```

**Response:**

```json
{
  "fraud_probability": 0.8742,
  "verdict": "FRAUD",
  "text_score": 0.9125,
  "url_score": 0.7500,
  "details": {
    "urls_found": 2,
    "url_analyses": [...],
    "text_length": 342,
    "scoring_weights": {
      "text_weight": 0.6,
      "url_weight": 0.4
    }
  }
}
```

---

## 🧩 Gmail Extension Setup

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `gmail-fraud-extension/` directory
5. Open Gmail and look for the scan button

---

## 🎯 How It Works

### Scoring System

```
Final Score = (Text Score × 0.6) + (URL Score × 0.4)
```

- **Text Score**: ML-based analysis of email content
- **URL Score**: Rule-based detection of suspicious URLs

### Verdict Thresholds

| Score Range | Verdict  |
| ----------- | -------- |
| 0.0 - 0.49  | ✅ SAFE  |
| 0.50 - 1.0  | ⚠️ FRAUD |

---

## 📊 Model Performance

| Metric            | Value |
| ----------------- | ----- |
| Accuracy          | ~92%  |
| Precision (Fraud) | ~89%  |
| Recall (Fraud)    | ~85%  |
| F1-Score          | ~87%  |

_Results based on aggregated phishing datasets_

---

## 🛠️ Development

### Running Tests

```bash
# From backend directory
pytest tests/
```

### API Documentation

FastAPI provides automatic interactive documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

---

## 📚 Documentation

- [docs/PRD.md](./docs/PRD.md) - Product Requirements
- [docs/design.md](./docs/design.md) - Architecture Design
- [docs/techstack.md](./docs/techstack.md) - Technology Stack
- [docs/IMPROVEMENT.md](./docs/IMPROVEMENT.md) - Future Improvements

---

_Built with ❤️ for a safer email experience_
