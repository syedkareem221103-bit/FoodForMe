import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, Shield, ChefHat, ClipboardList, QrCode, ArrowRight, Sparkles, Utensils } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tableInput, setTableInput] = useState('');
  const [error, setError] = useState('');

  const demoTables = [1, 2, 3, 4, 5, 6];

  const handleStartOrdering = (e) => {
    e.preventDefault();
    const tableNum = parseInt(tableInput);
    if (!tableNum || tableNum <= 0 || tableNum > 99) {
      setError('Please enter a valid table number (1-99)');
      return;
    }
    setError('');
    localStorage.setItem('tableNumber', tableNum);
    navigate(`/table/${tableNum}`);
  };

  const handleDemoTableClick = (tableNum) => {
    localStorage.setItem('tableNumber', tableNum);
    navigate(`/table/${tableNum}`);
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-dark-950 flex flex-col items-center justify-between px-6 py-12 relative overflow-hidden animate-fade-in">
      {/* Background Radial Glow Effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] rounded-full bg-brand-500/5 blur-[120px] pointer-events-none" />

      {/* Staff Login Panel */}
      <div className="w-full max-w-5xl flex justify-end mb-8 z-10">
        <div className="glass p-1.5 rounded-xl border-dark-850 flex items-center gap-1">
          <span className="text-[10px] uppercase tracking-wider text-dark-400 font-bold px-2.5 hidden sm:inline">
            Staff Access:
          </span>
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-dark-200 hover:text-white hover:bg-dark-800 transition-all border border-transparent hover:border-dark-700 cursor-pointer"
          >
            <Shield size={13} className="text-brand-400" />
            <span>Admin</span>
          </button>
          <button
            onClick={() => navigate('/kitchen')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-dark-200 hover:text-white hover:bg-dark-800 transition-all border border-transparent hover:border-dark-700 cursor-pointer"
          >
            <ChefHat size={13} className="text-brand-400" />
            <span>Kitchen</span>
          </button>
          <button
            onClick={() => navigate('/waiter')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-dark-200 hover:text-white hover:bg-dark-800 transition-all border border-transparent hover:border-dark-700 cursor-pointer"
          >
            <ClipboardList size={13} className="text-brand-400" />
            <span>Waiter</span>
          </button>
        </div>
      </div>

      {/* Center Customer Section */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md z-10 my-auto">
        {/* Branding Header */}
        <div className="flex items-center gap-3 mb-6 animate-slide-up">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white flex items-center justify-center shadow-lg shadow-brand-500/20 animate-pulse-subtle">
            <UtensilsCrossed size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Food<span className="text-brand-400">ForMe</span>
            </h1>
            <p className="text-[10px] text-brand-400 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
              <Sparkles size={10} className="animate-pulse" />
              <span>Smart Ordering System</span>
            </p>
          </div>
        </div>

        {/* Customer Seating Card */}
        <div className="w-full glass-card border-brand-500/10 p-8 rounded-2xl shadow-2xl relative overflow-hidden animate-slide-up" style={{ animationDelay: '100ms' }}>
          {/* Decorative Top Line */}
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-brand-500 to-emerald-400"></div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-extrabold text-white font-display">Scan & Order Food</h2>
            <p className="text-xs text-dark-400 mt-1.5">
              Enter your table number to continue to our digital menu
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl border border-rose-500/10 bg-rose-950/20 text-rose-400 text-xs font-semibold text-center animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleStartOrdering} className="space-y-5">
            <div>
              <label className="block text-[10px] uppercase font-bold text-dark-400 mb-2 tracking-wider text-center">
                Your Table Number
              </label>
              <input
                type="number"
                min="1"
                max="99"
                placeholder="e.g. 5"
                value={tableInput}
                onChange={(e) => setTableInput(e.target.value)}
                className="w-full text-center text-2xl font-extrabold text-white tracking-widest glass-input py-4 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30"
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              className="w-full glass-btn-primary py-3.5 text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Start Ordering</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Demo Simulation Sandbox */}
      <div className="w-full max-w-3xl mt-12 z-10 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <div className="glass p-6 rounded-2xl border-dark-850 bg-dark-900/10">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-dark-850/60">
            <div className="rounded-lg bg-brand-500/10 p-2 text-brand-400 border border-brand-500/15">
              <QrCode size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Simulation Sandbox</h3>
              <p className="text-[11px] text-dark-400 mt-0.5">
                Simulate scanning a physical table's unique QR code directly:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            {demoTables.map((tableNum) => (
              <button
                key={tableNum}
                onClick={() => handleDemoTableClick(tableNum)}
                className="p-3.5 rounded-xl border border-dark-850 bg-dark-900/40 hover:bg-brand-500/10 hover:border-brand-500/20 transition-all duration-200 group text-center cursor-pointer"
              >
                <div className="h-7 w-7 rounded-full bg-dark-800 group-hover:bg-brand-500/10 flex items-center justify-center text-dark-300 group-hover:text-brand-400 transition-colors mx-auto mb-2">
                  <Utensils size={13} />
                </div>
                <span className="text-xs font-bold text-white group-hover:text-brand-400 block">Table {tableNum}</span>
                <span className="text-[9px] text-dark-500 group-hover:text-brand-400/80 transition-colors mt-0.5 block">Mock Scan</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
