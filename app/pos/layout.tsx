"use client";

import { CartProvider } from "../context/CartContext";

export default function POSLayout({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}