"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/reports/daily")
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!data) return <div className="p-6">Loading dashboard...</div>;

  return (
    <div className="p-6 bg-stone-100 min-h-screen text-black space-y-6">

      <h1 className="text-3xl font-bold">
        📊 Daily Sales Dashboard
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="Revenue" value={`Rp ${data.total_revenue.toLocaleString()}`} />
        <Card title="Profit" value={`Rp ${data.profit.toLocaleString()}`} />
        <Card title="Transactions" value={data.total_transactions} />
        <Card title="Cash vs QRIS" value={`Rp ${data.cash_total.toLocaleString()} / Rp ${data.qris_total.toLocaleString()}`} />
      </div>

      {/* Top Products */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-bold mb-3">🔥 Top Products</h2>
        {data.top_products.map((p: any, i: number) => (
          <div key={i} className="flex justify-between py-1 border-b">
            <span>{p.name}</span>
            <span>{p.qty} pcs</span>
          </div>
        ))}
      </div>

      {/* Hourly Sales */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-bold mb-3">⏰ Hourly Sales</h2>
        {data.hourly_sales.map((h: any, i: number) => (
          <div key={i} className="flex justify-between py-1 border-b">
            <span>{h.hour}:00</span>
            <span>Rp {h.total.toLocaleString()}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

function Card({ title, value }: any) {
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}