import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Check, Pin, Zap } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function ProductCard({ product, onOrderClick }) {
  const { addToCart, showToast, storeSettings } = useAppContext();
  const [added, setAdded] = useState(false);
  const isClosed = storeSettings?.isTemporarilyClosed;

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    if (isClosed) return;
    addToCart(product, 1);
    setAdded(true);
    showToast(`${product.name} added to bag!`);
    setTimeout(() => {
      setAdded(false);
    }, 600);
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between"
      onClick={() => onOrderClick(product)}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden bg-slate-100" style={{ aspectRatio: '3/4' }}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Pinned Badge */}
        {product.isPinned && (
          <div className="absolute top-2 left-2">
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black tracking-wider px-2 py-0.5 rounded shadow-sm flex items-center gap-1 uppercase">
              <Pin className="w-2.5 h-2.5 fill-slate-950" />
              Pinned
            </span>
          </div>
        )}

        {/* Regular Badge */}
        {product.badge && !product.isPinned && (
          <div className="absolute top-2 left-2">
            <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded shadow-sm bg-black text-white uppercase">
              {product.badge}
            </span>
          </div>
        )}

        {/* Discount badge */}
        {discount && (
          <div className="absolute top-2 right-2">
            <span className="text-[10px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded shadow-sm">
              -{discount}%
            </span>
          </div>
        )}

        {/* Next-Day Tag */}
        <div className="absolute bottom-2 left-2">
          <span className="text-[9px] font-bold bg-white/90 backdrop-blur-xs text-slate-900 px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
            Next-Day
          </span>
        </div>

        {/* Desktop Quick Actions overlay */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 grid grid-cols-2">
          <button
            onClick={handleQuickAdd}
            disabled={isClosed}
            className="bg-white text-slate-900 text-xs font-bold py-2.5 tracking-wide hover:bg-slate-50 transition-colors flex items-center justify-center space-x-1 border-r border-slate-200 disabled:opacity-50"
          >
            {added ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ShoppingCart className="w-3.5 h-3.5" />}
            <span>{added ? 'Added' : 'Add'}</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onOrderClick(product); }}
            disabled={isClosed}
            className="bg-slate-950 text-white text-xs font-bold py-2.5 tracking-wide hover:bg-black transition-colors disabled:opacity-50"
          >
            {isClosed ? 'Closed' : 'Order'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4 text-left flex flex-col justify-between flex-1">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5 truncate">
            {product.category || 'Wall Poster'}
          </span>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-1">
            {product.name}
          </h3>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm sm:text-base font-black text-slate-900">₹{product.price}</span>
            {product.originalPrice && (
              <span className="text-[11px] text-slate-400 line-through">₹{product.originalPrice}</span>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={isClosed}
            className="sm:hidden p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-900 transition-colors disabled:opacity-50"
            title="Add to bag"
          >
            {added ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ShoppingCart className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
