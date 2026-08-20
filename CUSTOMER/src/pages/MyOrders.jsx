import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import OrderCard from '../components/OrderCard';
import { useAppContext } from '../context/AppContext';

export default function MyOrders() {
  const { orders, clearOrderHistory } = useAppContext();

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="min-h-screen bg-gray-50"
    >
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Orders</h1>
          <div className="flex items-center gap-4">
            {orders.length > 0 && (
              <button 
                onClick={() => {
                  if (window.confirm("Are you sure you want to clear your local order history?")) {
                    clearOrderHistory();
                  }
                }}
                className="text-xs font-semibold text-red-500 hover:text-red-700 tracking-widest uppercase transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Clear History
              </button>
            )}
            <Link to="/" className="text-xs font-semibold text-gray-500 hover:text-black tracking-widest uppercase underline underline-offset-4 transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white border border-gray-200 p-12 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2"><ShoppingBag className="w-8 h-8 text-gray-400" /></div>
            <h2 className="text-lg font-semibold text-gray-900">No orders yet</h2>
            <p className="text-sm text-gray-500 max-w-sm">
              You haven't placed any orders. Browse our collection and find something for your walls!
            </p>
            <Link
              to="/"
              className="mt-2 inline-block bg-black text-white text-xs font-semibold tracking-widest uppercase px-6 py-3 hover:bg-gray-800 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-4 py-2.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />
              Orders under 'Payment Review' require manual verification by the admin.
            </div>

            {orders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </main>
    </motion.div>
  );
}
