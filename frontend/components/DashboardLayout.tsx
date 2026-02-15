"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
    BarChart2,
    Settings,
    LogOut,
    Wrench,
    Users,
    FileText,
    CreditCard,
    X,
    Menu,
    Bell
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const menuItems = {
        Admin: [
            { name: "Overview", icon: <BarChart2 size={20} />, href: "/dashboard" },
            { name: "User Management", icon: <Users size={20} />, href: "/dashboard/users" },
            { name: "Service Orders", icon: <FileText size={20} />, href: "/dashboard/orders" },
            { name: "Reports", icon: <BarChart2 size={20} />, href: "/dashboard/reports" },
        ],
        Mechanic: [
            { name: "My Assignments", icon: <Wrench size={20} />, href: "/dashboard" },
            { name: "Order History", icon: <FileText size={20} />, href: "/dashboard/history" },
        ],
        Customer: [
            { name: "My Bookings", icon: <FileText size={20} />, href: "/dashboard" },
            { name: "New Booking", icon: <Wrench size={20} />, href: "/dashboard/new-booking" },
            { name: "Payments", icon: <CreditCard size={20} />, href: "/dashboard/payments" },
        ]
    };

    const currentMenu = user ? menuItems[user.role] : [];

    return (
        <div className="flex h-screen bg-[#050505] text-white selection:bg-indigo-500/30 overflow-hidden font-sans">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 w-72 bg-zinc-900 border-r border-white/5 z-50 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
                <div className="flex flex-col h-full p-6">
                    <div className="flex items-center justify-between mb-10 px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Wrench size={22} className="text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">MotoFlow</span>
                        </div>
                        <button className="md:hidden text-zinc-400" onClick={() => setIsSidebarOpen(false)}>
                            <X size={24} />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-2">
                        {currentMenu.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                            >
                                <span className="transition-transform group-hover:scale-110">{item.icon}</span>
                                <span className="font-medium text-sm">{item.name}</span>
                            </Link>
                        ))}
                    </nav>

                    <div className="mt-auto pt-6 border-t border-white/5 space-y-2">
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white transition-colors">
                            <Settings size={20} />
                            <span className="font-medium text-sm">Settings</span>
                        </button>
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 transition-colors"
                        >
                            <LogOut size={20} />
                            <span className="font-medium text-sm">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Top Header */}
                <header className="h-20 flex items-center justify-between px-6 md:px-10 border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden p-2 text-zinc-400 hover:text-white"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <h2 className="text-lg font-semibold capitalize">{user?.role} Dashboard</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2 text-zinc-400 hover:text-white relative">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border border-black"></span>
                        </button>
                        <div className="h-8 w-[1px] bg-white/10 mx-2 hidden sm:block"></div>
                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-right hidden sm:block">
                                <div className="text-sm font-semibold">{user?.username}</div>
                                <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{user?.role}</div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center font-bold text-indigo-400 ring-4 ring-black/50">
                                {user?.username?.[0].toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                    {children}
                </div>
            </main>

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
        </div>
    );
}
