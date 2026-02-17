"use client";

import { useState } from "react";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";
import ReceiptPreview from "./ReceiptPreview";

export default function PaymentBar() {
  const { items, total, clear } = useCart();

  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);

  const pay = async (method: "cash" | "qris") => {
    if (!items.length) {
      alert("Cart masih kosong");
      return;
    }

    try {
      const res = await api.post("/transactions", {
        items: items.map((i) => ({
          product_id: i.product_id,
          qty: i.qty,
        })),
        payment_method: method,
        customer_phone: customerPhone || null,
        customer_name: customerName || null,
      });

      const transactionId = res.data.id;

      localStorage.setItem("last_transaction_id", String(transactionId));

      // 🔥 Ambil receipt preview
      let receiptText = "";
      try {
        const printRes = await api.post(`/print/${transactionId}`);
        receiptText = printRes.data.receipt;
      } catch (e) {
        console.error("Gagal ambil receipt", e);
      }

      // 🔥 Hitung poin (1 item = 1 poin)
      const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
      if (customerPhone) {
        setEarnedPoints(totalQty);
      }

      if (receiptText) {
        setPreviewReceipt(receiptText);
      }

      clear();
      setCustomerPhone("");
      setCustomerName("");

    } catch (e) {
      console.error(e);
      alert("Transaksi gagal");
    }
  };

  return (
    <>
      <div className="mt-auto space-y-3">

        {/* ================= CUSTOMER INPUT ================= */}
        <div className="bg-white p-3 rounded-xl shadow space-y-2">
          <div className="text-sm font-semibold text-black">
            👤 Customer (Optional)
          </div>

          <input
            type="text"
            placeholder="No HP (untuk poin)"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full border p-2 rounded text-black"
          />

          <input
            type="text"
            placeholder="Nama (opsional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full border p-2 rounded text-black"
          />
        </div>

        {/* ================= PAYMENT BUTTONS ================= */}
        <button
          type="button"
          className="w-full bg-green-600 text-white py-3 rounded-xl text-lg font-semibold"
          onClick={() => pay("cash")}
        >
          CASH
        </button>

        <button
          type="button"
          className="w-full bg-blue-600 text-white py-3 rounded-xl text-lg font-semibold"
          onClick={() => pay("qris")}
        >
          QRIS
        </button>
      </div>

      {/* ================= POINT POPUP ================= */}
      {earnedPoints !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl text-center space-y-3">
            <div className="text-2xl font-bold text-black">
              🎉 Poin Bertambah!
            </div>
            <div className="text-lg text-black">
              +{earnedPoints} poin
            </div>
            <button
              className="bg-black text-white px-4 py-2 rounded-lg"
              onClick={() => setEarnedPoints(null)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* ================= RECEIPT PREVIEW ================= */}
      {previewReceipt && (
        <ReceiptPreview
          receipt={previewReceipt}
          onClose={() => setPreviewReceipt(null)}
          onPrint={() => window.print()}
        />
      )}
    </>
  );
}