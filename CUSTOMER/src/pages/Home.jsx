import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import OrderModal from '../components/OrderModal';
import { collections } from '../data/mockProducts';
import { useAppContext } from '../context/AppContext';

// Scrolling promo bar below hero
function PromoBar() {
  const items = [
    "✦ FREE DELIVERY FOR PREPAID ORDERS",
    "✦ BUY 4 GET 3 FREE",
    "✦ BUY 5 GET 5 FREE",
    "✦ SPLIT POSTERS BUY 1 GET 2 FREE",
    "✦ POSTER KIT BUY 2 GET 1 FREE",
  ];
  const text = items.join("     ");
  return (
    <div className="bg-black text-white text-[11px] tracking-widest font-medium overflow-hidden py-2.5">
      <div className="marquee-track whitespace-nowrap select-none flex">
        <span className="px-6">{text}</span>
        <span className="px-6">{text}</span>
        <span className="px-6">{text}</span>
        <span className="px-6">{text}</span>
      </div>
    </div>
  );
}

const CATEGORIES = ["All", "Wall Setups", "Split Posters", "Motivation", "Cars & Motors", "Minimal"];

export default function Home() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const { products } = useAppContext();

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "All" || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, activeCategory]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="min-h-screen bg-white"
    >
      <Navbar />

      <main>
        {/* ── HERO BANNER ── */}
        <section className="relative overflow-hidden bg-black text-white min-h-[70vh] flex items-center">
          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.5 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=1400&h=700')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />

          <div className="relative max-w-[1400px] mx-auto px-6 sm:px-10 py-16 sm:py-24 w-full">
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xs tracking-[0.3em] font-medium text-gray-300 uppercase mb-3"
            >
              Premium Wall Art
            </motion.p>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6 max-w-2xl"
            >
              Elevate Your Space.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">Inspire Your Day.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-gray-400 text-base sm:text-lg max-w-md mb-10"
            >
              Premium quality prints with stunning aesthetics. Bring your walls to life with our exclusive collections.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-wrap gap-4"
            >
              <button
                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-black text-sm font-bold px-8 py-4 hover:bg-gray-100 transition-colors tracking-wide"
              >
                SHOP COLLECTION
              </button>
            </motion.div>
          </div>
        </section>

        {/* ── PROMO MARQUEE ── */}
        <PromoBar />

        {/* ── COLLECTION TILES ── */}
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {collections.map((col, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1 }}
                key={col.id} 
                onClick={() => {
                  setActiveCategory(col.name);
                  document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="relative overflow-hidden cursor-pointer group rounded-lg" 
                style={{ aspectRatio: '3/4' }}
              >
                <img
                  src={col.image}
                  alt={col.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-colors duration-300" />
                <div className="absolute inset-0 flex items-end justify-start p-5 sm:p-6">
                  <div>
                    <p className="text-white font-bold text-lg sm:text-xl tracking-wide mb-1">{col.name}</p>
                    <p className="text-gray-300 text-xs sm:text-sm group-hover:text-white transition-colors transform group-hover:translate-x-1 duration-300">Shop Collection →</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── FEATURED PRODUCTS (WITH FILTERS) ── */}
        <section id="products" className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Our Prints</h2>
              <p className="text-sm text-gray-500 mt-1">Discover our entire catalog of premium posters.</p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-72">
              <input 
                type="text" 
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 pb-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeCategory === cat 
                    ? 'bg-black text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="py-20 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-900">No products found</p>
              <p className="text-sm">Try adjusting your search or category filter.</p>
              <button 
                onClick={() => {setSearchQuery(""); setActiveCategory("All");}}
                className="mt-4 text-sm font-bold underline"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-12"
            >
              <AnimatePresence>
                {filteredProducts.map(product => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    key={product.id}
                  >
                    <ProductCard
                      product={product}
                      onOrderClick={setSelectedProduct}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        {/* ── TRUST / INFO BAR ── */}
        <section className="bg-black text-white py-16">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12 text-center">
              {[
                { icon: "🚚", title: "Free Delivery", sub: "On prepaid orders" },
                { icon: "🎨", title: "Custom Prints", sub: "Upload your image" },
                { icon: "📦", title: "Fast Turnaround", sub: "2–3 working days" },
                { icon: "💬", title: "WhatsApp Support", sub: "Order via chat" },
              ].map((item, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  key={item.title} 
                  className="flex flex-col items-center gap-3"
                >
                  <span className="text-3xl bg-white/10 p-4 rounded-full">{item.icon}</span>
                  <p className="text-sm font-bold tracking-wide uppercase">{item.title}</p>
                  <p className="text-xs text-gray-400">{item.sub}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="bg-white border-t border-gray-100 py-12 text-center text-xs tracking-wide">
          <p className="text-black font-black text-xl mb-2 tracking-tighter">PIXELPRESS</p>
          <p className="text-gray-500">Premium Wall Art • © 2026</p>
        </footer>
      </main>

      <OrderModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </motion.div>
  );
}
