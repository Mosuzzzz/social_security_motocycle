"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import {
    Plus,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowRight
} from "lucide-react";

interface ServiceOrder {
    id: number;
    bike_id: number;
    customer_id: number;
    status: string;
    total_price: number;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
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

        fetchOrders();
    }, []);

    const activeOrders = orders.filter(o => o.status === "Booked" || o.status === "Repairing").length;
    const completedOrders = orders.filter(o => o.status === "Completed" || o.status === "Paid").length;
    const pendingPayment = orders.filter(o => o.status === "Completed").length;

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-10">
                {/* Welcome Section */}
                <section>
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-2 underline decoration-indigo-500/50 decoration-4 underline-offset-8">
                        Hello, {user?.username}
                    </h1>
                    <p className="text-zinc-500 text-lg">Here&apos;s a quick overview of what&apos;s happening today.</p>
                </section>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Active Orders" value={activeOrders.toString()} icon={<Clock size={20} />} trend="+0" color="indigo" />
                    <StatCard title="Completed" value={completedOrders.toString()} icon={<CheckCircle2 size={20} />} trend="+0" color="emerald" />
                    <StatCard title="Action Required" value={pendingPayment.toString()} icon={<AlertCircle size={20} />} trend="0" color="amber" />
                    <StatCard title="Total Orders" value={orders.length.toString()} icon={<Plus size={20} />} trend="New" color="purple" />
                </div>

                {/* Content Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Recent Activity */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold">Your Service Orders</h3>
                        </div>

                        <div className="overflow-hidden bg-white/5 border border-white/5 rounded-3xl">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/5 text-[10px] uppercase tracking-widest text-zinc-500">
                                        <th className="px-6 py-4 font-semibold">Order ID</th>
                                        <th className="px-6 py-4 font-semibold">Status</th>
                                        <th className="px-6 py-4 font-semibold text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-white/5">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-10 text-center text-zinc-500 italic">Loading your orders...</td>
                                        </tr>
                                    ) : orders.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-10 text-center text-zinc-500 italic">No orders found.</td>
                                        </tr>
                                    ) : (
                                        orders.map(order => (
                                            <OrderRow
                                                key={order.id}
                                                id={`#SO-${order.id}`}
                                                status={order.status}
                                                amount={order.total_price.toLocaleString()}
                                            />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Quick Action Container */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold">Quick Actions</h3>

                        {user?.role === "Customer" && (
                            <div className="p-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[32px] shadow-2xl shadow-indigo-500/10 group relative overflow-hidden">
                                <div className="absolute top-[-20%] right-[-20%] w-40 h-40 bg-white/10 blur-3xl rounded-full"></div>
                                <h4 className="text-xl font-bold mb-2">Need a Repair?</h4>
                                <p className="text-indigo-100 text-sm mb-6 opacity-80">Book a service in less than a minute. Our mechanics are ready to help.</p>
                                <Link href="/dashboard/new-booking">
                                    <button className="w-full py-4 bg-white text-indigo-600 font-bold rounded-2xl hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 shadow-xl shadow-black/10 transition-transform group-hover:scale-[1.02] active:scale-[0.98]">
                                        <Plus size={20} />
                                        Book New Service
                                    </button>
                                </Link>
                            </div>
                        )}

                        <div className="p-6 bg-zinc-900 border border-white/5 rounded-3xl">
                            <h4 className="font-semibold mb-4 flex items-center gap-2">
                                <AlertCircle size={18} className="text-amber-500" />
                                Announcements
                            </h4>
                            <p className="text-zinc-500 text-xs leading-5">
                                We&apos;ve updated our service policy. Please review the new terms in the settings menu.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function StatCard({ title, value, icon, trend, color }: {
    title: string;
    value: string;
    icon: React.ReactNode;
    trend: string;
    color: string;
}) {
    const colorMap: Record<string, string> = {
        indigo: "from-indigo-500/20 to-indigo-500/5 text-indigo-500",
        emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-500",
        amber: "from-amber-500/20 to-amber-500/5 text-amber-500",
        purple: "from-purple-500/20 to-purple-500/5 text-purple-500",
    };

    return (
        <div className="p-6 bg-zinc-900 border border-white/5 rounded-3xl relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colorMap[color]} blur-3xl transform group-hover:scale-150 transition-transform duration-700 opacity-60`}></div>
            <div className="flex items-center gap-4 mb-4">
                <div className={`p-2 rounded-xl bg-white/5 ${colorMap[color].split(" ")[2]}`}>
                    {icon}
                </div>
                <span className="text-xs font-semibold text-zinc-500 tracking-wider uppercase">{title}</span>
            </div>
            <div className="flex items-end justify-between">
                <span className="text-2xl font-bold">{value}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg bg-black/20 ${trend.includes("+") ? "text-emerald-500" : "text-amber-500"}`}>
                    {trend}
                </span>
            </div>
        </div>
    );
}

function OrderRow({ id, status, amount }: {
    id: string;
    status: string;
    amount: string;
}) {
    const statusColors: Record<string, string> = {
        Booked: "text-zinc-400 ring-zinc-400/20",
        Repairing: "text-indigo-400 ring-indigo-400/20",
        Completed: "text-amber-400 ring-amber-400/20",
        Paid: "text-emerald-400 ring-emerald-400/20",
        Cancelled: "text-red-400 ring-red-400/20",
    };

    return (
        <tr className="hover:bg-white/[0.02] transition-colors group cursor-pointer border-b border-transparent hover:border-white/5">
            <td className="px-6 py-6 font-mono text-xs text-zinc-400">{id}</td>
            <td className="px-6 py-6">
                <span className={`px-3 py-1 rounded-full bg-white/5 text-xs font-bold ring-1 ring-inset ${statusColors[status] || "text-white"}`}>
                    {status}
                </span>
            </td>
            <td className="px-6 py-6 text-right font-bold text-white tracking-tight">฿{amount}</td>
        </tr>
    );
}
