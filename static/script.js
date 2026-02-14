// FraudShield - Enhanced Fraud Detection System
// Responsive & Modern JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const form = document.getElementById('fraudForm');
    const submitBtn = document.getElementById('submitBtn');
    const buttonContent = document.getElementById('buttonContent');
    const buttonLoader = document.getElementById('buttonLoader');
    const resultSection = document.getElementById('resultSection');
    const distanceInput = document.getElementById('distance');
    const distanceFill = document.getElementById('distanceFill');
    const downloadReportBtn = document.getElementById('downloadReport');
    
    // Initialize
    init();
    
    function init() {
        setupDistanceIndicator();
        setupFormValidation();
        setupDownloadReport();
        addInputFocusEffects();
    }
    
    // Distance indicator
    function setupDistanceIndicator() {
        distanceInput.addEventListener('input', function() {
            const distance = parseFloat(this.value) || 0;
            // Calculate percentage (0-500km range)
            const percentage = Math.min((distance / 500) * 100, 100);
            distanceFill.style.width = percentage + '%';
        });
    }
    
    // Form validation
    function setupFormValidation() {
        const inputs = form.querySelectorAll('input[type="number"]');
        
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                if (this.value < 0) {
                    this.value = 0;
                }
            });
        });
    }
    
    // Add focus effects
    function addInputFocusEffects() {
        const inputs = form.querySelectorAll('input, .radio-card');
        
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.style.transform = 'scale(1.01)';
            });
            
            input.addEventListener('blur', function() {
                this.style.transform = 'scale(1)';
            });
        });
    }
    
    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get values
        const amount = parseFloat(document.getElementById('amount').value);
        const distance = parseFloat(document.getElementById('distance').value);
        const transactionTypeInput = document.querySelector('input[name="transaction_type"]:checked');
        
        // Validate
        if (!validateInputs(amount, distance, transactionTypeInput)) {
            return;
        }
        
        const transactionType = parseInt(transactionTypeInput.value);
        
        // Show loading
        setLoadingState(true);
        hideResult();
        
        // Prepare data
        const data = {
            amount: amount,
            distance: distance,
            transaction_type: transactionType
        };
        
        try {
            // API call
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // Small delay for better UX
                await sleep(600);
                displayResult(result);
                scrollToResult();
            } else {
                showError(result.error || 'An error occurred. Please try again.');
            }
            
        } catch (error) {
            console.error('Error:', error);
            showError('Unable to connect to server. Please ensure the Flask app is running on port 5000.');
        } finally {
            setLoadingState(false);
        }
    });
    
    // Validation
    function validateInputs(amount, distance, transactionType) {
        if (isNaN(amount) || amount <= 0) {
            showError('Please enter a valid transaction amount (greater than $0)');
            return false;
        }
        
        if (amount > 1000000) {
            showError('Transaction amount seems unusually high. Please verify.');
            return false;
        }
        
        if (isNaN(distance) || distance < 0) {
            showError('Please enter a valid distance (0 or greater)');
            return false;
        }
        
        if (!transactionType) {
            showError('Please select a transaction method');
            return false;
        }
        
        return true;
    }
    
    // Loading state
    function setLoadingState(isLoading) {
        submitBtn.disabled = isLoading;
        buttonContent.style.display = isLoading ? 'none' : 'flex';
        buttonLoader.style.display = isLoading ? 'flex' : 'none';
    }
    
    // Display result
    function displayResult(result) {
        const resultIcon = document.getElementById('resultIcon');
        const resultTitle = document.getElementById('resultTitle');
        const resultMessage = document.getElementById('resultMessage');
        const confidenceValue = document.getElementById('confidenceValue');
        const confidenceFill = document.getElementById('confidenceFill');
        const fraudProbability = document.getElementById('fraudProbability');
        const safeProbability = document.getElementById('safeProbability');
        const fraudBar = document.getElementById('fraudBar');
        const safeBar = document.getElementById('safeBar');
        
        const isFraud = result.is_fraud;
        
        // Icon
        resultIcon.textContent = isFraud ? '⚠️' : '✅';
        resultIcon.className = 'result-icon ' + (isFraud ? 'danger' : 'success');
        
        // Title and message
        if (isFraud) {
            resultTitle.textContent = 'High Fraud Risk Detected';
            resultTitle.style.color = 'var(--danger)';
            resultMessage.textContent = 'This transaction shows suspicious patterns. We recommend additional verification steps before proceeding with this transaction.';
        } else {
            resultTitle.textContent = 'Transaction Appears Safe';
            resultTitle.style.color = 'var(--success)';
            resultMessage.textContent = 'This transaction passed our fraud detection analysis. No suspicious patterns were identified based on the provided information.';
        }
        
        // Confidence
        confidenceValue.textContent = result.confidence.toFixed(1) + '%';
        setTimeout(() => {
            confidenceFill.style.width = result.confidence + '%';
        }, 100);
        
        // Probabilities
        fraudProbability.textContent = result.fraud_probability.toFixed(1) + '%';
        safeProbability.textContent = result.legitimate_probability.toFixed(1) + '%';
        
        setTimeout(() => {
            fraudBar.style.width = result.fraud_probability + '%';
            safeBar.style.width = result.legitimate_probability + '%';
        }, 300);
        
        // Show result
        resultSection.style.display = 'block';
        
        // Celebration effect for safe transactions
        if (!isFraud && result.confidence > 90) {
            createSuccessEffect();
        }
    }
    
    // Show error
    function showError(message) {
        const resultIcon = document.getElementById('resultIcon');
        const resultTitle = document.getElementById('resultTitle');
        const resultMessage = document.getElementById('resultMessage');
        
        resultIcon.textContent = '❌';
        resultIcon.className = 'result-icon danger';
        resultTitle.textContent = 'Error';
        resultTitle.style.color = 'var(--danger)';
        resultMessage.textContent = message;
        
        // Hide metrics
        document.querySelector('.result-metrics').style.display = 'none';
        document.querySelector('.result-actions').style.display = 'none';
        
        resultSection.style.display = 'block';
        scrollToResult();
    }
    
    // Hide result
    function hideResult() {
        resultSection.style.display = 'none';
        
        // Reset metrics display
        document.querySelector('.result-metrics').style.display = 'flex';
        document.querySelector('.result-actions').style.display = 'grid';
        
        // Reset animations
        document.getElementById('confidenceFill').style.width = '0%';
        document.getElementById('fraudBar').style.width = '0%';
        document.getElementById('safeBar').style.width = '0%';
    }
    
    // Scroll to result
    function scrollToResult() {
        setTimeout(() => {
            resultSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
            });
        }, 100);
    }
    
    // Download report
    function setupDownloadReport() {
        downloadReportBtn.addEventListener('click', function() {
            const reportData = {
                timestamp: new Date().toLocaleString(),
                amount: document.getElementById('amount').value,
                distance: document.getElementById('distance').value,
                type: getTransactionTypeText(),
                result: document.getElementById('resultTitle').textContent,
                confidence: document.getElementById('confidenceValue').textContent,
                fraudRisk: document.getElementById('fraudProbability').textContent
            };
            
            // Create simple text report
            const report = 
`FRAUDSHIELD TRANSACTION ANALYSIS REPORT
${'='.repeat(45)}

Analysis Date: ${reportData.timestamp}

TRANSACTION DETAILS
-------------------
Amount: $${reportData.amount}
Distance from Home: ${reportData.distance} km
Transaction Method: ${reportData.type}

ANALYSIS RESULTS
----------------
Result: ${reportData.result}
Confidence Level: ${reportData.confidence}
Fraud Risk Score: ${reportData.fraudRisk}

${'='.repeat(45)}
This is a demo report. In production, this would
generate a detailed PDF with full analysis.
`;
            
            // For demo, show in alert
            alert(report);
            
            // In production, you would download as PDF
            // downloadTextFile(report, 'fraud-analysis-report.txt');
        });
    }
    
    // Get transaction type text
    function getTransactionTypeText() {
        const selected = document.querySelector('input[name="transaction_type"]:checked');
        if (!selected) return 'Unknown';
        
        const value = selected.value;
        const types = {
            '0': 'Online Purchase',
            '1': 'In-Store Purchase',
            '2': 'ATM Withdrawal'
        };
        
        return types[value] || 'Unknown';
    }
    
    // Success effect
    function createSuccessEffect() {
        // Simple particle effect
        const colors = ['#00D4FF', '#0066FF', '#10B981'];
        const count = 20;
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                createParticle(colors[Math.floor(Math.random() * colors.length)]);
            }, i * 50);
        }
    }
    
    function createParticle(color) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            width: 8px;
            height: 8px;
            background: ${color};
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            left: 50%;
            top: 50%;
        `;
        
        document.body.appendChild(particle);
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = 100 + Math.random() * 100;
        const duration = 1000 + Math.random() * 500;
        
        particle.animate([
            { 
                transform: 'translate(0, 0) scale(1)',
                opacity: 1
            },
            { 
                transform: `translate(${Math.cos(angle) * velocity}px, ${Math.sin(angle) * velocity}px) scale(0)`,
                opacity: 0
            }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }).onfinish = () => particle.remove();
    }
    
    // Utility
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Download text file (for future use)
    function downloadTextFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});

// Reset form (global function)
function resetForm() {
    const form = document.getElementById('fraudForm');
    const resultSection = document.getElementById('resultSection');
    const distanceFill = document.getElementById('distanceFill');
    
    form.reset();
    resultSection.style.display = 'none';
    distanceFill.style.width = '0%';
    
    // Scroll to top on mobile
    if (window.innerWidth < 768) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}