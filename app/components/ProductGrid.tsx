"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";

export default function ProductGrid() {
  const [products, setProducts] = useState<any[]>([]);
  const { addItem } = useCart();

  useEffect(() => {
    api.get("/products").then((res) => setProducts(res.data));
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4">
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
            className={`rounded-xl shadow p-6 text-lg font-semibold transition
              ${
                outOfStock
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-stone-50 active:scale-95"
              }
            `}
          >
            <div>{p.name}</div>

            <div className="text-sm text-gray-500">
              Rp {p.price.toLocaleString()}
            </div>

            {!p.is_unlimited && (
              <div className="text-xs mt-1">
                {outOfStock ? "Stock habis" : `Stock: ${p.stock}`}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}