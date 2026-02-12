/**
 * Email Fraud Detector - Frontend Application
 * Professional Tailwind CSS version with API integration
 */

// Configuration
const API_BASE_URL = 'http://localhost:8000';

// DOM Elements
const inputSection = document.getElementById('inputSection');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const historySection = document.getElementById('historySection');

const emailForm = document.getElementById('emailForm');
const emailContent = document.getElementById('email-content');
const analyzeBtn = document.getElementById('analyzeBtn');

// Results elements
const verdictIcon = document.getElementById('verdictIcon');
const verdictBadge = document.getElementById('verdictBadge');
const verdictBadgeText = document.getElementById('verdictBadgeText');
const verdictTitle = document.getElementById('verdictTitle');
const probabilityScore = document.getElementById('probabilityScore');
const riskScoresContainer = document.getElementById('riskScoresContainer');
const detailsContainer = document.getElementById('detailsContainer');

// Error elements
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');
const analyzeNewBtn = document.getElementById('analyzeNewBtn');

const tabAnalyze = document.getElementById('tabAnalyze');
const tabHistory = document.getElementById('tabHistory');
const historyTableBody = document.getElementById('historyTableBody');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const dropZone = document.getElementById('dropZone');
const dropOverlay = document.getElementById('dropOverlay');

/**
 * Show specific section and hide others
 */
function showSection(section) {
    [inputSection, loadingSection, resultsSection, errorSection, historySection].forEach(el => {
        if(el) el.classList.add('hidden');
    });
    section.classList.remove('hidden');
}

/**
 * Show error
 */
function showError(message) {
    errorMessage.textContent = message;
    showSection(errorSection);
}

/**
 * Format percentage
 */
function formatPercentage(value) {
    return `${Math.round(value * 100)}%`;
}

/**
 * Render risk score bar
 */
function renderRiskScore(title, icon, score, color, description) {
    const scoreValue = Math.round(score * 100);
    const colorClass = color === 'red' ? 'bg-primary' : color === 'yellow' ? 'bg-[#f59e0b]' : 'bg-green-500';
    const shadowClass = color === 'red' ? 'shadow-[0_0_10px_rgba(236,19,19,0.5)]' : color === 'yellow' ? 'shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'shadow-[0_0_10px_rgba(34,197,94,0.3)]';
    const textColor = color === 'red' ? 'text-primary' : color === 'yellow' ? 'text-[#f59e0b]' : 'text-green-500';

    return `
        <div class="flex flex-col gap-2">
            <div class="flex justify-between items-end">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-text-muted">${icon}</span>
                    <p class="text-base font-medium text-slate-900 dark:text-white">${title}</p>
                </div>
                <p class="text-sm font-bold ${textColor}">${scoreValue}/100</p>
            </div>
            <div class="h-3 w-full rounded-full bg-surface-border/50">
                <div class="h-3 rounded-full ${colorClass} ${shadowClass} transition-all duration-1000 ease-out" style="width: ${scoreValue}%;"></div>
            </div>
            <p class="text-xs text-text-muted flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">${color === 'red' ? 'warning' : color === 'yellow' ? 'public_off' : 'check_circle'}</span>
                ${description}
            </p>
        </div>
    `;
}

/**
 * Render URL analyses
 */
