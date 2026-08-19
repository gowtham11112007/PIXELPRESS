import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, UploadCloud, CheckCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateCartQuantity, checkoutCart, user, login } = useAppContext();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  
  // Checkout flow state
  const [step, setStep] = useState('cart'); // 'cart' | 'payment' | 'success'
  const [isOrdering, setIsOrdering] = useState(false);
  const [error, setError] = useState('');
  
  // Payment step state
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const navigate = useNavigate();

  // Sync state if user changes
  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone);
    }
  }, [user]);

  // Reset drawer state when it closes or opens
  React.useEffect(() => {
    if (isCartOpen) {
      setStep('cart');
      setScreenshotFile(null);
      setScreenshotPreview(null);
      setError('');
    }
  }, [isCartOpen]);

  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const advanceAmount = Math.max(100, Math.floor(totalAmount * 0.2)); // 20% advance or minimum 100

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    setError('');

    const customerName = (user?.name || name).trim();
    const customerPhone = (user?.phone || phone).trim();

    if (!customerName) {
      setError('Please enter your full name');
      return;
    }
    if (!customerPhone.match(/^\d{10}$/)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    
    // Validate login and save user locally for the session
    if (!user) {
      login(customerName, customerPhone);
    }

    setStep('payment');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScreenshotFile(file);
      setScreenshotPreview(URL.createObjectURL(file));
    }
  };

  const handleFinalCheckout = async () => {
    if (!screenshotFile) {
      setError('Please upload the payment screenshot to proceed.');
      return;
    }

    try {
      setIsUploading(true);
      setError('');
      
      let uploadedUrl = null;

      // Only upload if Supabase is actually configured
      if (isSupabaseConfigured && supabase) {
        const fileExt = screenshotFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `advance_payments/${fileName}`;

        const { data, error: uploadError } = await supabase.storage
          .from('payment_screenshots')
          .upload(filePath, screenshotFile);

        if (uploadError) {
          throw new Error('Failed to upload screenshot. Please try again.');
        }

        const { data: publicUrlData } = supabase.storage
          .from('payment_screenshots')
          .getPublicUrl(filePath);
          
        uploadedUrl = publicUrlData.publicUrl;
      } else {
        // Fallback for local demo mode
        uploadedUrl = screenshotPreview;
      }

      setIsOrdering(true);
      const customerName = (user?.name || name).trim();
      const customerPhone = (user?.phone || phone).trim();
      
      await checkoutCart({ name: customerName, phone: customerPhone }, uploadedUrl);
      
      setStep('success');
      setTimeout(() => {
        setIsCartOpen(false);
        navigate('/orders');
      }, 2500);

    } catch (err) {
      setError(err.message || 'An error occurred during checkout.');
    } finally {
      setIsUploading(false);
      setIsOrdering(false);
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:max-w-md bg-white z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-black" />
                <h2 className="text-lg font-bold text-black tracking-tight">
                  {step === 'cart' && `Your Cart (${cart.length})`}
                  {step === 'payment' && 'Advance Payment'}
                  {step === 'success' && 'Order Placed'}
                </h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            {step === 'success' ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                  className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900">Payment Submitted!</h3>
                <p className="text-gray-500 text-sm">
                  Your order is pending payment review. Taking you to My Orders...
                </p>
              </div>
            ) : step === 'payment' ? (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col items-center space-y-6">
                <div className="text-center space-y-2 w-full">
                  <p className="text-sm text-gray-600">Please pay the advance amount to confirm your order. The balance can be paid on delivery.</p>
                  <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg">
                    <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">Advance Amount</p>
                    <p className="text-3xl font-bold text-black">₹{advanceAmount}</p>
                    <p className="text-xs text-gray-400 mt-1">Total: ₹{totalAmount} (Balance: ₹{totalAmount - advanceAmount})</p>
                  </div>
                </div>

                {/* Mock QR Code for Demo */}
                <div className="bg-white p-4 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="UPI QR Code" className="w-40 h-40 opacity-80" />
                  <p className="font-mono text-sm font-bold mt-3 text-gray-800">pixelpress@upi</p>
                  <p className="text-xs text-gray-500 mt-1">Scan or use UPI ID to pay</p>
                </div>

                <div className="w-full space-y-3">
                  <label className="block text-sm font-semibold text-gray-900">Upload Payment Screenshot *</label>
                  <div className="relative border-2 border-gray-200 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer overflow-hidden">
                    {screenshotPreview ? (
                      <>
                        <img src={screenshotPreview} alt="Screenshot" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                        <div className="relative z-10 bg-white/90 px-4 py-2 rounded-full shadow-sm text-sm font-semibold flex items-center space-x-2">
                           <span>Change Image</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm font-medium text-gray-600">Tap to upload screenshot</p>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 5MB</p>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                </div>
                
                {error && <p className="text-xs text-red-600 bg-red-50 p-2 border border-red-200 w-full text-center">{error}</p>}

                <div className="w-full mt-auto pt-4 border-t border-gray-100 flex gap-3">
                  <button onClick={() => setStep('cart')} className="flex-1 py-3.5 border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors uppercase tracking-widest text-gray-600">
                    Back
                  </button>
                  <button onClick={handleFinalCheckout} disabled={isUploading || isOrdering || !screenshotFile} className="flex-[2] bg-black hover:bg-gray-800 text-white text-xs font-semibold py-3.5 uppercase tracking-widest flex items-center justify-center space-x-2 transition-colors disabled:opacity-50">
                    <span>{isUploading || isOrdering ? 'Processing...' : 'Submit Order'}</span>
                  </button>
                </div>
              </div>
            ) : cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="text-5xl mb-3">🛍️</div>
                <h3 className="text-base font-semibold text-gray-900">Your cart is empty</h3>
                <p className="text-gray-400 text-xs mt-1 mb-6">Explore our trending posters and add them to cart!</p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="bg-black text-white text-xs font-semibold px-6 py-2.5 uppercase tracking-widest hover:bg-gray-800 transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <>
                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex gap-3 border-b border-gray-100 pb-4">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-20 object-cover bg-gray-100 flex-shrink-0"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">{item.product.name}</h4>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-sm font-bold text-gray-900 mt-0.5">₹{item.product.price}</p>
                        </div>

                        {/* Quantity */}
                        <div className="flex items-center space-x-2 border border-gray-200 w-max px-1 py-0.5 mt-2">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 hover:bg-gray-100 text-gray-600"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-semibold px-2">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 hover:bg-gray-100 text-gray-600"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Checkout Section & Customer Details */}
                <div className="p-4 sm:p-5 border-t border-gray-200 bg-gray-50/50 space-y-4">
                  {/* Customer Info Form */}
                  <div className="bg-white p-3 border border-gray-200 space-y-2">
                    <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                      Ordering Customer Details:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Your Name"
                        value={user?.name || name}
                        onChange={e => setName(e.target.value)}
                        disabled={Boolean(user?.name)}
                        className="w-full text-xs border border-gray-300 p-2 focus:outline-none focus:border-black disabled:bg-gray-100"
                      />
                      <input
                        type="tel"
                        placeholder="10-digit Phone"
                        value={user?.phone || phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        disabled={Boolean(user?.phone)}
                        className="w-full text-xs border border-gray-300 p-2 focus:outline-none focus:border-black disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-xs text-red-600 bg-red-50 p-2 border border-red-200">{error}</p>
                  )}

                  <div className="flex justify-between items-center text-sm font-bold text-gray-900">
                    <span>Total Amount:</span>
                    <span className="text-lg">₹{totalAmount}</span>
                  </div>

                  <button
                    onClick={handleProceedToPayment}
                    className="w-full bg-black hover:bg-gray-800 text-white text-xs font-semibold py-3.5 uppercase tracking-widest flex items-center justify-center space-x-2 transition-colors"
                  >
                    <span>Proceed to Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
