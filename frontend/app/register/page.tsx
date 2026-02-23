"use client";

import React, { useState } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import GuestGuard from "@/components/GuestGuard";
import { ArrowRight } from "lucide-react";

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        name: "",
        phone: "",
        role: "Customer",
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            await apiFetch("/api/register", {
                method: "POST",
                body: JSON.stringify(formData),
            });

            router.push("/login?registered=true");
            showToast("Account protocol initialized!", "success");
        } catch (err: unknown) {
            setError((err as Error).message || "Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <GuestGuard>
            <div className="flex min-h-screen items-center justify-center bg-transparent text-white p-4 py-12">
                <div className="w-full max-w-2xl animate-in relative z-10">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center text-white shrink-0 bg-white/5 border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)] mb-6">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24ZM11 4C11 3.44772 11.4477 3 12 3C12.5523 3 13 3.44772 13 4V11H20C20.5523 11 21 11.4477 21 12C21 12.5523 20.5523 13 20 13H13V20C13 20.5523 12.5523 21 12 21C11.4477 21 11 20.5523 11 20V13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H11V4Z" fill="currentColor" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-medium tracking-tight">Deploy Node</h1>
                        <p className="text-gray-400 mt-3 font-light">Join the MotoFlow infrastructure</p>
                    </div>

                    {/* Form Card */}
                    <div className="ios-card p-8 md:p-10 mb-8 border border-white/10 shadow-2xl backdrop-blur-2xl">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl text-center font-medium backdrop-blur-sm">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[13px] text-gray-300 font-medium mb-2 uppercase tracking-wide">Username</label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="ios-input"
                                        placeholder="johndoe"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-[13px] text-gray-300 font-medium mb-2 uppercase tracking-wide">Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="ios-input"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-[13px] text-gray-300 font-medium mb-2 uppercase tracking-wide">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="ios-input"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-[13px] text-gray-300 font-medium mb-2 uppercase tracking-wide">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="ios-input"
                                        placeholder="08X-XXX-XXXX"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full px-6 py-3.5 mt-4 rounded-full bg-white text-black font-semibold hover:bg-gray-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-[15px]"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                                        Initializing...
                                    </>
                                ) : (
                                    <>
                                        Deploy Account
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Sign In Link */}
                    <div className="text-center">
                        <p className="text-gray-400 text-sm font-light">
                            Already configured?{" "}
                            <Link href="/login" className="text-white hover:text-pink-400 transition-colors font-medium border-b border-white/30 hover:border-pink-400 pb-0.5">
                                Secure Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </GuestGuard>
    );
}
