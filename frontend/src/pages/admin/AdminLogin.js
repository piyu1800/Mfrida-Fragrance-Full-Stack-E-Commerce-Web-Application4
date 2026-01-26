import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { toast } from 'sonner';
import { Lock, Mail } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAdmin();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back, Admin!');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFFDD0] via-[#FFF5E1] to-[#FFE4E1] p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-[#B76E79]/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#B76E79] rounded-full mb-4">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#B76E79] mb-2">Admin Portal</h1>
            <p className="text-gray-600">Mfirsa Fragrance Management</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="pl-10 h-12 border-2 border-gray-200 focus:border-[#B76E79] rounded-lg"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10 h-12 border-2 border-gray-200 focus:border-[#B76E79] rounded-lg"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#B76E79] hover:bg-[#A65D68] text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-[1.02]"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Admin access only</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
