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
    const [days, setDays] = useState<number | null>(30);

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            try {
                const url = days ? `/api/stats?days=${days}` : "/api/stats";
                const data = await apiFetch(url);
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch statistics", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [days]);

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
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                            <select
                                id="report-time-filter"
                                value={days?.toString() || "all"}
                                onChange={(e) => setDays(e.target.value === "all" ? null : parseInt(e.target.value))}
                                className="pl-12 pr-10 py-3 bg-white border border-slate-100 rounded-xl outline-none focus:border-[#004B7E]/30 focus:shadow-lg transition-all text-[10px] font-black uppercase tracking-widest shadow-sm appearance-none cursor-pointer"
                            >
                                <option value="7">Last 7 Days</option>
                                <option value="30">Last 30 Days</option>
                                <option value="90">Last 90 Days</option>
                                <option value="all">All Time</option>
                            </select>
                        </div>

                        <button
                            id="generate-csv-btn"
                            onClick={() => {
                                if (!stats) return;
                                let csvContent = "data:text/csv;charset=utf-8,"
                                    + "Analysis Category,Data Point,Metric Value\n"
                                    + "Financial Overview,Total Revenue," + stats.total_revenue + "\n"
                                    + "Order Metrics,Total Orders," + stats.total_orders + "\n"
                                    + "User Metrics,Total Registered Users," + stats.total_users + "\n";

                                Object.entries(stats.status_distribution).forEach(([status, count]) => {
                                    csvContent += `Order Status Breakdown,${status},${count}\n`;
                                });

                                const encodedUri = encodeURI(csvContent);
                                const link = document.createElement("a");
                                link.setAttribute("href", encodedUri);
                                link.setAttribute("download", `performance_report_${days || 'full_term'}.csv`);
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-[#004B7E] text-white rounded-xl hover:bg-[#003a61] transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#004B7E]/20"
                        >
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
                        icon={<DollarSign size={24} />}
                        color="emerald"
                    />
                    <MetricCard
                        title="Active Orders"
                        value={stats?.total_orders.toString() || "0"}
                        icon={<Bike size={24} />}
                        color="blue"
                    />
                    <MetricCard
                        title="Registered Users"
                        value={stats?.total_users.toString() || "0"}
                        icon={<Users size={24} />}
                        color="purple"
                    />
                    <MetricCard
                        title="Conversion Rate"
                        value="64.2"
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
                                            className="h-full bg-linear-to-r from-[#004B7E] to-[#007AFF] rounded-full transition-all duration-1500 ease-out"
                                            style={{ width: `${stats.total_orders > 0 ? (count / stats.total_orders) * 100 : 0}%` }}
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
                                <p className="text-white/60 font-bold text-sm leading-relaxed">
                                    {stats && (stats.total_revenue >= 50000
                                        ? "Congratulations! You've hit your monthly target!"
                                        : `Progressing towards your primary ฿50k monthly goal.`)}
                                </p>
                            </div>
                            <div className="pt-4">
                                <div className="text-4xl font-black mb-6 tracking-tighter">฿{stats && (stats.total_revenue).toLocaleString()} <span className="text-lg opacity-40 font-normal tracking-normal ml-2">/ ฿50k</span></div>
                                <div className="h-4 bg-black/20 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className="h-full bg-[#FFD700] rounded-full shadow-lg shadow-[#FFD700]/20 transition-all duration-1000"
                                        style={{ width: `${stats ? Math.min((stats.total_revenue / 50000) * 100, 100) : 0}%` }}
                                    ></div>
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

interface MetricCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: "emerald" | "blue" | "purple" | "gold";
}

function MetricCard({ title, value, icon, color }: MetricCardProps) {
    const colors: Record<string, string> = {
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
            </div>
            <div className="space-y-2">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{title}</p>
                <p className="text-3xl font-black text-slate-800 tracking-tighter leading-none pt-1">{value}</p>
            </div>
        </div>
    );
}
