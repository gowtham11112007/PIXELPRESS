import React from 'react';
import { Clock, CheckCircle2, XCircle, MessageCircle, Image as ImageIcon } from 'lucide-react';

export default function OrderCard({ order }) {
  const isAccepted = order.status === 'Accepted';
  const isRejected = order.status === 'Rejected';

  const statusConfig = {
    'Pending':  { label: 'Pending',  icon: Clock,         cls: 'text-amber-600 bg-amber-50 border-amber-200' },
    'Pending Payment Review':  { label: 'Payment Under Review',  icon: Clock,         cls: 'text-yellow-700 bg-yellow-50 border-yellow-300 font-bold animate-pulse' },
    'Accepted': { label: 'Order Confirmed', icon: CheckCircle2,  cls: 'text-green-700 bg-green-50 border-green-200 font-bold' },
    'Rejected': { label: 'Rejected', icon: XCircle,       cls: 'text-red-600 bg-red-50 border-red-200' },
  };
  const { label, icon: Icon, cls } = statusConfig[order.status] || statusConfig['Pending'];

  const orderDate = new Date(order.date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const total = order.totalAmount || (order.product?.price * order.quantity) || 0;
  const advance = order.advanceAmount || Math.round(total * 0.2);
  const balance = Math.max(0, total - advance);

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hi PixelPress! I'd like to check on my order #${order.id.slice(0, 8).toUpperCase()} for "${order.product?.name}" (Qty: ${order.quantity}). Advance paid: ₹${advance}, Balance: ₹${balance}.`
    );
    window.open(`https://wa.me/919047302794?text=${text}`, '_blank');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
      <div className="flex flex-col sm:flex-row gap-0">
        {/* Product image */}
        <div className="w-full sm:w-28 h-32 sm:h-auto flex-shrink-0 bg-gray-50">
          <img
            src={order.product?.image}
            alt={order.product?.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Details */}
        <div className="flex-1 p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-gray-900 leading-snug text-sm sm:text-base">
                {order.product?.name}
              </h3>
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 border rounded-full flex-shrink-0 ${cls}`}>
                <Icon className="w-3 h-3" />
                {label}
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className="font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
              <span>•</span>
              <span>{orderDate}</span>
              <span>•</span>
              <span>Qty: <strong>{order.quantity}</strong></span>
              <span>•</span>
              <span className="font-black text-gray-900">Total: ₹{total}</span>
            </div>

            {/* Advance & Balance Details */}
            <div className="mt-3 flex gap-3 text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-100">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Advance Proof</span>
                <span className="font-bold text-emerald-700">₹{advance}</span>
              </div>
              <div className="border-l border-gray-200 pl-3">
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Pay on Delivery</span>
                <span className="font-bold text-gray-800">₹{balance}</span>
              </div>
            </div>
          </div>

          {isAccepted && (
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-green-700 font-medium">✓ Payment verified by store admin</span>
              <button
                onClick={handleWhatsApp}
                className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bb5a] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp Support
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
