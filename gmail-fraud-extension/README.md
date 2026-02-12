# 📧 Email Fraud Detector - Chrome Extension

This Chrome Extension integrates with your local Email Fraud Detection API to provide real-time phishing analysis directly inside Gmail.

## 🚀 Features
- **Auto-Scan**: Automatically detects when you open an email in Gmail.
- **Real-Time Analysis**: Sends email content to your local backend for AI verification.
- **Visual Verdict**: Displays a clear "Safe" or "Fraud" banner at the top of the email.
- **Privacy First**: No data is stored; content is only analyzed in memory.

## 📦 Installation

1. **Verify Backend is Running**:
   Ensure your backend API is active at `http://localhost:8000`.
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. **Load Unpacked Extension**:
   - Open Chrome and go to `chrome://extensions`.
   - Enable **Developer mode** (top right toggle).
   - Click **Load unpacked**.
   - Select the `gmail-fraud-extension` folder.

3. **Test it**:
   - Open Gmail (`mail.google.com`).
   - Click on any email.
   - You should see a banner appear at the top of the email content!

## 🛠 Troubleshooting
- **No Banner?** Refresh the Gmail page. Ensure the extension is enabled.
- **Error in Banner?** Check if your backend server is running.
- **Logs:** Right-click the extension icon -> Inspect Popup, or checks Chrome's extension error logs.
