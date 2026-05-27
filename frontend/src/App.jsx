import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Import Pages
import HomePage from './pages/HomePage';
import Menu from './pages/Menu';
import Signup from './pages/Signup';
import Signin from './pages/Signin';
import SaaSWebDashboard from './pages/SaaSWebDashboard';
import WaiterDashboard from './pages/WaiterDashboard';
import KitchenDashboard from './pages/KitchenDashboard';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex min-h-screen flex-col bg-dark-950 text-dark-50">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public SaaS & Customer Dining Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/signin" element={<Signin />} />
              <Route path="/login" element={<Navigate to="/signin" replace />} />
              
              <Route path="/restaurant/:restaurantId/table/:tableNumber" element={<Menu />} />
              <Route path="/table/:tableNumber" element={<Menu />} />
              <Route path="/menu" element={<Menu />} />

              {/* Protected Staff & Owner Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <SaaSWebDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={<Navigate to="/dashboard" replace />}
              />
              <Route
                path="/waiter"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'waiter']}>
                    <WaiterDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/kitchen"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'kitchen']}>
                    <KitchenDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
