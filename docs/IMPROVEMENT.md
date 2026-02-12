# Improvement Roadmap

## Email Fraud Detection System - Future Enhancements

---

## 📋 Overview

This document outlines planned improvements, feature enhancements, and optimization opportunities for the Email Fraud Detection System.

---

## 🎯 Priority Matrix

| Priority    | Impact | Effort     | Category             |
| ----------- | ------ | ---------- | -------------------- |
| 🔴 Critical | High   | Any        | Must-have            |
| 🟠 High     | High   | Medium     | Should-have          |
| 🟡 Medium   | Medium | Low-Medium | Nice-to-have         |
| 🟢 Low      | Low    | Low        | Post-PMF only        |

---

## ⚠️ KEY INSIGHT: Wrong Metric Problem

**Current Focus:** 95% accuracy

**The Problem:** For fraud detection, accuracy is **the wrong primary metric**. You can achieve 95% accuracy by predicting "safe" on everything, missing critical phishing emails.

**Fix immediately:**

## 🔴 Critical Improvements

### 1. Model Improvement Strategy (Complete Rewrite)

**Current Performance:** ~92% accuracy (misleading metric)

**CRITICAL METRICS (not accuracy):**

```
Primary:
  - Recall (phishing detection): > 97%    ← Miss phishing = SYSTEM FAILS
  - Precision (phishing): > 94%            ← Avoid false positives frustrating users
  - False Positive Rate: < 2%              ← User trust depends on this
  
Secondary:
  - ROC-AUC: > 0.98
  - PR-AUC: > 0.97
  - Expected Calibration Error: < 0.05
```

**If you miss 1 phishing email out of 100, your system fails 1% of the time. That's unacceptable.**

### Why 92% Accuracy Is Insufficient

Datasets are ~90-95% legitimate emails. Predicting "safe" on everything = 90%+ accuracy but catches 0 phishing.

---

### 2. Data + Architecture Upgrade Plan

Basic tweaks won't move you from 92 → >95 on real metrics. You need:

#### A) Hard Negative Mining
```python
# Collect emails model got wrong - these are gold
# Legitimate emails that look phishing-like
# Include: legitimate invoice links, newsletter promotions, etc.
from sklearn.model_selection import train_test_split

hard_negatives = [
    email for email in validation_set 
    if model.predict(email) == FRAUD but email.label == SAFE
]
# Retrain on augmented set with hard negatives
```

#### B) Domain-Specific Fine-Tuning Datasets
```
- Banking/Finance phishing (credential theft patterns)
- Job scams (offer/employment patterns)
- Crypto/NFT scams (urgency, technical jargon)
- PayPal/Amazon spoofs (invoice context)
```

#### C) Class Imbalance Handling
```python
# Use focal loss or class weight to penalize misclassifying rare phishing
from torch.nn import BCEWithLogitsLoss

# Option 1: Weighted loss
class_weight = {SAFE: 1.0, FRAUD: 5.0}  # Phishing 5x more important

# Option 2: Focal loss (better for imbalanced data)
# Penalizes hard examples more
alpha=0.25, gamma=2.0
```

#### D) Add URL + Domain Embeddings as Features
```python
# Don't just analyze URLs as text - embed them
class FeatureEngineer:
    def extract_url_features(self, email_text):
        urls = self.extract_urls(email_text)
        return {
            "domain_age_days": get_whois_age(urls),
            "levenshtein_similarity": compare_to_known_brands(urls),
            "https_valid": verify_certificate(urls),
            "tld_risk_score": score_tld(urls),  # .xyz = high risk
            "is_shortener": detect_shortener(urls),
            "has_ip_address": detect_ip_urls(urls),
            "entropy": calculate_entropy(urls),
        }
```

