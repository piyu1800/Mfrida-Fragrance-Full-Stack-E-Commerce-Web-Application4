import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const NavigationManagement = () => {
  const [navItems, setNavItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    link: '',
    display_order: 0
  });

  useEffect(() => {
    fetchNavigationItems();
    fetchCategories();
  }, []);

  const fetchNavigationItems = async () => {
    try {
      const response = await axios.get(`${API}/admin/navigation`);
      setNavItems(response.data);
    } catch (error) {
      console.error('Error fetching navigation items:', error);
      toast.error('Failed to fetch navigation items');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategorySelect = (categorySlug) => {
    setFormData(prev => ({ ...prev, link: `/products?category=${categorySlug}` }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const navData = {
        ...formData,
        display_order: parseInt(formData.display_order)
      };

      if (editingItem) {
        await axios.put(
          `${API}/admin/navigation/${editingItem.id}`,
          navData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Navigation item updated successfully!');
      } else {
        await axios.post(
          `${API}/admin/navigation`,
          navData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Navigation item created successfully!');
      }

      fetchNavigationItems();
      closeModal();
    } catch (error) {
      console.error('Error saving navigation item:', error);
      toast.error(error.response?.data?.detail || 'Failed to save navigation item');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      label: item.label,
      link: item.link,
      display_order: item.display_order
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this navigation item?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API}/admin/navigation/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Navigation item deleted successfully!');
      fetchNavigationItems();
    } catch (error) {
      console.error('Error deleting navigation item:', error);
      toast.error('Failed to delete navigation item');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      label: '',
      link: '',
      display_order: 0
    });
  };

  return (
    <div className="p-6" data-testid="navigation-management">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#B76E79]">Navigation Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#B76E79] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#A05D6B] transition"
          data-testid="add-navigation-btn"
        >
          <Plus size={20} />
          Add Navigation Item
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Link</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {navItems.map(item => (
              <tr key={item.id} data-testid={`nav-item-row-${item.id}`}>
                <td className="px-6 py-4 text-sm">{item.display_order}</td>
                <td className="px-6 py-4 text-sm font-medium">{item.label}</td>
                <td className="px-6 py-4 text-sm">{item.link}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {item.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-800"
                      data-testid={`edit-nav-${item.id}`}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-800"
                      data-testid={`delete-nav-${item.id}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#B76E79]">
                {editingItem ? 'Edit Navigation Item' : 'Add New Navigation Item'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Label *</label>
                <input
                  type="text"
                  name="label"
                  value={formData.label}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Women's Perfumes"
                  className="w-full border rounded-lg px-3 py-2"
                  data-testid="nav-label-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Link *</label>
                <input
                  type="text"
                  name="link"
                  value={formData.link}
                  onChange={handleInputChange}
                  required
                  placeholder="/products?category=women"
                  className="w-full border rounded-lg px-3 py-2"
                  data-testid="nav-link-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Quick Select Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          label: cat.name,
                          link: `/products?category=${cat.slug}`
                        }));
                      }}
                      className="px-3 py-2 text-sm border rounded hover:bg-gray-50 text-left"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Display Order</label>
                <input
                  type="number"
                  name="display_order"
                  value={formData.display_order}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full border rounded-lg px-3 py-2"
                  data-testid="nav-order-input"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#B76E79] text-white rounded-lg hover:bg-[#A05D6B] disabled:opacity-50"
                  data-testid="submit-nav-btn"
                >
                  {loading ? 'Saving...' : editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavigationManagement;