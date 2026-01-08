import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Autocomplete,
  TextField,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Switch,
  FormControlLabel,
  CircularProgress,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  ShowChartOutlined as ChartIcon,
  BarChartOutlined as BarChartIcon,
  TrendingUpOutlined as TrendingUpIcon,
  TrendingDownOutlined as TrendingDownIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

const colors = ['#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#00BCD4', '#FFEB3B', '#795548'];

// Calculate technical metrics from price data
const calculateMetrics = (data) => {
  if (!data || data.length < 2) return null;
  
  const prices = data.map(d => d.price).filter(p => p != null);
  if (prices.length < 2) return null;
  
  // Calculate returns
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1] * 100);
  }
  
  // Volatility (standard deviation of returns)
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const volatility = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
  
  // Performance (total return %)
  const performance = ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;
  
  // 5-day and 20-day moving averages
  const sma5 = prices.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, prices.length);
  const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, prices.length);
  
  // RSI calculation (14-period)
  let gains = 0, losses = 0;
  const period = Math.min(14, returns.length);
  for (let i = returns.length - period; i < returns.length; i++) {
    if (returns[i] > 0) gains += returns[i];
    else losses -= returns[i];
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  // Average volume
  const volumes = data.map(d => d.volume).filter(v => v != null);
  const avgVolume = volumes.length > 0 ? volumes.reduce((a, b) => a + b, 0) / volumes.length : 0;
  
  // Price range (high - low) for the period
  const highs = data.map(d => d.high).filter(h => h != null);
  const lows = data.map(d => d.low).filter(l => l != null);
  const priceRange = highs.length > 0 && lows.length > 0 
    ? Math.max(...highs) - Math.min(...lows) 
    : 0;
  
  // Momentum (rate of change)
  const momentum = prices.length >= 10 
    ? ((prices[prices.length - 1] - prices[prices.length - 10]) / prices[prices.length - 10]) * 100 
    : performance;
  
  return {
    volatility: parseFloat(volatility.toFixed(2)),
    performance: parseFloat(performance.toFixed(2)),
    sma5: parseFloat(sma5.toFixed(2)),
    sma20: parseFloat(sma20.toFixed(2)),
    rsi: parseFloat(rsi.toFixed(1)),
    avgVolume: Math.round(avgVolume),
    priceRange: parseFloat(priceRange.toFixed(2)),
    momentum: parseFloat(momentum.toFixed(2)),
  };
};

const API_URL = process.env.REACT_APP_API_BASE_URL || `http://${window.location.hostname}:5002`;

