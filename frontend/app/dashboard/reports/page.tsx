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
                    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                    <p className="text-zinc-500 font-medium animate-pulse">Generating your reports...</p>
                </div>
            </DashboardLayout>
        );
    }

    const totalBikes = stats ? Object.values(stats.brand_distribution).reduce((a, b) => a + b, 0) : 0;

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-10 py-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-wider border border-indigo-500/20">
                            <TrendingUp size={14} />
                            Platform Analytics
                        </div>
                        <h1 className="text-4xl font-extrabold text-white tracking-tight">Financial Overview</h1>
                        <p className="text-zinc-500 max-w-md">Real-time breakdown of your service platform&apos;s performance and growth metrics.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-sm font-medium">
                            <Calendar size={18} className="text-zinc-400" />
                            Last 30 Days
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-400 transition-all text-sm font-bold shadow-lg shadow-indigo-500/25">
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
                        color="indigo"
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
                        color="amber"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Status Distribution Chart-like visualization */}
                    <div className="lg:col-span-2 p-8 bg-zinc-900/50 border border-white/5 rounded-[32px] space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-white">Service Distribution</h3>
                                <p className="text-zinc-500 text-sm">Breakdown of orders by current status</p>
                            </div>
                            <PieChart className="text-zinc-600" />
                        </div>

                        <div className="space-y-6 pt-4">
                            {stats && Object.entries(stats.status_distribution).map(([status, count]) => (
                                <div key={status} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-400 font-medium capitalize">{status}</span>
                                        <span className="text-white font-bold">{count} orders</span>
                                    </div>
                                    <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
                                            style={{ width: `${(count / stats.total_orders) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Side Card */}
                    <div className="p-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[32px] text-white space-y-6 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 blur-[80px] rounded-full"></div>
                        <div className="relative z-10 space-y-6">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
                                <TrendingUp size={24} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">Revenue Goal</h3>
                                <p className="text-indigo-100/70 text-sm">You&apos;re at 82% of your monthly target. Keep it up!</p>
                            </div>
                            <div className="pt-4">
                                <div className="text-4xl font-black mb-4 tracking-tight">฿{stats && (stats.total_revenue).toLocaleString()} <span className="text-lg opacity-40 font-normal">/ ฿50k</span></div>
                                <div className="h-3 bg-black/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-white rounded-full w-[82%]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Brand Distribution */}
                <div className="p-8 bg-zinc-900/50 border border-white/5 rounded-[32px] space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-white">Market Share by Brand</h3>
                            <p className="text-zinc-500 text-sm">Distribution of registered motorcycles in the system</p>
                        </div>
                        <BarChart3 className="text-zinc-600" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
                        {stats && Object.entries(stats.brand_distribution).map(([brand, count]) => (
                            <div key={brand} className="p-6 bg-white/5 rounded-[24px] border border-white/5 space-y-4">
                                <div className="flex items-center justify-between shadow-inner">
                                    <span className="text-lg font-bold text-white capitalize">{brand}</span>
                                    <span className="text-xs font-bold px-2 py-1 bg-white/5 rounded-lg text-indigo-400">
                                        {((count / totalBikes) * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-3xl font-black text-white">{count}</p>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Vehicles</p>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 transition-all duration-300"
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
        emerald: "text-emerald-400 bg-emerald-400/10",
        indigo: "text-indigo-400 bg-indigo-400/10",
        purple: "text-purple-400 bg-purple-400/10",
        amber: "text-amber-400 bg-amber-400/10",
    };

    return (
        <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-[28px] hover:border-white/10 transition-all group">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${colors[color]}`}>
                    {icon}
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg bg-white/5 ${change.startsWith("+") ? "text-emerald-400" : "text-amber-400"}`}>
                    {change}
                </span>
            </div>
            <div className="space-y-1">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{title}</p>
                <p className="text-3xl font-black text-white tracking-tight leading-none pt-1">{value}</p>
            </div>
        </div>
    );
}
