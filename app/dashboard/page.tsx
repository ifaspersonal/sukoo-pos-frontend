"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [selectedTx, setSelectedTx] = useState<any>(null);

  const fetchReport = async () => {
    let url = "/reports";

    if (start && end) {
      url += `?start=${start}&end=${end}`;
    }

    const res = await api.get(url);
    setData(res.data);
  };

  useEffect(() => {
    fetchReport();
  }, []);

  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 bg-stone-100 min-h-screen text-black space-y-6">

      <h1 className="text-3xl font-bold">📊 Sales Dashboard</h1>

      {/* DATE FILTER */}
      <div className="bg-white p-4 rounded-xl shadow flex gap-4 items-end">
        <div>
          <label className="text-sm">Start</label>
          <input
            type="date"
            className="border p-2 rounded"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm">End</label>
          <input
            type="date"
            className="border p-2 rounded"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>

        <button
          className="bg-black text-white px-4 py-2 rounded"
          onClick={fetchReport}
        >
          Apply
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="Revenue" value={`Rp ${data.total_revenue.toLocaleString()}`} />
        <Card title="Profit" value={`Rp ${data.profit.toLocaleString()}`} />
        <Card title="Transactions" value={data.total_transactions} />
        <Card title="Cash / QRIS" value={`Rp ${data.cash_total.toLocaleString()} / Rp ${data.qris_total.toLocaleString()}`} />
      </div>

      {/* TRANSACTION LIST */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-bold mb-3">🧾 Transactions</h2>

        {data.transactions.map((tx: any) => (
          <div
            key={tx.id}
            className="flex justify-between py-2 border-b cursor-pointer hover:bg-stone-50"
            onClick={() => setSelectedTx(tx)}
          >
            <span>#{tx.id}</span>
            <span>{tx.payment_method.toUpperCase()}</span>
          </div>
        ))}
      </div>

      {/* DETAIL MODAL */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-96">
            <h3 className="text-lg font-bold mb-4">
              Transaction #{selectedTx.id}
            </h3>

            <div className="space-y-2 text-sm">
              <div>Payment: {selectedTx.payment_method}</div>
              <div>Date: {new Date(selectedTx.created_at).toLocaleString()}</div>
            </div>

            <button
              className="mt-4 w-full bg-black text-white py-2 rounded"
              onClick={() => setSelectedTx(null)}
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
    <div className="bg-white p-4 rounded-xl shadow">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}