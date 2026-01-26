import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, X, Upload } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BannersManagement = () => {
  const [banners, setBanners] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    cta_text: '',
    cta_link: '',
    display_order: 0
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await axios.get(`${API}/banners`);
      setBanners(response.data);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('Failed to fetch banners');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      const response = await axios.post(`${API}/upload/image?type=banners`, uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, image_url: response.data.image_url }));
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const bannerData = {
        ...formData,
        display_order: parseInt(formData.display_order)
      };

      if (editingBanner) {
        await axios.put(
          `${API}/banners/${editingBanner.id}`,
          bannerData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Banner updated successfully!');
      } else {
        await axios.post(
          `${API}/banners`,
          bannerData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Banner created successfully!');
      }

      fetchBanners();
      closeModal();
    } catch (error) {
      console.error('Error saving banner:', error);
      toast.error(error.response?.data?.detail || 'Failed to save banner');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      image_url: banner.image_url,
      cta_text: banner.cta_text || '',
      cta_link: banner.cta_link || '',
      display_order: banner.display_order
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API}/banners/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Banner deleted successfully!');
      fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Failed to delete banner');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      image_url: '',
      cta_text: '',
      cta_link: '',
      display_order: 0
    });
  };

  return (
    <div className="p-6" data-testid="banners-management">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#B76E79]">Banners Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#B76E79] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#A05D6B] transition"
          data-testid="add-banner-btn"
        >
          <Plus size={20} />
          Add Banner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map(banner => (
          <div key={banner.id} className="bg-white rounded-lg shadow overflow-hidden" data-testid={`banner-card-${banner.id}`}>
            <img src={banner.image_url} alt={banner.title} className="w-full h-48 object-cover" />
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-1">{banner.title}</h3>
              {banner.subtitle && <p className="text-sm text-gray-600 mb-2">{banner.subtitle}</p>}
              <div className="flex items-center justify-between mt-4">
                <span className={`px-2 py-1 rounded text-xs ${banner.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {banner.is_active ? 'Active' : 'Inactive'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(banner)}
                    className="text-blue-600 hover:text-blue-800"
                    data-testid={`edit-banner-${banner.id}`}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="text-red-600 hover:text-red-800"
                    data-testid={`delete-banner-${banner.id}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#B76E79]">
                {editingBanner ? 'Edit Banner' : 'Add New Banner'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full border rounded-lg px-3 py-2"
                  data-testid="banner-title-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Subtitle</label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Banner Image *</label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="banner-image-upload"
                  />
                  <label
                    htmlFor="banner-image-upload"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <Upload size={32} className="text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      {uploading ? 'Uploading...' : 'Click to upload image'}
                    </span>
                  </label>
                  {formData.image_url && (
                    <img src={formData.image_url} alt="Preview" className="mt-4 w-full h-48 object-cover rounded" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">CTA Text</label>
                  <input
                    type="text"
                    name="cta_text"
                    value={formData.cta_text}
                    onChange={handleInputChange}
                    placeholder="Shop Now"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">CTA Link</label>
                  <input
                    type="text"
                    name="cta_link"
                    value={formData.cta_link}
                    onChange={handleInputChange}
                    placeholder="/products"
                    className="w-full border rounded-lg px-3 py-2"
                  />
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
                  disabled={loading || uploading}
                  className="px-4 py-2 bg-[#B76E79] text-white rounded-lg hover:bg-[#A05D6B] disabled:opacity-50"
                  data-testid="submit-banner-btn"
                >
                  {loading ? 'Saving...' : editingBanner ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannersManagement;