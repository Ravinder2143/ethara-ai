import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Server responded with an error status
    if (err.response) {
      const msg = err.response.data?.message || "Something went wrong";
      if (err.response.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
      }
      toast.error(msg);
    } else if (err.request) {
      // Request was made but no response (server unreachable)
      toast.error("Cannot connect to server – is the backend running?");
    } else {
      toast.error("Something went wrong");
    }
    return Promise.reject(err);
  }
);

export default api;
