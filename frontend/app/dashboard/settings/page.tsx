"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import liff from "@line/liff";
import {
    User,
    Shield,
    MessageCircle,
    Link as LinkIcon,
    Loader2
} from "lucide-react";

interface UserProfile {
    id: number;
    username: string;
    name: string;
    phone: string;
    role: string;
    line_connected?: boolean;
    avatar_url?: string;
}

export default function SettingsPage() {
    const { user: authUser, updateUser } = useAuth();
    const { showToast } = useToast();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnectingLine, setIsConnectingLine] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [justDisconnected, setJustDisconnected] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await apiFetch("/api/me");
                setProfile(data);
                setName(data.name);
                setPhone(data.phone);
            } catch (err) {
                console.error("Failed to fetch profile", err);
                showToast("Could not load profile data", "error");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [showToast]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            await apiFetch("/api/me", {
                method: "PUT",
                body: JSON.stringify({ name, phone }),
            });
            showToast("Profile updated successfully", "success");
            setProfile(prev => prev ? { ...prev, name, phone } : null);
        } catch (err) {
            showToast((err as Error).message || "Failed to update profile", "error");
        } finally {
            setIsUpdating(false);
        }
    };

    useEffect(() => {
        const autoConnectLine = async () => {
            if (liff.isLoggedIn() && !profile?.line_connected && !isConnectingLine && !justDisconnected) {
                try {
                    const lineProfile = await liff.getProfile();
                    const lineId = lineProfile.userId;

                    await apiFetch("/api/line/connect", {
                        method: "POST",
                        body: JSON.stringify({ line_user_id: lineId }),
                    });

                    showToast("LINE account connected successfully!", "success");
                    setProfile(prev => prev ? { ...prev, line_connected: true, avatar_url: lineProfile.pictureUrl } : null);
                    updateUser({ avatar_url: lineProfile.pictureUrl });
                } catch (err: unknown) {
                    console.error("Auto-connect failed:", err);
                }
            }
        };

        if (profile && !isLoading) {
            autoConnectLine();
        }
    }, [profile, isLoading, isConnectingLine, showToast, justDisconnected, updateUser]);

    const handleConnectLine = async () => {
        setIsConnectingLine(true);
        setJustDisconnected(false);
        try {
            if (!liff.isLoggedIn()) {
                liff.login();
                setIsConnectingLine(false);
                return;
            }

            const lineProfile = await liff.getProfile();
            const lineId = lineProfile.userId;

            await apiFetch("/api/line/connect", {
                method: "POST",
                body: JSON.stringify({ line_user_id: lineId }),
            });

            showToast("LINE account connected successfully!", "success");
            setProfile(prev => prev ? { ...prev, line_connected: true, avatar_url: lineProfile.pictureUrl } : null);
            updateUser({ avatar_url: lineProfile.pictureUrl });
        } catch (err: unknown) {
            console.error("LINE connection error:", err);
            showToast((err as Error).message || "Failed to connect LINE", "error");
        } finally {
            setIsConnectingLine(false);
        }
    };

    const handleDisconnectLine = async () => {
        if (!confirm("Are you sure you want to disconnect?")) {
            return;
        }

        setIsConnectingLine(true);
        try {
            await apiFetch("/api/line/disconnect", { method: "POST" });
            setJustDisconnected(true);
            if (liff.isLoggedIn()) liff.logout();
            showToast("Disconnected LINE account", "success");
            setProfile(prev => prev ? { ...prev, line_connected: false, avatar_url: undefined } : null);
            updateUser({ avatar_url: undefined });
        } catch (err: unknown) {
            showToast((err as Error).message || "Failed to disconnect", "error");
        } finally {
            setIsConnectingLine(false);
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <Loader2 className="w-8 h-8 text-[#007AFF] animate-spin" />
                    <p className="text-[#8E8E93] font-medium">Loading Profile...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-8 p-6">
                <section>
                    <p className="text-[#8E8E93] font-semibold text-xs uppercase tracking-widest mb-1">Preferences</p>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Profile Section */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="ios-card p-8 flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full bg-[#007AFF]/10 border-4 border-background flex items-center justify-center text-3xl font-bold text-[#007AFF] shadow-inner relative overflow-hidden mb-4">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                                ) : (
                                    profile?.name.charAt(0)
                                )}
                            </div>
                            <h3 className="text-xl font-bold tracking-tight mb-1">{profile?.name}</h3>
                            <p className="text-[#8E8E93] text-sm font-medium mb-4">@{profile?.username}</p>

                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ring-1 ring-inset ${profile?.role === "Admin" ? "bg-[#FF9500]/10 text-[#FF9500] ring-[#FF9500]/20" :
                                profile?.role === "Mechanic" ? "bg-[#007AFF]/10 text-[#007AFF] ring-[#007AFF]/20" :
                                    "bg-[#34C759]/10 text-[#34C759] ring-[#34C759]/20"
                                }`}>
                                <Shield size={12} className="inline mr-1" />
                                {profile?.role}
                            </span>
                        </div>

                        <div className="ios-card p-6 space-y-3">
                            <h4 className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Platform Status</h4>
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#34C759] shadow-lg shadow-[#34C759]/20"></div>
                                <span className="text-sm font-bold">Active Member</span>
                            </div>
                            <p className="text-xs text-[#8E8E93] font-medium leading-relaxed">Your account is fully verified and active.</p>
                        </div>
                    </div>

                    {/* Form and Connections */}
                    <div className="md:col-span-2 space-y-6">
                        <form onSubmit={handleUpdateProfile} className="ios-card overflow-hidden">
                            <div className="p-5 border-b border-[#E5E5EA] dark:border-[#38383A] flex items-center justify-between bg-[#F9F9F9] dark:bg-[#2C2C2E]">
                                <h3 className="font-bold flex items-center gap-2 text-sm">
                                    <User size={18} className="text-[#007AFF]" />
                                    Profile Information
                                </h3>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="text-[#007AFF] font-bold text-sm hover:opacity-70 disabled:opacity-50 transition-opacity"
                                >
                                    {isUpdating ? "Saving..." : "Done"}
                                </button>
                            </div>

                            <div className="flex flex-col divide-y divide-[#E5E5EA] dark:divide-[#38383A]">
                                <div className="px-6 py-4 flex items-center justify-between">
                                    <label className="text-sm font-medium text-[#8E8E93] w-1/3">Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="text-right bg-transparent outline-none font-medium text-sm w-2/3 text-foreground"
                                    />
                                </div>
                                <div className="px-6 py-4 flex items-center justify-between">
                                    <label className="text-sm font-medium text-[#8E8E93] w-1/3">Phone</label>
                                    <input
                                        type="text"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="text-right bg-transparent outline-none font-medium text-sm w-2/3 text-foreground"
                                    />
                                </div>
                                <div className="px-6 py-4 flex items-center justify-between bg-[#F2F2F7]/50 dark:bg-[#1C1C1E]/50">
                                    <label className="text-sm font-medium text-[#8E8E93] w-1/3">Username</label>
                                    <span className="font-medium text-sm text-[#8E8E93] text-right">{profile?.username}</span>
                                </div>
                                <div className="px-6 py-4 flex items-center justify-between bg-[#F2F2F7]/50 dark:bg-[#1C1C1E]/50">
                                    <label className="text-sm font-medium text-[#8E8E93] w-1/3">Joined</label>
                                    <span className="font-medium text-sm text-[#8E8E93] text-right">January 2024</span>
                                </div>
                            </div>
                        </form>

                        <div className="ios-card overflow-hidden">
                            <div className="p-5 border-b border-[#E5E5EA] dark:border-[#38383A] bg-[#F9F9F9] dark:bg-[#2C2C2E]">
                                <h3 className="font-bold flex items-center gap-2 text-sm">
                                    <LinkIcon size={18} className="text-[#007AFF]" />
                                    Connected Apps
                                </h3>
                            </div>

                            <div className="p-6 flex items-center justify-between hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-[#06C755] text-white rounded-xl flex items-center justify-center shadow-lg shadow-[#06C755]/20">
                                        <MessageCircle size={20} fill="currentColor" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">LINE Messaging</p>
                                        <p className="text-xs text-[#8E8E93] font-medium mt-0.5">Real-time repair notifications</p>
                                    </div>
                                </div>

                                <button
                                    onClick={profile?.line_connected ? handleDisconnectLine : handleConnectLine}
                                    disabled={isConnectingLine}
                                    className={`px-4 py-1.5 font-bold text-xs rounded-full transition-all active:scale-95 border ${profile?.line_connected
                                        ? "border-[#FF3B30] text-[#FF3B30] hover:bg-[#FF3B30]/10"
                                        : "border-[#06C755] text-[#06C755] hover:bg-[#06C755]/10"
                                        }`}
                                >
                                    {isConnectingLine ? "..." : profile?.line_connected ? "Disconnect" : "Connect"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