#### E) Ensemble Approach (Critical)
```python
class EnsemblePredictor:
    def __init__(self):
        self.text_model = DistilRoBERTa()      # Language understanding
        self.url_model = LightGBM()             # Rule-based features
        self.header_rules = HeaderAnalyzer()    # DMARC/SPF checks
    
    def predict(self, email: Email):
        text_score = self.text_model.predict(email.body)
        url_score = self.url_model.predict(email.extracted_features)
        header_score = self.header_rules.analyze(email.headers)
        
        # Weighted ensemble
        final_score = (
            0.50 * text_score +    # Deep learning
            0.30 * url_score +     # Feature-based
            0.20 * header_score    # Email infrastructure
        )
        return {"fraud_probability": final_score}
```

### 3. Updated Training Configuration

```python
from transformers import TrainingArguments, Trainer

training_args = TrainingArguments(
    output_dir='./results',
    num_train_epochs=3,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    warmup_ratio=0.1,              # Gradual warmup (10% of training)
    weight_decay=0.01,              # L2 regularization
    learning_rate=2e-5,             # Optimal for DistilRoBERTa fine-tuning
    lr_scheduler_type="cosine",     # Cosine annealing (better than linear)
    gradient_accumulation_steps=4,   # Effective batch size = 32
    fp16=True,                       # Mixed precision (faster)
    
    # Evaluation and saving
    evaluation_strategy="steps",
    eval_steps=250,
    save_strategy="steps",
    save_steps=250,
    load_best_model_at_end=True,
    metric_for_best_model="f1",      # Optimize F1, not accuracy
    
    # Monitoring
    logging_steps=50,
    logging_dir='./logs',
)

# Key: Optimize for F1, not accuracy
train_result = trainer.train()
eval_result = trainer.evaluate()

# Log: Precision, Recall, F1, ROC-AUC
print(f"Recall: {eval_result['recall']:.3f}")  # Must be > 0.97
print(f"Precision: {eval_result['precision']:.3f}")  # Must be > 0.94
print(f"ROC-AUC: {eval_result['roc_auc']:.3f}")  # Must be > 0.98
```

### 4. Confidence Calibration (Production-Grade)

**Issue:** Model confidence doesn't correlate with accuracy (says 85% but gets it wrong)

**Metrics to Track:**
- Expected Calibration Error (ECE) - gap between predicted and actual accuracy
- Reliability diagram - shows miscalibration visually
- Brier score - measures probability accuracy

```python
from sklearn.calibration import calibration_curve, CalibratedClassifierCV
import matplotlib.pyplot as plt

class CalibrationMonitor:
    def evaluate_calibration(self, model, val_texts, val_labels):
        preds = model.predict(val_texts)
        
        # Expected Calibration Error
        prob_true, prob_pred = calibration_curve(
            val_labels, preds, n_bins=10, strategy='uniform'
        )
        ece = np.mean(np.abs(prob_true - prob_pred))
        
        # Brier Score (MSE of probabilities)
        brier = np.mean((preds - val_labels) ** 2)
        
        print(f"ECE: {ece:.4f} (target <0.05)")
        print(f"Brier Score: {brier:.4f} (lower is better)")
        
        # Calibration curve visualization
        plt.plot(prob_pred, prob_true, 's-', label='Model')
        plt.plot([0, 1], [0, 1], 'k--', label='Perfect')
        plt.show()

# Apply temperature scaling if needed
def calibrated_predict(logits, temperature=1.3):
    scaled_logits = logits / temperature
    return F.softmax(scaled_logits, dim=-1)
```

**UI Display:**
```
Risk: HIGH (0.91)
Confidence: WELL-CALIBRATED ✓      ← User knows we're confident

vs.

Risk: HIGH (0.91)
Confidence: UNCERTAIN ⚠️            ← User should double-check this one
```

---

### 5. Add URL Intelligence Layer (CRITICAL - YOU MISSED THIS)

**Reality:** Most phishing attacks are URL-driven. Your current system only does basic URL checks.

**Problem with text-only analysis:** Phishing email says "Click here to verify" in perfect English. Text model sees nothing suspicious. User clicks malicious URL. System failed.

**Solution: Dedicated URL Risk Pipeline**

