import React, { useState } from 'react';
import { X, Upload, Percent, Sparkles } from 'lucide-react';
import { useSeller } from '../context/SellerContext';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImage } from '../lib/imageUtils';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const CATEGORIES = [
  'Wall Setups',
  'Split Posters',
  'Motivation',
  'Cars & Motors',
  'Minimal',
  'Custom Prints',
  'Apparel',
  'Accessories'
];

const ProductFormModal = ({ isOpen, onClose }) => {
  const { addProduct, storeSettings } = useSeller();
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    originalPrice: '',
    category: 'Wall Setups',
    badge: '',
    image: '',
    advanceType: 'default', // 'default' | 'percentage' | 'fixed' | 'zero'
    advanceValue: ''
  });

  const [imageInputMode, setImageInputMode] = useState('upload'); // 'upload' | 'url'
  const [imageBlob, setImageBlob] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setError('');
      try {
        const compressed = await compressImage(file, 800, 1000, 0.8);
        setPreview(compressed.dataUrl);
        setImageBlob(compressed.blob || file);
        setFormData(prev => ({ ...prev, image: compressed.dataUrl }));
      } catch (err) {
        console.error('Image compression error:', err);
        const url = URL.createObjectURL(file);
        setPreview(url);
        setImageBlob(file);
        setFormData(prev => ({ ...prev, image: url }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please enter a product name.');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Please enter a valid price.');
      return;
    }
    if (!formData.image && !imageBlob) {
      setError('Please upload an image or provide an image URL.');
      return;
    }

    try {
      setIsSubmitting(true);
      let finalImageUrl = formData.image;

      // Try uploading to Supabase Storage if file is present
      if (imageBlob && isSupabaseConfigured && supabase) {
        try {
          const fileExt = imageBlob.type ? imageBlob.type.split('/')[1] : 'jpg';
          const fileName = `prod_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `products/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('product_images')
            .upload(filePath, imageBlob, {
              cacheControl: '3600',
              upsert: false
            });

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from('product_images')
              .getPublicUrl(filePath);

            if (publicUrlData?.publicUrl) {
              finalImageUrl = publicUrlData.publicUrl;
            }
          }
        } catch (storageErr) {
          console.warn('Storage upload fallback to base64:', storageErr.message);
        }
      }

      await addProduct({
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        category: formData.category,
        badge: formData.badge.trim() || null,
        image: finalImageUrl,
        advanceType: formData.advanceType,
        advanceValue: formData.advanceValue ? parseFloat(formData.advanceValue) : 0
      });

      // Reset form
      setFormData({
        name: '',
        price: '',
        originalPrice: '',
        category: 'Wall Setups',
        badge: '',
        image: '',
        advanceType: 'default',
        advanceValue: ''
      });
      setPreview(null);
      setImageBlob(null);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add product.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-600" />
                Add New Product
              </h2>
              <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Image Input Section */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Product Image *
                  </label>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setImageInputMode('upload')}
                      className={`font-semibold ${imageInputMode === 'upload' ? 'text-brand-600 underline' : 'text-slate-400'}`}
                    >
                      File Upload
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('url')}
                      className={`font-semibold ${imageInputMode === 'url' ? 'text-brand-600 underline' : 'text-slate-400'}`}
                    >
                      Paste Image URL
                    </button>
                  </div>
                </div>

                {imageInputMode === 'upload' ? (
                  <div className="border-2 border-slate-300 border-dashed rounded-xl p-4 hover:border-brand-500 transition-colors relative overflow-hidden group cursor-pointer text-center bg-slate-50 min-h-[120px] flex items-center justify-center">
                    {preview ? (
                      <>
                        <img src={preview} alt="Preview" className="w-24 h-24 object-cover rounded-lg shadow-sm" />
                        <div className="ml-4 text-left">
                          <p className="text-xs font-bold text-slate-800">Image Loaded</p>
                          <p className="text-[11px] text-brand-600 font-semibold mt-0.5">Click or drag to change</p>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="mx-auto h-7 w-7 text-slate-400" />
                        <p className="text-xs font-bold text-slate-700">Click to upload product photo</p>
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
                    {preview && (
                      <div className="mt-2 flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <img src={preview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                        <span className="text-xs text-slate-600 truncate">Image URL preview</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Product Name *
                </label>
                <input 
                  type="text" 
                  className="input-field text-sm" 
                  placeholder="e.g. Porsche 911 GT3 Split Wall Set"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              {/* Category & Badge */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="input-field text-xs bg-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Badge (Optional)
                  </label>
                  <input 
                    type="text" 
                    className="input-field text-xs" 
                    placeholder="e.g. BEST SELLER, NEW, SALE"
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
                      placeholder="599"
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
                      placeholder="899"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({...formData, originalPrice: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Advance Payment Configuration for this product */}
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

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">
                  {error}
                </div>
              )}

              {/* Modal Buttons */}
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 py-2.5 shadow-md">
                  {isSubmitting ? 'Saving Product...' : 'Publish Product'}
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
