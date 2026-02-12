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
                    // Start checking for errors to suppress "Receiving end does not exist"
                    if (chrome.runtime.lastError) {
                        // Suppress error - content script might not be active on this tab
                    }
                });
            }
        });
    });

    // Check Backend Health
    try {
        const response = await fetch('http://localhost:8000/health');
        if (response.ok) {
            backendDot.classList.add('online');
            backendDot.classList.remove('offline');
            backendText.textContent = "Backend Connected";
        } else {
            throw new Error('Not healthy');
        }
    } catch (e) {
        backendDot.classList.add('offline');
        backendDot.classList.remove('online');
        backendText.textContent = "Backend Disconnected";
    }
});
