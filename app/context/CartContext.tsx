"use client";

import { createContext, useContext, useState } from "react";

type CartItem = {
  product_id: number;
  name: string;
  price: number;
  qty: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (product_id: number) => void;
  clear: () => void;
  total: number;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const found = prev.find((i) => i.product_id === item.product_id);
      if (found) {
        return prev.map((i) =>
          i.product_id === item.product_id
            ? { ...i, qty: i.qty + 1 }
            : i
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeItem = (product_id: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.product_id === product_id
            ? { ...i, qty: i.qty - 1 }
            : i
        )
        .filter((i) => i.qty > 0)
    );
  };

  const clear = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clear, total }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext)!;