import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Image,
  Navigation,
  ShoppingCart,
  Users,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { adminData, logout } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Package, label: 'Products', path: '/admin/products' },
    { icon: FolderTree, label: 'Categories', path: '/admin/categories' },
    { icon: Image, label: 'Banners', path: '/admin/banners' },
    { icon: Navigation, label: 'Navigation', path: '/admin/navigation' },
    { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
    { icon: Users, label: 'Users', path: '/admin/users' },
  ];

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  return (
    <div className="flex h-screen bg-[#FFFDD0]">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r-2 border-[#B76E79]/20 transition-all duration-300 flex flex-col shadow-xl`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b-2 border-[#B76E79]/20 bg-gradient-to-r from-[#B76E79] to-[#D4A5A5]">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-white">Mfirsa Admin</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-6 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-[#B76E79] text-white shadow-lg'
                    : 'text-gray-700 hover:bg-[#B76E79]/10 hover:text-[#B76E79]'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="border-t-2 border-[#B76E79]/20 p-4">
          {sidebarOpen && (
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700">{adminData?.name}</p>
              <p className="text-xs text-gray-500">{adminData?.email}</p>
            </div>
          )}
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-2 border-[#B76E79] text-[#B76E79] hover:bg-[#B76E79] hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {sidebarOpen && 'Logout'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b-2 border-[#B76E79]/20 flex items-center justify-between px-6 shadow-sm">
          <h2 className="text-2xl font-bold text-[#B76E79]">
            {menuItems.find(item => item.path === location.pathname)?.label || 'Admin Panel'}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, <strong>{adminData?.name}</strong></span>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-[#FFFDD0] to-[#FFF5E1]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
