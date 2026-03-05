"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import {
    Plus,
    Wrench,
    Save,
    Trash2,
    Package,
    Search,
    AlertCircle
} from "lucide-react";

interface StockItem {
    id?: number;
    name: string;
    price: number;
    quantity: number;
}

export default function StockManagementPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [items, setItems] = useState<StockItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [editingItem, setEditingItem] = useState<StockItem | null>(null);

    // New item form state
    const [newItemName, setNewItemName] = useState("");
    const [newItemPrice, setNewItemPrice] = useState("");
    const [newItemQuantity, setNewItemQuantity] = useState("");

    const fetchStock = async () => {
        try {
            const data = await apiFetch("/api/stock");
            setItems(data || []);
        } catch (err) {
            console.error("Failed to fetch stock", err);
            showToast("Failed to load stock items", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === "Admin") {
            fetchStock();
        }
    }, [user]);

    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName || !newItemPrice || !newItemQuantity) {
            showToast("Please fill in all fields", "error");
            return;
        }

        setIsSaving(true);
        try {
            if (editingItem) {
                await apiFetch("/api/stock", {
                    method: "PUT",
                    body: JSON.stringify({
                        id: editingItem.id,
                        name: newItemName,
                        price: parseFloat(newItemPrice),
                        quantity: parseInt(newItemQuantity)
                    }),
                });
                showToast("Item updated successfully", "success");
            } else {
                await apiFetch("/api/stock", {
                    method: "POST",
                    body: JSON.stringify({
                        name: newItemName,
                        price: parseFloat(newItemPrice),
                        quantity: parseInt(newItemQuantity)
                    }),
                });
                showToast("Item added to stock", "success");
            }
            setNewItemName("");
            setNewItemPrice("");
            setNewItemQuantity("");
            setEditingItem(null);
            fetchStock();
        } catch (err: unknown) {
            showToast((err as Error).message || "Operation failed", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const startEditing = (item: StockItem) => {
        setEditingItem(item);
        setNewItemName(item.name);
        setNewItemPrice(item.price.toString());
        setNewItemQuantity(item.quantity.toString());
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEditing = () => {
        setEditingItem(null);
        setNewItemName("");
        setNewItemPrice("");
        setNewItemQuantity("");
    };

    const handleDeleteItem = async (id: number) => {
        if (!confirm("Are you sure you want to delete this item?")) return;

        try {
            await apiFetch(`/api/stock/${id}`, {
                method: "DELETE",
            });
            showToast("Item deleted", "success");
            fetchStock();
        } catch (err: unknown) {
            showToast((err as Error).message || "Failed to delete item", "error");
        }
    };

    const filteredItems = items.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase())
    );

    if (user?.role !== "Admin" && user?.role !== "Mechanic") {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-500 shadow-xl border-4 border-white">
                        <AlertCircle size={48} />
                    </div>
                    <div className="text-center">
                        <h2 className="text-3xl font-black text-[#004B7E] uppercase tracking-tighter mb-2">Access Denied</h2>
                        <p className="text-slate-400 font-bold">Only administrators can manage stock inventory.</p>
                    </div>
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="px-8 py-3 bg-[#004B7E] text-white font-black rounded-xl hover:bg-[#003a61] transition-all uppercase tracking-widest text-xs shadow-lg shadow-[#004B7E]/20"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 animate-in relative z-10 pt-4 pb-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <section>
                        <p className="text-[#004B7E] font-black text-[10px] uppercase tracking-[0.2em] mb-2">Inventory Control</p>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-800 uppercase tracking-tighter">
                            Spare Parts Inventory
                        </h1>
                    </section>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Save Item Form */}
                    {user?.role === "Admin" && (
                        <div className="lg:col-span-1">
                            <div className="bg-white border border-slate-100 rounded-4xl p-8 sticky top-24 shadow-2xl">
                                <h2 className="text-xl font-black text-[#004B7E] uppercase tracking-tight mb-8 flex items-center gap-4">
                                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                                        {editingItem ? (
                                            <Wrench size={24} className="text-[#004B7E]" />
                                        ) : (
                                            <Plus size={24} className="text-[#004B7E]" />
                                        )}
                                    </div>
                                    {editingItem ? "Edit Item" : "Add New Part"}
                                </h2>
                                <form onSubmit={handleSaveItem} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Item Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Engine Oil 10W-40"
                                            value={newItemName}
                                            onChange={(e) => setNewItemName(e.target.value)}
                                            className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-[#004B7E] text-slate-800 font-bold transition-all outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Price (฿)</label>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={newItemPrice}
                                                onChange={(e) => setNewItemPrice(e.target.value)}
                                                className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-[#004B7E] text-slate-800 font-bold transition-all outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Quantity</label>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={newItemQuantity}
                                                onChange={(e) => setNewItemQuantity(e.target.value)}
                                                className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-[#004B7E] text-slate-800 font-bold transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-4 pt-4">
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className={`w-full h-16 ${editingItem ? "bg-[#FFD700] text-[#004B7E]" : "bg-[#004B7E] text-white"} disabled:opacity-50 font-black rounded-2xl transition-all shadow-xl hover:-translate-y-1 flex items-center justify-center gap-3 uppercase tracking-widest text-sm`}
                                        >
                                            <Save size={20} />
                                            {isSaving ? "Saving..." : editingItem ? "Save Changes" : "Add to Stock"}
                                        </button>
                                        {editingItem && (
                                            <button
                                                type="button"
                                                onClick={cancelEditing}
                                                className="w-full h-14 bg-slate-50 text-slate-400 font-black rounded-2xl hover:bg-slate-100 transition-all uppercase tracking-widest text-xs"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                    {/* Inventory List */}
                    <div className={`${user?.role === "Admin" ? "lg:col-span-2" : "lg:col-span-3"} space-y-6`}>
                        <div className="flex items-center justify-between gap-6 px-4">
                            <h2 className="text-xl font-black text-[#004B7E] uppercase tracking-tight">Stock Inventory List</h2>
                            <div className="relative group flex-1 max-w-xs">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#004B7E] transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full h-12 pl-12 pr-6 bg-white border border-slate-100 rounded-xl focus:outline-none focus:border-[#004B7E] text-sm font-bold shadow-sm transition-all"
                                />
                            </div>
                        </div>

                        <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-50 bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-[#004B7E]">
                                        <th className="px-8 py-6">Item Name</th>
                                        <th className="px-8 py-6">Price</th>
                                        <th className="px-8 py-6">In Stock</th>
                                        {user?.role === "Admin" && <th className="px-8 py-6 text-right">Actions</th>}
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
                                    ) : filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-24 text-center">
                                                <div className="flex flex-col items-center gap-4 text-slate-200">
                                                    <Package size={48} />
                                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">No items found</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map((item, index) => (
                                            <tr key={item.id || `stock-item-${index}`} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#004B7E] group-hover:text-white transition-all">
                                                            <Package size={18} />
                                                        </div>
                                                        <span className="font-black text-slate-800 uppercase tracking-tight">{item.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-lg font-black text-[#004B7E]">฿{item.price.toLocaleString()}</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${item.quantity < 5 ? "bg-red-50 text-red-600 border-red-100" : "bg-green-50 text-green-600 border-green-100"}`}>
                                                        {item.quantity} Units
                                                    </span>
                                                </td>
                                                {user?.role === "Admin" && (
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            <button
                                                                onClick={() => startEditing(item)}
                                                                className="h-10 px-4 bg-slate-50 text-slate-400 hover:bg-[#FFD700] hover:text-[#004B7E] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                                            >
                                                                <Wrench size={14} />
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => item.id && handleDeleteItem(item.id)}
                                                                className="h-10 px-4 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                                            >
                                                                <Trash2 size={14} />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