```python
class URLRiskClassifier:
    """Multi-layer URL threat detection"""
    
    def classify_url(self, url: str) -> float:
        """Returns risk score 0.0-1.0"""
        
        features = self.extract_features(url)
        risk_score = self._score_url(features)
        return risk_score
    
    def extract_features(self, url: str) -> Dict:
        domain = self.parse_domain(url)
        
        return {
            # Domain age (new domains = higher risk)
            "domain_age_days": self.get_whois_data(domain)["age_days"],
            
            # Visual similarity to known brands
            # (apple.com vs àpple.com - unicode tricks)
            "levenshtein_distance": self._brand_similarity(domain),
            
            # Certificate validity (self-signed = bad)
            "ssl_certificate_valid": self._verify_ssl(url),
            "ssl_issuer_reputable": self._check_issuer(url),
            
            # TLD risk scoring
            "tld_risk_score": self._tld_risk({  # High risk TLDs
                ".xyz": 0.8, ".top": 0.75, ".pw": 0.7,  # Cheap, no verification
                ".tk": 0.65, ".ml": 0.65,                 # Free TLDs used by scammers
                ".com": 0.1, ".edu": 0.05                 # Trusted TLDs
            })(domain),
            
            # Known shorteners (hide true destination)
            "is_shortener": self._detect_shortener(domain),
            
            # IP-based URLs (numeric IPs often phishing)
            "has_ip_address": bool(re.match(r'https?://\d+\.\d+\.\d+\.\d+', url)),
            
            # URL entropy (random strings = higher risk)
            "entropy_score": self._calculate_entropy(domain),
            
            # Subdomain count (a.b.c.d.evil.com = sketchy)
            "subdomain_count": domain.count("."),
            
            # Presence in threat databases
            "virustotal_verdict": self._check_virustotal(url),  # Cached
            "phishtank_known": self._check_phishtank(url),      # Cached
            "google_safebrowsing": self._check_safebrowsing(url),
        }
    
    def _score_url(self, features: Dict) -> float:
        """LightGBM classifier on extracted features"""
        # Use trained model, not heuristics
        X = self.feature_vectorizer.transform([features])
        return self.url_classifier.predict_proba(X)[0][1]
```

**Integration:**
```python
class EnhancedEmailAnalyzer:
    def analyze(self, email: Email) -> Dict:
        text_risk = self.text_model.predict(email.body)      # 0-1
        url_risk = self.url_analyzer.analyze(email.urls)     # 0-1
        header_risk = self.header_checker.verify(email)      # 0-1
        
        # Weighted ensemble - URL is critical
        final_risk = (
            0.40 * text_risk +      # Language patterns
            0.40 * url_risk +       # URL analysis (EQUAL WEIGHT)
            0.20 * header_risk      # Email infrastructure
        )
        
        return {
            "fraud_probability": final_risk,
            "detailed_scores": {
                "text_risk": text_risk,
                "url_risk": url_risk,
                "header_risk": header_risk
            }
        }
```

---

## 🟠 High Priority Improvements

### 6. Multi-Language Support (Fixed Approach)

**Current:** English only

**Target Languages:**

- [ ] Spanish
- [ ] French
- [ ] German
- [ ] Portuguese
- [ ] Chinese (Simplified)

**Approach:**

- Use multilingual transformer model (XLM-RoBERTa)
- Translate training datasets
- Language detection API integration

### 7. Header Analysis Module (Production-Grade)

**Current:** Only body text analysis

**Enhancement:** Full email infrastructure verification

**Features:**

