"use client";

import { useState } from "react";
import { api } from "../lib/api";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

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

      console.log("LOGIN RESPONSE:", res.data);

      if (!res.data || !res.data.access_token) {
        setError("Token tidak ditemukan dari server");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", res.data.access_token);

      // 🔥 pakai hard redirect supaya lebih stabil di HP
      window.location.href = "/pos";

    } catch (err: any) {
      console.error("LOGIN ERROR FULL:", err);

      if (err.response) {
        console.error("ERROR RESPONSE:", err.response.data);
        setError(err.response.data?.detail || "Login gagal");
      } else {
        setError("Tidak bisa terhubung ke server");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-stone-100">
      <div className="bg-white p-6 rounded-xl w-80 shadow">
        <h1 className="text-2xl font-bold mb-4 text-center text-black">
          SUKOO POS
        </h1>

        <input
          className="w-full border p-2 mb-2 text-black"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />

        <input
          type="password"
          className="w-full border p-2 mb-3 text-black"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        {error && (
          <div className="text-red-600 text-sm mb-3 text-center">
            {error}
          </div>
        )}

        <button
          className={`w-full p-2 rounded text-white ${
            loading ? "bg-gray-400" : "bg-black"
          }`}
          onClick={login}
          disabled={loading}
        >
          {loading ? "Login..." : "Login"}
        </button>
      </div>
    </div>
  );
}