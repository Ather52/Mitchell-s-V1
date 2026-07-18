import axios from "axios";
import toast from "react-hot-toast";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && !config.url?.includes("/auth/")) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
axiosInstance.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (
      typeof data === "string" &&
      data.trimStart().startsWith("<!")
    ) {
      const msg =
        "API URL misconfigured. Set VITE_BASE_URL in frontend/.env and rebuild.";
      toast.error(msg);
      return Promise.reject(new Error(msg));
    }
    return response;
  },
  (error) => {
    if (!error.response) {
      toast.error("Network error. Please check your connection.");
      return Promise.reject("Network Error");
    }
    const { status, config } = error.response;
    if (config.url?.includes("/auth/")) {
      return Promise.reject(
        error.response?.data?.detail || "Authentication request failed"
      );
    }
    if (status === 401 && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      toast.error("Session expired. Please login again.");
      setTimeout(() => {
        window.location.href = "/signin";
      }, 1e3);
    }
    if (status === 403) {
      toast.error("You are not authorized.");
    }
    if (status >= 500) {
      toast.error("Server error. Please try again later.");
    }
    return Promise.reject(error.response?.data?.detail || error.message);
  }
);
var stdin_default = axiosInstance;
export {
  stdin_default as default
};
