"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
    Users as UsersIcon,
    UserPlus,
    Shield,
    ShieldCheck,
    Search,
    Check,
    UserCircle,
    Phone,
    UserCheck,
    UserX
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
    const { showToast } = useToast();

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

    const changeRole = async (userId: number, role: "Mechanic" | "Customer") => {
        try {
            await apiFetch("/api/promote", {
                method: "POST",
                body: JSON.stringify({ user_id: userId, target_role: role }),
            });
            fetchUsers();
            showToast(`User role updated to ${role}`, "success");
        } catch (err: unknown) {
            showToast((err as Error).message || `Failed to change role to ${role}`, "error");
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-10 pt-4 pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#004B7E]/5 text-[#004B7E] text-[10px] font-black uppercase tracking-wider border border-[#004B7E]/10">
                            <ShieldCheck size={14} />
                            Administrative Tools
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-800 uppercase tracking-tighter">
                            User Management
                        </h1>
                        <p className="text-slate-400 font-bold text-sm max-w-md">Manage platform users, assign staff roles, and monitor account status.</p>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#004B7E] transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or username..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:border-[#004B7E] w-full md:w-80 text-sm font-bold shadow-sm transition-all"
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-6 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-3xl flex items-center gap-3 animate-in fade-in">
                        <UserX size={20} />
                        {error}
                    </div>
                )}

                {/* Users Table Card */}
                <div className="bg-white border border-slate-100 rounded-4xl overflow-hidden shadow-2xl relative">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50 bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-[#004B7E]">
                                <th className="px-8 py-6">User Identity</th>
                                <th className="px-8 py-6">Contact Details</th>
                                <th className="px-8 py-6">System Role</th>
                                <th className="px-8 py-6 text-right">Access Controls</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-12 h-12 border-4 border-[#004B7E]/10 border-t-[#004B7E] rounded-full animate-spin"></div>
                                            <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Retrieving Secure User Directory...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <UserCircle size={64} className="text-slate-100" />
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No users found matching your search</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-[#004B7E] text-xl shadow-inner group-hover:scale-110 transition-transform">
                                                    {u.name?.charAt(0).toUpperCase() || "?"}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-800 uppercase tracking-tight text-lg">{u.name}</span>
                                                    <span className="text-[10px] font-black text-[#004B7E] opacity-50 uppercase tracking-widest">@{u.username}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3 text-slate-500 font-bold text-sm">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                                                    <Phone size={14} />
                                                </div>
                                                {u.phone}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`
                                                inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm
                                                ${u.role === "Admin" ? "bg-red-50 text-red-600 border-red-100" :
                                                    u.role === "Mechanic" ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                        "bg-green-50 text-green-600 border-green-100"}
                                            `}>
                                                {u.role === "Admin" ? <ShieldCheck size={12} /> : u.role === "Mechanic" ? <UserCircle size={12} /> : <UsersIcon size={12} />}
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                {u.role === "Customer" && (
                                                    <button
                                                        onClick={() => changeRole(u.id, "Mechanic")}
                                                        className="px-6 py-3 bg-[#004B7E] hover:bg-[#003a61] text-white text-[10px] font-black rounded-xl transition-all shadow-lg shadow-[#004B7E]/10 flex items-center gap-2 uppercase tracking-widest active:scale-95 group/btn"
                                                    >
                                                        <Shield size={14} className="group-hover/btn:rotate-12 transition-transform" />
                                                        Promote to Mechanic
                                                    </button>
                                                )}
                                                {u.role === "Mechanic" && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-[#004B7E] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
                                                            <UserCheck size={14} />
                                                            Verified Staff
                                                        </div>
                                                        <button
                                                            onClick={() => changeRole(u.id, "Customer")}
                                                            className="px-4 py-2 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 text-[9px] font-black rounded-xl transition-all border border-red-100 uppercase tracking-widest"
                                                        >
                                                            Demote
                                                        </button>
                                                    </div>
                                                )}
                                                {u.role === "Admin" && u.id !== currentUser?.user_id && (
                                                    <span className="text-slate-300 font-black text-[10px] uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">Restricted</span>
                                                )}
                                                {u.id === currentUser?.user_id && (
                                                    <span className="bg-[#FFD700] text-[#004B7E] text-[10px] font-black px-5 py-2 rounded-xl shadow-lg shadow-[#FFD700]/10 uppercase tracking-[0.2em] border border-[#FFD700]">You</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Info Card */}
                <div className="p-8 bg-[#004B7E] rounded-4xl text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-white/10 blur-[100px] rounded-full group-hover:scale-110 transition-transform duration-1000"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/20">
                            <ShieldCheck size={32} className="text-[#FFD700]" />
                        </div>
                        <div className="text-center md:text-left">
                            <h3 className="text-2xl font-black uppercase tracking-tight">Security Audit Protocol</h3>
                            <p className="text-white/60 font-medium text-sm">Role changes are logged and monitored for security purposes. Ensure staff verification before promotion.</p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
