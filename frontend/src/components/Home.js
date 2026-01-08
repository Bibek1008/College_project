import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Timeline,
  Notifications,
  ShowChart,
  Insights,
  BarChart,
  AutoGraph,
  Psychology,
  Speed,
  Security,
  Explore,
  Analytics,
} from '@mui/icons-material';
import { keyframes } from '@emotion/react';
import { styled } from '@mui/material/styles';

// Enhanced animations
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-10px) rotate(1deg); }
  50% { transform: translateY(-5px) rotate(-1deg); }
  75% { transform: translateY(-15px) rotate(0.5deg); }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.3); }
  50% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.6); }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const FloatingCard = styled('div')`
  animation: ${float} 6s ease-in-out infinite;
  &:nth-of-type(even) {
    animation-delay: 2s;
  }
  &:nth-of-type(3n) {
    animation-delay: 4s;
  }
`;

const GlowButton = styled('button')`
  animation: ${glow} 3s ease-in-out infinite;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, #6366f1, #8b5cf6, #06b6d4, #10b981);
    background-size: 400% 400%;
    animation: ${gradientShift} 4s ease infinite;
    border-radius: 12px;
    z-index: -1;
  }
`;

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: "Neural Network Predictions",
      description: "Advanced LSTM models trained on massive datasets for ultra-precise stock price forecasting.",
      icon: <Psychology style={{ fontSize: 40 }} />,
      color: "primary",
      gradient: "from-blue-500 to-purple-600",
    },
    {
      title: "Real-Time Market Analytics",
      description: "Lightning-fast processing of live market data with millisecond precision trading signals.",
      icon: <Speed style={{ fontSize: 40 }} />,
      color: "secondary",
      gradient: "from-cyan-500 to-teal-600",
    },
    {
      title: "Smart Portfolio Optimization",
      description: "AI-driven portfolio balancing that adapts to market volatility and maximizes returns.",
      icon: <AutoGraph style={{ fontSize: 40 }} />,
      color: "primary",
      gradient: "from-emerald-500 to-green-600",
    },
    {
      title: "Advanced Risk Management",
      description: "Sophisticated algorithms that protect your investments with predictive risk assessment.",
      icon: <Security style={{ fontSize: 40 }} />,
      color: "secondary",
      gradient: "from-orange-500 to-red-600",
    },
    {
      title: "Market Sentiment Analysis",
      description: "Natural language processing of news and social media to gauge market emotions.",
      icon: <Explore style={{ fontSize: 40 }} />,
      color: "primary",
      gradient: "from-pink-500 to-rose-600",
    },
    {
      title: "Quantum Analytics Engine",
      description: "Next-generation computing power for complex market pattern recognition and prediction.",
      icon: <Analytics style={{ fontSize: 40 }} />,
      color: "secondary",
      gradient: "from-violet-500 to-purple-600",
    },
  ];

  return (
    <div className="pb-20 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-60 right-20 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-cyan-500/10 rounded-full blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Hero Section */}
      <section className="hero-section relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white space-y-6">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-black leading-tight">
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
                    NEXT-GEN
                  </span>
                  <br />
                  <span className="text-white">Stock Trading</span>
                  <br />
                  <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    Revolution
                  </span>
                </h1>
                <p className="text-2xl md:text-3xl font-light text-gray-300 max-w-2xl">
                  Harness the power of <span className="text-cyan-400 font-semibold">Quantum AI</span> and 
                  <span className="text-purple-400 font-semibold"> Neural Networks</span> for 
                  unprecedented market dominance
                </p>
              </div>
              
              <div className="flex flex-wrap gap-6 mt-8">
                <GlowButton 
                  onClick={() => navigate('/dashboard')} 
                  className="bg-gradient-to-r from-blue-600 to-purple-700 text-white font-bold py-4 px-10 rounded-2xl text-lg transform hover:scale-105 transition-all duration-500 shadow-2xl"
                >
                  🚀 Launch Dashboard
                </GlowButton>
                <button 
                  onClick={() => navigate('/news')} 
                  className="border-2 border-cyan-400 text-cyan-400 font-bold py-4 px-10 rounded-2xl text-lg hover:bg-cyan-400 hover:text-gray-900 transition-all duration-500 shadow-lg hover:shadow-cyan-400/50"
                >
                  📰 Market Intel
                </button>
              </div>
              
              {/* Live Stats */}
              <div className="grid grid-cols-3 gap-4 mt-8 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-400">+127%</p>
                  <p className="text-sm text-gray-300">Avg Returns</p>
                </div>
                <div className="text-center border-l border-r border-white/20">
                  <p className="text-3xl font-bold text-cyan-400">0.3ms</p>
                  <p className="text-sm text-gray-300">Execution</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-400">99.7%</p>
                  <p className="text-sm text-gray-300">Accuracy</p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <FloatingCard className="relative h-96 lg:h-[500px] w-full">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-cyan-600/20 rounded-3xl backdrop-blur-sm border border-white/10"></div>
                <div className="absolute inset-4 bg-black/40 rounded-2xl p-6 flex flex-col justify-center">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">NIFTY 50</span>
                      <span className="text-green-400 font-bold">+2.47%</span>
                    </div>
                    <div className="h-48 bg-gradient-to-t from-green-500/20 to-blue-500/20 rounded-lg relative overflow-hidden">
                      <div className="absolute bottom-0 left-0 w-full h-3/4 bg-gradient-to-t from-green-500 to-blue-500 rounded-lg opacity-80"></div>
                      <div className="absolute top-4 right-4 text-white text-sm">
                        📈 BULLISH MOMENTUM
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">High: </span>
                        <span className="text-white font-semibold">24,850</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Volume: </span>
                        <span className="text-cyan-400 font-semibold">2.3M</span>
                      </div>
                    </div>
                  </div>
                </div>
              </FloatingCard>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Stats Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black mb-4">
              <span className="bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
                MARKET DOMINATION
              </span>
            </h2>
            <p className="text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Real-time quantum analytics powering the future of trading
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <FloatingCard className="group relative">
              <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-8 text-center shadow-2xl transform hover:scale-105 transition-all duration-500">
                <div className="text-6xl font-black text-white mb-2">247K+</div>
                <div className="text-lg font-semibold text-blue-100">Elite Traders</div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
            </FloatingCard>
            
            <FloatingCard className="group relative">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 text-center shadow-2xl transform hover:scale-105 transition-all duration-500">
                <div className="text-6xl font-black text-white mb-2">₹47B+</div>
                <div className="text-lg font-semibold text-emerald-100">Daily Volume</div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs">⚡</span>
                </div>
              </div>
            </FloatingCard>
            
            <FloatingCard className="group relative">
              <div className="bg-gradient-to-br from-orange-600 to-red-700 rounded-3xl p-8 text-center shadow-2xl transform hover:scale-105 transition-all duration-500">
                <div className="text-6xl font-black text-white mb-2">99.8%</div>
                <div className="text-lg font-semibold text-orange-100">AI Accuracy</div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center">
                  <span className="text-xs">🎯</span>
                </div>
              </div>
            </FloatingCard>
            
            <FloatingCard className="group relative">
              <div className="bg-gradient-to-br from-purple-600 to-pink-700 rounded-3xl p-8 text-center shadow-2xl transform hover:scale-105 transition-all duration-500">
                <div className="text-6xl font-black text-white mb-2">15K+</div>
                <div className="text-lg font-semibold text-purple-100">Assets Tracked</div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                  <span className="text-xs">🚀</span>
                </div>
              </div>
            </FloatingCard>
          </div>
        </div>
      </section>

      {/* Revolutionary Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 border border-cyan-500/30 rounded-full"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 border border-purple-500/30 rounded-full"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                QUANTUM FEATURES
              </span>
            </h2>
            <p className="text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Experience the next evolution of financial technology with our 
              <span className="text-cyan-400 font-semibold">quantum-powered</span> trading arsenal
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FloatingCard key={index} className="group relative">
                <div className={`bg-gradient-to-br ${feature.gradient} p-8 rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-500 hover:shadow-3xl`}>
                  <div className="relative z-10">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-500">
                      <div className="text-white">
                        {feature.icon}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                    <p className="text-white/90 leading-relaxed">{feature.description}</p>
                    
                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                      <div className="text-white font-bold text-lg">Explore Feature →</div>
                    </div>
                  </div>
                </div>
              </FloatingCard>
            ))}
          </div>
        </div>
      </section>

      {/* Ultimate CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto text-center">
            <div className="mb-12">
              <h2 className="text-7xl font-black mb-6 leading-tight">
                <span className="bg-gradient-to-r from-yellow-300 via-red-400 to-pink-400 bg-clip-text text-transparent">
                  DOMINATE
                </span>
                <br />
                <span className="text-white">THE MARKETS</span>
              </h2>
              <p className="text-2xl text-gray-200 max-w-4xl mx-auto leading-relaxed">
                Join the elite circle of <span className="text-yellow-400 font-bold">quantum traders</span> who've 
                unlocked the secrets of <span className="text-cyan-400 font-bold">financial supremacy</span>
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
              <GlowButton
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-white font-black py-5 px-12 rounded-2xl text-2xl transform hover:scale-110 transition-all duration-500 shadow-2xl hover:shadow-yellow-500/50"
              >
                🚀 ACTIVATE QUANTUM MODE
              </GlowButton>
              
              <button
                onClick={() => navigate('/news')}
                className="border-3 border-cyan-400 text-cyan-400 font-bold py-5 px-12 rounded-2xl text-xl hover:bg-cyan-400 hover:text-gray-900 transition-all duration-500 shadow-lg hover:shadow-cyan-400/50 backdrop-blur-sm"
              >
                📊 MARKET INTELLIGENCE
              </button>
            </div>
            
            {/* Trust Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-2xl mb-2">🔒</div>
                <div className="text-white font-semibold">Bank-Grade Security</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-2xl mb-2">⚡</div>
                <div className="text-white font-semibold">Lightning Fast</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-2xl mb-2">🎯</div>
                <div className="text-white font-semibold">99.8% Accuracy</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-2xl mb-2">🌟</div>
                <div className="text-white font-semibold">24/7 Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 