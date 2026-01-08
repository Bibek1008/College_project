// Centralized API configuration
const isDevelopment = process.env.NODE_ENV === 'development';

// Backend API URL
export const API_URL = process.env.REACT_APP_API_BASE_URL || 
  (isDevelopment ? 'http://localhost:5002' : '');

// WebSocket URL (same as API URL for Socket.IO)
export const WS_URL = process.env.REACT_APP_WS_URL || 
  process.env.REACT_APP_API_BASE_URL || 
  (isDevelopment ? 'http://localhost:5002' : '');

export default { API_URL, WS_URL };
