import React, { useState, useMemo } from 'react';
import { useSeller } from '../context/SellerContext';
import OrderCard from '../components/OrderCard';
import { RefreshCw, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = ['All', 'Pending Review', 'Pending', 'Accepted', 'Rejected'];

const Orders = () => {
  const { orders, simulateNewOrder } = useSeller();
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        order.customerPhone.includes(searchQuery) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesTab = 
        activeTab === 'All' ? true : 
        activeTab === 'Pending Review' ? order.status === 'Pending Payment Review' :
        order.status === activeTab;

      return matchesSearch && matchesTab;
    }).sort((a, b) => {
      // Always put Pending/Review first if in "All" tab
      if (activeTab === 'All') {
        const aPending = a.status.includes('Pending');
        const bPending = b.status.includes('Pending');
        if (aPending && !bPending) return -1;
        if (!aPending && bPending) return 1;
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }, [orders, activeTab, searchQuery]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6 pb-20"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Incoming Orders</h1>
          <p className="text-slate-500 mt-1">Manage and fulfill your customer orders.</p>
        </div>
        <button 
          onClick={simulateNewOrder}
          className="btn-secondary flex items-center gap-2 text-sm whitespace-nowrap"
          title="For demo purposes: simulates a new incoming order"
        >
          <RefreshCw size={16} />
          Simulate New Order
        </button>
      </div>

      {/* Toolbar: Search & Tabs */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search by customer name, phone, or Order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
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
          className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed"
        >
          <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
            <Search className="w-5 h-5 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">No orders found</h3>
          <p className="text-slate-500">Try adjusting your filters or search query.</p>
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
