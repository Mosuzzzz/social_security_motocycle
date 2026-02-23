"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
    FileText,
    History,
    CheckCircle2,
    DollarSign,
    Search,
    ChevronRight,
    Calendar
} from "lucide-react";

interface ServiceOrder {
    id: number;
    bike_id: number;
    customer_id: number;
    status: string;
    total_price: number;
}

export default function OrderHistoryPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const data = await apiFetch("/api/orders");
                // For history, we mostly care about Completed or Paid orders
                setOrders(data.filter((o: ServiceOrder) => o.status === "Completed" || o.status === "Paid"));
            } catch (err) {
                console.error("Failed to fetch history", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (user?.role === "Admin" || user?.role === "Mechanic") {
            fetchOrders();
        }
    }, [user]);

    const filteredOrders = orders.filter(o =>
        o.id.toString().includes(search)
    );

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 py-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-500/10 text-zinc-400 text-[10px] font-bold uppercase tracking-wider border border-white/5 mb-3">
                            <History size={12} />
                            Service Logs
                        </div>
                        <h1 className="text-3xl font-bold text-white">Order History</h1>
                        <p className="text-zinc-500 text-sm mt-1">Review all completed and paid service records.</p>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search by Order ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-full md:w-64 text-sm transition-all shadow-inner"
                        />
                    </div>
                </div>

                <div className="bg-zinc-900/50 border border-white/5 rounded-[32px] overflow-hidden shadow-2xl backdrop-blur-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                                <th className="px-8 py-5">Record ID</th>
                                <th className="px-8 py-5">Date</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5 text-right">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                            <span className="text-zinc-500 font-medium">Loading history...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-zinc-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText size={32} className="opacity-10 mb-2" />
                                            <p className="font-medium italic">No historical records found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-white/10 transition-colors">
                                                    <FileText size={18} className="text-zinc-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-sm font-bold text-white">#SO-{order.id}</span>
                                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Closed Account</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-zinc-400">
                                                <Calendar size={14} className="text-zinc-600" />
                                                <span className="text-sm">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${order.status === "Paid"
                                                    ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                                                    : "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                                                }`}>
                                                <CheckCircle2 size={12} />
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="font-black text-white text-lg">฿{order.total_price.toLocaleString()}</span>
                                                <span className="text-[10px] text-emerald-500 font-bold">Settled</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Growth Prompt */}
                <div className="p-8 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 rounded-[32px] border border-indigo-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20">
                            <History size={28} className="text-white" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-xl font-bold text-white">Analyze Your Performance</h4>
                            <p className="text-zinc-500 text-sm">Check the comprehensive reports to see service trends and revenue growth.</p>
                        </div>
                    </div>
                    {user?.role === "Admin" && (
                        <button className="px-6 py-3 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-all shadow-xl active:scale-95 flex items-center gap-2">
                            View All Reports
                            <ChevronRight size={18} />
                        </button>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
