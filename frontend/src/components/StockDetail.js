import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Tab,
  Tabs,
  CircularProgress,
  Alert
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

const API_URL = process.env.REACT_APP_API_BASE_URL || `http://${window.location.hostname}:5001`;

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function StockDetail() {
  const { symbol } = useParams();
  const [historicalData, setHistoricalData] = useState([]);
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log(`Fetching data for ${symbol}`);
        
        // Historical data
        const historicalRes = await axios.get(`${API_URL}/api/stocks/historical/${symbol}`);
        console.log('Historical data:', historicalRes.data);
        setHistoricalData(historicalRes.data);
        
        // Prediction data
        const predictionsRes = await axios.get(`${API_URL}/api/predictions/${symbol}`);
        console.log('Prediction data:', predictionsRes.data);
        setPredictionData(predictionsRes.data);
        
        setError('');
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      fetchData();
    }
  }, [symbol]);

  const chartData = {
    labels: historicalData.map(data => new Date(data.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Stock Price',
        data: historicalData.map(data => data.close),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${symbol} Stock Price History`,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Price: ₹${context.raw.toFixed(2)}`;
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
    },
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>Loading data...</Typography>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom>
              {symbol} Analysis
            </Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
              >
                <Tab label="Price History" />
                <Tab label="Predictions" />
                <Tab label="Technical Indicators" />
              </Tabs>
            </Box>

            {tabValue === 0 && historicalData.length > 0 && (
              <Box sx={{ height: 400 }}>
                <Line data={chartData} options={chartOptions} />
              </Box>
            )}

            {tabValue === 0 && historicalData.length === 0 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="body1">
                  No historical data available for this stock.
                </Typography>
              </Box>
            )}

            {tabValue === 1 && predictionData && predictionData.predictions && (
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Price Predictions
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  {predictionData.predictions.map((prediction, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          {new Date(prediction.date).toLocaleDateString()}
                        </Typography>
                        <Typography variant="h5" color="primary" sx={{ my: 1 }}>
                          ₹{prediction.predictedPrice.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Range: ₹{prediction.confidenceInterval.lower.toFixed(2)} - ₹{prediction.confidenceInterval.upper.toFixed(2)}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
                
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Model: {predictionData.modelType || 'LSTM'} | Accuracy: {(predictionData.modelAccuracy * 100).toFixed(2)}%
                  </Typography>
                </Box>
              </Box>
            )}

            {tabValue === 1 && (!predictionData || !predictionData.predictions) && (
              <Box sx={{ p: 2 }}>
                <Typography variant="body1">
                  No prediction data available for this stock.
                </Typography>
              </Box>
            )}

            {tabValue === 2 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Technical Indicators
                </Typography>
                {predictionData && predictionData.technicalIndicators ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="textSecondary">SMA (14-day)</Typography>
                        <Typography variant="h6">{predictionData.technicalIndicators.lastSMA?.toFixed(2) || 'N/A'}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="textSecondary">RSI (14-day)</Typography>
                        <Typography variant="h6">{predictionData.technicalIndicators.lastRSI?.toFixed(2) || 'N/A'}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="textSecondary">MACD</Typography>
                        <Typography variant="h6">{predictionData.technicalIndicators.lastMACD?.macdLine?.toFixed(2) || 'N/A'}</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                ) : (
                  <Typography variant="body1">
                    Technical indicator data not available.
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default StockDetail;
