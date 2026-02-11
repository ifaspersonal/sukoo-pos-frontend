"use client";

import { useCart } from "../context/CartContext";

export default function Cart() {
  const { items, addItem, removeItem, total } = useCart();

  return (
    <div className="flex-1 overflow-auto">
      <h2 className="text-lg font-bold mb-2">Cart</h2>

      {items.map((item) => (
        <div key={item.product_id} className="flex justify-between mb-2">
          <div>
            <div>{item.name}</div>
            <div className="text-sm text-gray-500">
              Rp {item.price.toLocaleString()}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => removeItem(item.product_id)}>-</button>
            <span>{item.qty}</span>
            <button onClick={() => addItem(item)}>+</button>
          </div>
        </div>
      ))}

      <div className="font-bold mt-4">
        Total: Rp {total.toLocaleString()}
      </div>
    </div>
  );
}