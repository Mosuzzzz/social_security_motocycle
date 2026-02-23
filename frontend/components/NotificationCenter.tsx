"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle2, Clock, Package, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

interface Notification {
    notification_id: number;
    user_id: number;
    order_id: number;
    channel: string;
    message: string;
    sent_at: string;
    status: "Sent" | "Read" | "Failed";
}

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const fetchNotifications = async () => {
        try {
            const data = await apiFetch("/api/notifications");
            const sortedData = (data || []).sort((a: Notification, b: Notification) =>
                new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
            );
            setNotifications(sortedData);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const markAsRead = async (id: number) => {
        try {
            await apiFetch(`/api/notifications/${id}/read`, { method: "POST" });
            setNotifications(prev =>
                prev.map(n => n.notification_id === id ? { ...n, status: "Read" as const } : n)
            );
        } catch (err) {
            console.error("Failed to mark notification as read", err);
        }
    };

    const handleNotificationClick = async (notif: Notification) => {
        if (notif.status === "Sent") {
            await markAsRead(notif.notification_id);
        }

        setIsOpen(false);

        // Navigate if there is an order ID
        if (notif.order_id) {
            router.push(`/dashboard/orders/${notif.order_id}`);
        }
    };

    const unreadCount = notifications.filter(n => n.status === "Sent").length;

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-xl cursor-pointer hover:text-white transition-all relative ${isOpen ? "bg-[#007AFF] text-white shadow-lg shadow-[#007AFF]/20" : "text-[#8E8E93] hover:bg-black/5 dark:hover:bg-white/5"}`}
            >
                <Bell size={24} strokeWidth={2} />
                {unreadCount > 0 && (
                    <span className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 bg-[#FF3B30] rounded-full border-2 border-white dark:border-black flex items-center justify-center animate-pulse">
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-2xl border border-[#E5E5EA] dark:border-[#38383A] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="px-5 py-4 border-b border-[#E5E5EA] dark:border-[#38383A] flex items-center justify-between bg-[#F9F9F9]/80 dark:bg-[#2C2C2E]/80">
                        <h3 className="font-bold text-base tracking-tight">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 bg-[#007AFF] text-white text-[10px] font-bold rounded-full">
                                {unreadCount} NEW
                            </span>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-10 text-center space-y-3">
                                <div className="w-12 h-12 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-full flex items-center justify-center mx-auto text-[#8E8E93]">
                                    <Bell size={20} />
                                </div>
                                <p className="text-[#8E8E93] text-sm font-medium">No new notifications</p>
                            </div>
                        ) : (
                            <div className="flex flex-col divide-y divide-[#E5E5EA] dark:divide-[#38383A]">
                                {notifications.map((n) => (
                                    <div
                                        key={n.notification_id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`px-5 py-4 transition-colors cursor-pointer group relative ${n.status === "Sent" ? "bg-[#007AFF]/5" : "hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E]"}`}
                                    >
                                        <div className="flex gap-4">
                                            <div className={`mt-0.5 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${n.message.toLowerCase().includes("paid") || n.message.toLowerCase().includes("successful")
                                                ? "bg-[#34C759]/10 text-[#34C759]"
                                                : n.message.toLowerCase().includes("cancel")
                                                    ? "bg-[#FF3B30]/10 text-[#FF3B30]"
                                                    : "bg-[#007AFF]/10 text-[#007AFF]"
                                                }`}>
                                                {n.message.toLowerCase().includes("paid") ? <CheckCircle2 size={18} /> :
                                                    n.message.toLowerCase().includes("booking") ? <Package size={18} /> :
                                                        <AlertCircle size={18} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm leading-snug wrap-break-word ${n.status === "Sent" ? "text-foreground font-semibold" : "text-[#8E8E93] font-medium"}`}>
                                                    {n.message}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <Clock size={12} className="text-[#C7C7CC]" />
                                                    <span className="text-[11px] text-[#8E8E93] font-medium">
                                                        {formatTimeAgo(n.sent_at)}
                                                    </span>
                                                </div>
                                            </div>
                                            {n.status === "Sent" && (
                                                <div className="w-2 h-2 bg-[#007AFF] rounded-full mt-1.5 shrink-0"></div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