```python
class HeaderAnalyzer:
    def analyze(self, raw_email: str) -> Dict:
        headers = email.parser.Parser().parsestr(raw_email).items()
        
        return {
            # Email authentication
            "spf_pass": self._check_spf(headers),           # Sender IP authorized?
            "dkim_valid": self._verify_dkim(headers),       # Signature valid?
            "dmarc_policy": self._get_dmarc(headers),       # Domain policy enforced?
            "arc_validation": self._verify_arc(headers),    # Added: ARC chain
            
            # Sender verification
            "return_path_mismatch": self._check_return_path(headers),  # From != Return-Path?
            "display_name_spoof": self._check_display_name(headers),   # Added: "Apple <noreply@phishing.com>"?
            "sender_reputation": self._score_sender(headers["From"]),
            
            # IP and routing analysis
            "origin_ip_reputation": self._check_virustotal_ip(headers),
            "geo_anomaly": self._detect_routing_anomaly(headers),      # Added: VP fraud
            "time_anomaly": self._check_received_timing(headers),      # Added: Timing gaps unusual?
            
            # Risk flags
            "has_reply_to": self._has_reply_to_override(headers),
            "is_bulk_sender": self._detect_bulk_headers(headers),
        }
    
    def _detect_routing_anomaly(self, headers):
        # Check for impossible routing patterns
        # e.g., email from Gmail but Received headers show sketchy path
        received_chain = self._parse_received_headers(headers)
        
        # Flag if chain is suspiciously short or IPs contradict From
        return {"suspicious": len(received_chain) < 2, "chain": received_chain}
    
    def _check_received_timing(self, headers):
        # Detect timing gaps in email chain
        # Large gaps might indicate header manipulation
        times = [parse_timestamp(r) for r in self._parse_received_headers(headers)]
        gaps = [times[i+1] - times[i] for i in range(len(times)-1)]
        
        suspicious_gap = any(gap > timedelta(hours=24) for gap in gaps)
        return {"has_timing_gaps": suspicious_gap, "max_gap": max(gaps)}
```

### 8. Attachment Analysis (Production-Grade Scanning)

**Current:** Not implemented

**Enhancement:** Multi-layer threat scanning

**Architecture:**

```python
class AttachmentAnalyzer:
    def __init__(self):
        self.clamav = ClamAVClient()                # Signature-based scanning
        self.virustotal = VirusTotalClient()         # Hash lookup
        self.sandboxed_env = CuckooClient()          # Behavioral analysis
        self.ocr_engine = PaddleOCR()                # Text extraction from images
    
    def scan_attachment(self, file_path: str, file_name: str) -> Dict:
        risk_score = 0.0
        findings = []
        
        # 1. File type validation
        detected_type = self._detect_type(file_path)
        declared_type = self._get_declared_type(file_name)
        if detected_type != declared_type:
            findings.append(f"Type mismatch: declared .{declared_type} but is .{detected_type}")
            risk_score += 0.15  # Likely obfuscation attempt
        
        # 2. ClamAV signature scanning (local, fast)
        clam_result = self.clamav.scan(file_path)
        if clam_result["infected"]:
            findings.append(f"ClamAV detected: {clam_result['threat']}")
            risk_score += 0.5
        
        # 3. VirusTotal hash lookup (no file upload needed)
        file_hash = self._calculate_hash(file_path)
        vt_result = self.virustotal.lookup_hash(file_hash)
        if vt_result["malicious_votes"] > 5:
            findings.append(f"VirusTotal: {vt_result['malicious_votes']} engines flagged")
            risk_score += 0.4
        
        # 4. Office macro detection
        if file_name.endswith(('.xlsx', '.docx', '.pptx')):
            has_macros = self._detect_office_macros(file_path)
            if has_macros:
                findings.append("Office file contains macros (potential malware)")
                risk_score += 0.3
        
        # 5. PDF link extraction and analysis
        if file_name.endswith('.pdf'):
            links = self._extract_pdf_links(file_path)
            for link in links:
                url_risk = self.url_analyzer.classify_url(link)
                if url_risk > 0.6:
                    findings.append(f"PDF contains suspicious link: {link}")
                    risk_score += 0.2
        
        # 6. Image-based phishing (OCR for text in images)
        if file_name.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
            ocr_text = self.ocr_engine.ocr(file_path)
            if self._contains_phishing_keywords(ocr_text):
                findings.append("Image contains phishing content (detected via OCR)")
                risk_score += 0.3
        
        # 7. Optional: Sandbox detonation for unknown files
        if risk_score < 0.3 and self._is_executable(file_path):
            cuckoo_result = self.sandboxed_env.run_analysis(file_path)  # Slow - use carefully
            if cuckoo_result["behavior_score"] > 0.5:
                findings.append(f"Sandbox detected suspicious behavior")
                risk_score += 0.4
        
        return {
            "file": file_name,
            "risk_score": min(risk_score, 1.0),
            "findings": findings,
            "verdict": "MALWARE" if risk_score > 0.7 else "SUSPICIOUS" if risk_score > 0.4 else "SAFE"
        }
```

