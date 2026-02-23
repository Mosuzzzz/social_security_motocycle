"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
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

    if (user?.role !== "Admin") {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-96 gap-4">
                    <AlertCircle size={48} className="text-amber-500" />
                    <h2 className="text-xl font-bold">Access Denied</h2>
                    <p className="text-zinc-500">Only admins can manage stock.</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Stock Management</h1>
                    <p className="text-zinc-500 text-sm mt-1">Manage service items and parts inventory</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Save Item Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 sticky top-24">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                {editingItem ? (
                                    <Wrench size={20} className="text-amber-400" />
                                ) : (
                                    <Plus size={20} className="text-indigo-400" />
                                )}
                                {editingItem ? "Edit Item" : "Add New Item"}
                            </h2>
                            <form onSubmit={handleSaveItem} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Item Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Engine Oil 10W-40"
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white placeholder-zinc-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Price (฿)</label>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={newItemPrice}
                                            onChange={(e) => setNewItemPrice(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white placeholder-zinc-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Quantity</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={newItemQuantity}
                                            onChange={(e) => setNewItemQuantity(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white placeholder-zinc-500"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className={`w-full py-4 ${editingItem ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20" : "bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20"} disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2`}
                                    >
                                        {isSaving ? "Saving..." : editingItem ? "Save Changes" : "Add to Inventory"}
                                    </button>
                                    {editingItem && (
                                        <button
                                            type="button"
                                            onClick={cancelEditing}
                                            className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Inventory List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between gap-4">
                            <h2 className="text-xl font-bold">Current Inventory</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search items..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm w-full md:w-64"
                                />
                            </div>
                        </div>

                        <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/5 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                                        <th className="px-8 py-5">Item Name</th>
                                        <th className="px-8 py-5">Price</th>
                                        <th className="px-8 py-5">Stock</th>
                                        <th className="px-8 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-12 text-center text-zinc-500 italic">Loading inventory...</td>
                                        </tr>
                                    ) : filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-12 text-center text-zinc-500 italic">No items found matching your search.</td>
                                        </tr>
                                    ) : (
                                        filteredItems.map((item, index) => (
                                            <tr key={item.id || `stock-item-${index}`} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-8 py-6 font-medium text-white">{item.name}</td>
                                                <td className="px-8 py-6 text-emerald-400 font-bold">฿{item.price.toLocaleString()}</td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${item.quantity < 5 ? "bg-red-500/10 text-red-400" : "bg-white/5 text-zinc-400"}`}>
                                                        {item.quantity} units
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => startEditing(item)}
                                                            className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-all flex items-center gap-2 text-xs font-bold"
                                                        >
                                                            <Wrench size={14} />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => item.id && handleDeleteItem(item.id)}
                                                            className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-400 transition-all flex items-center gap-2 text-xs font-bold"
                                                        >
                                                            <Trash2 size={14} />
                                                            Delete
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
                </div>
            </div>
        </DashboardLayout>
    );
}

