"use client";

import { useState } from "react";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";
import ReceiptPreview from "./ReceiptPreview";

/**
 * Bluetooth ESC/POS Print
 */
async function printViaBluetooth(text: string) {
  const nav = navigator as any;

  if (!nav.bluetooth) {
    throw new Error("Bluetooth not supported");
  }

  const device = await nav.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [0xffe0],
  });

  const server = await device.gatt?.connect();
  if (!server) throw new Error("Gagal connect GATT");

  const service = await server.getPrimaryService(0xffe0);
  const characteristic = await service.getCharacteristic(0xffe1);

  const encoder = new TextEncoder();
  await characteristic.writeValue(encoder.encode(text));
}

/**
 * Web Print Fallback (Universal)
 */
function printViaWeb(receiptText: string) {
  const win = window.open("", "_blank");
  if (!win) return;

  win.document.write(`
    <html>
      <head>
        <title>Print Receipt</title>
        <style>
          body {
            font-family: monospace;
            white-space: pre;
            font-size: 14px;
            color: black;
          }
        </style>
      </head>
      <body>
${receiptText}
      </body>
    </html>
  `);

  win.document.close();
  win.focus();
  win.print();
}

export default function PaymentBar() {
  const { items, clear } = useCart();

  const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  // 🔥 Loyalty State
  const [enableLoyalty, setEnableLoyalty] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");

  const handleAutoPrint = async (receiptText: string) => {
    setPrinting(true);

    try {
      await printViaBluetooth(receiptText);
    } catch (err: any) {
      console.warn("Bluetooth gagal → fallback Web Print", err);
      printViaWeb(receiptText);
    } finally {
      setPrinting(false);
    }
  };

  const pay = async (method: "cash" | "qris") => {
    if (!items.length) {
      alert("Cart masih kosong");
      return;
    }

    try {
      // ==========================
      // CREATE TRANSACTION
      // ==========================
      const res = await api.post("/transactions/", {
        items: items.map((i) => ({
          product_id: i.product_id,
          qty: i.qty,
        })),
        payment_method: method,

        // 🔥 Loyalty optional
        customer_phone: enableLoyalty
          ? customerPhone || null
          : null,

        customer_name: enableLoyalty
          ? customerName || null
          : null,
      });

      const transactionId = res.data.id;

      localStorage.setItem(
        "last_transaction_id",
        String(transactionId)
      );

      // ==========================
      // GET RECEIPT
      // ==========================
      const printRes = await api.post(`/print/${transactionId}`);
      const receiptText = printRes.data.receipt;

      if (!receiptText) {
        alert("Struk tidak tersedia");
        return;
      }

      // ==========================
      // AUTO PRINT
      // ==========================
      await handleAutoPrint(receiptText);

      setPreviewReceipt(receiptText);

      // Reset loyalty form
      setCustomerPhone("");
      setCustomerName("");
      setEnableLoyalty(false);

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
      await handleAutoPrint(receiptText);
    } catch (e) {
      console.error(e);
      alert("Gagal print ulang");
    }
  };

  return (
    <>
      <div className="mt-auto space-y-3">

        {/* 🔥 Loyalty Toggle */}
        <div className="bg-white p-3 rounded-xl shadow space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-black">
            <input
              type="checkbox"
              checked={enableLoyalty}
              onChange={(e) => setEnableLoyalty(e.target.checked)}
            />
            Customer ingin kumpulkan poin
          </label>

          {enableLoyalty && (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nomor HP"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full border rounded-lg p-2 text-black"
              />

              <input
                type="text"
                placeholder="Nama (opsional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full border rounded-lg p-2 text-black"
              />

              <div className="text-xs text-gray-500">
                Isi nomor HP untuk mendapatkan poin.
              </div>
            </div>
          )}
        </div>

        {/* PAYMENT BUTTONS */}
        <button
          type="button"
          className="w-full bg-green-600 text-white py-3 rounded-lg disabled:opacity-50"
          onClick={() => pay("cash")}
          disabled={printing}
        >
          {printing ? "Printing..." : "CASH"}
        </button>

        <button
          type="button"
          className="w-full bg-blue-600 text-white py-3 rounded-lg disabled:opacity-50"
          onClick={() => pay("qris")}
          disabled={printing}
        >
          {printing ? "Printing..." : "QRIS"}
        </button>

        <button
          type="button"
          className="w-full bg-gray-600 text-white py-3 rounded-lg"
          onClick={reprintLast}
        >
          PRINT ULANG
        </button>
      </div>

      {/* Receipt Preview */}
      {previewReceipt && (
        <ReceiptPreview
          receipt={previewReceipt}
          onClose={() => setPreviewReceipt(null)}
          onPrint={async () => {
            await handleAutoPrint(previewReceipt);
          }}
        />
      )}
    </>
  );
}