**Deployment Notes:**
- ClamAV + VirusTotal API: Can run on any machine
- Cuckoo sandbox: Optional, for advanced threats only
- OCR: Lightweight with Paddle - offline capable

---

## 🟡 Medium Priority Improvements

### 9. Human-in-the-Loop Learning System

**Better name:** Not "real-time learning" - feedback loops are slow and unreliable.

**What it is:** Get human feedback on uncertain predictions

**Features:**

```python
class ActiveLearningSystem:
    def query_user(self, email: Email, model_confidence: float):
        """Only ask for feedback on uncertain predictions"""
        
        if model_confidence < 0.65:  # Uncertain predictions
            return {
                "show_dialog": True,
                "message": "We're unsure about this email. Is it safe or spam?",
                "email_snippet": email.body[:200],
                "buttons": ["Safe", "Fraud", "Skip"]
            }
        return {"show_dialog": False}
    
    def collect_feedback(self, email_id: str, user_verdict: str, model_prediction: str):
        """Store feedback with importance weighting"""
        
        feedback = {
            "email_id": email_id,
            "user_label": user_verdict,
            "model_prediction": model_prediction,
            "timestamp": datetime.now(),
            "user_trust_score": self._get_user_trust(user_id),  # Experienced users weighted higher
            "disagreement": user_verdict != model_prediction,
        }
        
        # Store in database
        db.feedback.insert(feedback)
        
        # If important disagreement, flag for manual review
        if feedback["disagreement"] and feedback["user_trust_score"] > 0.8:
            self._queue_for_review(feedback)
    
    def retrain_on_feedback(self):
        """Periodic retraining (weekly, not real-time)"""
        
        disagreements = db.feedback.find({"disagreement": True})
        
        # Only retrain if sufficient signal
        if len(disagreements) > 1000:  # Threshold
            # Augment training set with feedback
            training_data.extend(disagreements)
            model.fine_tune(training_data)
            
            # A/B test new model before deploying
            self._run_ab_test(old_model, new_model)
```

### 10. Batch Processing API (Production-Grade)

**Current:** Single email per request

**Enhancement:** Bulk analysis with constraints

**Endpoint with hard limits:**

```python
from fastapi import HTTPException
from typing import List

class BatchEmailRequest(BaseModel):
    emails: List[EmailRequest] = Field(..., max_items=100)  # Hard limit

@app.post("/predict/batch")
async def predict_batch(request: BatchEmailRequest):
    """
    Analyze up to 100 emails per request
    
    Constraints:
    - Max payload: 2MB
    - Max request time: 5 seconds
    - Larger batches queued asynchronously
    """
    
    if len(request.emails) > 100:
        raise HTTPException(status_code=400, detail="Max 100 emails per batch")
    
    total_size = sum(len(e.email_text.encode()) for e in request.emails)
    if total_size > 2_000_000:  # 2MB
        raise HTTPException(status_code=413, detail="Payload too large")
    
    # For >50 items, queue asynchronously
    if len(request.emails) > 50:
        task_id = self.queue_batch_async(request.emails)
        return {
            "status": "queued",
            "task_id": task_id,
            "estimate_time_seconds": len(request.emails) * 0.5
        }
    
    # Small batches process synchronously
    results = await asyncio.gather(
        *[self.analyze_email_async(email) for email in request.emails],
        return_exceptions=True
    )
    
    return {"status": "complete", "results": results}

@app.get("/predict/batch/{task_id}")
async def get_batch_result(task_id: str):
    """Poll for async batch results"""
    result = await cache.get(f"batch:{task_id}")
    if result is None:
        raise HTTPException(status_code=404, detail="Task not found or expired")
    return result
```

### 8. Export & Reporting

**Features:**

- [ ] PDF report generation
- [ ] CSV export of scan history
- [ ] Weekly/monthly summary reports
- [ ] Integration with SIEM tools

