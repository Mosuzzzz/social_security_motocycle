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
    Loader2,
    Zap
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
    const [isFriend, setIsFriend] = useState<boolean | null>(null);

    useEffect(() => {
        const checkFriendship = async () => {
            if (liff.isLoggedIn()) {
                const friendship = await liff.getFriendship();
                setIsFriend(friendship.friendFlag);
            } else {
                setIsFriend(false);
            }
        };
        checkFriendship();
    }, [isLoading]);

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
                        body: JSON.stringify({
                            line_user_id: lineId,
                            display_name: lineProfile.displayName,
                            picture_url: lineProfile.pictureUrl
                        }),
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
                body: JSON.stringify({
                    line_user_id: lineId,
                    display_name: lineProfile.displayName,
                    picture_url: lineProfile.pictureUrl
                }),
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
            <div className="max-w-4xl mx-auto space-y-8 animate-in relative z-10 pt-4 pb-20">
                <section>
                    <p className="text-[#004B7E] font-black text-[10px] uppercase tracking-[0.2em] mb-2">System Preferences</p>
                    <h1 className="text-3xl md:text-5xl font-black text-slate-800 uppercase tracking-tighter">
                        Account Settings
                    </h1>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Profile Section */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white border border-slate-100 rounded-4xl p-10 flex flex-col items-center text-center shadow-xl">
                            <div className="w-28 h-28 rounded-3xl bg-slate-50 border-4 border-white flex items-center justify-center text-4xl font-black text-[#004B7E] shadow-xl relative overflow-hidden mb-6">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt={profile?.name || ""} className="w-full h-full object-cover" />
                                ) : (
                                    profile?.name?.charAt(0) || "U"
                                )}
                            </div>
                            <h3 className="text-2xl font-black tracking-tight text-[#004B7E] uppercase mb-1">{profile?.name}</h3>
                            <p className="text-slate-400 font-bold text-sm mb-6">@{profile?.username}</p>

                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${profile?.role === "Admin" ? "bg-red-50 text-red-600 border-red-100" :
                                profile?.role === "Mechanic" ? "bg-blue-50 text-blue-600 border-blue-100" :
                                    "bg-green-50 text-green-600 border-green-100"
                                }`}>
                                <Shield size={12} className="inline mr-1.5" />
                                {profile?.role}
                            </span>
                        </div>

                        <div className="bg-[#004B7E] text-white rounded-4xl p-8 space-y-4 shadow-2xl relative overflow-hidden group">
                            <div className="absolute -bottom-10 -right-10 opacity-10 transform group-hover:scale-110 transition-transform">
                                <Zap size={120} fill="currentColor" />
                            </div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#FFD700]">Platform Status</h4>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-[#FFD700] animate-pulse"></div>
                                <span className="text-lg font-black uppercase tracking-tighter">Active Member</span>
                            </div>
                            <p className="text-xs text-white/60 font-medium leading-relaxed">Your account is verified and ready for all features.</p>
                        </div>
                    </div>

                    {/* Form and Connections */}
                    <div className="md:col-span-2 space-y-6">
                        <form onSubmit={handleUpdateProfile} className="bg-white border border-slate-100 rounded-4xl overflow-hidden shadow-xl">
                            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                <h3 className="font-black text-[#004B7E] uppercase tracking-widest flex items-center gap-3">
                                    <User size={20} className="text-[#004B7E]" />
                                    Personal Information
                                </h3>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="px-6 py-2 bg-[#004B7E] text-white font-black text-xs rounded-xl hover:bg-[#003a61] transition-all uppercase tracking-widest"
                                >
                                    {isUpdating ? "Saving..." : "Save Changes"}
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-[#004B7E] text-slate-800 font-bold transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                                    <input
                                        type="text"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-[#004B7E] text-slate-800 font-bold transition-all outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6 pt-4">
                                    <div className="p-4 rounded-2xl border border-slate-50 bg-slate-50/30">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Username</label>
                                        <span className="font-bold text-slate-800">{profile?.username}</span>
                                    </div>
                                    <div className="p-4 rounded-2xl border border-slate-50 bg-slate-50/30">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Member Since</label>
                                        <span className="font-bold text-slate-800">February 2026</span>
                                    </div>
                                </div>
                            </div>
                        </form>

                        <div className="bg-white border border-slate-100 rounded-4xl overflow-hidden shadow-xl">
                            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50">
                                <h3 className="font-black text-[#004B7E] uppercase tracking-widest flex items-center gap-3">
                                    <LinkIcon size={20} className="text-[#004B7E]" />
                                    App Connections
                                </h3>
                            </div>

                            <div className="p-8 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-[#06C755] text-white rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform">
                                        <MessageCircle size={28} fill="currentColor" />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-800 uppercase tracking-tight">LINE MESSAGING</p>
                                        <p className="text-xs text-slate-400 font-bold mt-1">Get real-time repair status notifications.</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    {profile?.line_connected && isFriend === false && (
                                        <a
                                            href="https://line.me/R/ti/p/@362xaifs"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-8 py-3 bg-[#06C755] text-white font-black text-xs rounded-xl hover:bg-[#05a647] transition-all uppercase tracking-widest flex items-center gap-2"
                                        >
                                            Add Friend
                                        </a>
                                    )}
                                    <button
                                        onClick={profile?.line_connected ? handleDisconnectLine : handleConnectLine}
                                        disabled={isConnectingLine}
                                        className={`px-8 py-3 font-black text-xs rounded-xl transition-all uppercase tracking-widest ${profile?.line_connected
                                            ? "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
                                            : "bg-[#06C755] text-white hover:bg-[#05a647] shadow-lg shadow-[#06C755]/20"
                                            }`}
                                    >
                                        {isConnectingLine ? "..." : profile?.line_connected ? "Disconnect" : "Connect Now"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
