#!/usr/bin/env python3
"""
Popular Nifty 50 Stocks Data Downloader
Downloads data for the most popular Nifty 50 stocks
"""

import yfinance as yf
import json
import pandas as pd
from datetime import datetime, timedelta
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

# Popular Nifty 50 stocks with their correct symbols
POPULAR_NIFTY50_STOCKS = {
    'RELIANCE': 'RELIANCE.NS',
    'TCS': 'TCS.NS', 
    'INFY': 'INFY.NS',
    'HDFCBANK': 'HDFCBANK.NS',
    'ICICIBANK': 'ICICIBANK.NS',
    'HINDUNILVR': 'HINDUNILVR.NS',
    'ITC': 'ITC.NS',
    'SBIN': 'SBIN.NS',
    'BHARTIARTL': 'BHARTIARTL.NS',
    'KOTAKBANK': 'KOTAKBANK.NS',
    'LT': 'LT.NS',
    'ASIANPAINT': 'ASIANPAINT.NS',
    'MARUTI': 'MARUTI.NS',
    'HCLTECH': 'HCLTECH.NS',
    'AXISBANK': 'AXISBANK.NS',
    'WIPRO': 'WIPRO.NS',
    'ULTRACEMCO': 'ULTRACEMCO.NS',
    'TITAN': 'TITAN.NS',
    'NESTLEIND': 'NESTLEIND.NS',
    'POWERGRID': 'POWERGRID.NS',
    'NTPC': 'NTPC.NS',
    'TECHM': 'TECHM.NS',
    'BAJFINANCE': 'BAJFINANCE.NS',
    'M&M': 'M&M.NS',
    'SUNPHARMA': 'SUNPHARMA.NS'
}

def download_stock_data(symbol, yahoo_symbol, years=2):
    """
    Download data for a single stock
    
    Args:
        symbol (str): Stock symbol (e.g., 'RELIANCE')
        yahoo_symbol (str): Yahoo Finance symbol (e.g., 'RELIANCE.NS')
        years (int): Years of data to download
    
    Returns:
        dict: Stock data or None if failed
    """
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=years*365)
    
    try:
        print(f"📊 Downloading {symbol} ({yahoo_symbol})...")
        
        # Download data
        ticker = yf.Ticker(yahoo_symbol)
        data = ticker.history(
            start=start_date.strftime('%Y-%m-%d'),
            end=end_date.strftime('%Y-%m-%d'),
            interval='1d'
        )
        
        if data.empty:
            print(f"❌ No data found for {symbol}")
            return None
        
        # Convert to JSON format
        json_data = []
        for date_index in data.index:
            try:
                row = data.loc[date_index]
                record = {
                    'date': date_index.strftime('%Y-%m-%d'),
                    'open': round(float(row['Open']), 2),
                    'high': round(float(row['High']), 2),
                    'low': round(float(row['Low']), 2),
                    'close': round(float(row['Close']), 2),
                    'volume': int(row['Volume'])
                }
                json_data.append(record)
            except Exception as e:
                continue
        
        if not json_data:
            print(f"❌ Failed to process data for {symbol}")
            return None
        
        stock_data = {
            'symbol': symbol,
            'yahoo_symbol': yahoo_symbol,
            'download_date': datetime.now().isoformat(),
            'period': f"{years} years",
            'total_records': len(json_data),
            'start_date': json_data[0]['date'],
            'end_date': json_data[-1]['date'],
            'data': json_data
        }
        
        # Calculate summary stats
        closes = [record['close'] for record in json_data]
        stock_data['stats'] = {
            'highest_close': max(closes),
            'lowest_close': min(closes),
            'average_close': round(sum(closes) / len(closes), 2),
            'latest_close': closes[-1]
        }
        
        print(f"✅ {symbol}: {len(json_data)} records (₹{closes[-1]:.2f})")
        return stock_data
        
    except Exception as e:
        print(f"❌ Error downloading {symbol}: {str(e)}")
        return None

