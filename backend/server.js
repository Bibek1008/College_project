const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const yahooFinance = require('yahoo-finance2').default;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// Trust proxy for Koyeb/cloud deployments (fixes rate limiter issue)
app.set('trust proxy', 1);

const server = http.createServer(app);
const rawOrigins = process.env.CORS_ORIGIN || "http://localhost:3000";
const allowedOrigins = rawOrigins.split(',').map(s => s.trim()).filter(Boolean);

const originFn = (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
};
const io = socketIo(server, {
    cors: {
        origin: originFn,
        methods: ["GET", "POST"]
    }
});

const port = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors({
    origin: originFn,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Routes
const stockRoutes = require('./routes/stocks');
const predictionRoutes = require('./routes/predictions');
const newsRoutes = require('./routes/news');
const authRoutes = require('./routes/auth');
const portfolioRoutes = require('./routes/portfolio');

app.get('/api', (req, res) => {
    res.json({ status: 'ok' });
});

// Serve test HTML file
app.get('/test', (req, res) => {
    res.sendFile(__dirname + '/test.html');
});

// Serve built React app (only in development or if build exists)
const frontendBuildPath = path.join(__dirname, '../frontend/build');
const fs_check = require('fs');
if (fs_check.existsSync(frontendBuildPath)) {
    app.use(express.static(frontendBuildPath));
}

app.use('/api/stocks', stockRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);

// Catch-all handler: send back React's index.html file for any non-API routes (only if frontend build exists)
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, '../frontend/build', 'index.html');
    if (fs_check.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        // In production on Koyeb, frontend is on Vercel
        res.json({ message: 'API server running. Frontend is hosted separately.', status: 'ok' });
    }
});

// MongoDB connection with error handling
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/stockprediction';

// Remove deprecated options and add better error handling
mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
    socketTimeoutMS: 45000,
}).then(() => {
    console.log("MongoDB database connection established successfully");
}).catch(err => {
    console.log("MongoDB connection failed, continuing without database:", err.message);
    console.log("Auth features will be unavailable, but stock features will work.");
});

const connection = mongoose.connection;

connection.on('error', (err) => {
    console.log("MongoDB connection error:", err.message);
});

connection.on('disconnected', () => {
    console.log("MongoDB disconnected");
});

// WebSocket functionality for real-time stock updates
const watchedStocks = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'ITC', 'SBIN', 'HINDUNILVR', 'BHARTIARTL', 'KOTAKBANK'];
let stockUpdateInterval;
const fs = require('fs');

// Stock name mappings
const stockNames = {
    'RELIANCE': 'Reliance Industries',
    'TCS': 'Tata Consultancy Services',
    'INFY': 'Infosys',
    'HDFCBANK': 'HDFC Bank',
    'ICICIBANK': 'ICICI Bank',
    'ITC': 'ITC Limited',
    'SBIN': 'State Bank of India',
    'HINDUNILVR': 'Hindustan Unilever',
    'BHARTIARTL': 'Bharti Airtel',
    'KOTAKBANK': 'Kotak Mahindra Bank',
    'ASIANPAINT': 'Asian Paints',
    'WIPRO': 'Wipro',
    'LT': 'Larsen & Toubro',
    'MARUTI': 'Maruti Suzuki',
    'TATAMOTORS': 'Tata Motors'
};

