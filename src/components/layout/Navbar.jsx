import { Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";

const pageTitles = {
  "/dashboard": "Dashboard",
  "/projects": "Projects",
  "/tasks": "Tasks",
  "/users": "Team Members",
  "/profile": "My Profile",
};

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth();
  const location = useLocation();

  const title =
    Object.entries(pageTitles).find(([path]) =>
      location.pathname.startsWith(path)
    )?.[1] || "TaskFlow";

  return (
    <header className="h-16 bg-[#13131f]/80 backdrop-blur-md border-b border-white/5 flex items-center px-4 md:px-6 gap-4 flex-shrink-0">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-slate-400 hover:text-white transition"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Page title */}
      <h1 className="text-white font-semibold text-lg flex-shrink-0">{title}</h1>



      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">

        {/* Avatar */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block">
            <p className="text-white text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-slate-500 text-xs capitalize mt-0.5">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