function renderURLAnalyses(urlAnalyses) {
    if (!urlAnalyses || urlAnalyses.length === 0) {
        return '<p class="text-sm text-text-muted">No URLs detected in email</p>';
    }

    let html = '<div class="mt-4 space-y-3">';
    html += '<h4 class="text-sm font-semibold text-slate-900 dark:text-white mb-2">URLs Detected:</h4>';

    urlAnalyses.forEach((analysis) => {
        const flags = [];
        if (analysis.is_shortener) flags.push('URL Shortener');
        if (analysis.suspicious_tld) flags.push('Suspicious TLD');
        if (analysis.excessive_subdomains) flags.push('Excessive Subdomains');
        if (analysis.ip_based) flags.push('IP-Based');
        if (analysis.high_entropy) flags.push('High Entropy');

        html += `
            <div class="p-3 rounded-lg bg-surface-border/20 border border-surface-border/30">
                <p class="text-xs font-mono text-slate-900 dark:text-white break-all mb-2">${escapeHtml(analysis.url)}</p>
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-xs text-text-muted">Risk:</span>
                    <span class="text-xs font-bold ${analysis.risk_score > 0.5 ? 'text-primary' : 'text-green-500'}">${formatPercentage(analysis.risk_score)}</span>
                </div>
                ${flags.length > 0 ? `
                    <div class="flex flex-wrap gap-1">
                        ${flags.map(flag => `<span class="inline-flex items-center gap-1 rounded bg-red-500/10 px-1.5 py-0.5 text-xs font-bold text-red-500">${flag}</span>`).join('')}
                    </div>
                ` : '<span class="text-xs text-green-500">✓ No suspicious patterns</span>'}
            </div>
        `;
    });

    html += '</div>';
    return html;
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Display results
 */
function displayResults(data) {
    const isFraud = data.verdict === 'FRAUD';
    const probability = data.fraud_probability;

    // Update verdict section
    if (isFraud) {
        verdictIcon.innerHTML = '<span class="material-symbols-outlined text-6xl text-primary">gpp_bad</span>';
        verdictBadgeText.textContent = 'High Risk Detected';
        verdictTitle.textContent = 'FRAUD DETECTED';
        verdictTitle.classList.add('text-primary');
        verdictTitle.classList.remove('text-green-500');
    } else {
        verdictIcon.innerHTML = '<span class="material-symbols-outlined text-6xl text-green-500">verified_user</span>';
        verdictIcon.classList.remove('bg-primary/10', 'ring-primary/20');
        verdictIcon.classList.add('bg-green-500/10', 'ring-green-500/20');
        verdictBadge.classList.remove('bg-primary/10', 'border-primary/20');
        verdictBadge.classList.add('bg-green-500/10', 'border-green-500/20');
        verdictBadgeText.classList.remove('text-primary');
        verdictBadgeText.classList.add('text-green-500');
        verdictBadgeText.textContent = 'Low Risk';
        verdictTitle.textContent = 'SAFE';
        verdictTitle.classList.remove('text-primary');
        verdictTitle.classList.add('text-green-500');
    }

    probabilityScore.textContent = formatPercentage(probability);
    probabilityScore.classList.toggle('text-primary', isFraud);
    probabilityScore.classList.toggle('text-green-500', !isFraud);

    // Render risk scores
    let riskScoresHTML = '';

    // Text Risk Score
    const textColor = data.text_score > 0.7 ? 'red' : data.text_score > 0.4 ? 'yellow' : 'green';
    const textDesc = data.text_score > 0.7 ? 'Phishing keywords & urgency triggers detected' :
        data.text_score > 0.4 ? 'Some suspicious patterns found' :
            'No suspicious text patterns detected';
    riskScoresHTML += renderRiskScore('Text Risk Score', 'text_fields', data.text_score, textColor, textDesc);

    // URL Risk Score
    const urlColor = data.url_score > 0.7 ? 'red' : data.url_score > 0.4 ? 'yellow' : 'green';
    const urlDesc = data.url_score > 0.7 ? 'Suspicious domain patterns identified' :
        data.url_score > 0.4 ? 'Some URL concerns detected' :
            'URLs appear legitimate';
    riskScoresHTML += renderRiskScore('URL Risk Score', 'link', data.url_score, urlColor, urlDesc);

    riskScoresContainer.innerHTML = riskScoresHTML;

    // Render details
    let detailsHTML = `
        <div class="grid grid-cols-[100px_1fr] gap-y-4 text-sm">
            <div class="text-text-muted font-medium py-1">URLs Found</div>
            <div class="text-slate-900 dark:text-white font-medium py-1">${data.details.urls_found}</div>
            
            <div class="col-span-2 h-px bg-surface-border/50"></div>
            
            <div class="text-text-muted font-medium py-1">Email Length</div>
            <div class="text-slate-900 dark:text-white font-medium py-1">${data.details.text_length} characters</div>
            
            <div class="col-span-2 h-px bg-surface-border/50"></div>
            
            <div class="text-text-muted font-medium py-1">Processed</div>
            <div class="text-slate-900 dark:text-white font-medium py-1">${data.details.processed_text_length} tokens</div>
            
            <div class="col-span-2 h-px bg-surface-border/50"></div>
            
            <div class="text-text-muted font-medium py-1">Text Weight</div>
            <div class="text-slate-900 dark:text-white font-medium py-1">${formatPercentage(data.details.scoring_weights.text_weight)}</div>
            
            <div class="col-span-2 h-px bg-surface-border/50"></div>
            
            <div class="text-text-muted font-medium py-1">URL Weight</div>
            <div class="text-slate-900 dark:text-white font-medium py-1">${formatPercentage(data.details.scoring_weights.url_weight)}</div>
        </div>
    `;

    // Add URL analyses
    detailsHTML += renderURLAnalyses(data.details.url_analyses);

    detailsContainer.innerHTML = detailsHTML;

    // Show results
    showSection(resultsSection);

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Analyze email
 */
async function analyzeEmail(emailText) {
    showSection(loadingSection);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email_text: emailText
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        displayResults(data);
        addToHistory(emailText, data);

    } catch (error) {
        console.error('Analysis error:', error);

        let errorMsg = 'Failed to analyze email. ';

        if (error.message.includes('Failed to fetch')) {
            errorMsg += 'Please ensure the backend server is running at ' + API_BASE_URL;
        } else {
            errorMsg += error.message;
        }

        showError(errorMsg);
    }
}

/**
 * Handle form submission
 */
emailForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const emailText = emailContent.value.trim();

    if (!emailText) {
        showError('Please enter email content to analyze');
        return;
    }

    analyzeEmail(emailText);
});

