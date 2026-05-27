import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, UtensilsCrossed, LogIn, ClipboardList, ChefHat } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Read table number from query parameter if present
  const queryParams = new URLSearchParams(location.search);
  const tableParam = queryParams.get('table');
  const savedTable = localStorage.getItem('tableNumber');
  const activeTable = tableParam || savedTable;

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  return (
    <nav className="glass sticky top-0 z-50 border-b border-dark-800/80 px-6 py-4 shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand Logo */}
        <Link to={activeTable ? `/menu?table=${activeTable}` : '/'} className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform duration-200">
            <UtensilsCrossed size={20} />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white font-display">
              Food<span className="text-brand-400">ForMe</span>
            </span>
            {activeTable && (
              <span className="ml-2.5 inline-flex items-center rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-semibold text-brand-400 border border-brand-500/20">
                Table {activeTable}
              </span>
            )}
          </div>
        </Link>

        {/* Action Buttons / Navigation links */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* Role specific links */}
              {user.role === 'admin' && (
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 text-sm font-medium text-dark-200 hover:text-white transition-colors animate-pulse-subtle"
                >
                  <LayoutDashboard size={16} className="text-brand-400" />
                  <span className="hidden sm:inline">SaaS Dashboard</span>
                </Link>
              )}
              {user.role === 'waiter' && (
                <Link
                  to="/waiter"
                  className="flex items-center gap-1.5 text-sm font-medium text-dark-200 hover:text-white transition-colors"
                >
                  <ClipboardList size={16} className="text-brand-400" />
                  <span className="hidden sm:inline">Waiter Console</span>
                </Link>
              )}
              {user.role === 'kitchen' && (
                <Link
                  to="/kitchen"
                  className="flex items-center gap-1.5 text-sm font-medium text-dark-200 hover:text-white transition-colors"
                >
                  <ChefHat size={16} className="text-brand-400" />
                  <span className="hidden sm:inline">Kitchen Board</span>
                </Link>
              )}

              {/* User Profile Info & Logout */}
              <div className="h-6 w-[1px] bg-dark-800 hidden sm:block"></div>
              <div className="text-right hidden md:block">
                <p className="text-xs text-dark-400 capitalize">{user.role}</p>
                <p className="text-sm font-semibold text-white">{user.name}</p>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-dark-200 hover:text-white px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer border border-dark-700 active:scale-95"
              >
                <LogOut size={16} />
                <span className="hidden md:inline">Log Out</span>
              </button>
            </>
          ) : (
            <>
              {location.pathname !== '/signin' && (
                <div className="flex items-center gap-2">
                  <Link
                    to="/signin"
                    className="flex items-center gap-2 rounded-xl bg-dark-850 hover:bg-dark-800 text-dark-200 hover:text-white px-4 py-2 text-sm font-medium transition-all border border-dark-800"
                  >
                    <LogIn size={16} />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    to="/signup"
                    className="flex items-center gap-1.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white px-4 py-2 text-sm font-bold transition-all shadow-md shadow-brand-900/10"
                  >
                    <Sparkles size={14} />
                    <span>Start Trial</span>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
