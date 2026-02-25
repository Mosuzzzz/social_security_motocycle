"use client";

import React, { useEffect, useState, use } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Wrench,
    Plus,
    Trash2,
    Save,
    CheckCircle2,
    Clock,
    XCircle,
    Package,
    Send,
    ThumbsUp,
    CreditCard
} from "lucide-react";

interface ServiceItem {
    id: number;
    order_id: number;
    description: string;
    price: number;
}

interface ServiceOrder {
    id: number;
    bike_id: number | null;
    customer_id: number;
    status: string;
    total_price: number;
    items: ServiceItem[];
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [order, setOrder] = useState<ServiceOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [newItemDescription, setNewItemDescription] = useState("");
    const [newItemPrice, setNewItemPrice] = useState("");
    const [stockItems, setStockItems] = useState<{ id: number; name: string; price: number; quantity: number }[]>([]);
    const [selectedStockId, setSelectedStockId] = useState<string>("");
    const [isUsingStock, setIsUsingStock] = useState(false);

    const fetchOrderDetail = async () => {
        try {
            const data = await apiFetch(`/api/orders/${resolvedParams.id}`);
            setOrder(data);
        } catch (err) {
            console.error("Failed to fetch order details", err);
            showToast("Failed to load order details", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStockItems = async () => {
        try {
            const data = await apiFetch("/api/stock");
            setStockItems(data || []);
        } catch (err) {
            console.error("Failed to fetch stock items", err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchOrderDetail();
            if (user.role === "Mechanic" || user.role === "Admin") {
                fetchStockItems();
            }
        }
    }, [user, resolvedParams.id]);

    const handleUseStockItem = async () => {
        if (!selectedStockId) {
            showToast("Please select a stock item", "error");
            return;
        }

        setIsUsingStock(true);
        try {
            await apiFetch("/api/orders/use-stock", {
                method: "POST",
                body: JSON.stringify({
                    order_id: parseInt(resolvedParams.id),
                    stock_item_id: parseInt(selectedStockId),
                    quantity: 1,
                }),
            });
            showToast("Stock item added to repair order", "success");
            setSelectedStockId("");
            fetchOrderDetail();
            fetchStockItems();
        } catch (err: unknown) {
            showToast((err as Error).message || "Failed to use stock item", "error");
        } finally {
            setIsUsingStock(false);
        }
    };

    const handleAddItem = async () => {
        if (!newItemDescription.trim() || !newItemPrice) {
            showToast("Please fill in all fields", "error");
            return;
        }

        const price = parseFloat(newItemPrice);
        if (isNaN(price) || price <= 0) {
            showToast("Invalid price", "error");
            return;
        }

        setIsAddingItem(true);
        try {
            await apiFetch("/api/orders/items", {
                method: "POST",
                body: JSON.stringify({
                    order_id: parseInt(resolvedParams.id),
                    description: newItemDescription,
                    price: price,
                }),
            });

            showToast("Service item added successfully", "success");
            setNewItemDescription("");
            setNewItemPrice("");
            fetchOrderDetail();
        } catch (err: unknown) {
            showToast((err as Error).message || "Failed to add service item", "error");
        } finally {
            setIsAddingItem(false);
        }
    };

    const updateStatus = async (newStatus: string, price?: number) => {
        try {
            await apiFetch("/api/orders", {
                method: "PUT",
                body: JSON.stringify({
                    order_id: parseInt(resolvedParams.id),
                    status: newStatus,
                    total_price: price
                }),
            });
            showToast(`Status updated to ${newStatus}`, "success");
            fetchOrderDetail();
        } catch (err: unknown) {
            showToast((err as Error).message || "Failed to update status", "error");
        }
    };

    const handleComplete = () => {
        const priceStr = prompt("Enter total service price (฿):", order?.total_price.toString());
        if (priceStr !== null) {
            const price = parseFloat(priceStr);
            if (isNaN(price)) {
                showToast("Invalid price entered", "error");
                return;
            }
            updateStatus("Completed", price);
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                    <div className="w-12 h-12 border-4 border-[#004B7E]/20 border-t-[#004B7E] rounded-full animate-spin"></div>
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading data...</span>
                </div>
            </DashboardLayout>
        );
    }

    if (!order) {
        return (
            <DashboardLayout>
                <div className="text-center py-20 bg-white rounded-4xl border border-slate-100 shadow-xl">
                    <XCircle size={48} className="mx-auto text-red-400 mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Repair order not found</p>
                </div>
            </DashboardLayout>
        );
    }

    const isMechanic = user?.role === "Mechanic";
    const isAdmin = user?.role === "Admin";
    const isCustomer = user?.role === "Customer";

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 animate-in relative z-10 pt-4 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => router.back()}
                            className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-[#004B7E] hover:border-[#004B7E] transition-all shadow-sm"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <p className="text-[#004B7E] font-black text-[10px] uppercase tracking-[0.2em] mb-1">Order Details</p>
                            <h1 className="text-3xl md:text-5xl font-black text-slate-800 uppercase tracking-tighter">
                                Repair Order <span className="text-[#004B7E]">#SO-{order.id}</span>
                            </h1>
                        </div>
                    </div>
                    <StatusBadge status={order.status} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Order Summary Card */}
                        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform pointer-events-none">
                                <Package size={120} />
                            </div>

                            <div className="relative z-10 space-y-8">
                                <div className="flex items-center gap-4 text-slate-800">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[#004B7E]">
                                        <Package size={20} />
                                    </div>
                                    <h2 className="text-xl font-black uppercase tracking-tight">Booking Information</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bike ID</p>
                                        <p className="text-2xl font-black text-[#004B7E]">{order.bike_id ? `#${order.bike_id}` : "None (Parts Only)"}</p>
                                    </div>
                                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">User ID</p>
                                        <p className="text-2xl font-black text-[#004B7E]">#{order.customer_id}</p>
                                    </div>
                                    <div className="p-6 bg-[#004B7E] rounded-3xl">
                                        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Total Price</p>
                                        <p className="text-3xl font-black text-[#FFD700]">฿{order.total_price.toLocaleString()}</p>
                                    </div>
                                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col justify-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Order Status</p>
                                        <StatusBadge status={order.status} />
                                    </div>
                                </div>

                                {/* Status Actions */}
                                <div className="flex flex-wrap gap-3 pt-8 border-t border-slate-50">
                                    {isMechanic && order.status === "Booked" && (
                                        <button
                                            onClick={() => updateStatus("ReviewPending")}
                                            className="px-6 py-3 bg-[#004B7E] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#004B7E]/20 hover:scale-105 transition-all flex items-center gap-2"
                                        >
                                            <Send size={14} />
                                            Submit for Review
                                        </button>
                                    )}
                                    {isAdmin && order.status === "ReviewPending" && (
                                        <button
                                            onClick={() => updateStatus("OfferSent")}
                                            className="px-6 py-3 bg-[#FFD700] text-[#004B7E] rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                                        >
                                            <Send size={14} />
                                            Confirm Quote
                                        </button>
                                    )}
                                    {isCustomer && order.status === "Completed" && (
                                        <button
                                            onClick={() => router.push(`/dashboard/payments/checkout/${order.id}`)}
                                            className="px-6 py-3 bg-[#FFD700] text-[#004B7E] rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                                        >
                                            <CreditCard size={14} />
                                            Pay Now
                                        </button>
                                    )}
                                    {isCustomer && (order.status === "Booked" || order.status === "ReviewPending" || order.status === "OfferSent") && (
                                        <div className="flex flex-wrap gap-3">
                                            {order.status === "OfferSent" && (
                                                <button
                                                    onClick={() => updateStatus("Repairing")}
                                                    className="px-6 py-3 bg-[#004B7E] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                                                >
                                                    <ThumbsUp size={14} />
                                                    Confirm & Start Repair
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    if (confirm("Are you sure you want to cancel this order?")) {
                                                        updateStatus("Cancelled");
                                                    }
                                                }}
                                                className="px-6 py-3 bg-red-50 text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 border border-red-100"
                                            >
                                                <XCircle size={14} />
                                                Cancel Order
                                            </button>
                                        </div>
                                    )}
                                    {(isMechanic || isAdmin) && order.status === "Repairing" && (
                                        <button
                                            onClick={handleComplete}
                                            className="px-6 py-3 bg-green-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-500/20 hover:scale-105 transition-all flex items-center gap-2"
                                        >
                                            <CheckCircle2 size={14} />
                                            Mark as Completed
                                        </button>
                                    )}

                                </div>
                            </div>
                        </div>

                        {/* Service Items Table */}
                        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-10 shadow-xl space-y-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Spare Parts & Service Items</h2>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.items.length} items</span>
                            </div>

                            <div className="space-y-4">
                                {order.items.length === 0 ? (
                                    <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                        <Package size={40} className="mx-auto mb-3 text-slate-200" />
                                        <p className="text-slate-400 font-bold text-sm">No service items yet.</p>
                                    </div>
                                ) : (
                                    order.items.map((item, index) => (
                                        <div key={item.id || `item-${index}`} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-lg transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#004B7E] group-hover:text-white transition-all">
                                                    <Wrench size={14} />
                                                </div>
                                                <span className="font-bold text-slate-700">{item.description}</span>
                                            </div>
                                            <span className="text-xl font-black text-[#004B7E]">฿{item.price.toLocaleString()}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Admin/Mechanic Controls */}
                    <div className="space-y-8">
                        {(isMechanic || isAdmin) && order.status !== "Completed" && order.status !== "Paid" && (
                            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl space-y-6">
                                <h3 className="text-sm font-black text-[#004B7E] uppercase tracking-widest flex items-center gap-2">
                                    <Package size={16} />
                                    Inventory Management
                                </h3>
                                <div className="space-y-4">
                                    <select
                                        value={selectedStockId}
                                        onChange={(e) => setSelectedStockId(e.target.value)}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-[#004B7E] text-xs font-bold appearance-none transition-all"
                                    >
                                        <option value="">Select stock item...</option>
                                        {stockItems.map(item => (
                                            <option key={item.id} value={item.id} disabled={item.quantity <= 0}>
                                                {item.name} (฿{item.price.toLocaleString()}) - Balance {item.quantity}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleUseStockItem}
                                        disabled={isUsingStock || !selectedStockId}
                                        className="w-full h-14 bg-[#004B7E] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#004B7E]/10 hover:bg-[#003a61] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isUsingStock ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Plus size={16} />}
                                        Add to Order
                                    </button>
                                </div>

                                <div className="pt-6 border-t border-slate-50 space-y-4">
                                    <h3 className="text-sm font-black text-[#004B7E] uppercase tracking-widest flex items-center gap-2">
                                        <Wrench size={16} />
                                        Other Services
                                    </h3>
                                    <input
                                        type="text"
                                        placeholder="Service description..."
                                        value={newItemDescription}
                                        onChange={(e) => setNewItemDescription(e.target.value)}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-[#004B7E] text-xs font-bold transition-all"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Price (฿)"
                                        value={newItemPrice}
                                        onChange={(e) => setNewItemPrice(e.target.value)}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-[#004B7E] text-xs font-bold transition-all"
                                    />
                                    <button
                                        onClick={handleAddItem}
                                        disabled={isAddingItem}
                                        className="w-full h-14 bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2"
                                    >
                                        {isAddingItem ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Plus size={16} />}
                                        Add Service Item
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function StatusBadge({ status }: { status: string }) {
    const configs: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
        Booked: { color: "bg-slate-50 text-slate-400 border-slate-100", icon: <Clock size={12} />, label: "Booked" },
        ReviewPending: { color: "bg-blue-50 text-blue-600 border-blue-100", icon: <Clock size={12} />, label: "Review Pending" },
        OfferSent: { color: "bg-purple-50 text-purple-600 border-purple-100", icon: <Send size={12} />, label: "Quote Sent" },
        Repairing: { color: "bg-amber-50 text-amber-600 border-amber-100", icon: <Wrench size={12} />, label: "Repairing" },
        Completed: { color: "bg-green-50 text-green-600 border-green-100", icon: <CheckCircle2 size={12} />, label: "Completed" },
        Paid: { color: "bg-indigo-50 text-indigo-600 border-indigo-100", icon: <CheckCircle2 size={12} />, label: "Paid" },
        Cancelled: { color: "bg-red-50 text-red-600 border-red-100", icon: <XCircle size={12} />, label: "Cancelled" },
    };

    const config = configs[status] || configs["Booked"];

    return (
        <span className={`inline-flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${config.color} shadow-sm`}>
            {config.icon}
            {config.label}
        </span>
    );
}
