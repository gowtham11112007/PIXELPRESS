import React from 'react';
import { Trash2, Edit3, Pin, Percent, EyeOff, CheckCircle } from 'lucide-react';
import { useSeller } from '../context/SellerContext';

const ProductCard = ({ product, onEdit }) => {
  const { deleteProduct, togglePinProduct, toggleStockProduct, storeSettings } = useSeller();

  const getAdvanceBadge = () => {
    if (!product.advanceType || product.advanceType === 'default') {
      return `Default (${storeSettings.defaultAdvancePercent}%)`;
    }
    if (product.advanceType === 'percentage') {
      return `${product.advanceValue}% Adv`;
    }
    if (product.advanceType === 'fixed') {
      return `₹${product.advanceValue} Adv`;
    }
    if (product.advanceType === 'zero') {
      return `Full COD`;
    }
    return null;
  };

  return (
    <div className={`card group relative flex flex-col justify-between transition-all duration-200 ${
      product.isPinned ? 'ring-2 ring-amber-400/80 shadow-md' : ''
    } ${!product.isInStock ? 'opacity-70 grayscale-30' : ''}`}>
      <div>
        <div className="aspect-[4/5] w-full overflow-hidden bg-slate-100 relative rounded-t-xl">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Pinned Badge */}
          {product.isPinned && (
            <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm uppercase tracking-wider flex items-center gap-1">
              <Pin className="w-2.5 h-2.5 fill-white" />
              Pinned
            </span>
          )}

          {/* Badge */}
          {product.badge && !product.isPinned && (
            <span className="absolute top-2 left-2 bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">
              {product.badge}
            </span>
          )}

          {/* Stock Indicator */}
          {!product.isInStock && (
            <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase">
              Out of Stock
            </span>
          )}

          {/* Category Pill */}
          <span className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded shadow-sm">
            {product.category || 'Wall Art'}
          </span>

          {/* Quick Action Overlay on Hover */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
            <button 
              onClick={() => onEdit(product)}
              className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors shadow-lg"
              title="Edit Product"
            >
              <Edit3 size={16} />
            </button>
            <button 
              onClick={() => togglePinProduct(product.id)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-lg ${
                product.isPinned ? 'bg-amber-400 text-white hover:bg-amber-500' : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
              title={product.isPinned ? 'Unpin Product' : 'Pin to Top of Store'}
            >
              <Pin size={16} className={product.isPinned ? 'fill-white' : ''} />
            </button>
            <button 
              onClick={() => {
                if (window.confirm(`Remove "${product.name}" from store?`)) {
                  deleteProduct(product.id);
                }
              }}
              className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors shadow-lg"
              title="Delete Product"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="p-3.5 space-y-1.5">
          <h3 className="font-bold text-slate-900 text-sm truncate" title={product.name}>
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2">
            <span className="text-slate-900 font-extrabold text-base">₹{product.price}</span>
            {product.originalPrice && (
              <span className="text-slate-400 line-through text-xs">₹{product.originalPrice}</span>
            )}
          </div>
        </div>
      </div>

      {/* Advance Rule Indicator Footer */}
      <div className="px-3.5 pb-3 pt-1 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px]">
        <button
          onClick={() => toggleStockProduct(product.id)}
          className={`font-semibold text-[10px] px-1.5 py-0.5 rounded transition-colors ${
            product.isInStock ? 'text-emerald-700 hover:bg-emerald-50' : 'text-red-700 hover:bg-red-50'
          }`}
          title="Click to toggle stock"
        >
          {product.isInStock ? '● In Stock' : '○ Out of Stock'}
        </button>

        <span className="font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 text-[10px]">
          {getAdvanceBadge()}
        </span>
      </div>
    </div>
  );
};

export default ProductCard;
