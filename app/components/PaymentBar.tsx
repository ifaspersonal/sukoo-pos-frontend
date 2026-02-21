"use client";

import { useState, useEffect, useMemo } from "react";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";
import ReceiptPreview from "./ReceiptPreview";

export default function PaymentBar() {
  const { items, clear } = useCart();

  const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  // Loyalty
  const [enableLoyalty, setEnableLoyalty] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");

  // Points
  const [customerPoints, setCustomerPoints] = useState<number | null>(null);

  // ==============================
  // CART TOTAL
  // ==============================
  const cartTotal = useMemo(() => {
    return items.reduce((sum, i) => sum + i.price * i.qty, 0);
  }, [items]);

  // ==============================
  // FETCH CUSTOMER POINTS
  // ==============================
  useEffect(() => {
    const fetchCustomer = async () => {
      if (!enableLoyalty || !customerPhone || customerPhone.length < 5) {
        setCustomerPoints(null);
        return;
      }

      try {
        const res = await api.get(`/customers/by-phone/${customerPhone}`);

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

  // ==============================
  // REDEEM RULE
  // 10 points = 1 free drink
  // ==============================
  const redeemAvailable =
    enableLoyalty &&
    customerPoints !== null &&
    customerPoints >= 10;

  // ==============================
  // RAWBT INTENT PRINT
  // ==============================
  const handleAutoPrint = async (receiptText: string) => {
    try {
      setPrinting(true);

      const encoded = encodeURIComponent(receiptText);

      const intentUrl =
        "intent:print?text=" +
        encoded +
        "#Intent;" +
        "scheme=rawbt;" +
        "package=ru.a402d.rawbtprinter;" +
        "end;";

      window.location.href = intentUrl;
    } catch (err) {
      console.error("RawBT intent failed", err);
      alert("Gagal kirim ke printer");
    } finally {
      setPrinting(false);
    }
  };

  // ==============================
  // PAY FUNCTION
  // ==============================
  const pay = async (
    method: "cash" | "qris" | "redeem",
    redeemPointAmount: number = 0
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
        redeem_points: redeemPointAmount,
      });

      const transactionId = res.data.id;

      localStorage.setItem("last_transaction_id", String(transactionId));

      const printRes = await api.post(`/print/${transactionId}`);
      const receiptText = printRes.data.receipt;

      if (!receiptText) {
        alert("Struk tidak tersedia");
        return;
      }

      await handleAutoPrint(receiptText);
      setPreviewReceipt(receiptText);

      // reset
      setCustomerPhone("");
      setCustomerName("");
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
            Gunakan Loyalty
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
            </>
          )}
        </div>

        {/* 🎁 REDEEM BUTTON */}
        {redeemAvailable && (
          <button
            type="button"
            className="w-full bg-purple-600 text-white py-3 rounded-lg"
            onClick={() => pay("redeem", 10)}
          >
            🎁 REDEEM 1 MINUMAN (10 POIN)
          </button>
        )}

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