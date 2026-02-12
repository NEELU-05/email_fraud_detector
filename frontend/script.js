/**
 * Email Fraud Detector - Frontend JavaScript
 * Handles API communication and dynamic UI updates
 */

// Configuration
const API_BASE_URL = 'http://localhost:8000';

// DOM Elements
const emailForm = document.getElementById('emailForm');
const emailTextarea = document.getElementById('emailText');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultsSection = document.getElementById('resultsSection');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');

// Result elements
const verdictCard = document.getElementById('verdictCard');
const verdictIcon = document.getElementById('verdictIcon');
const verdictText = document.getElementById('verdictText');
const probabilityValue = document.getElementById('probabilityValue');
const probabilityFill = document.getElementById('probabilityFill');
const textScore = document.getElementById('textScore');
const textScoreFill = document.getElementById('textScoreFill');
const urlScore = document.getElementById('urlScore');
const urlScoreFill = document.getElementById('urlScoreFill');
const detailsContent = document.getElementById('detailsContent');

/**
 * Show loading state
 */
function showLoading() {
    resultsSection.classList.add('hidden');
    errorState.classList.add('hidden');
    loadingState.classList.remove('hidden');
    analyzeBtn.disabled = true;
}

/**
 * Hide loading state
 */
function hideLoading() {
    loadingState.classList.add('hidden');
    analyzeBtn.disabled = false;
}

/**
 * Show error state
 */
function showError(message) {
    hideLoading();
    resultsSection.classList.add('hidden');
    errorMessage.textContent = message;
    errorState.classList.remove('hidden');
}

/**
 * Format percentage
 */
function formatPercentage(value) {
    return `${Math.round(value * 100)}%`;
}

/**
 * Render URL analyses
 */
function renderURLAnalyses(urlAnalyses) {
    if (!urlAnalyses || urlAnalyses.length === 0) {
        return '<p style="color: var(--text-muted); font-size: 0.9rem;">No URLs detected in email</p>';
    }

    let html = '<div class="url-analysis">';
    html += '<div class="url-analysis-title">🔗 URLs Detected</div>';

    urlAnalyses.forEach((analysis, index) => {
        html += '<div class="url-item">';
        html += `<div class="url-link">${escapeHtml(analysis.url)}</div>`;
        html += `<div style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 0.5rem;">Risk Score: ${formatPercentage(analysis.risk_score)}</div>`;

        // Show flags for suspicious patterns
        const flags = [];
        if (analysis.is_shortener) flags.push('URL Shortener');
        if (analysis.suspicious_tld) flags.push('Suspicious TLD');
        if (analysis.excessive_subdomains) flags.push('Excessive Subdomains');
        if (analysis.ip_based) flags.push('IP-Based URL');
        if (analysis.high_entropy) flags.push('High Entropy');

        if (flags.length > 0) {
            html += '<div class="url-flags">';
            flags.forEach(flag => {
                html += `<span class="flag-badge">${flag}</span>`;
            });
            html += '</div>';
        } else {
            html += '<div style="color: var(--success-color); font-size: 0.85rem;">✓ No suspicious patterns detected</div>';
        }

        html += '</div>';
    });

    html += '</div>';
    return html;
}

