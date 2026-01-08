import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Divider,
} from '@mui/material';
import { OpenInNew as OpenInNewIcon, Search as SearchIcon } from '@mui/icons-material';
import axios from 'axios';
const API_URL = process.env.REACT_APP_API_BASE_URL || `http://${window.location.hostname}:5001`;

function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchSymbol, setSearchSymbol] = useState('');
  const [currentSymbol, setCurrentSymbol] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch general market news on initial load
    fetchGeneralNews();
  }, []);

  const fetchGeneralNews = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching general market news');
      const response = await axios.get(`${API_URL}/api/news`);
      console.log('News data:', response.data);
      setNews(response.data);
      setCurrentSymbol('');
    } catch (error) {
      console.error('Error fetching news:', error);
      setError('Error fetching news. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchSymbol) {
      fetchGeneralNews();
      return;
    }

    setLoading(true);
    setError('');
    try {
      console.log(`Fetching news for ${searchSymbol}`);
      const response = await axios.get(`${API_URL}/api/news/${searchSymbol}`);
      console.log('News data:', response.data);
      setNews(response.data);
      setCurrentSymbol(searchSymbol);
    } catch (error) {
      console.error('Error fetching news:', error);
      setError('Error fetching stock news. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatSentiment = (sentiment) => {
    if (typeof sentiment === 'object') {
      // Handle new format with score property
      return sentiment.score;
    }
    // Handle old format where sentiment is just a number
    return sentiment;
  };

  const getSentimentColor = (sentiment) => {
    const score = formatSentiment(sentiment);
    if (score > 0) return 'success';
    if (score < 0) return 'error';
    return 'default';
  };

  const getSentimentLabel = (sentiment) => {
    const score = formatSentiment(sentiment);
    if (score > 0) return 'Positive';
    if (score < 0) return 'Negative';
    return 'Neutral';
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Market News
      </Typography>

      <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <TextField
          fullWidth
          label="Search Stock Symbol"
          value={searchSymbol}
          onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
          placeholder="e.g., RELIANCE, INFY, TCS"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  disabled={loading}
                  startIcon={<SearchIcon />}
                >
                  Search
                </Button>
              </InputAdornment>
            ),
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />
        <Button
          variant="outlined"
          onClick={fetchGeneralNews}
          disabled={loading || (!currentSymbol && news.length > 0)}
        >
          Show Market News
        </Button>
      </Paper>

      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography>{error}</Typography>
        </Paper>
      )}

      <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
        {currentSymbol ? `Latest News for ${currentSymbol}` : 'Latest Market News'}
      </Typography>

      <Grid container spacing={3}>
        {loading ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Paper>
          </Grid>
        ) : news.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 4 }}>
              <Typography align="center">No news found. Try a different search term.</Typography>
            </Paper>
          </Grid>
        ) : (
          news.map((article, index) => (
            <Grid item xs={12} key={index}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {article.title}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Source: {article.source}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(article.publishedAt).toLocaleDateString()} {new Date(article.publishedAt).toLocaleTimeString()}
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body1" paragraph>
                    {article.description}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={`Sentiment: ${getSentimentLabel(article.sentiment)}`}
                      color={getSentimentColor(article.sentiment)}
                      size="small"
                    />
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    endIcon={<OpenInNewIcon />}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Read More
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
}

export default News;
