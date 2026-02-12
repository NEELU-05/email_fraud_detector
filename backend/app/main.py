"""
FastAPI application for Email Fraud Detection.
Provides REST API endpoint for fraud prediction.
"""

import sys
import io
# Fix Windows console encoding - prevents "charmap" errors with unicode
if sys.platform == 'win32':
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    except Exception:
        pass

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import uvicorn

from app.preprocessing.text_cleaner import TextCleaner
from app.url_detection.url_analyzer import URLAnalyzer
from app.inference.predictor import FraudPredictor


# Initialize FastAPI app
app = FastAPI(
    title="Email Fraud Detection API",
    description="ML-based email fraud detection with text and URL analysis",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components (lazy loading for better performance)
text_cleaner = None
url_analyzer = None
fraud_predictor = None


def get_text_cleaner():
    """Lazy load text cleaner."""
    global text_cleaner
    if text_cleaner is None:
        text_cleaner = TextCleaner()
    return text_cleaner


def get_url_analyzer():
    """Lazy load URL analyzer."""
    global url_analyzer
    if url_analyzer is None:
        url_analyzer = URLAnalyzer()
    return url_analyzer


def get_fraud_predictor():
    """Lazy load fraud predictor."""
    global fraud_predictor
    if fraud_predictor is None:
        fraud_predictor = FraudPredictor()
    return fraud_predictor


# Request/Response models
class EmailRequest(BaseModel):
    """Request model for email fraud detection."""
    email_text: str = Field(
        ...,
        description="Email content to analyze",
        min_length=1,
        example="Congratulations! You have won $1,000,000! Click here: http://bit.ly/win-now"
    )


class URLAnalysis(BaseModel):
    """URL analysis details."""
    url: str
    risk_score: float
    is_shortener: bool
    suspicious_tld: bool
    excessive_subdomains: bool
    ip_based: bool
    high_entropy: bool


class FraudResponse(BaseModel):
    """Response model for fraud detection."""
    fraud_probability: float = Field(
        ...,
        description="Overall fraud probability (0.0 to 1.0)",
        ge=0.0,
        le=1.0
    )
    verdict: str = Field(
        ...,
        description="Final verdict: FRAUD or SAFE"
    )
    text_score: float = Field(
        ...,
        description="ML-based text fraud score (0.0 to 1.0)",
        ge=0.0,
        le=1.0
    )
    url_score: float = Field(
        ...,
        description="Rule-based URL fraud score (0.0 to 1.0)",
        ge=0.0,
        le=1.0
    )
    details: Dict = Field(
        ...,
        description="Additional analysis details"
    )


@app.get("/")
async def root():
    """Root endpoint - API information."""
    return {
        "message": "Email Fraud Detection API",
        "version": "1.0.0",
        "endpoints": {
            "POST /predict": "Analyze email for fraud",
            "GET /health": "Health check"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        # Check if model is loaded
        predictor = get_fraud_predictor()
        return {
            "status": "healthy",
            "model_loaded": True,
            "message": "API is operational"
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Service unhealthy: {str(e)}"
        )


@app.post("/predict", response_model=FraudResponse)
async def predict_fraud(request: EmailRequest):
    """
    Analyze email for fraud indicators.
    
    Combines ML-based text analysis with rule-based URL detection.
    
    Args:
        request: EmailRequest containing email text
        
    Returns:
        FraudResponse with fraud probability, verdict, and detailed scores
    """
    try:
        email_text = request.email_text or " "
        email_text = str(email_text).strip().strip('\ufeff')  # Strip BOM

        # Step 1: Preprocess text and extract URLs
        cleaner = get_text_cleaner()
        processed_text, urls = cleaner.preprocess(email_text)
        
        # Step 2: ML-based text analysis
        predictor = get_fraud_predictor()
        text_fraud_proba, text_prediction = predictor.predict(processed_text)
        
        # Step 3: Rule-based URL analysis
        url_risk_score = 0.0
        url_analyses = []
        
        if urls:
            analyzer = get_url_analyzer()
            url_risk_score, url_analyses = analyzer.analyze_urls(urls)
        
        # Step 4: Combine scores (weighted average)
        # Text analysis: 60% weight, URL analysis: 40% weight
        text_weight = 0.6
        url_weight = 0.4
        
        combined_score = (text_fraud_proba * text_weight) + (url_risk_score * url_weight)
        
        # Determine final verdict (threshold: 0.5)
        verdict = "FRAUD" if combined_score >= 0.5 else "SAFE"
        
        # Prepare response
        response = FraudResponse(
            fraud_probability=round(combined_score, 4),
            verdict=verdict,
            text_score=round(text_fraud_proba, 4),
            url_score=round(url_risk_score, 4),
            details={
                "urls_found": len(urls),
                "url_analyses": url_analyses,
                "text_length": len(email_text),
                "processed_text_length": len(processed_text),
                "scoring_weights": {
                    "text_weight": text_weight,
                    "url_weight": url_weight
                }
            }
        )
        
        return response
        
    except Exception as e:
        err_msg = str(e)
        try:
            err_msg = err_msg.encode('ascii', 'replace').decode('ascii')
        except Exception:
            err_msg = "Prediction failed (encoding error)"
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {err_msg}"
        )


# Run server (for development)
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
