import React from 'react';
import { Clock, CheckCircle2, XCircle, MessageCircle, MapPin, Truck, Printer, Sparkles } from 'lucide-react';

export default function OrderCard({ order }) {
  const isAccepted = order.status === 'Accepted' || order.status === 'Printing';
  const isOutForDelivery = order.status === 'Out for Delivery';
  const isDelivered = order.status === 'Delivered';
  const isRejected = order.status === 'Rejected';

  const statusConfig = {
    'Pending':  { label: 'Pending Payment',  icon: Clock, cls: 'text-amber-600 bg-amber-50 border-amber-200' },
    'Pending Payment Review':  { label: 'Payment Under Review', icon: Clock, cls: 'text-amber-700 bg-amber-50 border-amber-300 font-bold animate-pulse' },
    'Printing': { label: 'Printing Your Items', icon: Printer, cls: 'text-blue-700 bg-blue-50 border-blue-200 font-bold' },
    'Accepted': { label: 'Order Confirmed', icon: CheckCircle2, cls: 'text-blue-700 bg-blue-50 border-blue-200 font-bold' },
    'Out for Delivery': { label: 'Out for Campus Delivery', icon: Truck, cls: 'text-purple-700 bg-purple-50 border-purple-200 font-bold' },
    'Delivered': { label: 'Delivered to Room', icon: CheckCircle2, cls: 'text-emerald-700 bg-emerald-50 border-emerald-200 font-bold' },
    'Rejected': { label: 'Rejected', icon: XCircle, cls: 'text-red-600 bg-red-50 border-red-200' },
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
      `Hi PixelPress! I'd like to check on my campus order #${order.id.slice(0, 8).toUpperCase()} for "${order.product?.name}" (Hostel/Room: ${order.campusLocation || 'Hostel'}). Balance to pay: ₹${balance}.`
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
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Advance Paid</span>
                <span className="font-bold text-emerald-700">₹{advance}</span>
              </div>
              <div className="border-l border-slate-200 pl-3">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Pay on Delivery (COD)</span>
                <span className="font-bold text-amber-700">₹{balance}</span>
              </div>
            </div>

            {/* Progress Stages Bar */}
            {!isRejected && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="grid grid-cols-4 gap-1 text-center">
                  {steps.map((s, idx) => (
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
