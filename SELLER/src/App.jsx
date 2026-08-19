import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { SellerProvider } from './context/SellerContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Collections from './pages/Collections';
import Orders from './pages/Orders';
import Settings from './pages/Settings';
import Toast from './components/Toast';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:p-8 pt-18 md:pt-8 pb-20 md:pb-8 relative">
        {children}
      </main>
    </div>
  );
};

const AppRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/products" element={<Layout><Products /></Layout>} />
        <Route path="/collections" element={<Layout><Collections /></Layout>} />
        <Route path="/orders" element={<Layout><Orders /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <SellerProvider>
      <Router>
        <AppRoutes />
        <Toast />
      </Router>
    </SellerProvider>
  );
}

export default App;
