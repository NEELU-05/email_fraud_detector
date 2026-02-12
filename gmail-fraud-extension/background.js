// Background Service Worker
// Handles API requests to bypass Mixed Content restrictions

chrome.runtime.onInstalled.addListener(() => {
    console.log('Email Fraud Detector installed');
    chrome.storage.sync.set({ autoScan: true });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "analyzeEmail") {

        console.log("[Background] Analyzing email...");

        fetch("http://localhost:8000/predict", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email_text: request.text })
        })
            .then(response => {
                if (!response.ok) throw new Error("API Error: " + response.status);
                return response.json();
            })
            .then(data => {
                console.log("[Background] Success:", data);
                sendResponse({ success: true, data: data });
            })
            .catch(error => {
                console.error("[Background] Failed:", error);
                sendResponse({ success: false, error: error.message });
            });

        return true; // Indicates async response
    }
});
