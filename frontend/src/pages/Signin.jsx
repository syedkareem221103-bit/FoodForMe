import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, Mail, Lock, LogIn, Sparkles, AlertCircle } from 'lucide-react';

const Signin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        // Dynamic Role-based routing redirection
        if (res.user.role === 'admin') {
          navigate('/dashboard');
        } else if (res.user.role === 'waiter') {
          navigate('/waiter');
        } else if (res.user.role === 'kitchen') {
          navigate('/kitchen');
        } else {
          navigate('/');
        }
      } else {
        setError(res.message || 'Invalid email or password');
      }
    } catch (err) {
      setError('Could not connect to database server. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-dark-950 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden animate-fade-in">
      {/* Background Radial Glow Effect */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] rounded-full bg-brand-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Logo Branding */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white flex items-center justify-center shadow-lg shadow-brand-500/20">
            <UtensilsCrossed size={20} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Food<span className="text-brand-400">ForMe</span>
            </h1>
            <p className="text-[9px] text-brand-400 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-0.5">
              <Sparkles size={8} />
              <span>Multi-Restaurant SaaS Platform</span>
            </p>
          </div>
        </div>

        {/* Login Container Card */}
        <div className="glass-card border-brand-500/10 p-8 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-brand-500 to-emerald-400"></div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-white font-display">Welcome Back</h2>
            <p className="text-xs text-dark-400 mt-2">
              Sign in to manage your dining workspace, staff, and live analytics reports.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl border border-rose-500/10 bg-rose-950/20 text-rose-450 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-dark-350 uppercase mb-2 tracking-wider">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-500">
                  <Mail size={14} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@restaurant.com"
                  className="w-full text-xs glass-input pl-10"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-dark-350 uppercase mb-2 tracking-wider">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-500">
                  <Lock size={14} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs glass-input pl-10"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full glass-btn-primary py-3.5 text-sm font-extrabold flex items-center justify-center gap-2 mt-4 shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Sign In to Workspace</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6 border-t border-dark-850 pt-6">
            <p className="text-xs text-dark-400">
              New to FoodForMe?{' '}
              <Link to="/signup" className="text-brand-450 hover:underline font-bold transition-all">
                Register Your Restaurant
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signin;
