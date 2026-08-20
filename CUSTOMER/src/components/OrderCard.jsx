import React, { useState } from 'react';
import { Clock, CheckCircle2, XCircle, MessageCircle, MapPin, Truck, Printer, ImageIcon, Check, Copy, ExternalLink, X, UploadCloud } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { compressImage } from '../lib/imageUtils';

export default function OrderCard({ order }) {
  const { storeSettings, isSupabaseConfigured, supabase, showToast, fetchOrders } = useAppContext();
  const [showPaymentUI, setShowPaymentUI] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const isAccepted = order.status === 'Accepted' || order.status === 'Printing';
  const isOutForDelivery = order.status === 'Out for Delivery';
  const isDelivered = order.status === 'Delivered';
  const isRejected = order.status === 'Rejected';

  const statusConfig = {
    'Pending':  { label: 'Awaiting Confirmation',  icon: Clock, cls: 'text-slate-600 bg-slate-50 border-slate-200' },
    'Pending Payment Review':  { label: 'Payment Under Review', icon: Clock, cls: 'text-amber-700 bg-amber-50 border-amber-300 font-bold animate-pulse' },
    'Payment Review':  { label: 'Payment Under Review', icon: Clock, cls: 'text-amber-700 bg-amber-50 border-amber-300 font-bold animate-pulse' },
    'Printing': { label: 'Confirmed & Printing', icon: Printer, cls: 'text-blue-700 bg-blue-50 border-blue-200 font-bold' },
    'Accepted': { label: 'Confirmed & Awaiting Delivery', icon: CheckCircle2, cls: 'text-emerald-600 bg-emerald-50 border-emerald-200 font-bold' },
    'Out for Delivery': { label: 'Out for Campus Delivery', icon: Truck, cls: 'text-purple-700 bg-purple-50 border-purple-200 font-bold' },
    'Delivered': { label: 'Delivered to Room', icon: CheckCircle2, cls: 'text-emerald-700 bg-emerald-50 border-emerald-200 font-bold' },
    'Rejected': { label: 'Rejected', icon: XCircle, cls: 'text-red-600 bg-red-50 border-red-200' },
  };
  const { label, icon: Icon, cls } = statusConfig[order.status] || statusConfig['Pending'];

  const orderDate = new Date(order.date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const total = order.totalAmount || (order.product?.price * order.quantity) || 0;
  const advance = order.advanceAmount ?? Math.round(total * 0.2);
  const balance = Math.max(0, total - advance);

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hi PixelPress! I'd like to check on my campus order #${(order.id || '').slice(0, 8).toUpperCase()} for "${order.product?.name}" (Location: ${order.campusLocation || 'Location'}). Balance to pay: ₹${balance}.`
    );
    window.open(`https://wa.me/919047302794?text=${text}`, '_blank');
  };

  // 4 Delivery Progress Steps
  const steps = [
    { label: 'Review', done: true },
    { label: 'Printing', done: isAccepted || isOutForDelivery || isDelivered },
    { label: 'Dispatched', done: isOutForDelivery || isDelivered },
    { label: 'Delivered', done: isDelivered },
  ];

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 800, 800, 0.7);
        setScreenshotFile(file);
        setScreenshotPreview(compressed.dataUrl);
      } catch (err) {
        setScreenshotFile(file);
        setScreenshotPreview(URL.createObjectURL(file));
      }
    }
  };

  const submitPaymentProof = async () => {
    if (!screenshotFile && !screenshotPreview) {
      showToast('Please upload a screenshot', 'error');
      return;
    }
    setIsUploading(true);
    let finalUrl = null;
    try {
      let compressed;
      try { compressed = await compressImage(screenshotFile, 900, 900, 0.75); } catch(e){}
      const uploadDataUrl = compressed?.dataUrl || screenshotPreview;

      if (isSupabaseConfigured && supabase && compressed?.blob) {
        try {
          const fileName = `adv_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
          const filePath = `advance_payments/${fileName}`;
          const { error } = await supabase.storage.from('payment_screenshots').upload(filePath, compressed.blob, { contentType: 'image/jpeg' });
          if (!error) {
            const { data } = supabase.storage.from('payment_screenshots').getPublicUrl(filePath);
            finalUrl = data.publicUrl;
          }
        } catch (e) {}
      }
      if (!finalUrl) { finalUrl = uploadDataUrl; }

      // Update order status
      if (isSupabaseConfigured && supabase) {
        let notesObj = {};
        try { notesObj = JSON.parse(order.notes || '{}'); } catch(e){}
        notesObj.paymentScreenshotUrl = finalUrl;
        
        await supabase.from('orders').update({
          status: 'Payment Review',
          notes: JSON.stringify(notesObj)
        }).eq('id', order.id);
        
        await fetchOrders();
        setShowPaymentUI(false);
        showToast('Payment proof submitted!');
      } else {
        // Local fallback
        let notesObj = {};
        try { notesObj = JSON.parse(order.notes || '{}'); } catch(e){}
        notesObj.paymentScreenshotUrl = finalUrl;
        const all = JSON.parse(localStorage.getItem('pixelpress_orders') || '[]');
        const updated = all.map(o => 
          o.id === order.id 
            ? { ...o, status: 'Payment Review', notes: JSON.stringify(notesObj) } 
            : o
        );
        localStorage.setItem('pixelpress_orders', JSON.stringify(updated));
        await fetchOrders();
        setShowPaymentUI(false);
        showToast('Payment proof submitted locally!');
      }
    } catch(err) {
      showToast('Error uploading proof', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  let sellerComment = '';
  try {
    const notesObj = JSON.parse(order.notes || '{}');
    sellerComment = notesObj.sellerComment;
  } catch(e) {}

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      <div className="flex flex-col sm:flex-row gap-0">
        {/* Product image */}
        <div className="w-full sm:w-28 h-32 sm:h-auto flex-shrink-0 bg-slate-100">
          <img
            src={order.product?.image}
            alt={order.product?.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Details */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 leading-snug text-sm sm:text-base">
                  {order.product?.name}
                </h3>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-brand-700 font-bold">
                  <MapPin size={12} className="text-brand-600" />
                  <span>{order.campusLocation || 'Campus Delivery'}</span>
                </div>
              </div>

              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 border rounded-full flex-shrink-0 ${cls}`}>
                <Icon className="w-3 h-3" />
                {label}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
              <span>•</span>
              <span>{orderDate}</span>
              <span>•</span>
              <span>Qty: <strong>{order.quantity}</strong></span>
              <span>•</span>
              <span className="font-black text-slate-900">Total: ₹{total}</span>
            </div>

            {/* Advance & Balance Details */}
            <div className="mt-3 flex gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">{order.status === 'Pending' || order.status === 'Accepted' ? 'Advance To Pay' : 'Advance Paid'}</span>
                <span className={`font-bold ${order.status === 'Pending' || order.status === 'Accepted' ? 'text-amber-600' : 'text-emerald-700'}`}>₹{advance}</span>
              </div>
              <div className="border-l border-slate-200 pl-3">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Pay on Delivery (COD)</span>
                <span className="font-bold text-amber-700">₹{balance}</span>
              </div>
            </div>

            {sellerComment && (
              <div className="mt-3 bg-brand-50 border border-brand-200 rounded-xl p-3 text-xs text-brand-800">
                <strong className="block mb-1">Seller Message / Meetup Details:</strong>
                {sellerComment}
              </div>
            )}
            
            {/* Payment proof re-upload (emergency fallback if screenshot was missing) */}
            {(order.status === 'Pending' || order.status === 'Accepted') && !order.paymentScreenshotUrl && !showPaymentUI && (
              <button 
                onClick={() => setShowPaymentUI(true)}
                className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2.5 uppercase tracking-widest rounded-xl shadow-md transition-colors"
              >
                Upload Payment Proof
              </button>
            )}
            
            {showPaymentUI && (
              <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-900">Advance Payment</span>
                  <button onClick={() => setShowPaymentUI(false)} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
                </div>
                <div className="flex flex-col items-center">
                  <img src={storeSettings?.upiQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${storeSettings?.upiId}&pn=${storeSettings?.storeName}&am=${advance}&cu=INR`} alt="QR" className="w-32 h-32 object-contain bg-white p-2 rounded-lg border border-slate-300" />
                  <div className="mt-2 flex items-center gap-2 bg-white px-2 py-1 rounded border border-slate-200">
                    <span className="text-xs font-bold">{storeSettings?.upiId}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Upload Screenshot</label>
                  <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-2 flex flex-col items-center justify-center bg-white min-h-[80px]">
                    {screenshotPreview ? (
                      <img src={screenshotPreview} alt="Preview" className="h-16 object-contain" />
                    ) : (
                      <span className="text-[10px] text-slate-500 flex flex-col items-center gap-1"><UploadCloud size={16}/>Tap to upload</span>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                </div>
                <button 
                  onClick={submitPaymentProof}
                  disabled={isUploading || !screenshotPreview}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 transition-colors text-white text-xs font-bold py-2 rounded-lg disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Submit Proof'}
                </button>
              </div>
            )}

            {/* Progress Stages Bar */}
            {!isRejected && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="grid grid-cols-4 gap-1 text-center">
                  {steps.map((s) => (
                    <div key={s.label} className="flex flex-col items-center">
                      <div className={`h-1.5 w-full rounded-full mb-1 transition-colors ${
                        s.done ? 'bg-emerald-500' : 'bg-slate-200'
                      }`} />
                      <span className={`text-[9px] font-bold ${
                        s.done ? 'text-slate-900' : 'text-slate-400'
                      }`}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">⚡ Next-Day Campus Delivery</span>
            <button
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-1 bg-[#25D366] hover:bg-[#20bb5a] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp Help
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
