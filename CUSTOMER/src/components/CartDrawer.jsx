import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft,
  CheckCircle, MapPin, Zap, Copy, Check, UploadCloud, QrCode
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
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
    storeSettings,
    showToast
  } = useAppContext();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [campusLocation, setCampusLocation] = useState('');
  
  const [step, setStep] = useState('cart'); // 'cart' | 'details' | 'payment' | 'success'
  const [error, setError] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);

  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  React.useEffect(() => {
    if (isCartOpen) {
      setStep('cart');
      setScreenshotFile(null);
      setScreenshotPreview(null);
      setError('');
    }
  }, [isCartOpen]);

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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const compressed = await compressImage(file);
      setScreenshotFile(compressed);
      setScreenshotPreview(URL.createObjectURL(compressed));
    }
  };

  const proceedToDetails = () => {
    if (cart.length === 0) return;
    setStep('details');
  };

  const proceedToPayment = () => {
    if (!name.trim() || !phone.match(/^\d{10}$/) || !campusLocation.trim()) {
      setError('Please fill in all delivery details correctly');
      return;
    }
    setStep('payment');
  };

  const handleCompleteOrder = async () => {
    if (!screenshotFile) {
      setError('Please upload payment screenshot');
      return;
    }
    try {
      await checkoutCart(
        { name: name.trim(), phone: phone.trim() },
        screenshotFile,
        advanceAmount,
        campusLocation.trim()
      );
      setStep('success');
      setTimeout(() => {
        setIsCartOpen(false);
        navigate('/orders');
      }, 2500);
    } catch (err) {
      setError(err.message || 'Payment submission failed');
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-0 right-0 w-full sm:max-w-md bg-white z-50 shadow-2xl flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2"><ShoppingBag className="w-5 h-5" /> Checkout</h2>
              <button onClick={() => setIsCartOpen(false)}><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {step === 'cart' && (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex gap-4 p-2 border-b">
                      <img src={item.product.image} className="w-16 h-16 object-cover rounded-lg" />
                      <div className="flex-1">
                        <h4 className="font-bold">{item.product.name}</h4>
                        <p>₹{item.product.price} x {item.quantity}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.product.id)}><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </div>
                  ))}
                  <button onClick={proceedToDetails} className="w-full bg-black text-white p-3 rounded-lg font-bold flex justify-between">
                    <span>Continue to Details</span> <ArrowRight />
                  </button>
                </div>
              )}

              {step === 'details' && (
                <div className="space-y-4">
                  <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border rounded-lg" />
                  <input type="tel" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 border rounded-lg" />
                  <input type="text" placeholder="Campus Location (Hostel/Room)" value={campusLocation} onChange={e => setCampusLocation(e.target.value)} className="w-full p-3 border rounded-lg" />
                  <button onClick={proceedToPayment} className="w-full bg-black text-white p-3 rounded-lg font-bold">Proceed to Payment</button>
                </div>
              )}

              {step === 'payment' && (
                <div className="space-y-4 text-center">
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="text-sm">Pay Advance Amount</p>
                    <h3 className="text-3xl font-black">₹{advanceAmount}</h3>
                  </div>
                  <div className="flex items-center justify-center gap-2 p-2 bg-gray-50 rounded-lg cursor-pointer" onClick={handleCopyUpi}>
                    <span className="font-mono text-sm">{storeSettings.upiId}</span>
                    {copiedUpi ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </div>
                  <div className="border-2 border-dashed p-6 rounded-lg">
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" id="proof" />
                    <label htmlFor="proof" className="cursor-pointer flex flex-col items-center gap-2">
                      {screenshotPreview ? <img src={screenshotPreview} className="h-32" /> : <UploadCloud className="w-10 h-10" />}
                      <span className="text-sm text-gray-500">Upload payment screenshot</span>
                    </label>
                  </div>
                  <button onClick={handleCompleteOrder} className="w-full bg-green-600 text-white p-3 rounded-lg font-bold">Confirm Order</button>
                </div>
              )}

              {step === 'success' && (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                  <h2 className="text-2xl font-bold">Order Received!</h2>
                </div>
              )}
            </div>
            {error && <p className="text-red-500 text-xs p-4 bg-red-50">{error}</p>}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
