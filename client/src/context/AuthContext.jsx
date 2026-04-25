// ============================================
// Auth Context — MongoDB & JWT Implementation
// ============================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../lib/api';

const AuthContext = createContext(null);
const TOKEN_KEY = 'visioncure_jwt';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const fetchSession = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/session`, {
          headers: { 'x-auth-token': token }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }
      } catch (err) {
        console.error("Session verification failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  const signUp = async (formData) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      body: formData // FormData — no Content-Type header needed, browser sets it
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      throw new Error('Server connection lost during registration. Please try again.');
    }

    if (!response.ok) throw new Error(data.error || 'Server error');

    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return { user: data.user };
  };

  const signIn = async (email, password) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      throw new Error('Server connection lost during login. Please try again.');
    }

    if (!response.ok) throw new Error(data.error || 'Invalid credentials');

    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return { user: data.user };
  };

  const signInWithGoogle = async (googleToken) => {
    const response = await fetch(`${API_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: googleToken })
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      throw new Error('Server connection lost during Google login. Please try again.');
    }

    if (!response.ok) throw new Error(data.error || 'Google Login failed');

    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return { user: data.user };
  };

  const signOut = async () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const updateProfilePic = (url) => {
    setUser(prev => ({ ...prev, profilePicUrl: url }));
  };

  const getUserName = () => {
    if (!user) return 'User';
    return user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  };

  const getToken = () => localStorage.getItem(TOKEN_KEY);

  const value = {
    user,
    session: user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    getUserName,
    getToken,
    updateProfilePic
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
