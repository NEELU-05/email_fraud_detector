/**
 * Gmail Fraud Detector Content Script
 * Handles DOM observation, text extraction, and banner injection.
 */

// Configuration
// We now use background script for API calls to avoid Mixed Content/CORS
let isAutoScanEnabled = true;

// Track scanned message IDs to avoid re-scanning when Gmail re-renders
const scannedMessageIds = new Set();
const MAX_TRACKED_IDS = 100; // Prevent memory leak

// Debounce scan to avoid duplicate API calls on rapid DOM changes
let scanDebounceTimer = null;
const SCAN_DEBOUNCE_MS = 500;

// Load settings
chrome.storage.sync.get(['autoScan'], (result) => {
    isAutoScanEnabled = result.autoScan !== false;
    console.log("[EFD] Auto-scan enabled:", isAutoScanEnabled);
});

// Listen for setting changes
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateSettings") {
        isAutoScanEnabled = request.autoScan;
        console.log("[EFD] Settings updated:", isAutoScanEnabled);
    }
});

/**
 * Main Observer to detect when an email is opened
 * Debounced to prevent excessive scans on rapid DOM mutations
 */
const observer = new MutationObserver(() => {
    if (!isAutoScanEnabled) return;
    if (scanDebounceTimer) clearTimeout(scanDebounceTimer);
    scanDebounceTimer = setTimeout(() => {
        scanDebounceTimer = null;
        detectAndScanEmails();
    }, SCAN_DEBOUNCE_MS);
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

/**
 * Multiple fallback selectors for Gmail's email body (DOM changes frequently)
 * .a3s.aiL = current standard view, .a3s = fallback, .ii = older structure
 */
const EMAIL_BODY_SELECTORS = ['.a3s.aiL', '.a3s', '.ii.gt .a3s'];

/**
 * Find all email body elements - tries selectors until one returns results
 */
function findAllEmailBodies() {
    for (const sel of EMAIL_BODY_SELECTORS) {
        const els = document.querySelectorAll(sel);
        if (els.length > 0) return Array.from(els);
    }
    return [];
}

/**
 * Find container for banner injection
 */
function findContainer(bodyEl) {
    return bodyEl.closest('.gs') || bodyEl.closest('.ii.gt') || bodyEl.closest('.ii') || bodyEl.parentElement;
}

/**
 * Get Gmail message ID for deduplication (avoids re-scanning same email on re-render)
 */
function getMessageId(container) {
    const msgEl = container.closest('[data-message-id]') || container.closest('[data-legacy-message-id]');
    return msgEl ? (msgEl.dataset.messageId || msgEl.dataset.legacyMessageId) : null;
}

function detectAndScanEmails() {
    const emailBodies = findAllEmailBodies();

    emailBodies.forEach(bodyEl => {
        const container = findContainer(bodyEl);
        if (!container) return;

        // Deduplication: skip if we already scanned this message
        const msgId = getMessageId(container);
        if (msgId && scannedMessageIds.has(msgId)) return;

        // Skip if already processing or done
        if (container.dataset.efdScanned === 'processing' || container.dataset.efdScanned === 'true') return;

        console.log("[EFD] New email container detected", container);

        // Mark as processing immediately
        container.dataset.efdScanned = "processing";

        const subject = getSubject();
        const emailText = (bodyEl.innerText || bodyEl.textContent || '').trim();

        if (emailText.length < 10) {
            console.log("[EFD] Email content too short, skipping");
            container.dataset.efdScanned = ""; // Reset - fix for stuck "processing" state
            return;
        }

        if (msgId) {
            scannedMessageIds.add(msgId);
            if (scannedMessageIds.size > MAX_TRACKED_IDS) {
                const first = scannedMessageIds.values().next().value;
                scannedMessageIds.delete(first);
            }
        }

        console.log("[EFD] Extracting content...", { subjectLength: subject.length, bodyLength: emailText.length });

        const fullContent = `Subject: ${subject}\n\n${emailText}`;
        analyzeEmail(fullContent, container, msgId);
    });
}

function getSubject() {
    // Try multiple selectors for subject (Gmail DOM varies)
    const selectors = ['h2.hP', 'div.ha', 'h2[data-thread-perm-id]', '.hP', '[role="main"] h2'];

    for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
            const text = (el.innerText || el.textContent || '').trim();
            if (text) return text;
        }
    }

    // Fallback: document title usually has "Subject - ..."
    if (document.title) {
        return document.title.split('-')[0].trim();
    }

    return "Unknown Subject";
}

