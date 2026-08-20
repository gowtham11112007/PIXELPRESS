import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingCart, Check, ArrowRight, ArrowLeft, MapPin, Copy, UploadCloud, QrCode, CheckCircle } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { compressImage } from "../lib/imageUtils";

// Steps: 'details' | 'payment' | 'success'

export default function OrderModal({ product, isOpen, onClose }) {
  const [quantity, setQuantity] = useState(1);
  const [step, setStep] = useState('details');
  const { placeOrder, addToCart, user, login, setIsCartOpen, storeSettings, showToast } = useAppContext();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [campusLocation, setCampusLocation] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  // Payment state
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);

  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      setCustomerName(user.name || '');
      setCustomerPhone(user.phone || '');
    }
  }, [user]);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setStep('details');
      setError('');
      setCampusLocation('');
      setScreenshotFile(null);
      setScreenshotPreview(null);
      setCopiedUpi(false);
      setIsSubmitting(false);
      setQuantity(1);
    }
  }, [isOpen]);

  const discount = product?.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const totalAmount = (product?.price || 0) * quantity;

  // Calculate advance for this single product
  const advanceAmount = (() => {
    if (!product) return 0;
    const p = product;
    if (p.advanceType === 'fixed') return Math.min(totalAmount, (Number(p.advanceValue) || 0) * quantity);
    if (p.advanceType === 'percentage') return Math.min(totalAmount, Math.round(totalAmount * ((Number(p.advanceValue) || 0) / 100)));
    if (p.advanceType === 'zero') return 0;
    // default store settings
    const pct = Number(storeSettings?.defaultAdvancePercent) || 20;
    const raw = Math.round(totalAmount * (pct / 100));
    const minAdv = Number(storeSettings?.minAdvanceAmount) || 100;
    return Math.min(totalAmount, Math.max(minAdv, raw));
  })();

  const balanceAmount = Math.max(0, totalAmount - advanceAmount);

  const qrUrl = storeSettings?.upiQrUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${encodeURIComponent(storeSettings?.upiId || '')}&pn=${encodeURIComponent(storeSettings?.storeName || 'PixelPress')}&am=${advanceAmount}&cu=INR`;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedToCart(true);
    setTimeout(() => {
      setAddedToCart(false);
      onClose();
      setIsCartOpen(true);
    }, 800);
  };

  const handleCopyUpi = () => {
    if (storeSettings?.upiId) {
      navigator.clipboard.writeText(storeSettings.upiId);
      setCopiedUpi(true);
      showToast('UPI ID copied!');
      setTimeout(() => setCopiedUpi(false), 2000);
    }
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
        await login(finalName, finalPhone);
      }
      await placeOrder(
        product,
        quantity,
        { name: finalName, phone: finalPhone },
        '',
        screenshotPreview,
        advanceAmount,
        campusLocation.trim()
      );
      setStep('success');
      setTimeout(() => {
        onClose();
        navigate('/orders');
      }, 2500);
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
          <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.38 }}
              className="w-full sm:max-w-xl bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl pointer-events-auto max-h-[92dvh] flex flex-col"
            >
              {/* SUCCESS */}
              {step === 'success' && (
                <div className="p-12 flex flex-col items-center text-center gap-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                    className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center"
                  >
                    <CheckCircle className="w-9 h-9 text-emerald-600" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900">Order Placed!</h3>
                  <p className="text-gray-500 text-sm">
                    Your advance payment is under review. Saved under{" "}
                    <b>{user?.name || customerName}</b>. Redirecting to orders...
                  </p>
                </div>
              )}

              {step !== 'success' && (
                <>
                  {/* Header with back button */}
                  <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                    {step === 'payment' && (
                      <button
                        onClick={() => { setError(''); setStep('details'); }}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                      >
                        <ArrowLeft className="w-4 h-4 text-gray-600" />
                      </button>
                    )}
                    <div className="flex-1">
                      <h2 className="text-base font-bold text-gray-900">
                        {step === 'details' ? 'Buy Now' : 'Pay Advance'}
                      </h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {/* Step progress */}
                  <div className="px-5 pt-3 flex items-center gap-1.5">
                    {['details', 'payment'].map((s, i) => (
                      <div
                        key={s}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          ['details', 'payment'].indexOf(step) >= i ? 'bg-black' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>

                  {/* DETAILS STEP */}
                  {step === 'details' && (
                    <form onSubmit={handleDetailsNext} className="flex flex-col sm:flex-row overflow-y-auto flex-1">
                      <div className="sm:w-52 flex-shrink-0 bg-gray-100 relative">
                        <img src={product.image} alt={product.name} className="w-full h-48 sm:h-full object-cover" />
                        {product.badge && (
                          <span className="absolute top-2 left-2 bg-black text-white text-[10px] font-bold px-2 py-0.5">
                            {product.badge}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 p-5 sm:p-6 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-lg font-bold text-gray-900 leading-snug">{product.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xl font-bold text-gray-900">₹{product.price}</span>
                              {product.originalPrice && (
                                <>
                                  <span className="text-sm text-gray-400 line-through">₹{product.originalPrice}</span>
                                  <span className="text-xs bg-red-100 text-red-600 font-semibold px-1.5 py-0.5">-{discount}%</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quantity */}
                        <div>
                          <p className="text-xs text-gray-500 mb-1.5 font-semibold tracking-wider uppercase">Quantity</p>
                          <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setQuantity(q => Math.max(1, q - 1))}
                              className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40"
                              disabled={quantity <= 1}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-10 text-center text-sm font-bold border-x border-gray-300 py-1.5">{quantity}</span>
                            <button
                              type="button"
                              onClick={() => setQuantity(q => Math.min(5, q + 1))}
                              className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40"
                              disabled={quantity >= 5}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Customer details */}
                        <div className="space-y-2">
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" />
                            Delivery Details
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="Your Name"
                              value={user?.name || customerName}
                              onChange={e => setCustomerName(e.target.value)}
                              disabled={Boolean(user?.name)}
                              className="w-full text-xs border border-gray-300 p-2 focus:outline-none focus:border-black disabled:bg-gray-50 rounded-lg"
                            />
                            <input
                              type="tel"
                              placeholder="10-digit Phone"
                              value={user?.phone || customerPhone}
                              onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                              disabled={Boolean(user?.phone)}
                              className="w-full text-xs border border-gray-300 p-2 focus:outline-none focus:border-black disabled:bg-gray-50 rounded-lg"
                            />
                          </div>
                          <input
                            type="text"
                            placeholder="Campus Location (e.g. Block B, Room 304 / Dept)"
                            value={campusLocation}
                            onChange={e => setCampusLocation(e.target.value)}
                            className="w-full text-xs border border-gray-300 p-2 focus:outline-none focus:border-black rounded-lg font-semibold"
                            required
                          />
                        </div>

                        {error && (
                          <p className="text-xs text-red-600 bg-red-50 p-2 border border-red-200 rounded-lg">{error}</p>
                        )}

                        <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</span>
                          <span className="text-lg font-bold text-gray-900">₹{totalAmount}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={handleAddToCart}
                            className="w-full border-2 border-black text-black hover:bg-black hover:text-white text-xs font-bold py-3 uppercase tracking-wider transition-colors flex items-center justify-center space-x-1 rounded-lg"
                          >
                            {addedToCart ? <Check className="w-4 h-4 text-green-600" /> : <ShoppingCart className="w-4 h-4" />}
                            <span>{addedToCart ? 'Added!' : 'Add to Cart'}</span>
                          </button>
                          <button
                            type="submit"
                            className="w-full bg-black hover:bg-gray-800 text-white text-xs font-bold py-3 uppercase tracking-wider transition-colors rounded-lg flex items-center justify-center gap-1"
                          >
                            <span>Buy Now</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* PAYMENT STEP */}
                  {step === 'payment' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="flex-1 overflow-y-auto p-5 space-y-4">

                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center space-y-1">
                          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Advance to Pay Now</p>
                          <p className="text-3xl font-black text-amber-800">₹{advanceAmount}</p>
                          <p className="text-xs text-amber-600">Balance ₹{balanceAmount} paid on delivery (COD)</p>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-center gap-3">
                          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                            <QrCode className="w-3.5 h-3.5" />
                            Scan UPI QR to Pay
                          </p>
                          <img
                            src={qrUrl}
                            alt="UPI QR Code"
                            className="w-40 h-40 object-contain rounded-xl border border-gray-100 bg-white p-1"
                          />
                          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-full justify-between">
                            <span className="text-xs font-bold text-gray-800 truncate">{storeSettings?.upiId || 'N/A'}</span>
                            <button
                              type="button"
                              onClick={handleCopyUpi}
                              className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-black transition-colors"
                            >
                              {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              {copiedUpi ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-700">
                            Upload Payment Screenshot <span className="text-red-500">*</span>
                          </p>
                          <label className="relative block border-2 border-dashed border-gray-300 hover:border-black rounded-2xl overflow-hidden transition-colors cursor-pointer bg-gray-50 min-h-[100px]">
                            {screenshotPreview ? (
                              <div className="relative">
                                <img src={screenshotPreview} alt="Payment screenshot" className="w-full max-h-40 object-contain" />
                                <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1">
                                  <Check className="w-3.5 h-3.5" />
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-2 p-5 text-center">
                                <UploadCloud className="w-7 h-7 text-gray-400" />
                                <p className="text-xs text-gray-500 font-medium">Tap to upload payment screenshot</p>
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

                      <div className="p-4 sm:p-5 border-t border-gray-100 space-y-2">
                        {error && (
                          <p className="text-xs text-red-600 bg-red-50 p-2 border border-red-200 rounded-lg">{error}</p>
                        )}
                        <button
                          type="button"
                          onClick={handleConfirmOrder}
                          disabled={isSubmitting || !screenshotPreview}
                          className="w-full bg-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-3.5 uppercase tracking-widest flex items-center justify-center space-x-2 transition-colors rounded-xl shadow-md"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Placing Order...</span>
                            </>
                          ) : (
                            <>
                              <span>Confirm Order and Submit Proof</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                        <p className="text-center text-[10px] text-gray-400">
                          Your order will be confirmed after payment verification
                        </p>
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
