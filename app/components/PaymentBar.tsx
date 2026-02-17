"use client";

import { useState, useEffect, useMemo } from "react";
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
 * Web Print fallback
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

  // Loyalty
  const [enableLoyalty, setEnableLoyalty] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");

  // Redeem
  const [redeemPoints, setRedeemPoints] = useState<number>(0);
  const [customerPoints, setCustomerPoints] = useState<number | null>(null);

  // ==============================
  // HITUNG TOTAL CART
  // ==============================
  const cartTotal = useMemo(() => {
    return items.reduce(
      (sum, i) => sum + i.price * i.qty,
      0
    );
  }, [items]);

  // ==============================
  // FETCH CUSTOMER POINT
  // ==============================
  useEffect(() => {
    const fetchCustomer = async () => {
      if (!enableLoyalty || !customerPhone || customerPhone.length < 5) {
        setCustomerPoints(null);
        return;
      }

      try {
        const res = await api.get(
          `/customers/by-phone/${customerPhone}`
        );

        if (res.data.exists) {
          setCustomerPoints(res.data.points || 0);
          if (!customerName) {
            setCustomerName(res.data.name || "");
          }
        } else {
          setCustomerPoints(0);
        }
      } catch (err) {
        console.error("Customer lookup failed", err);
      }
    };

    fetchCustomer();
  }, [customerPhone, enableLoyalty]);

  const redeemInvalid =
    customerPoints !== null &&
    redeemPoints > (customerPoints || 0);

  const fullRedeemAvailable =
    enableLoyalty &&
    customerPoints !== null &&
    customerPoints >= cartTotal &&
    cartTotal > 0;

  const handleAutoPrint = async (receiptText: string) => {
    setPrinting(true);

    try {
      await printViaBluetooth(receiptText);
    } catch {
      printViaWeb(receiptText);
    } finally {
      setPrinting(false);
    }
  };

  // ==============================
  // GENERIC PAY FUNCTION
  // ==============================
  const pay = async (
    method: "cash" | "qris" | "redeem",
    forceRedeemPoints?: number
  ) => {
    if (!items.length) {
      alert("Cart masih kosong");
      return;
    }

    try {
      const res = await api.post("/transactions/", {
        items: items.map((i) => ({
          product_id: i.product_id,
          qty: i.qty,
        })),
        payment_method: method,
        customer_phone: enableLoyalty ? customerPhone || null : null,
        customer_name: enableLoyalty ? customerName || null : null,
        redeem_points:
          method === "redeem"
            ? forceRedeemPoints
            : enableLoyalty && redeemPoints > 0
            ? redeemPoints
            : 0,
      });

      const transactionId = res.data.id;

      localStorage.setItem(
        "last_transaction_id",
        String(transactionId)
      );

      const printRes = await api.post(`/print/${transactionId}`);
      const receiptText = printRes.data.receipt;

      if (!receiptText) {
        alert("Struk tidak tersedia");
        return;
      }

      await handleAutoPrint(receiptText);
      setPreviewReceipt(receiptText);

      // reset state
      setCustomerPhone("");
      setCustomerName("");
      setRedeemPoints(0);
      setCustomerPoints(null);
      setEnableLoyalty(false);

      clear();
      alert("Transaksi sukses!");
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail || "Transaksi gagal");
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
    } catch {
      alert("Gagal print ulang");
    }
  };

  return (
    <>
      <div className="mt-auto space-y-3">

        {/* LOYALTY */}
        <div className="bg-white p-3 rounded-xl shadow space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-black">
            <input
              type="checkbox"
              checked={enableLoyalty}
              onChange={(e) => setEnableLoyalty(e.target.checked)}
            />
            Gunakan Loyalty / Redeem Poin
          </label>

          {enableLoyalty && (
            <>
              <input
                type="text"
                placeholder="Nomor HP"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full border rounded-lg p-2 text-black"
              />

              {customerPoints !== null && (
                <div className="text-sm font-medium text-green-600">
                  Saldo Poin: {customerPoints}
                </div>
              )}

              <input
                type="text"
                placeholder="Nama (opsional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full border rounded-lg p-2 text-black"
              />

              {/* Partial Redeem */}
              <input
                type="number"
                placeholder="Redeem poin (opsional)"
                value={redeemPoints || ""}
                min={0}
                onChange={(e) =>
                  setRedeemPoints(Number(e.target.value))
                }
                className={`w-full border rounded-lg p-2 text-black ${
                  redeemInvalid ? "border-red-500" : ""
                }`}
              />

              {redeemInvalid && (
                <div className="text-xs text-red-500">
                  Poin tidak cukup
                </div>
              )}
            </>
          )}
        </div>

        {/* FULL REDEEM BUTTON */}
        {fullRedeemAvailable && (
          <button
            type="button"
            className="w-full bg-purple-600 text-white py-3 rounded-lg"
            onClick={() =>
              pay("redeem", cartTotal)
            }
          >
            🎁 REDEEM GRATIS
          </button>
        )}

        {/* PAYMENT BUTTONS */}
        <button
          type="button"
          className="w-full bg-green-600 text-white py-3 rounded-lg disabled:opacity-50"
          onClick={() => pay("cash")}
          disabled={printing || redeemInvalid}
        >
          {printing ? "Printing..." : "CASH"}
        </button>

        <button
          type="button"
          className="w-full bg-blue-600 text-white py-3 rounded-lg disabled:opacity-50"
          onClick={() => pay("qris")}
          disabled={printing || redeemInvalid}
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