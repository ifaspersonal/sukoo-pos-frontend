"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Period = "daily" | "weekly" | "monthly";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState<Period>("daily");
  const [loading, setLoading] = useState(true);

  const fetchData = async (selected: Period) => {
    try {
      setLoading(true);
      const res = await api.get(`/reports?period=${selected}`);
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">
          📊 Sales Dashboard
        </h1>

        {/* Period Toggle */}
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

      {/* Date Range */}
      <div className="text-sm text-gray-600">
        {data.start_date} → {data.end_date}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          title="Revenue"
          value={`Rp ${data.total_revenue.toLocaleString()}`}
        />
        <Card
          title="Profit"
          value={`Rp ${data.profit.toLocaleString()}`}
        />
        <Card
          title="Transactions"
          value={data.total_transactions}
        />
        <Card
          title="Cash / QRIS"
          value={`Rp ${data.cash_total.toLocaleString()} / Rp ${data.qris_total.toLocaleString()}`}
        />
      </div>

      {/* Top Products */}
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

      {/* Hourly Sales (Only Daily) */}
      {period === "daily" && (
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