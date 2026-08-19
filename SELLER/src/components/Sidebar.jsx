import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, LogOut, Store } from 'lucide-react';
import { useSeller } from '../context/SellerContext';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const { user, pendingOrdersCount, logout } = useSeller();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Orders', path: '/orders', icon: ShoppingCart, badge: pendingOrdersCount },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3 border-b border-slate-100">
        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-sm">
          <Store size={20} />
        </div>
        <div>
          <h1 className="font-bold text-xl text-slate-900 tracking-tight">PixelPress</h1>
          <p className="text-xs text-slate-500 font-medium tracking-wide">SELLER HUB</p>
        </div>
      </div>

      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold uppercase shrink-0">
          {user?.name?.charAt(0) || 'S'}
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'Seller'}</p>
          <p className="text-xs text-slate-500 truncate">{user?.phone}</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto relative">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={clsx(
                "relative flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 z-10",
                isActive 
                  ? "text-brand-700" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-brand-50 rounded-lg -z-10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className="flex items-center gap-3">
                <Icon size={18} className={isActive ? "text-brand-600" : "text-slate-400"} />
                {item.name}
              </div>
              {item.badge > 0 && (
                <span className="bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-sm">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-150"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
