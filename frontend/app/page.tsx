"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-transparent text-white selection:bg-pink-500/30 overflow-hidden font-sans relative">

      {/* Top Right Actions (Authenticated Only) */}
      {user && (
        <div className="absolute top-6 right-6 md:top-8 md:right-12 z-50">
          <Link href="/dashboard" className="px-6 py-2.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white font-medium hover:bg-white/20 hover:border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all text-[13px] flex items-center gap-2">
            Dashboard
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      )}      {/* Hero Content */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-start max-w-7xl mx-auto px-6 md:px-12 w-full min-h-[80vh] py-12">
        <div className="max-w-3xl p-8 md:p-12 lg:p-16 bg-black/50 border border-white/10 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
          {/* Subtle inner glow for the card */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pink-500/5 to-purple-500/5 pointer-events-none"></div>
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-pink-500/20 rounded-full blur-[80px] pointer-events-none"></div>

          <div className="relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 shadow-lg">
              <div className="flex -space-x-1.5">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 border border-black z-30"></div>
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-400 to-orange-500 border border-black z-20"></div>
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 border border-black z-10"></div>
              </div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-200 ml-1">Join 1M+ developers</span>
            </div>

            {/* Typography */}
            <h1 className="text-[3rem] sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1] drop-shadow-xl">
              High-performance
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-500">Ai Infrastructure</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-md leading-relaxed font-light drop-shadow-md">
              Serverless cloud for AI and Machine Learning—built exclusively for developers setting the modern standard.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/dashboard/new-booking" className="px-6 py-3.5 rounded-full bg-white text-black font-semibold hover:bg-gray-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all text-sm flex items-center gap-2">
                Get started
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="#" className="px-6 py-3.5 rounded-full border border-white/20 font-semibold hover:bg-white/10 hover:border-white/40 transition-all text-sm bg-black/20">
                Book a demo
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
