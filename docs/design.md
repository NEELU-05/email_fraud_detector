# Design Document

## Email Fraud Detection System - Architecture & Design

---

## 1. Overview

This document outlines the architectural design, system components, data flow, and design decisions for the Email Fraud Detection System.

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            PRESENTATION LAYER                           │
├───────────────────────────────┬─────────────────────────────────────────┤
│                               │                                         │
│   ┌─────────────────────┐     │     ┌─────────────────────────────┐     │
│   │   Web Frontend      │     │     │   Gmail Chrome Extension    │     │
│   │                     │     │     │                             │     │
│   │ • HTML/JS/CSS       │     │     │ • Manifest V3               │     │
│   │ • TailwindCSS       │     │     │ • Content Script            │     │
│   │ • Responsive UI     │     │     │ • Popup Interface           │     │
│   └─────────────────────┘     │     └─────────────────────────────┘     │
│                               │                                         │
└───────────────────────────────┴─────────────────────────────────────────┘
                                        │
                                        │ HTTP/REST
                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                  │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                        FastAPI Server                           │   │
│   │                                                                 │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │   │
│   │  │  POST        │  │  GET         │  │  GET                 │   │   │
│   │  │  /predict    │  │  /health     │  │  /                   │   │   │
│   │  └──────────────┘  └──────────────┘  └──────────────────────┘   │   │
│   │                                                                 │   │
│   │  • CORS Middleware                                              │   │
│   │  • Pydantic Validation                                          │   │
│   │  • Error Handling                                               │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           PROCESSING LAYER                              │
│                                                                         │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐     │
│   │  TextCleaner    │  │  URLAnalyzer    │  │  FraudPredictor     │     │
│   │                 │  │                 │  │                     │     │
│   │ • Tokenization  │  │ • URL Extraction│  │ • Model Loading     │     │
│   │ • Normalization │  │ • Risk Scoring  │  │ • Inference         │     │
│   │ • URL Extraction│  │ • Pattern Match │  │ • Probability Calc  │     │
│   └─────────────────┘  └─────────────────┘  └─────────────────────┘     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              MODEL LAYER                                │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    DistilRoBERTa Model                          │   │
│   │                                                                 │   │
│   │  • Pre-trained: distilroberta-base                              │   │
│   │  • Fine-tuned: Binary Classification (SAFE/FRAUD)               │   │
│   │  • Max Length: 128 tokens                                       │   │
│   │  • Output: Softmax probabilities                                │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    Model Artifacts                              │   │
│   │                                                                 │   │
│   │  • config.json          • tokenizer.json                        │   │
│   │  • model.safetensors    • special_tokens_map.json               │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Design

### 3.1 Backend Components

#### 3.1.1 FastAPI Application (`main.py`)

**Responsibilities:**

- HTTP request handling
- Input validation
- Response formatting
- Error handling
- CORS configuration

**Key Design Decisions:**

- **Lazy Loading**: Components initialized on first use to reduce startup time
- **Pydantic Models**: Type-safe request/response validation
- **Middleware**: CORS enabled for cross-origin frontend access

```python
# Component Initialization Pattern
def get_fraud_predictor():
    global fraud_predictor
    if fraud_predictor is None:
        fraud_predictor = FraudPredictor()
    return fraud_predictor
```

#### 3.1.2 Text Cleaner (`preprocessing/text_cleaner.py`)

**Responsibilities:**

- Email text preprocessing
- URL extraction
- Text normalization
- Tokenization preparation

**Input/Output:**

```
Input:  "Dear User, Click here: http://bit.ly/scam123"
Output: ("Dear User Click here", ["http://bit.ly/scam123"])
```

#### 3.1.3 URL Analyzer (`url_detection/url_analyzer.py`)

**Responsibilities:**

- URL risk assessment
- Pattern matching for suspicious indicators
- Aggregate risk scoring

**Risk Factors Evaluated:**

