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

### No banner appears when opening emails
- **Refresh Gmail** (F5 or Ctrl+R) after loading the extension.
- Use **Standard view** in Gmail, not Basic HTML (Settings → See all settings → scroll to "Default view").
- Click the extension icon → ensure "Auto-Scan Emails" is ON and "Backend Connected" shows green.
- Wait 2–3 seconds after opening an email; the banner can take a moment to appear.

### "Analysis Failed" or "Backend Disconnected"
- Start the backend: `cd backend && uvicorn app.main:app --reload --port 8000`
- Confirm it works: open `http://localhost:8000/health` in your browser.
- On Windows, run with UTF-8: `$env:PYTHONIOENCODING='utf-8'; uvicorn ...`

### Extension not loading or shows errors
- Go to `chrome://extensions` → ensure Developer mode is ON.
- Click **Reload** on the extension after any code changes.
- Check for errors: click "Errors" or "Service worker" under the extension.
