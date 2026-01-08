import React, { useState, useEffect } from 'react';
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
  LinearProgress,
  Button,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Switch,
  FormControlLabel,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  SentimentVeryDissatisfiedOutlined as NegativeIcon,
  SentimentNeutralOutlined as NeutralIcon,
  SentimentVerySatisfiedOutlined as PositiveIcon,
  TrendingUpOutlined as TrendingUpIcon,
  TrendingDownOutlined as TrendingDownIcon,
  ArticleOutlined as NewsIcon,
  RefreshOutlined as RefreshIcon,
  ExpandMoreOutlined as ExpandMoreIcon,
  PsychologyOutlined as AIIcon,
  AnalyticsOutlined as AnalyticsIcon,
  ShowChartOutlined as ChartIcon,
  TimelineOutlined as TimelineIcon,
  AutoAwesomeOutlined as AutoAwesomeIcon,
  FilterListOutlined as FilterIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, LineChart, Line, Area, AreaChart } from 'recharts';

const SentimentAnalysis = ({ darkMode }) => {
  const [sentimentData, setSentimentData] = useState([]);
  const [overallSentiment, setOverallSentiment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedStock, setSelectedStock] = useState('TCS.NS');
  const [searchSymbol, setSearchSymbol] = useState('');
  const [exchange, setExchange] = useState('NSE');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  const stocks = [
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services' },
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
    { symbol: 'INFY.NS', name: 'Infosys Limited' },
    { symbol: 'HDFC.NS', name: 'HDFC Bank' },
    { symbol: 'ICICI.NS', name: 'ICICI Bank' },
  ];

  const sentimentColors = {
    positive: '#4CAF50',
    negative: '#F44336',
    neutral: '#FF9800',
  };

  useEffect(() => {
    generateSentimentData();
    if (autoRefresh) {
      const interval = setInterval(generateSentimentData, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedStock, autoRefresh, timeRange]);

  const generateSentimentData = async () => {
    setLoading(true);
    
    try {
      const response = await axios.get(`${API_URL}/api/news/${selectedStock}`, { params: { exchange } });
      const newsArray = Array.isArray(response.data) ? response.data : [];

      const transformedNews = newsArray.map((article, index) => {
        const label = getSentimentLabel(article.sentiment?.score ?? 0);
        const ts = new Date(article.publishedAt);
        return {
          id: index + 1,
          headline: article.title,
          sentiment: label,
          confidence: Math.min(1, Math.abs(article.sentiment?.comparative ?? 0)),
          source: article.source,
          timestamp: ts,
          impact: getImpactLevel(article.sentiment?.score ?? 0),
          keywords: extractKeywords(article.description),
          description: article.description,
          url: article.url,
          sentimentScore: article.sentiment?.score ?? 0,
          sentimentDetails: article.sentiment?.details ?? {},
          time: ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          positive: label === 'positive' ? 1 : 0,
          neutral: label === 'neutral' ? 1 : 0,
          negative: label === 'negative' ? 1 : 0,
        };
      });

      setSentimentData(transformedNews);

      if (transformedNews.length > 0) {
        const avgSentiment = transformedNews.reduce((sum, item) => sum + item.sentimentScore, 0) / transformedNews.length;
        const positiveCount = transformedNews.filter(item => item.sentiment === 'positive').length;
        const negativeCount = transformedNews.filter(item => item.sentiment === 'negative').length;
        const neutralCount = transformedNews.filter(item => item.sentiment === 'neutral').length;
        const avgConfidence = transformedNews.reduce((sum, item) => sum + item.confidence, 0) / transformedNews.length;

        setOverallSentiment({
          score: avgSentiment,
          sentiment: getSentimentLabel(avgSentiment),
          percentages: {
            positive: (positiveCount / transformedNews.length) * 100,
            negative: (negativeCount / transformedNews.length) * 100,
            neutral: (neutralCount / transformedNews.length) * 100,
          },
          totalArticles: transformedNews.length,
          confidence: avgConfidence,
        });
      } else {
        setOverallSentiment(null);
      }

    } catch (error) {
      console.error('Error fetching sentiment data:', error);
      // Fallback to empty data if API fails
      setSentimentData([]);
      setOverallSentiment(null);
    } finally {
      setLoading(false);
    }
  };

  const applySearch = () => {
    if (!searchSymbol.trim()) return;
    const raw = searchSymbol.trim().toUpperCase();
    const formatted = exchange === 'BSE'
      ? (raw.includes('.BO') ? raw : `${raw}.BO`)
      : (raw.includes('.') ? raw : `${raw}.NS`);
    setSelectedStock(formatted);
  };

  // Helper function to convert sentiment score to label
  const getSentimentLabel = (score) => {
    if (score > 0.5) return 'positive';
    if (score < -0.5) return 'negative';
    return 'neutral';
  };

  // Helper function to determine impact level
  const getImpactLevel = (score) => {
    const absScore = Math.abs(score);
    if (absScore > 2) return 'high';
    if (absScore > 1) return 'medium';
    return 'low';
  };

  // Helper function to extract keywords from description
  const extractKeywords = (description) => {
    if (!description) return [];
    const words = description.toLowerCase().split(' ');
    const financialKeywords = ['earnings', 'revenue', 'profit', 'growth', 'market', 'stock', 'investment', 'trading', 'volatility', 'partnership', 'strategy', 'expansion', 'decline', 'rally', 'bullish', 'bearish'];
    return words.filter(word => financialKeywords.includes(word)).slice(0, 3);
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return <PositiveIcon sx={{ color: sentimentColors.positive }} />;
      case 'negative':
        return <NegativeIcon sx={{ color: sentimentColors.negative }} />;
      default:
        return <NeutralIcon sx={{ color: sentimentColors.neutral }} />;
    }
  };

  const getSentimentColor = (sentiment) => {
    return sentimentColors[sentiment] || sentimentColors.neutral;
  };

  const getImpactChip = (impact) => {
    const colors = {
      high: 'error',
      medium: 'warning',
      low: 'info',
    };
    return (
      <Chip
        label={impact.toUpperCase()}
        size="small"
        color={colors[impact]}
        variant="outlined"
      />
    );
  };

  const pieData = overallSentiment ? [
    { name: 'Positive', value: overallSentiment.percentages.positive, color: sentimentColors.positive },
    { name: 'Negative', value: overallSentiment.percentages.negative, color: sentimentColors.negative },
    { name: 'Neutral', value: overallSentiment.percentages.neutral, color: sentimentColors.neutral },
  ] : [];

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ 
      width: '100%',
      p: { xs: 2, sm: 3, md: 4 },
      minHeight: '100vh',
      backgroundColor: 'background.default'
    }}>
      <Box sx={{ width: '100%', mx: 'auto', px: { xs: 1, sm: 2, md: 3 } }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
          AI Sentiment Analysis
        </Typography>

      {/* Controls */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Select Stock
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {stocks.map((stock) => (
                  <Chip
                    key={stock.symbol}
                    label={stock.symbol}
                    onClick={() => setSelectedStock(stock.symbol)}
                    color={selectedStock === stock.symbol ? 'primary' : 'default'}
                    variant={selectedStock === stock.symbol ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Enter Symbol"
                  value={searchSymbol}
                  onChange={(e) => setSearchSymbol(e.target.value)}
                  placeholder="e.g., RELIANCE"
                  size="small"
                />
                <TextField
                  select
                  label="Exchange"
                  value={exchange}
                  onChange={(e) => setExchange(e.target.value)}
                  size="small"
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="NSE">NSE</MenuItem>
                  <MenuItem value="BSE">BSE</MenuItem>
                </TextField>
                <Button variant="contained" onClick={applySearch} disabled={!searchSymbol.trim()}>
                  Apply
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Time Range
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {['1h', '6h', '24h', '7d'].map((range) => (
                  <Chip
                    key={range}
                    label={range}
                    onClick={() => setTimeRange(range)}
                    color={timeRange === range ? 'primary' : 'default'}
                    variant={timeRange === range ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Auto Refresh"
                />
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={generateSentimentData}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={4} sx={{ width: '100%', flexWrap: 'wrap', alignItems: 'stretch' }}>
          {/* Overall Sentiment */}
          <Grid item xs={12} md={6} sx={{ minWidth: 0 }}>
            <Card sx={{ borderRadius: 3, height: '100%', width: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AIIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Overall Sentiment</Typography>
                </Box>
                
                {overallSentiment && (
                  <Box sx={{ textAlign: 'center' }}>
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        mx: 'auto',
                        mb: 2,
                        backgroundColor: getSentimentColor(overallSentiment.sentiment),
                      }}
                    >
                      {getSentimentIcon(overallSentiment.sentiment)}
                    </Avatar>
                    
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, textTransform: 'capitalize' }}>
                      {overallSentiment.sentiment}
                    </Typography>
                    
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      Confidence: {(overallSentiment.confidence * 100).toFixed(1)}%
                    </Typography>
                    
                    <LinearProgress
                      variant="determinate"
                      value={overallSentiment.confidence * 100}
                      sx={{ mb: 2, height: 8, borderRadius: 4 }}
                    />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="success.main">
                          {overallSentiment.percentages.positive.toFixed(1)}%
                        </Typography>
                        <Typography variant="caption">Positive</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="warning.main">
                          {overallSentiment.percentages.neutral.toFixed(1)}%
                        </Typography>
                        <Typography variant="caption">Neutral</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="error.main">
                          {overallSentiment.percentages.negative.toFixed(1)}%
                        </Typography>
                        <Typography variant="caption">Negative</Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Sentiment Distribution */}
          <Grid item xs={12} md={6} sx={{ minWidth: 0 }}>
            <Card sx={{ borderRadius: 3, height: '100%', width: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ChartIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Sentiment Distribution</Typography>
                </Box>
                <Box sx={{ height: 300, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => `${value.toFixed(1)}%`} />
                    <Legend />
                  </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Historical Sentiment Trend */}
          <Grid item xs={12} sx={{ minWidth: 0 }}>
            <Card sx={{ borderRadius: 3, width: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TimelineIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Sentiment Trend ({timeRange})</Typography>
                </Box>
                <Box sx={{ height: 300, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sentimentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="positive"
                      stackId="1"
                      stroke={sentimentColors.positive}
                      fill={sentimentColors.positive}
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="neutral"
                      stackId="1"
                      stroke={sentimentColors.neutral}
                      fill={sentimentColors.neutral}
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="negative"
                      stackId="1"
                      stroke={sentimentColors.negative}
                      fill={sentimentColors.negative}
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* News Analysis */}
          <Grid item xs={12} sx={{ minWidth: 0 }}>
            <Card sx={{ borderRadius: 3, width: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <NewsIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">News Sentiment Analysis</Typography>
                  <Badge badgeContent={sentimentData.length} color="primary" sx={{ ml: 2 }} />
                </Box>
                
                <List>
                  {sentimentData.map((news, index) => (
                    <React.Fragment key={news.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ backgroundColor: getSentimentColor(news.sentiment) }}>
                            {getSentimentIcon(news.sentiment)}
                          </Avatar>
                        </ListItemAvatar>
                        
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                {news.headline}
                              </Typography>
                              {getImpactChip(news.impact)}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  {news.source}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {formatTime(news.timestamp)}
                                </Typography>
                                <Chip
                                  label={`${(news.confidence * 100).toFixed(0)}% confidence`}
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {news.keywords.map((keyword) => (
                                  <Chip
                                    key={keyword}
                                    label={keyword}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem' }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < sentimentData.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      </Box>
    </Box>
  );
};

export default SentimentAnalysis;
const API_URL = process.env.REACT_APP_API_BASE_URL || `http://${window.location.hostname}:5001`;
