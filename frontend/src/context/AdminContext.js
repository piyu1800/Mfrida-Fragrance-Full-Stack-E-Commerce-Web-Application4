import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AdminProvider = ({ children }) => {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user.role === 'admin') {
      setAdminData(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token, user } = response.data;
      
      if (user.role !== 'admin') {
        throw new Error('Access denied. Admin only.');
      }
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setAdminData(user);
      return true;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setAdminData(null);
  };

  return (
    <AdminContext.Provider value={{ adminData, loading, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
};
