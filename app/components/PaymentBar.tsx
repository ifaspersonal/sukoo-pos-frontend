"use client";

import { useState, useEffect, useMemo } from "react";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";
import ReceiptPreview from "./ReceiptPreview";
import { ChevronDownIcon, PrinterIcon } from "./Icons";

function getApiErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "detail" in error.response.data &&
    typeof error.response.data.detail === "string"
  ) {
    return error.response.data.detail;
  }

  return fallback;
}

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
  ): Promise<boolean> => {
    if (!items.length) {
      alert("Cart masih kosong");
      return false;
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
        return false;
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
      return true;
    } catch (e: unknown) {
      console.error(e);
      alert(getApiErrorMessage(e, "Transaksi gagal"));
      return false;
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
      <div className="mt-4 space-y-3">

        {/* LOYALTY */}
        <div className="rounded-[18px] border border-[#e2ddd2] bg-[#f7f4ed] p-3.5">
          <label className="flex min-h-9 cursor-pointer items-center justify-between gap-3 text-sm font-semibold">
            <span className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enableLoyalty}
              onChange={(e) => setEnableLoyalty(e.target.checked)}
              className="size-4 accent-[#173f2d]"
            />
              Pelanggan & loyalty
            </span>
            <ChevronDownIcon
              className={`size-4 transition ${enableLoyalty ? "rotate-180" : ""}`}
            />
          </label>

          {enableLoyalty && (
            <div className="mt-3 space-y-2.5 border-t border-[#e2ddd2] pt-3">
              <input
                type="tel"
                inputMode="numeric"
                maxLength={14}
                placeholder="Nomor HP"
                value={customerPhone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setCustomerPhone(value.slice(0, 14));
                }}
                className="field min-h-11 px-3 text-sm"
              />

              {customerPoints !== null && (
                <div className="rounded-xl bg-[#e4eee6] px-3 py-2 text-sm font-semibold text-[#27613f]">
                  Saldo poin: {customerPoints}
                </div>
              )}

              <input
                type="text"
                placeholder="Nama (opsional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="field min-h-11 px-3 text-sm"
              />
            </div>
          )}
        </div>

        {/* 🎁 REDEEM BUTTON */}
        {redeemAvailable && (
          <button
            type="button"
            className="min-h-12 w-full rounded-[14px] bg-[#6f4b7b] px-4 font-semibold text-white transition hover:bg-[#5b3c66]"
            onClick={() => pay("redeem", 10)}
          >
            Tukar 1 minuman · 10 poin
          </button>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={printing || items.length === 0}
            className="min-h-12 rounded-[14px] bg-[#173f2d] px-4 font-semibold text-white transition hover:bg-[#0e2d1f] disabled:cursor-not-allowed disabled:bg-[#b9bdb9]"
            onClick={() => setConfirmMethod("cash")}
          >
            {printing ? "Mencetak..." : "Tunai"}
          </button>

          <button
            type="button"
            className="min-h-12 rounded-[14px] bg-[#355e81] px-4 font-semibold text-white transition hover:bg-[#294c6b] disabled:cursor-not-allowed disabled:bg-[#b9bdb9]"
            onClick={() => setConfirmMethod("qris")}
            disabled={printing || items.length === 0}
          >
            {printing ? "Mencetak..." : "QRIS"}
          </button>
        </div>

        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] border border-[#dcd6ca] bg-white px-4 text-sm font-semibold text-[#5f655f] transition hover:bg-[#f4f1ea]"
          onClick={reprintLast}
        >
          <PrinterIcon className="size-4" />
          Cetak transaksi terakhir
        </button>
      </div>


      {/* 🔥 CONFIRM PAYMENT MODAL */}
      {confirmMethod && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#17241d]/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
          <div className="safe-bottom w-full max-w-md space-y-4 rounded-t-[28px] bg-[#fffdf8] p-5 shadow-2xl sm:rounded-[28px] sm:p-6">

            <div className="mx-auto h-1.5 w-12 rounded-full bg-[#d9d3c7] sm:hidden" />
            <h2 className="text-center text-xl font-semibold">
              Konfirmasi Pembayaran
            </h2>
            <p className="text-center text-sm text-[#7a7f7b]">
              Pilih metode terakhir sebelum transaksi diproses.
            </p>

            <div className="grid grid-cols-2 gap-2 rounded-[18px] bg-[#f0ece3] p-1.5">
              {(["cash", "qris"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  disabled={processing}
                  onClick={() => setConfirmMethod(method)}
                  className={`min-h-11 rounded-[13px] text-sm font-bold transition ${
                    confirmMethod === method
                      ? "bg-[#173f2d] text-white shadow-sm"
                      : "text-[#687068] hover:bg-white/70"
                  }`}
                >
                  {method === "cash" ? "Tunai" : "QRIS"}
                </button>
              ))}
            </div>

            {confirmMethod === "qris" && <QrisPreview amount={cartTotal} />}

            {/* ITEM LIST */}
            <div className="max-h-44 space-y-2 overflow-auto rounded-[16px] border border-[#e2ddd2] bg-[#f8f5ef] p-3 text-sm">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between gap-4">
                  <span>{item.name} x{item.qty}</span>
                  <span>
                    Rp {(item.price * item.qty).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* TOTAL */}
            <div className="text-center text-3xl font-bold tracking-tight text-[#173f2d]">
              Rp {cartTotal.toLocaleString("id-ID")}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                disabled={processing}
                onClick={() => setConfirmMethod(null)}
                className="min-h-12 flex-1 rounded-[14px] border border-[#dcd6ca] bg-white font-semibold"
              >
                Batal
              </button>

              <button
                disabled={processing}
                onClick={async () => {
                  setProcessing(true);
                  const paid = await pay(confirmMethod);
                  setProcessing(false);

                  if (paid) {
                    setConfirmMethod(null);
                    setSuccess(true);
                    setTimeout(() => setSuccess(false), 1500);
                  }
                }}
                className="min-h-12 flex-1 rounded-[14px] bg-[#173f2d] font-semibold text-white disabled:opacity-60"
              >
                {processing ? "Memproses..." : "Bayar sekarang"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 🔥 SUCCESS OVERLAY */}
      {success && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#17241d]/45">
          <div className="rounded-[24px] bg-[#fffdf8] px-9 py-7 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-[#dfece1] text-2xl">
              ✓
            </div>
            <div className="text-lg font-bold">
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

function QrisPreview({ amount }: { amount: number }) {
  const cells = Array.from({ length: 49 }, (_, index) => {
    const row = Math.floor(index / 7);
    const col = index % 7;
    return row === 0 ||
      col === 0 ||
      row === 6 ||
      col === 6 ||
      (row + col) % 3 === 0 ||
      (row === 3 && col > 1)
      ? 1
      : 0;
  });

  return (
    <div className="rounded-[20px] border border-[#cfdbe6] bg-[#f5f9fc] p-4 text-center">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#355e81]">
        QRIS Demo Lokal
      </div>
      <div className="mx-auto mt-3 grid size-36 grid-cols-7 gap-1 rounded-2xl bg-white p-3 shadow-inner">
        {cells.map((active, index) => (
          <span
            key={index}
            className={`rounded-[3px] ${active ? "bg-[#173f2d]" : "bg-[#e7eef2]"}`}
          />
        ))}
      </div>
      <div className="mt-3 text-sm text-[#5f6b73]">
        Tunjukkan layar ini ke pelanggan.
      </div>
      <div className="mt-1 text-xl font-black text-[#173f2d]">
        Rp {amount.toLocaleString("id-ID")}
      </div>
    </div>
  );
}
