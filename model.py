"""
Credit Card Fraud Detection Model Training Script
This script creates a simple fraud detection model using synthetic data.
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib

def generate_synthetic_data(n_samples=5000):
    """
    Generate synthetic transaction data for training.
    Features: amount, distance_from_home, transaction_type (encoded)
    """
    np.random.seed(42)
    
    # Generate legitimate transactions (80%)
    n_legit = int(n_samples * 0.8)
    legit_amount = np.random.normal(75, 50, n_legit)  # Average $75
    legit_amount = np.clip(legit_amount, 1, 500)  # Clip to reasonable range
    legit_distance = np.random.exponential(10, n_legit)  # Close to home
    legit_distance = np.clip(legit_distance, 0, 100)
    legit_type = np.random.choice([0, 1, 2], n_legit, p=[0.5, 0.3, 0.2])  # 0=online, 1=in-store, 2=ATM
    legit_labels = np.zeros(n_legit)
    
    # Generate fraudulent transactions (20%)
    n_fraud = n_samples - n_legit
    fraud_amount = np.random.normal(300, 150, n_fraud)  # Higher amounts
    fraud_amount = np.clip(fraud_amount, 100, 1000)
    fraud_distance = np.random.uniform(50, 500, n_fraud)  # Far from home
    fraud_type = np.random.choice([0, 1, 2], n_fraud, p=[0.6, 0.3, 0.1])  # More online
    fraud_labels = np.ones(n_fraud)
    
    # Combine data
    amounts = np.concatenate([legit_amount, fraud_amount])
    distances = np.concatenate([legit_distance, fraud_distance])
    types = np.concatenate([legit_type, fraud_type])
    labels = np.concatenate([legit_labels, fraud_labels])
    
    # Create DataFrame
    data = pd.DataFrame({
        'amount': amounts,
        'distance_from_home': distances,
        'transaction_type': types,
        'is_fraud': labels
    })
    
    # Shuffle the data
    data = data.sample(frac=1, random_state=42).reset_index(drop=True)
    
    return data

def train_model():
    """
    Train the fraud detection model and save it.
    """
    print("Generating synthetic transaction data...")
    data = generate_synthetic_data(5000)
    
    # Prepare features and labels
    X = data[['amount', 'distance_from_home', 'transaction_type']]
    y = data['is_fraud']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train Random Forest model
    print("Training Random Forest model...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        class_weight='balanced'
    )
    model.fit(X_train_scaled, y_train)
    
    # Evaluate model
    train_score = model.score(X_train_scaled, y_train)
    test_score = model.score(X_test_scaled, y_test)
    
    print(f"Training Accuracy: {train_score:.2%}")
    print(f"Testing Accuracy: {test_score:.2%}")
    
    # Save model and scaler
    print("Saving model and scaler...")
    joblib.dump(model, 'fraud_model.pkl')
    joblib.dump(scaler, 'scaler.pkl')
    
    print("✓ Model training complete!")
    print("✓ Files saved: fraud_model.pkl, scaler.pkl")

if __name__ == "__main__":
    train_model()