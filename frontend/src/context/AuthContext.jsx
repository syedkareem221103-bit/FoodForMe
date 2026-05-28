import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

let base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
// Normalize: Remove trailing slash if present
if (base.endsWith('/')) {
  base = base.slice(0, -1);
}
// Normalize: Ensure the path includes '/api' so it maps correctly to Express routes
if (!base.endsWith('/api') && !base.includes('/api/')) {
  base = `${base}/api`;
}
export const API_BASE_URL = base;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  // Set Authorization headers for API calls
  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };
  };

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: getAuthHeaders(),
        });
        const resData = await response.json();

        if (resData.success) {
          setUser(resData.user);
        } else {
          // Token expired or invalid
          localStorage.removeItem('token');
          setToken('');
          setUser(null);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        return { 
          success: false, 
          message: `Server returned an invalid response (${response.status} ${response.statusText})` 
        };
      }

      if (response.ok && data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || `Login failed with status ${response.status}` };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: `Server connection failed: ${error.message}` };
    } finally {
      setLoading(false);
    }
  };

  const registerRestaurant = async (restaurantData) => {
    setLoading(true);
    try {
      let endpoint = `${API_BASE_URL}/auth/register-restaurant`;
      let response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(restaurantData),
      });

      // Fail-safe Retrying: If 404, automatically fall back to /auth/signup route alias
      if (response.status === 404) {
        console.warn(`Primary endpoint ${endpoint} returned 404. Retrying with /auth/signup alias...`);
        endpoint = `${API_BASE_URL}/auth/signup`;
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(restaurantData),
        });
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        return { 
          success: false, 
          message: `Server returned an invalid response (${response.status} ${response.statusText})` 
        };
      }

      if (response.ok && data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user, restaurant: data.restaurant };
      } else {
        return { success: false, message: data.message || `Registration failed with status ${response.status}` };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: `Server connection failed: ${error.message}` };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, registerRestaurant, getAuthHeaders }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
