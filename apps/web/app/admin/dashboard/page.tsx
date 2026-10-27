"use client";

import React from "react";
import { AdminLayout } from "@repo/ui/admin-layout";
import {
  Users,
  Play,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-syne font-bold tracking-tight">
            Platform Overview
          </h1>
          <div className="text-xs text-[#666] tracking-widest uppercase bg-white/5 border border-white/10 px-4 py-2 rounded-lg">
            Live Updates: ACTIVE
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AdminStat
            label="Total Users"
            value="2,481,204"
            trend="+12% this month"
            icon={<Users />}
          />
          <AdminStat
            label="Active Reels"
            value="12,402"
            trend="+4% this week"
            icon={<Play />}
          />
          <AdminStat
            label="Verified Creators"
            value="184,201"
            trend="+2.1k today"
            icon={<ShieldCheck />}
          />
          <AdminStat
            label="Platform Revenue"
            value="$1.2M"
            trend="+8% this month"
            icon={<TrendingUp />}
          />
        </div>

        {/* Recent Activity & Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[32px] p-8 space-y-6">
            <h3 className="text-sm font-bold tracking-widest text-[#666] uppercase">
              Recent Content Reports
            </h3>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-white/10 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">
                        Inappropriate Content Report
                      </div>
                      <div className="text-[10px] text-[#666]">
                        Reported by @user402 · 12 mins ago
                      </div>
                    </div>
                  </div>
                  <button className="text-[10px] font-bold tracking-widest uppercase hover:text-white transition-colors">
                    Review
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 space-y-6">
            <h3 className="text-sm font-bold tracking-widest text-[#666] uppercase">
              System Health
            </h3>
            <div className="space-y-6">
              <HealthItem label="API Response" status="99.9%" />
              <HealthItem label="DB Load" status="12%" />
              <HealthItem label="Redis Cache" status="84% Hit" />
              <HealthItem label="AI Engine" status="Healthy" />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function AdminStat({
  label,
  value,
  trend,
  icon,
}: {
  label: string;
  value: string;
  trend: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-4">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-[#666]">
          {React.cloneElement(icon as React.ReactElement<any>, {
            className: "w-5 h-5",
          })}
        </div>
        <ArrowUpRight className="w-4 h-4 text-green-500" />
      </div>
      <div>
        <div className="text-3xl font-syne font-bold tracking-tight">
          {value}
        </div>
        <div className="text-xs text-[#666]">{label}</div>
      </div>
      <div className="text-[10px] text-green-500/80 font-bold tracking-wider uppercase">
        {trend}
      </div>
    </div>
  );
}

function HealthItem({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-xs text-[#666] uppercase tracking-widest">
        {label}
      </div>
      <div className="text-sm font-bold">{status}</div>
    </div>
  );
}
