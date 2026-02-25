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
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#004B7E]/5 text-[#004B7E] text-[10px] font-black uppercase tracking-wider border border-[#004B7E]/10">
                            <CreditCard size={14} />
                            Financial Records
                        </div>
                        <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">
                            Payment Records
                        </h1>
                        <p className="text-slate-400 font-bold text-sm max-w-md">Manage your payments and review historical receipts.</p>
                    </div>

                    <div className="flex bg-slate-50/50 p-1 rounded-2xl border border-slate-100">
                        <div className="px-6 py-3 bg-white rounded-xl text-[10px] font-black shadow-sm uppercase tracking-widest text-[#004B7E]">Transaction History</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Summary Header */}
                        <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] flex items-center justify-between shadow-xl">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                                    <Receipt size={32} className="text-[#004B7E]" />
                                </div>
                                <div className="">
                                    <h3 className="text-xl font-black text-slate-800 uppercase">Payment Status</h3>
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">{orders.length} transactions total.</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] block mb-1">Total Paid Amount</span>
                                <span className="text-3xl font-black text-[#004B7E] leading-none">฿{paidOrders.reduce((acc, curr) => acc + curr.total_price, 0).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Orders List */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-[#004B7E] uppercase tracking-[0.2em] flex items-center gap-2 px-2">
                                <DollarSign size={18} />
                                Recent Transactions
                            </h3>

                            <div className="overflow-hidden bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-50 bg-slate-50/50 text-[10px] uppercase tracking-widest text-slate-400 font-black">
                                            <th className="px-8 py-5">Description</th>
                                            <th className="px-8 py-5">Status</th>
                                            <th className="px-8 py-5 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {isLoading ? (
                                            <tr><td colSpan={3} className="px-8 py-20 text-center text-slate-400 font-bold animate-pulse uppercase text-[10px] tracking-widest">Loading records...</td></tr>
                                        ) : orders.length === 0 ? (
                                            <tr><td colSpan={3} className="px-8 py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">No transaction history found.</td></tr>
                                        ) : (
                                            orders.map(order => (
                                                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                                                                <FileText size={16} className="text-slate-400 group-hover:text-[#004B7E] transition-colors" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-sm text-slate-800 uppercase">#SO-{order.id}</span>
                                                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Maintenance Service</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${order.status === "Paid" ? "bg-emerald-50 text-emerald-600 ring-emerald-100" :
                                                            order.status === "Completed" ? "bg-amber-50 text-amber-600 ring-amber-100" :
                                                                "bg-slate-50 text-slate-400 ring-slate-100"
                                                            }`}>
                                                            {order.status === "Paid" ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                            {order.status === "Paid" ? "Paid" : order.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex items-center justify-end gap-4">
                                                            <span className="font-black text-slate-800 tracking-tighter">฿{order.total_price.toLocaleString()}</span>
                                                            {order.status === "Paid" && (
                                                                <button
                                                                    onClick={() => setSelectedReceipt(order)}
                                                                    className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#FFD700] hover:text-[#004B7E] transition-all border border-slate-100"
                                                                    title="View Receipt"
                                                                >
                                                                    <Receipt size={18} />
                                                                </button>
                                                            )}
                                                            {order.status === "Completed" && (
                                                                <Link
                                                                    href={`/dashboard/payments/checkout/${order.id}`}
                                                                    className="px-4 py-2 bg-[#FFD700] text-[#004B7E] rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-[#FFD700]/20"
                                                                >
                                                                    <CreditCard size={14} />
                                                                    Pay Now
                                                                </Link>
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
                        <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] space-y-4 shadow-sm">
                            <h4 className="text-[10px] font-black flex items-center gap-2 uppercase tracking-[0.2em] text-[#004B7E]">
                                <History size={18} />
                                Financial Support
                            </h4>
                            <p className="text-slate-400 text-[10px] font-bold leading-relaxed uppercase tracking-wider">
                                All transactions are processed via secure systems. If you have any issues, please contact our support at the store or call our 24/7 hotline.
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
