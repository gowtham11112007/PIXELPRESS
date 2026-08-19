import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const SellerContext = createContext();

export const useSeller = () => useContext(SellerContext);

const DEFAULT_STORE_SETTINGS = {
  upiId: 'pixelpress@upi',
  upiQrUrl: '',
  defaultAdvancePercent: 20,
  minAdvanceAmount: 100,
  storeName: 'PIXELPRESS',
  announcementText: '✦ FREE DELIVERY FOR PREPAID ORDERS ✦ SPLIT POSTERS ✦ CUSTOM PRINTS'
};

// Helper: encode and decode custom advance options within product badge safely
export function parseProductMetadata(p) {
  let badge = p.badge || '';
  let advanceType = 'default';
  let advanceValue = 0;

  if (badge && badge.includes('adv:')) {
    const parts = badge.split('|');
    const advPart = parts.find(part => part.startsWith('adv:'));
    if (advPart) {
      const [, type, val] = advPart.split(':');
      advanceType = type || 'default';
      advanceValue = Number(val) || 0;
    }
    badge = parts.filter(part => !part.startsWith('adv:')).join('|');
  }

  return {
    id: p.id,
    name: p.name,
    price: p.price,
    originalPrice: p.original_price,
    badge: badge || null,
    image: p.image_url,
    category: p.category || 'Wall Setups',
    advanceType: p.advance_type || advanceType,
    advanceValue: p.advance_value || advanceValue
  };
}

export const SellerProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('seller_user');
    return saved ? JSON.parse(saved) : { name: 'Admin Seller', phone: '+91 9876543210' };
  });

  const [products, setProducts] = useState([]);
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

  // Fetch Store Settings
  const fetchStoreSettings = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', '__STORE_SETTINGS__')
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        const s = data[0];
        setStoreSettings({
          upiId: s.badge || DEFAULT_STORE_SETTINGS.upiId,
          upiQrUrl: s.image_url || '',
          defaultAdvancePercent: s.original_price || DEFAULT_STORE_SETTINGS.defaultAdvancePercent,
          minAdvanceAmount: s.price || DEFAULT_STORE_SETTINGS.minAdvanceAmount,
          storeName: s.name || DEFAULT_STORE_SETTINGS.storeName,
          announcementText: DEFAULT_STORE_SETTINGS.announcementText
        });
      }
    } catch (err) {
      console.warn('Error fetching settings in seller:', err.message);
    }
  }, []);

  // Update Store Settings
  const updateStoreSettings = async (newSettings) => {
    const merged = { ...storeSettings, ...newSettings };
    setStoreSettings(merged);

    if (isSupabaseConfigured && supabase) {
      try {
        const settingsPayload = {
          name: merged.storeName || 'PIXELPRESS',
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

        showToast('Store settings updated and synced!');
      } catch (err) {
        console.error('Error saving store settings:', err);
        showToast('Failed to save settings to cloud.', 'error');
      }
    } else {
      showToast('Settings saved locally');
    }
  };

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
        .eq('is_active', true)
        .neq('category', '__STORE_SETTINGS__')
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
              paymentScreenshotUrl: parsedNotes.paymentScreenshotUrl || o.payment_screenshot_url,
              advanceAmount: parsedNotes.advanceAmount || null,
              customerNote: parsedNotes.customerNote || o.notes
            }, ...prev.filter(item => item.id !== o.id)]);
            showToast(`New incoming order from ${o.customer_name}!`, 'info');
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

  const addProduct = async (product) => {
    // Construct badge with embedded advance settings if not default
    let badgeString = product.badge || '';
    if (product.advanceType && product.advanceType !== 'default') {
      badgeString = badgeString ? `${badgeString}|adv:${product.advanceType}:${product.advanceValue || 0}` : `adv:${product.advanceType}:${product.advanceValue || 0}`;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .insert([{
            name: product.name.trim(),
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
        
        const newProd = parseProductMetadata(data);
        setProducts(prev => [newProd, ...prev]);
        showToast('Product added successfully!');
        return newProd;
      } catch (err) {
        console.error('Error adding product to Supabase:', err);
        showToast(err.message || 'Failed to add product.', 'error');
        throw err;
      }
    } else {
      const newProduct = { ...product, id: Date.now().toString() };
      setProducts((prev) => [newProduct, ...prev]);
      showToast('Product added locally (demo mode)');
      return newProduct;
    }
  };

  const deleteProduct = async (id) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('products')
          .update({ is_active: false })
          .eq('id', id);
          
        if (error) throw error;
        setProducts((prev) => prev.filter(p => p.id !== id));
        showToast('Product removed!');
      } catch (err) {
        console.error('Error deleting product from Supabase:', err);
        showToast(err.message || 'Failed to remove product.', 'error');
      }
    } else {
      setProducts((prev) => prev.filter(p => p.id !== id));
      showToast('Product removed locally');
    }
  };

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
    if (o.status !== 'Accepted') return false;
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
        orders,
        login,
        logout,
        addProduct,
        deleteProduct,
        updateOrderStatus,
        pendingOrdersCount,
        acceptedTodayCount,
        toast,
        showToast,
        storeSettings,
        updateStoreSettings,
        fetchProducts,
        fetchOrders
      }}
    >
      {children}
    </SellerContext.Provider>
  );
};
