import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI } from '../api/services';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const saveSession = (data) => {
    localStorage.setItem('cf_token', data.token);
    const { token, ...userData } = data;
    localStorage.setItem('cf_user', JSON.stringify(userData));
    setUser(userData);
  };

  const loadUser = async () => {
    const token = localStorage.getItem('cf_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await authAPI.me();
      setUser(data);
      localStorage.setItem('cf_user', JSON.stringify(data));
    } catch {
      localStorage.removeItem('cf_token');
      localStorage.removeItem('cf_user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials);
    saveSession(data);
    toast.success('Welcome back!');
    return data;
  };

  const register = async (formData) => {
    const { data } = await authAPI.register(formData);
    saveSession(data);
    toast.success('Account created!');
    return data;
  };

  const logout = () => {
    localStorage.removeItem('cf_token');
    localStorage.removeItem('cf_user');
    setUser(null);
    toast.success('Logged out');
  };

  const updateUser = async (profileData) => {
    const { data } = await userAPI.updateProfile(profileData);
    setUser(data);
    localStorage.setItem('cf_user', JSON.stringify(data));
    return data;
  };

  const refreshUser = async () => {
    const { data } = await authAPI.me();
    setUser(data);
    return data;
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser, refreshUser, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
