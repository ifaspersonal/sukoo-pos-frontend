"use client";

import { useEffect, useState } from "react";
import ProductGrid from "../components/ProductGrid";
import Cart from "../components/Cart";
import PaymentBar from "../components/PaymentBar";
import MaterialOpnamePanel from "../components/MaterialOpnamePanel";
import {
  CartIcon,
  CloseIcon,
  LogOutIcon,
  SearchIcon,
} from "../components/Icons";
import { useCart } from "../context/CartContext";
import SukooLogo from "../components/SukooLogo";

export default function POSPage() {
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [opnameOpen, setOpnameOpen] = useState(false);
  const { total, itemCount } = useCart();

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  return (
    <main className="h-[100dvh] overflow-hidden bg-[#f4f1ea] text-[#1f2922]">
      <div className="flex h-full">
        <section className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-[#ddd8cc] bg-[#fffdf8]/90 px-4 py-3 backdrop-blur-md sm:px-6">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-24 shrink-0 items-center rounded-xl bg-[#173f2d] px-2.5">
                  <SukooLogo light className="w-full" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-base font-bold tracking-tight">
                    Sukoo Coffee
                  </div>
                  <div className="text-xs text-[#7a7f7b]">Point of Sale</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpnameOpen(true)}
                  className="min-h-10 rounded-full border border-[#d9c6a7] bg-[#fff7e8] px-3 text-sm font-semibold text-[#8a642c] transition hover:bg-[#f4ead5]"
                >
                  <span className="hidden sm:inline">Opname bahan</span>
                  <span className="sm:hidden">Opname</span>
                </button>
                <button
                  aria-label="Keluar"
                  onClick={handleLogout}
                  className="flex min-h-10 items-center gap-2 rounded-full border border-[#ded8cc] bg-white px-3 text-sm font-semibold text-[#5e655f] transition hover:bg-[#f4f1ea]"
                >
                  <LogOutIcon className="size-4" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-auto px-4 pb-28 pt-5 sm:px-6 lg:pb-6">
            <div className="mx-auto max-w-7xl">
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#92775e]">
                  Daftar menu
                </p>
                <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                      Mau pesan apa hari ini?
                    </h1>
                    <p className="mt-1 text-sm text-[#777c77]">
                      Ketuk menu untuk menambahkannya ke pesanan.
                    </p>
                  </div>

                  <label className="relative block w-full sm:max-w-xs">
                    <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#858a85]" />
                    <input
                      type="search"
                      placeholder="Cari menu..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="field pl-11 pr-4 text-sm shadow-sm"
                    />
                  </label>
                </div>
              </div>

              <ProductGrid search={search} />
            </div>
          </div>
        </section>

        <aside className="hidden w-[390px] shrink-0 flex-col border-l border-[#ddd8cc] bg-[#fffdf8] p-5 shadow-[-14px_0_40px_rgba(47,55,49,.05)] lg:flex">
          <Cart />
          <PaymentBar />
        </aside>
      </div>

      <button
        onClick={() => setCartOpen(true)}
        className="safe-bottom fixed inset-x-3 bottom-0 z-30 flex min-h-16 items-center justify-between rounded-t-[22px] bg-[#173f2d] px-5 pt-3 text-white shadow-[0_-12px_35px_rgba(26,49,35,.2)] lg:hidden"
      >
        <span className="flex items-center gap-3">
          <span className="relative flex size-10 items-center justify-center rounded-full bg-white/10">
            <CartIcon className="size-5" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#d9b37d] text-[10px] font-bold text-[#173f2d]">
                {itemCount}
              </span>
            )}
          </span>
          <span className="text-left">
            <span className="block text-xs text-white/65">Lihat pesanan</span>
            <span className="block font-semibold">{itemCount} item</span>
          </span>
        </span>
        <span className="font-bold">
          Rp {total.toLocaleString("id-ID")}
        </span>
      </button>

      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-[#17241d]/45 backdrop-blur-[2px] lg:hidden">
          <button
            aria-label="Tutup keranjang"
            className="absolute inset-0"
            onClick={() => setCartOpen(false)}
          />
          <aside className="safe-bottom absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-[28px] bg-[#fffdf8] p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-center">
              <span className="h-1.5 w-12 rounded-full bg-[#d9d3c7]" />
            </div>
            <button
              aria-label="Tutup keranjang"
              onClick={() => setCartOpen(false)}
              className="absolute right-5 top-5 flex size-10 items-center justify-center rounded-full bg-[#f0ece3]"
            >
              <CloseIcon className="size-5" />
            </button>
            <Cart />
            <PaymentBar />
          </aside>
        </div>
      )}

      <MaterialOpnamePanel open={opnameOpen} onClose={() => setOpnameOpen(false)} />
    </main>
  );
}
