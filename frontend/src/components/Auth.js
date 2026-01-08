import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Card, CardContent, Typography, TextField, Button, Grid, Alert } from '@mui/material';
import axios from 'axios';
const API_URL = process.env.REACT_APP_API_BASE_URL || `http://${window.location.hostname}:5001`;

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/';
  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' });
  const [signupForm, setSignupForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async () => {
    setError('');
    setSuccess('');
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, loginForm);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      window.dispatchEvent(new Event('authChanged'));
      setSuccess('Logged in successfully');
      navigate(redirectTo);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  };

  const handleSignup = async () => {
    setError('');
    setSuccess('');
    try {
      const res = await axios.post(`${API_URL}/api/auth/signup`, signupForm);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      window.dispatchEvent(new Event('authChanged'));
      setSuccess('Account created successfully');
      navigate(redirectTo);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Grid container spacing={3} justifyContent="center" alignItems="center">
        <Grid item xs={12} sm={10} md={6} lg={4}>
          <Card sx={{ maxWidth: 440, mx: 'auto' }}>
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Typography variant="h5" gutterBottom align="center">
                {mode === 'login' ? 'Sign In' : 'Sign Up'}
              </Typography>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
              {mode === 'login' ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField fullWidth label="Email or Username" value={loginForm.identifier} onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })} />
                  <TextField fullWidth label="Password" type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
                  <Button fullWidth variant="contained" size="large" onClick={handleLogin}>Sign In</Button>
                  <Button fullWidth variant="text" onClick={() => setMode('signup')}>Create an account</Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField fullWidth label="Username" value={signupForm.username} onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })} />
                  <TextField fullWidth label="Email" value={signupForm.email} onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} />
                  <TextField fullWidth label="Password" type="password" value={signupForm.password} onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} />
                  <Button fullWidth variant="contained" size="large" onClick={handleSignup}>Sign Up</Button>
                  <Button fullWidth variant="text" onClick={() => setMode('login')}>Already have an account?</Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Auth;
