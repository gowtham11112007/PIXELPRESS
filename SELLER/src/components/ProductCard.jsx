import React from 'react';
import { Trash2 } from 'lucide-react';
import { useSeller } from '../context/SellerContext';

const ProductCard = ({ product }) => {
  const { deleteProduct } = useSeller();

  return (
    <div className="card group">
      <div className="aspect-square w-full overflow-hidden bg-slate-100 relative">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
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
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 truncate">{product.name}</h3>
        <p className="text-brand-600 font-medium mt-1">${parseFloat(product.price).toFixed(2)}</p>
      </div>
    </div>
  );
};

export default ProductCard;
