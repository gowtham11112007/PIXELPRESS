import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { mockProducts as defaultProducts } from '../data/mockProducts';

const AppContext = createContext();

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

  const [products, setProducts] = useState(defaultProducts);
  
  // 2. Orders State
  const [orders, setOrders] = useState(() => {
    try {
      const savedOrders = localStorage.getItem('pixelpress_orders');
      return savedOrders ? JSON.parse(savedOrders) : [];
    } catch {
      return [];
    }
  });

  // 3. Persistent Cart State (remembered per user or guest)
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
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' | 'info' }

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  };

  // Sync user state to localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('pixelpress_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('pixelpress_user');
      }
    } catch (e) {
      console.error('Error writing user to localStorage:', e);
    }
  }, [user]);

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    try {
      const cartKey = user?.phone ? `pixelpress_cart_${user.phone}` : 'pixelpress_cart_guest';
      localStorage.setItem(cartKey, JSON.stringify(cart));
    } catch (e) {
      console.error('Error writing cart to localStorage:', e);
    }
  }, [cart, user]);

  // Sync orders to localStorage (fallback/cache)
  useEffect(() => {
    try {
      localStorage.setItem('pixelpress_orders', JSON.stringify(orders));
    } catch (e) {
      console.error('Error writing orders to localStorage:', e);
    }
  }, [orders]);

  // 1. Fetch Products from Supabase
  const fetchProducts = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setProducts(defaultProducts);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        const mapped = data.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          originalPrice: p.original_price,
          badge: p.badge,
          image: p.image_url,
          category: p.category
        }));
        setProducts(mapped);
      }
    } catch (err) {
      console.warn('Could not fetch products from Supabase, using mock products:', err.message);
      setProducts(defaultProducts);
    }
  }, []);

  // 2. Fetch Orders for currently logged-in user
  const fetchOrders = useCallback(async () => {
    if (!user || !isSupabaseConfigured || !supabase) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', user.phone)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        const mappedOrders = data.map(o => ({
          id: o.id,
          product: {
            name: o.product_name,
            price: o.product_price,
            image: o.product_image
          },
          quantity: o.quantity,
          status: o.status,
          date: o.created_at,
          notes: o.notes,
          customer_name: o.customer_name,
          customer_phone: o.customer_phone
        }));
        setOrders(mappedOrders);
      }
    } catch (err) {
      console.warn('Error fetching orders from Supabase:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial products fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Initial user orders fetch
  useEffect(() => {
    if (user && isSupabaseConfigured) {
      fetchOrders();
    }
  }, [user, fetchOrders]);

  // 3. Realtime Subscription on Orders (Live updates when seller accepts/rejects)
  useEffect(() => {
    if (!user || !isSupabaseConfigured || !supabase) return;

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
            setOrders(prev => [
              {
                id: newO.id,
                product: {
                  name: newO.product_name,
                  price: newO.product_price,
                  image: newO.product_image
                },
                quantity: newO.quantity,
                status: newO.status,
                date: newO.created_at,
                notes: newO.notes,
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

  // Mock demo timer (only active if Supabase is NOT configured)
  useEffect(() => {
    if (isSupabaseConfigured) return;

    const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Pending Payment Review');
    if (pendingOrders.length > 0) {
      const timer = setTimeout(() => {
        setOrders(currentOrders =>
          currentOrders.map((order, index) => {
            if (
              (order.status === 'Pending' || order.status === 'Pending Payment Review') &&
              index === currentOrders.findIndex(o => o.status === 'Pending' || o.status === 'Pending Payment Review')
            ) {
              return { ...order, status: 'Accepted' };
            }
            return order;
          })
        );
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [orders]);

  // Login handler: stores user profile locally and syncs to Supabase
  const login = async (name, phone) => {
    const cleanUser = { name: name.trim(), phone: phone.trim() };
    setUser(cleanUser);

    // Restore user's specific saved cart if exists
    try {
      const userCartKey = `pixelpress_cart_${cleanUser.phone}`;
      const savedUserCart = localStorage.getItem(userCartKey);
      if (savedUserCart) {
        setCart(JSON.parse(savedUserCart));
      }
    } catch (e) {
      console.error(e);
    }

    // Upsert customer into Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('customers')
          .upsert(
            {
              phone: cleanUser.phone,
              name: cleanUser.name,
              last_active: new Date().toISOString()
            },
            { onConflict: 'phone' }
          );
      } catch (err) {
        // Table might not exist yet, safe to ignore
        console.warn('Customer upsert note:', err.message);
      }
    }
  };

  const logout = () => {
    setUser(null);
  };

  // Cart actions
  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(5, item.quantity + quantity) }
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
          ? { ...item, quantity: Math.min(5, newQty) }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Place Order function (handles single product or multiple cart items)
  const placeOrder = async (product, quantity, customerInfo = null, notes = '', paymentScreenshotUrl = null) => {
    const activeUser = customerInfo || user;
    if (!activeUser || !activeUser.name || !activeUser.phone) {
      throw new Error('Customer Name and Phone Number are required to place an order.');
    }

    // Make sure user is saved in state
    if (!user && customerInfo) {
      login(customerInfo.name, customerInfo.phone);
    }

    const totalAmount = product.price * quantity;
    const initialStatus = paymentScreenshotUrl ? 'Pending Payment Review' : 'Pending';

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
              notes: notes,
              payment_screenshot_url: paymentScreenshotUrl
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
            status: initialStatus,
            date: data.created_at,
            notes,
            paymentScreenshotUrl,
            customer_name: activeUser.name,
            customer_phone: activeUser.phone
          };
          setOrders(prev => [newOrder, ...prev]);
          return newOrder;
        }
      } catch (err) {
        console.error('Error placing order in Supabase:', err);
        // Fallback to local state
        const fallbackOrder = {
          id: Math.random().toString(36).substr(2, 9),
          product,
          quantity,
          status: initialStatus,
          date: new Date().toISOString(),
          notes,
          paymentScreenshotUrl,
          customer_name: activeUser.name,
          customer_phone: activeUser.phone
        };
        setOrders(prev => [fallbackOrder, ...prev]);
        return fallbackOrder;
      }
    } else {
      // Local demo mode
      const newOrder = {
        id: Math.random().toString(36).substr(2, 9),
        product,
        quantity,
        status: initialStatus,
        date: new Date().toISOString(),
        notes,
        paymentScreenshotUrl,
        customer_name: activeUser.name,
        customer_phone: activeUser.phone
      };
      setOrders(prev => [newOrder, ...prev]);
      return newOrder;
    }
  };

  // Checkout Entire Cart at once
  const checkoutCart = async (customerInfo = null, paymentScreenshotUrl = null) => {
    const activeUser = customerInfo || user;
    if (!activeUser || !activeUser.name || !activeUser.phone) {
      throw new Error('Customer Name and Phone Number are required.');
    }
    if (cart.length === 0) return;

    for (const item of cart) {
      await placeOrder(item.product, item.quantity, activeUser, '', paymentScreenshotUrl);
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
        logout,
        products,
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
        toast,
        showToast
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
