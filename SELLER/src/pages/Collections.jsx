import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Plus, Trash2, Edit3, Sparkles, X, Upload } from 'lucide-react';
import { useSeller } from '../context/SellerContext';
import { compressImage } from '../lib/imageUtils';

export default function Collections() {
  const { collections, addCollection, updateCollection, deleteCollection, products } = useSeller();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', image: '' });
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openAddModal = () => {
    setEditingCollection(null);
    setFormData({ name: '', description: '', image: '' });
    setPreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (col) => {
    setEditingCollection(col);
    setFormData({ name: col.name, description: col.description || '', image: col.image });
    setPreview(col.image);
    setIsModalOpen(true);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 600, 750, 0.8);
        setPreview(compressed.dataUrl);
        setFormData(prev => ({ ...prev, image: compressed.dataUrl }));
      } catch (err) {
        console.error(err);
        const url = URL.createObjectURL(file);
        setPreview(url);
        setFormData(prev => ({ ...prev, image: url }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.image) return;

    try {
      setIsSubmitting(true);
      if (editingCollection) {
        await updateCollection(editingCollection.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          image: formData.image
        });
      } else {
        await addCollection({
          name: formData.name.trim(),
          description: formData.description.trim(),
          image: formData.image
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-6xl mx-auto space-y-6 pb-24"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-brand-600" />
            Collections & Categories
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage storefront collection tiles and filter categories for students.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="btn-primary flex items-center gap-2 shadow-md px-5 py-2.5 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {collections.map((col) => {
          const itemCount = products.filter(p => p.category === col.name).length;
          return (
            <div 
              key={col.id} 
              className="card group overflow-hidden border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
                  <img 
                    src={col.image} 
                    alt={col.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-4">
                    <div>
                      <h3 className="text-white font-bold text-base">{col.name}</h3>
                      <p className="text-slate-300 text-xs line-clamp-1">{col.description || 'Collection tile'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {itemCount} {itemCount === 1 ? 'Product' : 'Products'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(col)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                      title="Edit Collection"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete collection "${col.name}"?`)) {
                          deleteCollection(col.id);
                        }
                      }}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                      title="Delete Collection"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add/Edit Collection */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: "spring", duration: 0.3, bounce: 0.2 }}
              className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl z-10 overflow-hidden my-auto"
            >
              <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70">
                <h2 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  {editingCollection ? 'Edit Collection' : 'Create New Collection'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Cover Photo *
                  </label>
                  <div className="border-2 border-slate-300 border-dashed rounded-xl p-4 hover:border-brand-500 transition-colors relative overflow-hidden group cursor-pointer text-center bg-slate-50 min-h-[110px] flex items-center justify-center">
                    {preview ? (
                      <>
                        <img src={preview} alt="Preview" className="w-20 h-20 object-cover rounded-lg shadow-sm" />
                        <div className="ml-3 text-left">
                          <p className="text-xs font-bold text-slate-800">Cover Loaded</p>
                          <p className="text-[11px] text-brand-600 font-semibold mt-0.5">Click to replace photo</p>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="mx-auto h-6 w-6 text-slate-400" />
                        <p className="text-xs font-bold text-slate-700">Upload collection cover</p>
                        <p className="text-[10px] text-slate-400">JPG, PNG, WebP</p>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageChange} required={!formData.image} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Collection Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Split Posters, Anime, Custom Pins"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Short Description / Tagline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Multi-frame wall setups for student rooms"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="btn-secondary flex-1 py-2.5 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="btn-primary flex-1 py-2.5 shadow-md text-xs font-bold"
                  >
                    {isSubmitting ? 'Saving...' : editingCollection ? 'Update Collection' : 'Create Collection'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
