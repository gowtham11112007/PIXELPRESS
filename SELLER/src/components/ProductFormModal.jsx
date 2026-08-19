import React, { useState, useEffect } from 'react';
import { X, Upload, Percent, Sparkles, Pin, CheckCircle } from 'lucide-react';
import { useSeller } from '../context/SellerContext';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImage } from '../lib/imageUtils';

const ProductFormModal = ({ isOpen, onClose, editingProduct = null }) => {
  const { addProduct, updateProduct, collections, storeSettings } = useSeller();
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    originalPrice: '',
    category: 'Wall Setups',
    badge: '',
    image: '',
    advanceType: 'default',
    advanceValue: '',
    isPinned: false,
    isInStock: true
  });

  const [imageInputMode, setImageInputMode] = useState('upload');
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync form data if editing
  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || '',
        price: editingProduct.price || '',
        originalPrice: editingProduct.originalPrice || '',
        category: editingProduct.category || 'Wall Setups',
        badge: editingProduct.badge || '',
        image: editingProduct.image || '',
        advanceType: editingProduct.advanceType || 'default',
        advanceValue: editingProduct.advanceValue || '',
        isPinned: Boolean(editingProduct.isPinned),
        isInStock: editingProduct.isInStock !== false
      });
      setPreview(editingProduct.image || null);
    } else {
      setFormData({
        name: '',
        price: '',
        originalPrice: '',
        category: collections[0]?.name || 'Wall Setups',
        badge: '',
        image: '',
        advanceType: 'default',
        advanceValue: '',
        isPinned: false,
        isInStock: true
      });
      setPreview(null);
    }
  }, [editingProduct, isOpen, collections]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 800, 1000, 0.8);
        setPreview(compressed.dataUrl);
        setFormData(prev => ({ ...prev, image: compressed.dataUrl }));
      } catch (err) {
        console.error('Image compression error:', err);
        const url = URL.createObjectURL(file);
        setPreview(url);
        setFormData(prev => ({ ...prev, image: url }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.image) return;

    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        category: formData.category,
        badge: formData.badge.trim() || null,
        image: formData.image,
        advanceType: formData.advanceType,
        advanceValue: formData.advanceValue ? parseFloat(formData.advanceValue) : 0,
        isPinned: formData.isPinned,
        isInStock: formData.isInStock
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await addProduct(payload);
      }

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = collections.length > 0 
    ? collections.map(c => c.name) 
    : ['Wall Setups', 'Split Posters', 'Anime & Gym', 'Pins & Stickers', 'Custom Prints'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[92vh] flex flex-col"
          >
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-600" />
                {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Item / Poster'}
              </h2>
              <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Image Input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Product Photo *
                  </label>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setImageInputMode('upload')}
                      className={`font-semibold ${imageInputMode === 'upload' ? 'text-brand-600 underline' : 'text-slate-400'}`}
                    >
                      Upload File
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('url')}
                      className={`font-semibold ${imageInputMode === 'url' ? 'text-brand-600 underline' : 'text-slate-400'}`}
                    >
                      Image URL
                    </button>
                  </div>
                </div>

                {imageInputMode === 'upload' ? (
                  <div className="border-2 border-slate-300 border-dashed rounded-xl p-4 hover:border-brand-500 transition-colors relative overflow-hidden group cursor-pointer text-center bg-slate-50 min-h-[120px] flex items-center justify-center">
                    {preview ? (
                      <>
                        <img src={preview} alt="Preview" className="w-24 h-24 object-cover rounded-lg shadow-sm" />
                        <div className="ml-4 text-left">
                          <p className="text-xs font-bold text-slate-800">Photo Loaded</p>
                          <p className="text-[11px] text-brand-600 font-semibold mt-0.5">Click to replace photo</p>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="mx-auto h-7 w-7 text-slate-400" />
                        <p className="text-xs font-bold text-slate-700">Click to upload poster/merch photo</p>
                        <p className="text-[10px] text-slate-400">PNG, JPG, WebP supported</p>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageChange} required={!formData.image} />
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={formData.image}
                      onChange={(e) => {
                        setFormData({ ...formData, image: e.target.value });
                        setPreview(e.target.value);
                      }}
                      className="input-field text-xs"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Item Title *
                </label>
                <input 
                  type="text" 
                  className="input-field text-sm" 
                  placeholder="e.g. Iron Man 3-Piece Split Wall Poster"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              {/* Category & Badge */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Collection / Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="input-field text-xs bg-white"
                  >
                    {categoryOptions.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Badge / Tag (Optional)
                  </label>
                  <input 
                    type="text" 
                    className="input-field text-xs" 
                    placeholder="e.g. BEST SELLER, HOT, NEW"
                    value={formData.badge}
                    onChange={(e) => setFormData({...formData, badge: e.target.value})}
                  />
                </div>
              </div>

              {/* Pricing (Selling Price & Original Price) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Selling Price (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                    <input 
                      type="number" 
                      min="0"
                      step="1"
                      className="input-field pl-7 text-sm font-bold" 
                      placeholder="499"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Original Price (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                    <input 
                      type="number" 
                      min="0"
                      step="1"
                      className="input-field pl-7 text-sm" 
                      placeholder="799"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({...formData, originalPrice: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Advance Payment Configuration */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-amber-700" />
                    Advance Payment Rule
                  </label>
                  <span className="text-[10px] font-semibold text-amber-700">
                    Store Default: {storeSettings.defaultAdvancePercent}% (Min ₹{storeSettings.minAdvanceAmount})
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <select
                    value={formData.advanceType}
                    onChange={(e) => setFormData({ ...formData, advanceType: e.target.value })}
                    className="input-field text-xs bg-white border-amber-300"
                  >
                    <option value="default">Use Store Default %</option>
                    <option value="percentage">Custom Percentage (%)</option>
                    <option value="fixed">Fixed Advance Amount (₹)</option>
                    <option value="zero">Zero Advance (Full COD)</option>
                  </select>

                  {formData.advanceType === 'percentage' && (
                    <input
                      type="number"
                      min="1"
                      max="100"
                      placeholder="e.g. 50 (%)"
                      value={formData.advanceValue}
                      onChange={(e) => setFormData({ ...formData, advanceValue: e.target.value })}
                      className="input-field text-xs bg-white border-amber-300"
                      required
                    />
                  )}

                  {formData.advanceType === 'fixed' && (
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 150 (₹)"
                      value={formData.advanceValue}
                      onChange={(e) => setFormData({ ...formData, advanceValue: e.target.value })}
                      className="input-field text-xs bg-white border-amber-300"
                      required
                    />
                  )}
                </div>
              </div>

              {/* Pin to Top & Stock Status */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Pin className="w-3.5 h-3.5 text-amber-500" />
                      Pin to Top
                    </span>
                    <span className="text-[10px] text-slate-400 block">Feature at top of store</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.isInStock}
                    onChange={(e) => setFormData({ ...formData, isInStock: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      In Stock
                    </span>
                    <span className="text-[10px] text-slate-400 block">Available for students</span>
                  </div>
                </label>
              </div>

              {/* Submit / Action Buttons */}
              <div className="pt-3 flex gap-3">
                <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5 text-xs font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 py-2.5 shadow-md text-xs font-bold">
                  {isSubmitting ? 'Saving...' : editingProduct ? 'Save Product Changes' : 'Publish to Store'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProductFormModal;
