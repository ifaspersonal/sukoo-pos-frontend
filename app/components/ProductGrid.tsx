"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";

export default function ProductGrid({ search = "" }: { search?: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const { addItem } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products");
        setProducts(res.data);
      } catch (err) {
        console.error("Failed to load products", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const values = products
      .map((product) => product.category)
      .filter(Boolean);
    return ["all", ...Array.from(new Set(values))];
  }, [products]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory =
      category === "all" || product.category === category;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-[22px] bg-white/70"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {categories.map((value) => (
          <button
            key={value}
            onClick={() => setCategory(value)}
            className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold capitalize transition ${
              category === value
                ? "bg-[#173f2d] text-white shadow-sm"
                : "border border-[#ddd8cc] bg-white/75 text-[#626862]"
            }`}
          >
            {value === "all" ? "Semua" : value}
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-[24px] border border-dashed border-[#d7d1c4] bg-white/40 px-6 text-center">
          <span className="text-3xl">☕</span>
          <p className="mt-3 font-semibold">Produk tidak ditemukan</p>
          <p className="mt-1 text-sm text-[#7a7f7b]">
            Coba kata kunci atau kategori yang lain.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const outOfStock =
              !product.is_unlimited && product.stock <= 0;

            return (
              <button
                key={product.id}
                disabled={outOfStock}
                onClick={() =>
                  addItem({
                    product_id: product.id,
                    name: product.name,
                    price: product.price,
                    qty: 1,
                  })
                }
                className={`group relative flex min-h-36 flex-col justify-between overflow-hidden rounded-[22px] border p-4 text-left transition active:scale-[.97] ${
                  outOfStock
                    ? "cursor-not-allowed border-[#ddd8cc] bg-[#e7e3da] text-[#9b9d98]"
                    : "border-white/80 bg-[#fffdf8] shadow-[0_10px_30px_rgba(47,55,49,.07)] hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(47,55,49,.11)]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-full bg-[#ede8dc] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#7b6048]">
                    {product.category || "menu"}
                  </span>
                  {!outOfStock && (
                    <span className="flex size-7 items-center justify-center rounded-full bg-[#173f2d] text-lg leading-none text-white transition group-hover:rotate-90">
                      +
                    </span>
                  )}
                </div>

                <div className="mt-5">
                  <div className="line-clamp-2 font-semibold leading-snug text-[#263129]">
                    {product.name}
                  </div>
                  <div className="mt-1.5 text-base font-bold text-[#173f2d]">
                    Rp {product.price.toLocaleString("id-ID")}
                  </div>
                  {!product.is_unlimited && (
                    <div
                      className={`mt-2 text-xs font-medium ${
                        outOfStock
                          ? "text-red-600"
                          : product.stock <= 5
                          ? "text-amber-700"
                          : "text-[#7a7f7b]"
                      }`}
                    >
                      {outOfStock
                        ? "Stok habis"
                        : `${product.stock} tersisa`}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
