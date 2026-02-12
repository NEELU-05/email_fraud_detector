// Background Service Worker
// Handles API requests to bypass Mixed Content restrictions

chrome.runtime.onInstalled.addListener(() => {
    console.log('Email Fraud Detector installed');
    chrome.storage.sync.set({ autoScan: true });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "analyzeEmail") {
        console.log("[Background] Analyzing email...");

        // Wrap in try-catch to prevent worker crash
        try {
            fetch("http://localhost:8000/predict", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email_text: request.text }),
                timeout: 10000  // 10 second timeout
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error("API Error: " + response.status);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("[Background] Success:", data);
                    // Send response immediately
                    sendResponse({ 
                        success: true, 
                        data: data 
                    });
                })
                .catch(error => {
                    console.error("[Background] Failed:", error.message);
                    // Send error response immediately
                    sendResponse({ 
                        success: false, 
                        error: error.message || "Unknown error"
                    });
                });
        } catch (err) {
            console.error("[Background] Exception:", err);
            sendResponse({ 
                success: false, 
                error: err.message || "Worker exception"
            });
        }

        // Return true to keep port open for async response
        return true;
    }
});
