"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
    Users,
    UserPlus,
    Shield,
    ShieldCheck,
    Search,
    Check
} from "lucide-react";

interface User {
    id: number;
    username: string;
    name: string;
    phone: string;
    role: string;
}

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const { user: currentUser } = useAuth();

    const fetchUsers = async () => {
        try {
            const data = await apiFetch("/api/users");
            setUsers(data);
        } catch (err: unknown) {
            setError((err as Error).message || "Failed to fetch users");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const promoteToMechanic = async (userId: number) => {
        try {
            await apiFetch("/api/promote", {
                method: "POST",
                body: JSON.stringify({ user_id: userId, new_role: "Mechanic" }),
            });
            // Refresh list
            fetchUsers();
        } catch (err: unknown) {
            alert((err as Error).message || "Promotion failed");
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white">User Management</h1>
                        <p className="text-zinc-500 text-sm mt-1">Manage platform users and assign roles</p>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-full md:w-64 text-sm transition-all"
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl">
                        {error}
                    </div>
                )}

                <div className="bg-zinc-900 border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                                <th className="px-8 py-5">User</th>
                                <th className="px-8 py-5">Contact</th>
                                <th className="px-8 py-5">Role</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                            <span className="text-zinc-500 font-medium">Loading users...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-zinc-500">
                                        No users found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-zinc-300 border border-white/10">
                                                    {u.name[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">{u.name}</div>
                                                    <div className="text-xs text-zinc-500">@{u.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-sm text-zinc-300 font-medium">{u.phone}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`
                                                inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                                                ${u.role === "Admin" ? "bg-purple-500/10 text-purple-400 ring-1 ring-inset ring-purple-500/20" :
                                                    u.role === "Mechanic" ? "bg-indigo-500/10 text-indigo-400 ring-1 ring-inset ring-indigo-500/20" :
                                                        "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20"}
                                            `}>
                                                {u.role === "Admin" ? <ShieldCheck size={12} /> : u.role === "Mechanic" ? <UserPlus size={12} /> : <Users size={12} />}
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            {u.role === "Customer" && (
                                                <button
                                                    onClick={() => promoteToMechanic(u.id)}
                                                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 inline-flex items-center gap-2 active:scale-95"
                                                >
                                                    <Shield size={14} />
                                                    Promote to Mechanic
                                                </button>
                                            )}
                                            {u.role === "Mechanic" && (
                                                <div className="text-zinc-500 text-xs font-medium inline-flex items-center gap-1">
                                                    <Check size={14} className="text-indigo-500" />
                                                    Staff Member
                                                </div>
                                            )}
                                            {u.role === "Admin" && u.id !== currentUser?.user_id && (
                                                <span className="text-zinc-600 text-xs italic">System Admin</span>
                                            )}
                                            {u.id === currentUser?.user_id && (
                                                <span className="text-indigo-400 text-xs font-bold ring-1 ring-indigo-400/30 px-2 py-1 rounded-md">You</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