const StockComparison = () => {
  const [selectedStocks, setSelectedStocks] = useState(['TCS.NS', 'RELIANCE.NS']);
  const [stockData, setStockData] = useState({});
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState('line');
  const [timeRange, setTimeRange] = useState('1M');
  const [showPercentage, setShowPercentage] = useState(false);

  const availableStocks = [
    'TCS.NS', 'RELIANCE.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS',
    'HINDUNILVR.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'KOTAKBANK.NS',
    'LT.NS', 'AXISBANK.NS', 'ASIANPAINT.NS', 'MARUTI.NS', 'SUNPHARMA.NS',
    'TITAN.NS', 'BAJFINANCE.NS', 'NESTLEIND.NS', 'WIPRO.NS', 'ULTRACEMCO.NS',
    'HCLTECH.NS', 'POWERGRID.NS', 'NTPC.NS', 'ONGC.NS', 'TATASTEEL.NS'
  ];

  useEffect(() => {
    if (selectedStocks.length > 0) {
      fetchStockData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStocks, timeRange]);

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const promises = selectedStocks.map(async (stock) => {
        try {
          const response = await axios.get(`${API_URL}/api/stocks/historical/${stock}`);
          const historicalData = response.data || [];

          const transformedData = historicalData.map((item) => ({
            date: new Date(item.date).toLocaleDateString(),
            price: item.close,
            volume: item.volume,
            high: item.high,
            low: item.low,
            open: item.open,
            change: item.change ?? null,
            marketCap: item.marketCap ?? null,
            pe: item.pe ?? null,
            dividend: item.dividend ?? null,
          }));

          let filteredData = transformedData;
          if (timeRange === '1D') {
            filteredData = transformedData.slice(-1);
          } else if (timeRange === '1W') {
            filteredData = transformedData.slice(-7);
          } else if (timeRange === '1M') {
            filteredData = transformedData.slice(-30);
          } else if (timeRange === '3M') {
            filteredData = transformedData.slice(-90);
          }

          return { stock, data: filteredData };
        } catch (error) {
          console.error(`Error fetching data for ${stock}:`, error);
          return { stock, data: [] };
        }
      });

      const results = await Promise.all(promises);
      const dataMap = {};
      results.forEach(({ stock, data }) => {
        dataMap[stock] = data;
      });
      setStockData(dataMap);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addStock = (stock) => {
    if (stock && !selectedStocks.includes(stock) && selectedStocks.length < 5) {
      setSelectedStocks([...selectedStocks, stock]);
    }
  };

  const removeStock = (stock) => {
    setSelectedStocks(selectedStocks.filter((s) => s !== stock));
  };

  const getChartData = () => {
    if (Object.keys(stockData).length === 0) return [];

    const dates = stockData[selectedStocks[0]]?.map((item) => item.date) || [];

    return dates.map((date) => {
      const dataPoint = { date };
      selectedStocks.forEach((stock) => {
        const stockItem = stockData[stock]?.find((item) => item.date === date);
        if (stockItem) {
          dataPoint[stock] = showPercentage
            ? ((stockItem.price - stockData[stock][0].price) / stockData[stock][0].price) * 100
            : Number(stockItem.price);
        }
      });
      return dataPoint;
    });
  };

  const getComparisonData = () => {
    return selectedStocks
      .map((stock) => {
        const data = stockData[stock];
        if (!data || data.length === 0) return null;
        const latest = data[data.length - 1];
        const previous = data[data.length - 2] || latest;
        const changePct = (Number(latest.price) && Number(previous.price))
          ? (((Number(latest.price) - Number(previous.price)) / Number(previous.price)) * 100)
          : null;
        
        // Calculate technical metrics
        const metrics = calculateMetrics(data);
        
        return {
          stock,
          price: Number(latest.price) || null,
          change: changePct,
          volume: Number(latest.volume) || null,
          trend: (Number(latest.price) && Number(previous.price) && Number(latest.price) > Number(previous.price)) ? 'up' : 'down',
          // Technical metrics
          volatility: metrics?.volatility || null,
          performance: metrics?.performance || null,
          sma5: metrics?.sma5 || null,
          sma20: metrics?.sma20 || null,
          rsi: metrics?.rsi || null,
          avgVolume: metrics?.avgVolume || null,
          momentum: metrics?.momentum || null,
        };
      })
      .filter(Boolean);
  };

  const getRadarData = () => {
    const comparison = getComparisonData();
    const metrics = ['Performance', 'Momentum', 'RSI', 'Volume', 'Stability'];

    return metrics.map((metric) => {
      const dataPoint = { subject: metric };
      comparison.forEach((stock) => {
        const stockName = stock.stock.replace('.NS', '');
        switch (metric) {
          case 'Performance':
            // Normalize performance to 0-100 scale
            dataPoint[stockName] = Math.min(Math.max((stock.performance || 0) + 50, 0), 100);
            break;
          case 'Momentum':
            // Normalize momentum to 0-100 scale
            dataPoint[stockName] = Math.min(Math.max((stock.momentum || 0) + 50, 0), 100);
            break;
          case 'RSI':
            // RSI is already 0-100
            dataPoint[stockName] = stock.rsi || 50;
            break;
          case 'Volume':
            // Normalize volume (higher is better for liquidity)
            dataPoint[stockName] = Math.min((stock.avgVolume || 0) / 100_000, 100);
            break;
          case 'Stability':
            // Lower volatility = higher stability (invert volatility)
            dataPoint[stockName] = Math.max(100 - (stock.volatility || 0) * 20, 0);
            break;
          default:
            dataPoint[stockName] = 0;
        }
      });
      return dataPoint;
    });
  };

  const chartData = getChartData();
  const comparisonData = getComparisonData();
  const radarData = getRadarData();

  return (
    <Box
      sx={{
        width: '100%',
        p: { xs: 2, sm: 3, md: 4 },
        minHeight: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      <Box sx={{ width: '100%', mx: 'auto', px: { xs: 1, sm: 2, md: 3 } }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
          Stock Comparison Tool
        </Typography>

        {/* Stock Selection */}
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Select Stocks to Compare
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Autocomplete
                options={availableStocks.filter((stock) => !selectedStocks.includes(stock))}
                renderInput={(params) => (
                  <TextField {...params} label="Add Stock" placeholder="Search for stocks..." variant="outlined" size="small" />
                )}
                onChange={(event, value) => {
                  if (value) addStock(value);
                }}
                sx={{ maxWidth: 300 }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {selectedStocks.map((stock, index) => (
                <Chip
                  key={stock}
                  label={stock}
                  onDelete={() => removeStock(stock)}
                  color="primary"
                  variant="outlined"
                  sx={{ borderColor: colors[index % colors.length], color: colors[index % colors.length] }}
                />
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Time Range
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {['1D', '1W', '1M', '3M'].map((range) => (
                    <Button key={range} size="small" variant={timeRange === range ? 'contained' : 'outlined'} onClick={() => setTimeRange(range)}>
                      {range}
                    </Button>
                  ))}
                </Box>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Chart Type
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton color={chartType === 'line' ? 'primary' : 'default'} onClick={() => setChartType('line')}>
                    <ChartIcon />
                  </IconButton>
                  <IconButton color={chartType === 'bar' ? 'primary' : 'default'} onClick={() => setChartType('bar')}>
                    <BarChartIcon />
                  </IconButton>
                </Box>
              </Box>

              <FormControlLabel
                control={<Switch checked={showPercentage} onChange={(e) => setShowPercentage(e.target.checked)} />}
                label="Show as %"
              />
            </Box>
          </CardContent>
        </Card>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && selectedStocks.length > 0 && (
          <Grid container spacing={4}>
            {/* Price Chart */}
            <Grid item xs={12} md={8} lg={8}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Price Comparison {showPercentage ? '(%)' : '(₹)'}
                  </Typography>
                  <Box sx={{ width: '100%', height: { xs: 300, md: 380, lg: 450 } }}>
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'line' ? (
                        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          {selectedStocks.map((stock, index) => (
                            <Line key={stock} type="monotone" dataKey={stock} stroke={colors[index % colors.length]} dot={false} />
                          ))}
                        </LineChart>
                      ) : (
                        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          {selectedStocks.map((stock, index) => (
                            <Bar key={stock} dataKey={stock} fill={colors[index % colors.length]} />
                          ))}
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Radar Chart */}
            <Grid item xs={12} md={4} lg={4}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Radar
                  </Typography>
                  <Box sx={{ width: '100%', height: { xs: 300, md: 380, lg: 450 } }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} outerRadius="85%">
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        {selectedStocks.map((stock, index) => (
                          <Radar key={stock} name={stock.replace('.NS', '')} dataKey={stock.replace('.NS', '')} stroke={colors[index % colors.length]} fill={colors[index % colors.length]} fillOpacity={0.4} />
                        ))}
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Detailed Comparison */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Detailed Comparison
                    <Tooltip title="Technical metrics calculated from historical price data">
                      <InfoIcon fontSize="small" color="action" />
                    </Tooltip>
                  </Typography>
                  <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: 'action.hover' }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>Stock</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Price (₹)</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>
                            <Tooltip title="Daily price change percentage">
                              <span>Change (%)</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>
                            <Tooltip title="Total return over selected period">
                              <span>Performance (%)</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>
                            <Tooltip title="Average trading volume">
                              <span>Avg Volume</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>
                            <Tooltip title="Price volatility (standard deviation of returns)">
                              <span>Volatility</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>
                            <Tooltip title="Relative Strength Index (14-day). Above 70 = overbought, below 30 = oversold">
                              <span>RSI</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>
                            <Tooltip title="5-day Simple Moving Average">
                              <span>SMA-5</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Trend</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {comparisonData.map((row) => (
                          <TableRow key={row.stock} sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                            <TableCell sx={{ fontWeight: 'medium' }}>{row.stock}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                              {row.price !== null ? `₹${row.price.toLocaleString()}` : '—'}
                            </TableCell>
                            <TableCell sx={{ 
                              color: row.change > 0 ? 'success.main' : row.change < 0 ? 'error.main' : 'text.primary',
                              fontWeight: 'medium'
                            }}>
                              {row.change !== null ? `${row.change > 0 ? '+' : ''}${row.change.toFixed(2)}%` : '—'}
                            </TableCell>
                            <TableCell sx={{ 
                              color: row.performance > 0 ? 'success.main' : row.performance < 0 ? 'error.main' : 'text.primary',
                              fontWeight: 'medium'
                            }}>
                              {row.performance !== null ? `${row.performance > 0 ? '+' : ''}${row.performance.toFixed(2)}%` : '—'}
                            </TableCell>
                            <TableCell>
                              {row.avgVolume !== null ? row.avgVolume.toLocaleString() : '—'}
                            </TableCell>
                            <TableCell sx={{ 
                              color: row.volatility > 3 ? 'error.main' : row.volatility > 1.5 ? 'warning.main' : 'success.main'
                            }}>
                              {row.volatility !== null ? `${row.volatility}%` : '—'}
                            </TableCell>
                            <TableCell sx={{ 
                              color: row.rsi > 70 ? 'error.main' : row.rsi < 30 ? 'success.main' : 'text.primary',
                              fontWeight: 'medium'
                            }}>
                              {row.rsi !== null ? row.rsi.toFixed(1) : '—'}
                            </TableCell>
                            <TableCell>
                              {row.sma5 !== null ? `₹${row.sma5.toLocaleString()}` : '—'}
                            </TableCell>
                            <TableCell>
                              {row.trend === 'up' ? (
                                <TrendingUpIcon sx={{ color: 'success.main' }} />
                              ) : (
                                <TrendingDownIcon sx={{ color: 'error.main' }} />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default StockComparison;
