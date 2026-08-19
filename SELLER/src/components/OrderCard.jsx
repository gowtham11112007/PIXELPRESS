import React, { useState } from 'react';
import { useSeller } from '../context/SellerContext';
import { CheckCircle, XCircle, Clock, Calendar, Image as ImageIcon, X } from 'lucide-react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';

const OrderCard = ({ order }) => {
  const { updateOrderStatus, showToast } = useSeller();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);

  const handleStatusChange = (status) => {
    setIsProcessing(true);
    // Simulate network request
    setTimeout(() => {
      updateOrderStatus(order.id, status);
      setIsProcessing(false);
      showToast(`Order marked as ${status}`);
    }, 400);
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

  return (
    <>
      <div className={clsx(
        "card p-5 transition-all duration-200", 
        isPendingReview ? 'border-yellow-400 shadow-md ring-2 ring-yellow-400 animate-pulse' : 
        order.status === 'Pending' ? 'border-brand-300 shadow-md ring-1 ring-brand-50' : ''
      )}>
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

        <div className="flex gap-4 items-center p-3 bg-slate-50 rounded-lg mb-4 border border-slate-100">
          <img src={order.productImage} alt={order.productName} className="w-16 h-16 rounded-md object-cover border border-slate-200 shadow-sm" />
          <div className="flex-1">
            <p className="font-semibold text-slate-900 line-clamp-1">{order.productName}</p>
            <p className="text-sm text-slate-500 mt-0.5">Qty: <span className="font-medium text-slate-700">{order.quantity}</span></p>
          </div>
        </div>

        {order.paymentScreenshotUrl && (
          <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
              <ImageIcon size={16} className="text-blue-500" />
              Advance Payment Proof
            </div>
            <button 
              onClick={() => setShowScreenshotModal(true)}
              className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-50 font-semibold"
            >
              View Screenshot
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Calendar size={14} />
            <span>{dateString} • {timeString}</span>
          </div>

          {isPending && (
            <div className="flex gap-2">
              <button 
                disabled={isProcessing}
                onClick={() => handleStatusChange('Rejected')}
                className="btn-danger py-1.5 px-3 text-sm flex items-center gap-1.5"
              >
                <XCircle size={16} /> Reject
              </button>
              <button 
                disabled={isProcessing}
                onClick={() => handleStatusChange('Accepted')}
                className="btn-success py-1.5 px-3 text-sm flex items-center gap-1.5"
              >
                <CheckCircle size={16} /> {isPendingReview ? 'Verify & Accept' : 'Accept'}
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
              className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden z-10"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <ImageIcon size={18} /> Payment Screenshot
                </h3>
                <button onClick={() => setShowScreenshotModal(false)} className="p-1 hover:bg-gray-200 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 overflow-auto flex-1 flex justify-center bg-gray-100">
                <img 
                  src={order.paymentScreenshotUrl} 
                  alt="Payment Screenshot" 
                  className="max-w-full h-auto object-contain rounded shadow-sm border border-gray-200"
                />
              </div>
              <div className="p-4 bg-white border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => setShowScreenshotModal(false)} className="btn-secondary">Close</button>
                {isPendingReview && (
                  <button 
                    onClick={() => {
                      handleStatusChange('Accepted');
                      setShowScreenshotModal(false);
                    }} 
                    className="btn-success flex items-center gap-2"
                  >
                    <CheckCircle size={16} /> Verify Payment & Accept Order
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default OrderCard;
