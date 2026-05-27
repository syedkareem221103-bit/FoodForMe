import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, Shield, Mail, Lock, User, Phone, MapPin, Store, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

const Signup = () => {
  const { registerRestaurant } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    restaurantName: '',
    ownerName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    restaurantType: 'Restaurant',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await registerRestaurant(formData);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.message || 'Registration failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Network connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-dark-950 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden animate-fade-in">
      {/* Background Radial Glow Effect */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-brand-500/5 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-2xl z-10">
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

        {/* Signup Container Card */}
        <div className="glass-card border-brand-500/10 p-8 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-brand-500 to-emerald-400"></div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-white font-display">Create Your Restaurant Workspace</h2>
            <p className="text-xs text-dark-400 mt-2">
              Launch your digital menu, order management KDS, and table QR codes in seconds.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl border border-rose-500/10 bg-rose-950/20 text-rose-450 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hotel / Restaurant Name */}
              <div>
                <label className="block text-xs font-bold text-dark-350 uppercase mb-2 tracking-wider">Restaurant/Hotel Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-500">
                    <Store size={14} />
                  </div>
                  <input
                    type="text"
                    name="restaurantName"
                    value={formData.restaurantName}
                    onChange={handleChange}
                    placeholder="e.g. Sizzling Bites Bistro"
                    className="w-full text-xs glass-input pl-10"
                    required
                  />
                </div>
              </div>

              {/* Owner Name */}
              <div>
                <label className="block text-xs font-bold text-dark-350 uppercase mb-2 tracking-wider">Owner Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-500">
                    <User size={14} />
                  </div>
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    placeholder="e.g. Chef John Doe"
                    className="w-full text-xs glass-input pl-10"
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-dark-350 uppercase mb-2 tracking-wider">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-500">
                    <Mail size={14} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. contact@bistro.com"
                    className="w-full text-xs glass-input pl-10"
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-dark-350 uppercase mb-2 tracking-wider">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-500">
                    <Phone size={14} />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. +91 98765 43210"
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
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full text-xs glass-input pl-10"
                    required
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-dark-350 uppercase mb-2 tracking-wider">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-500">
                    <Lock size={14} />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full text-xs glass-input pl-10"
                    required
                  />
                </div>
              </div>

              {/* Restaurant Type */}
              <div className="md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-dark-350 uppercase mb-2 tracking-wider">Restaurant Type</label>
                    <select
                      name="restaurantType"
                      value={formData.restaurantType}
                      onChange={handleChange}
                      className="w-full text-xs glass-input select-arrow cursor-pointer"
                    >
                      <option value="Restaurant">Restaurant</option>
                      <option value="Cafe">Cafe</option>
                      <option value="Hotel">Hotel</option>
                      <option value="Fast Food">Fast Food</option>
                      <option value="Bakery">Bakery</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-dark-350 uppercase mb-2 tracking-wider">Physical Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-500">
                        <MapPin size={14} />
                      </div>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="e.g. 128 Gourmet Street, Sector 4, Bangalore"
                        className="w-full text-xs glass-input pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full glass-btn-primary py-4 text-sm font-extrabold flex items-center justify-center gap-2 mt-4 shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <span>Create Workspace & Start Trial</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6 border-t border-dark-850 pt-6">
            <p className="text-xs text-dark-400">
              Already registered?{' '}
              <Link to="/signin" className="text-brand-450 hover:underline font-bold transition-all">
                Sign In to Workspace
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
