"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";

export default function ProductGrid() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-black">
        Loading products...
      </div>
    );
  }

  return (
    <div className="
      grid 
      grid-cols-2 
      md:grid-cols-3 
      xl:grid-cols-4 
      gap-4
    ">
      {products.map((p) => {
        const outOfStock = !p.is_unlimited && p.stock <= 0;

        return (
          <button
            key={p.id}
            disabled={outOfStock}
            onClick={() =>
              addItem({
                product_id: p.id,
                name: p.name,
                price: p.price,
                qty: 1,
              })
            }
            className={`
              rounded-2xl
              p-5
              text-left
              shadow-md
              transition
              active:scale-95
              min-h-[120px]
              flex
              flex-col
              justify-between
              ${
                outOfStock
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-stone-50 text-black"
              }
            `}
          >
            {/* Product Name */}
            <div className="font-semibold text-lg truncate">
              {p.name}
            </div>

            {/* Price */}
            <div className="text-xl font-bold">
              Rp {p.price.toLocaleString()}
            </div>

            {/* Stock Info */}
            {!p.is_unlimited && (
              <div
                className={`text-sm mt-2 ${
                  outOfStock
                    ? "text-red-500"
                    : p.stock <= 5
                    ? "text-orange-500"
                    : "text-black"
                }`}
              >
                {outOfStock
                  ? "Stock Habis"
                  : `Sisa: ${p.stock}`}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}