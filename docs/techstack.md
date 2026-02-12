# Technology Stack

## Email Fraud Detection System

---

## 📋 Overview

This document provides a comprehensive breakdown of all technologies, frameworks, libraries, and tools used in the Email Fraud Detection System.

---

## 🐍 Backend

### Core Framework

| Technology   | Version | Purpose                           |
| ------------ | ------- | --------------------------------- |
| **Python**   | 3.9+    | Primary programming language      |
| **FastAPI**  | 0.104.1 | High-performance web framework    |
| **Uvicorn**  | 0.24.0  | ASGI server for FastAPI           |
| **Pydantic** | 2.5.0   | Data validation and serialization |

### Machine Learning

| Technology       | Version | Purpose                                  |
| ---------------- | ------- | ---------------------------------------- |
| **PyTorch**      | 2.0+    | Deep learning framework                  |
| **Transformers** | 4.x     | HuggingFace library for NLP models       |
| **scikit-learn** | 1.3.2   | ML utilities (train/test split, metrics) |
| **NLTK**         | 3.8.1   | Natural language processing toolkit      |

### Data Processing

| Technology   | Version       | Purpose                        |
| ------------ | ------------- | ------------------------------ |
| **Pandas**   | 2.2.0         | Data manipulation and analysis |
| **NumPy**    | (via PyTorch) | Numerical computing            |
| **Datasets** | (HuggingFace) | Dataset loading and processing |

### Utilities

| Technology           | Version       | Purpose               |
| -------------------- | ------------- | --------------------- |
| **Joblib**           | 1.3.2         | Model serialization   |
| **Accelerate**       | (HuggingFace) | Training optimization |
| **python-multipart** | 0.0.6         | Form data parsing     |

---

## 🌐 Frontend

### Core Technologies

| Technology     | Version | Purpose                |
| -------------- | ------- | ---------------------- |
| **HTML5**      | -       | Document structure     |
| **CSS3**       | -       | Styling and animations |
| **JavaScript** | ES6+    | Application logic      |

### CSS Framework

| Technology            | Version   | Purpose                     |
| --------------------- | --------- | --------------------------- |
| **TailwindCSS**       | 3.x (CDN) | Utility-first CSS framework |
| **Custom Properties** | -         | Theme variables             |

### Fonts & Icons

| Resource             | Source       | Purpose              |
| -------------------- | ------------ | -------------------- |
| **Inter**            | Google Fonts | Primary display font |
| **JetBrains Mono**   | Google Fonts | Monospace/code font  |
| **Material Symbols** | Google Fonts | Icon system          |

### Design System

```css
/* Color Palette */
--primary: #ec1313; /* Brand red */
--primary-hover: #c91010; /* Hover state */
--background-dark: #121212; /* Dark mode background */
--surface-dark: #1e1e1e; /* Card backgrounds */
--surface-border: #333333; /* Border color */
--text-muted: #999999; /* Secondary text */
```

---

## 🧩 Chrome Extension

### Manifest & APIs

| Technology             | Version | Purpose                        |
| ---------------------- | ------- | ------------------------------ |
| **Manifest V3**        | 3       | Chrome extension format        |
| **Service Workers**    | -       | Background script architecture |
| **Content Scripts**    | -       | Gmail page injection           |
| **Chrome Storage API** | -       | Local data persistence         |

### Extension Structure

```
gmail-fraud-extension/
├── manifest.json      # Extension configuration
├── background.js      # Service worker
├── content.js         # Gmail DOM manipulation
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic
├── styles.css         # Extension styling
└── icons/             # Extension icons
```

### Permissions

```json
{
  "permissions": ["activeTab", "storage"],
  "host_permissions": ["https://mail.google.com/*"]
}
```

---

## 🤖 ML Model

### Base Model

| Property            | Value                 |
| ------------------- | --------------------- |
| **Model**           | DistilRoBERTa         |
| **Pretrained**      | `distilroberta-base`  |
| **Architecture**    | Transformer (Encoder) |
| **Parameters**      | ~82 million           |
| **Hidden Size**     | 768                   |
| **Attention Heads** | 12                    |
| **Layers**          | 6                     |

### Fine-Tuning Configuration

| Parameter         | Value                   |
| ----------------- | ----------------------- |
| **Task**          | Sequence Classification |
| **Classes**       | 2 (SAFE, FRAUD)         |
| **Max Length**    | 128 tokens              |
| **Learning Rate** | 2e-5                    |
| **Batch Size**    | 8                       |
| **Epochs**        | 1                       |
| **Weight Decay**  | 0.01                    |

### Training Data