/**
 * Handle retry button
 */
retryBtn.addEventListener('click', () => {
    showSection(inputSection);
    emailContent.focus();
});

/**
 * Handle analyze new button
 */
analyzeNewBtn.addEventListener('click', () => {
    showSection(inputSection);
    emailContent.value = '';
    emailContent.focus();
});

/**
 * Keyboard shortcut (Ctrl/Cmd + Enter to submit)
 */
emailContent.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        emailForm.dispatchEvent(new Event('submit'));
    }
});

/**
 * Check API health on load
 */
async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            console.log('✅ Backend API is healthy');
        }
    } catch (error) {
        console.warn('⚠️ Backend API is not reachable. Please start the server.');
        console.warn('Run: cd backend && py -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000');
    }
}

// --- History & Tabs Logic ---

// Load history from localStorage
let scanHistory = JSON.parse(localStorage.getItem('emailFraudHistory') || '[]');

function saveHistory() {
    localStorage.setItem('emailFraudHistory', JSON.stringify(scanHistory));
    renderHistory();
}

function addToHistory(text, result) {
    const entry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        textSnippet: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        verdict: result.verdict,
        probability: result.fraud_probability,
        fullResult: result
    };
    
    // Add to beginning and keep max 10
    scanHistory.unshift(entry);
    if (scanHistory.length > 10) {
        scanHistory.pop();
    }
    
    saveHistory();
}

