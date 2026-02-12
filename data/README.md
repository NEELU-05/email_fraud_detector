# Data Directory

This directory contains training datasets for the Email Fraud Detection model.

## Dataset Structure

Place your phishing/fraud email datasets here in CSV format with the following structure:

```csv
text,label
"Email content here...",1
"Safe email content...",0
```

## Label Convention

- `0` = SAFE (legitimate email)
- `1` = FRAUD (phishing/scam email)

## Supported Column Names

The training script automatically detects the following column names:

**Text Columns:**

- `text`
- `body`
- `subject` + `body` (combined)
- `text_combined`

**Label Columns:**

- `label`
- `class`

## Dataset Sources

You can use publicly available phishing datasets:

1. **Enron Email Dataset** - Legitimate emails
2. **PhishTank** - Phishing URLs and emails
3. **Kaggle Phishing Datasets** - Various phishing email collections
4. **APWG eCrime** - Anti-Phishing Working Group datasets

## Usage

1. Download datasets and place them in this directory
2. Run the training script: `python -m app.models.train_model`
3. The script will automatically load and combine all CSV files

## Notes

- Large dataset files (`.csv`, `.zip`) are ignored by git
- Keep datasets organized in subdirectories if needed
- Ensure proper encoding (UTF-8 or Latin-1)
