# Email Fraud Detection - Backend

FastAPI-based backend for email fraud detection using ML and rule-based analysis.

## 🏗️ Architecture

### Components

1. **Preprocessing Module** (`app/preprocessing/`)
   - Text cleaning and normalization
   - URL extraction
   - Tokenization and lemmatization
   - Stopword removal

2. **URL Detection Module** (`app/url_detection/`)
   - Rule-based fraud detection
   - URL shortener detection
   - Entropy analysis
   - Subdomain analysis
   - Suspicious TLD detection

3. **Inference Module** (`app/inference/`)
   - ML model loading
   - TF-IDF vectorization
   - Fraud probability prediction

4. **Models Module** (`app/models/`)
   - Model training script
   - Sample dataset
   - Model artifacts storage

## 🚀 Setup

### Prerequisites

- Python 3.10 or higher
- pip package manager

### Installation

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Download NLTK data:**
```bash
python -c "import nltk; nltk.download('stopwords'); nltk.download('wordnet'); nltk.download('punkt')"
```

3. **Train the model:**
```bash
python -m app.models.train_model
```

This will create model artifacts in `app/models/artifacts/`:
- `fraud_model.pkl` - Trained Logistic Regression model
- `tfidf_vectorizer.pkl` - Fitted TF-IDF vectorizer

4. **Start the server:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## 📡 API Endpoints

### GET /
API information and available endpoints.

### GET /health
Health check endpoint to verify service status.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "message": "API is operational"
}
```

### POST /predict
Analyze email for fraud indicators.

**Request:**
```json
{
  "email_text": "Your email content here..."
}
```

**Response:**
```json
{
  "fraud_probability": 0.87,
  "verdict": "FRAUD",
  "text_score": 0.82,
  "url_score": 0.95,
  "details": {
    "urls_found": 2,
    "url_analyses": [
      {
        "url": "http://bit.ly/win-now",
        "risk_score": 0.95,
        "is_shortener": true,
        "suspicious_tld": false,
        "excessive_subdomains": false,
        "ip_based": false,
        "high_entropy": false
      }
    ],
    "text_length": 150,
    "processed_text_length": 85,
    "scoring_weights": {
      "text_weight": 0.6,
      "url_weight": 0.4
    }
  }
}
```

## 🔍 Detection Logic

### Text Analysis (60% weight)
- **Algorithm:** TF-IDF + Logistic Regression
- **Features:** Unigrams and bigrams
- **Training:** Sample dataset of fraud/safe emails
- **Output:** Fraud probability (0.0 to 1.0)

### URL Analysis (40% weight)
Rule-based detection checking for:
- **URL Shorteners:** bit.ly, tinyurl, etc. (+0.3 risk)
- **Suspicious TLDs:** .xyz, .top, .pw, etc. (+0.25 risk)
- **Excessive Subdomains:** 3+ subdomains (+0.2 risk)
- **IP-based URLs:** Using IP instead of domain (+0.15 risk)
- **High Entropy:** Random-looking domains (+0.1 risk)

### Combined Score
```
final_score = (text_score × 0.6) + (url_score × 0.4)
verdict = "FRAUD" if final_score >= 0.5 else "SAFE"
```

## 🧪 Testing

### Test with curl:
```bash
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{"email_text": "Congratulations! You have won $1,000,000! Click here: http://bit.ly/win-now"}'
```

### Expected response:
```json
{
  "fraud_probability": 0.85,
  "verdict": "FRAUD",
  "text_score": 0.78,
  "url_score": 0.95,
  ...
}
```

## 📊 Model Performance

The sample model achieves:
- **Accuracy:** ~95% on test set
- **Precision:** High for fraud detection
- **Recall:** Balanced for both classes

**Note:** This uses a small sample dataset. For production, train on a larger, real-world dataset.

## 🔧 Configuration

### Modify scoring weights:
Edit `app/main.py`:
```python
text_weight = 0.6  # Adjust text analysis weight
url_weight = 0.4   # Adjust URL analysis weight
```

### Adjust fraud threshold:
```python
verdict = "FRAUD" if combined_score >= 0.5 else "SAFE"  # Change 0.5 threshold
```

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI application
│   ├── preprocessing/
│   │   ├── __init__.py
│   │   └── text_cleaner.py        # Text preprocessing
│   ├── url_detection/
│   │   ├── __init__.py
│   │   └── url_analyzer.py        # URL fraud detection
│   ├── inference/
│   │   ├── __init__.py
│   │   └── predictor.py           # ML prediction
│   └── models/
│       ├── __init__.py
│       ├── train_model.py         # Model training
│       └── artifacts/             # Saved models (generated)
│           ├── fraud_model.pkl
│           └── tfidf_vectorizer.pkl
├── requirements.txt
└── README.md
```

## 🚀 Production Deployment

### Using Docker:
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

RUN python -c "import nltk; nltk.download('stopwords'); nltk.download('wordnet'); nltk.download('punkt')"
RUN python -m app.models.train_model

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables:
```bash
export API_HOST=0.0.0.0
export API_PORT=8000
export MODEL_PATH=/app/models/artifacts/fraud_model.pkl
```

## 📝 License

MIT License