def download_all_stocks(years=2, max_workers=5):
    """
    Download data for all popular Nifty 50 stocks
    
    Args:
        years (int): Years of data to download
        max_workers (int): Number of concurrent downloads
    
    Returns:
        dict: All downloaded stock data
    """
    
    print("🚀 Starting Popular Nifty 50 Stocks Download")
    print(f"📅 Downloading {years} years of data")
    print(f"📊 Stocks to download: {len(POPULAR_NIFTY50_STOCKS)}")
    print("-" * 60)
    
    all_data = {
        'download_info': {
            'timestamp': datetime.now().isoformat(),
            'period': f"{years} years",
            'total_stocks': len(POPULAR_NIFTY50_STOCKS),
            'successful_downloads': 0,
            'failed_downloads': 0
        },
        'stocks': {}
    }
    
    # Download with thread pool for faster execution
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all download tasks
        future_to_symbol = {
            executor.submit(download_stock_data, symbol, yahoo_symbol, years): symbol
            for symbol, yahoo_symbol in POPULAR_NIFTY50_STOCKS.items()
        }
        
        # Collect results as they complete
        for future in as_completed(future_to_symbol):
            symbol = future_to_symbol[future]
            try:
                stock_data = future.result()
                if stock_data:
                    all_data['stocks'][symbol] = stock_data
                    all_data['download_info']['successful_downloads'] += 1
                else:
                    all_data['download_info']['failed_downloads'] += 1
                    
            except Exception as e:
                print(f"❌ Exception for {symbol}: {str(e)}")
                all_data['download_info']['failed_downloads'] += 1
            
            # Small delay to avoid overwhelming the API
            time.sleep(0.1)
    
    return all_data

def save_data(all_data):
    """Save downloaded data to JSON files"""
    
    # Create data directory
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    # Save complete dataset
    master_file = os.path.join(data_dir, 'popular_nifty50_stocks.json')
    with open(master_file, 'w') as f:
        json.dump(all_data, f, indent=2)
    
    print(f"\n💾 Master file saved: {master_file}")
    
    # Save individual stock files
    individual_count = 0
    for symbol, stock_data in all_data['stocks'].items():
        individual_file = os.path.join(data_dir, f'{symbol}_data.json')
        with open(individual_file, 'w') as f:
            json.dump(stock_data, f, indent=2)
        individual_count += 1
    
    print(f"💾 Individual files saved: {individual_count}")
    
    return master_file

def print_summary(all_data):
    """Print download summary"""
    
    info = all_data['download_info']
    
    print("\n" + "="*60)
    print("📈 DOWNLOAD SUMMARY")
    print("="*60)
    print(f"🎯 Total Stocks Attempted: {info['total_stocks']}")
    print(f"✅ Successfully Downloaded: {info['successful_downloads']}")
    print(f"❌ Failed Downloads: {info['failed_downloads']}")
    print(f"📊 Success Rate: {(info['successful_downloads']/info['total_stocks']*100):.1f}%")
    print(f"⏰ Downloaded at: {info['timestamp'][:19]}")
    
    if all_data['stocks']:
        print(f"\n📋 SUCCESSFUL DOWNLOADS:")
        for symbol, stock_data in sorted(all_data['stocks'].items()):
            stats = stock_data['stats']
            print(f"  📈 {symbol:12} | Records: {stock_data['total_records']:4} | Latest: ₹{stats['latest_close']:8.2f} | Range: ₹{stats['lowest_close']:.2f} - ₹{stats['highest_close']:.2f}")

def main():
    """Main function"""
    
    print("🏛️  NIFTY 50 POPULAR STOCKS DOWNLOADER")
    print("="*60)
    
    # Download all stocks (2 years of data)
    all_data = download_all_stocks(years=2, max_workers=3)
    
    # Save data
    master_file = save_data(all_data)
    
    # Print summary
    print_summary(all_data)
    
    print(f"\n🎉 Download completed! Data saved to:")
    print(f"📁 {os.path.dirname(master_file)}")
    
    return all_data

if __name__ == "__main__":
    main()