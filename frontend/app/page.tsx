"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  MapPin, ChevronRight, ChevronLeft,
  Settings, Wrench, ShieldCheck, Clock, Calendar,
  Gauge, Disc, CircleDot, Droplets, Battery, Phone
} from "lucide-react";
import React from "react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
export default function Home() {
  const { user } = useAuth();

  const services = [
    { icon: <Droplets className="text-blue-500" />, title: "Oil Change", desc: "Premium grade oil for maximum engine protection." },
    { icon: <Disc className="text-red-500" />, title: "Brake System", desc: "Brake pad inspection and replacement for safety." },
    { icon: <Battery className="text-yellow-600" />, title: "Electrical & Battery", desc: "Voltage check and battery replacement." },
    { icon: <Gauge className="text-purple-500" />, title: "Engine Tuning", desc: "Optimize performance for a like-new feel." },
    { icon: <Settings className="text-slate-500" />, title: "Periodic Maintenance", desc: "Standard maintenance based on mileage." },
    { icon: <Wrench className="text-orange-500" />, title: "General Repair", desc: "Expert mechanics solving all your bike issues." },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-800 font-sans selection:bg-[#FFD700]/30">
      <AppHeader />

      {/* Hero Section */}
      <section className="px-4 md:px-12 py-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Banner: Focus on Booking */}
          <div className="lg:col-span-2 bg-[#004B7E] rounded-[2.5rem] p-10 md:p-14 relative overflow-hidden shadow-2xl flex flex-col justify-center text-white min-h-[440px]">
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
              <Settings size={500} className="text-white -mr-32 animate-spin-slow" />
            </div>

            <div className="relative z-10 max-w-lg">
              <div className="inline-flex items-center gap-2 mb-4 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                <ShieldCheck className="text-[#FFD700]" size={18} />
                <span className="text-xs font-black uppercase tracking-widest text-[#FFD700]">Master Technician Certified</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-black mb-4 leading-[0.9]">Expert Repair <br /><span className="text-[#FFD700]">One-Stop Shop!</span></h2>
              <p className="text-xl font-medium opacity-90 mb-10 leading-relaxed">Fast service, genuine parts, total confidence.</p>

              <div className="flex flex-wrap gap-4">
                <Link href="/dashboard/new-booking" className="px-10 py-4 bg-[#FFD700] text-[#004B7E] font-black rounded-2xl shadow-xl hover:scale-105 transition-transform text-lg flex items-center gap-3">
                  <Calendar size={22} />
                  Book a Repair Now
                </Link>
              </div>
            </div>

            {/* Stats Mock */}
            <div className="absolute bottom-10 right-10 hidden md:flex items-center gap-8 bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10">
              <div className="text-center">
                <div className="text-2xl font-black text-[#FFD700]">15+</div>
                <div className="text-[10px] uppercase font-bold opacity-60">Technicians</div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <div className="text-2xl font-black text-[#FFD700]">5000+</div>
                <div className="text-[10px] uppercase font-bold opacity-60">Motorcycles</div>
              </div>
            </div>
          </div>

          {/* Location Store Section */}
          <div className="flex flex-col h-full">
            <div className="flex-1 bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100 flex flex-col relative group">
              {/* Map Header Overlay */}
              <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-slate-100 max-w-[200px]">
                <div className="flex items-center gap-2 text-[#004B7E] mb-1">
                  <MapPin size={16} className="fill-[#004B7E]/20" />
                  <span className="text-sm font-black uppercase tracking-tighter">Our Location</span>
                </div>
                <p className="text-[10px] text-slate-500 font-bold leading-tight">MotoFlow Service - Open Daily</p>
              </div>

              {/* Real Map Embed */}
              <div className="flex-1 w-full h-full grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700">
                <iframe
                  src="https://maps.google.com/maps?q=15.008190524184087,102.13485140746101&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-t-[2.5rem]"
                ></iframe>
              </div>

              {/* Store Status Bar */}
              <div className="p-5 bg-white border-t border-slate-50 flex items-center justify-between group-hover:bg-[#F8FAFC] transition-colors cursor-pointer">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[11px] font-black text-[#004B7E] uppercase tracking-wider">Now Open</span>
                  </div>
                  <span className="text-sm font-bold text-slate-700">MotoFlow Service - Nakhon Ratchasima (Korat)</span>
                </div>
                <div className="flex items-center gap-2 text-[#004B7E]">
                  <span className="text-[10px] font-bold">Directions</span>
                  <div className="w-8 h-8 bg-[#004B7E] text-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Services Section */}
      <section className="px-4 md:px-12 py-16 max-w-7xl mx-auto w-full">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-black text-[#004B7E] mb-4 uppercase tracking-tight">Our Services</h2>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">We treat your bike like our own with international standards and modern tools.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, i) => (
            <div key={i} className="bg-white p-8 rounded-4xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all cursor-pointer group">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                {React.cloneElement(service.icon as React.ReactElement<{ size?: number }>, { size: 32 })}
              </div>
              <h4 className="text-xl font-black text-slate-800 mb-2">{service.title}</h4>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">{service.desc}</p>
            </div>
          ))}
        </div>
      </section>


      {/* Featured Products REMOVED */}

      {/* Trust Footer Section */}
      <section className="bg-[#004B7E] py-16 px-4 md:px-12 text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-center">
          <div className="space-y-4">
            <ShieldCheck className="mx-auto text-[#FFD700]" size={48} />
            <h5 className="text-lg font-black">100% Genuine Parts</h5>
            <p className="text-sm opacity-60 font-medium">Direct from manufacturers, guaranteed quality.</p>
          </div>
          <div className="space-y-4">
            <Clock className="mx-auto text-[#FFD700]" size={48} />
            <h5 className="text-lg font-black">Fast & Efficient</h5>
            <p className="text-sm opacity-60 font-medium">Quick repairs while you wait, no long queues.</p>
          </div>
          <div className="space-y-4">
            <Wrench className="mx-auto text-[#FFD700]" size={48} />
            <h5 className="text-lg font-black">Advanced Tools</h5>
            <p className="text-sm opacity-60 font-medium">Computerized diagnostics for precision.</p>
          </div>
          <div className="space-y-4">
            <ShieldCheck className="mx-auto text-[#FFD700]" size={48} />
            <h5 className="text-lg font-black">Service Warranty</h5>
            <p className="text-sm opacity-60 font-medium">Up to 6 months warranty for peace of mind.</p>
          </div>
        </div>
      </section>


      {/* Float Action Buttons */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-4">
        <Link href="/dashboard/new-booking" className="w-16 h-16 bg-[#004B7E] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform shadow-blue-500/40 relative group">
          <Calendar size={28} />
          <span className="absolute right-full mr-4 bg-white text-slate-800 px-4 py-2 rounded-xl shadow-xl text-xs font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Book Repair</span>
        </Link>
      </div>

      <AppFooter />
    </div>
  );
}
