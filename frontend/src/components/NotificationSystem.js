import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Snackbar,
  Alert,
  Chip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon,
  FiberManualRecord as LiveIcon,
  VolumeUp as SoundOnIcon,
  VolumeOff as SoundOffIcon
} from '@mui/icons-material';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5002';

// Singleton socket instance - created once at module load
let socket = null;
let socketListeners = new Set(); // Track component instances listening to socket

// Initialize socket ONCE when module loads
function getSocket() {
  if (!socket) {
    console.log('🔌 Creating singleton WebSocket connection to:', API_URL);
    socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 3000,
      timeout: 30000,
      autoConnect: true
    });
    
    socket.on('connect', () => {
      console.log('🔌 Socket connected');
      // Notify all listening components
      socketListeners.forEach(callback => callback('connect'));
      
      // Watch stocks on connect
      socket.emit('watchStocks', [
        'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 
        'ICICIBANK.NS', 'ITC.NS', 'SBIN.NS', 'HINDUNILVR.NS',
        'BHARTIARTL.NS', 'KOTAKBANK.NS'
      ]);
    });
    
    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      socketListeners.forEach(callback => callback('disconnect'));
    });
    
    socket.on('stockUpdate', (data) => {
      console.log('📊 Stock update received:', data?.length, 'stocks');
      socketListeners.forEach(callback => callback('stockUpdate', data));
    });
    
    socket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error);
      socketListeners.forEach(callback => callback('error', error));
    });
  }
  return socket;
}

// Initialize socket when module loads
getSocket();

