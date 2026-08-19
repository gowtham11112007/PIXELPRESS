import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const AppContext = createContext();

const DEFAULT_STORE_SETTINGS = {
  upiId: 'pixelpress@upi',
  upiQrUrl: '',
  defaultAdvancePercent: 20,
  minAdvanceAmount: 100,
  storeName: 'PixelPress Campus',
  announcementText: '⚡ NEXT-DAY HOSTEL DELIVERY ✦ ORDER BEFORE 9 PM FOR TOMORROW DELIVERY ✦ FREE CAMPUS DELIVERY'
};

const DEFAULT_COLLECTIONS = [
  { id: 'col-1', name: 'Wall Setups', description: 'Multi-frame room aesthetic sets', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=400&h=500' },
  { id: 'col-2', name: 'Split Posters', description: '2, 3 & 4 piece split wall art', image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&q=80&w=400&h=500' },
  { id: 'col-3', name: 'Anime & Gym', description: 'High motivation workout & anime prints', image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=400&h=500' },
  { id: 'col-4', name: 'Pins & Stickers', description: 'Laminated stickers, pins & badges', image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=400&h=500' },
  { id: 'col-5', name: 'Custom Prints', description: 'Print your own photos & fan art', image: 'https://images.unsplash.com/photo-1508269720743-346d0a799015?auto=format&fit=crop&q=80&w=400&h=500' }
];

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
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState(() => {
    try {
      const saved = localStorage.getItem('pixelpress_collections');
      return saved ? JSON.parse(saved) : DEFAULT_COLLECTIONS;
    } catch {
      return DEFAULT_COLLECTIONS;
    }
  });
  const [isProductsLoading, setIsProductsLoading] = useState(true);

  // Store Settings (Dynamic UPI ID, QR Code, Advance payment %)
  const [storeSettings, setStoreSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('pixelpress_store_settings');
      return saved ? JSON.parse(saved) : DEFAULT_STORE_SETTINGS;
    } catch {
      return DEFAULT_STORE_SETTINGS;
    }
  });
  
  // 2. Orders State
  const [orders, setOrders] = useState(() => {
    try {
      const savedOrders = localStorage.getItem('pixelpress_orders');
      return savedOrders ? JSON.parse(savedOrders) : [];
    } catch {
      return [];
    }
  });

  // 3. Persistent Cart State
  const [cart, setCart] = useState(() => {
    try {
      const cartKey = user?.phone ? `pixelpress_cart_${user.phone}` : 'pixelpress_cart_guest';
      const savedCart = localStorage.getItem(cartKey);
      return savedCart ? JSON.parse(savedCart) : [];
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

  // Fetch Store Settings & Collections from database
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
        setStoreSettings({
          upiId: s.badge || DEFAULT_STORE_SETTINGS.upiId,
          upiQrUrl: s.image_url || '',
          defaultAdvancePercent: s.original_price || DEFAULT_STORE_SETTINGS.defaultAdvancePercent,
          minAdvanceAmount: s.price || DEFAULT_STORE_SETTINGS.minAdvanceAmount,
          storeName: s.name || DEFAULT_STORE_SETTINGS.storeName,
          announcementText: DEFAULT_STORE_SETTINGS.announcementText
        });
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
      console.warn('Could not fetch store settings/collections:', err.message);
    }
  }, []);

  // Listen to Supabase Auth State (Google OAuth redirect etc.)
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

  // Sync orders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pixelpress_orders', JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  // Fetch Products from Supabase (Strictly active store products)
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
      setProducts([]);
    } finally {
      setIsProductsLoading(false);
    }
  }, []);

  // Fetch Orders for currently logged-in user
  const fetchOrders = useCallback(async () => {
    if (!user || !user.phone || !isSupabaseConfigured || !supabase) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', user.phone)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        const mappedOrders = data.map(o => {
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
            product: {
              name: o.product_name,
              price: o.product_price,
              image: o.product_image
            },
            quantity: o.quantity,
            totalAmount: o.total_amount || (o.product_price * o.quantity),
            status: o.status,
            date: o.created_at,
            campusLocation: parsedNotes.campusLocation || parsedNotes.hostelOrDept || 'Campus',
            deliverySlot: parsedNotes.deliverySlot || 'Next-Day Delivery',
            notes: o.notes,
            paymentScreenshotUrl: parsedNotes.paymentScreenshotUrl || o.payment_screenshot_url,
            advanceAmount: parsedNotes.advanceAmount || null,
            customer_name: o.customer_name,
            customer_phone: o.customer_phone
          };
        });
        setOrders(mappedOrders);
      }
    } catch (err) {
      console.warn('Error fetching orders from Supabase:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    fetchProducts();
    fetchStoreSettings();
  }, [fetchProducts, fetchStoreSettings]);

  // Initial user orders fetch
  useEffect(() => {
    if (user && user.phone && isSupabaseConfigured) {
      fetchOrders();
    }
  }, [user, fetchOrders]);

  // Realtime Subscription on Products & Collections
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('public:products:customer')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          if (payload.new && (payload.new.category === '__STORE_SETTINGS__' || payload.new.category === '__COLLECTION__')) {
            fetchStoreSettings();
          } else {
            fetchProducts();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProducts, fetchStoreSettings]);

  // Realtime Subscription on Orders
  useEffect(() => {
    if (!user || !user.phone || !isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('public:orders:customer')
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
            const newO = payload.new;
            let parsedNotes = {};
            if (newO.notes) {
              try { parsedNotes = JSON.parse(newO.notes); } catch {}
            }
            setOrders(prev => [
              {
                id: newO.id,
                product: {
                  name: newO.product_name,
                  price: newO.product_price,
                  image: newO.product_image
                },
                quantity: newO.quantity,
                totalAmount: newO.total_amount,
                status: newO.status,
                date: newO.created_at,
                campusLocation: parsedNotes.campusLocation || 'Campus',
                deliverySlot: parsedNotes.deliverySlot || 'Next-Day Delivery',
                notes: newO.notes,
                paymentScreenshotUrl: parsedNotes.paymentScreenshotUrl || newO.payment_screenshot_url,
                advanceAmount: parsedNotes.advanceAmount || null,
                customer_name: newO.customer_name,
                customer_phone: newO.customer_phone
              },
              ...prev.filter(item => item.id !== newO.id)
            ]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new;
            setOrders(prev =>
              prev.map(item =>
                item.id === updated.id
                  ? {
                      ...item,
                      status: updated.status,
                      quantity: updated.quantity
                    }
                  : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(item => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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
      if (savedUserCart) {
        setCart(JSON.parse(savedUserCart));
      }
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

  // Place Order function (stores Campus Location & Delivery Slot in notes JSON)
  const placeOrder = async (
    product, 
    quantity, 
    customerInfo = null, 
    notes = '', 
    paymentScreenshotUrl = null, 
    advanceAmount = 0,
    campusLocation = 'Hostel Delivery'
  ) => {
    const activeUser = customerInfo || user;
    if (!activeUser || !activeUser.name || !activeUser.phone) {
      throw new Error('Name and Phone Number are required.');
    }

    if (!user && customerInfo) {
      login(customerInfo.name, customerInfo.phone);
    }

    const totalAmount = product.price * quantity;
    const initialStatus = paymentScreenshotUrl ? 'Pending Payment Review' : 'Pending';

    const notesPayload = JSON.stringify({
      paymentScreenshotUrl,
      advanceAmount,
      campusLocation: campusLocation || 'Hostel Delivery',
      deliverySlot: '⚡ Next-Day Campus Delivery',
      upiId: storeSettings.upiId,
      customerNote: notes
    });

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
          const newOrder = {
            id: data.id,
            product,
            quantity,
            totalAmount,
            status: initialStatus,
            date: data.created_at,
            campusLocation,
            deliverySlot: '⚡ Next-Day Campus Delivery',
            notes: notesPayload,
            paymentScreenshotUrl,
            advanceAmount,
            customer_name: activeUser.name,
            customer_phone: activeUser.phone
          };
          setOrders(prev => [newOrder, ...prev]);
          return newOrder;
        }
      } catch (err) {
        console.error('Error placing order in Supabase:', err);
        const fallbackOrder = {
          id: Math.random().toString(36).substr(2, 9),
          product,
          quantity,
          totalAmount,
          status: initialStatus,
          date: new Date().toISOString(),
          campusLocation,
          deliverySlot: '⚡ Next-Day Campus Delivery',
          notes: notesPayload,
          paymentScreenshotUrl,
          advanceAmount,
          customer_name: activeUser.name,
          customer_phone: activeUser.phone
        };
        setOrders(prev => [fallbackOrder, ...prev]);
        return fallbackOrder;
      }
    } else {
      const newOrder = {
        id: Math.random().toString(36).substr(2, 9),
        product,
        quantity,
        totalAmount,
        status: initialStatus,
        date: new Date().toISOString(),
        campusLocation,
        deliverySlot: '⚡ Next-Day Campus Delivery',
        notes: notesPayload,
        paymentScreenshotUrl,
        advanceAmount,
        customer_name: activeUser.name,
        customer_phone: activeUser.phone
      };
      setOrders(prev => [newOrder, ...prev]);
      return newOrder;
    }
  };

  // Checkout Entire Cart
  const checkoutCart = async (customerInfo = null, paymentScreenshotUrl = null, calculatedAdvance = 0, campusLocation = '') => {
    const activeUser = customerInfo || user;
    if (!activeUser || !activeUser.name || !activeUser.phone) {
      throw new Error('Name and Phone Number are required.');
    }
    if (cart.length === 0) return;

    for (const item of cart) {
      await placeOrder(item.product, item.quantity, activeUser, '', paymentScreenshotUrl, calculatedAdvance, campusLocation);
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
        orders,
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