### 12. Threat Intelligence Integration (With Caching & Dedup)

**Enhancement:** Connect to external threat feeds **efficiently**

**Problem:** Repeated API calls waste time and hit rate limits

**Solution: Intelligent caching**

```python
from functools import lru_cache
from datetime import timedelta
import redis

class ThreatIntelligence:
    def __init__(self):
        self.cache = redis.Redis()
        self.vt_client = VirusTotal(api_key)
        self.phishtank_client = PhishTank()
        self.google_sb = GoogleSafeBrowsing()
    
    @lru_cache(maxsize=10000)  # Local memory cache (1-hour TTL)
    def check_url_reputation(self, url: str) -> Dict:
        """Check URL reputation with smart caching"""
        
        # Check Redis first (shared cache across processes)
        cached = self.cache.get(f"threat:url:{url}")
        if cached:
            return json.loads(cached)
        
        # Fetch from threat intel sources
        results = self._fetch_threat_data(url)
        
        # Cache for 24 hours
        self.cache.setex(
            f"threat:url:{url}",
            timedelta(hours=24).total_seconds(),
            json.dumps(results)
        )
        
        return results
    
    def _fetch_threat_data(self, url: str) -> Dict:
        """Parallel API calls with fallback"""
        
        try:
            results = asyncio.run(asyncio.gather(
                self.vt_client.check(url),
                self.phishtank_client.check(url),
                self.google_sb.check(url),
                return_exceptions=True
            ))
            
            return {
                "virustotal": results[0] if not isinstance(results[0], Exception) else None,
                "phishtank": results[1] if not isinstance(results[1], Exception) else None,
                "google_safebrowsing": results[2] if not isinstance(results[2], Exception) else None,
                "timestamp": datetime.now(),
            }
        except Exception as e:
            print(f"Threat intel error: {e}")
            return {"error": str(e)}
    
    def aggregate_verdict(self, threat_data: Dict) -> float:
        """Combine sources into single risk score"""
        
        scores = []
        if threat_data["virustotal"]:
            vt_score = threat_data["virustotal"]["malicious_votes"] / 70  # Normalize to 0-1
            scores.append(min(vt_score, 1.0))
        
        if threat_data["phishtank"]:
            pt_score = 1.0 if threat_data["phishtank"]["in_database"] else 0.0
            scores.append(pt_score)
        
        if threat_data["google_safebrowsing"]:
            gs_score = 1.0 if threat_data["google_safebrowsing"]["unsafe"] else 0.0
            scores.append(gs_score)
        
        return sum(scores) / len(scores) if scores else 0.0  # Average
```

---

## 🟢 Low Priority / Future Improvements

**⚠️ Only pursue these after achieving >97% recall and <2% FPR**

### 13. Mobile Application

**Timeline:** Post-PMF

**Platform:** React Native or Flutter

**Features:**
- Email forwarding for analysis
- Push notifications for threats
- Offline basic analysis

### 14. Outlook Extension

**Timeline:** Post-PMF

**Target:** Microsoft Outlook (Web + Desktop)

**Features:**
- Same functionality as Gmail extension
- Office 365 integration
- Enterprise deployment support

### 15. Enterprise Features

**Timeline:** Post-PMF

**For Business Users:**
- Admin dashboard
- User management
- Role-based access control
- Audit logging
- SSO integration (SAML/OAuth)
- Custom threat policies

### 16. API Authentication & Rate Limiting

**Production-ready security:**

```python
from slowapi import Limiter, APIRateLimitExceeded
from fastapi import Depends, Security
from fastapi.security import APIKeyHeader

api_key_header = APIKeyHeader(name="X-API-Key")
limiter = Limiter(key_func=get_api_key)

@app.post("/predict")
@limiter.limit("1000/hour")  # Hard limit
async def predict_fraud(
    request: EmailRequest,
    api_key: str = Depends(api_key_header)
):
    # Verify key, check quota, process
    pass
```

---

## 🔧 Technical Debt & Infrastructure

### Code Quality

