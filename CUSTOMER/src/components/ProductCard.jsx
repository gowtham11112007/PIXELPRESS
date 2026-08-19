import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function ProductCard({ product, onOrderClick }) {
  const { addToCart, setIsCartOpen, showToast } = useAppContext();
  const [added, setAdded] = useState(false);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAdded(true);
    showToast(`${product.name} added to cart!`);
    setTimeout(() => {
      setAdded(false);
    }, 600);
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="product-card group cursor-pointer flex flex-col justify-between"
      onClick={() => onOrderClick(product)}
    >
      {/* Image Container — tall poster aspect ratio like Posterized */}
      <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: '3/4' }}>
        <img
          src={product.image}
          alt={product.name}
          className="product-image w-full h-full object-cover object-center transition-transform duration-500"
          loading="lazy"
        />

        {/* Badge */}
        {product.badge && (
          <div className="absolute top-2 left-2">
            <span className={`text-[10px] font-semibold tracking-widest px-2 py-0.5 rounded-sm ${
              product.badge === 'SALE' ? 'bg-red-600 text-white' :
              product.badge === 'NEW'  ? 'bg-black text-white' :
              product.badge === 'HOT' ? 'bg-orange-500 text-white' :
              product.badge === 'CUSTOM' ? 'bg-purple-700 text-white' :
              'bg-black text-white'
            }`}>
              {product.badge}
            </span>
          </div>
        )}

        {/* Discount badge */}
        {discount && (
          <div className="absolute top-2 right-2">
            <span className="text-[10px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded-sm">
              -{discount}%
            </span>
          </div>
        )}

        {/* Quick Actions overlay on hover (Desktop) */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 grid grid-cols-2">
          <button
            onClick={handleQuickAdd}
            className="bg-white text-black text-xs font-bold py-3 tracking-wide hover:bg-gray-100 transition-colors flex items-center justify-center space-x-1 border-r border-gray-200"
          >
            {added ? <Check className="w-3.5 h-3.5 text-green-600" /> : <ShoppingCart className="w-3.5 h-3.5" />}
            <span>{added ? 'Added' : 'Add'}</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onOrderClick(product); }}
            className="bg-black text-white text-xs font-bold py-3 tracking-wide hover:bg-gray-800 transition-colors"
          >
            Buy Now
          </button>
        </div>
      </div>

      {/* Info — centered, like Posterized */}
      <div className="pt-3 pb-1 text-center">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 leading-snug line-clamp-2 px-1">
          {product.name}
        </h3>
        <div className="flex items-center justify-center gap-2 mt-1.5">
          <span className="text-sm sm:text-base font-bold text-gray-900">₹{product.price}</span>
          {product.originalPrice && (
            <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
