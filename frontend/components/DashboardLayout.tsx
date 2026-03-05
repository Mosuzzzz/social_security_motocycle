"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
    Search,
    Home,
    Plus,
    HelpCircle,
    PieChart,
    Calendar,
    MessageSquare
} from "lucide-react";
import AuthGuard from "./AuthGuard";
import NotificationCenter from "./NotificationCenter";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile overlay
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop collapse
    const searchInputRef = useRef<HTMLInputElement>(null);

    interface SearchResult {
        id: string;
        type: string;
        title: string;
        subtitle?: string;
        href: string;
        icon?: React.ReactNode;
    }

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Keydown listener for Cmd+K / Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    interface MenuItem {
        name: string;
        icon: React.ReactNode;
        href: string;
    }

    const currentMenu = React.useMemo(() => {
        if (!user) return [];
        const menuItems: Record<string, MenuItem[]> = {
            Admin: [
                { name: "Overview", icon: <BarChart2 size={20} />, href: "/dashboard" },
                { name: "Users", icon: <Users size={20} />, href: "/dashboard/users" },
                { name: "Orders", icon: <FileText size={20} />, href: "/dashboard/orders" },
                { name: "Stock", icon: <Wrench size={20} />, href: "/dashboard/stock" },
                { name: "Reports", icon: <PieChart size={20} />, href: "/dashboard/reports" },
                { name: "Feedback", icon: <MessageSquare size={20} />, href: "/dashboard/feedback" },
            ],
            Mechanic: [
                { name: "Overview", icon: <BarChart2 size={20} />, href: "/dashboard" },
                { name: "Orders", icon: <FileText size={20} />, href: "/dashboard/orders" },
                { name: "Stock", icon: <Wrench size={20} />, href: "/dashboard/stock" },
                { name: "Support", icon: <HelpCircle size={20} />, href: "/dashboard/support" },
            ],
            Customer: [
                { name: "History", icon: <FileText size={20} />, href: "/dashboard" },
                { name: "Book", icon: <Wrench size={20} />, href: "/dashboard/new-booking" },
                { name: "Pay", icon: <CreditCard size={20} />, href: "/dashboard/payments" },
                { name: "Support", icon: <HelpCircle size={20} />, href: "/dashboard/support" },
            ]
        };
        return menuItems[user.role] || [];
    }, [user]);

    // Search logic
    useEffect(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) {
            setSearchResults([]);
            return;
        }

        const fetchSearch = async () => {
            setIsSearching(true);
            try {
                const results: SearchResult[] = [];

                // 1. Search Menu Items
                currentMenu.forEach(item => {
                    if (item.name.toLowerCase().includes(query)) {
                        results.push({ id: `nav-${item.name}`, type: 'Navigation', title: item.name, href: item.href, icon: item.icon });
                    }
                });

                // 2. Add some quick actions
                if ("settings".includes(query)) {
                    results.push({ id: 'nav-settings', type: 'Navigation', title: 'Settings', href: '/dashboard/settings', icon: <Settings size={16} /> });
                }
                if ("new booking".includes(query) || "create order".includes(query)) {
                    results.push({ id: 'nav-book', type: 'Action', title: 'New Booking', href: '/dashboard/new-booking', icon: <Plus size={16} /> });
                }

                // 3. Optional: API lookups if query is > 2 chars 
                if (query.length > 2 && user && (user.role === "Admin" || user.role === "Mechanic")) {
                    try {
                        const [orders, stock] = await Promise.all([
                            apiFetch("/api/orders").catch(() => []),
                            apiFetch("/api/stock").catch(() => [])
                        ]);

                        if (Array.isArray(orders)) {
                            orders.forEach(order => {
                                // Match ID or random text
                                if (`${order.id}`.includes(query) || (order.bike_brand && order.bike_brand.toLowerCase().includes(query))) {
                                    results.push({
                                        id: `ord-${order.id}`,
                                        type: 'Order',
                                        title: `Order #${order.id}`,
                                        subtitle: order.bike_brand || "Standard Service",
                                        href: `/dashboard/orders`
                                    });
                                }
                            });
                        }

                        if (Array.isArray(stock)) {
                            stock.forEach(item => {
                                if (item.name && item.name.toLowerCase().includes(query)) {
                                    results.push({
                                        id: `stk-${item.id}`,
                                        type: 'Stock',
                                        title: item.name,
                                        subtitle: `Qty: ${item.quantity}`,
                                        href: `/dashboard/stock`
                                    });
                                }
                            });
                        }
                    } catch {
                        // silently ignore api fetch errors during search
                    }
                }

                // Limit results
                setSearchResults(results.slice(0, 8));
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(fetchSearch, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, currentMenu, user]);

    // Automatically close mobile sidebar on route change
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    const handleMenuClick = () => {
        if (window.innerWidth < 768) {
            setIsSidebarOpen(true);
        } else {
            setIsSidebarCollapsed(!isSidebarCollapsed);
        }
    };

    return (
        <AuthGuard>
            <div className="flex h-screen bg-[#F8FAFC] text-slate-800 overflow-hidden font-sans">
                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={`
                    fixed inset-y-0 left-0 bg-[#004B7E] text-white z-50 transform transition-all duration-300 ease-in-out md:relative shadow-2xl
                    ${isSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0"}
                    ${isSidebarCollapsed ? "md:w-[88px]" : "md:w-72"}
                `}>
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* Sidebar Header / Toggle */}
                        <div className={`p-8 transition-all duration-300 ${isSidebarCollapsed ? "md:px-6 md:py-8 flex flex-col items-center" : ""}`}>
                            <div className={`flex items-center w-full mb-8 ${isSidebarCollapsed ? "md:mb-6 justify-center" : "justify-between"}`}>
                                <Link href="/" className={`flex items-center gap-3 shrink-0 group ${isSidebarCollapsed ? "hidden" : ""}`}>
                                    <div className="bg-[#FFD700] p-1.5 rounded-lg transform group-hover:rotate-12 transition-transform shadow-lg">
                                        <Wrench className="text-[#004B7E]" size={20} />
                                    </div>
                                    <div className="flex flex-col leading-none">
                                        <span className="text-xl font-black text-[#FFD700] tracking-tighter uppercase">MOTOFLOW</span>
                                    </div>
                                </Link>
                                <button
                                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-auto"
                                    onClick={() => window.innerWidth < 768 ? setIsSidebarOpen(false) : setIsSidebarCollapsed(!isSidebarCollapsed)}
                                >
                                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                                </button>
                            </div>

                            {/* Navigation */}
                            <nav className="space-y-1.5">
                                {currentMenu.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            title={isSidebarCollapsed ? item.name : undefined}
                                            className={`flex items-center justify-between py-3.5 rounded-xl transition-all group ${isSidebarCollapsed ? "px-4 justify-center" : "px-4"
                                                } ${isActive
                                                    ? "bg-[#FFD700] text-[#004B7E] font-black shadow-lg"
                                                    : "text-white/70 hover:text-white hover:bg-white/5 font-bold"
                                                }`}
                                        >
                                            <div className={`flex items-center overflow-hidden ${isSidebarCollapsed ? "justify-center" : "gap-3"}`}>
                                                <span className="shrink-0">{item.icon}</span>
                                                <span className={`text-[13px] whitespace-nowrap transition-all duration-300 uppercase tracking-wider ${isSidebarCollapsed ? "opacity-0 w-0 hidden md:block" : "opacity-100"}`}>
                                                    {item.name}
                                                </span>
                                            </div>
                                            {(isActive && !isSidebarCollapsed) && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#004B7E]/40" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Bottom Actions */}
                        <div className={`mt-auto border-t border-white/10 space-y-1 transition-all duration-300 ${isSidebarCollapsed ? "p-6 md:p-4 flex flex-col items-center" : "p-6"}`}>
                            <Link
                                href="/"
                                className={`flex items-center py-3 rounded-xl transition-all group ${isSidebarCollapsed ? "px-4 justify-center w-full" : "px-4 gap-3"
                                    } text-white/60 hover:bg-white/5 hover:text-white font-bold uppercase tracking-wider`}
                            >
                                <Home size={20} className="shrink-0" />
                                <span className={`text-[13px] whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? "opacity-0 w-0 hidden md:block" : "opacity-100"}`}>
                                    Home
                                </span>
                            </Link>
                            <Link
                                href="/dashboard/settings"
                                className={`flex items-center py-3 rounded-xl transition-all group ${isSidebarCollapsed ? "px-4 justify-center w-full" : "px-4 gap-3"
                                    } ${pathname === "/dashboard/settings" ? "bg-[#FFD700] text-[#004B7E] font-black" : "text-white/60 hover:bg-white/5 hover:text-white font-bold uppercase tracking-wider"}`}
                            >
                                <Settings size={20} className="shrink-0" />
                                <span className={`text-[13px] whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? "opacity-0 w-0 hidden md:block" : "opacity-100"}`}>
                                    Settings
                                </span>
                            </Link>
                            <button
                                onClick={logout}
                                className={`w-full flex items-center py-3 text-red-300 hover:bg-red-500/10 rounded-xl transition-all font-bold uppercase tracking-wider ${isSidebarCollapsed ? "px-4 justify-center" : "px-4 gap-3"
                                    }`}
                            >
                                <LogOut size={20} className="shrink-0" />
                                <span className={`text-[13px] whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? "opacity-0 w-0 hidden md:block" : "opacity-100"}`}>
                                    Logout
                                </span>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                    {/* Top Header */}
                    <header className="h-20 flex items-center justify-between px-8 sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <button
                                className="md:hidden p-2 text-slate-500 hover:text-[#004B7E] hover:bg-slate-100 rounded-lg transition-colors"
                                onClick={handleMenuClick}
                            >
                                <Menu size={24} />
                            </button>
                            <div className="hidden md:flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1 block">MotoFlow Service Terminal</span>
                                <h2 className="text-xl font-black text-[#004B7E] uppercase tracking-tighter">
                                    {currentMenu.find(item => item.href === pathname)?.name || (pathname === "/dashboard/settings" ? "Settings" : "Dashboard")}
                                </h2>
                            </div>
                        </div>

                        {/* Top Header Search */}
                        <div className="hidden md:flex flex-1 items-center justify-center px-8 relative">
                            <div className="relative w-full max-w-md group">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#004B7E] transition-colors" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search for information..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-16 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-[#004B7E]/30 focus:bg-white transition-all shadow-sm"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                                    {isSearching ? (
                                        <div className="w-4 h-4 border-2 border-[#004B7E]/20 border-t-[#004B7E] rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-sans font-bold text-slate-400 border border-slate-200 rounded bg-white">⌘</kbd>
                                            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-sans font-bold text-slate-400 border border-slate-200 rounded bg-white">K</kbd>
                                        </>
                                    )}
                                </div>

                                {/* Dropdown Results */}
                                {isSearchFocused && searchQuery.trim() && (
                                    <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                                        {searchResults.length > 0 ? (
                                            <div className="py-2 max-h-96 overflow-y-auto no-scrollbar">
                                                {searchResults.map((result) => (
                                                    <Link
                                                        key={result.id}
                                                        href={result.href}
                                                        className="flex items-center gap-4 px-4 py-3 hover:bg-[#F8FAFC] transition-colors group"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-[#004B7E] group-hover:bg-[#FFD700]/20 transition-colors shrink-0">
                                                            {result.icon || <Search size={14} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-bold text-slate-800 truncate">{result.title}</div>
                                                            {result.subtitle && (
                                                                <div className="text-[11px] text-slate-500 truncate mt-0.5">{result.subtitle}</div>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] font-black uppercase tracking-wider text-[#004B7E]/60 bg-slate-100 px-2.5 py-0.5 rounded-full shrink-0">
                                                            {result.type}
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : (
                                            !isSearching && (
                                                <div className="px-6 py-10 text-center">
                                                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3 text-slate-300">
                                                        <Search size={20} />
                                                    </div>
                                                    <p className="text-sm text-slate-800 font-black">No results found</p>
                                                    <p className="text-[12px] text-slate-500 mt-1">Try searching with different keywords.</p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <NotificationCenter />
                            {/* Divider */}
                            <div className="w-px h-8 bg-slate-200 hidden md:block"></div>

                            <div className="flex items-center gap-3 pl-2 group cursor-pointer" onClick={() => window.location.href = '/dashboard/settings'}>
                                <div className="text-right hidden sm:block leading-tight">
                                    <div className="text-[13px] font-black text-[#004B7E]">{user?.username}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.role}</div>
                                </div>
                                <div className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center font-black text-[#004B7E] overflow-hidden shadow-sm bg-slate-50 group-hover:border-[#FFD700] transition-colors">
                                    {user?.avatar_url ? (
                                        <Image
                                            src={user.avatar_url}
                                            alt={user.username}
                                            width={40}
                                            height={40}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        user?.username?.charAt(0).toUpperCase() || "U"
                                    )}
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-8 pb-32 md:pb-10 bg-[#F8FAFC]">
                        {children}
                    </div>

                    {/* Quick Booking FAB */}
                    {user && (
                        <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-4">
                            <Link
                                href="/dashboard/new-booking"
                                className="w-16 h-16 bg-[#004B7E] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform shadow-blue-500/40 relative group"
                            >
                                <Calendar size={28} />
                                <span className="absolute right-full mr-4 bg-white text-slate-800 px-4 py-2 rounded-xl shadow-xl text-xs font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Book Repair</span>
                            </Link>
                        </div>
                    )}

                </main>
            </div>
        </AuthGuard>
    );
}
