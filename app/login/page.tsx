"use client";

import { useState } from "react";
import { api } from "../lib/api";
import SukooLogo from "../components/SukooLogo";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    if (!username || !password) {
      setError("Username dan password wajib diisi");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const body = new URLSearchParams();
      body.append("username", username);
      body.append("password", password);

      const res = await api.post("/auth/login", body, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (!res.data || !res.data.access_token) {
        setError("Token tidak ditemukan dari server");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", res.data.access_token);

      if (res.data.role) {
        localStorage.setItem("role", res.data.role);
      }

      if (res.data.role === "owner") {
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/pos";
      }

    } catch (err: any) {
      if (err.response) {
        setError(err.response.data?.detail || "Login gagal");
      } else {
        setError("Tidak bisa terhubung ke server");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#173f2d] px-5 py-8 sm:px-8">
      <div className="absolute -left-24 -top-20 size-72 rounded-full bg-[#d7a86e]/20 blur-3xl" />
      <div className="absolute -bottom-28 -right-20 size-80 rounded-full bg-[#8cab91]/20 blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100dvh-4rem)] max-w-5xl items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
        <section className="hidden text-[#f8f4eb] lg:block">
          <div className="mb-8 flex h-20 w-52 items-center rounded-2xl bg-white/10 px-5 ring-1 ring-white/15">
            <SukooLogo light priority className="w-full" />
          </div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-[#d7c7a9]">
            Sukoo Coffee
          </p>
          <h1 className="max-w-xl text-5xl font-semibold leading-[1.08] tracking-tight">
            Seduh rasa,
            <br />
            nikmati cerita.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-white/65">
            Ruang kerja sederhana untuk melayani pelanggan, memantau stok,
            dan menjaga setiap transaksi tetap rapi.
          </p>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="app-card rounded-[28px] p-6 sm:p-8">
            <div className="mb-8">
              <div className="mb-5 flex h-14 w-36 items-center rounded-2xl bg-[#173f2d] px-3.5 lg:hidden">
                <SukooLogo light priority className="w-full" />
              </div>
              <p className="text-sm font-medium text-[#8b5e3c]">Selamat datang</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight text-[#1f2922]">
                Masuk ke Sukoo POS
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#6f746f]">
                Gunakan akun kasir atau owner untuk melanjutkan.
              </p>
            </div>

            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                login();
              }}
            >
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Username</span>
                <input
                  className="field px-4"
                  placeholder="Masukkan username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">Password</span>
                <input
                  type="password"
                  className="field px-4"
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </label>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                className="flex min-h-12 w-full items-center justify-center rounded-[14px] bg-[#173f2d] px-4 font-semibold text-white transition hover:bg-[#0e2d1f] disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={loading}
              >
                {loading ? "Sedang masuk..." : "Masuk"}
              </button>
            </form>

            <div className="mt-7 flex items-center gap-3 text-xs text-[#8c8f8b]">
              <span className="h-px flex-1 bg-[#e4dfd4]" />
              Point of Sale
              <span className="h-px flex-1 bg-[#e4dfd4]" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
