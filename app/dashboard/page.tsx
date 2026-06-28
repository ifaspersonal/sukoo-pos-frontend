"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { LogOutIcon } from "../components/Icons";
import SukooLogo from "../components/SukooLogo";

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

const formatPercent = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "Baru";
  return `${value > 0 ? "+" : ""}${value}%`;
};

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [period, setPeriod] = useState<Period>("daily");
  const [loading, setLoading] = useState(true);
  const [branchId, setBranchId] = useState<number | "">("");
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
  const [newBranchId, setNewBranchId] = useState<number | "">("");
  const [stockModalProduct, setStockModalProduct] = useState<any>(null);
  const [newStockValue, setNewStockValue] = useState<number | "">("");
  const [materials, setMaterials] = useState<any[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [newMaterialName, setNewMaterialName] = useState("");
  const [newMaterialUnit, setNewMaterialUnit] = useState("gram");
  const [newMaterialBranchId, setNewMaterialBranchId] = useState<number | "">("");
  const [newMaterialParStock, setNewMaterialParStock] = useState<number | "">("");
  const [newMaterialThreshold, setNewMaterialThreshold] = useState<number | "">("");
  const [savingMaterial, setSavingMaterial] = useState(false);
  const [recipeModalProduct, setRecipeModalProduct] = useState<any>(null);
  const [recipeRows, setRecipeRows] = useState<Record<number, string>>({});
  const [savingRecipe, setSavingRecipe] = useState(false);

  // ================= PAGINATION =================
  const [productPage, setProductPage] = useState(1);
  const [txPage, setTxPage] = useState(1);
  const itemsPerPage = 5;

  const fetchData = async (selected: Period) => {
    try {
      setLoading(true);

      let url = `/reports?period=${selected}`;

      // 🔥 override date kalau ada
      if (start && end) {
        url = `/reports?start=${start}&end=${end}`;
      }

      // 🔥 inject branch (SELALU terakhir)
      if (branchId) {
        url += `&branch_id=${branchId}`;
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

      let url = "/products";

      if (branchId) {
        url += `?branch_id=${branchId}`;
      }

      const res = await api.get(url);
      setProducts(res.data);

    } catch (err) {
      console.error("Product fetch error", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchInsights = async (selected: Period) => {
    try {
      setLoadingInsights(true);

      let url = `/reports/insights?period=${selected}`;

      if (start && end) {
        url = `/reports/insights?start=${start}&end=${end}`;
      }

      if (branchId) {
        url += `&branch_id=${branchId}`;
      }

      const res = await api.get(url);
      setInsights(res.data);
    } catch (err) {
      console.error("Insight error:", err);
    } finally {
      setLoadingInsights(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      setLoadingMaterials(true);

      let url = "/materials";

      if (branchId) {
        url += `?branch_id=${branchId}`;
      }

      const res = await api.get(url);
      setMaterials(res.data);
    } catch (err) {
      console.error("Material fetch error", err);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const resetMaterialForm = () => {
    setNewMaterialName("");
    setNewMaterialUnit("gram");
    setNewMaterialBranchId("");
    setNewMaterialParStock("");
    setNewMaterialThreshold("");
  };

  const openRecipeEditor = async (product: any) => {
    try {
      const res = await api.get(`/materials/recipes/product/${product.id}`);
      const rows: Record<number, string> = {};

      res.data.items?.forEach((item: any) => {
        rows[item.material_id] = String(item.qty_per_unit);
      });

      setRecipeRows(rows);
      setRecipeModalProduct(product);
    } catch (err) {
      console.error("Recipe fetch error", err);
      alert("Gagal mengambil resep produk");
    }
  };

  const saveRecipe = async () => {
    if (!recipeModalProduct) return;

    const items = Object.entries(recipeRows)
      .map(([materialId, qty]) => ({
        material_id: Number(materialId),
        qty_per_unit: Number(qty || 0),
      }))
      .filter((item) => item.qty_per_unit > 0);

    try {
      setSavingRecipe(true);
      await api.put(`/materials/recipes/product/${recipeModalProduct.id}`, {
        items,
      });
      setRecipeModalProduct(null);
      setRecipeRows({});
      fetchInsights(period);
      alert("Resep takaran tersimpan");
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Gagal menyimpan resep");
    } finally {
      setSavingRecipe(false);
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
        branch_id: newBranchId || branchId || 1, // 🔥 INI DIA
      });

      alert("Produk berhasil ditambahkan");

      setNewName("");
      setNewPrice("");
      setNewCostPrice("");
      setNewStock("");
      setNewUnlimited(false);
      setNewCategory("drink");
      setNewPointValue(1);
      setNewBranchId("");

      setShowAddProduct(false);

      fetchData(period);
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Gagal menambahkan produk");
    } finally {
      setSavingProduct(false);
    }
  };

  const handleAddMaterial = async () => {
    if (!newMaterialName || !newMaterialUnit) {
      alert("Nama bahan dan satuan wajib diisi");
      return;
    }

    const materialBranchId = newMaterialBranchId || branchId;
    if (!materialBranchId) {
      alert("Pilih cabang bahan dulu");
      return;
    }

    try {
      setSavingMaterial(true);

      await api.post("/materials", {
        name: newMaterialName,
        unit: newMaterialUnit,
        branch_id: materialBranchId,
        par_stock:
          newMaterialParStock === "" ? 0 : Number(newMaterialParStock),
        alert_threshold:
          newMaterialThreshold === "" ? 0 : Number(newMaterialThreshold),
        is_active: true,
      });

      alert("Bahan opname berhasil ditambahkan");
      resetMaterialForm();
      setShowAddMaterial(false);
      fetchMaterials();
      fetchInsights(period);
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Gagal menambahkan bahan");
    } finally {
      setSavingMaterial(false);
    }
  };

  // ================= ROLE GUARD =================
  useEffect(() => {
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (role !== "owner") {
      window.location.href = "/pos";
    }
  }, []);

  // ================= LOGOUT =================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  useEffect(() => {
    fetchData(period);
    fetchInsights(period);
  }, [period, branchId, start, end]);

  useEffect(() => {
    fetchProducts();
    fetchMaterials();
  }, [branchId]);
  
  useEffect(() => {
    setTxPage(1);
    setProductPage(1);
  }, [branchId, period, start, end]);


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f1ea] text-[#173f2d]">
        <div className="text-center">
          <div className="mx-auto mb-4 size-10 animate-pulse rounded-2xl bg-[#173f2d]" />
          <p className="text-sm font-semibold">Menyiapkan dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#1f2922]">
      <header className="sticky top-0 z-30 border-b border-[#ddd8cc] bg-[#fffdf8]/90 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-24 items-center rounded-xl bg-[#173f2d] px-2.5">
              <SukooLogo light className="w-full" />
            </div>
            <div>
              <div className="font-bold tracking-tight">Sukoo Coffee</div>
              <div className="text-xs text-[#7a7f7b]">Owner workspace</div>
            </div>
          </div>
          <button
            aria-label="Keluar"
            onClick={handleLogout}
            className="flex min-h-10 items-center gap-2 rounded-full border border-[#ded8cc] bg-white px-3 text-sm font-semibold text-[#5e655f]"
          >
            <LogOutIcon className="size-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 sm:py-7">

      {/* ================= HEADER ================= */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#92775e]">
            Ringkasan bisnis
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Dashboard penjualan
          </h1>
          <p className="mt-1 text-sm text-[#777c77]">
            Pantau performa, produk, dan transaksi seluruh cabang.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (!branchId) {
                alert("Pilih cabang dulu");
                return;
              }
              setShowAddProduct(true);
            }}
            className="min-h-11 rounded-full bg-[#173f2d] px-4 text-sm font-semibold text-white transition hover:bg-[#0e2d1f]"
          >
            + Tambah produk
          </button>
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`min-h-11 rounded-full px-4 text-sm font-semibold transition
                ${
                  period === p
                    ? "bg-[#263129] text-white"
                    : "border border-[#ddd8cc] bg-white text-[#626862]"
                }`}
            >
              {p === "daily" ? "Harian" : p === "weekly" ? "Mingguan" : "Bulanan"}
            </button>
          ))}
        </div>
      </div>

      {/* ================= DATE PICKER ================= */}
      <div className="app-card grid gap-3 rounded-[22px] p-4 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_auto]">
        <select
          value={branchId}
          onChange={(e) =>
            setBranchId(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="field px-3 text-sm"
        >
          <option value="">Semua Cabang</option>
          <option value={1}>Cipinang</option>
          <option value={2}>Cawang</option>
          <option value={3}>BKT</option>
        </select>
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="field px-3 text-sm"
        />
        <input
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="field px-3 text-sm"
        />
        <button
          onClick={() => fetchData(period)}
          className="min-h-12 rounded-[14px] bg-[#173f2d] px-5 text-sm font-semibold text-white"
        >
          Apply
        </button>
      </div>

      <div className="-mt-2 text-xs font-medium text-[#7c817c]">
        Periode {data.start_date} sampai {data.end_date}
      </div>

      {/* ================= KPI ================= */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card title="Pendapatan" value={`Rp ${data.total_revenue.toLocaleString("id-ID")}`} accent />
        <Card title="Profit" value={`Rp ${data.profit.toLocaleString("id-ID")}`} />
        <Card title="Transaksi" value={data.total_transactions} />
        <Card title="Redeem" value={data.redeem_transactions || 0} />
      </div>

      {/* ================= LOYALTY KPI ================= */}
      <div className="grid grid-cols-3 gap-3">
        <Card title="Poin masuk" value={data.total_points_earned || 0} compact />
        <Card title="Poin ditukar" value={data.total_points_redeemed || 0} compact />
        <Card title="Poin net" value={data.net_points || 0} compact />
      </div>

      {/* ================= PAYMENT BREAKDOWN ================= */}
      <div className="grid grid-cols-2 gap-3">
        <Card title="Pembayaran tunai" value={`Rp ${data.cash_total.toLocaleString("id-ID")}`} />
        <Card title="Pembayaran QRIS" value={`Rp ${data.qris_total.toLocaleString("id-ID")}`} />
      </div>

      {/* ================= SALES INSIGHTS ================= */}
      <div className="app-card overflow-hidden rounded-[22px] p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#92775e]">
              Insight evaluasi
            </p>
            <h2 className="mt-1 text-xl font-bold">Sinyal penjualan & operasional</h2>
          </div>
          {loadingInsights && (
            <span className="rounded-full bg-[#f0ece3] px-3 py-1 text-xs font-semibold text-[#7a6754]">
              Memuat insight...
            </span>
          )}
        </div>

        {insights ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <InsightCard
                title="Growth revenue"
                value={formatPercent(insights.summary?.revenue_change_percent)}
                caption={`Vs ${insights.previous_start_date}–${insights.previous_end_date}`}
              />
              <InsightCard
                title="Avg transaksi"
                value={`Rp ${(insights.summary?.average_ticket || 0).toLocaleString("id-ID")}`}
                caption={`${insights.summary?.transactions || 0} transaksi`}
              />
              <InsightCard
                title="Jam ramai"
                value={
                  insights.peak_hour
                    ? `${String(insights.peak_hour.hour).padStart(2, "0")}:00`
                    : "-"
                }
                caption={
                  insights.best_day
                    ? `Hari kuat: ${insights.best_day.day}`
                    : "Belum cukup data"
                }
              />
            </div>

            {insights.recommendations?.length > 0 && (
              <div className="rounded-[18px] border border-[#d7e4d6] bg-[#eef6ee] p-4">
                <h3 className="font-bold text-[#173f2d]">Rekomendasi cepat</h3>
                <div className="mt-2 space-y-2 text-sm text-[#425047]">
                  {insights.recommendations.map((item: string, index: number) => (
                    <div key={index} className="flex gap-2">
                      <span className="mt-0.5 text-[#78a06d]">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-[18px] border border-[#e2ddd2] bg-[#f8f5ef] p-4">
                <h3 className="font-bold">Kontributor produk</h3>
                <div className="mt-3 space-y-3">
                  {insights.top_products?.slice(0, 4).map((product: any) => (
                    <div key={product.id}>
                      <div className="mb-1 flex justify-between gap-3 text-sm">
                        <span className="font-semibold">{product.name}</span>
                        <span>{product.share}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#e3ded4]">
                        <div
                          className="h-full rounded-full bg-[#173f2d]"
                          style={{ width: `${Math.min(product.share, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {insights.top_products?.length === 0 && (
                    <div className="text-sm text-[#7a7f7b]">Belum ada penjualan.</div>
                  )}
                </div>
              </div>

              <div className="rounded-[18px] border border-[#e2ddd2] bg-[#f8f5ef] p-4">
                <h3 className="font-bold">Mix pembayaran</h3>
                <div className="mt-3 space-y-3">
                  {insights.payment_mix?.map((payment: any) => (
                    <div key={payment.method}>
                      <div className="mb-1 flex justify-between gap-3 text-sm">
                        <span className="font-semibold uppercase">{payment.method}</span>
                        <span>{payment.share}% · Rp {payment.total.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#e3ded4]">
                        <div
                          className="h-full rounded-full bg-[#355e81]"
                          style={{ width: `${Math.min(payment.share, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {insights.payment_mix?.length === 0 && (
                    <div className="text-sm text-[#7a7f7b]">Belum ada pembayaran.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-[18px] border border-[#ead7c0] bg-[#fff8ed] p-4">
                <h3 className="font-bold text-[#8a642c]">Produk stok rendah</h3>
                <div className="mt-3 space-y-2">
                  {insights.low_stock_products?.slice(0, 5).map((product: any) => (
                    <div key={product.id} className="flex justify-between rounded-xl bg-white/70 px-3 py-2 text-sm">
                      <span>{product.name}</span>
                      <span className="font-bold">{product.stock} tersisa</span>
                    </div>
                  ))}
                  {insights.low_stock_products?.length === 0 && (
                    <div className="text-sm text-[#7a7f7b]">Stok produk aman.</div>
                  )}
                </div>
              </div>

              <div className="rounded-[18px] border border-[#d7e4d6] bg-[#f4faf4] p-4">
                <h3 className="font-bold text-[#173f2d]">Selisih bahan hari ini</h3>
                <div className="mt-3 space-y-2">
                  {insights.material_variance?.slice(0, 5).map((material: any) => (
                    <div key={material.id} className="flex justify-between rounded-xl bg-white/70 px-3 py-2 text-sm">
                      <span>{material.name}</span>
                      <span className="font-bold">
                        {material.used_qty ?? "-"} {material.unit}
                      </span>
                    </div>
                  ))}
                  {insights.material_variance?.length === 0 && (
                    <div className="text-sm text-[#7a7f7b]">Belum ada data bahan.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[18px] border border-[#d9c6a7] bg-[#fff8ed] p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="font-bold text-[#8a642c]">Kontrol takaran resep</h3>
                  <p className="text-xs text-[#8a7b68]">
                    Bandingkan pemakaian bahan teoritis dari resep menu dengan stok opname aktual.
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#8a7b68]">
                  Actual = stok awal - stok akhir
                </span>
              </div>

              <div className="mt-3 grid gap-2 lg:grid-cols-2">
                {insights.recipe_variance?.slice(0, 6).map((row: any) => (
                  <div key={row.material_id} className="rounded-xl bg-white/75 p-3 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold">{row.material_name}</div>
                        <div className="mt-1 text-xs text-[#7a7f7b]">
                          Standar {row.expected_qty} {row.unit} · Aktual{" "}
                          {row.actual_qty ?? "-"} {row.unit}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          row.status === "over_usage"
                            ? "bg-[#f6e3df] text-[#a24f42]"
                            : row.status === "under_usage"
                            ? "bg-[#e7eef2] text-[#355e81]"
                            : row.status === "ok"
                            ? "bg-[#e2f0e4] text-[#27613f]"
                            : "bg-[#eee8dd] text-[#7a6754]"
                        }`}
                      >
                        {row.status === "over_usage"
                          ? `+${row.variance_percent}%`
                          : row.status === "under_usage"
                          ? `${row.variance_percent}%`
                          : row.status === "ok"
                          ? "Sesuai"
                          : "Butuh opname"}
                      </span>
                    </div>
                    {row.product_breakdown?.length > 0 && (
                      <div className="mt-2 text-xs text-[#8a7b68]">
                        {row.product_breakdown
                          .slice(0, 2)
                          .map((item: any) => `${item.product_name}: ${item.qty_sold} cup`)
                          .join(" · ")}
                      </div>
                    )}
                  </div>
                ))}

                {insights.recipe_variance?.length === 0 && (
                  <div className="rounded-xl bg-white/70 p-4 text-sm text-[#7a7f7b]">
                    Belum ada resep/takaran menu untuk dihitung.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[18px] border border-dashed border-[#d7d1c4] bg-white/40 p-6 text-center text-sm text-[#7a7f7b]">
            Insight belum tersedia.
          </div>
        )}
      </div>

      {/* ================= REVENUE VS PROFIT ================= */}
      {data.trend_sales && (
        <div className="app-card overflow-hidden rounded-[22px] p-4 sm:p-5">

          <h2 className="font-bold mb-3">
            Pendapatan vs profit
          </h2>

          {data.trend_sales.length === 0 && (
            <div className="text-gray-500 text-sm">
              No sales data
            </div>
          )}

          <RevenueProfitChart data={data.trend_sales} />

        </div>
      )}

      {/* ================= PRODUCT SUMMARY ================= */}
      <div className="app-card rounded-[22px] p-4 sm:p-5">
        <h2 className="mb-3 font-bold">Produk terlaris</h2>

        {data.top_products?.length === 0 && (
          <div className="text-gray-500 text-sm">
            No product sales in this period
          </div>
        )}

        {data.top_products?.map((p: any, i: number) => (
          <div
            key={i}
            className="flex justify-between border-b border-[#e8e3d9] py-3 last:border-none"
          >
            <span>{p.name}</span>
            <span className="font-medium">{p.qty} pcs</span>
          </div>
        ))}
      </div>

      {/* ================= MATERIAL MANAGEMENT ================= */}
      <div className="app-card rounded-[22px] p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#92775e]">
              Stok opname
            </p>
            <h2 className="mt-1 font-bold">Manajemen bahan opname</h2>
            <p className="mt-1 text-xs text-[#7a7f7b]">
              Tambahkan jenis bahan yang akan ditimbang kasir setiap stok awal dan stok akhir.
            </p>
          </div>

          <button
            onClick={() => {
              setNewMaterialBranchId(branchId || "");
              setShowAddMaterial(true);
            }}
            className="min-h-10 rounded-full bg-[#173f2d] px-4 text-sm font-semibold text-white"
          >
            + Tambah bahan
          </button>
        </div>

        {loadingMaterials && (
          <div className="text-sm text-gray-500">Loading bahan opname...</div>
        )}

        {!loadingMaterials && materials.length === 0 && (
          <div className="rounded-[18px] border border-dashed border-[#d7d1c4] bg-white/40 p-6 text-center">
            <div className="text-3xl">⚖️</div>
            <p className="mt-2 font-semibold">Belum ada bahan opname</p>
            <p className="mt-1 text-sm text-[#7a7f7b]">
              Klik “Tambah bahan” untuk membuat daftar bahan yang muncul di POS kasir.
            </p>
          </div>
        )}

        <div className="grid gap-3 lg:grid-cols-2">
          {materials.map((material: any) => (
            <div
              key={material.id}
              className="rounded-[18px] border border-[#e2ddd2] bg-[#f8f5ef] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold">{material.name}</div>
                  <div className="mt-1 text-xs text-[#7a7f7b]">
                    Cabang #{material.branch_id} · Satuan {material.unit}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    material.stock_status === "low"
                      ? "bg-[#f6e3df] text-[#a24f42]"
                      : material.stock_status === "ok"
                      ? "bg-[#e2f0e4] text-[#27613f]"
                      : "bg-[#eee8dd] text-[#7a6754]"
                  }`}
                >
                  {material.stock_status === "low"
                    ? "Low"
                    : material.stock_status === "ok"
                    ? "OK"
                    : "Belum opname"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl bg-white/70 p-2">
                  <div className="text-[#7a7f7b]">Stok awal</div>
                  <div className="mt-1 font-bold">
                    {material.latest_opening_qty ?? "-"} {material.unit}
                  </div>
                </div>
                <div className="rounded-xl bg-white/70 p-2">
                  <div className="text-[#7a7f7b]">Stok akhir</div>
                  <div className="mt-1 font-bold">
                    {material.latest_closing_qty ?? "-"} {material.unit}
                  </div>
                </div>
                <div className="rounded-xl bg-white/70 p-2">
                  <div className="text-[#7a7f7b]">Batas min</div>
                  <div className="mt-1 font-bold">
                    {material.alert_threshold || 0} {material.unit}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setEditingMaterial(material)}
                  className="min-h-9 rounded-full bg-[#e7eef2] px-3 text-xs font-semibold text-[#355e81]"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (!confirm("Nonaktifkan bahan ini dari daftar opname?")) return;
                    await api.put(`/materials/${material.id}`, {
                      is_active: false,
                    });
                    fetchMaterials();
                    fetchInsights(period);
                  }}
                  className="min-h-9 rounded-full bg-[#f6e3df] px-3 text-xs font-semibold text-[#a24f42]"
                >
                  Nonaktifkan
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= PRODUCT MANAGEMENT ================= */}
      <div className="app-card rounded-[22px] p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold">Manajemen produk</h2>
          <p className="mt-1 text-xs text-[#7a7f7b]">Kelola harga, stok, dan status menu.</p>
        </div>

        <button
          onClick={async () => {
            if (!confirm("Reset semua stock ke daily stock?")) return;
            let url = "/products/reset-daily-stock";

            if (branchId) {
              url += `?branch_id=${branchId}`;
            }

            await api.post(url);
            fetchProducts();
            alert("Daily stock berhasil direset");
          }}
          className="min-h-10 rounded-full bg-[#a5693d] px-4 text-sm font-semibold text-white"
        >
          Reset stok harian
        </button>
        </div>

        {loadingProducts && (
          <div className="text-sm text-gray-500">Loading products...</div>
        )}

        {products
          .slice((productPage - 1) * itemsPerPage, productPage * itemsPerPage)
          .map((p: any) => (
          <div
            key={p.id}
            className="flex flex-col gap-3 border-b border-[#e8e3d9] py-3 last:border-none sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-col">
              <span className="font-medium">{p.name}</span>
              <span className="text-xs text-gray-500">
                Rp {p.price.toLocaleString()}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setEditingProduct(p)}
                className="min-h-9 rounded-full bg-[#e7eef2] px-3 text-xs font-semibold text-[#355e81]"
              >
                Edit
              </button>

              <button
                onClick={() => openRecipeEditor(p)}
                className="min-h-9 rounded-full bg-[#eef6ee] px-3 text-xs font-semibold text-[#27613f]"
              >
                Resep
              </button>

              <button
                onClick={() => {
                  setStockModalProduct(p);
                  setNewStockValue(p.stock);
                }}
                className="min-h-9 rounded-full bg-[#f3ead9] px-3 text-xs font-semibold text-[#8a642c]"
              >
                Stock
              </button>

              <button
                onClick={async () => {
                  if (!confirm("Yakin ingin hapus produk ini?")) return;
                  await api.delete(`/products/${p.id}`);
                  fetchProducts();
                }}
                className="min-h-9 rounded-full bg-[#f6e3df] px-3 text-xs font-semibold text-[#a24f42]"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {/* PRODUCT PAGINATION */}
        <div className="flex justify-center gap-2 mt-4 text-sm">

          <button
            disabled={productPage === 1}
            onClick={() => setProductPage(productPage - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span className="px-2">
            Page {productPage}
          </span>

          <button
            disabled={productPage * itemsPerPage >= products.length}
            onClick={() => setProductPage(productPage + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>

        </div>
      </div>

      {/* ================= HOURLY SALES + CHART ================= */}
      {period === "daily" && data.hourly_sales && (
        <div className="app-card rounded-[22px] p-4 sm:p-5">
          <h2 className="mb-3 font-bold">Penjualan per jam · WIB</h2>

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
      <div className="app-card rounded-[22px] p-4 sm:p-5">
        <h2 className="mb-3 font-bold">Transaksi terbaru</h2>

        {data.transactions?.length === 0 && (
          <div className="text-gray-500 text-sm">
            No transactions
          </div>
        )}

        {data.transactions
          ?.slice((txPage - 1) * itemsPerPage, txPage * itemsPerPage)
          .map((tx: any) => (
          <div
            key={tx.id}
            className="flex cursor-pointer items-center justify-between border-b border-[#e8e3d9] py-3 transition last:border-none hover:bg-[#f7f4ed]"
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

        {/* TRANSACTION PAGINATION */}
        <div className="flex justify-center gap-2 mt-4 text-sm">

          <button
            disabled={txPage === 1}
            onClick={() => setTxPage(txPage - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span className="px-2">
            Page {txPage}
          </span>

          <button
            disabled={txPage * itemsPerPage >= data.transactions.length}
            onClick={() => setTxPage(txPage + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>

        </div>        
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

            <select
              className="w-full border rounded-lg p-2"
              value={newBranchId}
              onChange={(e) =>
                setNewBranchId(e.target.value === "" ? "" : Number(e.target.value))
              }
            >
              <option value="">Pilih Cabang</option>
              <option value={1}>Cipinang</option>
              <option value={2}>Cawang</option>
              <option value={3}>BKT</option>
            </select>

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

      {/* ================= UPDATE STOCK MODAL ================= */}
      {stockModalProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-[90%] max-w-sm space-y-4">

            <h2 className="text-lg font-bold">
              📦 Update Stock
            </h2>

            <div className="text-sm text-gray-500">
              {stockModalProduct.name}
            </div>

            <input
              type="number"
              className="w-full border rounded-lg p-2"
              value={newStockValue}
              onChange={(e) =>
                setNewStockValue(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              min={0}
            />

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStockModalProduct(null)}
                className="flex-1 border py-2 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  if (newStockValue === "") return;

                  await api.put(
                    `/products/${stockModalProduct.id}/stock?stock=${newStockValue}`
                  );

                  setStockModalProduct(null);
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

      {/* ================= ADD MATERIAL MODAL ================= */}
      {showAddMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#92775e]">
                Stok opname
              </p>
              <h2 className="mt-1 text-xl font-bold">Tambah bahan opname</h2>
              <p className="mt-1 text-sm text-[#7a7f7b]">
                Bahan ini akan muncul di menu Opname kasir sesuai cabang.
              </p>
            </div>

            <select
              className="field px-3 text-sm"
              value={newMaterialBranchId}
              onChange={(e) =>
                setNewMaterialBranchId(e.target.value === "" ? "" : Number(e.target.value))
              }
            >
              <option value="">Pilih Cabang</option>
              <option value={1}>Cipinang</option>
              <option value={2}>Cawang</option>
              <option value={3}>BKT</option>
            </select>

            <input
              type="text"
              placeholder="Nama bahan, contoh: Susu Full Cream"
              className="field px-3 text-sm"
              value={newMaterialName}
              onChange={(e) => setNewMaterialName(e.target.value)}
            />

            <select
              className="field px-3 text-sm"
              value={newMaterialUnit}
              onChange={(e) => setNewMaterialUnit(e.target.value)}
            >
              <option value="gram">gram</option>
              <option value="ml">ml</option>
              <option value="pcs">pcs</option>
              <option value="cup">cup</option>
              <option value="pack">pack</option>
            </select>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min={0}
                placeholder="Stok ideal"
                className="field px-3 text-sm"
                value={newMaterialParStock}
                onChange={(e) =>
                  setNewMaterialParStock(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
              <input
                type="number"
                min={0}
                placeholder="Batas minimum"
                className="field px-3 text-sm"
                value={newMaterialThreshold}
                onChange={(e) =>
                  setNewMaterialThreshold(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setShowAddMaterial(false);
                  resetMaterialForm();
                }}
                className="min-h-12 flex-1 rounded-[14px] border border-[#dcd6ca] bg-white font-semibold"
              >
                Batal
              </button>

              <button
                onClick={handleAddMaterial}
                disabled={savingMaterial}
                className="min-h-12 flex-1 rounded-[14px] bg-[#173f2d] font-semibold text-white disabled:opacity-50"
              >
                {savingMaterial ? "Menyimpan..." : "Simpan bahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT MATERIAL MODAL ================= */}
      {editingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#92775e]">
                Stok opname
              </p>
              <h2 className="mt-1 text-xl font-bold">Edit bahan opname</h2>
            </div>

            <select
              className="field px-3 text-sm"
              value={editingMaterial.branch_id}
              onChange={(e) =>
                setEditingMaterial({
                  ...editingMaterial,
                  branch_id: Number(e.target.value),
                })
              }
            >
              <option value={1}>Cipinang</option>
              <option value={2}>Cawang</option>
              <option value={3}>BKT</option>
            </select>

            <input
              type="text"
              className="field px-3 text-sm"
              value={editingMaterial.name}
              onChange={(e) =>
                setEditingMaterial({
                  ...editingMaterial,
                  name: e.target.value,
                })
              }
            />

            <select
              className="field px-3 text-sm"
              value={editingMaterial.unit}
              onChange={(e) =>
                setEditingMaterial({
                  ...editingMaterial,
                  unit: e.target.value,
                })
              }
            >
              <option value="gram">gram</option>
              <option value="ml">ml</option>
              <option value="pcs">pcs</option>
              <option value="cup">cup</option>
              <option value="pack">pack</option>
            </select>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min={0}
                className="field px-3 text-sm"
                value={editingMaterial.par_stock ?? 0}
                onChange={(e) =>
                  setEditingMaterial({
                    ...editingMaterial,
                    par_stock: Number(e.target.value),
                  })
                }
              />
              <input
                type="number"
                min={0}
                className="field px-3 text-sm"
                value={editingMaterial.alert_threshold ?? 0}
                onChange={(e) =>
                  setEditingMaterial({
                    ...editingMaterial,
                    alert_threshold: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingMaterial(null)}
                className="min-h-12 flex-1 rounded-[14px] border border-[#dcd6ca] bg-white font-semibold"
              >
                Batal
              </button>

              <button
                onClick={async () => {
                  await api.put(`/materials/${editingMaterial.id}`, {
                    name: editingMaterial.name,
                    unit: editingMaterial.unit,
                    branch_id: editingMaterial.branch_id,
                    par_stock: editingMaterial.par_stock,
                    alert_threshold: editingMaterial.alert_threshold,
                    is_active: true,
                  });
                  setEditingMaterial(null);
                  fetchMaterials();
                  fetchInsights(period);
                }}
                className="min-h-12 flex-1 rounded-[14px] bg-[#173f2d] font-semibold text-white"
              >
                Simpan perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= PRODUCT RECIPE MODAL ================= */}
      {recipeModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[90dvh] w-full max-w-2xl flex-col rounded-2xl bg-white p-6">
            <div className="pr-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#92775e]">
                Resep takaran
              </p>
              <h2 className="mt-1 text-xl font-bold">{recipeModalProduct.name}</h2>
              <p className="mt-1 text-sm text-[#7a7f7b]">
                Isi komposisi bahan untuk 1 cup/menu. Sistem akan mengalikan takaran ini dengan jumlah penjualan.
              </p>
            </div>

            <div className="mt-4 rounded-[18px] border border-[#ead7c0] bg-[#fff8ed] p-3 text-sm text-[#6d5a42]">
              Contoh: kalau 1 cup butuh 20 gram biji kopi dan terjual 10 cup,
              maka standar pemakaian biji kopi = 200 gram.
            </div>

            <div className="mt-4 min-h-0 flex-1 overflow-auto pr-1">
              <div className="space-y-2">
                {materials
                  .filter((material: any) => material.branch_id === recipeModalProduct.branch_id)
                  .map((material: any) => (
                    <label
                      key={material.id}
                      className="grid grid-cols-[1fr_150px] items-center gap-3 rounded-[16px] border border-[#e2ddd2] bg-[#f8f5ef] p-3"
                    >
                      <span>
                        <span className="block font-semibold">{material.name}</span>
                        <span className="mt-1 block text-xs text-[#7a7f7b]">
                          Satuan {material.unit} · Cabang #{material.branch_id}
                        </span>
                      </span>

                      <span className="relative">
                        <input
                          type="number"
                          min={0}
                          inputMode="decimal"
                          placeholder="0"
                          value={recipeRows[material.id] ?? ""}
                          onChange={(e) =>
                            setRecipeRows((prev) => ({
                              ...prev,
                              [material.id]: e.target.value,
                            }))
                          }
                          className="field min-h-12 px-3 pr-14 text-right text-sm"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8b7d6c]">
                          / {material.unit}
                        </span>
                      </span>
                    </label>
                  ))}

                {materials.filter((material: any) => material.branch_id === recipeModalProduct.branch_id).length === 0 && (
                  <div className="rounded-[18px] border border-dashed border-[#d7d1c4] bg-white/40 p-6 text-center text-sm text-[#7a7f7b]">
                    Belum ada bahan untuk cabang produk ini. Tambahkan bahan opname dulu.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setRecipeModalProduct(null);
                  setRecipeRows({});
                }}
                className="min-h-12 flex-1 rounded-[14px] border border-[#dcd6ca] bg-white font-semibold"
              >
                Batal
              </button>

              <button
                onClick={saveRecipe}
                disabled={savingRecipe}
                className="min-h-12 flex-1 rounded-[14px] bg-[#173f2d] font-semibold text-white disabled:opacity-50"
              >
                {savingRecipe ? "Menyimpan..." : "Simpan resep"}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </main>
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

function Card({ title, value, accent = false, compact = false }: any) {
  return (
    <div
      className={`rounded-[20px] border p-4 shadow-[0_12px_32px_rgba(47,55,49,.05)] ${
        accent
          ? "border-[#173f2d] bg-[#173f2d] text-white"
          : "border-[#e1dcd1] bg-[#fffdf8]"
      }`}
    >
      <div className={`text-xs font-semibold ${accent ? "text-white/60" : "text-[#7a7f7b]"}`}>
        {title}
      </div>
      <div className={`${compact ? "text-lg" : "text-xl sm:text-2xl"} mt-2 break-words font-bold tracking-tight`}>
        {value}
      </div>
    </div>
  );
}

function InsightCard({ title, value, caption }: any) {
  return (
    <div className="rounded-[18px] border border-[#e2ddd2] bg-[#fffdf8] p-4">
      <div className="text-xs font-semibold text-[#7a7f7b]">{title}</div>
      <div className="mt-2 text-2xl font-black tracking-tight text-[#173f2d]">
        {value}
      </div>
      <div className="mt-1 text-xs text-[#8a8f89]">{caption}</div>
    </div>
  );
}

function RevenueProfitChart({ data }: any) {

  const [tooltip, setTooltip] = useState<any>(null)

  if (!data || data.length === 0) return null

  const width = 600
  const height = 200
  const padding = 40

  const max = Math.max(
    ...data.map((d: any) => Math.max(d.revenue, d.profit))
  )

  const stepX =
    data.length > 1
      ? (width - padding * 2) / (data.length - 1)
      : 0

  const revenuePoints = data.map((d: any, i: number) => {

    const x = padding + i * stepX

    const y =
      height -
      padding -
      (d.revenue / max) * (height - padding * 2)

    return { x, y, ...d }

  })

  const profitPoints = data.map((d: any, i: number) => {

    const x = padding + i * stepX

    const y =
      height -
      padding -
      (d.profit / max) * (height - padding * 2)

    return { x, y, ...d }

  })

  const revenuePath = revenuePoints
    .map((p: any, i: number) =>
      i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
    )
    .join(" ")

  const profitPath = profitPoints
    .map((p: any, i: number) =>
      i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
    )
    .join(" ")

  return (
    <div className="relative">

      {/* legend */}
      <div className="flex gap-4 text-xs mb-2">

        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-600 rounded"/>
          Revenue
        </div>

        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-600 rounded"/>
          Profit
        </div>

      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-52">

        {/* revenue line */}
        <path
          d={revenuePath}
          fill="none"
          stroke="#16a34a"
          strokeWidth="3"
        />

        {/* profit line */}
        <path
          d={profitPath}
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
        />

        {/* revenue points */}
        {revenuePoints.map((p: any, i: number) => (
          <circle
            key={"r"+i}
            cx={p.x}
            cy={p.y}
            r="5"
            fill="#16a34a"
            onMouseEnter={() =>
              setTooltip({
                ...p,
                type: "Revenue",
                value: p.revenue
              })
            }
            onMouseLeave={() => setTooltip(null)}
          />
        ))}

        {/* profit points */}
        {profitPoints.map((p: any, i: number) => (
          <circle
            key={"p"+i}
            cx={p.x}
            cy={p.y}
            r="5"
            fill="#2563eb"
            onMouseEnter={() =>
              setTooltip({
                ...p,
                type: "Profit",
                value: p.profit
              })
            }
            onMouseLeave={() => setTooltip(null)}
          />
        ))}

        {/* X Axis Labels */}
        {revenuePoints.map((p: any, i: number) => {

          const day = new Date(p.date).toLocaleDateString(
            "id-ID",
            { day: "2-digit", month: "2-digit" }
          )

          return (
            <text
              key={"label"+i}
              x={p.x}
              y={height - 5}
              textAnchor="middle"
              fontSize="10"
              fill="#666"
            >
              {day}
            </text>
          )

        })}

      </svg>

      {tooltip && (
        <div
          className="absolute bg-black text-white text-xs px-2 py-1 rounded"
          style={{
            left: tooltip.x - 40,
            top: tooltip.y - 40
          }}
        >

          {new Date(tooltip.date).toLocaleDateString("id-ID")}

          <br/>

          {tooltip.type}

          <br/>

          Rp {tooltip.value.toLocaleString()}

        </div>
      )}



    </div>
  )
}
