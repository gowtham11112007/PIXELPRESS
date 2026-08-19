import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QrCode, CreditCard, Percent, Store, Save, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useSeller } from '../context/SellerContext';
import { compressImage } from '../lib/imageUtils';

export default function Settings() {
  const { storeSettings, updateStoreSettings, showToast } = useSeller();

  const [upiId, setUpiId] = useState(storeSettings.upiId || 'pixelpress@upi');
  const [upiQrUrl, setUpiQrUrl] = useState(storeSettings.upiQrUrl || '');
  const [defaultAdvancePercent, setDefaultAdvancePercent] = useState(storeSettings.defaultAdvancePercent || 20);
  const [minAdvanceAmount, setMinAdvanceAmount] = useState(storeSettings.minAdvanceAmount || 100);
  const [storeName, setStoreName] = useState(storeSettings.storeName || 'PIXELPRESS');
  const [announcementText, setAnnouncementText] = useState(storeSettings.announcementText || '✦ FREE DELIVERY FOR PREPAID ORDERS ✦ SPLIT POSTERS ✦ CUSTOM PRINTS');
  
  const [isSaving, setIsSaving] = useState(false);
  const [qrPreview, setQrPreview] = useState(storeSettings.upiQrUrl || '');

  // Handle custom QR code image file upload
  const handleQrUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 600, 600, 0.85);
        setQrPreview(compressed.dataUrl);
        setUpiQrUrl(compressed.dataUrl);
        showToast('QR Code image selected!');
      } catch (err) {
        console.error('QR image compression error:', err);
        const objectUrl = URL.createObjectURL(file);
        setQrPreview(objectUrl);
        setUpiQrUrl(objectUrl);
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateStoreSettings({
        upiId: upiId.trim(),
        upiQrUrl: upiQrUrl.trim(),
        defaultAdvancePercent: Number(defaultAdvancePercent) || 20,
        minAdvanceAmount: Number(minAdvanceAmount) || 100,
        storeName: storeName.trim() || 'PIXELPRESS',
        announcementText: announcementText.trim()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Preview generated dynamic QR code if custom not uploaded
  const previewDynamicQr = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${encodeURIComponent(storeName)}&am=100&cu=INR`)}`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-5xl mx-auto space-y-8 pb-24"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Store className="w-7 h-7 text-brand-600" />
            Store & Payment Settings
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Configure your UPI ID, QR Scanner, advance payment rules, and store branding.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary flex items-center gap-2 shadow-md px-6 py-2.5"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: UPI & Payment Gateway */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="w-5 h-5 text-brand-600" />
              UPI & Payment Gateway Details
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Store UPI ID / VPA *
              </label>
              <input
                type="text"
                required
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. yourstore@okhdfcbank or merchant@upi"
                className="input-field font-mono"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Customers will scan and transfer advance payments directly to this UPI ID.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Custom UPI Scanner QR Code
              </label>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer w-full sm:w-64 min-h-[140px] overflow-hidden">
                  {qrPreview ? (
                    <>
                      <img src={qrPreview} alt="QR Code" className="w-28 h-28 object-contain rounded-lg shadow-sm" />
                      <span className="text-[11px] font-bold text-brand-600 mt-2">Change Image</span>
                    </>
                  ) : (
                    <>
                      <QrCode className="w-8 h-8 text-slate-400 mb-1" />
                      <span className="text-xs font-bold text-slate-700">Upload Merchant QR</span>
                      <span className="text-[10px] text-slate-400">PNG, JPG up to 5MB</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleQrUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>

                <div className="flex-1 space-y-2 text-xs text-slate-600">
                  <p className="font-semibold text-slate-900">QR Code Options:</p>
                  <p>• Upload your official Google Pay, PhonePe, Paytm, or BHIM merchant QR code image.</p>
                  <p>• If left blank, PixelPress automatically generates a dynamic UPI payment QR with your UPI ID and exact advance amount.</p>
                  {qrPreview && (
                    <button
                      type="button"
                      onClick={() => { setQrPreview(''); setUpiQrUrl(''); }}
                      className="text-red-600 font-semibold hover:underline text-xs pt-1"
                    >
                      Clear custom QR (use auto-generated dynamic QR)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Advance Payment Rules */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Percent className="w-5 h-5 text-brand-600" />
              Advance Payment Rules (Storewide Default)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Default Advance Percentage (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={defaultAdvancePercent}
                    onChange={(e) => setDefaultAdvancePercent(e.target.value)}
                    className="input-field pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  E.g., 20% advance payment required at checkout.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Minimum Advance Amount (₹)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={minAdvanceAmount}
                    onChange={(e) => setMinAdvanceAmount(e.target.value)}
                    className="input-field pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Minimum advance amount required for low-value carts.
                </p>
              </div>
            </div>

            <div className="bg-brand-50 border border-brand-200 rounded-xl p-3.5 text-xs text-brand-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
              <span>
                <strong>Per-Product Customization:</strong> You can also set a custom advance amount (percentage or fixed ₹) on individual products when editing them in the Products Catalog.
              </span>
            </div>
          </div>

          {/* Section 3: Branding & Announcements */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Store className="w-5 h-5 text-brand-600" />
              Store Branding & Banner
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Store Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Top Announcement Marquee Bar
              </label>
              <textarea
                rows="2"
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Enter announcements separated by bullets or symbols..."
                className="input-field text-xs"
              />
            </div>
          </div>
        </div>

        {/* Right 1 Column: Live Checkout Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-5 border border-slate-800">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-brand-400 uppercase">Live Customer Preview</span>
              <h3 className="text-lg font-bold text-white mt-0.5">Checkout Advance Card</h3>
            </div>

            {/* Advance Amount Box */}
            <div className="bg-white/10 border border-white/15 p-4 rounded-xl text-center">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Advance Amount</p>
              <p className="text-3xl font-black text-white mt-0.5">
                ₹{Math.max(Number(minAdvanceAmount) || 100, Math.round(599 * ((Number(defaultAdvancePercent) || 20) / 100)))}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Sample Cart Total: ₹599</p>
            </div>

            {/* QR Scanner Display */}
            <div className="bg-white text-slate-900 p-4 rounded-xl flex flex-col items-center text-center shadow-lg">
              <img
                src={qrPreview || previewDynamicQr}
                alt="QR Preview"
                className="w-40 h-40 object-contain rounded-lg border border-slate-200 shadow-sm"
              />
              <div className="mt-3 bg-slate-100 px-3 py-1 rounded-full font-mono text-xs font-bold text-slate-800 flex items-center gap-1">
                <span>{upiId || 'pixelpress@upi'}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Scan or use UPI ID to pay advance</p>
            </div>

            <div className="text-[11px] text-slate-400 space-y-1 bg-white/5 p-3 rounded-lg border border-white/10">
              <p>✓ Instant cloud synchronization</p>
              <p>✓ All changes reflect live on the customer app</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
