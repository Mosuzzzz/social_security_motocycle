"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
    FileText,
    Wrench,
    CheckCircle2,
    XCircle,
    Search,
    ChevronRight,
    Clock,
    MoreVertical
} from "lucide-react";

interface ServiceOrder {
    id: number;
    bike_id: number;
    customer_id: number;
    status: string;
    total_price: number;
}

export default function ServiceOrdersManagementPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);

    const fetchOrders = async () => {
        try {
            const data = await apiFetch("/api/orders");
            setOrders(data);
        } catch (err) {
            console.error("Failed to fetch orders", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === "Admin" || user?.role === "Mechanic") {
            fetchOrders();
        }
    }, [user]);

    const updateStatus = async (orderId: number, newStatus: string) => {
        try {
            await apiFetch("/api/orders", {
                method: "PUT",
                body: JSON.stringify({
                    order_id: orderId,
                    status: newStatus,
                }),
            });
            fetchOrders();
            setSelectedOrder(null);
        } catch (err: unknown) {
            alert((err as Error).message || "Failed to update status");
        }
    };

    const filteredOrders = orders.filter(o =>
        o.id.toString().includes(search)
    );

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Service Management</h1>
                        <p className="text-zinc-500 text-sm mt-1">Monitor and update all active service orders</p>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search by Order ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-full md:w-64 text-sm transition-all"
                        />
                    </div>
                </div>

                <div className="bg-zinc-900 border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                                <th className="px-8 py-5">Order ID</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5">Price</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                            <span className="text-zinc-500 font-medium">Fetching orders...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-zinc-500">
                                        No service orders found.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group px-8">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                                    <FileText size={16} className="text-zinc-400" />
                                                </div>
                                                <span className="font-mono text-sm font-bold text-white">#SO-{order.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="px-8 py-6 font-bold text-zinc-300">
                                            ฿{order.total_price.toLocaleString()}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {order.status === "Booked" && (
                                                    <button
                                                        onClick={() => updateStatus(order.id, "Repairing")}
                                                        className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg text-xs font-bold transition-all"
                                                    >
                                                        Start Repair
                                                    </button>
                                                )}
                                                {order.status === "Repairing" && (
                                                    <button
                                                        onClick={() => updateStatus(order.id, "Completed")}
                                                        className="px-3 py-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-lg text-xs font-bold transition-all"
                                                    >
                                                        Complete
                                                    </button>
                                                )}
                                                <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-all">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}

function StatusBadge({ status }: { status: string }) {
    const configs: Record<string, { color: string; icon: React.ReactNode }> = {
        Booked: { color: "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20", icon: <Clock size={12} /> },
        Repairing: { color: "bg-indigo-500/10 text-indigo-400 ring-indigo-500/20", icon: <Wrench size={12} /> },
        Completed: { color: "bg-amber-500/10 text-amber-400 ring-amber-500/20", icon: <CheckCircle2 size={12} /> },
        Paid: { color: "bg-emerald-500/10 text-emerald-400 ring-emerald-400/20", icon: <CheckCircle2 size={12} /> },
        Cancelled: { color: "bg-red-500/10 text-red-400 ring-red-500/20", icon: <XCircle size={12} /> },
    };

    const config = configs[status] || configs["Booked"];

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${config.color}`}>
            {config.icon}
            {status}
        </span>
    );
}