/**
 * Escape HTML to prevent XSS
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
    hideLoading();

    // Update verdict
    const isFraud = data.verdict === 'FRAUD';
    verdictText.textContent = data.verdict;
    verdictText.className = `verdict-text ${isFraud ? 'fraud' : 'safe'}`;
    
    verdictIcon.className = `verdict-icon ${isFraud ? 'fraud' : 'safe'}`;
    verdictCard.className = `card verdict-card ${isFraud ? 'fraud' : 'safe'}`;

    // Update probability
    probabilityValue.textContent = formatPercentage(data.fraud_probability);
    probabilityFill.style.width = formatPercentage(data.fraud_probability);
    
    // Color code probability
    if (data.fraud_probability >= 0.7) {
        probabilityValue.style.color = 'var(--danger-color)';
        probabilityFill.style.background = 'var(--danger-gradient)';
    } else if (data.fraud_probability >= 0.4) {
        probabilityValue.style.color = 'var(--warning-color)';
        probabilityFill.style.background = 'var(--secondary-gradient)';
    } else {
        probabilityValue.style.color = 'var(--success-color)';
        probabilityFill.style.background = 'var(--success-gradient)';
    }

    // Update scores
    textScore.textContent = formatPercentage(data.text_score);
    textScoreFill.style.width = formatPercentage(data.text_score);
    
    urlScore.textContent = formatPercentage(data.url_score);
    urlScoreFill.style.width = formatPercentage(data.url_score);

    // Update details
    let detailsHTML = '';
    
    // Basic stats
    detailsHTML += '<div class="detail-item">';
    detailsHTML += '<span class="detail-label">URLs Found</span>';
    detailsHTML += `<span class="detail-value">${data.details.urls_found}</span>`;
    detailsHTML += '</div>';
    
    detailsHTML += '<div class="detail-item">';
    detailsHTML += '<span class="detail-label">Email Length</span>';
    detailsHTML += `<span class="detail-value">${data.details.text_length} characters</span>`;
    detailsHTML += '</div>';
    
    detailsHTML += '<div class="detail-item">';
    detailsHTML += '<span class="detail-label">Processed Text Length</span>';
    detailsHTML += `<span class="detail-value">${data.details.processed_text_length} tokens</span>`;
    detailsHTML += '</div>';
    
    detailsHTML += '<div class="detail-item">';
    detailsHTML += '<span class="detail-label">Text Weight</span>';
    detailsHTML += `<span class="detail-value">${formatPercentage(data.details.scoring_weights.text_weight)}</span>`;
    detailsHTML += '</div>';
    
    detailsHTML += '<div class="detail-item">';
    detailsHTML += '<span class="detail-label">URL Weight</span>';
    detailsHTML += `<span class="detail-value">${formatPercentage(data.details.scoring_weights.url_weight)}</span>`;
    detailsHTML += '</div>';

    // URL analyses
    detailsHTML += renderURLAnalyses(data.details.url_analyses);

    detailsContent.innerHTML = detailsHTML;

    // Show results with animation
    resultsSection.classList.remove('hidden');
    
    // Smooth scroll to results
    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

/**
 * Analyze email
 */
async function analyzeEmail(emailText) {
    showLoading();

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
    
    const emailText = emailTextarea.value.trim();
    
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
    errorState.classList.add('hidden');
    emailTextarea.focus();
});

/**
 * Add sample email button functionality (optional enhancement)
 */
function loadSampleEmail(type) {
    const samples = {
        fraud: `Subject: URGENT: Account Verification Required

Dear Valued Customer,

We have detected unusual activity on your account. Your account will be suspended within 24 hours unless you verify your identity immediately.

Click here to verify: http://bit.ly/verify-account-now

Failure to verify will result in permanent account closure and loss of funds.

Thank you,
Security Team`,
        
        safe: `Subject: Team Meeting - Project Update

Hi Team,

I hope this email finds you well. I wanted to remind everyone about our upcoming project review meeting scheduled for next Tuesday at 2 PM.

Please prepare your status updates and be ready to discuss any blockers or challenges you're facing.

Looking forward to seeing everyone there!

Best regards,
Project Manager`
    };
    
    emailTextarea.value = samples[type];
}

// Add keyboard shortcut (Ctrl/Cmd + Enter to submit)
emailTextarea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        emailForm.dispatchEvent(new Event('submit'));
    }
});

// Auto-resize textarea
emailTextarea.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Check API health on load
async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            console.log('✅ Backend API is healthy');
        }
    } catch (error) {
        console.warn('⚠️ Backend API is not reachable. Please start the server.');
    }
}

// Initialize
checkAPIHealth();

console.log('Email Fraud Detector initialized');
console.log('Tip: Press Ctrl/Cmd + Enter to submit the form');
