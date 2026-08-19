import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Truck, Zap, Pin, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import OrderModal from '../components/OrderModal';
import { useAppContext } from '../context/AppContext';

// Scrolling promo bar below hero
function PromoBar({ text }) {
  const defaultText = "⚡ ORDER TODAY, RECEIVE TOMORROW IN YOUR HOSTEL ROOM ✦ 100% HD PRINTS & PINS ✦ FREE CAMPUS DELIVERY";
  const displayText = (text || defaultText) + "      ";
  return (
    <div className="bg-slate-950 text-amber-400 text-[11px] tracking-widest font-black overflow-hidden py-2.5 border-y border-slate-800">
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
  const { products, collections, isProductsLoading, storeSettings } = useAppContext();

  // Dynamic category tabs
  const categories = useMemo(() => {
    const defaultCats = ["All"];
    collections.forEach(c => defaultCats.push(c.name));
    const productCats = products.map(p => p.category).filter(Boolean);
    return Array.from(new Set([...defaultCats, ...productCats]));
  }, [collections, products]);

  // Separate pinned products
  const pinnedProducts = useMemo(() => {
    return products.filter(p => p.isPinned);
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
      className="min-h-screen bg-slate-50/50"
    >
      <Navbar />

      <main>
        {/* ── HERO BANNER (CAMPUS FOCUSED) ── */}
        <section className="relative overflow-hidden bg-slate-950 text-white min-h-[55vh] sm:min-h-[60vh] flex items-center">
          <motion.div
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.35 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=1400&h=700')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-900/60" />

          <div className="relative max-w-[1400px] mx-auto px-5 sm:px-10 py-14 sm:py-20 w-full">
            {/* Delivery Guarantee Pill */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider mb-4"
            >
              <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Next-Day Campus & Hostel Delivery</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl sm:text-5xl md:text-6xl font-black leading-tight mb-4 max-w-2xl tracking-tight"
            >
              Level Up Your Hostel Room.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-100 to-white">
                Delivered Tomorrow.
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-slate-300 text-xs sm:text-sm max-w-lg mb-6 leading-relaxed"
            >
              Order custom wall setups, anime splits, motivational posters, and aesthetic pins. Placed before 9 PM? Get it tomorrow directly at your hostel or department!
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-3"
            >
              <button
                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-black px-7 py-3.5 transition-all tracking-wider uppercase rounded-xl shadow-lg flex items-center gap-2"
              >
                <span>Shop Campus Merch</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        </section>

        {/* ── PROMO MARQUEE ── */}
        <PromoBar text={storeSettings.announcementText} />

        {/* ── DYNAMIC COLLECTIONS TILES ── */}
        {collections.length > 0 && (
          <section className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Featured Collections
              </h2>
              <span className="text-xs text-slate-400 font-semibold">Campus Editions</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {collections.map((col, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ delay: i * 0.05 }}
                  key={col.id} 
                  onClick={() => {
                    setActiveCategory(col.name);
                    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="relative overflow-hidden cursor-pointer group rounded-2xl shadow-xs border border-slate-200" 
                  style={{ aspectRatio: '3/4' }}
                >
                  <img
                    src={col.image}
                    alt={col.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent group-hover:from-black/95 transition-colors duration-300" />
                  <div className="absolute inset-0 flex items-end justify-start p-3 sm:p-4">
                    <div>
                      <p className="text-white font-bold text-sm sm:text-base tracking-wide mb-0.5">{col.name}</p>
                      <p className="text-amber-300 text-[11px] font-semibold group-hover:underline">
                        Explore →
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ── PINNED / TRENDING ON CAMPUS (IF ANY) ── */}
        {pinnedProducts.length > 0 && activeCategory === 'All' && !searchQuery && (
          <section className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                  <Pin className="w-4 h-4 fill-slate-950" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">🔥 Trending on Campus</h2>
                  <p className="text-xs text-slate-600">Most requested posters & merch inside college</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {pinnedProducts.map(product => (
                  <ProductCard
                    key={`pinned-${product.id}`}
                    product={product}
                    onOrderClick={setSelectedProduct}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── ALL PRODUCTS CATALOG ── */}
        <section id="products" className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Campus Catalog</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">All items guaranteed next-day delivery to your hostel.</p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-72">
              <input 
                type="text" 
                placeholder="Search posters, anime, pins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeCategory === cat 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Catalog Grid */}
          {isProductsLoading ? (
            <div className="py-20 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-semibold">Loading campus collection...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 px-6 text-center bg-white rounded-3xl border border-slate-200 border-dashed max-w-xl mx-auto my-6">
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl text-amber-600">
                📦
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">New Drops Coming Soon</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                The campus store is updating stock. Admin will add new posters shortly!
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 p-8">
              <Search className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-base font-bold text-slate-900">No items match your filter</p>
              <p className="text-xs text-slate-400 mt-1">Try another category or keyword.</p>
              <button 
                onClick={() => {setSearchQuery(""); setActiveCategory("All");}}
                className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-900 underline"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6"
            >
              <AnimatePresence>
                {filteredProducts.map(product => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
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

        {/* ── CAMPUS PROMISES ── */}
        <section className="bg-slate-950 text-white py-14 border-t border-slate-800">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 text-center">
              {[
                { icon: "⚡", title: "Next-Day Delivery", sub: "Hostel room & Dept drops" },
                { icon: "🎨", title: "Custom Prints", sub: "Print your own high-res photos" },
                { icon: "💵", title: "Easy Advance + COD", sub: "Pay balance on delivery" },
                { icon: "💬", title: "WhatsApp Alert", sub: "Instant delivery updates" },
              ].map((item, i) => (
                <div key={item.title} className="flex flex-col items-center gap-2">
                  <span className="text-2xl bg-white/10 p-3 rounded-2xl mb-1">{item.icon}</span>
                  <p className="text-xs sm:text-sm font-bold tracking-wide uppercase">{item.title}</p>
                  <p className="text-[11px] text-slate-400">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="bg-white border-t border-slate-200 py-10 text-center text-xs">
          <p className="text-slate-900 font-black text-lg mb-1">{storeSettings.storeName}</p>
          <p className="text-slate-400">Campus Merch & Print Collective • © 2026</p>
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
