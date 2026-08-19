import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Layers, ShoppingCart, Sliders, LogOut, Store, Bell } from 'lucide-react';
import { useSeller } from '../context/SellerContext';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const { user, pendingOrdersCount, logout, storeSettings } = useSeller();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Collections', path: '/collections', icon: Layers },
    { name: 'Orders', path: '/orders', icon: ShoppingCart, badge: pendingOrdersCount },
    { name: 'Store Settings', path: '/settings', icon: Sliders },
  ];

  return (
    <>
      {/* ── MOBILE TOP APP BAR (Phones & Tablets < md) ── */}
      <header className="md:hidden fixed top-0 inset-x-0 h-14 bg-white/95 backdrop-blur border-b border-slate-200 z-40 px-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-xs">
            <Store size={16} />
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-900 tracking-tight leading-none">
              {storeSettings?.storeName || 'PixelPress'}
            </h1>
            <span className="text-[10px] text-brand-600 font-bold uppercase tracking-wider">
              Campus Hub
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pendingOrdersCount > 0 && (
            <NavLink
              to="/orders"
              className="flex items-center gap-1 bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full animate-pulse"
            >
              <Bell size={12} className="text-amber-700" />
              <span>{pendingOrdersCount} New</span>
            </NavLink>
          )}

          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
            {user?.name?.charAt(0) || 'S'}
          </div>

          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-lg"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* ── MOBILE BOTTOM NAVIGATION BAR (Phones & Tablets < md) ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 px-2 py-1 flex items-center justify-around shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={clsx(
                "flex-1 flex flex-col items-center justify-center py-1.5 px-1 relative transition-colors",
                isActive ? "text-brand-600 font-bold" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <div className="relative">
                <Icon size={19} className={isActive ? "text-brand-600" : "text-slate-500"} />
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-bounce">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 font-medium tracking-tight">
                {item.name === 'Store Settings' ? 'Settings' : item.name}
              </span>
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-active"
                  className="absolute bottom-0 w-8 h-1 bg-brand-600 rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── DESKTOP PERSISTENT SIDEBAR (md and above) ── */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col h-screen sticky top-0 shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-sm">
            <Store size={20} />
          </div>
          <div>
            <h1 className="font-bold text-xl text-slate-900 tracking-tight">{storeSettings?.storeName || 'PixelPress'}</h1>
            <p className="text-xs text-slate-500 font-medium tracking-wide">CAMPUS HUB</p>
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
                    ? "text-brand-700 font-bold" 
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
                  <span className="bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-sm animate-pulse">
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
    </>
  );
};

export default Sidebar;
