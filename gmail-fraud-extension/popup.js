document.addEventListener('DOMContentLoaded', async () => {
    const toggle = document.getElementById('autoScanToggle');
    const backendDot = document.getElementById('backendDot');
    const backendText = document.getElementById('backendText');

    // Load saved settings
    chrome.storage.sync.get(['autoScan'], (result) => {
        toggle.checked = result.autoScan !== false; // Default true
    });

    // Save settings on change
    toggle.addEventListener('change', () => {
        chrome.storage.sync.set({ autoScan: toggle.checked });
        // Notify active tab
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "updateSettings",
                    autoScan: toggle.checked
                }, (response) => {
                    // Suppress errors - content script might not be active on this tab
                    if (chrome.runtime.lastError) {
                        console.log("[Popup] Content script not on this tab");
                    }
                });
            }
        });
    });

    // Check Backend Health with retry logic
    async function checkBackendHealth() {
        const endpoints = [
            'http://127.0.0.1:8000/health',
            'http://localhost:8000/health'
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint, { 
                    timeout: 5000,
                    mode: 'no-cors' // Avoid CORS issues
                });
                
                // For no-cors, we can only check if request succeeded
                if (response.status === 0 || response.ok) {
                    backendDot.classList.add('online');
                    backendDot.classList.remove('offline');
                    backendText.textContent = "Backend Connected";
                    return true;
                }
            } catch (e) {
                console.log(`[Popup] Endpoint ${endpoint} failed:`, e.message);
            }
        }
        
        // All endpoints failed
        backendDot.classList.add('offline');
        backendDot.classList.remove('online');
        backendText.textContent = "Backend Disconnected";
        return false;
    }
    
    // Check backend on popup open
    checkBackendHealth();
    
    // Retry every 3 seconds if offline
    setInterval(() => {
        if (backendDot.classList.contains('offline')) {
            checkBackendHealth();
        }
    }, 3000);
});
