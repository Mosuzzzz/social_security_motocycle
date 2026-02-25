"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import GuestGuard from "@/components/GuestGuard";
import { ArrowRight } from "lucide-react";

import LegalDialog from "@/components/LegalDialog";

export default function LoginPage() {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Legal Dialog State
    const [legalType, setLegalType] = useState<"terms" | "privacy" | null>(null);

    const { login } = useAuth();
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const data = await apiFetch("/api/login", {
                method: "POST",
                body: JSON.stringify({ username, password }),
            });

            login(data.access_token, data.refresh_token, {
                user_id: data.user_id,
                username: data.username,
                role: data.role,
                avatar_url: data.avatar_url
            });
            showToast("Welcome back!", "success");
        } catch (err: unknown) {
            setError((err as Error).message || "Invalid credentials");
        } finally {
            setIsLoading(false);
        }
    };

    const renderLegalContent = () => {
        if (legalType === "terms") {
            return (
                <>
                    <p className="font-bold">1. Introduction</p>
                    <p>Welcome to MotoFlow. By accessing our services, you agree to be bound by these terms and conditions.</p>
                    <p className="font-bold">2. Service Usage</p>
                    <p>MotoFlow provides motorcycle repair and management services. You agree to use these services only for lawful purposes.</p>
                    <p className="font-bold">3. User Accounts</p>
                    <p>You are responsible for maintaining the confidentiality of your account information. Any activity under your account is your responsibility.</p>
                    <p className="font-bold">4. Liability</p>
                    <p>MotoFlow is not liable for any indirect, incidental, or consequential damages arising from the use of our services.</p>
                </>
            );
        }
        return (
            <>
                <p className="font-bold">1. Data Collection</p>
                <p>We collect information you provide directly to us, suchs as when you create an account or book a service.</p>
                <p className="font-bold">2. Use of Data</p>
                <p>We use your data to provide, maintain, and improve our services, and to communicate with you.</p>
                <p className="font-bold">3. Data Sharing</p>
                <p>We do not share your personal information with third parties except as required by law or to provide our services.</p>
                <p className="font-bold">4. Security</p>
                <p>We take reasonable measures to help protect information about you from loss, theft, and unauthorized access.</p>
            </>
        );
    };

    return (
        <GuestGuard>
            {/* Background override to match light theme */}
            <div className="fixed inset-0 bg-[#F4F4F4] z-0 pointer-events-none" />

            <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 font-sans text-slate-900">
                <main className="w-full max-w-[440px] animate-in">
                    {/* Centered Login Card */}
                    <div className="bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-10 border border-slate-100">

                        {/* Heading */}
                        <div className="text-center mb-8">
                            <h1 className="text-[22px] font-bold tracking-tight text-slate-800">Sign In / Register</h1>
                            <p className="text-[13px] text-slate-500 mt-1 font-medium">Sign in to MotoFlow with your account.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 text-center font-semibold">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-[13px] font-bold text-slate-700 mb-2">Username / Email</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full h-12 px-4 rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300"
                                    placeholder="Enter your username or email"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[13px] font-bold text-slate-700 mb-2">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-12 px-4 rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>

                            <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                                By signing in, you agree to our <span onClick={() => setLegalType("terms")} className="underline cursor-pointer hover:text-slate-700">Terms & Conditions</span> and <span onClick={() => setLegalType("privacy")} className="underline cursor-pointer hover:text-slate-700">Privacy Policy</span>.
                            </p>

                            <button
                                type="submit"
                                disabled={isLoading || !username || !password}
                                className={`w-full h-12 rounded-lg font-bold text-[15px] transition-all flex items-center justify-center gap-2 ${isLoading || !username || !password
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : "bg-black text-white hover:bg-slate-800 shadow-md"
                                    }`}
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-100 rounded-full animate-spin"></div>
                                ) : (
                                    "Continue"
                                )}
                            </button>
                        </form>

                        {/* Sign Up Redirect */}
                        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                            <p className="text-slate-500 text-[13px]">
                                Don&apos;t have an account?{" "}
                                <Link href="/register" className="text-blue-600 hover:text-blue-700 font-bold">
                                    Register here
                                </Link>
                            </p>
                        </div>
                    </div>
                </main>

                {/* Legal Dialog */}
                <LegalDialog
                    isOpen={!!legalType}
                    onClose={() => setLegalType(null)}
                    title={legalType === "terms" ? "Terms & Conditions" : "Privacy Policy"}
                    content={renderLegalContent()}
                />
            </div>
        </GuestGuard>
    );
}
