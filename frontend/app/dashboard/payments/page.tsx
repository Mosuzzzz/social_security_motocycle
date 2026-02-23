"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Link from "next/link";
import {
    CreditCard,
    CheckCircle2,
    Clock,
    DollarSign,
    Search,
    ChevronRight,
    ArrowRight,
    FileText,
    Receipt,
    History
} from "lucide-react";
import ReceiptModal from "@/components/ReceiptModal";

interface ServiceOrder {
    id: number;
    bike_id: number;
    customer_id: number;
    status: string;
    total_price: number;
}

export default function CustomerPaymentsPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReceipt, setSelectedReceipt] = useState<ServiceOrder | null>(null);

    const fetchOrders = async () => {
        try {
            const data = await apiFetch("/api/orders");
            // Customers see their own orders. Backend likely filters this by user_id
            setOrders(data);
        } catch (err) {
            console.error("Failed to fetch payments", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const unpaidOrders = orders.filter(o => o.status === "Completed");
    const paidOrders = orders.filter(o => o.status === "Paid");

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-10 py-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
                            <CreditCard size={14} />
                            Billing & Invoices
                        </div>
                        <h1 className="text-4xl font-extrabold text-white tracking-tight">Financial Records</h1>
                        <p className="text-zinc-500 max-w-md">Manage your service payments and download historical receipts.</p>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                        <div className="px-6 py-3 bg-white/10 rounded-xl text-sm font-bold shadow-lg">Transaction History</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Summary Header */}
                        <div className="p-8 bg-zinc-900 border border-white/5 rounded-[32px] flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                                    <Receipt size={32} className="text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Payment Status</h3>
                                    <p className="text-zinc-500 text-sm">You have {unpaidOrders.length} pending payments.</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest block mb-1">Total Spent</span>
                                <span className="text-3xl font-black text-white leading-none">฿{paidOrders.reduce((acc, curr) => acc + curr.total_price, 0).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Orders List */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold flex items-center gap-2 px-2">
                                <DollarSign size={18} className="text-indigo-500" />
                                Recent Transactions
                            </h3>

                            <div className="overflow-hidden bg-zinc-900/40 border border-white/5 rounded-[32px]">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/5 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                                            <th className="px-8 py-5 text-zinc-400 font-bold">Description</th>
                                            <th className="px-8 py-5 text-zinc-400 font-bold">Status</th>
                                            <th className="px-8 py-5 text-right text-zinc-400 font-bold">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {isLoading ? (
                                            <tr><td colSpan={3} className="px-8 py-20 text-center text-zinc-500 animate-pulse">Processing...</td></tr>
                                        ) : orders.length === 0 ? (
                                            <tr><td colSpan={3} className="px-8 py-20 text-center text-zinc-500 italic font-medium">Clear of any billing records.</td></tr>
                                        ) : (
                                            orders.map(order => (
                                                <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                                                <FileText size={16} className="text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-mono text-sm font-bold text-white">#SO-{order.id}</span>
                                                                <span className="text-[10px] text-zinc-500 font-bold">Maintenance Service</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${order.status === "Paid" ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" :
                                                            order.status === "Completed" ? "bg-amber-500/10 text-amber-400 ring-amber-500/20" :
                                                                "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20"
                                                            }`}>
                                                            {order.status === "Paid" ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex items-center justify-end gap-4">
                                                            <span className="font-black text-white tracking-tight">฿{order.total_price.toLocaleString()}</span>
                                                            {order.status === "Completed" && (
                                                                <Link
                                                                    href={`/dashboard/payments/checkout/${order.id}`}
                                                                    className="px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-2"
                                                                >
                                                                    <CreditCard size={14} />
                                                                    PayNow
                                                                </Link>
                                                            )}
                                                            {order.status === "Paid" && (
                                                                <button
                                                                    onClick={() => setSelectedReceipt(order)}
                                                                    className="p-2 hover:bg-white/5 rounded-xl text-zinc-500 hover:text-white transition-all"
                                                                >
                                                                    <Receipt size={18} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[32px] text-white space-y-6 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-[-20%] left-[-20%] w-60 h-60 bg-white/10 blur-[60px] rounded-full group-hover:scale-110 transition-transform duration-[2s]"></div>
                            <div className="relative z-10 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
                                        <CreditCard size={24} />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Verified Member</p>
                                        <div className="flex items-center justify-end gap-1 mt-1">
                                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                                            <span className="text-[10px] font-bold">Secure Gateway</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1 pt-2">
                                    <p className="text-xs font-bold opacity-60 uppercase tracking-widest">Available Balance</p>
                                    <h3 className="text-5xl font-black tracking-tighter italic">฿0.00</h3>
                                </div>

                                <button className="w-full py-4 bg-white text-indigo-600 font-bold rounded-2xl hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95 group/btn">
                                    Add Funds
                                    <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 bg-zinc-900 border border-white/5 rounded-[32px] space-y-4">
                            <h4 className="font-bold flex items-center gap-2">
                                <History size={18} className="text-amber-500" />
                                Payment Help
                            </h4>
                            <p className="text-zinc-500 text-xs leading-relaxed">
                                All payments are processed securely through Omise. If you encounter any issues, please contact our 24/7 support line or visit the main office.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {selectedReceipt && (
                <ReceiptModal
                    order={selectedReceipt}
                    onClose={() => setSelectedReceipt(null)}
                />
            )}
        </DashboardLayout>
    );
}
