import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const SellerContext = createContext();

export const useSeller = () => useContext(SellerContext);

const DUMMY_PRODUCTS = [
  { id: '1', name: 'Vintage College Hoodie', price: 45, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: '2', name: 'Classic Logo Tee', price: 20, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: '3', name: 'Campus Coffee Mug', price: 15, image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: '4', name: 'Minimalist Poster', price: 25, image: 'https://images.unsplash.com/photo-1580136608260-4ebf15fab1e3?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: '5', name: 'Embroidered Cap', price: 22, image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=200&h=200' },
];

const INITIAL_ORDERS = [
  {
    id: 'ord-101',
    customerName: 'Alex Johnson',
    customerPhone: '+1 (555) 123-4567',
    productName: 'Vintage College Hoodie',
    productImage: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=200&h=200',
    quantity: 1,
    status: 'Pending',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'ord-100',
    customerName: 'Sarah Smith',
    customerPhone: '+1 (555) 987-6543',
    productName: 'Campus Coffee Mug',
    productImage: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=200&h=200',
    quantity: 2,
    status: 'Accepted',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  }
];

export const SellerProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('seller_user');
    return saved ? JSON.parse(saved) : { name: 'Seller', phone: '' };
  });

  const [products, setProducts] = useState(DUMMY_PRODUCTS);
  const [orders, setOrders] = useState(INITIAL_ORDERS);

  useEffect(() => {
    localStorage.setItem('seller_user', JSON.stringify(user));
  }, [user]);

  const fetchProducts = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setProducts(data.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.image_url,
        })));
      }
    } catch (err) {
      console.warn('Error fetching products from Supabase:', err.message);
    }
  };

  const fetchOrders = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setOrders(data.map(o => ({
          id: o.id,
          customerName: o.customer_name,
          customerPhone: o.customer_phone,
          productName: o.product_name,
          productImage: o.product_image,
          quantity: o.quantity,
          status: o.status,
          timestamp: o.created_at,
          paymentScreenshotUrl: o.payment_screenshot_url,
        })));
      }
    } catch (err) {
      console.warn('Error fetching orders from Supabase:', err.message);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const savedProducts = localStorage.getItem('seller_products');
      if (savedProducts) setProducts(JSON.parse(savedProducts));
      
      const savedOrders = localStorage.getItem('seller_orders');
      if (savedOrders) setOrders(JSON.parse(savedOrders));
      return;
    }

    fetchProducts();
    fetchOrders();

    const orderChannel = supabase
      .channel('public:orders:seller')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const o = payload.new;
            setOrders(prev => [{
              id: o.id,
              customerName: o.customer_name,
              customerPhone: o.customer_phone,
              productName: o.product_name,
              productImage: o.product_image,
              quantity: o.quantity,
              status: o.status,
              timestamp: o.created_at,
              paymentScreenshotUrl: o.payment_screenshot_url,
            }, ...prev]);
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
  }, []);

  // Sync to local storage only if not using Supabase (for fallback)
  useEffect(() => {
    if (!isSupabaseConfigured) {
      localStorage.setItem('seller_products', JSON.stringify(products));
      localStorage.setItem('seller_orders', JSON.stringify(orders));
    }
  }, [products, orders]);

  const login = (name, phone) => setUser({ name, phone });
  const logout = () => setUser(null);

  const addProduct = async (product) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .insert([{
            name: product.name,
            price: product.price,
            image_url: product.image,
            is_active: true
          }])
          .select()
          .single();
          
        if (error) throw error;
        
        setProducts(prev => [{
          id: data.id,
          name: data.name,
          price: data.price,
          image: data.image_url,
        }, ...prev]);
        showToast('Product added successfully!');
      } catch (err) {
        console.error('Error adding product to Supabase:', err);
        showToast('Failed to add product.', 'error');
      }
    } else {
      const newProduct = { ...product, id: Date.now().toString() };
      setProducts((prev) => [newProduct, ...prev]);
      showToast('Product added locally (demo mode)');
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
        showToast('Failed to remove product.', 'error');
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

  const simulateNewOrder = () => {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    if (!randomProduct) return;
    const newOrder = {
      id: `ord-${Date.now()}`,
      customerName: 'Demo Customer',
      customerPhone: '+1 (555) 000-0000',
      productName: randomProduct.name,
      productImage: randomProduct.image,
      quantity: Math.floor(Math.random() * 3) + 1,
      status: 'Pending Payment Review',
      paymentScreenshotUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400&h=600',
      timestamp: new Date().toISOString(),
    };
    setOrders((prev) => [newOrder, ...prev]);
  };

  const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;
  
  const acceptedTodayCount = orders.filter(o => {
    if (o.status !== 'Accepted') return false;
    const orderDate = new Date(o.timestamp);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  }).length;

  const [toast, setToast] = useState(null);
  
  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <SellerContext.Provider
      value={{
        user,
        products,
        orders,
        login,
        logout,
        addProduct,
        deleteProduct,
        updateOrderStatus,
        simulateNewOrder,
        pendingOrdersCount,
        acceptedTodayCount,
        toast,
        showToast,
      }}
    >
      {children}
    </SellerContext.Provider>
  );
};