// Function to fetch stock data from local JSON files with simulated real-time changes
const fetchLocalStockData = (symbols) => {
    const stockData = [];
    const dataDir = path.join(__dirname, 'ml_training', 'data');
    
    console.log(`📂 Data directory: ${dataDir}`);
    console.log(`📋 Looking for symbols: ${symbols.join(', ')}`);
    
    for (const symbol of symbols) {
        try {
            // Clean symbol (remove .NS if present)
            const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '').toUpperCase();
            const filePath = path.join(dataDir, `${cleanSymbol}_data.json`);
            
            console.log(`🔍 Checking file: ${filePath}`);
            
            if (fs.existsSync(filePath)) {
                const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const data = fileData.data;
                
                if (data && data.length > 0) {
                    // Get latest and previous data
                    const latest = data[data.length - 1];
                    const previous = data[data.length - 2] || latest;
                    
                    // Calculate actual change from historical data
                    const actualChange = latest.close - previous.close;
                    const actualChangePercent = (actualChange / previous.close) * 100;
                    
                    // Add small random fluctuation to simulate real-time (±0.5%)
                    const randomFluctuation = (Math.random() - 0.5) * 0.01 * latest.close;
                    const currentPrice = latest.close + randomFluctuation;
                    const totalChange = currentPrice - previous.close;
                    const totalChangePercent = (totalChange / previous.close) * 100;
                    
                    stockData.push({
                        symbol: cleanSymbol,
                        fullSymbol: `${cleanSymbol}.NS`,
                        name: stockNames[cleanSymbol] || cleanSymbol,
                        price: parseFloat(currentPrice.toFixed(2)),
                        previousClose: previous.close,
                        change: parseFloat(totalChange.toFixed(2)),
                        changePercent: parseFloat(totalChangePercent.toFixed(2)),
                        volume: latest.volume,
                        high: latest.high,
                        low: latest.low,
                        open: latest.open,
                        currency: 'INR',
                        timestamp: new Date().toISOString(),
                        lastUpdate: latest.date,
                        dataSource: 'local'
                    });
                    console.log(`✅ Loaded local data for ${cleanSymbol}`);
                }
            } else {
                console.log(`❌ File not found: ${filePath}`);
            }
        } catch (error) {
            console.log(`Error reading local data for ${symbol}:`, error.message);
        }
    }
    
    console.log(`📊 Loaded ${stockData.length} stocks from local data`);
    return stockData;
};

// Function to format Indian stock symbols
const formatIndianStockSymbol = (symbol) => {
    if (symbol.includes('.')) return symbol;
    
    // Common Indian stock mappings
    const stockMappings = {
        'RELIANCE': 'RELIANCE.NS',
        'TCS': 'TCS.NS',
        'INFY': 'INFY.NS',
        'INFOSYS': 'INFY.NS',
        'HDFCBANK': 'HDFCBANK.NS',
        'HDFC': 'HDFCBANK.NS',
        'ICICIBANK': 'ICICIBANK.NS',
        'ICICI': 'ICICIBANK.NS',
        'ITC': 'ITC.NS',
        'SBIN': 'SBIN.NS',
        'SBI': 'SBIN.NS',
        'HINDUNILVR': 'HINDUNILVR.NS',
        'HUL': 'HINDUNILVR.NS'
    };
    
    return stockMappings[symbol.toUpperCase()] || `${symbol.toUpperCase()}.NS`;
};

// Track Yahoo Finance status
let yahooFinanceAvailable = true;
let lastYahooCheck = 0;
const YAHOO_RETRY_INTERVAL = 60000; // Retry Yahoo Finance every 60 seconds after rate limit

