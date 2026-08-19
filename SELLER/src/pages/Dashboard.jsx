import React, { useEffect, useState } from 'react';
import { Package, Clock, Truck, Layers, MapPin } from 'lucide-react';
import { useSeller } from '../context/SellerContext';
import StatCard from '../components/StatCard';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Simple Animated Counter hook
function useCountUp(end, duration = 800) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return count;
}

const AnimatedStatCard = ({ title, value, icon, trend }) => {
  const animatedValue = useCountUp(value);
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <StatCard title={title} value={animatedValue} icon={icon} trend={trend} />
    </motion.div>
  );
};

const Dashboard = () => {
  const { products, collections, pendingOrdersCount, orders } = useSeller();
  const recentOrders = orders.slice(0, 5);

  const tomorrowDeliveriesCount = orders.filter(
    o => o.status === 'Printing' || o.status === 'Accepted' || o.status === 'Out for Delivery' || o.status === 'Pending Payment Review'
  ).length;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="max-w-6xl mx-auto space-y-6 pb-24"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Campus Store Overview</h1>
        <p className="text-slate-500 text-sm mt-0.5">Next-day print queue, hostel deliveries, and merchandise inventory.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <AnimatedStatCard 
          title="Tomorrow Deliveries" 
          value={tomorrowDeliveriesCount} 
          icon={Truck} 
          trend={{ value: 'Campus Queue', isPositive: true }}
        />
        <AnimatedStatCard 
          title="Pending Reviews" 
          value={pendingOrdersCount} 
          icon={Clock} 
          trend={{ value: 'Verify proof', isPositive: false }}
        />
        <AnimatedStatCard 
          title="Total Products" 
          value={products.length} 
          icon={Package} 
        />
        <AnimatedStatCard 
          title="Active Collections" 
          value={collections.length} 
          icon={Layers} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-bold text-slate-900">Recent Campus Orders</h2>
            <Link to="/orders" className="text-xs font-bold text-brand-600 hover:text-brand-700">View all orders →</Link>
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden"
          >
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Product</th>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Hostel / Location</th>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 text-xs">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center">
                          <img className="h-9 w-9 rounded-lg object-cover border border-slate-200" src={order.productImage} alt="" />
                          <div className="ml-3">
                            <div className="font-bold text-slate-900 max-w-[160px] truncate">{order.productName}</div>
                            <div className="text-slate-400">Qty: {order.quantity} • ₹{order.totalAmount || (order.productPrice * order.quantity)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{order.customerName}</div>
                        <div className="text-slate-500 flex items-center gap-1">
                          <MapPin size={11} className="text-brand-600" />
                          <span>{order.campusLocation || 'Hostel'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 inline-flex text-[10px] uppercase tracking-wider font-bold rounded-full 
                          ${order.status.includes('Pending') ? 'bg-amber-100 text-amber-800' : 
                            order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 
                            order.status === 'Out for Delivery' ? 'bg-purple-100 text-purple-800' :
                            'bg-blue-100 text-blue-800'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-400">
                        {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-400">
                        No orders placed yet today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="sm:hidden divide-y divide-slate-100">
              {recentOrders.map((order) => (
                <div key={order.id} className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img className="h-11 w-11 rounded-lg object-cover border border-slate-200 shrink-0" src={order.productImage} alt="" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{order.productName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{order.customerName} • {order.campusLocation}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 shrink-0 text-[10px] uppercase tracking-wider font-bold rounded-full 
                    ${order.status.includes('Pending') ? 'bg-amber-100 text-amber-800' : 
                      order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 
                      'bg-blue-100 text-blue-800'}`}>
                    {order.status}
                  </span>
                </div>
              ))}
              {recentOrders.length === 0 && (
                <p className="p-6 text-center text-xs text-slate-400">No orders yet.</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Next-Day Campus Fulfillment Quick Link */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Campus Delivery Hub</h2>
          <div className="bg-gradient-to-br from-slate-900 to-black text-white p-5 rounded-2xl shadow-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-amber-400">
                <Truck size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">Next-Day Delivery Rule</p>
                <p className="text-xs text-slate-400">Orders before 9 PM</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Verify payments and send accepted prints to queue. Tomorrow morning, dispatch campus delivery runners directly to student hostel rooms!
            </p>

            <Link
              to="/orders"
              className="block text-center w-full bg-white text-slate-900 font-bold py-2.5 rounded-xl text-xs hover:bg-slate-100 transition-colors shadow-xs"
            >
              Open Campus Dispatch →
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
