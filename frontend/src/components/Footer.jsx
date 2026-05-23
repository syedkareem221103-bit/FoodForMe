import React from 'react';
import { Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full py-6 mt-12 border-t border-dark-900 bg-dark-950/40 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <p className="text-sm font-semibold text-dark-300">
            Food<span className="text-brand-400">ForMe</span>
          </p>
          <p className="text-xs text-dark-500 mt-1">
            © {new Date().getFullYear()} FoodForMe Technologies. All rights reserved.
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-dark-400">
          <span>Smart Restaurant Dining System</span>
          <Heart size={12} className="text-brand-500 fill-brand-500 animate-pulse-subtle" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
