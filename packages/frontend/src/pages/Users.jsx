import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users as UsersIcon, Shield, ShieldAlert, ArrowRightLeft } from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/api";
import Badge from "../components/ui/Badge";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";

export default function Users() {
  const qc = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get("/users").then((res) => res.data),
  });

  const updateRole = useMutation({
    mutationFn: ({ userId, role }) => api.patch(`/users/${userId}/role`, { role }),
    onSuccess: () => {
      qc.invalidateQueries(["users"]);
      toast.success("User role updated successfully");
    },
  });

  const handleRoleChange = (userId, newRole) => {
    if (userId === currentUser._id) {
      return toast.error("You cannot change your own role!");
    }
    updateRole.mutate({ userId, role: newRole });
  };

  if (isLoading) return <UsersSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Team Members</h2>
          <p className="text-slate-400 text-sm mt-1">Manage user access and roles across the platform.</p>
        </div>
        <div className="flex items-center gap-2 bg-[#1a1a2e]/80 border border-white/5 rounded-xl p-3">
          <UsersIcon className="w-5 h-5 text-indigo-400" />
          <span className="text-white font-semibold">{users.length} Users Total</span>
        </div>
      </div>

      <div className="bg-[#1a1a2e]/60 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-white/5 border-b border-white/5 text-xs uppercase text-slate-300">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Joined At</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-white/[0.02] transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white">{u.name}</div>
                        <div className="text-slate-500 text-xs">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge label={u.role} type={u.role} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {format(new Date(u.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {u._id === currentUser._id ? (
                      <span className="text-xs font-medium text-slate-500 bg-white/5 px-2 py-1 rounded-lg">
                        Current User
                      </span>
                    ) : (
                      <div className="flex justify-end gap-2">
                        {u.role === "member" ? (
                          <button
                            onClick={() => handleRoleChange(u._id, "admin")}
                            className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition"
                          >
                            <Shield className="w-3.5 h-3.5" /> Promote to Admin
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRoleChange(u._id, "member")}
                            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" /> Demote to Member
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UsersSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-white/5 rounded-xl" />
      <div className="bg-white/5 rounded-2xl h-96" />
    </div>
  );
}
