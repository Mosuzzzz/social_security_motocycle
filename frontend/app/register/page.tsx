"use client";

import React, { useState } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        name: "",
        phone: "",
        role: "Customer", // Always customer by default as per requirements
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

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
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white selection:bg-indigo-500/30 font-sans">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="relative w-full max-w-lg p-10 bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[32px] shadow-2xl">
                <div className="flex flex-col items-center mb-10 text-center text-balance">
                    <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-indigo-500 rounded-2xl mb-4 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">Join Us</h1>
                    <p className="text-zinc-400 mt-2 text-sm max-w-xs">Create an account to start managing your motorcycle services</p>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {error && (
                        <div className="col-span-full p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl text-center">
                            {error}
                        </div>
                    )}

                    <div className="col-span-full md:col-span-1">
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-zinc-100 placeholder:text-zinc-600"
                            placeholder="johndoe"
                            required
                        />
                    </div>

                    <div className="col-span-full md:col-span-1">
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-zinc-100 placeholder:text-zinc-600"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className="col-span-full md:col-span-1">
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-zinc-100 placeholder:text-zinc-600"
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div className="col-span-full md:col-span-1">
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-zinc-100 placeholder:text-zinc-600"
                            placeholder="08X-XXX-XXXX"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="col-span-full mt-4 py-4 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg shadow-xl shadow-white/5"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                                Creating account...
                            </>
                        ) : (
                            "Sign Up"
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-white/5 text-center">
                    <p className="text-zinc-400 text-sm">
                        Already have an account?{" "}
                        <Link href="/login" className="text-white hover:underline font-medium">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
