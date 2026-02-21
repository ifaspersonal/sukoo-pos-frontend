"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Period = "daily" | "weekly" | "monthly";

/* ==============================
   WIB FORMATTER (SAFE)
============================== */
const formatWIB = (dateString: string) => {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState<Period>("daily");
  const [loading, setLoading] = useState(true);

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [selectedTx, setSelectedTx] = useState<any>(null);

  const fetchData = async (selected: Period) => {
    try {
      setLoading(true);

      let url = `/reports?period=${selected}`;

      if (start && end) {
        url = `/reports?start=${start}&end=${end}`;
      }

      const res = await api.get(url);
      setData(res.data);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(period);
  }, [period]);

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-stone-100 text-black">
        Loading dashboard...
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 bg-stone-100 min-h-screen text-black space-y-6">

      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">
          📊 Sales Dashboard
        </h1>

        <div className="flex gap-2">
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition
                ${
                  period === p
                    ? "bg-black text-white"
                    : "bg-white text-black border"
                }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ================= DATE PICKER ================= */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          onClick={() => fetchData(period)}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Apply
        </button>
      </div>

      <div className="text-sm text-gray-600">
        {data.start_date} → {data.end_date}
      </div>

      {/* ================= KPI ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="Revenue" value={`Rp ${data.total_revenue.toLocaleString()}`} />
        <Card title="Profit" value={`Rp ${data.profit.toLocaleString()}`} />
        <Card title="Sale Tx" value={data.total_transactions} />
        <Card title="Redeem Tx" value={data.redeem_transactions || 0} />
      </div>

      {/* ================= LOYALTY KPI ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Points Earned" value={data.total_points_earned || 0} />
        <Card title="Points Redeemed" value={data.total_points_redeemed || 0} />
        <Card title="Net Points" value={data.net_points || 0} />
      </div>

      {/* ================= PAYMENT BREAKDOWN ================= */}
      <div className="grid grid-cols-2 gap-4">
        <Card title="Cash" value={`Rp ${data.cash_total.toLocaleString()}`} />
        <Card title="QRIS" value={`Rp ${data.qris_total.toLocaleString()}`} />
      </div>

      {/* ================= TOP PRODUCTS ================= */}
      <div className="bg-white p-4 rounded-2xl shadow">
        <h2 className="font-bold mb-3">🔥 Top Products</h2>

        {data.top_products.length === 0 && (
          <div className="text-gray-500 text-sm">
            No sales in this period
          </div>
        )}

        {data.top_products.map((p: any, i: number) => (
          <div
            key={i}
            className="flex justify-between py-2 border-b last:border-none"
          >
            <span>{p.name}</span>
            <span className="font-medium">{p.qty} pcs</span>
          </div>
        ))}
      </div>

      {/* ================= HOURLY SALES ================= */}
      {period === "daily" && data.hourly_sales && (
        <div className="bg-white p-4 rounded-2xl shadow">
          <h2 className="font-bold mb-3">⏰ Hourly Sales</h2>

          {data.hourly_sales.length === 0 && (
            <div className="text-gray-500 text-sm">
              No transactions today
            </div>
          )}

          {data.hourly_sales.map((h: any, i: number) => (
            <div
              key={i}
              className="flex justify-between py-2 border-b last:border-none"
            >
              <span>{h.hour}:00</span>
              <span className="font-medium">
                Rp {h.total.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ================= TRANSACTION LIST ================= */}
      <div className="bg-white p-4 rounded-2xl shadow">
        <h2 className="font-bold mb-3">🧾 Transactions</h2>

        {data.transactions?.length === 0 && (
          <div className="text-gray-500 text-sm">
            No transactions
          </div>
        )}

        {data.transactions?.map((tx: any) => (
          <div
            key={tx.id}
            className="flex justify-between items-center py-2 border-b last:border-none cursor-pointer hover:bg-stone-50 transition"
            onClick={async () => {
              const res = await api.get(`/reports/transaction/${tx.id}`);
              setSelectedTx(res.data);
            }}
          >
            <div className="flex items-center gap-2">
              <span>#{tx.id}</span>

              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  tx.type === "redeem"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {tx.type?.toUpperCase()}
              </span>
            </div>

            <span className="text-sm font-medium">
              Rp {tx.total.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* ================= MODAL DETAIL ================= */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-[95%] max-w-md">
            <h3 className="font-bold text-lg mb-2">
              Transaction #{selectedTx.id}
            </h3>

            <div className="text-sm text-gray-500 mb-2">
              {formatWIB(selectedTx.created_at)}
            </div>

            <div className="mb-4">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  selectedTx.type === "redeem"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {selectedTx.type?.toUpperCase()}
              </span>
            </div>

            {selectedTx.items.map((item: any, i: number) => (
              <div
                key={i}
                className="flex justify-between py-2 border-b last:border-none"
              >
                <span>
                  {item.product_name} x{item.qty}
                </span>
                <span>
                  Rp {item.subtotal.toLocaleString()}
                </span>
              </div>
            ))}

            <div className="mt-4 font-bold text-right">
              Total: Rp {selectedTx.total.toLocaleString()}
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="mt-4 w-full bg-black text-white py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, value }: any) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-xl md:text-2xl font-bold">{value}</div>
    </div>
  );
}