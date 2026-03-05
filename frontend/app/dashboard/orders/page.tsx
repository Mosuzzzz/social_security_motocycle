"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import {
    FileText,
    Wrench,
    CheckCircle2,
    XCircle,
    Search,
    ChevronRight,
    Clock,
    MoreVertical,
    Eye,
    Send,
    Trash2
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
    const { showToast } = useToast();
    const router = useRouter();
    const isMechanic = user?.role === "Mechanic";
    const isAdmin = user?.role === "Admin";
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ orderId: number; reason: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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
        if (user) {
            fetchOrders();
        }
    }, [user]);

    const updateStatus = async (orderId: number, newStatus: string, price?: number) => {
        try {
            await apiFetch("/api/orders", {
                method: "PUT",
                body: JSON.stringify({
                    order_id: orderId,
                    status: newStatus,
                    total_price: price
                }),
            });
            fetchOrders();
            showToast(`Order status updated to ${newStatus}`, "success");
        } catch (err: unknown) {
            showToast((err as Error).message || "Failed to update status", "error");
        }
    };



    const handleDelete = (orderId: number) => {
        setDeleteModal({ orderId, reason: "" });
    };

    const confirmDelete = async () => {
        if (!deleteModal) return;
        if (!deleteModal.reason.trim()) {
            showToast("กรุณาระบุเหตุผลที่ยกเลิก", "error");
            return;
        }

        setIsDeleting(true);
        try {
            await apiFetch(`/api/orders/${deleteModal.orderId}`, {
                method: "DELETE",
                body: JSON.stringify({ reason: deleteModal.reason })
            });
            showToast("ลบออเดอร์เรียบร้อยแล้ว และแจ้งลูกค้าทาง LINE แล้ว", "success");
            setDeleteModal(null);
            fetchOrders();
        } catch (err: unknown) {
            showToast((err as Error).message || "Failed to delete order", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredOrders = orders.filter(o =>
        o.id.toString().includes(search)
    );

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 animate-in relative z-10 pt-4 pb-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <section>
                        <p className="text-[#004B7E] font-black text-[10px] uppercase tracking-[0.2em] mb-2">Service Queue</p>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-800 uppercase tracking-tighter">
                            Manage Repair Orders
                        </h1>
                    </section>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#004B7E] transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by Order ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:border-[#004B7E] w-full md:w-80 text-sm font-bold shadow-sm transition-all"
                        />
                    </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50 bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-[#004B7E]">
                                <th className="px-8 py-6">Order ID</th>
                                <th className="px-8 py-6">Status</th>
                                <th className="px-8 py-6">Total</th>
                                <th className="px-8 py-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-10 h-10 border-4 border-slate-100 border-t-[#004B7E] rounded-full animate-spin"></div>
                                            <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                                <XCircle size={32} />
                                            </div>
                                            <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">No orders found</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-[#004B7E] group-hover:text-white transition-all">
                                                    <FileText size={18} />
                                                </div>
                                                <span className="font-black text-slate-800 tracking-tighter">#SO-{order.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-lg font-black text-[#004B7E]">฿{order.total_price.toLocaleString()}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                                                    className="h-10 px-4 bg-slate-50 text-slate-400 hover:bg-[#FFD700] hover:text-[#004B7E] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                                >
                                                    <Eye size={14} />
                                                    Details
                                                </button>
                                                {isMechanic && order.status === "Booked" && (
                                                    <button
                                                        onClick={() => updateStatus(order.id, "ReviewPending")}
                                                        className="h-10 px-6 bg-[#004B7E] text-white hover:bg-[#003a61] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#004B7E]/20 transition-all"
                                                    >
                                                        Send Review
                                                    </button>
                                                )}
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => handleDelete(order.id)}
                                                        className="w-10 h-10 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all flex items-center justify-center shadow-sm"
                                                        title="Delete Order"
                                                    >
                                                        <Trash2 size={16} />
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

            {/* Delete Confirmation Modal */}
            {deleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isDeleting && setDeleteModal(null)} />
                    <div className="relative bg-white rounded-4xl shadow-2xl w-full max-w-lg overflow-hidden">
                        {/* Header */}
                        <div className="bg-red-600 px-8 py-6 flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                <Trash2 size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="text-red-200 text-[10px] font-black uppercase tracking-widest">Admin Action</p>
                                <h2 className="text-white text-xl font-black">ยกเลิกออเดอร์ #SO-{deleteModal.orderId}</h2>
                            </div>
                        </div>
                        {/* Body */}
                        <div className="px-8 py-6 space-y-5">
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                                <p className="text-red-700 text-sm font-bold">⚠️ การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
                                <p className="text-red-500 text-xs font-medium mt-1">ลูกค้าจะได้รับแจ้งเตือนทาง LINE พร้อมเหตุผลที่ระบุ</p>
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-600 uppercase tracking-widest mb-2">
                                    เหตุผลที่ยกเลิก <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    className="w-full px-5 py-4 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:border-red-400 resize-none transition-all bg-slate-50 focus:bg-white"
                                    rows={3}
                                    placeholder="เช่น ลูกค้าขอยกเลิก / รถถูกนำไปซ่อมที่อื่น / ไม่สามารถหาอะไหล่ได้..."
                                    value={deleteModal.reason}
                                    onChange={(e) => setDeleteModal({ ...deleteModal, reason: e.target.value })}
                                    disabled={isDeleting}
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setDeleteModal(null)}
                                    disabled={isDeleting}
                                    className="flex-1 py-4 bg-slate-50 text-slate-500 border border-slate-200 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-100 transition-all disabled:opacity-50"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isDeleting || !deleteModal.reason.trim()}
                                    className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            กำลังส่งแจ้งเตือน...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={16} />
                                            ยืนยันยกเลิก & แจ้งลูกค้า
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

function StatusBadge({ status }: { status: string }) {
    const configs: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
        Booked: { color: "bg-slate-100 text-slate-400 border-slate-200", icon: <Clock size={12} />, label: "Booked" },
        ReviewPending: { color: "bg-blue-50 text-blue-600 border-blue-100", icon: <Clock size={12} />, label: "Review Pending" },
        OfferSent: { color: "bg-purple-50 text-purple-600 border-purple-100", icon: <Send size={12} />, label: "Offer Sent" },
        Repairing: { color: "bg-amber-50 text-amber-600 border-amber-100", icon: <Wrench size={12} />, label: "Repairing" },
        Completed: { color: "bg-green-50 text-green-600 border-green-100", icon: <CheckCircle2 size={12} />, label: "Completed" },
        Paid: { color: "bg-indigo-50 text-indigo-600 border-indigo-100", icon: <CheckCircle2 size={12} />, label: "Paid" },
        Cancelled: { color: "bg-red-50 text-red-600 border-red-100", icon: <XCircle size={12} />, label: "Cancelled" },
    };

    const config = configs[status] || configs["Booked"];

    return (
        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${config.color}`}>
            {config.icon}
            {config.label}
        </span>
    );
}
