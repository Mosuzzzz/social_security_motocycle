"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
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
    Plus
} from "lucide-react";
import AuthGuard from "./AuthGuard";
import NotificationCenter from "./NotificationCenter";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile overlay
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop collapse
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
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

    const menuItems: Record<string, MenuItem[]> = {
        Admin: [
            { name: "Overview", icon: <BarChart2 size={20} />, href: "/dashboard" },
            { name: "Users", icon: <Users size={20} />, href: "/dashboard/users" },
            { name: "Orders", icon: <FileText size={20} />, href: "/dashboard/orders" },
            { name: "Stock", icon: <Wrench size={20} />, href: "/dashboard/stock" },
        ],
        Mechanic: [
            { name: "Overview", icon: <BarChart2 size={20} />, href: "/dashboard" },
            { name: "Orders", icon: <FileText size={20} />, href: "/dashboard/orders" },
            { name: "Stock", icon: <Wrench size={20} />, href: "/dashboard/stock" },
        ],
        Customer: [
            { name: "History", icon: <FileText size={20} />, href: "/dashboard" },
            { name: "Book", icon: <Wrench size={20} />, href: "/dashboard/new-booking" },
            { name: "Pay", icon: <CreditCard size={20} />, href: "/dashboard/payments" },
        ]
    };

    const currentMenu = user ? menuItems[user.role] : [];

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
                const results: any[] = [];

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
                    } catch (e) {
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
            <div className="flex h-screen bg-transparent text-white overflow-hidden font-sans">
                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={`
                    fixed inset-y-0 left-0 bg-black/40 backdrop-blur-2xl border-r border-white/10 z-50 transform transition-all duration-300 ease-in-out md:relative
                    ${isSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0"}
                    ${isSidebarCollapsed ? "md:w-[88px]" : "md:w-72"}
                `}>
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* Sidebar Header / Toggle */}
                        <div className={`p-8 transition-all duration-300 ${isSidebarCollapsed ? "md:px-6 md:py-8 flex flex-col items-center" : ""}`}>
                            <div className={`flex items-center w-full mb-8 ${isSidebarCollapsed ? "md:mb-6 justify-center" : "justify-between"}`}>
                                <button
                                    className="hidden md:flex p-2 -ml-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                >
                                    <Menu size={24} />
                                </button>
                                <button className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg ml-auto -mr-2" onClick={() => setIsSidebarOpen(false)}>
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Navigation */}
                            <nav className="space-y-2">
                                {currentMenu.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            title={isSidebarCollapsed ? item.name : undefined}
                                            className={`flex items-center justify-between py-3 rounded-xl transition-all group ${isSidebarCollapsed ? "px-0 justify-center" : "px-4"
                                                } ${isActive
                                                    ? "bg-white/10 text-white font-medium border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                                                    : "text-gray-400 hover:text-white hover:bg-white/5 font-light"
                                                }`}
                                        >
                                            <div className={`flex items-center gap-3 overflow-hidden ${isSidebarCollapsed ? "justify-center" : ""}`}>
                                                <span className={`${isActive ? "text-pink-400" : ""} shrink-0`}>{item.icon}</span>
                                                <span className={`text-[13px] whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? "opacity-0 w-0 hidden md:block" : "opacity-100"}`}>
                                                    {item.name}
                                                </span>
                                            </div>
                                            {(isActive && !isSidebarCollapsed) && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Bottom Actions */}
                        <div className={`mt-auto border-t border-white/5 space-y-2 transition-all duration-300 ${isSidebarCollapsed ? "p-6 md:p-4 flex flex-col items-center" : "p-6"}`}>
                            <Link
                                href="/"
                                title={isSidebarCollapsed ? "Home" : undefined}
                                className={`flex items-center py-3 rounded-xl transition-all group ${isSidebarCollapsed ? "px-0 justify-center w-full" : "px-4 gap-3"
                                    } text-gray-400 hover:bg-white/5 hover:text-white font-light`}
                            >
                                <Home size={20} className="shrink-0" />
                                <span className={`text-[13px] whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? "opacity-0 w-0 hidden md:block" : "opacity-100"}`}>
                                    Home
                                </span>
                            </Link>
                            <Link
                                href="/dashboard/settings"
                                title={isSidebarCollapsed ? "Settings" : undefined}
                                className={`flex items-center py-3 rounded-xl transition-all group ${isSidebarCollapsed ? "px-0 justify-center w-full" : "px-4 gap-3"
                                    } ${pathname === "/dashboard/settings" ? "text-white bg-white/10" : "text-gray-400 hover:bg-white/5 hover:text-white font-light"}`}
                            >
                                <Settings size={20} className="shrink-0" />
                                <span className={`text-[13px] whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? "opacity-0 w-0 hidden md:block" : "opacity-100"}`}>
                                    Settings
                                </span>
                            </Link>
                            <button
                                onClick={logout}
                                title={isSidebarCollapsed ? "Logout" : undefined}
                                className={`w-full flex items-center py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-light ${isSidebarCollapsed ? "px-0 justify-center" : "px-4 gap-3"
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
                <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
                    {/* Top Header */}
                    <header className="h-20 flex items-center justify-between px-8 sticky top-0 z-30 border-b border-white/5 bg-black/20 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <button
                                className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                onClick={handleMenuClick}
                            >
                                <Menu size={24} />
                            </button>
                            <div className="flex flex-col md:block hidden">
                                <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Navigation</span>
                                <h2 className="text-xl font-medium tracking-tight text-gray-200">
                                    {currentMenu.find(item => item.href === pathname)?.name || (pathname === "/dashboard/settings" ? "Settings" : "Dashboard")}
                                </h2>
                            </div>
                        </div>

                        {/* Top Header Search */}
                        <div className="hidden md:flex flex-1 items-center justify-center px-8 relative">
                            <div className="relative w-full max-w-md group">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-pink-400 transition-colors" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search anything..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                    className="w-full bg-black/40 border border-white/10 rounded-full py-2.5 pl-11 pr-16 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-pink-500/50 focus:bg-white/10 transition-all shadow-inner"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                                    {isSearching ? (
                                        <div className="w-4 h-4 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[11px] font-sans font-medium text-gray-400 border border-white/10 rounded bg-white/5">⌘</kbd>
                                            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[11px] font-sans font-medium text-gray-400 border border-white/10 rounded bg-white/5">K</kbd>
                                        </>
                                    )}
                                </div>

                                {/* Dropdown Results */}
                                {isSearchFocused && searchQuery.trim() && (
                                    <div className="absolute top-full left-0 right-0 mt-3 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                                        {searchResults.length > 0 ? (
                                            <div className="py-2 max-h-96 overflow-y-auto no-scrollbar">
                                                {searchResults.map((result) => (
                                                    <Link
                                                        key={result.id}
                                                        href={result.href}
                                                        className="flex items-center gap-4 px-4 py-3 hover:bg-white/10 transition-colors group"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 group-hover:text-pink-400 group-hover:border-pink-500/30 transition-colors shrink-0">
                                                            {result.icon || <Search size={14} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-medium text-gray-200 truncate">{result.title}</div>
                                                            {result.subtitle && (
                                                                <div className="text-[11px] text-gray-500 truncate mt-0.5">{result.subtitle}</div>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] font-medium uppercase tracking-wider text-gray-600 bg-white/5 px-2 py-0.5 rounded-full shrink-0">
                                                            {result.type}
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : (
                                            !isSearching && (
                                                <div className="px-6 py-10 text-center">
                                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3 text-gray-500">
                                                        <Search size={20} />
                                                    </div>
                                                    <p className="text-sm text-gray-300 font-medium">No results found</p>
                                                    <p className="text-[12px] text-gray-500 mt-1">Try tweaking your keywords</p>
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
                            <div className="w-px h-8 bg-white/10 hidden md:block"></div>

                            <div className="flex items-center gap-3 pl-2 group cursor-pointer" onClick={() => window.location.href = '/dashboard/settings'}>
                                <div className="text-right hidden sm:block">
                                    <div className="text-[13px] font-medium text-gray-200">{user?.username}</div>
                                    <div className="text-[11px] text-pink-400">{user?.role}</div>
                                </div>
                                <div className="w-10 h-10 rounded-full border border-pink-500/30 flex items-center justify-center font-semibold text-pink-400 overflow-hidden shadow-[0_0_15px_rgba(236,72,153,0.15)] bg-black/50">
                                    {user?.avatar_url ? (
                                        <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                                    ) : (
                                        user?.username?.charAt(0).toUpperCase() || "U"
                                    )}
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-8 pb-32 md:pb-10">
                        {children}
                    </div>

                    {/* Quick Booking FAB */}
                    {user && (
                        <Link
                            href="/dashboard/new-booking"
                            className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-pink-500 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(236,72,153,0.5)] hover:bg-pink-400 hover:scale-110 hover:shadow-[0_0_30px_rgba(236,72,153,0.8)] transition-all duration-300"
                            title="Quick Booking"
                        >
                            <Plus size={28} />
                        </Link>
                    )}

                </main>
            </div>
        </AuthGuard>
    );
}
