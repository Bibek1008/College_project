const router = require('express').Router();
const yahooFinance = require('yahoo-finance2').default;
const fs = require('fs');
const path = require('path');

// Helper function to load local stock data
const loadLocalStockData = (symbol) => {
  try {
    const dataDir = path.join(__dirname, '..', 'ml_training', 'data');
    
    // Clean symbol name (remove .NS, .BO suffixes for file lookup)
    const cleanSymbol = symbol.replace(/\.(NS|BO)$/, '');
    
    // Try individual file first
    const individualFile = path.join(dataDir, `${cleanSymbol}_data.json`);
    if (fs.existsSync(individualFile)) {
      const data = JSON.parse(fs.readFileSync(individualFile, 'utf8'));
      return data.data; // Return the data array
    }
    
    // Try master file
    const masterFile = path.join(dataDir, 'popular_nifty50_stocks.json');
    if (fs.existsSync(masterFile)) {
      const masterData = JSON.parse(fs.readFileSync(masterFile, 'utf8'));
      if (masterData.stocks && masterData.stocks[cleanSymbol]) {
        return masterData.stocks[cleanSymbol].data;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error loading local data for ${symbol}:`, error.message);
    return null;
  }
};

// Get available local symbols
const getAvailableLocalSymbols = () => {
  try {
    const dataDir = path.join(__dirname, '..', 'ml_training', 'data');
    const masterFile = path.join(dataDir, 'popular_nifty50_stocks.json');
    
    if (fs.existsSync(masterFile)) {
      const masterData = JSON.parse(fs.readFileSync(masterFile, 'utf8'));
      return Object.keys(masterData.stocks || {});
    }
    return [];
  } catch (error) {
    return [];
  }
};

// Helper function to format symbol for Indian stocks
const formatIndianStockSymbol = (symbol) => {
  if (symbol.includes('.NS') || symbol.includes('.BO')) {
    return symbol;
  }
  return `${symbol}.NS`;
};

// Convert local data to quote format
const localDataToQuote = (symbol, data) => {
  if (!data || data.length === 0) return null;
  
  const latest = data[data.length - 1];
  const previous = data.length > 1 ? data[data.length - 2] : latest;
  const change = latest.close - previous.close;
  const changePercent = (change / previous.close) * 100;
  
  // Clean symbol for display
  const cleanSymbol = symbol.replace(/\.(NS|BO)$/, '');
  
  return {
    symbol: symbol,
    shortName: cleanSymbol,
    longName: `${cleanSymbol} Ltd.`,
    regularMarketPrice: latest.close,
    regularMarketOpen: latest.open,
    regularMarketDayHigh: latest.high,
    regularMarketDayLow: latest.low,
    regularMarketVolume: latest.volume,
    regularMarketChange: parseFloat(change.toFixed(2)),
    regularMarketChangePercent: parseFloat(changePercent.toFixed(2)),
    regularMarketPreviousClose: previous.close,
    regularMarketTime: new Date(latest.date),
    currency: 'INR',
    exchange: symbol.includes('.BO') ? 'BSE' : 'NSE',
    dataSource: 'local'
  };
};

// Get stock data (local first, then Yahoo Finance)
router.get('/:symbol', async (req, res) => {
  try {
    let { symbol } = req.params;
    const { exchange } = req.query;
    
    // Format symbol for Indian exchanges
    if (exchange === 'BSE') {
      symbol = symbol.includes('.BO') ? symbol : `${symbol}.BO`;
    } else {
      symbol = formatIndianStockSymbol(symbol);
    }
    
    // Try local data first
    const localData = loadLocalStockData(symbol);
    if (localData && localData.length > 0) {
      console.log(`Using local data for ${symbol}`);
      const quote = localDataToQuote(symbol, localData);
      return res.json(quote);
    }
    
    // Fallback to Yahoo Finance
    console.log(`No local data for ${symbol}, trying Yahoo Finance...`);
    const result = await yahooFinance.quote(symbol);
    res.json(result);
  } catch (error) {
    console.error(`Error fetching ${req.params.symbol}:`, error.message);
    res.status(400).json({ error: error.message });
  }
});

// Get historical data (local first, then Yahoo Finance)
router.get('/historical/:symbol', async (req, res) => {
  try {
    let { symbol } = req.params;
    const { exchange } = req.query;
    
    // Format symbol for Indian exchanges
    if (exchange === 'BSE') {
      symbol = symbol.includes('.BO') ? symbol : `${symbol}.BO`;
    } else {
      symbol = formatIndianStockSymbol(symbol);
    }
    
    // Try local data first
    const localData = loadLocalStockData(symbol);
    if (localData && localData.length > 0) {
      console.log(`Using local historical data for ${symbol}: ${localData.length} records`);
      const formattedData = localData.map(record => ({
        date: new Date(record.date),
        open: record.open,
        high: record.high,
        low: record.low,
        close: record.close,
        volume: record.volume
      }));
      return res.json(formattedData);
    }
    
    // Fallback to Yahoo Finance
    console.log(`No local data for ${symbol}, trying Yahoo Finance...`);
    const queryOptions = {
      period1: new Date(Date.now() - (365 * 24 * 60 * 60 * 1000)),
      period2: new Date(),
      interval: '1d'
    };
    const result = await yahooFinance.historical(symbol, queryOptions);
    res.json(result);
  } catch (error) {
    console.error(`Error fetching historical data for ${req.params.symbol}:`, error.message);
    res.status(400).json({ error: error.message });
  }
});

// Get popular Indian stocks (from local data)
router.get('/', async (req, res) => {
  try {
    // Get available local symbols
    const localSymbols = getAvailableLocalSymbols();
    
    if (localSymbols.length > 0) {
      console.log(`Loading ${localSymbols.length} stocks from local data`);
      
      // Take top 10 popular stocks
      const popularSymbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'BHARTIARTL', 'ITC', 'KOTAKBANK', 'HINDUNILVR', 'SBIN'];
      const symbolsToLoad = popularSymbols.filter(s => localSymbols.includes(s)).slice(0, 10);
      
      const results = symbolsToLoad.map(symbol => {
        const localData = loadLocalStockData(symbol);
        if (localData && localData.length > 0) {
          return localDataToQuote(`${symbol}.NS`, localData);
        }
        return null;
      }).filter(r => r !== null);
      
      if (results.length > 0) {
        return res.json(results);
      }
    }
    
    // Fallback to Yahoo Finance if no local data
    console.log('No local data available, trying Yahoo Finance...');
    const popularStocks = [
      'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS'
    ];
    
    const results = await Promise.all(
      popularStocks.map(async (symbol) => {
        try {
          const data = await yahooFinance.quote(symbol);
          return data;
        } catch (error) {
          console.error(`Error fetching ${symbol}:`, error.message);
          return null;
        }
      })
    );
    
    res.json(results.filter(result => result !== null));
  } catch (error) {
    console.error('Error fetching popular stocks:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Get available symbols
router.get('/available/symbols', async (req, res) => {
  try {
    const localSymbols = getAvailableLocalSymbols();
    res.json({
      symbols: localSymbols,
      count: localSymbols.length,
      dataSource: 'local'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 