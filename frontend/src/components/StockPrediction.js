import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, 
  Grid, 
  Box, 
  Typography, 
  Paper, 
  TextField,
  Button,
  Divider,
  CircularProgress,
  Skeleton
} from '@mui/material';
import {
  TrendingUpOutlined as TrendingUpIcon,
  TrendingDownOutlined as TrendingDownIcon,
  CalendarMonthOutlined as CalendarIcon,
  NewspaperOutlined as NewsIcon,
  AnalyticsOutlined as AnalyticsIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const StockPrediction = () => {
  const { symbol } = useParams();
  const [stockSymbol, setStockSymbol] = useState(symbol || '');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [predictionData, setPredictionData] = useState(null);
  const [newsData, setNewsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (symbol) {
      fetchStockData(symbol);
    }
  }, [symbol]);

  const fetchStockData = async (sym) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch prediction data
      const predResponse = await axios.get(`${API_URL}/api/predictions/${sym}`, {
        params: { startDate }
      });
      
      setPredictionData(predResponse.data);
      
      // Fetch news data
      const newsResponse = await axios.get(`${API_URL}/api/news/${sym}`, {
        params: { days: 7 }
      });
      
      setNewsData(newsResponse.data);
    } catch (err) {
      console.error('Error fetching stock data:', err);
      setError('Failed to fetch stock data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (stockSymbol.trim()) {
      fetchStockData(stockSymbol.trim().toUpperCase());
    }
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getChartData = () => {
    if (!predictionData || !predictionData.predictions) return null;

    const labels = predictionData.predictions.map(p => formatDate(p.date));
    const predictedPrices = predictionData.predictions.map(p => p.predictedPrice);
    const lowerConfidence = predictionData.predictions.map(p => p.confidenceInterval.lower);
    const upperConfidence = predictionData.predictions.map(p => p.confidenceInterval.upper);

    return {
      labels,
      datasets: [
        {
          label: 'Predicted Price',
          data: predictedPrices,
          borderColor: 'rgb(33, 150, 243)',
          backgroundColor: 'rgba(33, 150, 243, 0.5)',
          tension: 0.3,
        },
        {
          label: 'Lower Confidence',
          data: lowerConfidence,
          borderColor: 'rgba(200, 200, 200, 0.5)',
          backgroundColor: 'rgba(200, 200, 200, 0.1)',
          borderDash: [5, 5],
          tension: 0.3,
          fill: '+1',
        },
        {
          label: 'Upper Confidence',
          data: upperConfidence,
          borderColor: 'rgba(200, 200, 200, 0.5)',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          borderDash: [5, 5],
          tension: 0.3,
          fill: false,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ₹${context.raw.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return '₹' + value.toFixed(2);
          }
        }
      }
    }
  };

  const getTrendIcon = (sentiment) => {
    if (!sentiment) return null;
    return sentiment.score > 0 ? 
      <TrendingUpIcon className="text-green-500" /> : 
      <TrendingDownIcon className="text-red-500" />;
  };

  const getSentimentClass = (sentiment) => {
    if (!sentiment) return '';
    if (sentiment.score > 2) return 'text-green-600';
    if (sentiment.score < -2) return 'text-red-600';
    if (sentiment.score > 0) return 'text-green-400';
    if (sentiment.score < 0) return 'text-red-400';
    return 'text-gray-500';
  };

  return (
    <Container maxWidth="lg" className="py-8">
      <Paper className="p-6 mb-8 shadow-lg rounded-xl">
        <Typography variant="h4" className="mb-4 font-bold flex items-center gap-2">
          <AnalyticsIcon className="text-primary" />
          Stock Prediction & News Analysis
        </Typography>
        
        <form onSubmit={handleSubmit} className="mb-6">
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={5}>
              <TextField
                label="Stock Symbol"
                placeholder="Enter stock symbol (e.g., RELIANCE)"
                value={stockSymbol}
                onChange={(e) => setStockSymbol(e.target.value)}
                fullWidth
                variant="outlined"
                required
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                label="Prediction Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button 
                type="submit" 
                variant="contained" 
                fullWidth
                disabled={loading}
                className="h-14 bg-primary"
              >
                {loading ? <CircularProgress size={24} /> : 'Predict'}
              </Button>
            </Grid>
          </Grid>
        </form>

        {error && (
          <Box className="p-4 mb-6 bg-red-100 text-red-800 rounded-lg">
            <Typography>{error}</Typography>
          </Box>
        )}

        {loading ? (
          <Box className="mt-8">
            <Skeleton variant="rectangular" height={300} className="mb-6 rounded-lg" />
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Skeleton variant="rectangular" height={400} className="rounded-lg" />
              </Grid>
              <Grid item xs={12} md={6}>
                <Skeleton variant="rectangular" height={400} className="rounded-lg" />
              </Grid>
            </Grid>
          </Box>
        ) : predictionData ? (
          <>
            <Box className="mb-6">
              <Typography variant="h5" className="mb-4 font-semibold flex items-center gap-2">
                <TrendingUpIcon className="text-primary" />
                Price Prediction for {predictionData.symbol}
              </Typography>
              
              <Box className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
                <div className="h-[300px]">
                  {getChartData() && <Line data={getChartData()} options={chartOptions} />}
                </div>
              </Box>
              
              <Grid container spacing={3} className="mb-2">
                {predictionData.predictions.map((prediction, index) => (
                  <Grid item xs={6} sm={4} md={3} lg={12/7} key={index}>
                    <Paper className="p-3 text-center h-full flex flex-col justify-between hover:shadow-lg transition-shadow">
                      <Typography variant="body2" className="text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1 mb-1">
                        <CalendarIcon fontSize="small" />
                        {formatDate(prediction.date)}
                      </Typography>
                      <Typography variant="h6" className="font-bold text-primary">
                        ₹{prediction.predictedPrice.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" className="text-gray-500">
                        Range: ₹{prediction.confidenceInterval.lower.toFixed(2)} - ₹{prediction.confidenceInterval.upper.toFixed(2)}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
              
              <Box className="mt-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <Typography variant="body2" className="text-gray-700 dark:text-gray-300">
                  Model Accuracy (R²): <span className="font-semibold">{(predictionData.modelAccuracy * 100).toFixed(2)}%</span>
                </Typography>
              </Box>
            </Box>
            
            <Divider className="my-6" />
            
            <Box>
              <Typography variant="h5" className="mb-4 font-semibold flex items-center gap-2">
                <NewsIcon className="text-primary" />
                Recent News for {predictionData.symbol}
              </Typography>
              
              {newsData && newsData.length > 0 ? (
                <Grid container spacing={3}>
                  {newsData.map((news, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Paper className="p-4 h-full hover:shadow-lg transition-shadow">
                        <Box className="flex justify-between items-start mb-2">
                          <Typography variant="caption" className="text-gray-500">
                            {news.source} • {formatDate(news.publishedAt)}
                          </Typography>
                          <Box className="flex items-center">
                            {getTrendIcon(news.sentiment)}
                            <Typography variant={`caption ${getSentimentClass(news.sentiment)}`} className="ml-1">
                              {news.sentiment?.score.toFixed(1)}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="subtitle1" className="font-semibold mb-2">
                          {news.title}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600 dark:text-gray-400 mb-3">
                          {news.description}
                        </Typography>
                        <a 
                          href={news.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm font-medium"
                        >
                          Read full article
                        </a>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                  <Typography>No news available for this stock.</Typography>
                </Box>
              )}
            </Box>
          </>
        ) : (
          <Box className="text-center p-10 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <AnalyticsIcon className="text-gray-400 text-6xl mb-4" />
            <Typography variant="h6" className="mb-2">Enter a Stock Symbol to Get Predictions</Typography>
            <Typography variant="body2" className="text-gray-500 max-w-md mx-auto">
              Get price predictions for the next 7 days and view recent news about the stock to make informed investment decisions.
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default StockPrediction;
const API_URL = process.env.REACT_APP_API_BASE_URL || `http://${window.location.hostname}:5001`;
