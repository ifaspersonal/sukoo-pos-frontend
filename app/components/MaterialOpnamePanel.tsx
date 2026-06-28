"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { CloseIcon } from "./Icons";

type ShiftType = "opening" | "closing";

type Material = {
  id: number;
  name: string;
  unit: string;
  branch_id: number;
  latest_opening_qty: number | null;
  latest_closing_qty: number | null;
  current_qty: number | null;
  stock_status: "ok" | "low" | "unknown";
};

type OpnameStatus = {
  date: string;
  opening_done: boolean;
  closing_done: boolean;
  materials: Material[];
};

type Props = {
  open: boolean;
  onClose: () => void;
};

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

export default function MaterialOpnamePanel({ open, onClose }: Props) {
  const [status, setStatus] = useState<OpnameStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shiftType, setShiftType] = useState<ShiftType>("opening");
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [note, setNote] = useState("");

  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get("/materials/opname/today");
      const nextStatus = res.data as OpnameStatus;
      setStatus(nextStatus);

      const nextShift: ShiftType =
        nextStatus.opening_done && !nextStatus.closing_done ? "closing" : "opening";
      setShiftType(nextShift);

      const nextQuantities: Record<number, string> = {};
      nextStatus.materials.forEach((material) => {
        const seedQty =
          nextShift === "closing"
            ? material.latest_closing_qty ?? material.current_qty ?? material.latest_opening_qty
            : material.latest_opening_qty ?? material.current_qty;
        nextQuantities[material.id] =
          seedQty === null || seedQty === undefined ? "" : String(seedQty);
      });
      setQuantities(nextQuantities);
    } catch (err) {
      console.error("Material opname status failed", err);
      alert("Gagal mengambil data bahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadStatus();
    }
  }, [open]);

  useEffect(() => {
    if (!status) return;

    const nextQuantities: Record<number, string> = {};
    status.materials.forEach((material) => {
      const seedQty =
        shiftType === "closing"
          ? material.latest_closing_qty ?? material.current_qty ?? material.latest_opening_qty
          : material.latest_opening_qty ?? material.current_qty;
      nextQuantities[material.id] =
        seedQty === null || seedQty === undefined ? "" : String(seedQty);
    });
    setQuantities(nextQuantities);
  }, [shiftType, status]);

  const completionCopy = useMemo(() => {
    if (!status) return "Memuat status opname...";
    if (!status.opening_done) return "Stok awal belum diisi hari ini.";
    if (!status.closing_done) return "Stok awal sudah aman. Jangan lupa stok akhir setelah shift.";
    return "Stok awal dan akhir sudah tercatat hari ini.";
  }, [status]);

  if (!open) return null;

  const submit = async () => {
    if (!status?.materials.length) {
      alert("Belum ada bahan untuk dicatat");
      return;
    }

    const items = status.materials.map((material) => ({
      material_id: material.id,
      qty: Number(quantities[material.id] || 0),
    }));

    if (items.some((item) => Number.isNaN(item.qty) || item.qty < 0)) {
      alert("Qty bahan tidak valid");
      return;
    }

    try {
      setSaving(true);
      await api.post("/materials/opname", {
        shift_type: shiftType,
        items,
        note: note || null,
      });
      await loadStatus();
      setNote("");
      alert(shiftType === "opening" ? "Stok awal tersimpan" : "Stok akhir tersimpan");
    } catch (err: unknown) {
      console.error("Material opname save failed", err);
      alert(getApiErrorMessage(err, "Gagal menyimpan opname bahan"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[65] bg-[#17241d]/45 backdrop-blur-[2px]">
      <button aria-label="Tutup opname bahan" className="absolute inset-0" onClick={onClose} />

      <aside className="safe-bottom absolute inset-x-0 bottom-0 mx-auto flex max-h-[92dvh] max-w-2xl flex-col rounded-t-[28px] bg-[#fffdf8] p-5 shadow-2xl sm:bottom-6 sm:rounded-[28px]">
        <div className="mb-3 flex items-center justify-center sm:hidden">
          <span className="h-1.5 w-12 rounded-full bg-[#d9d3c7]" />
        </div>

        <button
          aria-label="Tutup opname bahan"
          onClick={onClose}
          className="absolute right-5 top-5 flex size-10 items-center justify-center rounded-full bg-[#f0ece3]"
        >
          <CloseIcon className="size-5" />
        </button>

        <div className="pr-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#92775e]">
            Kontrol bahan
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Stok opname bahan</h2>
          <p className="mt-1 text-sm text-[#7a7f7b]">{completionCopy}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-[18px] bg-[#f0ece3] p-1.5">
          {(["opening", "closing"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setShiftType(value)}
              disabled={saving}
              className={`min-h-11 rounded-[13px] text-sm font-bold transition ${
                shiftType === value
                  ? "bg-[#173f2d] text-white shadow-sm"
                  : "text-[#687068] hover:bg-white/70"
              }`}
            >
              {value === "opening" ? "Stok awal" : "Stok akhir"}
            </button>
          ))}
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-auto pr-1">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-[18px] bg-[#f0ece3]" />
              ))}
            </div>
          ) : status?.materials.length ? (
            <div className="space-y-3">
              {status.materials.map((material) => (
                <label
                  key={material.id}
                  className="grid grid-cols-[1fr_130px] items-center gap-3 rounded-[18px] border border-[#e2ddd2] bg-[#f8f5ef] p-3"
                >
                  <span>
                    <span className="block font-semibold leading-snug">{material.name}</span>
                    <span className="mt-1 block text-xs text-[#7a7f7b]">
                      Current: {material.current_qty ?? "-"} {material.unit}
                    </span>
                  </span>
                  <span className="relative">
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={quantities[material.id] ?? ""}
                      onChange={(event) =>
                        setQuantities((prev) => ({
                          ...prev,
                          [material.id]: event.target.value,
                        }))
                      }
                      className="field min-h-12 px-3 pr-12 text-right text-sm"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8b7d6c]">
                      {material.unit}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="rounded-[20px] border border-dashed border-[#d7d1c4] bg-white/50 p-6 text-center">
              <div className="text-3xl">⚖️</div>
              <p className="mt-2 font-semibold">Belum ada bahan dummy</p>
              <p className="mt-1 text-sm text-[#7a7f7b]">
                Jalankan seed lokal untuk mengisi bahan testing.
              </p>
            </div>
          )}
        </div>

        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Catatan opsional, misal: susu tumpah / cup rusak"
          className="mt-4 min-h-20 rounded-[16px] border border-[#ddd8cc] bg-[#fffefa] p-3 text-sm outline-none"
        />

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="min-h-12 flex-1 rounded-[14px] border border-[#dcd6ca] bg-white font-semibold"
          >
            Tutup
          </button>
          <button
            type="button"
            disabled={saving || loading}
            onClick={submit}
            className="min-h-12 flex-1 rounded-[14px] bg-[#173f2d] font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan opname"}
          </button>
        </div>
      </aside>
    </div>
  );
}
