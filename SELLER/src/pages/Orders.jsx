import React, { useState, useMemo } from 'react';
import { useSeller } from '../context/SellerContext';
import OrderCard from '../components/OrderCard';
import { Search, Truck, CheckCircle2, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = ['All', 'Pending', 'Pending Review', 'Printing', 'Out for Delivery', 'Delivered', 'Rejected'];

const Orders = () => {
  const { orders } = useSeller();
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate Next-Day Delivery Logistics Metrics
  const logistics = useMemo(() => {
    let tomorrowDeliveriesCount = 0;
    let totalAdvanceCollected = 0;
    let totalCodBalanceDue = 0;

    orders.forEach(o => {
      if (o.status !== 'Rejected') {
        const total = o.totalAmount || (o.productPrice * o.quantity) || 0;
        const adv = o.advanceAmount || Math.round(total * 0.2);
        const bal = Math.max(0, total - adv);

        if (o.status === 'Accepted' || o.status === 'Printing' || o.status === 'Out for Delivery' || o.status === 'Pending Payment Review') {
          tomorrowDeliveriesCount++;
          totalAdvanceCollected += adv;
          totalCodBalanceDue += bal;
        }
      }
    });

    return {
      tomorrowDeliveriesCount,
      totalAdvanceCollected,
      totalCodBalanceDue
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        (order.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (order.customerPhone || '').includes(searchQuery) ||
        (order.campusLocation || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.id || '').toLowerCase().includes(searchQuery.toLowerCase());
        
      let matchesTab = true;
      if (activeTab === 'All') {
        matchesTab = true;
      } else if (activeTab === 'Pending') {
        matchesTab = order.status === 'Pending';
      } else if (activeTab === 'Pending Review') {
        matchesTab = order.status === 'Pending Payment Review';
      } else if (activeTab === 'Printing') {
        matchesTab = order.status === 'Printing' || order.status === 'Accepted';
      } else if (activeTab === 'Out for Delivery') {
        matchesTab = order.status === 'Out for Delivery';
      } else if (activeTab === 'Delivered') {
        matchesTab = order.status === 'Delivered';
      } else if (activeTab === 'Rejected') {
        matchesTab = order.status === 'Rejected';
      }

      return matchesSearch && matchesTab;
    }).sort((a, b) => {
      // Put Pending Payment Review first
      if (activeTab === 'All') {
        const aReview = a.status === 'Pending Payment Review';
        const bReview = b.status === 'Pending Payment Review';
        if (aReview && !bReview) return -1;
        if (!aReview && bReview) return 1;
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }, [orders, activeTab, searchQuery]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-6 pb-24"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-7 h-7 text-brand-600" />
            Campus Delivery & Orders
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage next-day campus & department delivery fulfillment.
          </p>
        </div>
      </div>

      {/* Next-Day Campus Delivery Logistics Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-50 text-brand-700 rounded-lg flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Campus Deliveries</p>
            <p className="text-xl font-black text-slate-900">{logistics.tomorrowDeliveriesCount} Orders</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Advance Collected</p>
            <p className="text-xl font-black text-emerald-700">₹{logistics.totalAdvanceCollected}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 text-amber-700 rounded-lg flex items-center justify-center font-bold">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">COD Cash to Collect</p>
            <p className="text-xl font-black text-amber-700">₹{logistics.totalCodBalanceDue}</p>
          </div>
        </div>
      </div>

      {/* Toolbar: Search & Tabs */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search by student name, phone, location/room, or Order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab ? 'text-brand-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {activeTab === tab && (
                <motion.div 
                  layoutId="active-tab" 
                  className="absolute inset-0 bg-brand-50 border border-brand-200 rounded-lg -z-10"
                />
              )}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed"
        >
          <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
            <Search className="w-5 h-5 text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No orders found</h3>
          <p className="text-xs text-slate-500">No student orders match this filter.</p>
        </motion.div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredOrders.map(order => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                key={order.id}
              >
                <OrderCard order={order} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Orders;
