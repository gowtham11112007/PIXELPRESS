import React, { useState } from 'react';
import { useSeller } from '../context/SellerContext';
import { CheckCircle, XCircle, Clock, Calendar, Image as ImageIcon, X, MapPin, MessageCircle, Truck, Printer } from 'lucide-react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';

const OrderCard = ({ order }) => {
  const { updateOrderStatus, showToast } = useSeller();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [sellerComment, setSellerComment] = useState('');

  const handleStatusChangeWithComment = (status, comment) => {
    setIsProcessing(true);
    let extra = {};
    if (comment && order.id) {
      let notesObj = {};
      try { notesObj = JSON.parse(order.notes || '{}'); } catch(e){}
      notesObj.sellerComment = comment;
      extra = { notes: JSON.stringify(notesObj) };
    }
    updateOrderStatus(order.id, status, extra).then(() => {
      setIsProcessing(false);
      showToast(`Order marked as ${status}`);
    }).catch(() => setIsProcessing(false));
  };

  const handleStatusChange = (status) => {
    setIsProcessing(true);
    updateOrderStatus(order.id, status).then(() => {
      setIsProcessing(false);
      showToast(`Order marked as ${status}`);
    }).catch(() => setIsProcessing(false));
  };

  const statusStyles = {
    'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
    'Pending Payment Review': 'bg-yellow-100 text-yellow-800 border-yellow-300 font-bold',
    'Printing': 'bg-blue-50 text-blue-700 border-blue-200 font-bold',
    'Accepted': 'bg-blue-50 text-blue-700 border-blue-200 font-bold',
    'Out for Delivery': 'bg-purple-50 text-purple-700 border-purple-200 font-bold',
    'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
    'Rejected': 'bg-red-50 text-red-700 border-red-200',
  };

  const StatusIcon = {
    'Pending': Clock,
    'Pending Payment Review': Clock,
    'Printing': Printer,
    'Accepted': Printer,
    'Out for Delivery': Truck,
    'Delivered': CheckCircle,
    'Rejected': XCircle,
  }[order.status] || Clock;

  const date = new Date(order.timestamp);
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = date.toLocaleDateString();

  const statusNormalized = order.status?.trim() || 'Pending';
  const isPending = statusNormalized.toLowerCase() === 'pending';
  const isPaymentReview = statusNormalized === 'Pending Payment Review' || statusNormalized === 'Payment Review';
  const total = order.totalAmount || (order.productPrice * order.quantity) || 0;
  const advance = order.advanceAmount ?? Math.round(total * 0.2);
  const balance = Math.max(0, total - advance);

  const handleWhatsAppDeliveryAlert = () => {
    const text = encodeURIComponent(
      `Hi ${order.customerName}! 🚀 Your PixelPress poster order #${(order.id || '').slice(0, 6).toUpperCase()} for "${order.productName}" is OUT FOR CAMPUS DELIVERY to ${order.campusLocation || 'your location'}!\n\n💰 COD Balance to pay: ₹${balance}\n📦 Delivery Slot: Next-Day Campus Delivery\n\nPlease be ready at your room/pickup spot.`
    );
    window.open(`https://wa.me/${(order.customerPhone || '').replace(/\D/g, '')}?text=${text}`, '_blank');
  };

  return (
    <>
      <div className={clsx(
        "card p-5 transition-all duration-200 flex flex-col justify-between", 
        isPaymentReview ? 'border-yellow-400 shadow-md ring-2 ring-yellow-400 animate-pulse' : 
        order.status === 'Out for Delivery' ? 'border-purple-300 shadow-md ring-1 ring-purple-100' : ''
      )}>
        <div>
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-bold text-slate-900 text-base">{order.customerName}</h3>
                {isPaymentReview && (
                   <span className="bg-yellow-400 text-slate-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                     Review Proof
                   </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">{order.customerPhone}</p>
            </div>
            <div className={clsx("px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5", statusStyles[order.status] || statusStyles['Pending'])}>
              <StatusIcon size={13} />
              {order.status}
            </div>
          </div>

          {/* Campus Delivery Location Pill */}
          <div className="mb-3 bg-brand-50/80 border border-brand-200 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
            <span className="text-brand-900 font-bold flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <span className="truncate">{order.campusLocation || 'Campus Delivery'}</span>
            </span>
            <span className="text-[10px] font-bold text-brand-600 bg-white px-2 py-0.5 rounded border border-brand-200 uppercase tracking-wider shrink-0 ml-2">
              Next-Day
            </span>
          </div>

          {/* Product Details */}
          <div className="flex gap-3 items-center p-3 bg-slate-50 rounded-xl mb-3 border border-slate-100">
            <img src={order.productImage} alt={order.productName} className="w-14 h-16 rounded-lg object-cover border border-slate-200 shadow-sm" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-sm truncate">{order.productName}</p>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                <span>Qty: <strong className="text-slate-800">{order.quantity}</strong></span>
                <span className="font-black text-slate-900 text-sm">Total: ₹{total}</span>
              </div>
            </div>
          </div>

          {/* Advance & COD Balance Breakdown */}
          <div className="grid grid-cols-2 gap-2 mb-3 text-xs bg-slate-100/70 p-2.5 rounded-lg border border-slate-200/60">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Advance Paid</span>
              <span className="font-bold text-emerald-700">₹{advance}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">COD Balance</span>
              <span className="font-bold text-amber-700">₹{balance}</span>
            </div>
          </div>

          {/* Payment Proof Button */}
          {order.paymentScreenshotUrl && (
            <div className="mb-4 bg-blue-50/80 border border-blue-200 rounded-xl p-2.5 flex justify-between items-center">
              <div className="flex items-center gap-2 text-xs text-blue-900 font-bold">
                <ImageIcon size={15} className="text-blue-600" />
                Payment Proof Uploaded
              </div>
              <button 
                onClick={() => setShowScreenshotModal(true)}
                className="text-xs bg-white text-blue-700 border border-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-50 font-bold shadow-xs transition-colors"
              >
                View Proof
              </button>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="space-y-2 pt-2 border-t border-slate-100 mt-auto">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{dateString} • {timeString}</span>
            </div>

            {order.status !== 'Delivered' && order.status !== 'Rejected' && (
              <button
                onClick={handleWhatsAppDeliveryAlert}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 hover:underline"
              >
                <MessageCircle size={13} /> WhatsApp Student
              </button>
            )}
          </div>

          {/* Stage Progression Buttons */}
          <div className="flex flex-col gap-2 pt-1">
            {isPending && (
              <div className="flex gap-2">
                <button disabled={isProcessing} onClick={() => handleStatusChange('Rejected')} className="btn-danger py-1.5 px-3 text-xs font-semibold flex items-center gap-1 flex-1 justify-center">
                  <XCircle size={14} /> Reject
                </button>
                <button disabled={isProcessing} onClick={() => handleStatusChange('Accepted')} className="btn-success py-1.5 px-3 text-xs font-bold flex items-center gap-1 flex-1 justify-center shadow-sm">
                  <CheckCircle size={14} /> Accept Order (Wait for Payment)
                </button>
              </div>
            )}

            {order.status === 'Accepted' && (
              <div className="w-full text-center text-[11px] font-bold text-amber-700 bg-amber-50 py-1.5 rounded-lg border border-amber-200">
                ⏳ Waiting for customer to pay advance...
              </div>
            )}

            {isPaymentReview && (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Meetup Spot / Comments (e.g., Meet at Block A)"
                  value={sellerComment}
                  onChange={(e) => setSellerComment(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <div className="flex gap-2">
                  <button disabled={isProcessing} onClick={() => handleStatusChange('Rejected')} className="btn-danger py-1.5 px-3 text-xs font-semibold flex items-center gap-1">
                    <XCircle size={14} /> Reject
                  </button>
                  <button disabled={isProcessing} onClick={() => handleStatusChangeWithComment('Printing', sellerComment)} className="btn-success flex-1 py-1.5 px-3 text-xs font-bold flex items-center justify-center gap-1 shadow-sm">
                    <CheckCircle size={14} /> Verify Proof & Confirm
                  </button>
                </div>
              </div>
            )}

            {(order.status === 'Printing') && (
              <button disabled={isProcessing} onClick={() => handleStatusChange('Out for Delivery')} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all">
                <Truck size={14} /> Dispatch for Campus Delivery
              </button>
            )}

            {order.status === 'Out for Delivery' && (
              <button disabled={isProcessing} onClick={() => handleStatusChange('Delivered')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all">
                <CheckCircle size={14} /> Mark Delivered & COD Received (₹{balance})
              </button>
            )}

            {order.status === 'Delivered' && (
              <div className="w-full text-center text-xs font-bold text-emerald-700 bg-emerald-50 py-1.5 rounded-lg border border-emerald-200">
                ✓ Completed & Delivered to Room
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Screenshot Modal */}
      <AnimatePresence>
        {showScreenshotModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowScreenshotModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden z-10"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                  <ImageIcon size={18} className="text-brand-600" /> 
                  Payment Proof — {order.customerName} ({order.campusLocation})
                </h3>
                <button onClick={() => setShowScreenshotModal(false)} className="p-1 hover:bg-gray-200 rounded-full">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 overflow-auto flex-1 flex justify-center bg-gray-900 min-h-[300px]">
                <img 
                  src={order.paymentScreenshotUrl} 
                  alt="Payment Screenshot Proof" 
                  className="max-w-full h-auto object-contain rounded-lg shadow-lg border border-gray-800"
                />
              </div>
              <div className="p-4 bg-white border-t border-gray-100 flex justify-between items-center">
                <div className="text-xs">
                  <span className="text-gray-500 block">Verified Advance:</span>
                  <span className="font-bold text-gray-900 text-sm">₹{advance}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowScreenshotModal(false)} className="btn-secondary py-2 px-4 text-xs font-semibold">
                    Close
                  </button>
                  {isPaymentReview && (
                    <button 
                      onClick={() => {
                        handleStatusChange('Printing');
                        setShowScreenshotModal(false);
                      }} 
                      className="btn-success py-2 px-4 text-xs font-bold flex items-center gap-1.5 shadow-md"
                    >
                      <CheckCircle size={15} /> Verify & Start Printing
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default OrderCard;
