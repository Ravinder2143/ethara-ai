import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { User, Mail, Shield, Save } from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/auth/profile");
        setValue("name", data.name);
        setValue("email", data.email);
      } catch (error) {
        toast.error("Failed to load profile");
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, [setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = { name: data.name, email: data.email };
      if (data.password) {
        payload.password = data.password;
      }
      const res = await api.put("/auth/profile", payload);
      // Update the AuthContext with new user details and token
      login(res.data.user, res.data.token);
      toast.success("Profile updated successfully! 🎉");
    } catch (err) {
      // Handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="text-slate-400 animate-pulse">Loading profile...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">My Profile</h2>
        <p className="text-slate-400 text-sm mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="bg-[#1a1a2e]/80 border border-white/5 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/20">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{user?.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">
                <Shield className="w-3 h-3" />
                <span className="capitalize">{user?.role}</span>
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" /> Full Name
            </label>
            <input
              type="text"
              className={`w-full bg-white/5 border ${
                errors.name ? "border-red-500" : "border-white/10"
              } rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition`}
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-500" /> Email Address
            </label>
            <input
              type="email"
              className={`w-full bg-white/5 border ${
                errors.email ? "border-red-500" : "border-white/10"
              } rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition`}
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">New Password (Optional)</label>
            <input
              type="password"
              placeholder="Leave blank to keep current password"
              className={`w-full bg-white/5 border ${
                errors.password ? "border-red-500" : "border-white/10"
              } rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition`}
              {...register("password", {
                minLength: { value: 6, message: "Min 6 characters" },
              })}
            />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-500/25"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