function renderHistory() {
    if (scanHistory.length === 0) {
        historyTableBody.innerHTML = `
            <tr class="bg-white dark:bg-surface-dark">
                <td colspan="5" class="px-6 py-8 text-center text-text-muted">
                    No history available yet.
                </td>
            </tr>
        `;
        return;
    }

    historyTableBody.innerHTML = scanHistory.map(entry => {
        const date = new Date(entry.timestamp).toLocaleString();
        const isFraud = entry.verdict === 'FRAUD';
        const badgeColor = isFraud ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500';
        
        return `
            <tr class="bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <td class="px-6 py-4 font-mono text-xs whitespace-nowrap text-slate-600 dark:text-gray-400">${date}</td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-bold ${badgeColor}">
                        ${entry.verdict}
                    </span>
                </td>
                <td class="px-6 py-4 font-medium ${isFraud ? 'text-primary' : 'text-green-500'}">
                    ${formatPercentage(entry.probability)}
                </td>
                <td class="px-6 py-4 text-slate-600 dark:text-gray-400 truncate max-w-[200px]">
                    ${escapeHtml(entry.textSnippet)}
                </td>
                <td class="px-6 py-4 text-right">
                    <button onclick="viewHistoryItem(${entry.id})" class="text-primary hover:text-primary-hover font-medium text-xs">
                        View Report
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Global for inline onclick
window.viewHistoryItem = function(id) {
    const entry = scanHistory.find(x => x.id === id);
    if (entry) {
        displayResults(entry.fullResult);
        // Set tab to analyze
        tabAnalyze.classList.add('bg-primary', 'text-white', 'shadow-md');
        tabAnalyze.classList.remove('text-slate-600', 'hover:text-slate-900', 'dark:text-gray-400');
        tabHistory.classList.remove('bg-primary', 'text-white', 'shadow-md');
        tabHistory.classList.add('text-slate-600', 'hover:text-slate-900', 'dark:text-gray-400');
        historySection.classList.add('hidden');
    }
};

clearHistoryBtn.addEventListener('click', () => {
    if(confirm('Clear all scan history?')) {
        scanHistory = [];
        saveHistory();
    }
});

// Tab Switching
function switchTab(tab) {
    if (tab === 'analyze') {
        tabAnalyze.classList.add('bg-primary', 'text-white', 'shadow-md');
        tabAnalyze.classList.remove('text-slate-600', 'hover:text-slate-900', 'dark:text-gray-400');
        
        tabHistory.classList.remove('bg-primary', 'text-white', 'shadow-md');
        tabHistory.classList.add('text-slate-600', 'hover:text-slate-900', 'dark:text-gray-400');
        
        showSection(inputSection);
    } else {
        tabHistory.classList.add('bg-primary', 'text-white', 'shadow-md');
        tabHistory.classList.remove('text-slate-600', 'hover:text-slate-900', 'dark:text-gray-400');
        
        tabAnalyze.classList.remove('bg-primary', 'text-white', 'shadow-md');
        tabAnalyze.classList.add('text-slate-600', 'hover:text-slate-900', 'dark:text-gray-400');
        
        showSection(historySection);
        renderHistory();
    }
}

tabAnalyze.addEventListener('click', () => switchTab('analyze'));
tabHistory.addEventListener('click', () => switchTab('history'));

// --- Drag and Drop Logic ---

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    dropOverlay.classList.remove('hidden');
    dropOverlay.classList.add('flex');
}

function unhighlight(e) {
    dropOverlay.classList.add('hidden');
    dropOverlay.classList.remove('flex');
}

dropZone.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFiles(files) {
    if (files.length > 0) {
        const file = files[0];
        readFile(file);
    }
}

function readFile(file) {
    if (file.type.startsWith('text/') || file.name.endsWith('.eml') || file.name.endsWith('.txt') || file.name.endsWith('.msg')) {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onloadend = function() {
            emailContent.value = reader.result;
        }
    } else {
        alert('Please drop a text or .eml file.');
    }
}


// Initialize
checkAPIHealth();
console.log('Email Fraud Detector initialized');
console.log('Tip: Press Ctrl/Cmd + Enter to submit the form');
