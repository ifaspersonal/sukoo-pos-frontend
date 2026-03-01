"use client";

import { useState, useEffect, useMemo } from "react";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";
import ReceiptPreview from "./ReceiptPreview";

export default function PaymentBar() {
  const { items, clear } = useCart();

  const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  // 🔥 CONFIRM + SUCCESS
  const [confirmMethod, setConfirmMethod] = useState<"cash" | "qris" | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

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
          disabled={printing || items.length === 0}
          className={`w-full py-3 rounded-lg text-white transition
            ${items.length === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600"
            }`}
          onClick={() => setConfirmMethod("cash")}
        >
          {printing ? "Printing..." : "CASH"}
        </button>

        <button
          type="button"
          className="w-full bg-blue-600 text-white py-3 rounded-lg disabled:opacity-50"
          onClick={() => setConfirmMethod("qris")}
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


      {/* 🔥 CONFIRM PAYMENT MODAL */}
      {confirmMethod && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-[95%] max-w-md space-y-4">

            <h2 className="text-lg font-bold text-center">
              Konfirmasi Pembayaran
            </h2>

            {/* ITEM LIST */}
            <div className="max-h-40 overflow-auto border rounded-lg p-2 text-sm space-y-1">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>{item.name} x{item.qty}</span>
                  <span>
                    Rp {(item.price * item.qty).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* TOTAL */}
            <div className="text-center text-xl font-bold">
              Rp {cartTotal.toLocaleString()}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                disabled={processing}
                onClick={() => setConfirmMethod(null)}
                className="flex-1 border py-2 rounded-lg"
              >
                Batal
              </button>

              <button
                disabled={processing}
                onClick={async () => {
                  setProcessing(true);
                  await pay(confirmMethod);
                  setConfirmMethod(null);
                  setProcessing(false);
                  setSuccess(true);
                  setTimeout(() => setSuccess(false), 1500);
                }}
                className="flex-1 bg-black text-white py-2 rounded-lg"
              >
                {processing ? "Processing..." : "Konfirmasi"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 🔥 SUCCESS OVERLAY */}
      {success && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white px-8 py-6 rounded-2xl text-center animate-bounce">
            <div className="text-4xl mb-2">✅</div>
            <div className="font-bold text-lg">
              Transaksi Berhasil
            </div>
          </div>
        </div>
      )}

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