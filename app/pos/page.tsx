"use client";

import { useEffect, useState } from "react";
import ProductGrid from "../components/ProductGrid";
import Cart from "../components/Cart";
import PaymentBar from "../components/PaymentBar";
import { useDeviceMode } from "../hooks/useDeviceMode";

export default function POSPage() {
  const mode = useDeviceMode();
  const [search, setSearch] = useState("");

  // ================= ROLE + AUTH GUARD =================
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || !role) {
      window.location.href = "/login";
      return;
    }

    if (role !== "owner" && role !== "kasir") {
      window.location.href = "/login";
    }
  }, []);

  // ================= LOGOUT =================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  return (
    <div className="relative h-screen flex flex-col md:flex-row bg-stone-100 select-none">
      
      {/* 🔥 LOGOUT BUTTON */}
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition z-50"
      >
        Logout
      </button>

      {/* ⚠ Warning jika layar terlalu kecil */}
      {mode === "mobile" && (
        <div className="bg-yellow-200 text-yellow-900 text-center p-2 text-sm">
          Untuk pengalaman terbaik gunakan tablet 📟
        </div>
      )}

      {/* 🛒 PRODUCT AREA */}
      <div className="flex-1 p-4 overflow-auto">

        {/* 🔍 SEARCH */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="🔍 Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border rounded-xl px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <ProductGrid search={search} />
      </div>

      {/* 🧾 CART AREA */}
      <div className="w-full md:w-96 bg-white border-t md:border-t-0 md:border-l p-4 flex flex-col shadow-lg">
        <Cart />
        <PaymentBar />
      </div>
    </div>
  );
}