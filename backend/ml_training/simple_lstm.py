import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.preprocessing import MinMaxScaler
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, mean_absolute_error
import joblib
import json
import os
from datetime import datetime, timedelta
import sys

def debug_print(msg):
    """Print debug messages to stderr"""
    print(msg, file=sys.stderr)

class SimpleLSTMPredictor:
    """
    A simplified stock predictor that uses linear regression as a fallback
    when TensorFlow is not available or has compatibility issues.
    """
    
    def __init__(self, sequence_length=60):
        self.sequence_length = sequence_length
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        self.model = None
        self.is_trained = False
        
    def load_local_data(self, symbol):
        """Load data from local JSON files"""
        try:
            data_dir = os.path.join(os.path.dirname(__file__), 'data')
            
            # Clean symbol name (remove .NS, .BO suffixes for file lookup)
            clean_symbol = symbol.replace('.NS', '').replace('.BO', '')
            
            # Try individual file first
            individual_file = os.path.join(data_dir, f'{clean_symbol}_data.json')
            if os.path.exists(individual_file):
                with open(individual_file, 'r') as f:
                    data = json.load(f)
                    return self.convert_json_to_dataframe(data['data'])
            
            # Try master file
            master_file = os.path.join(data_dir, 'popular_nifty50_stocks.json')
            if os.path.exists(master_file):
                with open(master_file, 'r') as f:
                    master_data = json.load(f)
                    if 'stocks' in master_data and clean_symbol in master_data['stocks']:
                        return self.convert_json_to_dataframe(master_data['stocks'][clean_symbol]['data'])
            
            return None
        except Exception as e:
            debug_print(f"Error loading local data for {symbol}: {str(e)}")
            return None
    
    def convert_json_to_dataframe(self, data):
        """Convert JSON data to pandas DataFrame"""
        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['date'])
        df.set_index('date', inplace=True)
        
        # Rename columns to match yfinance format
        df.rename(columns={
            'open': 'Open',
            'high': 'High', 
            'low': 'Low',
            'close': 'Close',
            'volume': 'Volume'
        }, inplace=True)
        
        return df
    
    def download_data(self, symbol, period="5y"):
        """Download stock data (local first, then Yahoo Finance)"""
        try:
            # First, try to load from local data
            local_data = self.load_local_data(symbol)
            if local_data is not None and not local_data.empty:
                debug_print(f"Using local data for {symbol}: {len(local_data)} records")
                return local_data
            
            debug_print(f"No local data for {symbol}, trying Yahoo Finance...")
            
            # Fallback to Yahoo Finance
            stock = yf.Ticker(symbol)
            data = stock.history(period=period)
            
            if data.empty:
                raise ValueError(f"No data found for symbol {symbol}")
                
            return data
        except Exception as e:
            raise Exception(f"Error downloading data for {symbol}: {str(e)}")
    
    def prepare_data(self, data):
        """Prepare data for training"""
        # Use closing prices
        prices = data['Close'].values.reshape(-1, 1)
        
        # Scale the data
        scaled_data = self.scaler.fit_transform(prices)
        
        # Create sequences
        X, y = [], []
        for i in range(self.sequence_length, len(scaled_data)):
            X.append(scaled_data[i-self.sequence_length:i, 0])
            y.append(scaled_data[i, 0])
            
        return np.array(X), np.array(y)
    
    def train(self, symbol, epochs=50, test_size=0.2):
        """Train the model"""
        try:
            # Download data
            data = self.download_data(symbol)
            
            if len(data) < self.sequence_length + 10:
                raise ValueError(f"Insufficient data for {symbol}. Need at least {self.sequence_length + 10} data points.")
            
            # Prepare data
            X, y = self.prepare_data(data)
            
            # Split data
            split_idx = int(len(X) * (1 - test_size))
            X_train, X_test = X[:split_idx], X[split_idx:]
            y_train, y_test = y[:split_idx], y[split_idx:]
            
            # Use Linear Regression as a simple model
            # Flatten X for linear regression
            X_train_flat = X_train.reshape(X_train.shape[0], -1)
            X_test_flat = X_test.reshape(X_test.shape[0], -1)
            
            self.model = LinearRegression()
            self.model.fit(X_train_flat, y_train)
            
            # Make predictions
            train_pred = self.model.predict(X_train_flat)
            test_pred = self.model.predict(X_test_flat)
            
            # Calculate metrics
            train_mse = mean_squared_error(y_train, train_pred)
            test_mse = mean_squared_error(y_test, test_pred)
            train_mae = mean_absolute_error(y_train, train_pred)
            test_mae = mean_absolute_error(y_test, test_pred)
            
            self.is_trained = True
            
            return {
                'success': True,
                'train_mse': float(train_mse),
                'test_mse': float(test_mse),
                'train_mae': float(train_mae),
                'test_mae': float(test_mae),
                'data_points': len(data),
                'training_samples': len(X_train),
                'test_samples': len(X_test)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def predict(self, symbol, days=7):
        """Make predictions"""
        if not self.is_trained:
            return {'success': False, 'error': 'Model not trained'}
        
        try:
            # Get recent data
            data = self.download_data(symbol, period="3mo")
            prices = data['Close'].values.reshape(-1, 1)
            
            # Scale the data
            scaled_data = self.scaler.transform(prices)
            
            # Get last sequence
            last_sequence = scaled_data[-self.sequence_length:].flatten()
            
            predictions = []
            current_sequence = last_sequence.copy()
            
            for _ in range(days):
                # Predict next value
                next_pred = self.model.predict(current_sequence.reshape(1, -1))[0]
                predictions.append(next_pred)
                
                # Update sequence
                current_sequence = np.append(current_sequence[1:], next_pred)
            
            # Inverse transform predictions
            predictions = np.array(predictions).reshape(-1, 1)
            predictions = self.scaler.inverse_transform(predictions)
            
            # Generate dates
            last_date = data.index[-1]
            future_dates = []
            for i in range(1, days + 1):
                future_date = last_date + timedelta(days=i)
                # Skip weekends
                while future_date.weekday() > 4:
                    future_date += timedelta(days=1)
                future_dates.append(future_date.strftime('%Y-%m-%d'))
            
            return {
                'success': True,
                'predictions': [
                    {
                        'date': date,
                        'price': float(pred[0])
                    }
                    for date, pred in zip(future_dates, predictions)
                ],
                'current_price': float(prices[-1][0]),
                'model_type': 'SimpleLinearRegression'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def save_model(self, symbol, model_dir=None):
        """Save the trained model"""
        if not self.is_trained:
            return False
        
        if model_dir is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            model_dir = os.path.join(base_dir, "models")
        os.makedirs(model_dir, exist_ok=True)
        
        try:
            # Save model
            model_path = os.path.join(model_dir, f"{symbol}_model.joblib")
            joblib.dump(self.model, model_path)
            
            # Save scaler
            scaler_path = os.path.join(model_dir, f"{symbol}_scaler.joblib")
            joblib.dump(self.scaler, scaler_path)
            
            # Save metadata
            metadata = {
                'symbol': symbol,
                'sequence_length': self.sequence_length,
                'trained_date': datetime.now().isoformat(),
                'model_type': 'SimpleLinearRegression'
            }
            
            metadata_path = os.path.join(model_dir, f"{symbol}_metadata.json")
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            return True
            
        except Exception as e:
            debug_print(f"Error saving model: {e}")
            return False
    
    def load_model(self, symbol, model_dir=None):
        """Load a trained model"""
        try:
            if model_dir is None:
                base_dir = os.path.dirname(os.path.abspath(__file__))
                model_dir = os.path.join(base_dir, "models")
            # Load model
            model_path = os.path.join(model_dir, f"{symbol}_model.joblib")
            self.model = joblib.load(model_path)
            
            # Load scaler
            scaler_path = os.path.join(model_dir, f"{symbol}_scaler.joblib")
            self.scaler = joblib.load(scaler_path)
            
            # Load metadata
            metadata_path = os.path.join(model_dir, f"{symbol}_metadata.json")
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            self.sequence_length = metadata.get('sequence_length', 60)
            self.is_trained = True
            
            return True
            
        except Exception as e:
            debug_print(f"Error loading model: {e}")
            return False

def main():
    if len(sys.argv) != 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python simple_lstm.py <SYMBOL>'
        }))
        return
    
    symbol = sys.argv[1]
    
    try:
        # Create and train model
        predictor = SimpleLSTMPredictor()
        
        debug_print(f"Training model for {symbol}...")
        result = predictor.train(symbol)
        
        if result['success']:
            # Save the model
            predictor.save_model(symbol)
            
            # Make a test prediction
            pred_result = predictor.predict(symbol, days=7)
            
            if pred_result['success']:
                result['sample_predictions'] = pred_result['predictions'][:3]  # First 3 predictions
                result['current_price'] = pred_result['current_price']
            
            print(json.dumps(result, indent=2))
        else:
            print(json.dumps(result))
            
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e)
        }))

if __name__ == "__main__":
    main()