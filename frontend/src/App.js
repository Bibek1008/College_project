import React, { Suspense, useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, Box, CircularProgress } from '@mui/material';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import StockDetail from './components/StockDetail';
import News from './components/News';
import Predictions from './components/Predictions';
import About from './components/About';
import Contact from './components/Contact';
import StockPrediction from './components/StockPrediction';

import Portfolio from './components/Portfolio';
import StockComparison from './components/StockComparison';
import RealTimeUpdates from './components/RealTimeUpdates';
import SentimentAnalysis from './components/SentimentAnalysis';
import Auth from './components/Auth';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: darkMode ? '#4f46e5' : '#6366f1',
            light: darkMode ? '#7c3aed' : '#8b5cf6',
            dark: darkMode ? '#3730a3' : '#4338ca',
            contrastText: '#ffffff',
          },
          secondary: {
            main: darkMode ? '#06b6d4' : '#0891b2',
            light: darkMode ? '#22d3ee' : '#67e8f9',
            dark: darkMode ? '#0e7490' : '#0c4a6e',
            contrastText: '#ffffff',
          },
          background: {
            default: darkMode ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
            paper: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
          },
          text: {
            primary: darkMode ? '#f1f5f9' : '#1e293b',
            secondary: darkMode ? '#cbd5e1' : '#475569',
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontWeight: 800,
            fontSize: '3.5rem',
            background: darkMode 
              ? 'linear-gradient(45deg, #4f46e5 30%, #06b6d4 90%)'
              : 'linear-gradient(45deg, #6366f1 30%, #0891b2 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          },
          h2: {
            fontWeight: 700,
            fontSize: '2.5rem',
          },
          h3: {
            fontWeight: 600,
            fontSize: '2rem',
          },
        },
        shape: {
          borderRadius: 16,
        },
        shadows: darkMode
          ? [
              'none',
              '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.24)',
              '0 3px 6px rgba(0,0,0,0.4), 0 3px 6px rgba(0,0,0,0.23)',
              '0 10px 20px rgba(0,0,0,0.4), 0 6px 6px rgba(0,0,0,0.23)',
              '0 14px 28px rgba(0,0,0,0.5), 0 10px 10px rgba(0,0,0,0.22)',
              '0 19px 38px rgba(0,0,0,0.6), 0 15px 12px rgba(0,0,0,0.22)',
            ]
          : [
              'none',
              '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
              '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.10)',
              '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.10)',
              '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.10)',
              '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.10)',
            ],
          success: {
            main: darkMode ? '#66bb6a' : '#4caf50',
            light: darkMode ? '#81c784' : '#66bb6a',
            dark: darkMode ? '#388e3c' : '#2e7d32',
          },
          warning: {
            main: darkMode ? '#ffb74d' : '#ff9800',
            light: darkMode ? '#ffcc02' : '#ffb74d',
            dark: darkMode ? '#f57c00' : '#e65100',
          },
          error: {
            main: darkMode ? '#f44336' : '#d32f2f',
            light: darkMode ? '#ef5350' : '#f44336',
            dark: darkMode ? '#c62828' : '#b71c1c',
          },
          background: {
            default: darkMode ? '#0a0a0a' : '#f8fafc',
            paper: darkMode ? '#1a1a1a' : '#ffffff',
          },
          text: {
            primary: darkMode ? '#ffffff' : '#1a202c',
            secondary: darkMode ? '#b0bec5' : '#4a5568',
          },
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontWeight: 500,
          },
          h2: {
            fontWeight: 500,
          },
          h3: {
            fontWeight: 500,
          },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                textTransform: 'none',
                fontWeight: 500,
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                boxShadow: darkMode 
                  ? '0 8px 32px rgba(0, 0, 0, 0.6)' 
                  : '0 4px 20px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
                backdropFilter: 'blur(10px)',
                background: darkMode 
                  ? 'linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: darkMode 
                    ? '0 20px 40px rgba(100, 181, 246, 0.3)' 
                    : '0 12px 24px rgba(25, 118, 210, 0.15)',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                transition: 'all 0.3s ease',
              },
            },
          },
        },
        shape: {
          borderRadius: 10,
        },
        transitions: {
          easing: {
            easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
      }),
    [darkMode]
  );

  const LoadingSpinner = () => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
      }}
    >
      <CircularProgress />
    </Box>
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          <Container maxWidth={false} sx={{ mt: 4, mb: 4, flex: 1, px: { xs: 2, sm: 3, md: 4 } }}>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/stock/:symbol" element={<ProtectedRoute><StockDetail /></ProtectedRoute>} />
                <Route path="/predict/:symbol" element={<ProtectedRoute><StockPrediction /></ProtectedRoute>} />
                <Route path="/predict" element={<ProtectedRoute><StockPrediction /></ProtectedRoute>} />
                <Route path="/news" element={<ProtectedRoute><News /></ProtectedRoute>} />
                <Route path="/predictions" element={<ProtectedRoute><Predictions /></ProtectedRoute>} />
                <Route path="/portfolio" element={<ProtectedRoute><Portfolio darkMode={darkMode} /></ProtectedRoute>} />
                <Route path="/compare" element={<ProtectedRoute><StockComparison darkMode={darkMode} /></ProtectedRoute>} />
                <Route path="/live" element={<ProtectedRoute><RealTimeUpdates darkMode={darkMode} /></ProtectedRoute>} />
                <Route path="/sentiment" element={<ProtectedRoute><SentimentAnalysis darkMode={darkMode} /></ProtectedRoute>} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
              </Routes>
            </Suspense>
          </Container>
          <Footer />

        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
