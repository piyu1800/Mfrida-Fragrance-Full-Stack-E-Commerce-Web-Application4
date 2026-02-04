import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CATEGORY_IMAGES = [
  'https://images.pexels.com/photos/30981935/pexels-photo-30981935.jpeg',
  'https://images.unsplash.com/photo-1545936761-c64b78657cb1',
  'https://images.pexels.com/photos/7986711/pexels-photo-7986711.jpeg',
  'https://images.pexels.com/photos/14381803/pexels-photo-14381803.jpeg'
];

const CategoriesManagement = () => {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    is_active: true,
    display_order: 1
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories/`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    }
  };

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const categoryData = {
        ...formData,
        display_order: parseInt(formData.display_order),
        image_url: CATEGORY_IMAGES[Math.floor(Math.random() * CATEGORY_IMAGES.length)]
      };

      if (editingCategory) {
        await axios.put(
          `${API}/categories/${editingCategory.id}`,
          categoryData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Category updated successfully!');
      } else {
        await axios.post(
          `${API}/categories/`,
          categoryData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Category created successfully!');
      }

      fetchCategories();
      closeModal();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(error.response?.data?.detail || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description,
      is_active: category.is_active,
      display_order: category.display_order
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Category deleted successfully!');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      is_active: true,
      display_order: 1
    });
  };

  return (
    <div className="p-6" data-testid="categories-management">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#B76E79]">Categories Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#B76E79] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#A05D6B] transition"
          data-testid="add-category-btn"
        >
          <Plus size={20} />
          Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(category => (
          <div key={category.id} className="bg-white rounded-lg shadow p-6" data-testid={`category-card-${category.id}`}>
            <img
              src={category.image_url}
              alt={category.name}
              className="w-full h-40 object-cover rounded-lg mb-4"
            />
            <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{category.description}</p>
            <div className="flex items-center justify-between">
              <span className={`px-2 py-1 rounded text-xs ${category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {category.is_active ? 'Active' : 'Inactive'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="text-blue-600 hover:text-blue-800"
                  data-testid={`edit-category-${category.id}`}
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="text-red-600 hover:text-red-800"
                  data-testid={`delete-category-${category.id}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#B76E79]">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                  className="w-full border rounded-lg px-3 py-2"
                  data-testid="category-name-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Slug (auto-generated)</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  readOnly
                  className="w-full border rounded-lg px-3 py-2 bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full border rounded-lg px-3 py-2"
                  data-testid="category-description-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Display Order</label>
                <input
                  type="number"
                  name="display_order"
                  value={formData.display_order}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="rounded"
                />
                <span className="text-sm">Active Category</span>
              </label>

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
                  data-testid="submit-category-btn"
                >
                  {loading ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesManagement;