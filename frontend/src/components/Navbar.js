import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined as HomeIcon,
  DashboardOutlined as DashboardIcon,
  TrendingUpOutlined as TrendingUpIcon,
  ArticleOutlined as ArticleIcon,
  InfoOutlined as InfoIcon,
  MailOutlineOutlined as ContactMailIcon,
  SearchOutlined as SearchIcon,
  MenuOutlined as MenuIcon,
  NotificationsOutlined as NotificationsIcon,
  Brightness4Outlined as MoonIcon,
  Brightness7Outlined as SunIcon,
  CloseOutlined as CloseIcon,
  AccountBalanceWalletOutlined as PortfolioIcon,
  CompareArrowsOutlined as CompareIcon,
  FlashOnOutlined as LiveIcon,
  PsychologyOutlined as SentimentIcon,
} from '@mui/icons-material';
import NotificationSystem from './NotificationSystem';

const Navbar = ({ darkMode, toggleDarkMode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile menu when path changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSearch = (event) => {
    if (event.key === 'Enter' && searchQuery.trim()) {
      navigate(`/stock/${searchQuery.trim()}`);
      setSearchQuery('');
    }
  };

  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('token'));

  useEffect(() => {
    const update = () => setIsLoggedIn(!!localStorage.getItem('token'));
    const onStorage = () => update();
    const onAuthChanged = () => update();
    window.addEventListener('storage', onStorage);
    window.addEventListener('authChanged', onAuthChanged);
    update();
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('authChanged', onAuthChanged);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    window.dispatchEvent(new Event('authChanged'));
    navigate('/auth');
  };

  const menuItems = [
    { text: 'Home', icon: <HomeIcon className="w-5 h-5" />, path: '/' },
    { text: 'Dashboard', icon: <DashboardIcon className="w-5 h-5" />, path: '/dashboard' },
    { text: 'Predictions', icon: <TrendingUpIcon className="w-5 h-5" />, path: '/predictions' },
    { text: 'Portfolio', icon: <PortfolioIcon className="w-5 h-5" />, path: '/portfolio' },
    { text: 'News', icon: <ArticleIcon className="w-5 h-5" />, path: '/news' },
  ];

  const moreMenuItems = [
    { text: 'Compare', icon: <CompareIcon className="w-5 h-5" />, path: '/compare' },
    { text: 'Live Updates', icon: <LiveIcon className="w-5 h-5" />, path: '/live' },
    { text: 'Sentiment', icon: <SentimentIcon className="w-5 h-5" />, path: '/sentiment' },
    { text: 'About', icon: <InfoIcon className="w-5 h-5" />, path: '/about' },
    { text: 'Contact', icon: <ContactMailIcon className="w-5 h-5" />, path: '/contact' },
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-white bg-opacity-80 dark:bg-dark-paper dark:bg-opacity-80 backdrop-blur-lg shadow-sm">
      <div className="mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center py-3 md:space-x-10">
          {/* Logo */}
          <div className="flex justify-start lg:w-0 lg:flex-1">
            <Link to="/" className="flex items-center gap-1 text-lg font-semibold text-gray-900 dark:text-white">
              <TrendingUpIcon className="h-6 w-6 text-primary" />
              <span>Stock Prediction</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 -my-2 md:hidden">
            <button 
              type="button" 
              className="rounded-md p-2 inline-flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 focus:outline-none"
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className="sr-only">Open menu</span>
              <MenuIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearch}
                placeholder="Search stocks (e.g., RELIANCE, TCS)..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200 focus:w-72"
              />
            </div>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center space-x-4">
            {menuItems.map((item) => (
              <Link
                key={item.text}
                to={item.path}
                className={`flex items-center text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
                  isActive(item.path)
                    ? 'text-primary bg-primary bg-opacity-10'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-1.5">{item.icon}</span>
                {item.text}
              </Link>
            ))}
            
            {/* More dropdown */}
            <div className="relative group">
              <button className="flex items-center text-sm font-medium px-3 py-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-all duration-200">
                <span className="mr-1.5">•••</span>
                More
              </button>
              
              {/* Dropdown menu */}
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  {moreMenuItems.map((item) => (
                    <Link
                      key={item.text}
                      to={item.path}
                      className={`flex items-center px-4 py-2 text-sm transition-colors duration-200 ${
                        isActive(item.path)
                          ? 'text-primary bg-primary bg-opacity-10'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.text}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* Right-side buttons */}
          <div className="flex items-center space-x-2 lg:space-x-3">
            {/* Search button for mobile/tablet */}
            <button className="lg:hidden p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 transition-colors duration-200">
              <SearchIcon className="h-5 w-5" />
            </button>
            
            {/* Dark mode toggle */}
            <button 
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 transition-colors duration-200"
              onClick={toggleDarkMode}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
            
            {/* Notifications */}
            <div className="hidden sm:block">
              <NotificationSystem darkMode={darkMode} />
            </div>
            
            {/* Auth button */}
            <div className="flex items-center">
              {isLoggedIn ? (
                <button 
                  className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-red-500 hover:bg-red-600 transition-colors duration-200"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              ) : (
                <Link 
                  to="/auth" 
                  className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary-dark transition-colors duration-200"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div 
        className={`fixed inset-0 z-50 overflow-hidden transition-opacity ease-linear duration-300 ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80" onClick={() => setMobileMenuOpen(false)}></div>
        
        <div className={`fixed inset-y-0 left-0 flex max-w-xs w-full flex-col bg-white dark:bg-dark-paper shadow-xl transform transition ease-in-out duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Mobile menu header */}
          <div className="px-4 pt-5 pb-4 flex items-center justify-between">
            <div className="flex items-center">
              <TrendingUpIcon className="h-8 w-8 text-primary" />
              <h2 className="ml-3 text-xl font-semibold">Stock Prediction</h2>
            </div>
            <button
              type="button"
              className="rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              <CloseIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          
          {/* Mobile search */}
          <div className="px-4 pt-2 pb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearch}
                placeholder="Search stocks..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
          </div>
          
          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700"></div>
          
          {/* Mobile menu items */}
          <nav className="flex-1 pt-4 pb-4 px-2 bg-white dark:bg-dark-paper overflow-y-auto">
            <div className="space-y-1">
              {[...menuItems, ...moreMenuItems].map((item) => (
                <Link
                  key={item.text}
                  to={item.path}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg ${
                    isActive(item.path)
                      ? 'text-primary bg-primary/10'
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className={`mr-3 flex-shrink-0 ${isActive(item.path) ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
                    {item.icon}
                  </span>
                  {item.text}
                </Link>
              ))}
              
              {/* Login/Logout for mobile */}
              {!isLoggedIn && (
                <Link
                  to="/auth"
                  className="group flex items-center px-3 py-3 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <span className="mr-3 flex-shrink-0 text-gray-500 dark:text-gray-400">
                    <SentimentIcon className="w-5 h-5" />
                  </span>
                  Login
                </Link>
              )}
            </div>
          </nav>
          
          {/* Mobile menu footer */}
          <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <button 
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700"
              onClick={toggleDarkMode}
            >
              {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
            <div className="flex items-center">
              <div className="relative">
                {isLoggedIn ? (
                  <button className="px-3 py-1 rounded-lg text-white bg-primary" onClick={handleLogout}>Logout</button>
                ) : (
                  <Link to="/auth" className="px-3 py-1 rounded-lg text-white bg-primary">Login</Link>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">User</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Logged in</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;