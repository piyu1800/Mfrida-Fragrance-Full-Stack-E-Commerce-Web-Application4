import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer'
  });
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast.success('Login successful!');
      } else {
        await signup(formData.name, formData.email, formData.password, formData.role);
        toast.success('Account created successfully!');
      }
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-24 px-6" data-testid="auth-page">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl mb-4">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="text-[#585858]">{isLogin ? 'Sign in to your account' : 'Join the Mfrida family'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-sm uppercase tracking-widest mb-3">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-transparent border-b border-[#1A1A1A]/30 focus:border-[#1A1A1A] outline-none px-0 py-4 transition-colors"
                required={!isLogin}
                data-testid="name-input"
              />
            </div>
          )}

          <div>
            <label className="block text-sm uppercase tracking-widest mb-3">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-transparent border-b border-[#1A1A1A]/30 focus:border-[#1A1A1A] outline-none px-0 py-4 transition-colors"
              required
              data-testid="email-input"
            />
          </div>

          <div>
            <label className="block text-sm uppercase tracking-widest mb-3">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-transparent border-b border-[#1A1A1A]/30 focus:border-[#1A1A1A] outline-none px-0 py-4 transition-colors"
              required
              data-testid="password-input"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm uppercase tracking-widest mb-3">Account Type</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-transparent border-b border-[#1A1A1A]/30 focus:border-[#1A1A1A] outline-none px-0 py-4 transition-colors"
                data-testid="role-select"
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1A1A1A] text-[#FDFBF7] py-4 rounded-none hover:bg-[#B76E79] transition-colors duration-500 disabled:opacity-50"
            data-testid="submit-button"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-8">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-[#585858] hover:text-[#1A1A1A] transition-colors"
            data-testid="toggle-auth-mode"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
