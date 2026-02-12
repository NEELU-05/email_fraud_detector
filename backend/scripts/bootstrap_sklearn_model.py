"""
Bootstrap script: creates minimal sklearn model artifacts when RoBERTa/PyTorch unavailable.
Run from backend dir: python scripts/bootstrap_sklearn_model.py
"""
import os
import sys

# Add app to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

# Sample training data: common phishing vs safe patterns
SAFE_SAMPLES = [
    "Meeting reminder for tomorrow at 3pm in conference room B.",
    "Your monthly statement is ready. Log in to view your account.",
    "Thanks for your email. I will get back to you by end of day.",
    "The project deadline has been extended to next Friday.",
    "Please find attached the report you requested.",
    "Team lunch this Friday at noon. RSVP if you can make it.",
    "Reminder: Submit timesheets by 5pm today.",
]
FRAUD_SAMPLES = [
    "Urgent! Your account will be suspended. Click here to verify now.",
    "Congratulations! You have won $1000000. Claim your prize immediately.",
    "Verify your identity: http://bit.ly/secure-bank-login",
    "Your password expires in 24 hours. Reset now to avoid lockout.",
    "Claim your free gift card. Limited time offer. Click to redeem.",
    "IRS notice: You have unclaimed refund. Enter your SSN to proceed.",
    "Account compromised. Reply with your password to secure account.",
]

def main():
    artifacts_dir = os.path.join(os.path.dirname(__file__), '..', 'app', 'models', 'artifacts')
    os.makedirs(artifacts_dir, exist_ok=True)

    texts = SAFE_SAMPLES + FRAUD_SAMPLES
    labels = [0] * len(SAFE_SAMPLES) + [1] * len(FRAUD_SAMPLES)

    vectorizer = TfidfVectorizer(max_features=5000, stop_words='english', ngram_range=(1, 2))
    X = vectorizer.fit_transform(texts)

    model = LogisticRegression(max_iter=500, random_state=42)
    model.fit(X, labels)

    model_path = os.path.join(artifacts_dir, 'fraud_model.pkl')
    vectorizer_path = os.path.join(artifacts_dir, 'tfidf_vectorizer.pkl')

    joblib.dump(model, model_path)
    joblib.dump(vectorizer, vectorizer_path)

    print(f"Bootstrap complete. Artifacts saved to {artifacts_dir}")

if __name__ == "__main__":
    main()
