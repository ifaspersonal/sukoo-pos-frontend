"use client";

import ProductGrid from "../components/ProductGrid";
import Cart from "../components/Cart";
import PaymentBar from "../components/PaymentBar";

export default function POSPage() {
  return (
    <div className="h-screen grid grid-cols-3">
      {/* Produk */}
      <div className="col-span-2 bg-stone-100 p-4">
        <ProductGrid />
      </div>

      {/* Cart */}
      <div className="bg-white p-4 border-l flex flex-col">
        <Cart />
        <PaymentBar />
      </div>
    </div>
  );
}