import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingCart, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function OrderModal({ product, isOpen, onClose }) {
  const [quantity, setQuantity] = useState(1);
  const [placed, setPlaced] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const { placeOrder, addToCart, user, login, setIsCartOpen } = useAppContext();
  
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      setCustomerName(user.name);
      setCustomerPhone(user.phone);
    }
  }, [user]);

  const discount = product?.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedToCart(true);
    setTimeout(() => {
      setAddedToCart(false);
      onClose();
      setIsCartOpen(true);
    }, 800);
  };

  const handleConfirmDirectOrder = async () => {
    setError('');
    const finalName = (user?.name || customerName).trim();
    const finalPhone = (user?.phone || customerPhone).trim();

    if (!finalName) {
      setError('Please enter your full name');
      return;
    }
    if (!finalPhone.match(/^\d{10}$/)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setIsSubmitting(true);
      if (!user) {
        login(finalName, finalPhone);
      }
      await placeOrder(product, quantity, { name: finalName, phone: finalPhone });
      setPlaced(true);
      setTimeout(() => {
        setPlaced(false);
        onClose();
        setQuantity(1);
        navigate('/orders');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to place order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
          />
          {/* Slides up on mobile, centered on desktop */}
          <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.38 }}
              className="w-full sm:max-w-xl bg-white rounded-t-2xl sm:rounded-none overflow-hidden shadow-2xl pointer-events-auto max-h-[90vh] flex flex-col"
            >
              {placed ? (
                <div className="p-12 flex flex-col items-center text-center gap-4">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Order Placed Successfully!</h3>
                  <p className="text-gray-500 text-sm">
                    Saved under <b>{user?.name || customerName}</b> ({user?.phone || customerPhone}).
                    Taking you to your live orders...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row overflow-y-auto">
                  {/* Product image */}
                  <div className="sm:w-52 flex-shrink-0 bg-gray-100 relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-48 sm:h-full object-cover"
                    />
                    {product.badge && (
                      <span className="absolute top-2 left-2 bg-black text-white text-[10px] font-bold px-2 py-0.5">
                        {product.badge}
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
                    {/* Close */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 leading-snug">{product.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xl font-bold text-gray-900">₹{product.price}</span>
                          {product.originalPrice && (
                            <>
                              <span className="text-sm text-gray-400 line-through">₹{product.originalPrice}</span>
                              <span className="text-xs bg-red-100 text-red-600 font-semibold px-1.5 py-0.5">
                                -{discount}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>

                    {/* Quantity Selector */}
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-1.5 font-semibold tracking-wider uppercase">Quantity</p>
                      <div className="inline-flex items-center border border-gray-300">
                        <button
                          onClick={() => setQuantity(q => Math.max(1, q - 1))}
                          className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40"
                          disabled={quantity <= 1}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-10 text-center text-sm font-bold border-x border-gray-300 py-1.5">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(q => Math.min(5, q + 1))}
                          className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40"
                          disabled={quantity >= 5}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Customer Info (Auto-remembered if logged in, otherwise input fields) */}
                    <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                          Customer Details (Saved to Order):
                        </span>
                        {user && <span className="text-[10px] text-green-600 font-semibold">✓ Logged In</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Your Name"
                          value={user?.name || customerName}
                          onChange={e => setCustomerName(e.target.value)}
                          disabled={Boolean(user?.name)}
                          className="w-full text-xs border border-gray-300 p-2 focus:outline-none focus:border-black disabled:bg-gray-50"
                        />
                        <input
                          type="tel"
                          placeholder="10-digit Phone"
                          value={user?.phone || customerPhone}
                          onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          disabled={Boolean(user?.phone)}
                          className="w-full text-xs border border-gray-300 p-2 focus:outline-none focus:border-black disabled:bg-gray-50"
                        />
                      </div>
                    </div>

                    {error && (
                      <p className="text-xs text-red-600 bg-red-50 p-2 border border-red-200 mt-2">{error}</p>
                    )}

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</span>
                      <span className="text-lg font-bold text-gray-900">₹{product.price * quantity}</span>
                    </div>

                    {/* Action Buttons: Add to Cart & Buy Now */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        onClick={handleAddToCart}
                        className="w-full border-2 border-black text-black hover:bg-black hover:text-white text-xs font-bold py-3 uppercase tracking-wider transition-colors flex items-center justify-center space-x-1"
                      >
                        {addedToCart ? <Check className="w-4 h-4 text-green-600" /> : <ShoppingCart className="w-4 h-4" />}
                        <span>{addedToCart ? 'Added!' : 'Add to Cart'}</span>
                      </button>
                      <button
                        onClick={handleConfirmDirectOrder}
                        disabled={isSubmitting}
                        className="w-full bg-black hover:bg-gray-800 text-white text-xs font-bold py-3 uppercase tracking-wider transition-colors disabled:opacity-50"
                      >
                        {isSubmitting ? 'Placing...' : 'Buy Now'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
