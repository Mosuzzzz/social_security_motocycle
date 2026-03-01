"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
    Calendar, Wrench
} from "lucide-react";
import React from "react";

export default function AppHeader() {
    const { user } = useAuth();

    return (
        <>
            {/* Top Blue Header */}
            <div className="bg-[#004B7E] text-white text-[11px] font-bold py-2 px-6 text-center uppercase tracking-widest leading-relaxed">
                Pragunการซ่อม Master Service Center - The No.1 Motorcycle Specialist in Nakhon Ratchasima
            </div>

            {/* Main Navigation Header */}
            <header className="bg-[#FFD700] py-4 px-6 md:px-12 shadow-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
                    {/* Logo Group */}
                    <div className="shrink-0"></div>


                    {/* Desktop Search Bar REMOVED */}

                    {/* Nav Actions */}
                    <div className="flex items-center gap-3">
                        <div className="hidden lg:flex items-center gap-4 mr-4 border-r border-[#004B7E]/10 pr-6">
                            <Link href="/dashboard/new-booking" className="flex items-center gap-2 text-[#004B7E] font-bold text-sm hover:opacity-70">
                                <Calendar size={18} />
                                <span>Book Repair</span>
                            </Link>
                        </div>

                        <div className="flex items-center gap-3">
                            {user ? (
                                <Link href="/dashboard" className="bg-[#004B7E] text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-lg hover:bg-[#003a61] hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                    Dashboard
                                </Link>
                            ) : (
                                <Link href="/login" className="bg-[#004B7E] text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-lg hover:bg-[#003a61] hover:-translate-y-0.5 transition-all text-center">
                                    Login / Register
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>
        </>
    );
}
