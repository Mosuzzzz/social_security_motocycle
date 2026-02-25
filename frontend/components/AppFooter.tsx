"use client";

import Link from "next/link";
import {
    Search, MapPin, Wrench, Clock, Phone
} from "lucide-react";
import React from "react";

export default function AppFooter() {
    return (
        <footer className="bg-slate-900 pt-20 pb-10 px-6 md:px-12 text-white">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                {/* Brand Column */}
                <div className="space-y-6">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="bg-[#FFD700] p-2 rounded-xl">
                            <Wrench className="text-[#004B7E]" size={24} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-black text-[#FFD700] tracking-tighter leading-none uppercase">Pragun</span>
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] leading-none mt-1">การซ่อม - Service Center</span>
                        </div>
                    </Link>
                    <p className="text-sm text-white/50 leading-relaxed font-medium">
                        Nakhon Ratchasima's #1 standard motorcycle service center. Serving you with expert mechanics and genuine parts.
                    </p>

                </div>

                {/* Quick Links */}
                <div className="space-y-6">
                    <h6 className="text-sm font-black uppercase tracking-widest text-[#FFD700]">Quick Links</h6>
                    <ul className="space-y-4 text-sm font-bold text-white/50">
                        <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                        <li><Link href="/dashboard/new-booking" className="hover:text-white transition-colors">Book Repair</Link></li>
                        <li><Link href="#" className="hover:text-white transition-colors">All Spare Parts</Link></li>
                        <li><Link href="/dashboard/support" className="hover:text-white transition-colors">Support Center</Link></li>
                    </ul>
                </div>

                {/* Our Services */}
                <div className="space-y-6">
                    <h6 className="text-sm font-black uppercase tracking-widest text-[#FFD700]">Services</h6>
                    <ul className="space-y-4 text-sm font-bold text-white/50">
                        <li className="hover:text-white transition-colors cursor-pointer">Oil Change</li>
                        <li className="hover:text-white transition-colors cursor-pointer">Maintenance Check</li>
                        <li className="hover:text-white transition-colors cursor-pointer">Brakes & Tires</li>
                        <li className="hover:text-white transition-colors cursor-pointer">Injection Service</li>
                    </ul>
                </div>

                {/* Contact Info */}
                <div className="space-y-6">
                    <h6 className="text-sm font-black uppercase tracking-widest text-[#FFD700]">Contact Us</h6>
                    <ul className="space-y-4 text-sm font-bold text-white/50">
                        <li className="flex items-start gap-3">
                            <MapPin size={18} className="text-[#FFD700] shrink-0" />
                            <span>15.0081, 102.1348 Mittraphap Rd, Nai Mueang, Nakhon Ratchasima, 30000</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Phone size={18} className="text-[#FFD700] shrink-0" />
                            <span>044-xxx-xxxx</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Clock size={18} className="text-[#FFD700] shrink-0" />
                            <span>Open Daily: 08:30 AM - 06:00 PM</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/20">
                <div>&copy; 2026 Pragunการซ่อม Thailand. ALL RIGHTS RESERVED.</div>
                <div className="flex gap-8">
                    <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
                    <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                </div>
            </div>
        </footer>
    );
}