// Forward analysis request to background script to avoid Mixed Content issues
async function analyzeEmail(text, container, msgId) {
    // Inject Loading Banner
    const banner = createBanner('loading');
    prependBanner(container, banner);

    console.log("[EFD] Sending to Background Script...");

    try {
        chrome.runtime.sendMessage({
            action: "analyzeEmail",
            text: text
        }, (response) => {
            // Check for message passing errors
            if (chrome.runtime.lastError) {
                console.error("[EFD] Message error:", chrome.runtime.lastError);
                let errorMsg = chrome.runtime.lastError.message;

                // User-friendly message for invalidated context (reload)
                if (errorMsg && errorMsg.includes("Extension context invalidated")) {
                    errorMsg = "Extension updated. Please refresh the page.";
                }

                handleError(banner, container, errorMsg);
                return;
            }

            // Check if response exists
            if (!response) {
                console.error("[EFD] No response received");
                handleError(banner, container, "No response from background script");
                return;
            }

            if (response.success) {
                console.log("[EFD] Analysis complete:", response.data.verdict);
                updateBanner(banner, response.data);
                container.dataset.efdScanned = "true";
            } else {
                console.error("[EFD] Backend error:", response.error);
                handleError(banner, container, response.error);
            }
        });
    } catch (e) {
        console.error("[EFD] Exception sending message:", e);
        handleError(banner, container, e.message);
    }
}

/** Escape HTML to prevent XSS when injecting user/external content */
function escapeHtml(str) {
    if (!str || typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function handleError(banner, container, errorMsg) {
    banner.className = 'efd-banner efd-error';
    const safeMsg = escapeHtml(errorMsg || "Ensure backend is running at localhost:8000");
    banner.innerHTML = `
            <div class="efd-content">
            <div class="efd-icon">❌</div>
            <div class="efd-text">
                <div class="efd-title">Analysis Failed</div>
                <div class="efd-subtitle">${safeMsg}</div>
            </div>
        </div>
        <div class="efd-actions">
            <button class="efd-btn" id="efd-retry">Retry</button>
            <button class="efd-btn" id="efd-dismiss">Dismiss</button>
        </div>
    `;

    container.dataset.efdScanned = "error";

    const retryBtn = banner.querySelector('#efd-retry');
    if (retryBtn) {
        retryBtn.onclick = (e) => {
            e.stopPropagation();
            banner.remove();
            container.dataset.efdScanned = "";
            const msgId = getMessageId(container);
            if (msgId) scannedMessageIds.delete(msgId);
            detectAndScanEmails();
        };
    }

    const dismissBtn = banner.querySelector('#efd-dismiss');
    if (dismissBtn) dismissBtn.onclick = (e) => { e.stopPropagation(); banner.remove(); };
}

function createBanner(status) {
    const div = document.createElement('div');
    div.className = `efd-banner efd-${status}`;

    if (status === 'loading') {
        div.innerHTML = `
            <div class="efd-content">
                <div class="efd-icon">⏳</div>
                <div class="efd-text">
                    <div class="efd-title">Analyzing Email...</div>
                    <div class="efd-subtitle">Checking for fraud patterns</div>
                </div>
            </div>
        `;
    }
    return div;
}

function updateBanner(bannerElement, data) {
    const isFraud = data.verdict === 'FRAUD';
    const statusClass = isFraud ? 'efd-fraud' : 'efd-safe';

    bannerElement.className = `efd-banner ${statusClass}`;

    const icon = isFraud ? '⚠️' : '✅';
    const title = isFraud ? 'Potential Fraud Detected' : 'Email Looks Safe';
    const prob = Math.round(data.fraud_probability * 100);

    bannerElement.innerHTML = `
        <div class="efd-content">
            <div class="efd-icon">${icon}</div>
            <div class="efd-text">
                <div class="efd-title">${title}</div>
                <div class="efd-subtitle">Risk Probability: ${prob}%</div>
            </div>
        </div>
        <div class="efd-actions">
           ${isFraud ? '<button class="efd-btn" style="border-color: #c5221f; color: #c5221f;">Report</button>' : ''} 
           <button class="efd-btn" id="efd-dismiss">Dismiss</button>
        </div>
    `;

    const dismissBtn = bannerElement.querySelector('#efd-dismiss');
    dismissBtn.onclick = (e) => {
        e.stopPropagation();
        bannerElement.remove();
    };
}

function prependBanner(container, banner) {
    // Find the best place to inject. Usually above the message body or header.
    // Gmail structure: .gs > .gE (header) > .gs (body)
    // We will try to insert it at the top of the container
    container.insertBefore(banner, container.firstChild);
}

// Helper to manually trigger scan if needed (for debugging)
console.log("Email Fraud Detector Content Script Loaded");
