import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Divider,
  Chip,
  Skeleton,
  useTheme,
  alpha,
  Avatar,
  LinearProgress,
  Fade,
  Slide,
  Zoom,
  Badge,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  BarChart as BarChartIcon,
  Info as InfoIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
  Analytics as AnalyticsIcon,
  ShowChart as ShowChartIcon,
  AccountBalance as AccountBalanceIcon,
  Insights as InsightsIcon,
  AutoGraph as AutoGraphIcon,
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
const API_URL = process.env.REACT_APP_API_BASE_URL || `http://${window.location.hostname}:5001`;

// Styled components for enhanced UI
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-6px)',
  },
}));

const GlassCard = styled(Card)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.7),
  backdropFilter: 'blur(10px)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const CardHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 2, 0),
}));

const PriceTag = styled(Typography)(({ theme, positive }) => ({
  fontWeight: 700,
  color: positive ? theme.palette.success.main : theme.palette.error.main,
  display: 'flex',
  alignItems: 'center',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

const StyledSearchPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  background: `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -50,
    right: -50,
    width: 100,
    height: 100,
    borderRadius: '50%',
    background: alpha(theme.palette.primary.main, 0.1),
  },
}));

const StatItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: theme.spacing(1, 0),
}));

const TopStocksItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1, 2),
  borderRadius: theme.shape.borderRadius,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    transform: 'translateX(5px)',
  },
}));

function Dashboard() {
  const [symbol, setSymbol] = useState('');
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [topStocks, setTopStocks] = useState([]);
  const [topStocksLoading, setTopStocksLoading] = useState(true);
  const [favorites, setFavorites] = useState(['RELIANCE', 'TCS']);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const navigate = useNavigate();
  const theme = useTheme();

  const handleSearch = async () => {
    if (!symbol.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/api/stocks/${symbol}`);
      setStockData(response.data);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      setError('Failed to fetch stock data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStockClick = (selectedSymbol) => {
    navigate(`/stock/${selectedSymbol || symbol}`);
  };

  const toggleFavorite = (stock) => {
    if (favorites.includes(stock)) {
      setFavorites(favorites.filter(s => s !== stock));
    } else {
      setFavorites([...favorites, stock]);
    }
  };

  // Function to fetch top stocks data
  const fetchTopStocks = async () => {
    setTopStocksLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/stocks`);
      const stocksData = response.data;
      
      // Transform the real data to match our display format
      const transformedStocks = stocksData.map(stock => ({
        symbol: stock.symbol.replace('.NS', '').replace('.BO', ''), // Remove exchange suffix for display
        fullSymbol: stock.symbol, // Keep full symbol for API calls
        price: stock.regularMarketPrice || stock.currentPrice || 0,
        change: stock.regularMarketChangePercent || 0,
        changeValue: stock.regularMarketChange || 0,
        volume: formatVolume(stock.regularMarketVolume || 0),
        marketCap: stock.marketCap || 0,
        shortName: stock.shortName || stock.symbol,
        currency: stock.currency || 'INR'
      }));
      
      setTopStocks(transformedStocks);
    } catch (error) {
      console.error('Error fetching top stocks:', error);
      // Fallback to empty array if API fails
      setTopStocks([]);
    } finally {
      setTopStocksLoading(false);
    }
  };

  // Fetch real stock data on component mount
  useEffect(() => {
    fetchTopStocks();
  }, []);

  // Polling for near real-time updates (Vercel-friendly)
  useEffect(() => {
    let timer;
    if (realTimeUpdates) {
      fetchTopStocks();
      timer = setInterval(fetchTopStocks, 30000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [realTimeUpdates]);

  // Toggle real-time updates
  const toggleRealTimeUpdates = () => {
    setRealTimeUpdates(!realTimeUpdates);
    if (!realTimeUpdates) {
      // If enabling real-time updates, also fetch initial data
      fetchTopStocks();
    }
  };

  // Helper function to format volume numbers
  const formatVolume = (volume) => {
    if (volume >= 1000000000) {
      return (volume / 1000000000).toFixed(1) + 'B';
    } else if (volume >= 1000000) {
      return (volume / 1000000).toFixed(1) + 'M';
    } else if (volume >= 1000) {
      return (volume / 1000).toFixed(1) + 'K';
    }
    return volume.toString();
  };

  // Calculate real market summary from fetched data
  const calculateTotalVolume = () => {
    if (topStocks.length === 0) return '0';
    
    const totalVolume = topStocks.reduce((total, stock) => {
      const vol = parseFloat(stock.volume.replace(/[BMK]/g, '')) || 0;
      const multiplier = stock.volume.includes('B') ? 1000000000 : 
                        stock.volume.includes('M') ? 1000000 : 
                        stock.volume.includes('K') ? 1000 : 1;
      return total + (vol * multiplier);
    }, 0);
    
    return formatVolume(totalVolume);
  };

  const marketSummary = {
    marketStatus: topStocks.length > 0 ? 'Open' : 'Loading...',
    topGainers: topStocks.filter(stock => stock.change > 0).length,
    topLosers: topStocks.filter(stock => stock.change < 0).length,
    tradingVolume: calculateTotalVolume(),
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          fontWeight="700"
          gutterBottom
          sx={{
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          Stock Market Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Track, analyze, and predict stock performance with real-time data
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Search Bar */}
        <Grid item xs={12}>
          <StyledSearchPaper elevation={3}>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Search for Stocks
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
              }}
            >
              <TextField
                fullWidth
                label="Enter Stock Symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., RELIANCE"
                variant="outlined"
                InputProps={{
                  sx: { borderRadius: 2 },
                }}
              />
              <Button
                variant="contained"
                size="large"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                sx={{
                  minWidth: { xs: '100%', sm: '180px' },
                  borderRadius: 2,
                  fontWeight: 600,
                }}
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </Box>

            {error && (
              <Typography
                color="error"
                variant="body2"
                sx={{ mt: 2 }}
              >
                {error}
              </Typography>
            )}

            {loading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress color="primary" />
              </Box>
            )}
          </StyledSearchPaper>
        </Grid>

        {/* Market Summary Card */}
        <Grid item xs={12} md={4}>
          <GlassCard elevation={3}>
            <CardHeader>
              <Typography variant="h6" fontWeight="600">
                Market Summary
              </Typography>
              <Chip 
                color="success" 
                size="small" 
                label={marketSummary.marketStatus}
                sx={{ fontWeight: 'bold' }}
              />
            </CardHeader>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <StatItem>
                    <Typography variant="body2" color="text.secondary">
                      Top Gainers
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TrendingUpIcon color="success" sx={{ mr: 0.5 }} />
                      <Typography variant="h6" fontWeight="600">
                        {marketSummary.topGainers}
                      </Typography>
                    </Box>
                  </StatItem>
                </Grid>
                <Grid item xs={6}>
                  <StatItem>
                    <Typography variant="body2" color="text.secondary">
                      Top Losers
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TrendingDownIcon color="error" sx={{ mr: 0.5 }} />
                      <Typography variant="h6" fontWeight="600">
                        {marketSummary.topLosers}
                      </Typography>
                    </Box>
                  </StatItem>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <StatItem>
                    <Typography variant="body2" color="text.secondary">
                      Trading Volume
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BarChartIcon color="primary" sx={{ mr: 0.5 }} />
                      <Typography variant="h6" fontWeight="600">
                        {marketSummary.tradingVolume}
                      </Typography>
                    </Box>
                  </StatItem>
                </Grid>
              </Grid>
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end', mt: 'auto' }}>
              <Button 
                size="small" 
                startIcon={<RefreshIcon />} 
                sx={{ ml: 'auto' }}
              >
                Refresh
              </Button>
            </CardActions>
          </GlassCard>
        </Grid>

        {/* Top Stocks Card */}
        <Grid item xs={12} md={8}>
          <StyledCard elevation={3}>
            <CardHeader>
              <Typography variant="h6" fontWeight="600">
                Top Stocks
              </Typography>
              <Box>
                <Chip 
                  icon={<TimelineIcon />} 
                  label="Trending" 
                  size="small"
                  color="primary" 
                  variant="outlined"
                  sx={{ mr: 1 }}
                />
                <Tooltip title={realTimeUpdates ? "Disable Real-time Updates" : "Enable Real-time Updates"}>
                  <IconButton 
                    size="small" 
                    onClick={toggleRealTimeUpdates}
                    color={realTimeUpdates ? "success" : "default"}
                    sx={{ mr: 1 }}
                  >
                    <Badge variant="dot" color={realTimeUpdates ? "success" : "default"}>
                      <RefreshIcon fontSize="small" />
                    </Badge>
                  </IconButton>
                </Tooltip>
                <IconButton size="small" onClick={fetchTopStocks} disabled={topStocksLoading}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Box>
            </CardHeader>
            <CardContent>
              <Box>
                {topStocksLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : topStocks.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No stock data available
                    </Typography>
                  </Box>
                ) : (
                  topStocks.map((stock) => (
                    <TopStocksItem 
                      key={stock.symbol}
                      onClick={() => handleStockClick(stock.fullSymbol || stock.symbol)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            width: 36,
                            height: 36,
                            mr: 2,
                          }}
                        >
                          {stock.symbol.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="600">
                            {stock.shortName || stock.symbol}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Vol: {stock.volume}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ mr: 2, textAlign: 'right' }}>
                          <Typography variant="subtitle2" fontWeight="600">
                            {stock.currency === 'USD' ? '$' : '₹'}{stock.price.toFixed(2)}
                          </Typography>
                          <Typography
                            variant="body2"
                            color={stock.change > 0 ? 'success.main' : 'error.main'}
                            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
                          >
                            {stock.change > 0 ? <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} /> : <TrendingDownIcon fontSize="small" sx={{ mr: 0.5 }} />}
                            {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}%
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(stock.symbol);
                          }}
                        >
                          {favorites.includes(stock.symbol) ? (
                            <StarIcon fontSize="small" color="primary" />
                          ) : (
                            <StarBorderIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Box>
                    </TopStocksItem>
                  ))
                )}
              </Box>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', p: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/predictions')}
                endIcon={<TrendingUpIcon />}
              >
                View Market Predictions
              </Button>
            </CardActions>
          </StyledCard>
        </Grid>

        {/* Stock Info */}
        {stockData && (
          <>
            <Grid item xs={12} md={6}>
              <StyledCard elevation={3} onClick={handleStockClick}>
                <CardHeader>
                  <Typography variant="h6" fontWeight="600">
                    {stockData.longName || symbol}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(symbol);
                    }}
                  >
                    {favorites.includes(symbol) ? (
                      <StarIcon color="primary" />
                    ) : (
                      <StarBorderIcon />
                    )}
                  </IconButton>
                </CardHeader>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PriceTag
                      variant="h4"
                      positive={stockData.regularMarketChange > 0}
                    >
                      ₹{stockData.regularMarketPrice?.toFixed(2)}
                      {stockData.regularMarketChange > 0 ? 
                        <TrendingUpIcon sx={{ ml: 1 }} /> : 
                        <TrendingDownIcon sx={{ ml: 1 }} />
                      }
                    </PriceTag>
                  </Box>
                  <Typography
                    variant="body1"
                    color={stockData.regularMarketChange > 0 ? 'success.main' : 'error.main'}
                    sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                  >
                    {stockData.regularMarketChange > 0 ? '+' : ''}
                    {stockData.regularMarketChange?.toFixed(2)} (
                    {stockData.regularMarketChangePercent?.toFixed(2)}%)
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Click to view detailed analysis
                  </Typography>
                </CardContent>
              </StyledCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <StyledCard elevation={3}>
                <CardHeader>
                  <Typography variant="h6" fontWeight="600">
                    Key Statistics
                  </Typography>
                  <Chip 
                    icon={<InfoIcon />} 
                    label="Real-time" 
                    size="small"
                    color="secondary" 
                    variant="outlined"
                  />
                </CardHeader>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <StatItem>
                        <Typography variant="body2" color="text.secondary">
                          Open
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="600">
                          ₹{stockData.regularMarketOpen?.toFixed(2)}
                        </Typography>
                      </StatItem>
                    </Grid>
                    <Grid item xs={6}>
                      <StatItem>
                        <Typography variant="body2" color="text.secondary">
                          Previous Close
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="600">
                          ₹{stockData.regularMarketPreviousClose?.toFixed(2)}
                        </Typography>
                      </StatItem>
                    </Grid>
                    <Grid item xs={6}>
                      <StatItem>
                        <Typography variant="body2" color="text.secondary">
                          Day's Range
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="600">
                          ₹{stockData.regularMarketDayLow?.toFixed(2)} - ₹
                          {stockData.regularMarketDayHigh?.toFixed(2)}
                        </Typography>
                      </StatItem>
                    </Grid>
                    <Grid item xs={6}>
                      <StatItem>
                        <Typography variant="body2" color="text.secondary">
                          Volume
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="600">
                          {stockData.regularMarketVolume?.toLocaleString()}
                        </Typography>
                      </StatItem>
                    </Grid>
                  </Grid>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', mt: 'auto' }}>
                  <Button 
                    size="small" 
                    color="primary" 
                    onClick={handleStockClick}
                  >
                    View Details
                  </Button>
                </CardActions>
              </StyledCard>
            </Grid>
          </>
        )}
      </Grid>
    </Container>
  );
}

export default Dashboard;
