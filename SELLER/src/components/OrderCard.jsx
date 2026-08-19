import React, { useState } from 'react';
import { useSeller } from '../context/SellerContext';
import { CheckCircle, XCircle, Clock, Calendar, Image as ImageIcon, X, CreditCard } from 'lucide-react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';

const OrderCard = ({ order }) => {
  const { updateOrderStatus, showToast } = useSeller();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);

  const handleStatusChange = (status) => {
    setIsProcessing(true);
    setTimeout(() => {
      updateOrderStatus(order.id, status);
      setIsProcessing(false);
      showToast(`Order marked as ${status}`);
    }, 300);
  };

  const statusStyles = {
    'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
    'Pending Payment Review': 'bg-yellow-100 text-yellow-800 border-yellow-300 font-bold',
    'Accepted': 'bg-green-50 text-green-700 border-green-200',
    'Rejected': 'bg-red-50 text-red-700 border-red-200',
  };

  const StatusIcon = {
    'Pending': Clock,
    'Pending Payment Review': Clock,
    'Accepted': CheckCircle,
    'Rejected': XCircle,
  }[order.status] || Clock;

  const date = new Date(order.timestamp);
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = date.toLocaleDateString();

  const isPendingReview = order.status === 'Pending Payment Review';
  const isPending = order.status === 'Pending' || isPendingReview;

  const total = order.totalAmount || (order.productPrice * order.quantity) || 0;
  const advance = order.advanceAmount || Math.round(total * 0.2);
  const balance = Math.max(0, total - advance);

  return (
    <>
      <div className={clsx(
        "card p-5 transition-all duration-200 flex flex-col justify-between", 
        isPendingReview ? 'border-yellow-400 shadow-md ring-2 ring-yellow-400 animate-pulse' : 
        order.status === 'Pending' ? 'border-brand-300 shadow-md ring-1 ring-brand-50' : ''
      )}>
        <div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-slate-900">{order.customerName}</h3>
                {isPending && (
                   <span className="bg-brand-100 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                     New
                   </span>
                )}
              </div>
              <p className="text-sm text-slate-500 font-medium">{order.customerPhone}</p>
            </div>
            <div className={clsx("px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5", statusStyles[order.status])}>
              <StatusIcon size={14} />
              {order.status}
            </div>
          </div>

          {/* Product Details */}
          <div className="flex gap-3 items-center p-3 bg-slate-50 rounded-xl mb-3 border border-slate-100">
            <img src={order.productImage} alt={order.productName} className="w-14 h-16 rounded-lg object-cover border border-slate-200 shadow-sm" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-sm truncate">{order.productName}</p>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                <span>Qty: <strong className="text-slate-800">{order.quantity}</strong></span>
                <span className="font-extrabold text-slate-900 text-sm">₹{total}</span>
              </div>
            </div>
          </div>

          {/* Advance & Balance Breakdown */}
          <div className="grid grid-cols-2 gap-2 mb-3 text-xs bg-slate-100/70 p-2.5 rounded-lg border border-slate-200/60">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Advance Paid (Proof)</span>
              <span className="font-bold text-emerald-700">₹{advance}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Balance Due on Delivery</span>
              <span className="font-bold text-slate-800">₹{balance}</span>
            </div>
          </div>

          {/* Proof of Payment Screenshot Button */}
          {order.paymentScreenshotUrl && (
            <div className="mb-4 bg-blue-50/80 border border-blue-200 rounded-xl p-2.5 flex justify-between items-center">
              <div className="flex items-center gap-2 text-xs text-blue-900 font-semibold">
                <ImageIcon size={16} className="text-blue-600" />
                Payment Proof Uploaded
              </div>
              <button 
                onClick={() => setShowScreenshotModal(true)}
                className="text-xs bg-white text-blue-700 border border-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-50 font-bold shadow-xs transition-colors"
              >
                View Screenshot
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Calendar size={13} />
            <span>{dateString} • {timeString}</span>
          </div>

          {isPending && (
            <div className="flex gap-2">
              <button 
                disabled={isProcessing}
                onClick={() => handleStatusChange('Rejected')}
                className="btn-danger py-1.5 px-3 text-xs font-semibold flex items-center gap-1"
              >
                <XCircle size={14} /> Reject
              </button>
              <button 
                disabled={isProcessing}
                onClick={() => handleStatusChange('Accepted')}
                className="btn-success py-1.5 px-3 text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <CheckCircle size={14} /> {isPendingReview ? 'Verify & Accept' : 'Accept'}
              </button>
            </div>
          )}
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
                  Customer Payment Proof — {order.customerName}
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
                  <span className="text-gray-500 block">Verified Advance Amount:</span>
                  <span className="font-bold text-gray-900 text-sm">₹{advance}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowScreenshotModal(false)} className="btn-secondary py-2 px-4 text-xs font-semibold">
                    Close
                  </button>
                  {isPendingReview && (
                    <button 
                      onClick={() => {
                        handleStatusChange('Accepted');
                        setShowScreenshotModal(false);
                      }} 
                      className="btn-success py-2 px-4 text-xs font-bold flex items-center gap-1.5 shadow-md"
                    >
                      <CheckCircle size={15} /> Verify & Accept
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