- [ ] Increase test coverage to 80%+ (pytest)
- [ ] Add type hints to all functions (mypy strict mode)
- [ ] Replace print() with structured logging (Python logging + JSON format)
- [ ] API docs (FastAPI auto-generates swagger)
- [ ] Input sanitization: HTML escape all email content before rendering
- [ ] SQL injection prevention: Use parameterized queries for DB

### Performance & Scaling

- [ ] **Model quantization:** Convert to INT8 for 3-4x faster inference
  ```python
  # PyTorch quantization
  quantized_model = torch.quantization.quantize_dynamic(
      model, {torch.nn.Linear}, dtype=torch.qint8
  )
  ```

- [ ] **Async inference:** Currently blocks on model - use Celery
  ```python
  from celery import Celery
  
  @app.post("/predict")
  async def predict(request: EmailRequest):
      task = analyze_email_task.delay(request.email_text)
      return {"task_id": task.id}
  ```

- [ ] **Database for history:** PostgreSQL (not SQLite for production)
  ```sql
  CREATE TABLE email_scans (
      id SERIAL PRIMARY KEY,
      email_hash VARCHAR(256) UNIQUE,
      fraud_probability FLOAT,
      verdict VARCHAR(20),
      scanned_at TIMESTAMP,
      user_id VARCHAR(100),
      INDEX idx_user_time (user_id, scanned_at)
  );
  ```

- [ ] **Request caching:** Redis for repeated URLs/addresses
- [ ] **Model versioning:** Save model + metadata, rollback capability

### DevOps & Infrastructure

- [ ] **Docker containerization:**
  ```dockerfile
  FROM python:3.10-slim
  COPY requirements.txt .
  RUN pip install --no-cache-dir -r requirements.txt
  COPY . .
  CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
  ```

- [ ] **Docker Compose:** Local full-stack
  ```yaml
  services:
    backend:
      build: ./backend
      ports:
        - "8000:8000"
    redis:
      image: redis:7
    postgres:
      image: postgres:15
  ```

- [ ] **CI/CD (GitHub Actions):**
  - Run tests on PR
  - Lint checks (black, isort, mypy)
  - Build Docker image
  - Auto-deploy to staging

- [ ] **GPU vs CPU scaling:** Auto-scale based on queue depth
- [ ] **Cold start optimization:** Model preloading on startup
- [ ] **Canary deployment:** 5% → 25% → 100% rollout
- [ ] **Monitoring & Alerting (Prometheus + Grafana):**
  ```python
  from prometheus_client import Counter, Histogram
  
  fraud_predictions = Counter('fraud_predictions_total', 'Total predictions')
  prediction_latency = Histogram('prediction_latency_seconds', 'Prediction time')
  ```

### Security

- [ ] **Secret management:** Use environment variables, not hardcoded keys
- [ ] **API authentication:** JWT tokens, API keys
- [ ] **HTTPS only:** In production
- [ ] **CORS hardening:** Whitelist specific origins
- [ ] **Input validation:** Max email size, sanitize special chars
- [ ] **Audit logging:** Log all API calls with user + timestamp
- [ ] **Model versioning + rollback:** Never deploy without rollback capability

---

## 📅 Resequenced Roadmap

### Q1 2026 (Stabilize Core Detection)

✅ Already done:
- Deep learning integration
- Gmail extension
- Modern web UI

🔄 Priority now:
- [ ] **Fix metrics:** Swap accuracy for recall/precision/FPR
- [ ] **Hard negative mining:** Improve model to >97% recall
- [ ] **URL intelligence layer:** Add dedicated URL classifier
- [ ] **Header analysis:** SPF/DKIM/DMARC verification
- [ ] **Confidence calibration:** ECE / Brier score tracking

**Success criteria:** >97% phishing recall, <2% false positive rate

### Q2 2026 (Production Ready)

- [ ] **Attachment analysis:** ClamAV + VirusTotal integration
- [ ] **Docker containerization:** Local dev + cloud deployment
- [ ] **CI/CD pipeline:** GitHub Actions (lint + test + deploy)
- [ ] **API authentication:** JWT + rate limiting
- [ ] **Database:** PostgreSQL for scan history + threat intel caching
- [ ] **Async processing:** Celery for heavy workloads
- [ ] **Monitoring:** Prometheus metrics + Grafana dashboards

