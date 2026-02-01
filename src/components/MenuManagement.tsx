import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';
import { MenuItem } from '../types';

interface MenuManagementProps {
  menuItems: MenuItem[];
  onAddItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  onUpdateItem: (id: string, item: Partial<MenuItem>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

export const MenuManagement: React.FC<MenuManagementProps> = ({
  menuItems,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '', // always in LKR since menu items are stored in LKR
    category: 'food' as 'food' | 'beverage',
    subcategory: '',
    description: '',
    image: '',
    available: true,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      category: 'food',
      subcategory: '',
      description: '',
      image: '',
      available: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.subcategory) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      setIsLoading(true);
      // Store price in LKR directly (no conversion needed since menu items are in LKR)
      const itemData = {
        ...formData,
        price: parseFloat(formData.price),
      };
      if (editingId) {
        await onUpdateItem(editingId, itemData);
        setEditingId(null);
      } else {
        await onAddItem(itemData);
        setIsAddingNew(false);
      }
      resetForm();
    } catch (err) {
      console.error('Error saving menu item:', err);
      alert('Failed to save menu item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item: MenuItem) => {
    // Show price in LKR as stored (no conversion needed)
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      subcategory: item.subcategory,
      description: item.description,
      image: item.image || '',
      available: item.available,
    });
    setEditingId(item.id);
    setIsAddingNew(false);
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingId(null);
    resetForm();
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      setIsLoading(true);
      await onUpdateItem(item.id, { available: !item.available });
    } catch (err) {
      console.error('Error updating availability:', err);
      alert('Failed to update availability. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (item: MenuItem) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      try {
        setIsLoading(true);
        await onDeleteItem(item.id);
      } catch (err) {
        console.error('Error deleting item:', err);
        alert('Failed to delete item. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getSubcategories = (category: 'food' | 'beverage') => {
    if (category === 'food') {
      return ['Starters', 'Breakfast', 'Main', 'Desserts'];
    }
    return ['Coffee', 'Tea & Non-Coffee', 'Cold Beverage', 'Fresh Juice', 'Smoothies', 'Milkshakes', 'Soft Drinks'];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
        <button
          onClick={() => {
            setIsAddingNew(true);
            setEditingId(null);
            resetForm();
          }}
          className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Item</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {(isAddingNew || editingId) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter item name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (LKR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter price in LKR (e.g., 500)"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    category: e.target.value as 'food' | 'beverage',
                    subcategory: '' // Reset subcategory when category changes
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="food">Food</option>
                  <option value="beverage">Beverage</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategory *
                </label>
                <select
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select subcategory</option>
                  {getSubcategories(formData.category).map(sub => (
                    <option key={sub} value={sub}>
                      {sub.charAt(0).toUpperCase() + sub.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter item description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tip: Right-click on an image online and select "Copy image address" or use Unsplash, Pexels for free food images
              </p>
              
              {/* Image Preview */}
              {formData.image && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Image Preview:</p>
                  <div className="w-32 h-24 border border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full bg-red-50 flex items-center justify-center text-red-500 text-xs">Invalid Image URL</div>';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="available"
                checked={formData.available}
                onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                className="rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="available" className="text-sm text-gray-700">
                Available for ordering
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isLoading}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
              >
                <Save className="w-4 h-4" />
                <span>{isLoading ? 'Saving...' : editingId ? 'Update Item' : 'Add Item'}</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Menu Items List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Current Menu Items ({menuItems.length})</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {menuItems.map(item => (
            <div key={item.id} className={`border rounded-lg p-4 ${!item.available ? 'bg-gray-50 opacity-60' : 'bg-white'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-600 capitalize">{item.category} • {item.subcategory}</p>
                  <p className="text-lg font-bold text-gray-900">Rs {item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg ml-3"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleAvailability(item)}
                    disabled={isLoading}
                    className={`p-1 rounded transition-colors ${
                      isLoading ? 'text-gray-300 cursor-not-allowed' :
                      item.available 
                        ? 'text-green-600 hover:bg-green-100' 
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={item.available ? 'Disable item' : 'Enable item'}
                  >
                    {item.available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={() => handleEdit(item)}
                    disabled={isLoading}
                    className={`p-1 rounded transition-colors ${
                      isLoading ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'
                    }`}
                    title="Edit item"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={isLoading}
                    className={`p-1 rounded transition-colors ${
                      isLoading ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-100'
                    }`}
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.available 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {item.available ? 'Available' : 'Disabled'}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {menuItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No menu items found</p>
            <p className="text-gray-400 text-sm mt-2">Add your first menu item to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};
