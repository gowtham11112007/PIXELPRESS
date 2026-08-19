import React, { useState, useMemo } from 'react';
import { Plus, Package, Search } from 'lucide-react';
import { useSeller } from '../context/SellerContext';
import ProductCard from '../components/ProductCard';
import ProductFormModal from '../components/ProductFormModal';
import { motion, AnimatePresence } from 'framer-motion';

const Products = () => {
  const { products, collections } = useSeller();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = useMemo(() => {
    const defaultCats = ['All'];
    collections.forEach(c => defaultCats.push(c.name));
    return Array.from(new Set(defaultCats));
  }, [collections]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-7xl mx-auto space-y-6 pb-24"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-brand-600" />
            Products & Merch Inventory
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage posters, pins, split frames, custom prints, and campus stock.
          </p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="btn-primary flex items-center gap-2 shadow-md px-5 py-2.5 text-sm"
        >
          <Plus size={18} />
          Add New Item
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar w-full md:w-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-9 py-1.5 text-xs bg-slate-50 border-slate-200 rounded-lg"
          />
        </div>
      </div>

      {/* Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed max-w-xl mx-auto my-6">
          <div className="mx-auto w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-2xl">
            📦
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No items found</h3>
          <p className="text-xs text-slate-500 mb-4">
            {products.length === 0 ? 'Your store inventory is empty. Add your first campus poster!' : 'No items match your filter.'}
          </p>
          <button 
            onClick={handleOpenAdd}
            className="btn-primary flex items-center gap-2 mx-auto text-xs py-2 px-4 shadow-sm"
          >
            <Plus size={16} />
            Add First Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          <AnimatePresence>
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onEdit={handleOpenEdit}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <ProductFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        editingProduct={editingProduct}
      />
    </motion.div>
  );
};

export default Products;
