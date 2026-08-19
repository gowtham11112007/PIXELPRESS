import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { mockProducts } from '../data/mockProducts';

const SellerContext = createContext();

export const useSeller = () => useContext(SellerContext);

const DEFAULT_STORE_SETTINGS = {
  upiId: 'pixelpress@upi',
  upiQrUrl: '',
  defaultAdvancePercent: 20,
  minAdvanceAmount: 100,
  storeName: 'PixelPress Campus',
  announcementText: '⚡ LIGHTNING FAST 24-HOUR DELIVERY ✦ 300+ DPI ULTRA-HD PRINTS ✦ PREMIUM QUALITY GUARANTEED ✦ FREE FAST DELIVERY',
  cutoffTime: '21:00', // 9 PM cutoff for next-day delivery
  campusLocations: ['Block A', 'Block B', 'Block C', 'Building 1', 'Building 2', 'Mechanical Dept', 'CSE Dept', 'Main Canteen Pickup']
};

const DEFAULT_COLLECTIONS = [
  { id: 'col-1', name: 'Wall Setups', description: 'Multi-frame room aesthetic sets', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=400&h=500' },
  { id: 'col-2', name: 'Split Posters', description: '2, 3 & 4 piece split wall art', image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&q=80&w=400&h=500' },
  { id: 'col-3', name: 'Anime & Gym', description: 'High motivation workout & anime prints', image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=400&h=500' },
  { id: 'col-4', name: 'Pins & Stickers', description: 'Laminated stickers, pins & badges', image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=400&h=500' },
  { id: 'col-5', name: 'Custom Prints', description: 'Print your own photos & fan art', image: 'https://images.unsplash.com/photo-1508269720743-346d0a799015?auto=format&fit=crop&q=80&w=400&h=500' }
];

// Helper: parse product metadata safely
export function parseProductMetadata(p) {
  let badge = p.badge || '';
  let advanceType = 'default';
  let advanceValue = 0;
  let isPinned = false;

  if (badge) {
    const parts = badge.split('|');
    if (parts.includes('pinned')) {
      isPinned = true;
    }

    const advPart = parts.find(part => part.startsWith('adv:'));
    if (advPart) {
      const [, type, val] = advPart.split(':');
      advanceType = type || 'default';
      advanceValue = Number(val) || 0;
    }

    badge = parts.filter(part => !part.startsWith('adv:') && part !== 'pinned').join('|');
  }

  return {
    id: p.id,
    name: p.name,
    price: p.price,
    originalPrice: p.original_price ?? p.originalPrice ?? null,
    badge: badge || null,
    image: p.image_url || p.image,
    category: p.category || 'Wall Setups',
    isPinned: Boolean(p.isPinned || isPinned),
    isInStock: p.is_active !== false && p.isInStock !== false,
    advanceType: p.advance_type || p.advanceType || advanceType,
    advanceValue: p.advance_value || p.advanceValue || advanceValue,
    createdAt: p.created_at || p.createdAt || new Date().toISOString()
  };
}

// Helper: normalize order structure for Seller
function normalizeSellerOrder(o) {
  let parsedNotes = {};
  if (o.notes) {
    try {
      parsedNotes = typeof o.notes === 'string' ? JSON.parse(o.notes) : o.notes;
    } catch {
      parsedNotes = { rawNotes: o.notes };
    }
  }

  const productName = o.productName || o.product_name || o.product?.name || 'Poster Set';
  const productImage = o.productImage || o.product_image || o.product?.image || '';
  const productPrice = o.productPrice ?? o.product_price ?? o.product?.price ?? 0;
  const quantity = Number(o.quantity) || 1;
  const totalAmount = o.totalAmount ?? o.total_amount ?? (productPrice * quantity);
  const customerName = o.customerName || o.customer_name || 'Student';
  const customerPhone = o.customerPhone || o.customer_phone || '';

  return {
    id: o.id,
    customerName,
    customerPhone,
    productName,
    productImage,
    productPrice,
    quantity,
    totalAmount,
    status: o.status || 'Pending',
    timestamp: o.created_at || o.timestamp || o.date || new Date().toISOString(),
    campusLocation: o.campusLocation || parsedNotes.campusLocation || parsedNotes.locationOrDept || 'Campus Delivery',
    deliverySlot: o.deliverySlot || parsedNotes.deliverySlot || 'Next-Day Delivery',
    paymentScreenshotUrl: o.paymentScreenshotUrl || parsedNotes.paymentScreenshotUrl || o.payment_screenshot_url || null,
    advanceAmount: o.advanceAmount ?? parsedNotes.advanceAmount ?? null,
    customerNote: parsedNotes.customerNote || o.customerNote || o.notes || ''
  };
}

function broadcastSync(type) {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('pixelpress_sync_channel');
      bc.postMessage({ type });
      bc.close();
    }
  } catch (e) {
    console.warn('Broadcast sync error:', e);
  }
}

export const SellerProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('seller_user');
    return saved ? JSON.parse(saved) : { name: 'Campus Admin', phone: '+91 9876543210' };
  });

  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('pixelpress_products');
      return saved ? JSON.parse(saved).map(parseProductMetadata) : mockProducts.map(parseProductMetadata);
    } catch {
      return mockProducts.map(parseProductMetadata);
    }
  });

  const [collections, setCollections] = useState(() => {
    try {
      const saved = localStorage.getItem('pixelpress_collections');
      return saved ? JSON.parse(saved) : DEFAULT_COLLECTIONS;
    } catch {
      return DEFAULT_COLLECTIONS;
    }
  });

  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('pixelpress_orders');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.map(normalizeSellerOrder) : [];
    } catch {
      return [];
    }
  });

  const [isProductsLoading, setIsProductsLoading] = useState(true);
  
  const [storeSettings, setStoreSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('pixelpress_store_settings');
      return saved ? JSON.parse(saved) : DEFAULT_STORE_SETTINGS;
    } catch {
      return DEFAULT_STORE_SETTINGS;
    }
  });

  const [toast, setToast] = useState(null);
  
  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    localStorage.setItem('seller_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('pixelpress_store_settings', JSON.stringify(storeSettings));
  }, [storeSettings]);

  useEffect(() => {
    localStorage.setItem('pixelpress_collections', JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    localStorage.setItem('pixelpress_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('pixelpress_orders', JSON.stringify(orders));
  }, [orders]);

  // Fetch Store Settings & Collections from Supabase or localStorage
  const fetchStoreSettings = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Settings
        const { data: sData } = await supabase
          .from('products')
          .select('*')
          .in('category', ['__STORE_SETTINGS__', '__PROMO_SETTINGS__']);

        if (sData) {
          const s = sData.find(d => d.category === '__STORE_SETTINGS__') || {};
          const p = sData.find(d => d.category === '__PROMO_SETTINGS__') || {};
          
          setStoreSettings(prev => ({
            ...prev,
            upiId: s.badge || DEFAULT_STORE_SETTINGS.upiId,
            upiQrUrl: s.image_url || '',
            defaultAdvancePercent: s.original_price || DEFAULT_STORE_SETTINGS.defaultAdvancePercent,
            minAdvanceAmount: s.price || DEFAULT_STORE_SETTINGS.minAdvanceAmount,
            storeName: s.name || DEFAULT_STORE_SETTINGS.storeName,
            announcementText: p.name || DEFAULT_STORE_SETTINGS.announcementText
          }));
        }

        // 2. Collections
        const { data: cData } = await supabase
          .from('products')
          .select('*')
          .eq('category', '__COLLECTION__')
          .order('created_at', { ascending: true });

        if (cData) {
          setCollections(cData.map(c => ({
            id: c.id,
            name: c.name,
            description: c.badge || '',
            image: c.image_url
          })));
        }
      } catch (err) {
        console.warn('Error fetching settings/collections in seller:', err.message);
      }
    } else {
      try {
        const savedSettings = localStorage.getItem('pixelpress_store_settings');
        if (savedSettings) setStoreSettings(JSON.parse(savedSettings));

        const savedCollections = localStorage.getItem('pixelpress_collections');
        if (savedCollections) setCollections(JSON.parse(savedCollections));
      } catch (e) {
        console.warn(e);
      }
    }
  }, []);

  // Update Store Settings
  const updateStoreSettings = async (newSettings) => {
    const merged = { ...storeSettings, ...newSettings };
    setStoreSettings(merged);
    localStorage.setItem('pixelpress_store_settings', JSON.stringify(merged));
    broadcastSync('SETTINGS_CHANGED');

    if (isSupabaseConfigured && supabase) {
      try {
        const settingsPayload = {
          name: merged.storeName || 'PixelPress Campus',
          category: '__STORE_SETTINGS__',
          badge: merged.upiId || 'pixelpress@upi',
          image_url: merged.upiQrUrl || '',
          original_price: Number(merged.defaultAdvancePercent) || 20,
          price: Number(merged.minAdvanceAmount) || 100,
          is_active: false
        };

        const promoPayload = {
          name: merged.announcementText || DEFAULT_STORE_SETTINGS.announcementText,
          category: '__PROMO_SETTINGS__',
          price: 0,
          is_active: false
        };

        const { data: existing } = await supabase
          .from('products')
          .select('id, category')
          .in('category', ['__STORE_SETTINGS__', '__PROMO_SETTINGS__']);

        const existingSettingsId = existing?.find(e => e.category === '__STORE_SETTINGS__')?.id;
        const existingPromoId = existing?.find(e => e.category === '__PROMO_SETTINGS__')?.id;

        const upserts = [];
        if (existingSettingsId) {
          upserts.push(supabase.from('products').update(settingsPayload).eq('id', existingSettingsId));
        } else {
          upserts.push(supabase.from('products').insert([settingsPayload]));
        }

        if (existingPromoId) {
          upserts.push(supabase.from('products').update(promoPayload).eq('id', existingPromoId));
        } else {
          upserts.push(supabase.from('products').insert([promoPayload]));
        }

        await Promise.all(upserts);

        showToast('Store & delivery settings updated!');
      } catch (err) {
        console.error('Error saving store settings:', err);
        showToast('Failed to save settings to cloud.', 'error');
      }
    } else {
      showToast('Settings saved locally');
    }
  };

  // Collections Management Methods
  const addCollection = async (collection) => {
    const newColId = `col-${Date.now()}`;
    const newCol = {
      id: newColId,
      name: collection.name.trim(),
      description: collection.description?.trim() || '',
      image: collection.image
    };

    setCollections(prev => {
      const updated = [...prev, newCol];
      localStorage.setItem('pixelpress_collections', JSON.stringify(updated));
      return updated;
    });
    broadcastSync('COLLECTIONS_CHANGED');

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .insert([{
            name: newCol.name,
            category: '__COLLECTION__',
            badge: newCol.description,
            image_url: newCol.image,
            is_active: false,
            price: 0
          }])
          .select()
          .single();

        if (error) throw error;
        
        // Update collection id with supabase generated id
        setCollections(prev => {
          const synced = prev.map(c => c.id === newColId ? { ...c, id: data.id } : c);
          localStorage.setItem('pixelpress_collections', JSON.stringify(synced));
          return synced;
        });
        showToast('Collection created & published!');
      } catch (err) {
        console.error(err);
        showToast('Failed to sync collection to cloud.', 'error');
      }
    } else {
      showToast('Collection created locally');
    }
  };

  const updateCollection = async (id, updated) => {
    setCollections(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...updated } : c);
      localStorage.setItem('pixelpress_collections', JSON.stringify(next));
      return next;
    });
    broadcastSync('COLLECTIONS_CHANGED');

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('products')
          .update({
            name: updated.name,
            badge: updated.description || '',
            image_url: updated.image
          })
          .eq('id', id);
        showToast('Collection updated!');
      } catch (err) {
        console.error(err);
      }
    } else {
      showToast('Collection updated locally');
    }
  };

  const deleteCollection = async (id) => {
    setCollections(prev => {
      const filtered = prev.filter(c => c.id !== id);
      localStorage.setItem('pixelpress_collections', JSON.stringify(filtered));
      return filtered;
    });
    broadcastSync('COLLECTIONS_CHANGED');

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('products').delete().eq('id', id);
        showToast('Collection removed from store!');
      } catch (err) {
        console.error(err);
      }
    } else {
      showToast('Collection removed locally');
    }
  };

  // Products Management
  const fetchProducts = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      try {
        const saved = localStorage.getItem('pixelpress_products');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProducts(parsed.map(parseProductMetadata));
            setIsProductsLoading(false);
            return;
          }
        }
        setProducts(mockProducts.map(parseProductMetadata));
      } catch {
        setProducts(mockProducts.map(parseProductMetadata));
      } finally {
        setIsProductsLoading(false);
      }
      return;
    }

    try {
      setIsProductsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .neq('category', '__STORE_SETTINGS__')
        .neq('category', '__COLLECTION__')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setProducts(data.map(p => parseProductMetadata(p)));
      }
    } catch (err) {
      console.warn('Error fetching products from Supabase:', err.message);
      try {
        const saved = localStorage.getItem('pixelpress_products');
        setProducts(saved ? JSON.parse(saved).map(parseProductMetadata) : mockProducts.map(parseProductMetadata));
      } catch {
        setProducts(mockProducts.map(parseProductMetadata));
      }
    } finally {
      setIsProductsLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          setOrders(data.map(normalizeSellerOrder));
        }
      } catch (err) {
        console.warn('Error fetching orders in seller:', err.message);
        try {
          const saved = localStorage.getItem('pixelpress_orders');
          if (saved) setOrders(JSON.parse(saved).map(normalizeSellerOrder));
        } catch {}
      }
    } else {
      try {
        const saved = localStorage.getItem('pixelpress_orders');
        if (saved) setOrders(JSON.parse(saved).map(normalizeSellerOrder));
      } catch {}
    }
  }, []);

  // Cross-Tab Broadcast Channel Sync
  useEffect(() => {
    let channel = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('pixelpress_sync_channel');
        channel.onmessage = (event) => {
          const { type } = event.data || {};
          if (type === 'COLLECTIONS_CHANGED' || type === 'SETTINGS_CHANGED' || type === 'REFRESH_ALL') {
            fetchStoreSettings();
          }
          if (type === 'PRODUCTS_CHANGED' || type === 'REFRESH_ALL') {
            fetchProducts();
          }
          if (type === 'ORDERS_CHANGED' || type === 'REFRESH_ALL') {
            fetchOrders();
          }
        };
      }
    } catch (err) {
      console.warn('BroadcastChannel error in seller:', err);
    }

    const handleStorageChange = (e) => {
      if (e.key === 'pixelpress_collections' || e.key === 'pixelpress_store_settings') {
        fetchStoreSettings();
      } else if (e.key === 'pixelpress_products') {
        fetchProducts();
      } else if (e.key === 'pixelpress_orders') {
        fetchOrders();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchStoreSettings, fetchProducts, fetchOrders]);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchStoreSettings();

    if (!isSupabaseConfigured || !supabase) return;

    // Realtime Orders
    const orderChannel = supabase
      .channel('public:orders:seller_app')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const o = normalizeSellerOrder(payload.new);
            setOrders(prev => [o, ...prev.filter(item => item.id !== o.id)]);
            showToast(`New Campus Order from ${o.customerName} (${o.campusLocation})!`, 'info');
          } else if (payload.eventType === 'UPDATE') {
            const updated = normalizeSellerOrder(payload.new);
            setOrders(prev => prev.map(order => order.id === updated.id ? { ...order, ...updated } : order));
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(order => order.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Realtime Products & Collections
    const productChannel = supabase
      .channel('public:products:seller_app')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchProducts();
          fetchStoreSettings();
        }
      )
      .subscribe();

    const fallbackInterval = setInterval(() => {
      fetchProducts();
      fetchOrders();
      fetchStoreSettings();
    }, 15000);

    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(productChannel);
      clearInterval(fallbackInterval);
    };
  }, [fetchProducts, fetchOrders, fetchStoreSettings]);

  const login = (name, phone) => setUser({ name, phone });
  const logout = () => setUser(null);

  // Add Product
  const addProduct = async (product) => {
    let badgeString = product.badge || '';
    if (product.isPinned) {
      badgeString = badgeString ? `${badgeString}|pinned` : 'pinned';
    }
    if (product.advanceType && product.advanceType !== 'default') {
      badgeString = badgeString ? `${badgeString}|adv:${product.advanceType}:${product.advanceValue || 0}` : `adv:${product.advanceType}:${product.advanceValue || 0}`;
    }

    const newProd = {
      id: Date.now().toString(),
      name: product.name.trim(),
      price: Number(product.price),
      originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
      badge: product.badge || null,
      image: product.image,
      category: product.category || 'Wall Setups',
      isPinned: Boolean(product.isPinned),
      isInStock: true,
      advanceType: product.advanceType || 'default',
      advanceValue: Number(product.advanceValue) || 0
    };

    setProducts(prev => {
      const updated = [newProd, ...prev];
      localStorage.setItem('pixelpress_products', JSON.stringify(updated));
      return updated;
    });
    broadcastSync('PRODUCTS_CHANGED');

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .insert([{
            name: product.name,
            price: Number(product.price),
            original_price: product.originalPrice ? Number(product.originalPrice) : null,
            badge: badgeString || null,
            image_url: product.image,
            category: product.category || 'Wall Setups',
            is_active: true
          }])
          .select()
          .single();
          
        if (error) throw error;
        
        const parsed = parseProductMetadata(data);
        setProducts(prev => {
          const synced = prev.map(p => p.id === newProd.id ? parsed : p);
          localStorage.setItem('pixelpress_products', JSON.stringify(synced));
          return synced;
        });
        showToast('Item published to campus store!');
        return data;
      } catch (err) {
        console.error('Error adding product to Supabase:', err);
        showToast('Saved locally.', 'info');
        return newProd;
      }
    } else {
      showToast('Item added locally');
      return newProd;
    }
  };

  // Edit / Update Product
  const updateProduct = async (id, updated) => {
    let badgeString = updated.badge || '';
    if (updated.isPinned) {
      badgeString = badgeString ? `${badgeString}|pinned` : 'pinned';
    }
    if (updated.advanceType && updated.advanceType !== 'default') {
      badgeString = badgeString ? `${badgeString}|adv:${updated.advanceType}:${updated.advanceValue || 0}` : `adv:${updated.advanceType}:${updated.advanceValue || 0}`;
    }

    setProducts(prev => {
      const next = prev.map(p => p.id === id ? { 
        ...p, 
        ...updated, 
        price: Number(updated.price) || p.price,
        originalPrice: updated.originalPrice ? Number(updated.originalPrice) : null,
        badge: updated.badge || null, 
        isPinned: Boolean(updated.isPinned),
        isInStock: updated.isInStock !== false 
      } : p);
      localStorage.setItem('pixelpress_products', JSON.stringify(next));
      return next;
    });
    broadcastSync('PRODUCTS_CHANGED');

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('products')
          .update({
            name: updated.name,
            price: Number(updated.price),
            original_price: updated.originalPrice ? Number(updated.originalPrice) : null,
            badge: badgeString || null,
            image_url: updated.image,
            category: updated.category || 'Wall Setups',
            is_active: updated.isInStock !== false
          })
          .eq('id', id);

        if (error) throw error;
        showToast('Product updated successfully!');
      } catch (err) {
        console.error('Error updating product:', err);
        showToast('Failed to update on cloud.', 'error');
      }
    } else {
      showToast('Product updated locally');
    }
  };

  // Toggle Pin Status
  const togglePinProduct = async (id) => {
    const target = products.find(p => p.id === id);
    if (!target) return;
    const newPinned = !target.isPinned;
    await updateProduct(id, { ...target, isPinned: newPinned });
    showToast(newPinned ? 'Item pinned to top of store!' : 'Item unpinned');
  };

  // Toggle Stock Status
  const toggleStockProduct = async (id) => {
    const target = products.find(p => p.id === id);
    if (!target) return;
    const newStock = !target.isInStock;
    await updateProduct(id, { ...target, isInStock: newStock });
    showToast(newStock ? 'Marked In Stock' : 'Marked Out of Stock');
  };

  const deleteProduct = async (id) => {
    setProducts((prev) => {
      const filtered = prev.filter(p => p.id !== id);
      localStorage.setItem('pixelpress_products', JSON.stringify(filtered));
      return filtered;
    });
    broadcastSync('PRODUCTS_CHANGED');

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('products')
          .delete()
          .eq('id', id);
          
        showToast('Item deleted from store!');
      } catch (err) {
        console.error('Error deleting product from Supabase:', err);
      }
    } else {
      showToast('Item removed locally');
    }
  };

  // Order status update
  const updateOrderStatus = async (orderId, newStatus, extraUpdates = {}) => {
    setOrders((prev) => {
      const updated = prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus, ...extraUpdates } : order
      );
      localStorage.setItem('pixelpress_orders', JSON.stringify(updated));
      return updated;
    });
    broadcastSync('ORDERS_CHANGED');

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = { status: newStatus };
        if (extraUpdates.notes) payload.notes = extraUpdates.notes;
        
        const { error } = await supabase
          .from('orders')
          .update(payload)
          .eq('id', orderId);
          
        if (error) throw error;
      } catch (err) {
        console.error('Error updating order in Supabase:', err);
      }
    }
  };

  const pendingOrdersCount = orders.filter(o => o.status === 'Pending' || o.status === 'Pending Payment Review').length;
  
  const acceptedTodayCount = orders.filter(o => {
    if (o.status !== 'Accepted' && o.status !== 'Printing' && o.status !== 'Out for Delivery' && o.status !== 'Delivered') return false;
    const orderDate = new Date(o.timestamp);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  }).length;

  return (
    <SellerContext.Provider
      value={{
        user,
        products,
        isProductsLoading,
        collections,
        orders,
        login,
        logout,
        addProduct,
        updateProduct,
        togglePinProduct,
        toggleStockProduct,
        deleteProduct,
        addCollection,
        updateCollection,
        deleteCollection,
        updateOrderStatus,
        pendingOrdersCount,
        acceptedTodayCount,
        toast,
        showToast,
        storeSettings,
        updateStoreSettings,
        fetchProducts,
        fetchOrders,
        fetchStoreSettings
      }}
    >
      {children}
    </SellerContext.Provider>
  );
};
