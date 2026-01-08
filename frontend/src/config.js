// Centralized API configuration
const isDevelopment = process.env.NODE_ENV === 'development';

// Production backend URL (Koyeb)
const PRODUCTION_API_URL = 'https://rapid-ofilia-bibek1008-366e9938.koyeb.app';

// Backend API URL
export const API_URL = process.env.REACT_APP_API_BASE_URL || 
  (isDevelopment ? 'http://localhost:5002' : PRODUCTION_API_URL);

// WebSocket URL (same as API URL for Socket.IO)
export const WS_URL = process.env.REACT_APP_WS_URL || 
  process.env.REACT_APP_API_BASE_URL || 
  (isDevelopment ? 'http://localhost:5002' : PRODUCTION_API_URL);

export default { API_URL, WS_URL };
