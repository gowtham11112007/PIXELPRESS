import React from 'react';
import { Clock, CheckCircle2, XCircle, MessageCircle } from 'lucide-react';

export default function OrderCard({ order }) {
  const isAccepted = order.status === 'Accepted';
  const isRejected = order.status === 'Rejected';

  const statusConfig = {
    'Pending':  { label: 'Pending',  icon: Clock,         cls: 'text-amber-600 bg-amber-50 border-amber-200' },
    'Pending Payment Review':  { label: 'Payment Review',  icon: Clock,         cls: 'text-yellow-700 bg-yellow-50 border-yellow-300 font-bold animate-pulse' },
    'Accepted': { label: 'Accepted', icon: CheckCircle2,  cls: 'text-green-600 bg-green-50 border-green-200' },
    'Rejected': { label: 'Rejected', icon: XCircle,       cls: 'text-red-600 bg-red-50 border-red-200' },
  };
  const { label, icon: Icon, cls } = statusConfig[order.status] || statusConfig['Pending'];

  const orderDate = new Date(order.date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hi PixelPress! I'd like to confirm my order #${order.id.toUpperCase()} for "${order.product.name}" (Qty: ${order.quantity}). Total: ₹${order.product.price * order.quantity}`
    );
    window.open(`https://wa.me/919047302794?text=${text}`, '_blank');
  };

  return (
    <div className="bg-white border border-gray-200 flex flex-col sm:flex-row gap-0 overflow-hidden">
      {/* Product image */}
      <div className="w-full sm:w-28 h-32 sm:h-auto flex-shrink-0 bg-gray-50">
        <img
          src={order.product.image}
          alt={order.product.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Details */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 leading-snug text-sm sm:text-base">
              {order.product.name}
            </h3>
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 border rounded-sm flex-shrink-0 ${cls}`}>
              <Icon className="w-3 h-3" />
              {label}
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span>Order #{order.id.slice(0, 8).toUpperCase()}</span>
            <span>•</span>
            <span>{orderDate}</span>
            <span>•</span>
            <span>Qty: {order.quantity}</span>
            <span>•</span>
            <span className="font-bold text-gray-900">₹{order.product.price * order.quantity}</span>
            {order.customer_name && (
              <>
                <span>•</span>
                <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px] text-gray-700 font-medium">
                  👤 {order.customer_name} ({order.customer_phone})
                </span>
              </>
            )}
          </div>
        </div>

        {isAccepted && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bb5a] text-white text-xs font-semibold px-4 py-2 rounded-sm transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Contact Seller on WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
