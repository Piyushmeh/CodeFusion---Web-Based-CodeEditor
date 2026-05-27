import { Link, useLocation, useSearchParams } from "react-router-dom";

import {
  FolderKanban,
  Users,
  Code2,
  Star,
  LayoutDashboard,
  Settings,
  Sparkles,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import Logo from "./Logo";

const navItems = [
  { to: "/", icon: FolderKanban, label: "Projects", key: "projects" },

  { to: "/codes", icon: Code2, label: "All Codes", key: "codes" },

  { to: "/teams", icon: Users, label: "Teams", key: "teams" },

  { to: "/?filter=starred", icon: Star, label: "Starred", key: "starred" },

  {
    to: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    key: "dashboard",
  },
];

const Sidebar = ({ projectCount = 0 }) => {
  const { user } = useAuth();

  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const isStarred =
    pathname === "/" && searchParams.get("filter") === "starred";

  const isActive = (key) => {
    switch (key) {
      case "projects":
        return pathname === "/" && !isStarred;

      case "codes":
        return pathname === "/codes";

      case "teams":
        return pathname === "/teams";

      case "starred":
        return isStarred;

      case "dashboard":
        return pathname === "/dashboard";

      default:
        return false;
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen overflow-hidden bg-zinc-950/80 border-r border-zinc-800/80 shrink-0">
      <div className="p-4 shrink-0">
        <Logo />
      </div>

      <nav className="px-4 space-y-1 shrink-0 mt-1">
        {navItems.map(({ to, icon: Icon, label, key }) => {
          const active = isActive(key);

          return (
            <Link
              key={key}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                active
                  ? "bg-violet-600/20 text-violet-400 border border-violet-500/30"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <Icon className="w-5 h-5" />

              {label}

              {key === "projects" && projectCount > 0 && (
                <span className="ml-auto bg-violet-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {projectCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wide px-5 mb-1.5 mt-4 shrink-0">
        Account
      </p>

      <div className="px-4 shrink-0">
        <Link
          to="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
            pathname === "/settings"
              ? "bg-violet-600/20 text-violet-400"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          }`}
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
      </div>

      <div className="mt-auto p-4 space-y-3 shrink-0 border-t border-zinc-800/80">
        <div className="glass-card p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />

            <p className="text-[11px] font-medium text-zinc-300">
              Upgrade to Pro
            </p>
          </div>

          <p className="text-[10px] text-zinc-500 leading-tight">
            Unlimited projects
          </p>

          <Link
            to="/pricing"
            className="mt-2 w-full py-1 px-2 rounded-md text-[10px] font-medium bg-violet-600 hover:bg-violet-500 text-white transition text-center block"
          >
            Upgrade
          </Link>
        </div>

        <Link
          to="/settings"
          className="flex items-center gap-3 px-1 py-2 rounded-lg hover:bg-zinc-800/50 transition"
        >
          <img
            src={
              user?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=7c3aed&color=fff`
            }
            alt=""
            className="w-9 h-9 rounded-full object-cover border border-violet-500/30"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.name}
            </p>
            <p className="text-xs text-zinc-500">Free Plan</p>
          </div>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
