import { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const localData = localStorage.getItem('cartItems');
    return localData ? JSON.parse(localData) : [];
  });

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, qty = 1, size = null) => {
    setCartItems(prevItems => {
      const existItem = prevItems.find(x => x.product === product._id && x.size === size);
      if (existItem) {
        return prevItems.map(x =>
          (x.product === existItem.product && x.size === existItem.size) ? { ...existItem, qty: existItem.qty + qty } : x
        );
      } else {
        return [...prevItems, { 
          product: product._id, 
          name: product.name, 
          image: product.images[0], 
          price: product.price,
          discountPrice: product.discountPrice > 0 ? product.discountPrice : null,
          shippingCharge: product.shippingCharge || 0,
          stock: product.stock,
          size,
          qty 
        }];
      }
    });
  };

  const updateQty = (id, size, qty) => {
    setCartItems(prevItems =>
      prevItems.map(item => (item.product === id && item.size === size ? { ...item, qty } : item))
    );
  };

  const removeFromCart = (id, size) => {
    setCartItems(prevItems => prevItems.filter(item => !(item.product === id && item.size === size)));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((acc, item) => acc + item.qty * (item.discountPrice || item.price), 0);
  const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const cartShipping = cartItems.reduce((acc, item) => acc + (item.shippingCharge || 0) * item.qty, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, updateQty, removeFromCart, clearCart, cartTotal, cartCount, cartShipping }}>
      {children}
    </CartContext.Provider>
  );
};