// Function to fetch stock data from Yahoo Finance (primary source)
const fetchYahooFinanceData = async (symbols) => {
    const stockData = [];
    
    // Format symbols for Yahoo Finance
    const formattedSymbols = symbols.map(s => formatIndianStockSymbol(s.replace('.NS', '').replace('.BO', '')));
    
    try {
        const quotes = await yahooFinance.quote(formattedSymbols);
        const quotesArray = Array.isArray(quotes) ? quotes : [quotes];
        
        for (const quote of quotesArray) {
            if (quote && quote.regularMarketPrice) {
                const cleanSymbol = quote.symbol.replace('.NS', '').replace('.BO', '');
                stockData.push({
                    symbol: cleanSymbol,
                    fullSymbol: quote.symbol,
                    name: quote.shortName || quote.longName || stockNames[cleanSymbol] || cleanSymbol,
                    price: parseFloat(quote.regularMarketPrice.toFixed(2)),
                    previousClose: quote.regularMarketPreviousClose || quote.regularMarketPrice,
                    change: parseFloat((quote.regularMarketChange || 0).toFixed(2)),
                    changePercent: parseFloat((quote.regularMarketChangePercent || 0).toFixed(2)),
                    volume: quote.regularMarketVolume || 0,
                    high: quote.regularMarketDayHigh || quote.regularMarketPrice,
                    low: quote.regularMarketDayLow || quote.regularMarketPrice,
                    open: quote.regularMarketOpen || quote.regularMarketPrice,
                    currency: quote.currency || 'INR',
                    timestamp: new Date().toISOString(),
                    dataSource: 'yahoo'
                });
            }
        }
        
        // If we got data, Yahoo is working
        if (stockData.length > 0) {
            yahooFinanceAvailable = true;
            console.log(`✅ Yahoo Finance returned ${stockData.length} stocks (REAL DATA)`);
        }
        
        return stockData;
    } catch (error) {
        // Check if it's a rate limit error
        if (error.message?.includes('Too Many Requests') || error.message?.includes('429')) {
            console.log('⚠️ Yahoo Finance rate limited (429), falling back to local data');
            yahooFinanceAvailable = false;
            lastYahooCheck = Date.now();
        } else {
            console.log('⚠️ Yahoo Finance error:', error.message);
        }
        return [];
    }
};

// Function to fetch real-time stock data - Try Yahoo Finance first, fallback to local
const fetchRealTimeStockData = async (symbols) => {
    // Check if we should retry Yahoo Finance
    const now = Date.now();
    if (!yahooFinanceAvailable && (now - lastYahooCheck) > YAHOO_RETRY_INTERVAL) {
        console.log('🔄 Retrying Yahoo Finance...');
        yahooFinanceAvailable = true;
    }
    
    // Try Yahoo Finance first if available
    if (yahooFinanceAvailable) {
        try {
            const yahooData = await fetchYahooFinanceData(symbols);
            if (yahooData.length > 0) {
                return yahooData;
            }
        } catch (error) {
            console.log('⚠️ Yahoo Finance failed, using local data');
        }
    }
    
    // Fallback to local data
    console.log('📁 Using local data (fallback)');
    return fetchLocalStockData(symbols);
};

// WebSocket connection handling
io.on('connection', async (socket) => {
    console.log('Client connected for real-time updates');
    
    // Send initial stock data immediately
    const initialData = await fetchRealTimeStockData(watchedStocks);
    console.log(`📊 Sending initial data: ${initialData.length} stocks (source: ${initialData[0]?.dataSource || 'unknown'})`);
    if (initialData.length > 0) {
        socket.emit('stockUpdate', initialData);
        console.log('✅ Initial stock data sent to client');
    }
    
    // Handle client requesting to watch specific stocks
    socket.on('watchStocks', async (stocks) => {
        console.log('Client requested to watch stocks:', stocks);
        if (Array.isArray(stocks) && stocks.length > 0) {
            // Clean symbols and fetch
            const cleanSymbols = stocks.map(s => s.replace('.NS', '').replace('.BO', ''));
            const data = await fetchRealTimeStockData(cleanSymbols);
            console.log(`📊 Sending ${data.length} stocks for watched list (source: ${data[0]?.dataSource || 'unknown'})`);
            if (data.length > 0) {
                socket.emit('stockUpdate', data);
            }
        }
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected from real-time updates');
    });
});

// Start real-time stock updates every 10 seconds
const startRealTimeUpdates = () => {
    stockUpdateInterval = setInterval(async () => {
        const stockData = await fetchRealTimeStockData(watchedStocks);
        if (stockData.length > 0) {
            console.log(`📡 Broadcasting update: ${stockData.length} stocks (source: ${stockData[0]?.dataSource || 'unknown'})`);
            io.emit('stockUpdate', stockData);
        }
    }, 10000); // Update every 10 seconds
};

// Start the real-time updates
startRealTimeUpdates();

server.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port: ${port}`);
    console.log('WebSocket server is ready for real-time stock updates');
});
