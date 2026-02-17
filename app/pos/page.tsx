"use client";

import ProductGrid from "../components/ProductGrid";
import Cart from "../components/Cart";
import PaymentBar from "../components/PaymentBar";
import { useDeviceMode } from "../hooks/useDeviceMode";

export default function POSPage() {
  const mode = useDeviceMode();

  return (
    <div className="h-screen flex flex-col md:flex-row bg-stone-100 select-none">
      
      {/* ⚠ Warning jika layar terlalu kecil */}
      {mode === "mobile" && (
        <div className="bg-yellow-200 text-yellow-900 text-center p-2 text-sm">
          Untuk pengalaman terbaik gunakan tablet 📟
        </div>
      )}

      {/* 🛒 PRODUCT AREA */}
      <div className="flex-1 p-4 overflow-auto">
        <ProductGrid />
      </div>

      {/* 🧾 CART AREA */}
      <div className="w-full md:w-96 bg-white border-t md:border-t-0 md:border-l p-4 flex flex-col shadow-lg">
        <Cart />
        <PaymentBar />
      </div>
    </div>
  );
}