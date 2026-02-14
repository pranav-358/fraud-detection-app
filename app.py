"""
Flask Backend for Credit Card Fraud Detection Web App
"""

from flask import Flask, render_template, request, jsonify
import joblib
import numpy as np
import os

app = Flask(__name__)

# Load the trained model and scaler
MODEL_PATH = 'fraud_model.pkl'
SCALER_PATH = 'scaler.pkl'

# Check if model files exist
if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
    print("⚠️  Model files not found!")
    print("Please run 'python model.py' first to train and save the model.")
    model = None
    scaler = None
else:
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    print("✓ Model and scaler loaded successfully!")

@app.route('/')
def home():
    """Render the main page"""
    return render_template('index.html')

@app.route('/privacy')
def privacy():
    """Render privacy policy page"""
    return render_template('privacy.html')

@app.route('/terms')
def terms():
    """Render terms of service page"""
    return render_template('terms.html')

@app.route('/docs')
def docs():
    """Render documentation page"""
    return render_template('docs.html')

@app.route('/api')
def api_docs():
    """Redirect to API section of docs"""
    return render_template('docs.html')

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict if a transaction is fraudulent
    Expected JSON input:
    {
        "amount": float,
        "distance": float,
        "transaction_type": int (0=Online, 1=In-Store, 2=ATM)
    }
    """
    try:
        # Check if model is loaded
        if model is None or scaler is None:
            return jsonify({
                'error': 'Model not loaded. Please run model.py first.'
            }), 500
        
        # Get data from request
        data = request.get_json()
        
        # Validate input
        if not all(key in data for key in ['amount', 'distance', 'transaction_type']):
            return jsonify({
                'error': 'Missing required fields'
            }), 400
        
        # Extract features
        amount = float(data['amount'])
        distance = float(data['distance'])
        transaction_type = int(data['transaction_type'])
        
        # Validate ranges
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
        if distance < 0:
            return jsonify({'error': 'Distance cannot be negative'}), 400
        if transaction_type not in [0, 1, 2]:
            return jsonify({'error': 'Invalid transaction type'}), 400
        
        # Prepare features for prediction
        features = np.array([[amount, distance, transaction_type]])
        
        # Scale features
        features_scaled = scaler.transform(features)
        
        # Make prediction
        prediction = model.predict(features_scaled)[0]
        probability = model.predict_proba(features_scaled)[0]
        
        # Prepare response
        result = {
            'prediction': 'Fraudulent' if prediction == 1 else 'Legitimate',
            'is_fraud': bool(prediction),
            'confidence': float(max(probability)) * 100,
            'fraud_probability': float(probability[1]) * 100,
            'legitimate_probability': float(probability[0]) * 100
        }
        
        return jsonify(result)
    
    except ValueError as e:
        return jsonify({'error': f'Invalid input: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None and scaler is not None
    })

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🚀 Starting Fraud Detection Web App")
    print("="*50)
    port = int(os.environ.get('PORT', 5000))
    print(f"📍 Server running at: http://0.0.0.0:{port}")
    print("="*50 + "\n")
    app.run(debug=False, host='0.0.0.0', port=port)