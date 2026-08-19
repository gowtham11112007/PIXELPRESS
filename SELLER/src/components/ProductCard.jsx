import React from 'react';
import { Trash2, Percent } from 'lucide-react';
import { useSeller } from '../context/SellerContext';

const ProductCard = ({ product }) => {
  const { deleteProduct, storeSettings } = useSeller();

  const getAdvanceBadge = () => {
    if (!product.advanceType || product.advanceType === 'default') {
      return `Default (${storeSettings.defaultAdvancePercent}%)`;
    }
    if (product.advanceType === 'percentage') {
      return `${product.advanceValue}% Advance`;
    }
    if (product.advanceType === 'fixed') {
      return `₹${product.advanceValue} Advance`;
    }
    if (product.advanceType === 'zero') {
      return `Full COD`;
    }
    return null;
  };

  return (
    <div className="card group relative flex flex-col justify-between">
      <div>
        <div className="aspect-[4/5] w-full overflow-hidden bg-slate-100 relative rounded-t-xl">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Badge */}
          {product.badge && (
            <span className="absolute top-2 left-2 bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">
              {product.badge}
            </span>
          )}

          {/* Category Pill */}
          <span className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded shadow-sm">
            {product.category || 'Wall Art'}
          </span>

          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <button 
              onClick={() => deleteProduct(product.id)}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors shadow-lg"
              title="Delete Product"
            >
              <Trash2 size={18} />
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
        <span className="text-slate-500 font-medium flex items-center gap-1">
          <Percent className="w-3 h-3 text-brand-600" />
          Advance:
        </span>
        <span className="font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
          {getAdvanceBadge()}
        </span>
      </div>
    </div>
  );
};

export default ProductCard;
