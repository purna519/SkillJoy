"use client";

import React from "react";
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  BarChart3,
  Globe,
  LogOut,
  Settings,
  Database,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const menuItems = [
    { name: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Content", href: "/admin/moderation", icon: ShieldAlert },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "System", href: "/admin/system", icon: Database },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 flex flex-col p-6 bg-black">
        <div className="font-syne font-extrabold text-xl tracking-tighter mb-10 flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-black rounded-sm" />
          </div>
          Skill<span className="opacity-40">Admin</span>
        </div>

        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${isActive ? "bg-white/10 text-white border border-white/10" : "text-[#666] hover:text-white hover:bg-white/5"}
                `}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-white/5 space-y-1">
          <Link
            href="/admin/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#666] hover:text-white transition-all"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Settings</span>
          </Link>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500/60 hover:text-red-500 transition-all">
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-10 bg-gradient-to-br from-black to-white/[0.02]">
        {children}
      </main>
    </div>
  );
};
