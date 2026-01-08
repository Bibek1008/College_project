import yfinance as yf
import pandas as pd
import json
from datetime import datetime, timedelta
import os

def download_nifty50_data(years=2):
    """
    Download Nifty 50 data for specified years and save as JSON
    
    Args:
        years (int): Number of years of data to download (default: 2)
    """
    
    # Nifty 50 symbol for Yahoo Finance
    nifty_symbol = "^NSEI"
    
    print(f"Downloading {years} years of Nifty 50 data...")
    
    # Calculate start date (2 years ago from today)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=years*365)
    
    try:
        # Download data
        nifty_data = yf.download(
            nifty_symbol, 
            start=start_date.strftime('%Y-%m-%d'), 
            end=end_date.strftime('%Y-%m-%d'),
            interval='1d'
        )
        
        if len(nifty_data) == 0:
            print("No data found for Nifty 50")
            return None
            
        print(f"Downloaded {len(nifty_data)} days of data")
        
        # Reset index to make Date a column
        nifty_data.reset_index(inplace=True)
        
        # Convert to dictionary format suitable for JSON
        data_dict = {
            'symbol': 'NIFTY50',
            'download_date': datetime.now().isoformat(),
            'period': f"{years} years",
            'total_records': len(nifty_data),
            'start_date': str(nifty_data['Date'].min())[:10],
            'end_date': str(nifty_data['Date'].max())[:10],
            'data': []
        }
        
        # Convert each row to dictionary
        for index, row in nifty_data.iterrows():
            try:
                record = {
                    'date': row['Date'].strftime('%Y-%m-%d') if hasattr(row['Date'], 'strftime') else str(row['Date'])[:10],
                    'open': float(row['Open']) if not pd.isna(row['Open']) else None,
                    'high': float(row['High']) if not pd.isna(row['High']) else None,
                    'low': float(row['Low']) if not pd.isna(row['Low']) else None,
                    'close': float(row['Close']) if not pd.isna(row['Close']) else None,
                    'adj_close': float(row['Adj Close']) if not pd.isna(row['Adj Close']) else None,
                    'volume': int(row['Volume']) if not pd.isna(row['Volume']) else 0
                }
                data_dict['data'].append(record)
            except Exception as e:
                print(f"Error processing row {index}: {e}")
                continue
        
        # Create data directory if it doesn't exist
        data_dir = os.path.join(os.path.dirname(__file__), 'data')
        os.makedirs(data_dir, exist_ok=True)
        
        # Save to JSON file
        filename = f"nifty50_{years}year_data.json"
        filepath = os.path.join(data_dir, filename)
        
        with open(filepath, 'w') as f:
            json.dump(data_dict, f, indent=2, default=str)
        
        print(f"Data saved successfully to: {filepath}")
        print(f"Data range: {data_dict['start_date']} to {data_dict['end_date']}")
        print(f"Total records: {data_dict['total_records']}")
        
        # Display summary statistics
        closes = [record['close'] for record in data_dict['data'] if record['close'] is not None]
        if closes:
            print(f"\nSummary Statistics:")
            print(f"Highest Close: ₹{max(closes):,.2f}")
            print(f"Lowest Close: ₹{min(closes):,.2f}")
            print(f"Average Close: ₹{sum(closes)/len(closes):,.2f}")
            print(f"Latest Close: ₹{closes[-1]:,.2f}")
        
        return data_dict
        
    except Exception as e:
        print(f"Error downloading Nifty 50 data: {str(e)}")
        return None

def load_nifty50_data(filename=None):
    """
    Load Nifty 50 data from JSON file
    
    Args:
        filename (str): JSON filename (optional, defaults to latest)
    
    Returns:
        dict: Loaded data dictionary
    """
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    
    if filename is None:
        filename = "nifty50_2year_data.json"
    
    filepath = os.path.join(data_dir, filename)
    
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        print(f"Loaded Nifty 50 data from: {filepath}")
        print(f"Records: {data['total_records']}")
        print(f"Date range: {data['start_date']} to {data['end_date']}")
        
        return data
        
    except FileNotFoundError:
        print(f"File not found: {filepath}")
        return None
    except Exception as e:
        print(f"Error loading data: {str(e)}")
        return None

if __name__ == "__main__":
    # Download 2 years of Nifty 50 data
    print("=== Nifty 50 Data Downloader ===")
    
    # Download data
    nifty_data = download_nifty50_data(years=2)
    
    if nifty_data:
        print("\n=== Download completed successfully! ===")
        
        # Test loading the data
        print("\n=== Testing data loading ===")
        loaded_data = load_nifty50_data()
        
        if loaded_data:
            print("Data loading test successful!")
            
            # Display first and last few records
            print("\nFirst 3 records:")
            for i, record in enumerate(loaded_data['data'][:3]):
                print(f"{i+1}. Date: {record['date'][:10]}, Close: ₹{record['close']:,.2f}")
            
            print("\nLast 3 records:")
            for i, record in enumerate(loaded_data['data'][-3:]):
                print(f"{len(loaded_data['data'])-2+i}. Date: {record['date'][:10]}, Close: ₹{record['close']:,.2f}")
    else:
        print("Failed to download Nifty 50 data")