import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Key, Mail, LogIn, ChefHat, ClipboardList } from 'lucide-react';

const AdminLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    const res = await login(email, password);
    if (res.success) {
      // Redirect based on role
      const role = res.user.role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'waiter') navigate('/waiter');
      else if (role === 'kitchen') navigate('/kitchen');
      else navigate('/');
    } else {
      setError(res.message || 'Invalid credentials');
      setLoading(false);
    }
  };

  // Helper function to quickly fill login credentials
  const fillCredentials = (role) => {
    if (role === 'admin') {
      setEmail('admin@foodforme.com');
      setPassword('password123');
    } else if (role === 'waiter') {
      setEmail('waiter@foodforme.com');
      setPassword('password123');
    } else if (role === 'kitchen') {
      setEmail('kitchen@foodforme.com');
      setPassword('password123');
    }
  };

  return (
    <div className="mx-auto max-w-md px-6 py-16 animate-slide-up">
      <div className="glass rounded-2xl p-8 border-dark-850 shadow-2xl relative overflow-hidden">
        {/* Decorative Top Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-600 to-brand-400"></div>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-4">
            <Shield size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white font-display">Staff Console Login</h1>
          <p className="text-dark-400 text-sm mt-1">
            Access admin controls, kitchen sheets, or waiter logs.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/10 bg-rose-950/20 text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-dark-300 mb-1.5" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-dark-500">
                <Mail size={16} />
              </span>
              <input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 glass-input text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-300 mb-1.5" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-dark-500">
                <Key size={16} />
              </span>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 glass-input text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full glass-btn-primary flex items-center justify-center gap-2 mt-6 cursor-pointer"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <LogIn size={16} />
                <span>Log In</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Login Buttons */}
        <div className="mt-8 border-t border-dark-850 pt-6">
          <p className="text-center text-xs font-semibold text-dark-400 mb-4">
            Simulate Staff Logins (Demo Credentials)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => fillCredentials('admin')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-dark-900 border border-dark-800 hover:border-brand-500/40 text-dark-200 hover:text-white cursor-pointer transition-all duration-200"
            >
              <Shield size={16} className="text-brand-400 mb-1" />
              <span className="text-[10px] font-semibold">Admin</span>
            </button>
            <button
              onClick={() => fillCredentials('waiter')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-dark-900 border border-dark-800 hover:border-brand-500/40 text-dark-200 hover:text-white cursor-pointer transition-all duration-200"
            >
              <ClipboardList size={16} className="text-brand-400 mb-1" />
              <span className="text-[10px] font-semibold">Waiter</span>
            </button>
            <button
              onClick={() => fillCredentials('kitchen')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-dark-900 border border-dark-800 hover:border-brand-500/40 text-dark-200 hover:text-white cursor-pointer transition-all duration-200"
            >
              <ChefHat size={16} className="text-brand-400 mb-1" />
              <span className="text-[10px] font-semibold">Kitchen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
