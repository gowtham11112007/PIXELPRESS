import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import OrderModal from '../components/OrderModal';
import { collections } from '../data/mockProducts';
import { useAppContext } from '../context/AppContext';

// Scrolling promo bar below hero
function PromoBar({ text }) {
  const defaultText = "✦ FREE DELIVERY FOR PREPAID ORDERS ✦ SPLIT POSTERS ✦ CUSTOM WALL ART ✦ 100% QUALITY GUARANTEE";
  const displayText = (text || defaultText) + "      ";
  return (
    <div className="bg-black text-white text-[11px] tracking-widest font-medium overflow-hidden py-2.5">
      <div className="marquee-track whitespace-nowrap select-none flex">
        <span className="px-6">{displayText}</span>
        <span className="px-6">{displayText}</span>
        <span className="px-6">{displayText}</span>
        <span className="px-6">{displayText}</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const { products, isProductsLoading, storeSettings } = useAppContext();

  // Dynamically compute category pills based on available products
  const categories = useMemo(() => {
    const defaultCats = ["All", "Wall Setups", "Split Posters", "Motivation", "Cars & Motors", "Minimal"];
    const productCats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    const merged = Array.from(new Set([...defaultCats, ...productCats]));
    return merged;
  }, [products]);

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
        <section className="relative overflow-hidden bg-black text-white min-h-[65vh] flex items-center">
          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.45 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=1400&h=700')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />

          <div className="relative max-w-[1400px] mx-auto px-6 sm:px-10 py-16 sm:py-24 w-full">
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xs tracking-[0.3em] font-bold text-gray-300 uppercase mb-3 flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{storeSettings.storeName} Storefront</span>
            </motion.p>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-4xl sm:text-6xl md:text-7xl font-black leading-tight mb-6 max-w-2xl"
            >
              Elevate Your Space.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-gray-300 to-gray-500">
                Inspire Your Walls.
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-gray-300 text-sm sm:text-base max-w-md mb-8 leading-relaxed"
            >
              Exclusive high-definition prints with vibrant colors & easy UPI advance checkout.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-wrap gap-4"
            >
              <button
                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-black text-xs sm:text-sm font-bold px-8 py-3.5 hover:bg-gray-100 transition-colors tracking-widest uppercase rounded-lg shadow-lg"
              >
                Browse Collection
              </button>
            </motion.div>
          </div>
        </section>

        {/* ── PROMO MARQUEE ── */}
        <PromoBar text={storeSettings.announcementText} />

        {/* ── COLLECTION TILES ── */}
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
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
                className="relative overflow-hidden cursor-pointer group rounded-xl shadow-sm" 
                style={{ aspectRatio: '3/4' }}
              >
                <img
                  src={col.image}
                  alt={col.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent group-hover:from-black/90 transition-colors duration-300" />
                <div className="absolute inset-0 flex items-end justify-start p-4 sm:p-6">
                  <div>
                    <p className="text-white font-bold text-base sm:text-lg tracking-wide mb-0.5">{col.name}</p>
                    <p className="text-gray-300 text-xs group-hover:text-white transition-colors transform group-hover:translate-x-1 duration-300">
                      Explore Collection →
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── FEATURED PRODUCTS (WITH FILTERS) ── */}
        <section id="products" className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Our Catalog</h2>
              <p className="text-sm text-gray-500 mt-1">Discover our exclusive wall art collections.</p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-80">
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
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  activeCategory === cat 
                    ? 'bg-black text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Grid / Empty States */}
          {isProductsLoading ? (
            <div className="py-20 text-center text-gray-400">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium">Loading catalog...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 px-6 text-center bg-gray-50 rounded-2xl border border-gray-200 max-w-xl mx-auto my-8">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                🎨
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">New Collection Dropping Soon</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                The store catalog is currently being updated with brand new prints. Please check back shortly!
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-bold text-gray-900">No products match your filter</p>
              <p className="text-sm text-gray-500">Try adjusting your search or category filter.</p>
              <button 
                onClick={() => {setSearchQuery(""); setActiveCategory("All");}}
                className="mt-4 text-xs font-bold uppercase tracking-widest text-black underline"
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
          <p className="text-black font-black text-xl mb-2 tracking-tighter">{storeSettings.storeName}</p>
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
