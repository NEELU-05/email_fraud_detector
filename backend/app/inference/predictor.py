import os
from typing import Tuple, Dict, Any
import joblib

# Optional imports for deep learning
try:
    import torch
    import torch.nn.functional as F
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    HAS_TRANSFORMERS = True
except (ImportError, OSError):
    # OSError can occur on Windows (DLL load failures); fall back to sklearn
    HAS_TRANSFORMERS = False

class FraudPredictor:
    """Handles fraud prediction with RoBERTa and fallback to Scikit-Learn."""
    
    def __init__(self, model_path: str = None):
        """
        Initialize the predictor.
        
        Args:
            model_path: Path to saved RoBERTa model directory
        """
        self.use_transformer = True
        self.model = None
        self.tokenizer = None
        self.vectorizer = None # For Scikit-Learn fallback
        
        # Default RoBERTa path
        if model_path is None:
            model_dir = os.path.join(os.path.dirname(__file__), '..', 'models', 'artifacts', 'roberta_fraud_model')
            model_path = model_dir
        
        # Try loading RoBERTa if transformers available
        if HAS_TRANSFORMERS:
            try:
                self.tokenizer = AutoTokenizer.from_pretrained(model_path)
                self.model = AutoModelForSequenceClassification.from_pretrained(model_path)
                self.model.eval()
            except Exception as e:
                self.use_transformer = False
                self.load_fallback_model()
        else:
            self.use_transformer = False
            self.load_fallback_model()

    def load_fallback_model(self):
        """Load Scikit-Learn model artifacts."""
        try:
            artifacts_dir = os.path.join(os.path.dirname(__file__), '..', 'models', 'artifacts')
            model_path = os.path.join(artifacts_dir, 'fraud_model.pkl')
            vectorizer_path = os.path.join(artifacts_dir, 'tfidf_vectorizer.pkl')
            
            if not os.path.exists(model_path) or not os.path.exists(vectorizer_path):
                 raise FileNotFoundError(f"Fallback model files not found at {artifacts_dir}")
                 
            self.model = joblib.load(model_path)
            self.vectorizer = joblib.load(vectorizer_path)
        except Exception as fallback_e:
             raise FileNotFoundError(
                f"Both RoBERTa and Fallback models failed to load.\n"
                f"Please run 'python -m app.models.train_model' to generate model artifacts.\n"
                f"Error: {fallback_e}"
            )
    
    def predict(self, processed_text: str) -> Tuple[float, int]:
        """
        Predict fraud probability for processed email text.
        
        Args:
            processed_text: Email text
            
        Returns:
            Tuple of (fraud_probability, prediction)
        """
        if self.use_transformer:
            return self._predict_transformer(processed_text)
        else:
            return self._predict_sklearn(processed_text)

    def _predict_transformer(self, processed_text: str) -> Tuple[float, int]:
        """Inference using RoBERTa."""
        if not HAS_TRANSFORMERS:
            return self._predict_sklearn(processed_text)
            
        inputs = self.tokenizer(
            processed_text, 
            padding=True, 
            truncation=True, 
            max_length=512, 
            return_tensors="pt"
        )
        
        with torch.no_grad():
            outputs = self.model(**inputs)
            logits = outputs.logits
            probs = F.softmax(logits, dim=-1)
            
        fraud_proba = probs[0][1].item()
        prediction = torch.argmax(probs, dim=-1).item()
        
        return float(fraud_proba), int(prediction)

    def _predict_sklearn(self, processed_text: str) -> Tuple[float, int]:
        """Inference using Scikit-Learn Logistic Regression."""
        # TF-IDF Vectorization
        features = self.vectorizer.transform([processed_text])
        
        # Prediction
        probs = self.model.predict_proba(features)[0]
        fraud_proba = probs[1]
        prediction = int(self.model.predict(features)[0])
        
        return float(fraud_proba), prediction
    
    def predict_with_details(self, processed_text: str) -> Dict[str, Any]:
        """Predict with detailed information."""
        fraud_proba, prediction = self.predict(processed_text)
        
        return {
            'fraud_probability': fraud_proba,
            'safe_probability': 1.0 - fraud_proba,
            'prediction': 'FRAUD' if prediction == 1 else 'SAFE',
            'confidence': max(fraud_proba, 1.0 - fraud_proba),
            'model_type': 'RoBERTa' if self.use_transformer else 'LogisticRegression'
        }


def predict_fraud(processed_text: str) -> Tuple[float, str]:
    """Convenience function for fraud prediction."""
    predictor = FraudPredictor()
    fraud_proba, prediction = predictor.predict(processed_text)
    verdict = 'FRAUD' if prediction == 1 else 'SAFE'
    
    return fraud_proba, verdict