**Success criteria:** Can scale to 1M+ scans/day without degradation

### Q3 2026 (Scale & Intelligence)

- [ ] **Multi-language support:** XLM-RoBERTa + non-English datasets
- [ ] **Human-in-the-loop:** Feedback collection + model retraining
- [ ] **Batch API:** Production-grade bulk analysis
- [ ] **Threat intelligence:** VirusTotal + PhishTank + intelligence feeds
- [ ] **Reporting:** Analytics dashboard + CSV/PDF exports
- [ ] **Model quantization:** INT8 for edge deployment

**Success criteria:** Serving enterprise customers, <200ms P95 latency

### Q4 2026 (Expansion)

- [ ] **Outlook extension:** (if enterprise demand exists)
- [ ] **Mobile app:** (if mobile use case validated)
- [ ] **Enterprise features:** Admin dashboard, SSO, audit logs

**Only if:** Q2-Q3 validated product-market fit

---

## 💡 Research Opportunities (Priority-Ordered)

### High Value (Do These)

1. **Explainable AI**: Show users which words/URLs triggered fraud detection
   - LIME, SHAP for model interpretability
   - Critical for user trust

2. **Adversarial Robustness**: Train against evasion attacks
   - Attackers deliberately evade models
   - Requires adversarial examples + fine-tuning

3. **Few-Shot Learning**: Detect novel phishing patterns
   - Only need 5-10 examples to adapt model
   - Faster response to new attack vectors

### Lower Priority (Skip for Now)

❌ Visual similarity: Useful but slower ROI than text + URL
❌ Social graph: Complex, overkill for v1
❌ Voice phishing: Almost no one voice-phishes via email

---

## 📝 Contributing Guidelines

### Proposing Improvements

1. Open issue with `enhancement` label
2. **State the problem clearly** (why is this needed?)
3. **Propose metrics** (how will we know it works?)
4. Link to similar implementations / papers

### Implementing Features

1. Create feature branch: `feat/feature-name`
2. Write tests FIRST (TDD)
3. Maintain >80% test coverage
4. Run linter: `black . && isort . && mypy .`
5. Submit PR with performance benchmarks (latency, accuracy impact)

---

## 📊 Success Metrics (Fixed)

| What            | Metric                         | Target       | Notes                              |
|-----------------|--------------------------------|-----|------------------------------------------------|
| **Detection**   | Phishing Recall                | >97%        | Miss rate must be <3%              |
| **Detection**   | False Positive Rate            | <2%         | Users need trust                   |
| **Detection**   | Precision (Phishing)           | >94%        | Avoid false alarms                 |
| **Detection**   | ROC-AUC on test set            | >0.98       | Overall discrimination             |
| **Calibration** | Expected Calibration Error     | <0.05       | Model confidence matches accuracy  |
| **Performance** | P95 Latency per email          | <200ms      | User experience                    |
| **Performance** | Cost per 1K emails             | <$0.20      | Scalable economics                 |
| **Reliability** | API Error Rate                 | <0.1%       | Production readiness               |
| **Monitoring**  | Model Drift (quarterly)        | <3%         | Degradation detection              |
| **Coverage**    | Code test coverage             | >80%        | Maintainability                    |

---

## 🎯 Final Verdict: Your Current Roadmap

**What's good:**
- Solid foundation (FastAPI + RoBERTa works)
- Correct tech stack
- Extension architecture is sound

**What's wrong:**
- Chasing wrong metrics (accuracy instead of recall/precision)
- Missing URL intelligence (critical for phishing)
- No production constraints (latency, cost, scaling)
- No adversarial robustness thinking
- Roadmap has PMF-stage features in critical path

**To be deployable as SaaS:**

Fix Q1-Q2 items first. Everything else waits.

Mobile app + Outlook can come later. Your system only succeeds if it reliably catches phishing. Everything else is secondary.

---

_Last Updated: February 2026 (Revised)_
_Version: 2.0 (Production-Focused)_
