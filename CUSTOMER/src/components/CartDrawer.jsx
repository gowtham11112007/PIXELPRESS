import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, UploadCloud, CheckCircle, Copy, ExternalLink, MapPin, Zap } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { compressImage } from '../lib/imageUtils';

export default function CartDrawer() {
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    removeFromCart, 
    updateCartQuantity, 
    checkoutCart, 
    user, 
    login,
    storeSettings,
    showToast
  } = useAppContext();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [campusLocation, setCampusLocation] = useState('');
  
  // Checkout flow state
  const [step, setStep] = useState('cart'); // 'cart' | 'payment' | 'success'
  const [isOrdering, setIsOrdering] = useState(false);
  const [error, setError] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  
  // Payment step state
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const navigate = useNavigate();

  // Sync state if user changes
  React.useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
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

  // Calculate dynamic total and advance amounts based on store settings & per-product rules
  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const calculateAdvanceAmount = () => {
    if (cart.length === 0) return 0;
    
    let totalAdvance = 0;
    let hasCustomAdvance = false;

    cart.forEach(item => {
      const p = item.product;
      const itemTotal = p.price * item.quantity;

      if (p.advanceType === 'fixed') {
        totalAdvance += (Number(p.advanceValue) || 0) * item.quantity;
        hasCustomAdvance = true;
      } else if (p.advanceType === 'percentage') {
        const pct = Number(p.advanceValue) || 0;
        totalAdvance += Math.round(itemTotal * (pct / 100));
        hasCustomAdvance = true;
      } else if (p.advanceType === 'zero') {
        hasCustomAdvance = true;
      } else {
        // Default store percentage
        const pct = Number(storeSettings.defaultAdvancePercent) || 20;
        totalAdvance += Math.round(itemTotal * (pct / 100));
      }
    });

    if (!hasCustomAdvance) {
      const minAdv = Number(storeSettings.minAdvanceAmount) || 100;
      totalAdvance = Math.max(minAdv, totalAdvance);
    }

    return Math.min(totalAmount, Math.max(0, totalAdvance));
  };

  const advanceAmount = calculateAdvanceAmount();

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(storeSettings.upiId);
    setCopiedUpi(true);
    showToast('UPI ID copied!');
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    setError('');

    const customerName = (user?.name || name).trim();
    const customerPhone = (user?.phone || phone).trim();
    const loc = campusLocation.trim();

    if (!customerName) {
      setError('Please enter your name');
      return;
    }
    if (!customerPhone.match(/^\d{10}$/)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    if (!loc) {
      setError('Please enter your Building Name & Room No (or Dept)');
      return;
    }
    
    if (!user) {
      login(customerName, customerPhone);
    }

    setStep('payment');
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setError('');
        const compressed = await compressImage(file, 800, 800, 0.7);
        setScreenshotFile(file);
        setScreenshotPreview(compressed.dataUrl);
      } catch (err) {
        console.warn('Image preview compression error:', err);
        setScreenshotFile(file);
        setScreenshotPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleFinalCheckout = async () => {
    if (!screenshotFile && !screenshotPreview) {
      setError('Please upload the payment screenshot to proceed.');
      return;
    }

    try {
      setIsUploading(true);
      setError('');
      
      let finalScreenshotUrl = null;

      // 1. Compress image
      let compressed;
      try {
        compressed = await compressImage(screenshotFile, 900, 900, 0.75);
      } catch (cErr) {
        console.warn('Compression fallback to preview:', cErr);
      }

      const uploadDataUrl = compressed?.dataUrl || screenshotPreview;

      // 2. Try Supabase storage upload with graceful fallback
      if (isSupabaseConfigured && supabase && compressed?.blob) {
        try {
          const fileName = `adv_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
          const filePath = `advance_payments/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('payment_screenshots')
            .upload(filePath, compressed.blob, { contentType: 'image/jpeg' });

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from('payment_screenshots')
              .getPublicUrl(filePath);
            finalScreenshotUrl = publicUrlData?.publicUrl || uploadDataUrl;
          } else {
            finalScreenshotUrl = uploadDataUrl;
          }
        } catch {
          finalScreenshotUrl = uploadDataUrl;
        }
      } else {
        finalScreenshotUrl = uploadDataUrl;
      }

      setIsOrdering(true);
      const customerName = (user?.name || name).trim();
      const customerPhone = (user?.phone || phone).trim();
      
      await checkoutCart(
        { name: customerName, phone: customerPhone }, 
        finalScreenshotUrl,
        advanceAmount,
        campusLocation.trim()
      );
      
      setStep('success');
      showToast('Order submitted! Delivering tomorrow inside campus.');
      setTimeout(() => {
        setIsCartOpen(false);
        navigate('/orders');
      }, 2000);

    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'An error occurred during checkout. Please try again.');
    } finally {
      setIsUploading(false);
      setIsOrdering(false);
    }
  };

  // Dynamic QR Code URL (custom uploaded QR or generated UPI QR)
  const upiPayDeepLink = `upi://pay?pa=${encodeURIComponent(storeSettings.upiId)}&pn=${encodeURIComponent(storeSettings.storeName)}&am=${advanceAmount}&cu=INR&tn=Campus%20Advance`;
  const dynamicQrCodeUrl = storeSettings.upiQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiPayDeepLink)}`;

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
                <h2 className="text-base font-bold text-black tracking-tight">
                  {step === 'cart' && `Your Bag (${cart.length})`}
                  {step === 'payment' && 'Verify Advance Payment'}
                  {step === 'success' && 'Order Received'}
                </h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Next-Day Campus Delivery Promise Banner */}
            <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-black flex items-center justify-center gap-1.5 shadow-xs uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>Next-Day Campus Room & Dept Delivery</span>
            </div>

            {/* Content */}
            {step === 'success' ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                  className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="w-9 h-9 text-emerald-600" />
                </motion.div>
                <h3 className="text-xl font-black text-gray-900">Order Placed!</h3>
                <p className="text-gray-600 text-xs leading-relaxed max-w-xs">
                  Your order is sent for payment verification. We will print your items and deliver them <strong>tomorrow to {campusLocation || 'your location'}</strong>!
                </p>
              </div>
            ) : step === 'payment' ? (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col items-center space-y-4">
                <div className="text-center space-y-1.5 w-full">
                  <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Pay Advance Proof</p>
                    <p className="text-3xl font-black text-amber-400">₹{advanceAmount}</p>
                    <div className="flex justify-between text-xs text-slate-300 mt-2 pt-2 border-t border-slate-800">
                      <span>Total: ₹{totalAmount}</span>
                      <span className="font-bold text-amber-300">Pay on Delivery: ₹{totalAmount - advanceAmount}</span>
                    </div>
                  </div>
                </div>

                {/* Dynamic QR Scanner & UPI Info */}
                <div className="bg-white p-3.5 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center w-full shadow-xs">
                  <img 
                    src={dynamicQrCodeUrl} 
                    alt="UPI QR Code" 
                    className="w-40 h-40 object-contain rounded-lg shadow-sm border border-gray-100" 
                  />

                  {/* UPI ID Pill with Copy */}
                  <div className="mt-3 flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full w-full justify-between">
                    <span className="font-mono text-xs font-bold text-gray-800 truncate">
                      {storeSettings.upiId}
                    </span>
                    <button
                      onClick={handleCopyUpi}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors flex items-center gap-1 text-[11px] font-semibold text-gray-700"
                      title="Copy UPI ID"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedUpi ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Direct Mobile UPI Pay button */}
                  <a
                    href={upiPayDeepLink}
                    className="mt-2.5 w-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-blue-200"
                  >
                    <span>Open Any UPI App</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Screenshot Upload Box */}
                <div className="w-full space-y-1.5">
                  <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Upload Payment Screenshot *
                  </label>
                  <div className="relative border-2 border-gray-300 border-dashed rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer overflow-hidden min-h-[110px]">
                    {screenshotPreview ? (
                      <>
                        <img 
                          src={screenshotPreview} 
                          alt="Screenshot" 
                          className="absolute inset-0 w-full h-full object-cover opacity-70" 
                        />
                        <div className="relative z-10 bg-white/95 px-3 py-1.5 rounded-full shadow-md text-xs font-bold flex items-center space-x-1.5 text-gray-900 border border-gray-200">
                           <span>Change Screenshot</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-7 h-7 text-gray-400 mb-1" />
                        <p className="text-xs font-bold text-gray-700">Tap to upload advance proof</p>
                        <p className="text-[10px] text-gray-400">GPay, PhonePe, Paytm screenshot</p>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    />
                  </div>
                </div>
                
                {error && (
                  <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 w-full text-center font-medium">
                    {error}
                  </p>
                )}

                <div className="w-full mt-auto pt-3 border-t border-gray-100 flex gap-2.5">
                  <button 
                    onClick={() => setStep('cart')} 
                    className="flex-1 py-3 border border-gray-200 text-xs font-bold hover:bg-gray-50 transition-colors uppercase tracking-widest text-gray-600 rounded-xl"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleFinalCheckout} 
                    disabled={isUploading || isOrdering || !screenshotPreview} 
                    className="flex-[2] bg-slate-900 hover:bg-black text-white text-xs font-bold py-3 uppercase tracking-widest flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 rounded-xl shadow-md"
                  >
                    <span>{isUploading || isOrdering ? 'Confirming...' : 'Place Order'}</span>
                  </button>
                </div>
              </div>
            ) : cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="text-5xl mb-3">🛍️</div>
                <h3 className="text-base font-bold text-gray-900">Your bag is empty</h3>
                <p className="text-gray-400 text-xs mt-1 mb-6">Explore campus posters, pins & merch!</p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="bg-black text-white text-xs font-bold px-6 py-3 uppercase tracking-widest hover:bg-gray-800 transition-colors rounded-xl shadow-sm"
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              <>
                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex gap-3 border-b border-gray-100 pb-3">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-20 object-cover bg-gray-100 rounded-xl flex-shrink-0 border border-gray-200 shadow-xs"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{item.product.name}</h4>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-sm font-extrabold text-gray-900 mt-0.5">₹{item.product.price}</p>
                        </div>

                        {/* Quantity */}
                        <div className="flex items-center space-x-2 border border-gray-200 w-max px-1.5 py-0.5 mt-1.5 rounded-lg bg-gray-50">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 hover:bg-gray-200 text-gray-700 rounded"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold px-2">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 hover:bg-gray-200 text-gray-700 rounded"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Campus Delivery Address & Customer Details */}
                <div className="p-4 sm:p-5 border-t border-gray-200 bg-gray-50/70 space-y-3">
                  <div className="bg-white p-3.5 border border-gray-200 rounded-2xl space-y-2.5 shadow-xs">
                    <p className="text-[11px] font-bold tracking-wider text-slate-800 uppercase flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-600" />
                      Next-Day Campus Delivery Details:
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Your Name"
                        value={user?.name || name}
                        onChange={e => setName(e.target.value)}
                        disabled={Boolean(user?.name)}
                        className="w-full text-xs border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-black disabled:bg-gray-100 font-medium"
                      />
                      <input
                        type="tel"
                        placeholder="10-digit Phone"
                        value={user?.phone || phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        disabled={Boolean(user?.phone)}
                        className="w-full text-xs border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-black disabled:bg-gray-100 font-medium"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Building Name & Room No (e.g. Block B, Room 304 / Dept)"
                      value={campusLocation}
                      onChange={e => setCampusLocation(e.target.value)}
                      className="w-full text-xs border border-brand-300 bg-brand-50/30 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-slate-900"
                      required
                    />
                  </div>

                  {error && (
                    <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 font-medium">{error}</p>
                  )}

                  <div className="flex justify-between items-center text-sm font-bold text-gray-900 pt-1">
                    <span>Total Amount:</span>
                    <span className="text-xl font-black">₹{totalAmount}</span>
                  </div>

                  <button
                    onClick={handleProceedToPayment}
                    className="w-full bg-slate-900 hover:bg-black text-white text-xs font-bold py-3.5 uppercase tracking-widest flex items-center justify-center space-x-2 transition-colors rounded-xl shadow-md"
                  >
                    <span>Continue to Advance Payment (₹{advanceAmount})</span>
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