| Dataset Type    | Source                    |
| --------------- | ------------------------- |
| Phishing Emails | `archive (1)/` directory  |
| Safe Emails     | `archive (1)/` directory  |
| Format          | CSV (text, label columns) |

---

## 🔧 Development Tools

### Package Management

| Tool     | Purpose                         |
| -------- | ------------------------------- |
| **pip**  | Python package manager          |
| **venv** | Virtual environment             |
| **npm**  | (Optional) For frontend tooling |

### IDE & Editor

| Tool         | Purpose                |
| ------------ | ---------------------- |
| **VS Code**  | Primary IDE            |
| **Pylance**  | Python language server |
| **ESLint**   | JavaScript linting     |
| **Prettier** | Code formatting        |

### Version Control

| Tool       | Purpose            |
| ---------- | ------------------ |
| **Git**    | Version control    |
| **GitHub** | Repository hosting |

---

## 📦 Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND STACK                            │
└─────────────────────────────────────────────────────────────────┘

FastAPI ──────────► Pydantic (validation)
    │
    ├──────────────► Uvicorn (ASGI server)
    │
    └──────────────► Starlette (base framework)

PyTorch ──────────► Transformers (HuggingFace)
    │                    │
    │                    ├──► AutoTokenizer
    │                    └──► AutoModelForSequenceClassification
    │
    └──────────────► Accelerate (training optimization)

scikit-learn ────► train_test_split
                 ├──► classification_report
                 └──► accuracy_score

Pandas ──────────► Data loading & preprocessing
```

---

## 🔗 API Dependencies

### External Services

| Service         | Purpose              | Required       |
| --------------- | -------------------- | -------------- |
| Google Fonts    | Font loading         | Yes (frontend) |
| TailwindCSS CDN | CSS framework        | Yes (frontend) |
| None            | Backend runs locally | -              |

### Internal APIs

| Endpoint   | Method | Purpose          |
| ---------- | ------ | ---------------- |
| `/`        | GET    | API info         |
| `/health`  | GET    | Health check     |
| `/predict` | POST   | Fraud prediction |

---

## 🖥️ System Requirements

### Minimum Requirements

| Component   | Requirement                      |
| ----------- | -------------------------------- |
| **OS**      | Windows 10+, macOS 10.15+, Linux |
| **Python**  | 3.9 or higher                    |
| **RAM**     | 4 GB (8 GB recommended)          |
| **Storage** | 2 GB (for model + dependencies)  |
| **GPU**     | Optional (CUDA for training)     |

### Browser Support

| Browser | Version | Support          |
| ------- | ------- | ---------------- |
| Chrome  | 88+     | ✅ Full          |
| Firefox | 78+     | ✅ Frontend only |
| Edge    | 88+     | ✅ Full          |
| Safari  | 14+     | ⚠️ Frontend only |

---

## 📊 Performance Characteristics

### Model Performance

| Metric             | Value            |
| ------------------ | ---------------- |
| **Inference Time** | ~50-200ms (CPU)  |
| **Model Size**     | ~330 MB          |
| **Memory Usage**   | ~500 MB (loaded) |

### API Performance

| Metric              | Value                          |
| ------------------- | ------------------------------ |
| **Cold Start**      | ~3-5s (model loading)          |
| **Request Latency** | <500ms (P95)                   |
| **Throughput**      | ~10-20 req/s (single instance) |

---

## 🔄 Version History

| Version | Date     | Changes                            |
| ------- | -------- | ---------------------------------- |
| 1.0.0   | Feb 2026 | Initial release with DistilRoBERTa |
| 0.5.0   | Jan 2026 | Deep learning integration          |
| 0.1.0   | Jan 2026 | Basic ML model (TF-IDF + LR)       |

---

## 📚 References

### Documentation Links

| Resource          | URL                                          |
| ----------------- | -------------------------------------------- |
| FastAPI           | https://fastapi.tiangolo.com                 |
| PyTorch           | https://pytorch.org/docs                     |
| HuggingFace       | https://huggingface.co/docs                  |
| TailwindCSS       | https://tailwindcss.com/docs                 |
| Chrome Extensions | https://developer.chrome.com/docs/extensions |

### Model Card

| Property       | Value                      |
| -------------- | -------------------------- |
| **Model Name** | Email Fraud Detector v1.0  |
| **Base Model** | distilroberta-base         |
| **Task**       | Binary Text Classification |
| **Labels**     | SAFE (0), FRAUD (1)        |
| **Language**   | English                    |
| **License**    | MIT                        |

---

_Last Updated: February 2026_
_Version: 1.0.0_
