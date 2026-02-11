"use client";

import { useState } from "react";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";
import ReceiptPreview from "./ReceiptPreview";

/**
 * Print via Web Bluetooth (ESC/POS)
 * NOTE:
 * - Jalan di Chrome / Edge / Android Chrome
 * - Tidak support iOS Safari
 */
async function printViaBluetooth(text: string) {
  if (!navigator.bluetooth) {
    alert("Browser tidak mendukung Bluetooth printing");
    return;
  }

  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [0xffe0], // umum untuk ESC/POS
    });

    const server = await device.gatt!.connect();
    const service = await server.getPrimaryService(0xffe0);
    const characteristic = await service.getCharacteristic(0xffe1);

    const encoder = new TextEncoder();
    await characteristic.writeValue(encoder.encode(text));
  } catch (err: any) {
    // USER CANCELLED → NORMAL
    if (err?.name === "NotFoundError" || err?.name === "AbortError") {
      console.info("Print dibatalkan oleh user");
      return;
    }

    console.error("Bluetooth print error:", err);
    alert("Print gagal");
  }
}

export default function PaymentBar() {
  const { items, total, clear } = useCart();
  const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);

  const pay = async (method: "cash" | "qris") => {
    if (!items.length) {
      alert("Cart masih kosong");
      return;
    }

    try {
      // 1️⃣ CREATE TRANSACTION
      const res = await api.post("/transactions", {
        items: items.map((i) => ({
          product_id: i.product_id,
          qty: i.qty,
        })),
        payment_method: method,
      });

      const transactionId = res.data.id;

      // SIMPAN TRANSAKSI TERAKHIR (UNTUK PRINT ULANG)
      localStorage.setItem(
        "last_transaction_id",
        String(transactionId)
      );

      // 2️⃣ AMBIL RECEIPT DARI BACKEND
      let receiptText = "";
      try {
        const printRes = await api.post(`/print/${transactionId}`);
        receiptText = printRes.data.receipt;
      } catch (e) {
        console.error("Gagal ambil receipt", e);
      }

      // 3️⃣ TAMPILKAN PREVIEW STRUK
      if (receiptText) {
        setPreviewReceipt(receiptText);
      }

      // 4️⃣ CLEAR CART & SUCCESS
      clear();
      alert("Transaksi sukses!");
    } catch (e) {
      console.error(e);
      alert("Transaksi gagal");
    }
  };

  const reprintLast = async () => {
    const lastId = localStorage.getItem("last_transaction_id");
    if (!lastId) {
      alert("Belum ada transaksi untuk dicetak");
      return;
    }

    try {
      const res = await api.post(`/print/${lastId}`);
      const receiptText = res.data.receipt;

      if (!receiptText) {
        alert("Struk tidak tersedia");
        return;
      }

      setPreviewReceipt(receiptText);
    } catch (e) {
      console.error(e);
      alert("Gagal print ulang");
    }
  };

  return (
    <>
      <div className="mt-auto space-y-2">
        <button
          type="button"
          className="w-full bg-green-600 text-white py-3 rounded-lg"
          onClick={() => pay("cash")}
        >
          CASH
        </button>

        <button
          type="button"
          className="w-full bg-blue-600 text-white py-3 rounded-lg"
          onClick={() => pay("qris")}
        >
          QRIS
        </button>

        <button
          type="button"
          className="w-full bg-gray-600 text-white py-3 rounded-lg"
          onClick={reprintLast}
        >
          PRINT ULANG
        </button>
      </div>

      {/* PREVIEW STRUK (DEV MODE & FALLBACK) */}
      {previewReceipt && (
        <ReceiptPreview
          receipt={previewReceipt}
          onClose={() => setPreviewReceipt(null)}
          onPrint={async () => {
            await printViaBluetooth(previewReceipt);
            setPreviewReceipt(null);
          }}
        />
      )}
    </>
  );
}