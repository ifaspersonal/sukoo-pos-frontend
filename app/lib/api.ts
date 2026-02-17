import axios from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

export const api = axios.create({
  baseURL,
  timeout: 10000, // 10 detik biar tidak nge-hang
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * REQUEST INTERCEPTOR
 * - Inject JWT
 * - Pastikan trailing slash supaya tidak 307 redirect
 */
api.interceptors.request.use(
  (config) => {
    // 🔐 Inject token hanya di browser
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // 🔧 Hindari 307 karena missing trailing slash
    if (config.url && !config.url.endsWith("/")) {
      config.url = config.url + "/";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR
 * - Handle 401 auto logout
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }

    console.error("API ERROR:", error);
    return Promise.reject(error);
  }
);