| Factor               | Weight | Description              |
| -------------------- | ------ | ------------------------ |
| URL Shortener        | 0.3    | bit.ly, tinyurl, etc.    |
| Suspicious TLD       | 0.25   | .tk, .xyz, .top, etc.    |
| IP-Based URL         | 0.35   | Direct IP addresses      |
| Excessive Subdomains | 0.2    | More than 3 subdomains   |
| High Entropy         | 0.15   | Random character domains |

#### 3.1.4 Fraud Predictor (`inference/predictor.py`)

**Responsibilities:**

- Model loading and management
- Tokenization for inference
- Probability calculation

**Key Implementation:**

```python
def predict(self, processed_text: str) -> Tuple[float, int]:
    inputs = self.tokenizer(processed_text, ...)

    with torch.no_grad():
        outputs = self.model(**inputs)
        probs = F.softmax(outputs.logits, dim=-1)

    fraud_proba = probs[0][1].item()  # Class 1 = Fraud
    return float(fraud_proba), int(torch.argmax(probs))
```

---

### 3.2 Frontend Components

#### 3.2.1 Web Interface (`frontend/`)

**Architecture:**

- **Single Page Application** (vanilla JS)
- **State Management**: Section visibility toggling
- **API Integration**: Fetch API for backend calls

**UI States:**

1. **Input State**: Email text entry
2. **Loading State**: Analysis in progress
3. **Results State**: Verdict display
4. **Error State**: Failure handling
5. **History State**: Past scans

**Design Patterns:**

- **Progressive Disclosure**: Details shown on demand
- **Visual Hierarchy**: Verdict prominently displayed
- **Responsive Layout**: Mobile-first design

#### 3.2.2 Gmail Extension (`gmail-fraud-extension/`)

**Manifest V3 Architecture:**

```
┌──────────────────────────────────────────────┐
│              Service Worker                  │
│            (background.js)                   │
│                                              │
│  • API communication                         │
│  • Message routing                           │
└──────────────────────────────────────────────┘
              ↑           ↓
    ┌─────────┴───────────┴─────────┐
    │                               │
┌───▼───────────────┐  ┌────────────▼────────────┐
│   Content Script  │  │    Popup Interface     │
│   (content.js)    │  │   (popup.html/js)      │
│                   │  │                        │
│ • Gmail DOM access│  │ • Extension popup      │
│ • Button injection│  │ • Status display       │
│ • Email extraction│  │ • Manual trigger       │
└───────────────────┘  └─────────────────────────┘
```

---

## 4. Data Flow

### 4.1 Prediction Request Flow

```
1. User Input
   │
   ├── Web: Paste email text → Submit form
   │   OR
   └── Extension: Click scan → Extract email from DOM

2. API Request
   │
   └── POST /predict { email_text: "..." }

3. Text Preprocessing
   │
   ├── Clean text
   └── Extract URLs → ["url1", "url2", ...]

4. Parallel Analysis
   │
   ├── ML Text Analysis ──────────┐
   │   └── FraudPredictor.predict()
   │       └── text_score: 0.85    │
   │                               │
   └── URL Risk Analysis ─────────┤
       └── URLAnalyzer.analyze()   │
           └── url_score: 0.70     ▼
                                Combined
5. Score Combination              Score
   │
   └── combined = (text_score × 0.6) + (url_score × 0.4)
       └── combined = (0.85 × 0.6) + (0.70 × 0.4) = 0.79

6. Response
   │
   └── { fraud_probability: 0.79, verdict: "FRAUD", ... }
```

---

## 5. Model Architecture

### 5.1 DistilRoBERTa Configuration

| Parameter           | Value                |
| ------------------- | -------------------- |
| Base Model          | `distilroberta-base` |
| Hidden Size         | 768                  |
| Attention Heads     | 12                   |
| Layers              | 6                    |
| Parameters          | ~82M                 |
| Max Sequence        | 512                  |
| Training Max Length | 128                  |