function NotificationSystem({ darkMode }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([{
    id: 'welcome',
    type: 'info',
    message: '🚀 Connecting to live stock updates...',
    time: new Date().toISOString(),
    isNew: false
  }]);
  const [connected, setConnected] = useState(socket?.connected || false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef(null);
  const mountedRef = useRef(true);

  // Notification sound
  const playNotificationSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [soundEnabled]);

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return time.toLocaleDateString();
  };

  // Process stock updates and generate notifications
  const processStockUpdates = useCallback((stockData) => {
    const newNotifications = [];
    const currentTime = new Date().toISOString();

    console.log('📊 Processing stock updates:', stockData.length, 'stocks');

    stockData.forEach(stock => {
      const changePercent = stock.changePercent || 0;
      
      // Generate notification for ANY price change (lowered threshold to show updates)
      if (Math.abs(changePercent) >= 0.1) {  // Show changes >= 0.1%
        const isUp = changePercent > 0;
        newNotifications.push({
          id: `${stock.symbol}-${Date.now()}-${Math.random()}`,
          type: isUp ? 'up' : 'down',
          symbol: stock.symbol,
          message: `📈 ${stock.name || stock.symbol} ${isUp ? '↑' : '↓'} ${Math.abs(changePercent).toFixed(2)}% at ₹${stock.price?.toFixed(2)}`,
          price: stock.price,
          change: changePercent,
          time: currentTime,
          isNew: true
        });
      }

      // Alert for high volume (lower threshold)
      if (stock.volume > 1000000) {
        newNotifications.push({
          id: `vol-${stock.symbol}-${Date.now()}-${Math.random()}`,
          type: 'info',
          symbol: stock.symbol,
          message: `📊 Volume spike: ${stock.name || stock.symbol} - ${(stock.volume / 1000000).toFixed(1)}M shares`,
          time: currentTime,
          isNew: true
        });
      }
    });

    // Limit to top 5 most significant notifications per update
    const sortedNotifications = newNotifications
      .sort((a, b) => Math.abs(b.change || 0) - Math.abs(a.change || 0))
      .slice(0, 5);

    // Add new notifications to the list (keep max 20)
    if (sortedNotifications.length > 0) {
      playNotificationSound();
      setNotifications(prev => {
        const updated = [...sortedNotifications, ...prev].slice(0, 20);
        return updated;
      });

      // Show snackbar for the most important notification
      const mostSignificant = sortedNotifications[0];
      
      setSnackbar({
        open: true,
        message: mostSignificant.message,
        severity: mostSignificant.type === 'up' ? 'success' : mostSignificant.type === 'down' ? 'error' : 'info'
      });
    }
  }, [playNotificationSound]);

  // Subscribe to socket events using listener pattern
  useEffect(() => {
    mountedRef.current = true;
    
    // Create audio element for notification sound
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');

    // Sync initial connection state
    const currentSocket = getSocket();
    if (currentSocket.connected) {
      setConnected(true);
      setNotifications(prev => [{
        id: 'connected-' + Date.now(),
        type: 'info',
        message: '✅ Live connection established!',
        time: new Date().toISOString(),
        isNew: true
      }, ...prev.filter(n => !n.id.startsWith('welcome') && !n.id.startsWith('connected'))]);
    }

    // Event listener callback for this component instance
    const handleSocketEvent = (event, data) => {
      if (!mountedRef.current) return;
      
      switch (event) {
        case 'connect':
          setConnected(true);
          setNotifications(prev => [{
            id: 'connected-' + Date.now(),
            type: 'info',
            message: '✅ Live connection established!',
            time: new Date().toISOString(),
            isNew: true
          }, ...prev.filter(n => !n.id.startsWith('welcome') && !n.id.startsWith('connected'))]);
          break;
          
        case 'disconnect':
          setConnected(false);
          break;
          
        case 'error':
          setConnected(false);
          break;
          
        case 'stockUpdate':
          if (data && Array.isArray(data) && data.length > 0) {
            const newNotifications = [];
            const currentTime = new Date().toISOString();

            data.forEach(stock => {
              const changePercent = stock.changePercent || 0;
              
              // Generate notification for price changes >= 0.1%
              if (Math.abs(changePercent) >= 0.1) {
                const isUp = changePercent > 0;
                newNotifications.push({
                  id: `${stock.symbol}-${Date.now()}-${Math.random()}`,
                  type: isUp ? 'up' : 'down',
                  symbol: stock.symbol,
                  message: `📈 ${stock.name || stock.symbol} ${isUp ? '↑' : '↓'} ${Math.abs(changePercent).toFixed(2)}% at ₹${stock.price?.toFixed(2)}`,
                  price: stock.price,
                  change: changePercent,
                  time: currentTime,
                  isNew: true
                });
              }
            });

            // Limit to top 5 most significant
            const sortedNotifications = newNotifications
              .sort((a, b) => Math.abs(b.change || 0) - Math.abs(a.change || 0))
              .slice(0, 5);

            if (sortedNotifications.length > 0) {
              // Play notification sound
              if (audioRef.current) {
                audioRef.current.play().catch(() => {});
              }
              
              setNotifications(prev => {
                const updated = [...sortedNotifications, ...prev].slice(0, 20);
                return updated;
              });

              const mostSignificant = sortedNotifications[0];
              setSnackbar({
                open: true,
                message: mostSignificant.message,
                severity: mostSignificant.type === 'up' ? 'success' : mostSignificant.type === 'down' ? 'error' : 'info'
              });
            }
          }
          break;
          
        default:
          break;
      }
    };

    // Register listener
    socketListeners.add(handleSocketEvent);
    console.log('🔌 Registered socket listener, total listeners:', socketListeners.size);

    // Cleanup - just remove this component's listener
    return () => {
      console.log('🔌 Unregistering socket listener');
      mountedRef.current = false;
      socketListeners.delete(handleSocketEvent);
    };
  }, []); // Empty dependency array - run only once

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    // Mark all as read when opened
    setNotifications(prev => prev.map(n => ({ ...n, isNew: false })));
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const toggleSound = (e) => {
    e.stopPropagation();
    setSoundEnabled(!soundEnabled);
  };

  const clearNotifications = () => {
    setNotifications([]);
    handleClose();
  };

  const unreadCount = notifications.filter(n => n.isNew).length;

  const getIcon = (type) => {
    switch (type) {
      case 'up':
        return <TrendingUpIcon sx={{ color: '#00e676' }} />;
      case 'down':
        return <TrendingDownIcon sx={{ color: '#ff1744' }} />;
      default:
        return <InfoIcon sx={{ color: '#00bcd4' }} />;
    }
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ ml: 1, position: 'relative' }}
      >
        <Badge 
          badgeContent={unreadCount} 
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              animation: unreadCount > 0 ? 'pulse 1.5s infinite' : 'none',
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.2)' },
                '100%': { transform: 'scale(1)' }
              }
            }
          }}
        >
          <NotificationsIcon />
        </Badge>
        {connected && (
          <LiveIcon 
            sx={{ 
              position: 'absolute', 
              bottom: 2, 
              right: 2, 
              fontSize: 10, 
              color: '#00e676',
              animation: 'blink 1s infinite',
              '@keyframes blink': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.3 }
              }
            }} 
          />
        )}
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
            bgcolor: darkMode ? 'rgba(15, 23, 42, 0.98)' : 'background.paper',
            backdropFilter: 'blur(10px)',
            border: darkMode ? '1px solid rgba(0, 240, 255, 0.2)' : 'none',
            borderRadius: 2
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              📡 Live Notifications
            </Typography>
            <Chip 
              icon={<LiveIcon sx={{ fontSize: 10 }} />}
              label={connected ? 'LIVE' : 'OFFLINE'} 
              size="small"
              sx={{ 
                bgcolor: connected ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 23, 68, 0.2)',
                color: connected ? '#00e676' : '#ff1744',
                fontWeight: 600,
                fontSize: '0.65rem',
                height: 20
              }}
            />
          </Box>
          <IconButton size="small" onClick={toggleSound}>
            {soundEnabled ? <SoundOnIcon fontSize="small" /> : <SoundOffIcon fontSize="small" />}
          </IconButton>
        </Box>
        <Divider sx={{ borderColor: darkMode ? 'rgba(0, 240, 255, 0.1)' : 'divider' }} />
        <List sx={{ p: 0, maxHeight: 350, overflow: 'auto' }}>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText 
                primary="No notifications yet" 
                secondary="Real-time alerts will appear here"
                primaryTypographyProps={{ sx: { color: darkMode ? '#fff' : 'inherit' } }}
              />
            </ListItem>
          ) : (
            notifications.map((notification) => (
              <ListItem 
                key={notification.id} 
                sx={{ 
                  bgcolor: notification.isNew 
                    ? (darkMode ? 'rgba(0, 240, 255, 0.05)' : 'rgba(25, 118, 210, 0.05)')
                    : 'transparent',
                  borderLeft: notification.isNew ? '3px solid #00bcd4' : '3px solid transparent',
                  transition: 'all 0.3s ease'
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {getIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: notification.isNew ? 600 : 400 }}>
                        {notification.message}
                      </Typography>
                      {notification.isNew && (
                        <Chip label="NEW" size="small" sx={{ 
                          height: 16, 
                          fontSize: '0.6rem',
                          bgcolor: 'rgba(0, 188, 212, 0.2)',
                          color: '#00bcd4'
                        }} />
                      )}
                    </Box>
                  }
                  secondary={formatTimeAgo(notification.time)}
                  secondaryTypographyProps={{ 
                    variant: 'caption',
                    sx: { color: darkMode ? 'rgba(255,255,255,0.5)' : 'text.secondary' }
                  }}
                />
              </ListItem>
            ))
          )}
        </List>
        <Divider sx={{ borderColor: darkMode ? 'rgba(0, 240, 255, 0.1)' : 'divider' }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
          <MenuItem onClick={clearNotifications} sx={{ fontSize: '0.85rem', color: '#ff1744' }}>
            Clear All
          </MenuItem>
          <Typography variant="caption" sx={{ alignSelf: 'center', px: 1, color: darkMode ? 'rgba(255,255,255,0.5)' : 'text.secondary' }}>
            Updates every 30s
          </Typography>
        </Box>
      </Menu>

      {/* Snackbar for real-time alerts */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            bgcolor: snackbar.severity === 'success' ? 'rgba(0, 230, 118, 0.9)' 
                   : snackbar.severity === 'error' ? 'rgba(255, 23, 68, 0.9)' 
                   : 'rgba(0, 188, 212, 0.9)',
            color: '#fff',
            fontWeight: 500,
            '& .MuiAlert-icon': { color: '#fff' }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default NotificationSystem;
