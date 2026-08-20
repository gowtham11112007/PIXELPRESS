import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingCart, ArrowRight, ArrowLeft, MapPin, Copy, UploadCloud, QrCode, Check, CheckCircle, Trash2 } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { compressImage } from "../lib/imageUtils";

export default function CartDrawer() {
  const { 
    isCartOpen, 
    setIsCartOpen, 
    cart, 
    removeFromCart, 
    updateCartQuantity, 
    checkoutCart, 
    user, 
    login,
    storeSettings, 
    showToast 
  } = useAppContext();

  // Steps: 'cart' | 'details' | 'payment' | 'success'
  const [step, setStep] = useState('cart');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [campusLocation, setCampusLocation] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment state
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setCustomerName(user.name || '');
      setCustomerPhone(user.phone || '');
    }
  }, [user]);

  // Reset state when drawer opens/closes
  useEffect(() => {
    if (isCartOpen) {
      setStep('cart');
      setError('');
      setCampusLocation('');
      setScreenshotFile(null);
      setScreenshotPreview(null);
      setCopiedUpi(false);
      setIsSubmitting(false);
    }
  }, [isCartOpen]);

  const totalAmount = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  // Calculate advance for the entire cart
  const advanceAmount = cart.reduce((sum, item) => {
    const p = item.product;
    const itemTotal = p.price * item.quantity;
    let itemAdvance = 0;
    
    if (p.advanceType === 'fixed') {
      itemAdvance = Math.min(itemTotal, (Number(p.advanceValue) || 0) * item.quantity);
    } else if (p.advanceType === 'percentage') {
      itemAdvance = Math.min(itemTotal, Math.round(itemTotal * ((Number(p.advanceValue) || 0) / 100)));
    } else if (p.advanceType === 'zero') {
      itemAdvance = 0;
    } else {
      const pct = Number(storeSettings?.defaultAdvancePercent) || 20;
      itemAdvance = Math.round(itemTotal * (pct / 100));
    }
    return sum + itemAdvance;
  }, 0);

  // Apply minimum advance amount if the calculated advance is less than the minimum
  const minAdv = Number(storeSettings?.minAdvanceAmount) || 100;
  const finalAdvanceAmount = advanceAmount > 0 ? Math.min(totalAmount, Math.max(minAdv, advanceAmount)) : 0;
  
  const balanceAmount = Math.max(0, totalAmount - finalAdvanceAmount);

  const qrUrl = storeSettings?.upiQrUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${encodeURIComponent(storeSettings?.upiId || '')}&pn=${encodeURIComponent(storeSettings?.storeName || 'PixelPress')}&am=${finalAdvanceAmount}&cu=INR`;

  const handleCopyUpi = () => {
    if (storeSettings?.upiId) {
      navigator.clipboard.writeText(storeSettings.upiId);
      setCopiedUpi(true);
      showToast('UPI ID copied!');
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const handleCartNext = () => {
    if (cart.length === 0) return;
    setStep('details');
  };

  const handleDetailsNext = (e) => {
    e.preventDefault();
    setError('');
    const finalName = (user?.name || customerName).trim();
    const finalPhone = (user?.phone || customerPhone).trim();
    const loc = campusLocation.trim();
    if (!finalName) return setError('Please enter your full name');
    if (!finalPhone.match(/^\d{10}$/)) return setError('Please enter a valid 10-digit phone number');
    if (!loc) return setError('Please enter your campus location (Building & Room No / Dept)');
    setStep('payment');
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 800, 800, 0.7);
      setScreenshotFile(file);
      setScreenshotPreview(compressed.dataUrl);
    } catch {
      setScreenshotFile(file);
      setScreenshotPreview(URL.createObjectURL(file));
    }
  };

  const handleConfirmOrder = async () => {
    setError('');
    if (!screenshotPreview) {
      setError('Please upload your UPI payment screenshot to confirm the advance payment.');
      return;
    }
    const finalName = (user?.name || customerName).trim();
    const finalPhone = (user?.phone || customerPhone).trim();
    setIsSubmitting(true);
    
    try {
      if (!user) {
        // Not awaiting this since it's fire-and-forget in context (handled in checkoutCart next)
        login(finalName, finalPhone);
      }
      
      await checkoutCart(
        { name: finalName, phone: finalPhone },
        screenshotPreview,
        finalAdvanceAmount,
        campusLocation.trim()
      );
      
      setStep('success');
      setTimeout(() => {
        setIsCartOpen(false);
        navigate('/orders');
      }, 2500);
    } catch (err) {
      setError(err.message || 'Failed to place order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
          />
          <div className="fixed inset-y-0 right-0 flex z-50 pointer-events-none w-full sm:w-[400px]">
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="w-full h-[100dvh] bg-white shadow-2xl pointer-events-auto flex flex-col"
            >
              {/* SUCCESS */}
              {step === 'success' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                    className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center"
                  >
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900">Orders Placed!</h3>
                  <p className="text-gray-500 text-sm">
                    Your cart items have been ordered and advance payment is under review. Saved under{" "}
                    <b>{user?.name || customerName}</b>. Redirecting to orders...
                  </p>
                </div>
              )}

              {step !== 'success' && (
                <>
                  {/* Header */}
                  <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-white">
                    {step !== 'cart' && (
                      <button
                        onClick={() => {
                          setError('');
                          setStep(step === 'payment' ? 'details' : 'cart');
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                      >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                      </button>
                    )}
                    <div className="flex-1 flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-gray-900" />
                      <h2 className="text-lg font-bold text-gray-900">
                        {step === 'cart' ? 'Your Cart' : step === 'details' ? 'Delivery Details' : 'Pay Advance'}
                      </h2>
                    </div>
                    <button onClick={() => setIsCartOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {/* Step progress */}
                  {step !== 'cart' && (
                    <div className="px-5 py-2 flex items-center gap-1.5 bg-gray-50 border-b border-gray-100">
                      {['details', 'payment'].map((s, i) => (
                        <div
                          key={s}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            ['details', 'payment'].indexOf(step) >= i ? 'bg-black' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* CART STEP */}
                  {step === 'cart' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {cart.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500 space-y-4">
                          <ShoppingCart className="w-16 h-16 text-gray-200" />
                          <p className="font-semibold text-lg">Your cart is empty</p>
                          <button
                            onClick={() => setIsCartOpen(false)}
                            className="bg-black hover:bg-gray-800 text-white py-2 px-6 rounded-lg text-sm font-bold uppercase tracking-widest transition-colors"
                          >
                            Continue Shopping
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <AnimatePresence>
                              {cart.map((item) => (
                                <motion.div
                                  key={item.product.id}
                                  layout
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className="flex gap-4 p-3 bg-white border border-gray-100 rounded-xl shadow-sm"
                                >
                                  <img 
                                    src={item.product.image} 
                                    alt={item.product.name} 
                                    className="w-20 h-20 object-cover rounded-lg bg-gray-50"
                                  />
                                  <div className="flex-1 flex flex-col justify-between">
                                    <div className="flex justify-between items-start gap-2">
                                      <h4 className="font-bold text-sm text-gray-900 leading-tight">
                                        {item.product.name}
                                      </h4>
                                      <button 
                                        onClick={() => removeFromCart(item.product.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                      <div className="font-bold text-gray-900">
                                        ₹{item.product.price}
                                      </div>
                                      <div className="inline-flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                                        <button
                                          onClick={() => updateCartQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                                          className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                                          disabled={item.quantity <= 1}
                                        >
                                          <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="w-8 text-center text-xs font-bold py-1">
                                          {item.quantity}
                                        </span>
                                        <button
                                          onClick={() => updateCartQuantity(item.product.id, Math.min(10, item.quantity + 1))}
                                          className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                                          disabled={item.quantity >= 10}
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                          
                          <div className="p-5 border-t border-gray-100 bg-gray-50/50 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Subtotal</span>
                              <span className="text-xl font-black text-gray-900">₹{totalAmount}</span>
                            </div>
                            <button
                              onClick={handleCartNext}
                              className="w-full bg-black hover:bg-gray-800 text-white text-sm font-bold py-3.5 uppercase tracking-wider transition-colors rounded-xl flex items-center justify-center gap-2 shadow-md"
                            >
                              <span>Checkout Details</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* DETAILS STEP */}
                  {step === 'details' && (
                    <form onSubmit={handleDetailsNext} className="flex-1 flex flex-col overflow-hidden">
                      <div className="flex-1 overflow-y-auto p-5 space-y-5">
                        <div className="space-y-3">
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            Contact & Delivery
                          </p>
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={user?.name || customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            disabled={Boolean(user?.name)}
                            className="w-full text-sm border border-gray-300 p-3 focus:outline-none focus:ring-1 focus:ring-black disabled:bg-gray-50 rounded-xl"
                          />
                          <input
                            type="tel"
                            placeholder="10-digit WhatsApp Number"
                            value={user?.phone || customerPhone}
                            onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            disabled={Boolean(user?.phone)}
                            className="w-full text-sm border border-gray-300 p-3 focus:outline-none focus:ring-1 focus:ring-black disabled:bg-gray-50 rounded-xl"
                          />
                          <textarea
                            placeholder="Campus Location (e.g. Block B, Room 304 / Dept)"
                            value={campusLocation}
                            onChange={e => setCampusLocation(e.target.value)}
                            className="w-full text-sm border border-gray-300 p-3 focus:outline-none focus:ring-1 focus:ring-black rounded-xl font-semibold resize-none"
                            rows="2"
                            required
                          />
                        </div>

                        {error && (
                          <p className="text-xs text-red-600 bg-red-50 p-3 border border-red-200 rounded-xl flex items-start gap-2">
                            <span>•</span> {error}
                          </p>
                        )}
                      </div>

                      <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                        <button
                          type="submit"
                          className="w-full bg-black hover:bg-gray-800 text-white text-sm font-bold py-3.5 uppercase tracking-wider transition-colors rounded-xl flex items-center justify-center gap-2 shadow-md"
                        >
                          <span>Proceed to Payment</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  )}

                  {/* PAYMENT STEP */}
                  {step === 'payment' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="flex-1 overflow-y-auto p-5 space-y-5">
                        
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center space-y-1">
                          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Advance to Pay Now</p>
                          <p className="text-3xl font-black text-amber-800">₹{finalAdvanceAmount}</p>
                          <p className="text-xs text-amber-600 font-semibold">Balance ₹{balanceAmount} paid on delivery (COD)</p>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col items-center gap-4 shadow-sm">
                          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                            <QrCode className="w-4 h-4" />
                            Scan UPI QR to Pay
                          </p>
                          <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-xs">
                            <img
                              src={qrUrl}
                              alt="UPI QR Code"
                              className="w-40 h-40 object-contain"
                            />
                          </div>
                          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 w-full justify-between">
                            <span className="text-sm font-bold text-gray-800 truncate">{storeSettings?.upiId || 'N/A'}</span>
                            <button
                              type="button"
                              onClick={handleCopyUpi}
                              className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-black transition-colors bg-white px-2.5 py-1 rounded-md border border-gray-200 shadow-sm"
                            >
                              {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              {copiedUpi ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-700 pl-1">
                            Upload Payment Screenshot <span className="text-red-500">*</span>
                          </p>
                          <label className="relative block border-2 border-dashed border-gray-300 hover:border-black rounded-2xl overflow-hidden transition-colors cursor-pointer bg-gray-50 min-h-[120px]">
                            {screenshotPreview ? (
                              <div className="relative group">
                                <img src={screenshotPreview} alt="Payment screenshot" className="w-full max-h-48 object-contain bg-black/5" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <p className="text-white font-bold text-sm bg-black/50 px-3 py-1.5 rounded-lg">Change Screenshot</p>
                                </div>
                                <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1.5 shadow-md">
                                  <Check className="w-4 h-4" />
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
                                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center border border-gray-100 mb-1">
                                  <UploadCloud className="w-6 h-6 text-gray-400" />
                                </div>
                                <p className="text-sm text-gray-600 font-medium">Tap to upload screenshot</p>
                                <p className="text-[10px] text-gray-400">JPG, PNG supported</p>
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="p-5 border-t border-gray-100 bg-gray-50/50 space-y-3">
                        {error && (
                          <p className="text-xs text-red-600 bg-red-50 p-2.5 border border-red-200 rounded-xl">{error}</p>
                        )}
                        <button
                          type="button"
                          onClick={handleConfirmOrder}
                          disabled={isSubmitting || !screenshotPreview}
                          className="w-full bg-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold py-3.5 uppercase tracking-widest flex items-center justify-center space-x-2 transition-colors rounded-xl shadow-md"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <span>Submit Order & Proof</span>
                              <CheckCircle className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
