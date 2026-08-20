import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { mockProducts } from '../data/mockProducts';

const AppContext = createContext();

const DEFAULT_STORE_SETTINGS = {
  upiId: 'pixelpress@upi',
  upiQrUrl: '',
  defaultAdvancePercent: 20,
  minAdvanceAmount: 100,
  storeName: 'PixelPress Campus',
  announcementText: 'Fast 24-hour delivery • Premium quality prints',
  isTemporarilyClosed: false,
  closedReason: 'Temporarily closed for maintenance.'
};

const DEFAULT_COLLECTIONS = [
  { id: 'col-1', name: 'Wall Setups', description: 'Multi-frame room aesthetic sets', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=400&h=500' },
  { id: 'col-2', name: 'Split Posters', description: '2, 3 & 4 piece split wall art', image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&q=80&w=400&h=500' },
  { id: 'col-3', name: 'Anime & Gym', description: 'High motivation workout & anime prints', image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=400&h=500' },
  { id: 'col-4', name: 'Pins & Stickers', description: 'Laminated stickers, pins & badges', image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=400&h=500' },
  { id: 'col-5', name: 'Custom Prints', description: 'Print your own photos & fan art', image: 'https://images.unsplash.com/photo-1508269720743-346d0a799015?auto=format&fit=crop&q=80&w=400&h=500' }
];

// Helper: normalize order structure
function normalizeCustomerOrder(o) {
  let parsedNotes = {};
  if (o.notes) {
    try {
      parsedNotes = typeof o.notes === 'string' ? JSON.parse(o.notes) : o.notes;
    } catch {
      parsedNotes = { rawNotes: o.notes };
    }
  }

  const productName = o.product?.name || o.product_name || o.productName || 'Poster Set';
  const productPrice = o.product?.price ?? o.product_price ?? o.productPrice ?? 0;
  const productImage = o.product?.image || o.product_image || o.productImage || '';
  const customerName = o.customer_name || o.customerName || 'Student';
  const customerPhone = o.customer_phone || o.customerPhone || '';
  const quantity = Number(o.quantity) || 1;
  const totalAmount = o.total_amount ?? o.totalAmount ?? (productPrice * quantity);

  return {
    id: o.id,
    product: {
      name: productName,
      price: productPrice,
      image: productImage
    },
    productName,
    productImage,
    productPrice,
    quantity,
    totalAmount,
    status: o.status || 'Pending',
    date: o.created_at || o.date || o.timestamp || new Date().toISOString(),
    timestamp: o.created_at || o.date || o.timestamp || new Date().toISOString(),
    campusLocation: o.campusLocation || parsedNotes.campusLocation || parsedNotes.locationOrDept || 'Campus Delivery',
    deliverySlot: o.deliverySlot || parsedNotes.deliverySlot || 'Next-Day Campus Delivery',
    notes: o.notes,
    paymentScreenshotUrl: o.paymentScreenshotUrl || parsedNotes.paymentScreenshotUrl || o.payment_screenshot_url || null,
    advanceAmount: o.advanceAmount ?? parsedNotes.advanceAmount ?? null,
    customer_name: customerName,
    customer_phone: customerPhone,
    customerName,
    customerPhone
  };
}

export function AppProvider({ children }) {
  // 1. User State (persisted in localStorage + synced to Supabase)
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('pixelpress_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [supabaseUser, setSupabaseUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Products & Collections
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('pixelpress_products');
      const parsed = saved ? JSON.parse(saved) : mockProducts;
      return Array.isArray(parsed) ? parsed : mockProducts;
    } catch {
      return mockProducts;
    }
  });

  // 1. Collections State
  const [collections, setCollections] = useState(() => {
    try {
      const saved = localStorage.getItem('pixelpress_collections');
      const parsed = saved ? JSON.parse(saved) : DEFAULT_COLLECTIONS;
      return Array.isArray(parsed) ? parsed : DEFAULT_COLLECTIONS;
    } catch {
      return DEFAULT_COLLECTIONS;
    }
  });

  const [isProductsLoading, setIsProductsLoading] = useState(true);

  // 3. Store Settings State
  const [storeSettings, setStoreSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('pixelpress_store_settings');
      const parsed = saved ? JSON.parse(saved) : DEFAULT_STORE_SETTINGS;
      return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : DEFAULT_STORE_SETTINGS;
    } catch {
      return DEFAULT_STORE_SETTINGS;
    }
  });
  
  // 2. Orders State
  const [orders, setOrders] = useState(() => {
    try {
      const savedOrders = localStorage.getItem('pixelpress_orders');
      if (!savedOrders) return [];
      const parsed = JSON.parse(savedOrders);
      return Array.isArray(parsed) ? parsed.map(normalizeCustomerOrder) : [];
    } catch {
      return [];
    }
  });

  // 3. Persistent Cart State
  const [cart, setCart] = useState(() => {
    try {
      const cartKey = user?.phone ? `pixelpress_cart_${user.phone}` : 'pixelpress_cart_guest';
      const savedCart = localStorage.getItem(cartKey);
      const parsed = savedCart ? JSON.parse(savedCart) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 4. Global Toast State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  };

  // Sync state to unified localStorage keys
  useEffect(() => {
    try {
      localStorage.setItem('pixelpress_store_settings', JSON.stringify(storeSettings));
    } catch (e) {
      console.error(e);
    }
  }, [storeSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('pixelpress_collections', JSON.stringify(collections));
    } catch (e) {
      console.error(e);
    }
  }, [collections]);

  useEffect(() => {
    try {
      localStorage.setItem('pixelpress_products', JSON.stringify(products));
    } catch (e) {
      console.error(e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('pixelpress_orders', JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  // Fetch Store Settings & Collections from database / localStorage
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
          
          setStoreSettings({
            upiId: s.badge || DEFAULT_STORE_SETTINGS.upiId,
            upiQrUrl: s.image_url || '',
            defaultAdvancePercent: s.original_price || DEFAULT_STORE_SETTINGS.defaultAdvancePercent,
            minAdvanceAmount: s.price || DEFAULT_STORE_SETTINGS.minAdvanceAmount,
            storeName: (s.name && s.name !== "__STORE_SETTINGS__" && s.name !== "PIXELPRESS Settings") ? s.name : DEFAULT_STORE_SETTINGS.storeName,
            announcementText: p.name || DEFAULT_STORE_SETTINGS.announcementText,
            isTemporarilyClosed: s.is_pinned !== undefined ? Boolean(s.is_pinned) : false,
            closedReason: p.description || 'Temporarily closed for maintenance.'
          });
        }

        // 2. Collections
        const { data: cData } = await supabase
          .from('products')
          .select('*')
          .eq('category', '__COLLECTION__')
          .order('created_at', { ascending: true });

        // Update collections accurately even if empty array
        if (cData) {
          setCollections(cData.map(c => ({
            id: c.id,
            name: c.name,
            description: c.badge || '',
            image: c.image_url
          })));
        }
      } catch (err) {
        console.warn('Could not fetch store settings/collections:', err.message);
      }
    } else {
      // Offline / local fallback
      try {
        const savedSettings = localStorage.getItem('pixelpress_store_settings');
        if (savedSettings) setStoreSettings(JSON.parse(savedSettings));

        const savedCollections = localStorage.getItem('pixelpress_collections');
        if (savedCollections) setCollections(JSON.parse(savedCollections));
      } catch (e) {
        console.warn('Local storage settings load error:', e);
      }
    }
  }, []);

  // Fetch Products from Supabase or localStorage
  const fetchProducts = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      try {
        const saved = localStorage.getItem('pixelpress_products');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProducts(parsed.filter(p => p.isInStock !== false && p.is_active !== false));
            setIsProductsLoading(false);
            return;
          }
        }
        setProducts(mockProducts);
      } catch {
        setProducts(mockProducts);
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
        .eq('is_active', true)
        .neq('category', '__STORE_SETTINGS__')
        .neq('category', '__PROMO_SETTINGS__')
        .neq('category', '__COLLECTION__')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        const mapped = data.map(p => {
          let badge = p.badge || '';
          let isPinned = false;
          let advanceType = 'default';
          let advanceValue = 0;

          if (badge) {
            const parts = badge.split('|');
            if (parts.includes('pinned')) isPinned = true;
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
            originalPrice: p.original_price,
            badge: badge || null,
            image: p.image_url,
            category: p.category || 'Wall Setups',
            isPinned,
            advanceType: p.advance_type || advanceType,
            advanceValue: p.advance_value || advanceValue
          };
        });
        setProducts(mapped);
      }
    } catch (err) {
      console.warn('Error fetching products:', err.message);
      try {
        const saved = localStorage.getItem('pixelpress_products');
        setProducts(saved ? JSON.parse(saved) : mockProducts);
      } catch {
        setProducts(mockProducts);
      }
    } finally {
      setIsProductsLoading(false);
    }
  }, []);

  // Fetch Orders for currently logged-in user
  const fetchOrders = useCallback(async () => {
    if (!user || !user.phone) {
      setOrders([]);
      return;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_phone', user.phone)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          setOrders(data.map(normalizeCustomerOrder));
        }
      } catch (err) {
        console.warn('Error fetching orders from Supabase:', err.message);
        try {
          const saved = localStorage.getItem('pixelpress_orders');
          if (saved) {
            const parsed = JSON.parse(saved);
            setOrders(parsed.filter(o => o.customer_phone === user.phone || o.customerPhone === user.phone).map(normalizeCustomerOrder));
          }
        } catch {}
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const saved = localStorage.getItem('pixelpress_orders');
        if (saved) {
          const parsed = JSON.parse(saved);
          setOrders(parsed.filter(o => o.customer_phone === user.phone || o.customerPhone === user.phone).map(normalizeCustomerOrder));
        }
      } catch {}
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    fetchProducts();
    fetchStoreSettings();
  }, [fetchProducts, fetchStoreSettings]);

  // Initial user orders fetch
  useEffect(() => {
    if (user && user.phone) {
      fetchOrders();
    }
  }, [user, fetchOrders]);

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
      console.warn('BroadcastChannel error:', err);
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

  // Realtime Supabase Subscription on Products & Collections
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('public:products:customer_app')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchStoreSettings();
          fetchProducts();
        }
      )
      .subscribe();
      
    // BULLETPROOF FALLBACK: Poll every 15 seconds in case WebSockets/Realtime are disabled in Supabase dashboard
    const fallbackInterval = setInterval(() => {
      fetchStoreSettings();
      fetchProducts();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(fallbackInterval);
    };
  }, [fetchProducts, fetchStoreSettings]);

  // Realtime Supabase Subscription on Orders
  useEffect(() => {
    if (!user || !user.phone || !isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('public:orders:customer_app')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `customer_phone=eq.${user.phone}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newO = normalizeCustomerOrder(payload.new);
            setOrders(prev => [newO, ...prev.filter(item => item.id !== newO.id)]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = normalizeCustomerOrder(payload.new);
            setOrders(prev =>
              prev.map(item => item.id === updated.id ? { ...item, ...updated } : item)
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(item => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const fallbackInterval = setInterval(() => {
      if (user?.phone) {
        fetchOrders();
      }
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(fallbackInterval);
    };
  }, [user, fetchOrders]);

  // Listen to Supabase Auth State
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        setUser(prevUser => {
          if (prevUser && prevUser.phone) {
            return {
              ...prevUser,
              email: session.user.email || prevUser.email,
              avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || prevUser.avatar,
              id: session.user.id
            };
          }
          return {
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Student',
            phone: session.user.phone || '',
            email: session.user.email || '',
            avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null,
            id: session.user.id
          };
        });
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        setUser(prev => ({
          name: prev?.name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Student',
          phone: prev?.phone || session.user.phone || '',
          email: session.user.email || prev?.email || '',
          avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || prev?.avatar || null,
          id: session.user.id
        }));
      } else {
        setSupabaseUser(null);
      }
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sync user state to localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('pixelpress_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('pixelpress_user');
      }
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      const cartKey = user?.phone ? `pixelpress_cart_${user.phone}` : 'pixelpress_cart_guest';
      localStorage.setItem(cartKey, JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart, user]);

  // Login handler
  const login = async (name, phone, additionalInfo = {}) => {
    const cleanUser = {
      name: name.trim(),
      phone: phone.trim(),
      email: additionalInfo.email || supabaseUser?.email || user?.email || '',
      avatar: additionalInfo.avatar || supabaseUser?.user_metadata?.avatar_url || user?.avatar || null,
      id: additionalInfo.id || supabaseUser?.id || user?.id || null
    };
    setUser(cleanUser);

    try {
      const userCartKey = `pixelpress_cart_${cleanUser.phone}`;
      const savedUserCart = localStorage.getItem(userCartKey);
      const guestCartString = localStorage.getItem('pixelpress_cart_guest');
      
      let mergedCart = [];
      if (savedUserCart) {
        const parsed = JSON.parse(savedUserCart);
        if (Array.isArray(parsed)) mergedCart = parsed;
      }
      
      if (guestCartString) {
        try {
          const guestCart = JSON.parse(guestCartString);
          if (Array.isArray(guestCart)) {
            guestCart.forEach(gItem => {
              const existing = mergedCart.find(mItem => mItem.product?.id === gItem.product?.id);
              if (existing) {
                 existing.quantity = Math.min(10, existing.quantity + gItem.quantity);
              } else {
                 mergedCart.push(gItem);
              }
            });
          }
          localStorage.removeItem('pixelpress_cart_guest');
        } catch(e){}
      }
      setCart(mergedCart);
    } catch (e) {
      console.error(e);
    }
  };

  const loginWithGoogle = async () => {
    if (!isSupabaseConfigured || !supabase) {
      showToast('Google login requires active cloud connection', 'info');
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Google login error:', err);
      showToast(err.message || 'Google login failed', 'error');
    }
  };

  const logout = async () => {
    setUser(null);
    setSupabaseUser(null);
    try {
      localStorage.removeItem('pixelpress_user');
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Logout error:', err.message);
    }
  };

  // Cart actions
  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(10, item.quantity + quantity) }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(10, newQty) }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Place Order function
  const placeOrder = async (
    product, 
    quantity, 
    customerInfo = null, 
    notes = '', 
    paymentScreenshotUrl = null, 
    advanceAmount = 0,
    campusLocation = 'Campus Delivery'
  ) => {
    const activeUser = customerInfo || user;
    if (!activeUser || !activeUser.name || !activeUser.phone) {
      throw new Error('Name and Phone Number are required.');
    }

    if (!user && customerInfo) {
      await login(customerInfo.name, customerInfo.phone);
    }

    const totalAmount = product.price * quantity;
    const initialStatus = paymentScreenshotUrl ? 'Pending Payment Review' : 'Pending';

    const notesPayload = JSON.stringify({
      paymentScreenshotUrl,
      advanceAmount,
      campusLocation: campusLocation || 'Campus Delivery',
      deliverySlot: 'Next-Day Campus Delivery',
      upiId: storeSettings.upiId,
      customerNote: notes
    });

    let newOrder;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .insert([
            {
              customer_name: activeUser.name,
              customer_phone: activeUser.phone,
              product_name: product.name,
              product_image: product.image,
              product_price: product.price,
              quantity: quantity,
              total_amount: totalAmount,
              status: initialStatus,
              notes: notesPayload
            }
          ])
          .select()
          .single();

        if (error) throw error;

        if (data) {
          newOrder = normalizeCustomerOrder(data);
        }
      } catch (err) {
        console.error('Error placing order in Supabase:', err);
        newOrder = normalizeCustomerOrder({
          id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          product,
          quantity,
          total_amount: totalAmount,
          status: initialStatus,
          created_at: new Date().toISOString(),
          campusLocation,
          notes: notesPayload,
          paymentScreenshotUrl,
          advanceAmount,
          customer_name: activeUser.name,
          customer_phone: activeUser.phone
        });
      }
    } else {
      newOrder = normalizeCustomerOrder({
        id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        product,
        quantity,
        total_amount: totalAmount,
        status: initialStatus,
        created_at: new Date().toISOString(),
        campusLocation,
        notes: notesPayload,
        paymentScreenshotUrl,
        advanceAmount,
        customer_name: activeUser.name,
        customer_phone: activeUser.phone
      });
    }

    // Save into local orders state & localStorage for all orders
    setOrders(prev => [newOrder, ...prev]);

    // Save into global orders storage so Seller can see it in offline / shared mode
    try {
      const allOrders = JSON.parse(localStorage.getItem('pixelpress_orders') || '[]');
      const updatedOrders = [newOrder, ...allOrders.filter(o => o.id !== newOrder.id)];
      localStorage.setItem('pixelpress_orders', JSON.stringify(updatedOrders));

      // Broadcast order event
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('pixelpress_sync_channel');
        bc.postMessage({ type: 'ORDERS_CHANGED' });
        bc.close();
      }
    } catch (e) {
      console.error('Error syncing order locally:', e);
    }

    return newOrder;
  };

  // Checkout Entire Cart
  const checkoutCart = async (customerInfo = null, paymentScreenshotUrl = null, totalAdvancePaid = 0, campusLocation = '') => {
    const activeUser = customerInfo || user;
    if (!activeUser || !activeUser.name || !activeUser.phone) {
      throw new Error('Name and Phone Number are required.');
    }
    if (cart.length === 0) return;

    for (const item of cart) {
      const p = item.product;
      const itemTotal = p.price * item.quantity;
      let itemAdvance = 0;
      
      if (p.advanceType === 'fixed') {
        itemAdvance = Math.min(itemTotal, (Number(p.advanceValue) || 0) * item.quantity);
      } else if (p.advanceType === 'percentage') {
        itemAdvance = Math.min(itemTotal, Math.round(itemTotal * ((Number(p.advanceValue) || 0) / 100)));
      } else if (p.advanceType === 'zero') {
        itemAdvance = 0;
      } else {
        const pct = Number(storeSettings?.defaultAdvancePercent) || 20;
        itemAdvance = Math.round(itemTotal * (pct / 100));
      }
      
      // We pass the true per-item advance, but if there was a minimum advance bump, 
      // the first item will just absorb the extra, or we just trust the per-item.
      // To be safe and simple, we'll just pass the calculated itemAdvance.
      await placeOrder(item.product, item.quantity, activeUser, '', paymentScreenshotUrl, itemAdvance, campusLocation);
    }
    clearCart();
  };

  const clearOrders = () => {
    setOrders([]);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        loginWithGoogle,
        logout,
        products,
        collections,
        isProductsLoading,
        orders: orders.filter(o => !hiddenOrderIds.includes(o.id)),
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        loading,
        placeOrder,
        checkoutCart,
        clearOrders,
        fetchProducts,
        fetchOrders,
        isSupabaseConfigured,
        supabase,
        supabaseUser,
        authLoading,
        toast,
        showToast,
        storeSettings
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
