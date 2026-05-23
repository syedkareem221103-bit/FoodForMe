import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, ArrowRight, Utensils, ShieldAlert, Award } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const tables = [1, 2, 3, 4, 5, 6];

  const handleTableScan = (tableNum) => {
    localStorage.setItem('tableNumber', tableNum);
    navigate(`/menu?table=${tableNum}`);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 animate-fade-in">
      {/* Hero Section */}
      <div className="text-center py-8">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-4 py-1.5 text-sm font-semibold text-brand-400 border border-brand-500/15 mb-6">
          <Award size={16} />
          <span>Next-Generation Restaurant Dining</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white font-display mb-6">
          Delicious Food, Ordered <br/>
          <span className="bg-gradient-to-r from-brand-400 to-emerald-400 bg-clip-text text-transparent text-glow">
            Instantly from Your Table
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-dark-300 mb-10 leading-relaxed">
          FoodForMe bridges the gap between tables and kitchens. Scan a table QR code to explore our delicious menu and place orders in seconds. No waiting, no hassle.
        </p>
      </div>

      {/* Grid: Simulating QR Scan */}
      <div className="mt-8 glass-card max-w-4xl mx-auto p-8 border-brand-500/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-dark-850">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-brand-500/10 p-3 text-brand-400 border border-brand-500/20">
              <QrCode size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Simulate a QR Code Scan</h2>
              <p className="text-sm text-dark-400 mt-1">
                Select one of the restaurant tables below to simulate scanning its unique QR code:
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {tables.map((tableNum) => (
            <button
              key={tableNum}
              onClick={() => handleTableScan(tableNum)}
              className="flex flex-col items-center justify-center p-6 rounded-xl border border-dark-850 bg-dark-900/50 hover:bg-brand-500/10 hover:border-brand-500/30 transition-all duration-300 group cursor-pointer"
            >
              <div className="h-12 w-12 rounded-full bg-dark-850 group-hover:bg-brand-500/20 flex items-center justify-center text-dark-300 group-hover:text-brand-400 transition-colors mb-3">
                <Utensils size={20} />
              </div>
              <span className="text-lg font-bold text-white group-hover:text-brand-400">Table {tableNum}</span>
              <span className="text-xs text-dark-500 mt-1">Simulate Scan</span>
              <div className="flex items-center gap-1 text-xs text-brand-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                <span>View Menu</span>
                <ArrowRight size={12} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6 mt-16">
        <div className="glass-card p-6">
          <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-4">
            <QrCode size={20} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">1. Scan Table QR</h3>
          <p className="text-sm text-dark-300">
            Sit down, scan the QR code using your phone's camera, and watch the digital menu instantly load.
          </p>
        </div>

        <div className="glass-card p-6">
          <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-4">
            <Utensils size={20} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">2. Order Food</h3>
          <p className="text-sm text-dark-300">
            Browse through starters, main courses, and beverages, add items to cart, and send them directly to the kitchen.
          </p>
        </div>

        <div className="glass-card p-6">
          <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-4">
            <ShieldAlert size={20} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">3. Serve & Pay</h3>
          <p className="text-sm text-dark-300">
            The kitchen processes the order and the waiter delivers it hot to your table. Complete the payment seamlessly at the end.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
