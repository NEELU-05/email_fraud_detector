# Product Requirements Document (PRD)

## Email Fraud Detection System

---

## 1. Executive Summary

The **Email Fraud Detection System** is an AI-powered security tool designed to analyze emails and detect phishing, scam, and fraudulent content in real-time. The system leverages state-of-the-art deep learning (RoBERTa transformer model) combined with rule-based URL analysis to provide comprehensive fraud detection capabilities.

### Key Value Proposition

- **Protect users** from sophisticated email-based attacks
- **Reduce fraud exposure** through proactive detection
- **Multi-layered analysis** combining ML text analysis with URL threat detection
- **Seamless integration** via web interface and Gmail browser extension

---

## 2. Problem Statement

Email fraud costs individuals and businesses billions annually. Traditional spam filters fail to detect:

- **Sophisticated phishing emails** that mimic legitimate communications
- **Context-aware scams** targeting specific users/organizations
- **Subtle manipulation tactics** used by modern fraudsters
- **Malicious URLs** disguised through URL shorteners or obfuscation

### Target Users

1. **Individual users** wanting to verify suspicious emails
2. **Security-conscious professionals** handling sensitive communications
3. **Organizations** seeking to augment existing email security

---

## 3. Goals & Objectives

### Primary Goals

| Goal                     | Success Metric                        |
| ------------------------ | ------------------------------------- |
| Accurate fraud detection | >90% accuracy on test datasets        |
| Real-time analysis       | Response time <2 seconds              |
| Easy accessibility       | Web UI + Browser Extension            |
| Actionable insights      | Clear verdict with detailed breakdown |

### Non-Goals (v1.0)

- Email server integration (IMAP/POP3)
- Automated email blocking/quarantine
- Multi-language support (English only for v1.0)
- Enterprise SSO integration

---

## 4. Features & Requirements

### 4.1 Core Features

#### Feature 1: Email Text Analysis (ML-Based)

- **Description**: Deep learning model (DistilRoBERTa) analyzes email content for fraud indicators
- **Input**: Raw email text (headers + body)
- **Output**: Fraud probability score (0.0-1.0)
- **Weight**: 60% of final score

#### Feature 2: URL Risk Analysis (Rule-Based)

- **Description**: Analyzes all URLs in email for suspicious characteristics
- **Detects**:
  - URL shorteners (bit.ly, tinyurl, etc.)
  - Suspicious TLDs (.tk, .xyz, .top, etc.)
  - IP-based URLs
  - Excessive subdomains
  - High-entropy (random) domain names
- **Output**: URL risk score (0.0-1.0)
- **Weight**: 40% of final score

#### Feature 3: Web Interface

- **Description**: Modern, responsive web application for email analysis
- **Capabilities**:
  - Paste/upload email content
  - View detailed analysis results
  - Scan history tracking
  - Drag-and-drop .eml/.txt file support

#### Feature 4: Gmail Chrome Extension

- **Description**: Browser extension for in-context email scanning
- **Capabilities**:
  - Scan currently open email in Gmail
  - Visual scan indicator (SAFE/FRAUD badge)
  - One-click analysis from Gmail interface

### 4.2 Technical Requirements

| Requirement   | Specification                      |
| ------------- | ---------------------------------- |
| ML Framework  | PyTorch + HuggingFace Transformers |
| API Framework | FastAPI                            |
| Model         | DistilRoBERTa (fine-tuned)         |
| Frontend      | HTML/CSS/JS + TailwindCSS          |
| Extension     | Chrome Manifest V3                 |

---

## 5. User Stories

### US-1: Suspicious Email Verification

> As a **user**, I want to **paste suspicious email content** so that I can **determine if it's fraudulent**.

**Acceptance Criteria**:

- [x] Text area accepts raw email content
- [x] Analysis returns within 2 seconds
- [x] Clear FRAUD/SAFE verdict displayed
- [x] Probability percentage shown

### US-2: URL Threat Detection

> As a **user**, I want to **see analysis of URLs in my email** so that I can **avoid clicking malicious links**.

**Acceptance Criteria**:

- [x] All URLs extracted from email
- [x] Each URL analyzed for risk factors
- [x] Individual URL risk scores displayed

### US-3: Gmail Integration

> As a **Gmail user**, I want to **scan emails directly in Gmail** so that I can **analyze without copy-pasting**.

**Acceptance Criteria**:

- [x] Extension injects scan button in Gmail
- [x] One-click email extraction
- [x] Results shown in popup/badge

---

## 6. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
├─────────────────────┬─────────────────┬─────────────────────┤
│   Web Frontend      │  Gmail Extension │   Future Clients   │
│   (HTML/JS/CSS)     │  (Chrome MV3)   │   (Mobile/API)     │
└─────────────────────┴────────┬────────┴─────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     API LAYER (FastAPI)                     │
│                                                             │
│  POST /predict    GET /health    GET /                      │
└─────────────────────────────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌───────────────┐    ┌─────────────────┐    ┌────────────────┐
│ Text Cleaner  │    │  URL Analyzer   │    │ Fraud Predictor│
│ (Preprocessing)│    │ (Rule-Based)    │    │ (RoBERTa Model)│
└───────────────┘    └─────────────────┘    └────────────────┘
```

---

## 7. Success Metrics

| Metric            | Target   | Measurement           |
| ----------------- | -------- | --------------------- |
| Model Accuracy    | >90%     | Test set evaluation   |
| Precision (Fraud) | >85%     | Classification report |
| Recall (Fraud)    | >80%     | Classification report |
| API Latency       | <2s      | P95 response time     |
| User Satisfaction | >4.0/5.0 | User feedback         |

---

## 8. Timeline & Milestones

### Phase 1: Foundation ✅

- Backend API setup
- ML model training pipeline
- Basic prediction endpoint

### Phase 2: Enhanced ML ✅

- Deep learning integration (RoBERTa)
- Multi-dataset training
- Improved accuracy

### Phase 3: Frontend ✅

- Web interface design
- Results visualization
- History tracking

### Phase 4: Extension ✅

- Gmail Chrome extension
- Content script injection
- Popup interface

### Phase 5: Future

- Additional browser support (Firefox)
- Mobile application
- Enterprise features

---

## 9. Risks & Mitigations

| Risk                    | Impact | Mitigation                           |
| ----------------------- | ------ | ------------------------------------ |
| Model false positives   | High   | Threshold tuning, confidence display |
| New phishing techniques | Medium | Regular model retraining             |
| Extension compatibility | Medium | Follow Chrome API best practices     |
| API downtime            | High   | Health checks, graceful degradation  |

---

## 10. Appendix

### Related Documents

- [README.md](./README.md) - Getting started guide
- [TECHSTACK.md](./techstack.md) - Technical stack details
- [DESIGN.md](./design.md) - Architecture and design decisions
- [IMPROVEMENT.md](./IMPROVEMENT.md) - Future enhancements

---

_Last Updated: February 2026_
_Version: 1.0.0_
