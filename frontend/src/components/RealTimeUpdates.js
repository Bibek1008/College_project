import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Switch,
  FormControlLabel,
  Button,
  IconButton,
  Tooltip,
  Badge,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUpOutlined as TrendingUpIcon,
  TrendingDownOutlined as TrendingDownIcon,
  RefreshOutlined as RefreshIcon,
  ShowChartOutlined as ChartIcon,
  VolumeUpOutlined as VolumeIcon,
  FlashOnOutlined as FlashIcon,
} from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_BASE_URL || `http://${window.location.hostname}:5002`;

const RealTimeUpdates = ({ darkMode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [stockUpdates, setStockUpdates] = useState([]);
  const [watchlistData, setWatchlistData] = useState({});
  const [watchlist] = useState([
    'TCS.NS', 'RELIANCE.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS',
    'HINDUNILVR.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'KOTAKBANK.NS'
  ]);
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [updateCount, setUpdateCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);
  const previousPrices = useRef({});

  const stockMeta = {
    'TCS.NS': { name: 'Tata Consultancy Services', color: '#2196F3' },
    'RELIANCE.NS': { name: 'Reliance Industries', color: '#4CAF50' },
    'INFY.NS': { name: 'Infosys Limited', color: '#FF9800' },
    'HDFCBANK.NS': { name: 'HDFC Bank', color: '#9C27B0' },
    'ICICIBANK.NS': { name: 'ICICI Bank', color: '#F44336' },
    'HINDUNILVR.NS': { name: 'Hindustan Unilever', color: '#00BCD4' },
    'SBIN.NS': { name: 'State Bank of India', color: '#795548' },
    'BHARTIARTL.NS': { name: 'Bharti Airtel', color: '#607D8B' },
    'ITC.NS': { name: 'ITC Limited', color: '#E91E63' },
    'KOTAKBANK.NS': { name: 'Kotak Mahindra Bank', color: '#3F51B5' },
  };

  // Fetch real stock data from backend
  const fetchStockData = useCallback(async (symbol) => {
    try {
      const response = await axios.get(`${API_URL}/api/stocks/${symbol}`, { timeout: 10000 });
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error.message);
      return null;
    }
  }, []);

  // Fetch all watchlist stocks
  const fetchAllStocks = useCallback(async () => {
    setLoading(true);
    setIsConnected(true);
    
    const results = {};
    const updates = [];
    
    for (const symbol of watchlist) {
      const data = await fetchStockData(symbol);
      if (data) {
        const price = data.regularMarketPrice || data.price;
        const prevClose = data.regularMarketPreviousClose || price;
        const change = data.regularMarketChange || (price - prevClose);
        const changePercent = data.regularMarketChangePercent || ((change / prevClose) * 100);
        const volume = data.regularMarketVolume || data.volume || 0;
        
        // Check if price changed from previous fetch
        const prevPrice = previousPrices.current[symbol];
        const priceChanged = prevPrice && prevPrice !== price;
        
        results[symbol] = {
          price,
          change,
          changePercent,
          volume,
          name: stockMeta[symbol]?.name || data.shortName || symbol,
          lastUpdate: new Date(),
        };
        
        // Create update entry if price changed or first fetch
        if (!prevPrice || priceChanged) {
          updates.push({
            id: Date.now() + Math.random(),
            symbol,
            name: stockMeta[symbol]?.name || data.shortName || symbol,
            price: price.toFixed(2),
            change: change.toFixed(2),
            changePercent: changePercent.toFixed(2),
            volume,
            timestamp: new Date(),
            isPositive: change >= 0,
            isNew: priceChanged,
          });
          
          // Play sound for significant changes
          if (notifications && priceChanged && Math.abs(changePercent) > 1) {
            playNotificationSound();
          }
        }
        
        previousPrices.current[symbol] = price;
      }
    }
    
    setWatchlistData(results);
    
    if (updates.length > 0) {
      setStockUpdates(prev => [...updates, ...prev].slice(0, 50));
      setUpdateCount(prev => prev + updates.length);
    }
    
    setLastFetchTime(new Date());
    setLoading(false);
  }, [watchlist, fetchStockData, notifications]);

  useEffect(() => {
    // Initialize audio for notifications
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchAllStocks();
    
    if (autoRefresh) {
      // Refresh every 30 seconds (to avoid rate limiting)
      intervalRef.current = setInterval(fetchAllStocks, 30000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, fetchAllStocks]);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    if (autoRefresh && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const manualRefresh = () => {
    fetchAllStocks();
  };

  const clearUpdates = () => {
    setStockUpdates([]);
    setUpdateCount(0);
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatVolume = (volume) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  const getUpdateIcon = (update) => {
    if (Math.abs(parseFloat(update.changePercent)) > 2) {
      return <FlashIcon sx={{ color: '#FFD700' }} />;
    }
    return update.isPositive ? (
      <TrendingUpIcon sx={{ color: '#4CAF50' }} />
    ) : (
      <TrendingDownIcon sx={{ color: '#F44336' }} />
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Real-Time Stock Updates
      </Typography>

      {/* Control Panel */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Badge
                  variant="dot"
                  color={isConnected ? 'success' : 'error'}
                  sx={{
                    '& .MuiBadge-dot': {
                      animation: isConnected ? 'pulse 2s infinite' : 'none',
                    },
                  }}
                >
                  <Typography variant="h6">
                    Connection Status
                  </Typography>
                </Badge>
                <Chip
                  label={isConnected ? 'Connected' : 'Disconnected'}
                  color={isConnected ? 'success' : 'error'}
                  variant="outlined"
                />
                {loading && <CircularProgress size={20} />}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoRefresh}
                      onChange={toggleAutoRefresh}
                      color="primary"
                    />
                  }
                  label="Auto Refresh"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Sound Alerts"
                />

                <Tooltip title="Refresh Now">
                  <IconButton onClick={manualRefresh} color="primary" disabled={loading}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>

                <Button
                  variant="outlined"
                  onClick={clearUpdates}
                  size="small"
                >
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              Updates received: {updateCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Watching: {watchlist.length} stocks
            </Typography>
            {lastFetchTime && (
              <Typography variant="body2" color="text.secondary">
                Last updated: {formatTime(lastFetchTime)}
              </Typography>
            )}
            <Chip 
              label="📊 Real Data from NSE" 
              size="small" 
              color="success" 
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Live Updates Feed */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Live Updates Feed
                </Typography>
                <Chip
                  icon={<FlashIcon />}
                  label={`${stockUpdates.length} updates`}
                  color="primary"
                  variant="outlined"
                />
              </Box>

              {stockUpdates.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  {loading ? 'Fetching real stock data...' : 'No updates yet. Click refresh to fetch latest data.'}
                </Alert>
              ) : (
                <List sx={{ maxHeight: 500, overflow: 'auto' }}>
                  {stockUpdates.map((update, index) => (
                    <React.Fragment key={update.id}>
                      <ListItem
                        sx={{
                          borderRadius: 2,
                          mb: 1,
                          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                          '&:hover': {
                            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              backgroundColor: stockMeta[update.symbol]?.color || '#757575',
                              width: 40,
                              height: 40,
                            }}
                          >
                            {getUpdateIcon(update)}
                          </Avatar>
                        </ListItemAvatar>
                        
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                {update.symbol}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {update.name}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                ₹{update.price}
                              </Typography>
                              <Chip
                                label={`${update.isPositive ? '+' : ''}${update.change} (${update.changePercent}%)`}
                                size="small"
                                color={update.isPositive ? 'success' : 'error'}
                                variant="outlined"
                              />
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <VolumeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {formatVolume(update.volume)}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                        
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                          {formatTime(update.timestamp)}
                        </Typography>
                      </ListItem>
                      {index < stockUpdates.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Watchlist */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Watchlist
              </Typography>
              
              <List>
                {watchlist.map((symbol) => {
                  const data = watchlistData[symbol];
                  
                  return (
                    <ListItem key={symbol} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            backgroundColor: stockMeta[symbol]?.color || '#757575',
                            width: 32,
                            height: 32,
                          }}
                        >
                          <ChartIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                      </ListItemAvatar>
                      
                      <ListItemText
                        primary={symbol}
                        secondary={stockMeta[symbol]?.name || symbol}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                      
                      {data ? (
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            ₹{data.price?.toFixed(2)}
                          </Typography>
                          <Typography
                            variant="caption"
                            color={data.changePercent >= 0 ? 'success.main' : 'error.main'}
                          >
                            {data.changePercent >= 0 ? '+' : ''}{data.changePercent?.toFixed(2)}%
                          </Typography>
                        </Box>
                      ) : (
                        <CircularProgress size={16} />
                      )}
                    </ListItem>
                  );
                })}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </Box>
  );
};

export default RealTimeUpdates;