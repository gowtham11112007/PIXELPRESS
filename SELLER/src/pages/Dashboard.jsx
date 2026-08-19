import React, { useEffect, useState } from 'react';
import { Package, Clock, CheckCircle } from 'lucide-react';
import { useSeller } from '../context/SellerContext';
import StatCard from '../components/StatCard';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Simple Animated Counter hook
function useCountUp(end, duration = 1000) {
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <StatCard title={title} value={animatedValue} icon={icon} trend={trend} />
    </motion.div>
  );
};

const Dashboard = () => {
  const { products, pendingOrdersCount, acceptedTodayCount, orders } = useSeller();
  const recentOrders = orders.slice(0, 5);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="max-w-6xl mx-auto space-y-6 pb-20"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500 mt-1">Welcome back! Here's what's happening with your store today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnimatedStatCard 
          title="Total Products" 
          value={products.length} 
          icon={Package} 
        />
        <AnimatedStatCard 
          title="Pending Orders" 
          value={pendingOrdersCount} 
          icon={Clock} 
          trend={{ value: 'Needs attention', isPositive: false }}
        />
        <AnimatedStatCard 
          title="Orders Accepted Today" 
          value={acceptedTodayCount} 
          icon={CheckCircle} 
          trend={{ value: 'Great job!', isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
            <Link to="/orders" className="text-sm font-medium text-brand-600 hover:text-brand-700">View all →</Link>
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Product</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-md object-cover border border-slate-200" src={order.productImage} alt="" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900 max-w-[150px] truncate">{order.productName}</div>
                            <div className="text-sm text-slate-500">Qty: {order.quantity}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{order.customerName}</div>
                        <div className="text-sm text-slate-500">{order.customerPhone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-[10px] uppercase tracking-wider leading-5 font-bold rounded-full 
                          ${order.status.includes('Pending') ? 'bg-amber-100 text-amber-800' : 
                            order.status === 'Accepted' ? 'bg-green-100 text-green-800' : 
                            'bg-red-100 text-red-800'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                        No orders yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h2>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-5"
          >
            {recentOrders.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No recent activity.</p>
            ) : (
              <div className="space-y-6">
                {recentOrders.slice(0, 4).map((order, i) => (
                  <div key={`act-${order.id}`} className="flex relative">
                    {i !== Math.min(recentOrders.length, 4) - 1 && (
                      <div className="absolute top-8 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                    )}
                    <div className="relative flex items-center justify-center h-8 w-8 rounded-full bg-brand-100 flex-shrink-0">
                      <Clock className="h-4 w-4 text-brand-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm text-slate-900">
                        <span className="font-semibold">{order.customerName}</span> placed an order for <span className="font-semibold text-brand-600">{order.productName}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(order.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
