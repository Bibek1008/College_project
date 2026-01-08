import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  Alert,
  Fab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import axios from 'axios';
import {
  AddOutlined as AddIcon,
  DeleteOutlined as DeleteIcon,
  TrendingUpOutlined as TrendingUpIcon,
  TrendingDownOutlined as TrendingDownIcon,
  AccountBalanceWalletOutlined as WalletIcon,
  ShowChartOutlined as ChartIcon,
  EditOutlined as EditIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';

const API_URL = process.env.REACT_APP_API_BASE_URL || `http://${window.location.hostname}:5001`;

const Portfolio = ({ darkMode }) => {
  const [portfolio, setPortfolio] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [formData, setFormData] = useState({
    symbol: '',
    quantity: '',
    buyPrice: '',
    buyDate: '',
  });
  const [totalValue, setTotalValue] = useState(0);
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [totalPnL, setTotalPnL] = useState(0);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      Promise.all([
        axios.get(`${API_URL}/api/portfolio`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/portfolio/history`, { headers: { Authorization: `Bearer ${token}` } })
      ]).then(([p, h]) => {
        setPortfolio(p.data.portfolio || []);
        setHistory(h.data.history || []);
      }).catch(() => {
        const savedPortfolio = localStorage.getItem('portfolio');
        if (savedPortfolio) setPortfolio(JSON.parse(savedPortfolio));
      });
    } else {
      const savedPortfolio = localStorage.getItem('portfolio');
      if (savedPortfolio) setPortfolio(JSON.parse(savedPortfolio));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
    calculateTotals();
  }, [portfolio]);

  const calculateTotals = async () => {
    if (portfolio.length === 0) {
      setTotalValue(0);
      setTotalInvestment(0);
      setTotalPnL(0);
      return;
    }

    setLoading(true);
    try {
      const investment = portfolio.reduce((sum, s) => sum + (s.quantity * s.buyPrice), 0);

      const fetches = portfolio.map(async (stock) => {
        try {
          const exchange = stock.symbol.includes('.BO') ? 'BSE' : 'NSE';
          const res = await axios.get(`${API_URL}/api/stocks/${stock.symbol}`, {
            params: { exchange }
          });
          const price = Number(res.data?.regularMarketPrice) || Number(res.data?.regularMarketPreviousClose) || stock.buyPrice;
          return { id: stock._id || stock.id, price };
        } catch (_) {
          return { id: stock._id || stock.id, price: stock.buyPrice };
        }
      });

      const results = await Promise.all(fetches);
      const priceById = new Map(results.map(r => [r.id, r.price]));

      for (const s of portfolio) {
        const id = s._id || s.id;
        const p = priceById.get(id);
        if (p != null) {
          s.currentPrice = p;
        }
      }

      const currentValue = portfolio.reduce((sum, s) => sum + (s.quantity * (s.currentPrice || s.buyPrice)), 0);
      setTotalInvestment(investment);
      setTotalValue(currentValue);
      setTotalPnL(currentValue - investment);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = () => {
    setEditingStock(null);
    setFormData({ symbol: '', quantity: '', buyPrice: '', buyDate: '' });
    setIsDialogOpen(true);
  };

  const handleEditStock = (stock) => {
    setEditingStock(stock);
    setFormData({
      symbol: stock.symbol,
      quantity: stock.quantity.toString(),
      buyPrice: stock.buyPrice.toString(),
      buyDate: stock.buyDate,
    });
    setIsDialogOpen(true);
  };

  const handleSaveStock = async () => {
    const stockData = {
      id: editingStock?.id || editingStock?._id || Date.now(),
      symbol: formData.symbol.toUpperCase(),
      quantity: parseFloat(formData.quantity),
      buyPrice: parseFloat(formData.buyPrice),
      buyDate: formData.buyDate,
      currentPrice: parseFloat(formData.buyPrice), // Initial current price
    };
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = {
          id: editingStock?._id,
          symbol: stockData.symbol,
          quantity: stockData.quantity,
          buyPrice: stockData.buyPrice,
          buyDate: stockData.buyDate,
          currentPrice: stockData.currentPrice,
        };
        const res = await axios.post(`${API_URL}/api/portfolio`, payload, { headers: { Authorization: `Bearer ${token}` } });
        setPortfolio(res.data.portfolio || []);
        const h = await axios.get(`${API_URL}/api/portfolio/history`, { headers: { Authorization: `Bearer ${token}` } });
        setHistory(h.data.history || []);
      } catch (e) {
        setPortfolio(prev => editingStock ? prev.map(s => (s.id === editingStock.id ? stockData : s)) : [...prev, stockData]);
      }
    } else {
      setPortfolio(prev => editingStock ? prev.map(s => (s.id === editingStock.id ? stockData : s)) : [...prev, stockData]);
    }

    setIsDialogOpen(false);
    setFormData({ symbol: '', quantity: '', buyPrice: '', buyDate: '' });
  };

  const handleDeleteStock = async (id, mongoId) => {
    const token = localStorage.getItem('token');
    if (token && mongoId) {
      try {
        const res = await axios.delete(`${API_URL}/api/portfolio/${mongoId}`, { headers: { Authorization: `Bearer ${token}` } });
        setPortfolio(res.data.portfolio || []);
        const h = await axios.get(`${API_URL}/api/portfolio/history`, { headers: { Authorization: `Bearer ${token}` } });
        setHistory(h.data.history || []);
        return;
      } catch (e) {}
    }
    setPortfolio(prev => prev.filter(stock => stock.id !== id));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getPercentageChange = (current, buy) => {
    return ((current - buy) / buy * 100).toFixed(2);
  };

  const portfolioChartData = {
    labels: portfolio.map(stock => stock.symbol),
    datasets: [
      {
        label: 'Investment',
        data: portfolio.map(stock => stock.quantity * stock.buyPrice),
        backgroundColor: darkMode ? 'rgba(100, 181, 246, 0.6)' : 'rgba(33, 150, 243, 0.6)',
        borderColor: darkMode ? '#64b5f6' : '#2196f3',
        borderWidth: 2,
      },
      {
        label: 'Current Value',
        data: portfolio.map(stock => stock.quantity * (stock.currentPrice || stock.buyPrice)),
        backgroundColor: darkMode ? 'rgba(102, 187, 106, 0.6)' : 'rgba(76, 175, 80, 0.6)',
        borderColor: darkMode ? '#66bb6a' : '#4caf50',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: darkMode ? '#ffffff' : '#000000',
        },
      },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: darkMode ? '#ffffff' : '#000000',
        bodyColor: darkMode ? '#ffffff' : '#000000',
        borderColor: darkMode ? '#64b5f6' : '#2196f3',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: darkMode ? '#b0bec5' : '#666666',
          callback: function(value) {
            return formatCurrency(value);
          },
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        ticks: {
          color: darkMode ? '#b0bec5' : '#666666',
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  const tokenPresent = !!localStorage.getItem('token');
  return (
    <Box sx={{ p: 3 }}>
      {!tokenPresent && (
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Please sign in to manage your portfolio
            </Typography>
            <Button variant="contained" onClick={() => window.location.assign('/auth')}>Go to Login</Button>
          </CardContent>
        </Card>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WalletIcon color="primary" />
          My Portfolio
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddStock}
          sx={{
            borderRadius: 3,
            px: 3,
            background: darkMode 
              ? 'linear-gradient(45deg, #1976d2 30%, #64b5f6 90%)'
              : 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
          }}
        >
          Add Stock
        </Button>
      </Box>

      {/* Portfolio Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Investment
              </Typography>
              <Typography variant="h4" color="primary">
                {formatCurrency(totalInvestment)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Current Value
              </Typography>
              <Typography variant="h4" color="success.main">
                {formatCurrency(totalValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                P&L
              </Typography>
              <Typography 
                variant="h4" 
                color={totalPnL >= 0 ? 'success.main' : 'error.main'}
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                {totalPnL >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                {formatCurrency(Math.abs(totalPnL))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {totalInvestment > 0 ? `${((totalPnL / totalInvestment) * 100).toFixed(2)}%` : '0%'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Portfolio Chart */}
      {portfolio.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ChartIcon color="primary" />
              Portfolio Distribution
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line data={portfolioChartData} options={chartOptions} />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Table */}
      {tokenPresent && portfolio.length > 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Holdings
            </Typography>
            {loading && <LinearProgress sx={{ mb: 2 }} />}
            <TableContainer component={Paper} sx={{ background: 'transparent' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Symbol</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Buy Price</TableCell>
                    <TableCell align="right">Current Price</TableCell>
                    <TableCell align="right">Investment</TableCell>
                    <TableCell align="right">Current Value</TableCell>
                    <TableCell align="right">P&L</TableCell>
                    <TableCell align="right">Change %</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {portfolio.map((stock) => {
                    const investment = stock.quantity * stock.buyPrice;
                    const currentValue = stock.quantity * (stock.currentPrice || stock.buyPrice);
                    const pnl = currentValue - investment;
                    const changePercent = getPercentageChange(stock.currentPrice || stock.buyPrice, stock.buyPrice);
                    
                    return (
                      <TableRow key={stock._id || stock.id}>
                        <TableCell>
                          <Chip 
                            label={stock.symbol} 
                            color="primary" 
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">{stock.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(stock.buyPrice)}</TableCell>
                        <TableCell align="right">{formatCurrency(stock.currentPrice || stock.buyPrice)}</TableCell>
                        <TableCell align="right">{formatCurrency(investment)}</TableCell>
                        <TableCell align="right">{formatCurrency(currentValue)}</TableCell>
                        <TableCell align="right">
                          <Typography color={pnl >= 0 ? 'success.main' : 'error.main'}>
                            {formatCurrency(Math.abs(pnl))}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${changePercent}%`}
                            color={parseFloat(changePercent) >= 0 ? 'success' : 'error'}
                            size="small"
                            icon={parseFloat(changePercent) >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleEditStock(stock)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleDeleteStock(stock.id, stock._id)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <WalletIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Your portfolio is empty
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Start building your portfolio by adding your first stock
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddStock}
              sx={{
                borderRadius: 3,
                px: 4,
                background: darkMode 
                  ? 'linear-gradient(45deg, #1976d2 30%, #64b5f6 90%)'
                  : 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
              }}
            >
              Add Your First Stock
            </Button>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {tokenPresent && history.length > 0 && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Activity History
            </Typography>
            <TableContainer component={Paper} sx={{ background: 'transparent' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Symbol</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Buy Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((h) => (
                    <TableRow key={h._id}>
                      <TableCell>{new Date(h.timestamp).toLocaleString()}</TableCell>
                      <TableCell>{h.action}</TableCell>
                      <TableCell>{h.symbol}</TableCell>
                      <TableCell align="right">{h.quantity}</TableCell>
                      <TableCell align="right">{formatCurrency(h.buyPrice || 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Stock Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: darkMode
              ? 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(30, 30, 30, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
          }
        }}
      >
        <DialogTitle>
          {editingStock ? 'Edit Stock' : 'Add New Stock'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Stock Symbol"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                placeholder="e.g., TCS, RELIANCE"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Buy Price (₹)"
                type="number"
                value={formData.buyPrice}
                onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Buy Date"
                type="date"
                value={formData.buyDate}
                onChange={(e) => setFormData({ ...formData, buyDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveStock}
            disabled={!formData.symbol || !formData.quantity || !formData.buyPrice}
            sx={{
              borderRadius: 2,
              background: darkMode 
                ? 'linear-gradient(45deg, #1976d2 30%, #64b5f6 90%)'
                : 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
            }}
          >
            {editingStock ? 'Update' : 'Add'} Stock
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Portfolio;