### 5.2 Training Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    TRAINING PIPELINE                        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  1. DATA LOADING                                            │
│     • Load all CSV files from archive (1)/                  │
│     • Identify text/label columns                           │
│     • Normalize labels (SAFE=0, FRAUD=1)                    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  2. DATA PROCESSING                                         │
│     • Combine subject + body → text_combined                │
│     • Drop null values                                      │
│     • Shuffle dataset                                       │
│     • 80/20 train/test split (stratified)                   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  3. TOKENIZATION                                            │
│     • AutoTokenizer from distilroberta-base                 │
│     • Max length: 128 tokens                                │
│     • Padding + Truncation                                  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  4. TRAINING                                                │
│     • HuggingFace Trainer                                   │
│     • Learning Rate: 2e-5                                   │
│     • Batch Size: 8                                         │
│     • Epochs: 1 (adjustable)                                │
│     • Weight Decay: 0.01                                    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  5. EVALUATION & SAVE                                       │
│     • Classification report                                 │
│     • Save model + tokenizer to artifacts/                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Security Considerations

### 6.1 API Security

| Concern          | Mitigation                                     |
| ---------------- | ---------------------------------------------- |
| Input Validation | Pydantic models with field constraints         |
| Rate Limiting    | To be implemented (recommended: 100 req/min)   |
| CORS             | Configured for allowed origins (currently: \*) |
| Error Exposure   | Generic error messages in production           |

### 6.2 Data Privacy

- **No Storage**: Email content not persisted on server
- **In-Memory Processing**: Data exists only during request lifecycle
- **Client-Side History**: Stored in browser localStorage

---

## 7. Scalability Considerations

### 7.1 Current Limitations

- Single instance deployment
- Synchronous model inference
- In-memory model loading

### 7.2 Future Scalability Options

```
┌─────────────────────────────────────────────────────────────┐
│                  SCALABLE ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────┘

       ┌──────────────────────────────────────────────┐
       │              Load Balancer                   │
       └──────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   ┌─────────┐        ┌─────────┐        ┌─────────┐
   │ API Pod │        │ API Pod │        │ API Pod │
   │    1    │        │    2    │        │    N    │
   └─────────┘        └─────────┘        └─────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ▼
              ┌─────────────────────────┐
              │    Model Service        │
              │    (GPU Inference)      │
              └─────────────────────────┘
```

---

## 8. Error Handling Strategy

### 8.1 Error Categories

| Category   | HTTP Code | Example                 |
| ---------- | --------- | ----------------------- |
| Validation | 422       | Empty email text        |
| Processing | 500       | Model inference failure |
| Service    | 503       | Model not loaded        |

### 8.2 Graceful Degradation

```python
try:
    predictor = get_fraud_predictor()
except FileNotFoundError:
    # Fallback: Return high-risk warning
    return {"verdict": "UNKNOWN", "message": "Model unavailable"}
```

---

## 9. Testing Strategy

### 9.1 Test Levels

| Level       | Scope                | Tools               |
| ----------- | -------------------- | ------------------- |
| Unit        | Individual functions | pytest              |
| Integration | API endpoints        | pytest + TestClient |
| E2E         | Full user flow       | Playwright/Selenium |

### 9.2 Test Cases

**Model Tests:**

- Known fraud emails return high probability
- Known safe emails return low probability
- Edge cases: empty text, very long text

**API Tests:**

- Valid request returns 200
- Invalid request returns 422
- Health check responds correctly

---

## 10. Monitoring & Observability

### 10.1 Recommended Metrics

| Metric           | Type      | Purpose            |
| ---------------- | --------- | ------------------ |
| Request Count    | Counter   | Traffic volume     |
| Response Latency | Histogram | Performance        |
| Error Rate       | Counter   | Reliability        |
| Model Confidence | Gauge     | Prediction quality |

### 10.2 Health Check Design

```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": True,
        "timestamp": datetime.utcnow()
    }
```

---

_Last Updated: February 2026_
_Version: 1.0.0_
