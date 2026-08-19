import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const SellerContext = createContext();

export const useSeller = () => useContext(SellerContext);

const DEFAULT_STORE_SETTINGS = {
  upiId: 'pixelpress@upi',
  upiQrUrl: '',
  defaultAdvancePercent: 20,
  minAdvanceAmount: 100,
  storeName: 'PixelPress Campus',
  announcementText: '⚡ NEXT-DAY HOSTEL DELIVERY ✦ ORDER BEFORE 9 PM FOR TOMORROW DELIVERY ✦ FREE CAMPUS DELIVERY',
  cutoffTime: '21:00', // 9 PM cutoff for next-day delivery
  campusLocations: ['Hostel Block A', 'Hostel Block B', 'Hostel Block C', 'Girls Hostel 1', 'Girls Hostel 2', 'Mechanical Dept', 'CSE Dept', 'Main Canteen Pickup']
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
    
    // Check if pinned
    if (parts.includes('pinned')) {
      isPinned = true;
    }

    // Check advance
    const advPart = parts.find(part => part.startsWith('adv:'));
    if (advPart) {
      const [, type, val] = advPart.split(':');
      advanceType = type || 'default';
      advanceValue = Number(val) || 0;
    }

    // Clean remaining badge text for display
    badge = parts.filter(part => !part.startsWith('adv:') && part !== 'pinned').join('|');
  }

  return {
    id: p.id,
    name: p.name,
    price: p.price,
    originalPrice: p.original_price,
    badge: badge || null,
    image: p.image_url,
    category: p.category || 'Wall Setups',
    isPinned,
    isInStock: p.is_active !== false,
    advanceType: p.advance_type || advanceType,
    advanceValue: p.advance_value || advanceValue,
    createdAt: p.created_at
  };
}

