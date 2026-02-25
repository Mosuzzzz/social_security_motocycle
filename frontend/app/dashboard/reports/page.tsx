"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";
import {
    TrendingUp,
    Users,
    Bike,
    DollarSign,
    ArrowUpRight,
    PieChart,
    Calendar,
    Filter,
    BarChart3
} from "lucide-react";

interface Stats {
    total_revenue: number;
    total_orders: number;
    total_users: number;
    status_distribution: Record<string, number>;
    brand_distribution: Record<string, number>;
}

export default function ReportsPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await apiFetch("/api/stats");
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch statistics", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <div className="w-12 h-12 border-4 border-[#004B7E]/20 border-t-[#004B7E] rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Generating your reports...</p>
                </div>
            </DashboardLayout>
        );
    }

    const totalBikes = stats ? Object.values(stats.brand_distribution).reduce((a, b) => a + b, 0) : 0;

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-10 pt-4 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#004B7E]/5 text-[#004B7E] text-[10px] font-black uppercase tracking-wider border border-[#004B7E]/10">
                            <TrendingUp size={14} />
                            Platform Analytics
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-800 uppercase tracking-tighter">
                            Financial Overview
                        </h1>
                        <p className="text-slate-400 font-bold text-sm max-w-md">Real-time breakdown of your service platform&apos;s performance and growth metrics.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm">
                            <Calendar size={18} className="text-slate-400" />
                            Last 30 Days
                        </button>
                        <button className="flex items-center gap-2 px-6 py-3 bg-[#004B7E] text-white rounded-xl hover:bg-[#003a61] transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#004B7E]/20">
                            <Filter size={18} />
                            Generate CSV
                        </button>
                    </div>
                </div>

                {/* Main Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Total Revenue"
                        value={`฿${stats?.total_revenue.toLocaleString()}`}
                        change="+12.5%"
                        icon={<DollarSign size={24} />}
                        color="emerald"
                    />
                    <MetricCard
                        title="Active Orders"
                        value={stats?.total_orders.toString() || "0"}
                        change="+4"
                        icon={<Bike size={24} />}
                        color="blue"
                    />
                    <MetricCard
                        title="Registered Users"
                        value={stats?.total_users.toString() || "0"}
                        change="+18"
                        icon={<Users size={24} />}
                        color="purple"
                    />
                    <MetricCard
                        title="Conversion Rate"
                        value="64.2%"
                        change="+2.1%"
                        icon={<ArrowUpRight size={24} />}
                        color="gold"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Status Distribution Chart-like visualization */}
                    <div className="lg:col-span-2 p-10 bg-white border border-slate-100 rounded-4xl space-y-10 shadow-xl">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Service Distribution</h3>
                                <p className="text-slate-400 font-bold text-sm">Breakdown of orders by current status</p>
                            </div>
                            <PieChart className="text-slate-300" />
                        </div>

                        <div className="space-y-8 pt-4">
                            {stats && Object.entries(stats.status_distribution).map(([status, count]) => (
                                <div key={status} className="space-y-3">
                                    <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                                        <span className="text-slate-400">{status}</span>
                                        <span className="text-[#004B7E]">{count} orders</span>
                                    </div>
                                    <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#004B7E] to-[#007AFF] rounded-full transition-all duration-1500 ease-out"
                                            style={{ width: `${(count / stats.total_orders) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Side Card */}
                    <div className="p-10 bg-[#004B7E] rounded-4xl text-white space-y-8 relative overflow-hidden shadow-2xl group">
                        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/10 blur-[80px] rounded-full group-hover:scale-110 transition-transform duration-700"></div>
                        <div className="relative z-10 space-y-8">
                            <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10">
                                <TrendingUp size={28} className="text-[#FFD700]" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black uppercase tracking-tight">Revenue Goal</h3>
                                <p className="text-white/60 font-bold text-sm leading-relaxed">You&apos;re at 82% of your monthly target. Keep it up!</p>
                            </div>
                            <div className="pt-4">
                                <div className="text-4xl font-black mb-6 tracking-tighter">฿{stats && (stats.total_revenue).toLocaleString()} <span className="text-lg opacity-40 font-normal tracking-normal ml-2">/ ฿50k</span></div>
                                <div className="h-4 bg-black/20 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-[#FFD700] rounded-full w-[82%] shadow-lg shadow-[#FFD700]/20"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Brand Distribution */}
                <div className="p-10 bg-white border border-slate-100 rounded-4xl space-y-10 shadow-xl">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Market Share by Brand</h3>
                            <p className="text-slate-400 font-bold text-sm">Distribution of registered motorcycles in the system</p>
                        </div>
                        <BarChart3 className="text-slate-300" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
                        {stats && Object.entries(stats.brand_distribution).map(([brand, count]) => (
                            <div key={brand} className="p-8 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-6 hover:bg-white hover:shadow-xl transition-all group">
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-black text-slate-800 uppercase tracking-tight">{brand}</span>
                                    <span className="text-[10px] font-black px-3 py-1 bg-[#004B7E]/5 rounded-lg text-[#004B7E] uppercase tracking-widest ring-1 ring-[#004B7E]/10">
                                        {((count / totalBikes) * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-3xl font-black text-[#004B7E] tracking-tighter">{count}</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Vehicles Registered</p>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#004B7E] transition-all duration-1000"
                                        style={{ width: `${(count / totalBikes) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function MetricCard({ title, value, change, icon, color }: any) {
    const colors: any = {
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        purple: "text-purple-600 bg-purple-50 border-purple-100",
        gold: "text-[#004B7E] bg-[#FFD700]/10 border-[#FFD700]/20",
    };

    return (
        <div className="p-8 bg-white border border-slate-100 rounded-4xl hover:shadow-2xl transition-all group shadow-xl">
            <div className="flex items-center justify-between mb-6">
                <div className={`p-4 rounded-2xl border ${colors[color]} shadow-sm`}>
                    {icon}
                </div>
                <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${change.startsWith("+") ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                    {change}
                </span>
            </div>
            <div className="space-y-2">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{title}</p>
                <p className="text-3xl font-black text-slate-800 tracking-tighter leading-none pt-1">{value}</p>
            </div>
        </div>
    );
}
