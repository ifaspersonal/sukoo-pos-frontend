"use client";

import { useCart } from "../context/CartContext";

export default function Cart() {
  const { items, addItem, removeItem, total, itemCount } = useCart();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#92775e]">
            Pesanan
          </p>
          <h2 className="mt-1 text-xl font-semibold">Keranjang</h2>
        </div>
        <span className="rounded-full bg-[#eee9de] px-3 py-1 text-xs font-semibold text-[#626862]">
          {itemCount} item
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-auto pr-1">
        {items.length === 0 && (
          <div className="flex h-full min-h-36 flex-col items-center justify-center rounded-[20px] border border-dashed border-[#d8d2c6] bg-[#f7f4ed] p-5 text-center">
            <div className="text-3xl">🛒</div>
            <p className="mt-2 text-sm font-semibold">Keranjang masih kosong</p>
            <p className="mt-1 text-xs leading-5 text-[#858984]">
              Pilih menu untuk mulai transaksi.
            </p>
          </div>
        )}

        {items.map((item) => (
          <div
            key={item.product_id}
            className="rounded-[18px] border border-[#e4dfd4] bg-[#fffefa] p-3.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-semibold">{item.name}</div>
                <div className="mt-1 text-xs text-[#7b807b]">
                  Rp {item.price.toLocaleString("id-ID")}
                </div>
              </div>

              <div className="flex shrink-0 items-center rounded-full border border-[#ded8cc] bg-white p-1">
                <button
                  aria-label={`Kurangi ${item.name}`}
                  onClick={() => removeItem(item.product_id)}
                  className="flex size-8 items-center justify-center rounded-full text-lg text-[#5c625d] hover:bg-[#f0ece3]"
                >
                  −
                </button>
                <span className="min-w-7 text-center text-sm font-bold">
                  {item.qty}
                </span>
                <button
                  aria-label={`Tambah ${item.name}`}
                  onClick={() => addItem(item)}
                  className="flex size-8 items-center justify-center rounded-full bg-[#173f2d] text-lg text-white hover:bg-[#0e2d1f]"
                >
                  +
                </button>
              </div>
            </div>
            <div className="mt-3 border-t border-dashed border-[#e5e0d5] pt-2 text-right text-sm font-bold">
              Rp {(item.price * item.qty).toLocaleString("id-ID")}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-end justify-between border-t border-[#e4dfd4] pt-4">
        <span className="text-sm text-[#707570]">Total pembayaran</span>
        <span className="text-2xl font-bold tracking-tight text-[#173f2d]">
          Rp {total.toLocaleString("id-ID")}
        </span>
      </div>
    </div>
  );
}
