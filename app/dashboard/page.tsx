"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Period = "daily" | "weekly" | "monthly";

/* ==============================
   WIB FORMATTER
============================== */
const formatWIB = (dateString: string) => {
  if (!dateString) return "-";

  // Paksa treat sebagai UTC
  const utcDate = new Date(dateString + "Z");

  return utcDate.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* ==============================
   FIX HOURLY UTC → WIB
============================== */
const toWIBHour = (utcHour: number) => {
  return (utcHour + 7) % 24;
};

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState<Period>("daily");
  const [loading, setLoading] = useState(true);

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [selectedTx, setSelectedTx] = useState<any>(null);
  // ================= ADD PRODUCT MODAL =================
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState<number | "">("");
  const [newCostPrice, setNewCostPrice] = useState<number | "">("");
  const [newStock, setNewStock] = useState<number | "">("");
  const [newUnlimited, setNewUnlimited] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [newCategory, setNewCategory] = useState("drink");
  const [newPointValue, setNewPointValue] = useState<number | "">(1);

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

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (err) {
      console.error("Product fetch error", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // ================= HANDLE ADD PRODUCT =================
  const handleAddProduct = async () => {
    if (!newName || newPrice === "" || newCostPrice === "") {
      alert("Nama, harga jual dan harga modal wajib diisi");
      return;
    }

    try {
      setSavingProduct(true);

      await api.post("/products", {
        name: newName,
        price: parseInt(String(newPrice)),
        cost_price: parseInt(String(newCostPrice)),
        stock: newUnlimited ? 0 : parseInt(String(newStock || 0)),
        daily_stock: newUnlimited ? 0 : parseInt(String(newStock || 0)),
        is_unlimited: newUnlimited,
        category: newCategory,
        loyalty_point_value:
          newPointValue === "" ? 0 : parseInt(String(newPointValue)),
      });

      alert("Produk berhasil ditambahkan");

      setNewName("");
      setNewPrice("");
      setNewCostPrice("");
      setNewStock("");
      setNewUnlimited(false);
      setNewCategory("drink");
        setNewPointValue(1);

      setShowAddProduct(false);

      fetchData(period);
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Gagal menambahkan produk");
    } finally {
      setSavingProduct(false);
    }
  };

  useEffect(() => {
    fetchData(period);
    fetchProducts();
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
        <h1 className="text-3xl font-bold">📊 Sales Dashboard</h1>

        <div className="flex gap-2 items-center">
          <button
            onClick={() => setShowAddProduct(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
          >
            ➕ Add Product
          </button>
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

      {/* ================= PRODUCT SUMMARY ================= */}
      <div className="bg-white p-4 rounded-2xl shadow">
        <h2 className="font-bold mb-3">📦 Product Sales Summary</h2>

        {data.top_products?.length === 0 && (
          <div className="text-gray-500 text-sm">
            No product sales in this period
          </div>
        )}

        {data.top_products?.map((p: any, i: number) => (
          <div
            key={i}
            className="flex justify-between py-2 border-b last:border-none"
          >
            <span>{p.name}</span>
            <span className="font-medium">{p.qty} pcs</span>
          </div>
        ))}
      </div>

      {/* ================= PRODUCT MANAGEMENT ================= */}
      <div className="bg-white p-4 rounded-2xl shadow">
        <h2 className="font-bold mb-3">🛠 Product Management</h2>

        <button
          onClick={async () => {
            if (!confirm("Reset semua stock ke daily stock?")) return;
            await api.post("/products/reset-daily-stock");
            fetchProducts();
            alert("Daily stock berhasil direset");
          }}
          className="mb-3 bg-orange-500 text-white px-3 py-2 rounded text-sm hover:bg-orange-600 transition"
        >
          🔄 Reset Daily Stock
        </button>

        {loadingProducts && (
          <div className="text-sm text-gray-500">Loading products...</div>
        )}

        {products.map((p: any) => (
          <div
            key={p.id}
            className="flex justify-between items-center py-2 border-b last:border-none"
          >
            <div className="flex flex-col">
              <span className="font-medium">{p.name}</span>
              <span className="text-xs text-gray-500">
                Rp {p.price.toLocaleString()}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditingProduct(p)}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded"
              >
                Edit
              </button>

              <button
                onClick={async () => {
                  const newStock = prompt("Masukkan stock baru:", String(p.stock));
                  if (newStock === null) return;

                  await api.put(`/products/${p.id}/stock?stock=${newStock}`);
                  fetchProducts();
                }}
                className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded"
              >
                Stock
              </button>

              <button
                onClick={async () => {
                  if (!confirm("Yakin ingin hapus produk ini?")) return;
                  await api.delete(`/products/${p.id}`);
                  fetchProducts();
                }}
                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ================= HOURLY SALES + CHART ================= */}
      {period === "daily" && data.hourly_sales && (
        <div className="bg-white p-4 rounded-2xl shadow">
          <h2 className="font-bold mb-3">⏰ Hourly Sales (WIB)</h2>

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
              <span>{toWIBHour(h.hour)}:00</span>
              <span className="font-medium">
                Rp {h.total.toLocaleString()}
              </span>
            </div>
          ))}

          <HourlyChart
            data={data.hourly_sales.map((h: any) => ({
              hour: toWIBHour(h.hour),
              total: h.total,
            }))}
          />
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
            <div className="flex flex-col">
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

              {/* WIB TIME IN LIST */}
              <span className="text-xs text-gray-500">
                {formatWIB(tx.created_at)}
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

      {/* ================= ADD PRODUCT MODAL ================= */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-[95%] max-w-md space-y-4">

            <h2 className="text-xl font-bold">➕ Add Product</h2>

            <input
              type="text"
              placeholder="Nama Produk"
              className="w-full border rounded-lg p-2"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />

            <input
              type="number"
              placeholder="Harga Jual"
              className="w-full border rounded-lg p-2"
              value={newPrice}
              onChange={(e) => setNewPrice(Number(e.target.value))}
            />

            <input
              type="number"
              placeholder="Harga Modal"
              className="w-full border rounded-lg p-2"
              value={newCostPrice}
              onChange={(e) => setNewCostPrice(Number(e.target.value))}
            />

            {!newUnlimited && (
              <input
                type="number"
                placeholder="Stock"
                className="w-full border rounded-lg p-2"
                value={newStock}
                onChange={(e) => setNewStock(Number(e.target.value))}
              />
            )}

            {/* 🔥 CATEGORY */}
            <select
              className="w-full border rounded-lg p-2"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            >
              <option value="drink">Drink</option>
              <option value="food">Food</option>
              <option value="other">Other</option>
            </select>

            {/* 🔥 LOYALTY POINT */}
            <input
              type="number"
              placeholder="Point per item (0 = no point)"
              className="w-full border rounded-lg p-2"
              value={newPointValue}
              onChange={(e) =>
                setNewPointValue(e.target.value === "" ? "" : Number(e.target.value))
              }
              min={0}
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newUnlimited}
                onChange={(e) => setNewUnlimited(e.target.checked)}
              />
              <span className="text-sm">Unlimited Stock</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddProduct(false)}
                className="flex-1 border py-2 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleAddProduct}
                disabled={savingProduct}
                className="flex-1 bg-black text-white py-2 rounded-lg disabled:opacity-50"
              >
                {savingProduct ? "Saving..." : "Save Product"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= EDIT PRODUCT MODAL ================= */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-[95%] max-w-md space-y-4">

            <h2 className="text-xl font-bold">✏ Edit Product</h2>

            <input
              type="text"
              className="w-full border rounded-lg p-2"
              value={editingProduct.name}
              onChange={(e) =>
                setEditingProduct({ ...editingProduct, name: e.target.value })
              }
            />

            <input
              type="number"
              className="w-full border rounded-lg p-2"
              value={editingProduct.price}
              onChange={(e) =>
                setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
              }
            />

            <input
              type="number"
              className="w-full border rounded-lg p-2"
              value={editingProduct.cost_price}
              onChange={(e) =>
                setEditingProduct({ ...editingProduct, cost_price: Number(e.target.value) })
              }
            />

            {/* 🔥 CATEGORY */}
            <select
              className="w-full border rounded-lg p-2"
              value={editingProduct.category || "drink"}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  category: e.target.value,
                })
              }
            >
              <option value="drink">Drink</option>
              <option value="food">Food</option>
              <option value="other">Other</option>
            </select>

            {/* 🔥 LOYALTY POINT */}
            <input
              type="number"
              className="w-full border rounded-lg p-2"
              value={editingProduct.loyalty_point_value ?? 1}
              min={0}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  loyalty_point_value: Number(e.target.value),
                })
              }
            />

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 border py-2 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  await api.put(`/products/${editingProduct.id}`, editingProduct);
                  setEditingProduct(null);
                  fetchProducts();
                }}
                className="flex-1 bg-black text-white py-2 rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ==============================
   SIMPLE BAR CHART (NO LIBRARY)
============================== */
function HourlyChart({ data }: any) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data.map((d: any) => d.total));

  return (
    <div className="flex items-end gap-2 h-40 mt-6">
      {data.map((d: any, i: number) => {
        const height = max ? (d.total / max) * 100 : 0;

        return (
          <div key={i} className="flex flex-col items-center flex-1">
            <div
              className="w-full bg-black rounded-t"
              style={{ height: `${height}%` }}
            />
          </div>
        );
      })}
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