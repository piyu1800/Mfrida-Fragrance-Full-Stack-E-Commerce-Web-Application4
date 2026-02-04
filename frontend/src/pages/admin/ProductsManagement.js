import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, X, Upload, XCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProductsManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    brand: 'Mfrida',
    category_id: '',
    price: '',
    discount: 0,
    description: '',
    fragrance_notes: '',
    stock: 0,
    is_featured: false,
    is_best_selling: false,
    is_new_arrival: false
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/products/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories/`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const newImages = [];

    try {
      for (const file of files) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const response = await axios.post(`${API}/upload/image?type=products`, uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        newImages.push(response.data.image_url);
      }
      
      setUploadedImages(prev => [...prev, ...newImages]);
      toast.success(`${files.length} image(s) uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (uploadedImages.length === 0) {
      toast.error('Please upload at least one product image');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        discount: parseFloat(formData.discount),
        stock: parseInt(formData.stock),
        images: uploadedImages,
        related_products: []
      };

      if (editingProduct) {
        await axios.put(
          `${API}/products/${editingProduct.id}`,
          productData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Product updated successfully!');
      } else {
        await axios.post(
          `${API}/products/`,
          productData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Product created successfully!');
      }

      fetchProducts();
      closeModal();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.detail || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setUploadedImages(product.images || []);
    setFormData({
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      category_id: product.category_id,
      price: product.price,
      discount: product.discount,
      description: product.description,
      fragrance_notes: product.fragrance_notes,
      stock: product.stock,
      is_featured: product.is_featured,
      is_best_selling: product.is_best_selling,
      is_new_arrival: product.is_new_arrival
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Product deleted successfully!');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setUploadedImages([]);
    setFormData({
      name: '',
      slug: '',
      brand: 'Mfrida',
      category_id: '',
      price: '',
      discount: 0,
      description: '',
      fragrance_notes: '',
      stock: 0,
      is_featured: false,
      is_best_selling: false,
      is_new_arrival: false
    });
  };

  return (
    <div className="p-6" data-testid="products-management">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#B76E79]">Products Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#B76E79] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#A05D6B] transition"
          data-testid="add-product-btn"
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map(product => (
              <tr key={product.id} data-testid={`product-row-${product.id}`}>
                <td className="px-6 py-4">
                  <img src={product.images[0]} alt={product.name} className="w-16 h-16 object-cover rounded" />
                </td>
                <td className="px-6 py-4 text-sm">{product.name}</td>
                <td className="px-6 py-4 text-sm">
                  {categories.find(c => c.id === product.category_id)?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm">₹{product.final_price}</td>
                <td className="px-6 py-4 text-sm">{product.stock}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-1">
                    {product.is_featured && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Featured</span>}
                    {product.is_best_selling && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Best Selling</span>}
                    {product.is_new_arrival && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">New</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-800"
                      data-testid={`edit-product-${product.id}`}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-800"
                      data-testid={`delete-product-${product.id}`}
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
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#B76E79]">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                  className="w-full border rounded-lg px-3 py-2"
                  data-testid="product-name-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Slug (auto-generated)</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                  className="w-full border rounded-lg px-3 py-2 bg-gray-50"
                  readOnly
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                    className="w-full border rounded-lg px-3 py-2"
                    data-testid="product-category-select"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Brand</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full border rounded-lg px-3 py-2"
                    data-testid="product-price-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Discount (%)</label>
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Stock *</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full border rounded-lg px-3 py-2"
                    data-testid="product-stock-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Product Images *</label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="product-image-upload"
                    data-testid="product-image-input"
                  />
                  <label
                    htmlFor="product-image-upload"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <Upload size={32} className="text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      {uploading ? 'Uploading...' : 'Click to upload images (multiple allowed)'}
                    </span>
                  </label>
                  
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-4">
                      {uploadedImages.map((url, index) => (
                        <div key={index} className="relative">
                          <img src={url} alt={`Product ${index + 1}`} className="w-full h-24 object-cover rounded" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full border rounded-lg px-3 py-2"
                  data-testid="product-description-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fragrance Notes</label>
                <input
                  type="text"
                  name="fragrance_notes"
                  value={formData.fragrance_notes}
                  onChange={handleInputChange}
                  placeholder="e.g., Top: Rose, Middle: Jasmine, Base: Musk"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleInputChange}
                    className="rounded"
                  />
                  <span className="text-sm">Featured Product</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_best_selling"
                    checked={formData.is_best_selling}
                    onChange={handleInputChange}
                    className="rounded"
                  />
                  <span className="text-sm">Best Selling</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_new_arrival"
                    checked={formData.is_new_arrival}
                    onChange={handleInputChange}
                    className="rounded"
                  />
                  <span className="text-sm">New Arrival</span>
                </label>
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
                  data-testid="submit-product-btn"
                >
                  {loading ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsManagement;