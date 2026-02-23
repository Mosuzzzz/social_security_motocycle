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
    TrendingUp
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
                    <p className="text-gray-400 font-semibold text-[11px] uppercase tracking-[0.2em] mb-2">Metrics & Overview</p>
                    <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-white">
                        Hello, {user?.username}
                    </h1>
                </section>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Active Jobs" value={activeOrders.toString()} color="pink" icon={<Clock size={22} />} />
                    <StatCard title="Completed" value={completedOrders.toString()} color="purple" icon={<CheckCircle2 size={22} />} />
                    <StatCard title="Action Required" value={pendingPayment.toString()} color="orange" icon={<AlertCircle size={22} />} />
                    <StatCard title="Total Volume" value={orders.length.toString()} color="gray" icon={<TrendingUp size={22} />} />
                </div>

                {/* Content Section */}
                <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xl font-medium tracking-tight text-white">Recent Workloads</h3>
                        {orders.length > 5 && (
                            <Link href="/dashboard/orders" className="text-pink-400 text-sm font-semibold hover:text-pink-300 transition-colors uppercase tracking-wider text-[11px]">
                                See All
                            </Link>
                        )}
                    </div>

                    <div className="ios-card bg-black/40 border border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl rounded-xl">
                        {isLoading ? (
                            <div className="p-12 text-center text-gray-500 font-light flex flex-col items-center">
                                <div className="w-8 h-8 border-2 border-white/10 border-t-pink-500 rounded-full animate-spin mb-4"></div>
                                Accessing database...
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="p-12 text-center space-y-3">
                                <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                                    <FileText size={24} className="text-gray-500" />
                                </div>
                                <p className="text-gray-400 font-light">No workloads found.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
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
        'pink': "border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.1)]",
        'purple': "border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]",
        'orange': "border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]",
        'gray': "border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]",
    };

    const iconColors: Record<string, string> = {
        'pink': "text-pink-400 bg-pink-500/10",
        'purple': "text-purple-400 bg-purple-500/10",
        'orange': "text-orange-400 bg-orange-500/10",
        'gray': "text-gray-400 bg-white/5",
    };

    return (
        <div className={`p-5 rounded-2xl flex flex-col items-start justify-between h-36 bg-white/5 backdrop-blur-xl border transition-all hover:-translate-y-1 hover:bg-white/10 ${colorStyles[color]}`}>
            <div className={`p-2.5 rounded-xl border border-white/5 ${iconColors[color]}`}>
                {icon}
            </div>
            <div>
                <span className="block text-3xl font-medium tracking-tight text-white mb-0.5">{value}</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{title}</span>
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
            case 'Completed': return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
            case 'Paid': return "bg-green-500/10 text-green-400 border border-green-500/20";
            case 'Cancelled': return "bg-red-500/10 text-red-400 border border-red-500/20";
            case 'ReviewPending':
            case 'Repairing': return "bg-orange-500/10 text-orange-400 border border-orange-500/20";
            default: return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
        }
    };

    return (
        <div className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors cursor-pointer group" onClick={onManage}>
            <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm text-gray-200 group-hover:text-white transition-colors">Task ID #{id}</h4>
                    <span className="font-medium text-sm text-gray-200">฿{amount}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getStatusStyle(status)}`}>
                        {status}
                    </span>
                    <span className="text-xs text-gray-600 font-light opacity-0 group-hover:opacity-100 transition-opacity">Tap configuring</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {status === "Completed" && role === "Customer" && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onPay();
                        }}
                        className="px-4 py-1.5 bg-pink-500/20 text-pink-400 border border-pink-500/30 rounded-full text-xs font-semibold hover:bg-pink-500 hover:text-white transition-all shadow-[0_0_10px_rgba(236,72,153,0.2)]"
                        title="Commence Payment"
                    >
                        PAY NOW
                    </button>
                )}
                {status === "Paid" && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewReceipt();
                        }}
                        className="p-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full hover:bg-green-500 hover:text-white transition-all"
                        title="View Documentation"
                    >
                        <FileText size={16} />
                    </button>
                )}
                <ChevronRight size={18} className="text-gray-600 group-hover:text-white transition-colors" />
            </div>
        </div>
    );
}