export const SellerProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('seller_user');
    return saved ? JSON.parse(saved) : { name: 'Campus Admin', phone: '+91 9876543210' };
  });

  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState(() => {
    try {
      const saved = localStorage.getItem('seller_collections');
      return saved ? JSON.parse(saved) : DEFAULT_COLLECTIONS;
    } catch {
      return DEFAULT_COLLECTIONS;
    }
  });

  const [orders, setOrders] = useState([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  
  const [storeSettings, setStoreSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('seller_store_settings');
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
    localStorage.setItem('seller_store_settings', JSON.stringify(storeSettings));
  }, [storeSettings]);

  useEffect(() => {
    localStorage.setItem('seller_collections', JSON.stringify(collections));
  }, [collections]);

  // Fetch Store Settings & Collections from Supabase
  const fetchStoreSettings = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      // 1. Settings
      const { data: sData } = await supabase
        .from('products')
        .select('*')
        .eq('category', '__STORE_SETTINGS__')
        .limit(1);

      if (sData && sData.length > 0) {
        const s = sData[0];
        setStoreSettings(prev => ({
          ...prev,
          upiId: s.badge || DEFAULT_STORE_SETTINGS.upiId,
          upiQrUrl: s.image_url || '',
          defaultAdvancePercent: s.original_price || DEFAULT_STORE_SETTINGS.defaultAdvancePercent,
          minAdvanceAmount: s.price || DEFAULT_STORE_SETTINGS.minAdvanceAmount,
          storeName: s.name || DEFAULT_STORE_SETTINGS.storeName,
        }));
      }

      // 2. Collections
      const { data: cData } = await supabase
        .from('products')
        .select('*')
        .eq('category', '__COLLECTION__')
        .order('created_at', { ascending: true });

      if (cData && cData.length > 0) {
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
  }, []);

  // Update Store Settings
  const updateStoreSettings = async (newSettings) => {
    const merged = { ...storeSettings, ...newSettings };
    setStoreSettings(merged);

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

        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('category', '__STORE_SETTINGS__')
          .limit(1);

        if (existing && existing.length > 0) {
          await supabase
            .from('products')
            .update(settingsPayload)
            .eq('id', existing[0].id);
        } else {
          await supabase
            .from('products')
            .insert([settingsPayload]);
        }

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
    const newCol = {
      name: collection.name.trim(),
      category: '__COLLECTION__',
      badge: collection.description || '',
      image_url: collection.image,
      is_active: false
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .insert([newCol])
          .select()
          .single();

        if (error) throw error;
        setCollections(prev => [...prev, {
          id: data.id,
          name: data.name,
          description: data.badge || '',
          image: data.image_url
        }]);
        showToast('Collection created!');
      } catch (err) {
        console.error(err);
        showToast('Failed to create collection.', 'error');
      }
    } else {
      const local = { ...collection, id: `col-${Date.now()}` };
      setCollections(prev => [...prev, local]);
      showToast('Collection created locally');
    }
  };

  const updateCollection = async (id, updated) => {
    setCollections(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));

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
    }
  };

  const deleteCollection = async (id) => {
    setCollections(prev => prev.filter(c => c.id !== id));
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('products').delete().eq('id', id);
        showToast('Collection removed!');
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Products Management
  const fetchProducts = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setIsProductsLoading(false);
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
    } finally {
      setIsProductsLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setOrders(data.map(o => {
          let parsedNotes = {};
          if (o.notes) {
            try {
              parsedNotes = typeof o.notes === 'string' ? JSON.parse(o.notes) : o.notes;
            } catch {
              parsedNotes = { rawNotes: o.notes };
            }
          }
          return {
            id: o.id,
            customerName: o.customer_name,
            customerPhone: o.customer_phone,
            productName: o.product_name,
            productImage: o.product_image,
            productPrice: o.product_price,
            quantity: o.quantity,
            totalAmount: o.total_amount || (o.product_price * o.quantity),
            status: o.status,
            timestamp: o.created_at,
            campusLocation: parsedNotes.campusLocation || parsedNotes.hostelOrDept || 'Campus',
            deliverySlot: parsedNotes.deliverySlot || 'Next-Day Delivery',
            paymentScreenshotUrl: parsedNotes.paymentScreenshotUrl || o.payment_screenshot_url,
            advanceAmount: parsedNotes.advanceAmount || null,
            customerNote: parsedNotes.customerNote || o.notes
          };
        }));
      }
    } catch (err) {
      console.warn('Error fetching orders from Supabase:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchStoreSettings();

    if (!isSupabaseConfigured || !supabase) return;

    const orderChannel = supabase
      .channel('public:orders:seller')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const o = payload.new;
            let parsedNotes = {};
            if (o.notes) {
              try { parsedNotes = JSON.parse(o.notes); } catch {}
            }
            setOrders(prev => [{
              id: o.id,
              customerName: o.customer_name,
              customerPhone: o.customer_phone,
              productName: o.product_name,
              productImage: o.product_image,
              productPrice: o.product_price,
              quantity: o.quantity,
              totalAmount: o.total_amount || (o.product_price * o.quantity),
              status: o.status,
              timestamp: o.created_at,
              campusLocation: parsedNotes.campusLocation || parsedNotes.hostelOrDept || 'Campus',
              deliverySlot: parsedNotes.deliverySlot || 'Next-Day Delivery',
              paymentScreenshotUrl: parsedNotes.paymentScreenshotUrl || o.payment_screenshot_url,
              advanceAmount: parsedNotes.advanceAmount || null,
              customerNote: parsedNotes.customerNote || o.notes
            }, ...prev.filter(item => item.id !== o.id)]);
            showToast(`New Campus Order from ${o.customer_name} (${parsedNotes.campusLocation || 'Campus'})!`, 'info');
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new;
            setOrders(prev => prev.map(order => 
              order.id === updated.id ? { ...order, status: updated.status, quantity: updated.quantity } : order
            ));
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(order => order.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
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
        
        setProducts(prev => [parseProductMetadata(data), ...prev]);
        showToast('Item published to campus store!');
        return data;
      } catch (err) {
        console.error('Error adding product to Supabase:', err);
        showToast('Failed to add product.', 'error');
        throw err;
      }
    } else {
      const newProduct = { ...product, id: Date.now().toString(), isInStock: true };
      setProducts((prev) => [newProduct, ...prev]);
      showToast('Item added locally');
      return newProduct;
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

    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updated, badge: updated.badge || null, isPinned: Boolean(updated.isPinned) } : p));

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
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
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        showToast('Product updated successfully!');
      } catch (err) {
        console.error('Error updating product:', err);
        showToast('Failed to update product', 'error');
      }
    }
  };

  // Toggle Pin Status (Feature at top of store)
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
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('products')
          .delete()
          .eq('id', id);
          
        setProducts((prev) => prev.filter(p => p.id !== id));
        showToast('Item deleted from store!');
      } catch (err) {
        console.error('Error deleting product from Supabase:', err);
        showToast('Failed to remove product.', 'error');
      }
    } else {
      setProducts((prev) => prev.filter(p => p.id !== id));
      showToast('Item removed locally');
    }
  };

  // Order status update (Next-day delivery workflow)
  const updateOrderStatus = async (orderId, newStatus) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ status: newStatus })
          .eq('id', orderId);
          
        if (error) throw error;
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
      } catch (err) {
        console.error('Error updating order in Supabase:', err);
      }
    } else {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
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
