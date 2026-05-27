import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  UtensilsCrossed, Shield, ChefHat, ClipboardList, QrCode, 
  ArrowRight, Sparkles, CheckCircle, TrendingUp, Zap, Smartphone, Layers 
} from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sandboxId, setSandboxId] = useState('60d5ec49f3e4e201b445af01'); // Mock restaurant ID
  const [sandboxTable, setSandboxTable] = useState('2');

  const pricingPlans = [
    {
      name: 'Starter Trial',
      price: 'Free',
      duration: '14 Days',
      description: 'Ideal for new cafes & test configurations.',
      features: [
        'Single Restaurant Workspace',
        'Up to 10 Dining Tables',
        'Standard QR Card Compilation',
        'Basic Live Kitchen preparation Feed',
        'Waiter billing consoles',
      ],
      cta: 'Start Free Trial',
      link: '/signup',
      popular: false,
    },
    {
      name: 'Pro Premium',
      price: '₹1,999',
      duration: 'month',
      description: 'Perfect for active hotels and busy bistros.',
      features: [
        'Unlimited Tables & Menu Items',
        'High-Resolution PDF QR Cards',
        'ZIP Bulk QR Card Downloader',
        'Real-time Sales aggregates & chart analytics',
        'Unlimited Staff accounts & roles',
        'Priority 24/7 client support',
      ],
      cta: 'Get Pro Premium',
      link: '/signup',
      popular: true,
    },
    {
      name: 'Enterprise Scale',
      price: '₹4,999',
      duration: 'month',
      description: 'Designed for large restaurant chains & multi-locations.',
      features: [
        'Multi-location Tenant Sync',
        'Custom domain mapping (e.g. menu.mycafe.com)',
        'Custom SMS & WhatsApp KOT notifications',
        'Custom branding (Remove FoodForMe logo)',
        'Dedicated server hosting resources',
        'Tailored POS integrations',
      ],
      cta: 'Contact Sales',
      link: '/signup',
      popular: false,
    },
  ];

  const handleSandboxSimulate = (e) => {
    e.preventDefault();
    if (!sandboxId || !sandboxTable) return;
    navigate(`/restaurant/${sandboxId}/table/${sandboxTable}`);
  };

  return (
    <div className="bg-dark-950 min-h-screen text-white relative overflow-hidden animate-fade-in">
      {/* Background Radial Glow Effects */}
      <div className="absolute top-20 left-1/4 h-[500px] w-[500px] rounded-full bg-brand-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[800px] right-10 h-[600px] w-[600px] rounded-full bg-emerald-500/5 blur-[150px] pointer-events-none" />

      {/* Top Staff Quick Portal */}
      <div className="max-w-7xl mx-auto px-6 pt-6 flex justify-end z-20 relative">
        <div className="glass p-1.5 rounded-xl border border-dark-850 flex items-center gap-1">
          <span className="text-[10px] uppercase tracking-wider text-dark-400 font-bold px-2.5 hidden sm:inline">
            Quick Staff Portals:
          </span>
          <button
            onClick={() => navigate(user?.role === 'admin' ? '/dashboard' : '/signin')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-dark-200 hover:text-white hover:bg-dark-800 transition-all border border-transparent hover:border-dark-700 cursor-pointer"
          >
            <Shield size={12} className="text-brand-400" />
            <span>Owner Dashboard</span>
          </button>
          <button
            onClick={() => navigate('/kitchen')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-dark-200 hover:text-white hover:bg-dark-800 transition-all border border-transparent hover:border-dark-700 cursor-pointer"
          >
            <ChefHat size={12} className="text-brand-400" />
            <span>Kitchen Board</span>
          </button>
          <button
            onClick={() => navigate('/waiter')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-dark-200 hover:text-white hover:bg-dark-800 transition-all border border-transparent hover:border-dark-700 cursor-pointer"
          >
            <ClipboardList size={12} className="text-brand-400" />
            <span>Waiter Console</span>
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 text-center z-10 relative">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold mb-6 animate-slide-up">
          <Sparkles size={12} className="animate-pulse" />
          <span>UPGRADE TO MERN MULTI-RESTAURANT SAAS</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto font-display animate-slide-up" style={{ animationDelay: '100ms' }}>
          Turn Your Food Venue Into A <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-emerald-400">
            Smart Dining Experience
          </span>
        </h1>

        <p className="text-sm sm:text-base text-dark-300 max-w-2xl mx-auto mt-6 leading-relaxed animate-slide-up" style={{ animationDelay: '150ms' }}>
          FoodForMe is a high-performance multi-tenant SaaS platform built for cafes, restaurants, and hotels. Issue table QR codes, receive customer orders directly in the kitchen, and manage your staff with real-time financial reporting.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <Link
            to="/signup"
            className="w-full sm:w-auto glass-btn-primary py-4 px-8 text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-brand-500/10 hover:shadow-brand-500/25 duration-350 transform hover:-translate-y-0.5 cursor-pointer"
          >
            <span>Start Your Free Trial</span>
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/signin"
            className="w-full sm:w-auto rounded-xl bg-dark-900 border border-dark-800 hover:bg-dark-800 hover:border-dark-700 text-white font-extrabold py-4 px-8 text-sm transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Sign In to Workspace</span>
          </Link>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-dark-900/60 z-10 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-white">Full-Stack SaaS Capabilities</h2>
          <p className="text-xs text-dark-400 mt-2">Everything you need to scale restaurant services in perfect tenant isolation.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="glass p-8 rounded-2xl border border-dark-850 bg-dark-900/10 hover:border-brand-500/10 transition-colors duration-300">
            <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-6 border border-brand-500/15">
              <QrCode size={20} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">QR Ordering & Menu Showcase</h3>
            <p className="text-xs text-dark-300 leading-relaxed">
              Customers scan uniquely mapped table QR codes to view your digital vegetarian or non-vegetarian food catalog. Place instant orders directly from their device.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass p-8 rounded-2xl border border-dark-850 bg-dark-900/10 hover:border-brand-500/10 transition-colors duration-300">
            <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-6 border border-brand-500/15">
              <ChefHat size={20} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Isolated KDS Kitchen Board</h3>
            <p className="text-xs text-dark-300 leading-relaxed">
              Orders appear in real time on the kitchen prep feed. Kitchen staff can update the estimated cooking timers and notify waiters as soon as the dishes are ready.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass p-8 rounded-2xl border border-dark-850 bg-dark-900/10 hover:border-brand-500/10 transition-colors duration-300">
            <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-6 border border-brand-500/15">
              <TrendingUp size={20} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Real-time Performance Aggregates</h3>
            <p className="text-xs text-dark-300 leading-relaxed">
              Owners get full access to sales aggregates, completed ledger history, top-selling items charts, active table lists, and immediate CSV spreadsheet export tools.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Sandbox Simulator */}
      <section className="max-w-3xl mx-auto px-6 py-12 mb-20 z-10 relative">
        <div className="glass p-8 rounded-3xl border border-brand-500/10 bg-dark-900/20 shadow-xl">
          <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-dark-850/60">
            <div className="rounded-xl bg-brand-500/10 p-2.5 text-brand-400 border border-brand-500/15">
              <Smartphone size={20} className="animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">QR Scanning Simulation Sandbox</h3>
              <p className="text-xs text-dark-400 mt-0.5">
                Simulate scanning a table QR code. Set a Restaurant ID and Table below to experience customer ordering.
              </p>
            </div>
          </div>

          <form onSubmit={handleSandboxSimulate} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-bold text-dark-400 uppercase mb-2 tracking-wider">Restaurant / hotel ID</label>
              <input
                type="text"
                value={sandboxId}
                onChange={(e) => setSandboxId(e.target.value)}
                placeholder="60d5ec49f3e4e201b445af01"
                className="w-full text-xs glass-input py-3"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-dark-400 uppercase mb-2 tracking-wider">Table number</label>
              <input
                type="number"
                value={sandboxTable}
                onChange={(e) => setSandboxTable(e.target.value)}
                placeholder="e.g. 2"
                min="1"
                max="99"
                className="w-full text-xs glass-input py-3"
                required
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full glass-btn-primary py-3 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <QrCode size={13} />
                <span>Simulate Scan URL</span>
              </button>
            </div>
          </form>

          {/* Quick seeded default link reference */}
          <div className="mt-4 text-[10px] text-dark-500 flex justify-between">
            <span>Note: You can fetch your active restaurantId from the owner panel dashboard.</span>
            <span>Simulate table 1-6</span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-dark-900/60 z-10 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-white">Transparent Tenant Subscriptions</h2>
          <p className="text-xs text-dark-400 mt-2">Zero hidden fees. Switch or cancel your subscription plans anytime.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {pricingPlans.map((plan) => (
            <div 
              key={plan.name}
              className={`p-8 rounded-3xl border flex flex-col justify-between relative transition-all duration-300 ${
                plan.popular 
                  ? 'border-brand-500/35 bg-brand-950/5 shadow-[0_0_20px_rgba(72,168,115,0.05)] md:scale-105' 
                  : 'border-dark-850 bg-dark-900/10'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-brand-500 text-[10px] font-extrabold text-white uppercase tracking-wider">
                  Most Popular
                </span>
              )}

              <div>
                <h3 className="text-lg font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-xs text-dark-400 leading-relaxed mb-6">{plan.description}</p>
                
                <div className="flex items-baseline mb-6 border-b border-dark-850 pb-6">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-xs text-dark-450 font-bold ml-1">/ {plan.duration}</span>
                </div>

                <ul className="space-y-3.5 mb-8 text-xs text-dark-300">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-brand-400 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to={plan.link}
                className={`w-full py-3.5 rounded-xl text-center text-xs font-extrabold transition-all duration-200 cursor-pointer block ${
                  plan.popular 
                    ? 'bg-brand-500 hover:bg-brand-400 text-white shadow-md shadow-brand-900/10' 
                    : 'bg-dark-850 hover:bg-dark-800 text-dark-250 hover:text-white border border-dark-800'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
