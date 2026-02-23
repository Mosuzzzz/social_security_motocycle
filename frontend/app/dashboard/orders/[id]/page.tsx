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
    ThumbsUp
} from "lucide-react";

interface ServiceItem {
    id: number;
    order_id: number;
    description: string;
    price: number;
}

interface ServiceOrder {
    id: number;
    bike_id: number;
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
                    quantity: 1, // Defaulting to 1 for simplicity now
                }),
            });
            showToast("Stock item used successfully", "success");
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
            showToast((err as Error).message || "Failed to add item", "error");
        } finally {
            setIsAddingItem(false);
        }
    };

    const updateStatus = async (newStatus: string) => {
        try {
            await apiFetch("/api/orders", {
                method: "PUT",
                body: JSON.stringify({
                    order_id: parseInt(resolvedParams.id),
                    status: newStatus,
                }),
            });
            showToast(`Order status updated to ${newStatus}`, "success");
            fetchOrderDetail();
        } catch (err: unknown) {
            showToast((err as Error).message || "Failed to update status", "error");
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                        <span className="text-zinc-500 font-medium">Loading order details...</span>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!order) {
        return (
            <DashboardLayout>
                <div className="text-center py-20">
                    <p className="text-zinc-500">Order not found</p>
                </div>
            </DashboardLayout>
        );
    }

    const isMechanic = user?.role === "Mechanic";
    const isAdmin = user?.role === "Admin";
    const isCustomer = user?.role === "Customer";

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                        >
                            <ArrowLeft className="text-zinc-400" size={20} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Order #SO-{order.id}</h1>
                            <p className="text-zinc-500 text-sm mt-1">Service order details and items</p>
                        </div>
                    </div>
                    <StatusBadge status={order.status} />
                </div>

                {/* Order Info Card */}
                <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Package size={20} className="text-indigo-400" />
                        Order Information
                    </h2>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1">Bike ID</p>
                            <p className="text-white font-mono">#{order.bike_id}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1">Customer ID</p>
                            <p className="text-white font-mono">#{order.customer_id}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1">Total Price</p>
                            <p className="text-2xl font-bold text-emerald-400">฿{order.total_price.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1">Status</p>
                            <StatusBadge status={order.status} />
                        </div>
                    </div>

                    {/* Status Actions */}
                    <div className="flex gap-3 pt-4 border-t border-white/5">
                        {isMechanic && order.status === "Booked" && (
                            <button
                                onClick={() => updateStatus("ReviewPending")}
                                className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-bold transition-all"
                            >
                                <Send size={16} className="inline mr-2" />
                                Send for Review
                            </button>
                        )}
                        {isAdmin && order.status === "ReviewPending" && (
                            <button
                                onClick={() => updateStatus("OfferSent")}
                                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all"
                            >
                                <Send size={16} className="inline mr-2" />
                                Send Price Offer
                            </button>
                        )}
                        {isCustomer && (order.status === "Booked" || order.status === "ReviewPending" || order.status === "OfferSent") && (
                            <div className="flex gap-3">
                                {order.status === "OfferSent" && (
                                    <button
                                        onClick={() => updateStatus("Repairing")}
                                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all"
                                    >
                                        <ThumbsUp size={16} className="inline mr-2" />
                                        Confirm & Start Repair
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        if (confirm("Are you sure you want to cancel this order?")) {
                                            updateStatus("Cancelled");
                                        }
                                    }}
                                    className="px-4 py-2 bg-white/5 hover:bg-red-500/10 text-red-400 border border-white/5 rounded-xl font-bold transition-all flex items-center gap-2"
                                >
                                    <XCircle size={16} />
                                    {order.status === "OfferSent" ? "Reject & Cancel" : "Cancel Booking"}
                                </button>
                            </div>
                        )}
                        {(isMechanic || isAdmin) && order.status === "Repairing" && (
                            <button
                                onClick={() => updateStatus("Completed")}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all"
                            >
                                <CheckCircle2 size={16} className="inline mr-2" />
                                Mark as Completed
                            </button>
                        )}
                        {/* Emergency Start for Mechanics */}
                        {isMechanic && order.status === "Booked" && (
                            <button
                                onClick={() => updateStatus("Repairing")}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl font-bold transition-all border border-white/5"
                            >
                                Quick Start (Skip Review)
                            </button>
                        )}
                    </div>
                </div>

                {/* Service Items */}
                <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">Service Items</h2>
                        <span className="text-sm text-zinc-500">{order.items.length} items</span>
                    </div>

                    {/* Items List */}
                    <div className="space-y-3">
                        {order.items.length === 0 ? (
                            <div className="text-center py-12 text-zinc-500">
                                <Package size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No service items added yet</p>
                            </div>
                        ) : (
                            order.items.map((item, index) => (
                                <div
                                    key={item.id || `service-item-${index}`}
                                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex-1">
                                        <p className="text-white font-medium">{item.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-emerald-400 font-bold">฿{item.price.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Stock Items Section */}
                    {(isMechanic || isAdmin) && order.status !== "Completed" && order.status !== "Paid" && (
                        <div className="pt-6 border-t border-white/5 space-y-4">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                <Package size={16} />
                                Use from Stock
                            </h3>
                            <div className="flex flex-col md:flex-row gap-4">
                                <select
                                    value={selectedStockId}
                                    onChange={(e) => setSelectedStockId(e.target.value)}
                                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white appearance-none"
                                >
                                    <option value="" className="bg-zinc-900">Select an item from stock...</option>
                                    {stockItems.map(item => (
                                        <option
                                            key={`stock-opt-${item.id}`}
                                            value={item.id}
                                            disabled={item.quantity <= 0}
                                            className="bg-zinc-900"
                                        >
                                            {item.name} - ฿{item.price.toLocaleString()} ({item.quantity} in stock)
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleUseStockItem}
                                    disabled={isUsingStock || !selectedStockId}
                                    className="px-8 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    {isUsingStock ? (
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <Plus size={16} />
                                    )}
                                    Use Stock Item
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Add Item Form (Manual) */}
                    {(isMechanic || isAdmin) && order.status !== "Completed" && order.status !== "Paid" && (
                        <div className="pt-6 border-t border-white/5 space-y-4">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                <Wrench size={16} />
                                Add Custom Service / Labor
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="Item description (e.g., Oil change)"
                                    value={newItemDescription}
                                    onChange={(e) => setNewItemDescription(e.target.value)}
                                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white placeholder-zinc-500"
                                />
                                <input
                                    type="number"
                                    placeholder="Price (฿)"
                                    value={newItemPrice}
                                    onChange={(e) => setNewItemPrice(e.target.value)}
                                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white placeholder-zinc-500"
                                />
                            </div>
                            <button
                                onClick={handleAddItem}
                                disabled={isAddingItem}
                                className="w-full px-4 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                            >
                                {isAddingItem ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <Plus size={16} />
                                        Add Item
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

function StatusBadge({ status }: { status: string }) {
    const configs: Record<string, { color: string; icon: React.ReactNode }> = {
        Booked: { color: "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20", icon: <Clock size={12} /> },
        ReviewPending: { color: "bg-violet-500/10 text-violet-400 ring-violet-500/20", icon: <Clock size={12} /> },
        OfferSent: { color: "bg-indigo-500/10 text-indigo-400 ring-indigo-500/20", icon: <Send size={12} /> },
        Repairing: { color: "bg-amber-500/10 text-amber-400 ring-amber-500/20", icon: <Wrench size={12} /> },
        Completed: { color: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20", icon: <CheckCircle2 size={12} /> },
        Paid: { color: "bg-blue-500/10 text-blue-400 ring-blue-500/20", icon: <CheckCircle2 size={12} /> },
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
