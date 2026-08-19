import React from 'react';
import { ShoppingBag, User, ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import CartDrawer from './CartDrawer';

// Marquee announcement bar — exactly like Posterized's running line
function AnnouncementBar() {
  const messages = [
    "FREE DELIVERY FOR PREPAID ORDERS!",
    "BUY 4 GET 3 FREE!",
    "BUY 5 GET 5 FREE!",
    "BUY 6 GET 12 FREE!",
    "BUY 10 GET 26 FREE!",
    "FREE DELIVERY FOR PREPAID ORDERS!",
    "SPLIT POSTERS BUY 1 GET 2 FREE",
    "SPLIT POSTERS BUY 2 GET 6 FREE",
  ];
  const text = messages.join("   ✦   ");

  return (
    <div className="bg-black text-white text-[11px] sm:text-xs font-medium tracking-widest overflow-hidden py-2">
      <div className="marquee-track select-none whitespace-nowrap">
        <span className="px-8">{text}</span>
        <span className="px-8">{text}</span>
        <span className="px-8">{text}</span>
        <span className="px-8">{text}</span>
      </div>
    </div>
  );
}

export default function Navbar() {
  const { user, logout, cart, setIsCartOpen, orders } = useAppContext();
  const navigate = useNavigate();

  const totalCartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <AnnouncementBar />
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-14 sm:h-16">

            {/* LEFT: Logo */}
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-7 h-7 bg-black rounded flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold tracking-tight text-black">
                PixelPress
              </span>
            </Link>

            {/* CENTER: Nav links (desktop) */}
            <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-700">
              <Link to="/" className="hover:text-black transition-colors py-1 border-b-2 border-transparent hover:border-black">Home</Link>
              <Link to="/orders" className="hover:text-black transition-colors py-1 border-b-2 border-transparent hover:border-black">My Orders ({orders.length})</Link>
              <a href="#products" className="hover:text-black transition-colors py-1 border-b-2 border-transparent hover:border-black">Wall Setups</a>
              <a href="#products" className="hover:text-black transition-colors py-1 border-b-2 border-transparent hover:border-black">Split Posters</a>
              <a href="#products" className="hover:text-black transition-colors py-1 border-b-2 border-transparent hover:border-black">Motivation</a>
            </div>

            {/* RIGHT: Icons */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Cart Drawer Trigger */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="View Cart"
              >
                <ShoppingCart className="w-5 h-5 text-gray-800" />
                <AnimatePresence>
                  {totalCartCount > 0 && (
                    <motion.span 
                      key="cart-badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                    >
                      {totalCartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* User Profile / Login */}
              {user ? (
                <div className="flex items-center space-x-2 pl-2 border-l border-gray-200">
                  <Link
                    to="/orders"
                    className="flex items-center space-x-1.5 text-xs font-semibold text-gray-800 hover:text-black bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-sm transition-colors"
                    title={`Logged in as ${user.name} (${user.phone})`}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                    <span>{user.name.split(' ')[0]}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-[11px] text-gray-400 hover:text-red-600 transition-colors uppercase font-bold"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="text-xs font-bold uppercase tracking-wider bg-black text-white px-3 py-1.5 hover:bg-gray-800 transition-colors"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Slide-out Cart Drawer */}
      <CartDrawer />
    </>
  );
}
