"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Plus,
    Clock,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    CreditCard,
    FileText,
    Wrench,
    Send,
    Zap,
    TrendingUp,
    Calendar
} from "lucide-react";
import ReceiptModal from "@/components/ReceiptModal";

interface ServiceOrder {
    id: number;
    bike_id: number;
    customer_id: number;
    status: string;
    total_price: number;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReceipt, setSelectedReceipt] = useState<ServiceOrder | null>(null);

    const fetchOrders = async () => {
        try {
            const data = await apiFetch("/api/orders");
            setOrders(data || []);
        } catch (err) {
            console.error("Failed to fetch orders", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handlePayment = async (orderId: number, amount: number) => {
        if (!window.OmiseCard) {
            showToast("Payment gateway not loaded. Please refresh.", "error");
            return;
        }

        window.OmiseCard.configure({
            publicKey: process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY,
            buttonLabel: 'Pay Now',
            submitLabel: 'Pay Now',
            currency: 'thb',
            frameLabel: 'Motorcycle Service',
            amount: amount * 100,
            onCreateTokenSuccess: async (nonce: string) => {
                try {
                    setIsLoading(true);
                    await apiFetch("/api/payments", {
                        method: "POST",
                        body: JSON.stringify({
                            order_id: orderId,
                            payment_token: nonce
                        }),
                    });
                    showToast("Payment successful! Thank you.", "success");
                    fetchOrders();
                } catch (err: unknown) {
                    showToast((err as Error).message || "Payment failed", "error");
                } finally {
                    setIsLoading(false);
                }
            }
        });

        window.OmiseCard.open();
    };

    const activeOrders = orders.filter(o => ["Booked", "ReviewPending", "OfferSent", "Repairing"].includes(o.status)).length;
    const completedOrders = orders.filter(o => o.status === "Completed" || o.status === "Paid").length;
    const pendingPayment = orders.filter(o => o.status === "Completed").length;

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-8 animate-in relative z-10">
                {/* Welcome Section */}
                <section>
                    <p className="text-[#004B7E] font-black text-[10px] uppercase tracking-[0.2em] mb-2">Metrics & Overview</p>
                    <h1 className="text-3xl md:text-5xl font-black text-slate-800 uppercase tracking-tighter">
                        Welcome, {user?.username}
                    </h1>
                </section>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Active Repairs" value={activeOrders.toString()} color="blue" icon={<Clock size={22} />} />
                    <StatCard title="Completed" value={completedOrders.toString()} color="gold" icon={<CheckCircle2 size={22} />} />
                    <StatCard title="Pending Payment" value={pendingPayment.toString()} color="slate" icon={<AlertCircle size={22} />} />
                    <StatCard title="Total Orders" value={orders.length.toString()} color="light-blue" icon={<TrendingUp size={22} />} />
                </div>

                {/* Content Section */}
                <div className="space-y-6 pt-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xl font-black text-[#004B7E] uppercase tracking-tighter">Recent Activities</h3>
                        {orders.length > 5 && (
                            <Link href="/dashboard/orders" className="text-[#004B7E] text-[10px] font-black hover:underline uppercase tracking-widest">
                                View All <ChevronRight size={14} className="inline ml-1" />
                            </Link>
                        )}
                    </div>

                    <div className="bg-white border border-slate-100 overflow-hidden shadow-xl rounded-4xl">
                        {isLoading ? (
                            <div className="p-16 text-center text-slate-400 font-bold flex flex-col items-center">
                                <div className="w-10 h-10 border-4 border-slate-100 border-t-[#004B7E] rounded-full animate-spin mb-4"></div>
                                Loading dashboard...
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="p-16 text-center space-y-4">
                                <div className="w-20 h-20 mx-auto bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100">
                                    <FileText size={32} className="text-slate-300" />
                                </div>
                                <p className="text-slate-400 font-bold">No repair orders found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {orders.slice(0, 5).map(order => (
                                    <OrderListItem
                                        key={order.id}
                                        id={order.id}
                                        status={order.status}
                                        amount={order.total_price.toLocaleString()}
                                        onPay={() => handlePayment(order.id, order.total_price)}
                                        onViewReceipt={() => setSelectedReceipt(order)}
                                        onManage={(user?.role === "Mechanic" || user?.role === "Admin" || user?.role === "Customer") ? () => router.push(`/dashboard/orders/${order.id}`) : undefined}
                                        role={user?.role || "Customer"}
                                    />
                                ))}
                            </div>
                        )}
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

function StatCard({ title, value, color, icon }: {
    title: string;
    value: string;
    color: string;
    icon: React.ReactNode;
}) {
    const colorStyles: Record<string, string> = {
        'blue': "bg-white border-slate-100 shadow-sm hover:shadow-xl",
        'gold': "bg-[#FFD700] border-yellow-400 shadow-lg text-[#004B7E] hover:rotate-2",
        'slate': "bg-slate-900 border-slate-800 text-white shadow-xl hover:-translate-y-1",
        'light-blue': "bg-blue-50 border-blue-100 shadow-inner",
    };

    const iconColors: Record<string, string> = {
        'blue': "bg-[#004B7E]/5 text-[#004B7E]",
        'gold': "bg-white/40 text-[#004B7E]",
        'slate': "bg-white/10 text-[#FFD700]",
        'light-blue': "bg-white text-blue-500",
    };

    return (
        <div className={`p-6 rounded-4xl flex flex-col items-start justify-between h-44 border transition-all duration-300 ${colorStyles[color]}`}>
            <div className={`p-3 rounded-2xl ${iconColors[color]}`}>
                {icon}
            </div>
            <div>
                <span className={`block text-4xl font-black tracking-tighter mb-1 ${color === 'slate' ? 'text-white' : 'text-[#004B7E]'}`}>{value}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest opacity-60`}>{title}</span>
            </div>
        </div>
    );
}

function OrderListItem({ id, status, amount, onPay, onViewReceipt, onManage, role }: {
    id: number;
    status: string;
    amount: string;
    onPay: () => void;
    onViewReceipt: () => void;
    onManage?: () => void;
    role: string;
}) {
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Completed': return "bg-green-100 text-green-700 border-green-200";
            case 'Paid': return "bg-blue-100 text-blue-700 border-blue-200";
            case 'Cancelled': return "bg-red-100 text-red-700 border-red-200";
            case 'ReviewPending':
            case 'Repairing': return "bg-yellow-100 text-yellow-700 border-yellow-200";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    return (
        <div className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors cursor-pointer group" onClick={onManage}>
            <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-black text-slate-800 uppercase tracking-tight group-hover:text-[#004B7E] transition-colors">Order #{id}</h4>
                    <span className="font-black text-xl text-[#004B7E]">฿{amount}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(status)}`}>
                        {status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase opacity-0 group-hover:opacity-100 transition-all">Tap for details</span>
                </div>
            </div>

            <div className="flex items-center gap-4">

                {status === "Paid" && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewReceipt();
                        }}
                        className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-[#FFD700] hover:text-[#004B7E] transition-all"
                        title="View Receipt"
                    >
                        <FileText size={18} />
                    </button>
                )}
                <div className="w-10 h-10 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center group-hover:bg-[#004B7E] group-hover:text-white transition-all">
                    <ChevronRight size={20} />
                </div>
            </div>
        </div>
    );
}
