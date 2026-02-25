"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import {
    CheckCircle2,
    ChevronRight,
    Loader2,
    Wrench,
    FileText
} from "lucide-react";

export default function NewBookingPage() {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [brand, setBrand] = useState("");
    const [model, setModel] = useState("");
    const [licensePlate, setLicensePlate] = useState("");
    const [walkInDate, setWalkInDate] = useState("");
    const [problem, setProblem] = useState("");

    const router = useRouter();
    const { showToast } = useToast();

    const nextStep = () => {
        if (step === 1 && (!brand || !model || !licensePlate)) {
            showToast("Please fill in all vehicle details", "error");
            return;
        }
        setStep(step + 1);
    };

    const prevStep = () => setStep(step - 1);

    const handleSubmit = async () => {
        if (!walkInDate) {
            showToast("Please select a walk-in date", "error");
            return;
        }
        if (!problem) {
            showToast("Please describe the problem", "error");
            return;
        }

        setIsLoading(true);
        try {
            await apiFetch("/api/orders", {
                method: "POST",
                body: JSON.stringify({
                    brand,
                    model,
                    license_plate: licensePlate,
                    problem_description: problem,
                    walk_in_date: walkInDate
                }),
            });
            showToast("Booking created successfully!", "success");
            setStep(3);
        } catch (err: unknown) {
            showToast((err as Error).message || "Failed to create booking", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-xl mx-auto space-y-8 animate-in relative z-10 pt-4 pb-20">

                {/* Form Container */}
                <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl p-8 md:p-12 relative overflow-hidden">
                    {/* Brand Watermark */}
                    <div className="absolute -top-10 -right-10 opacity-[0.03] pointer-events-none">
                        <Wrench size={200} className="text-[#004B7E]" />
                    </div>

                    <div className="relative z-10">
                        {/* Progress Header */}
                        <div className="flex items-center justify-between mb-12">
                            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Step {step} <span className="text-slate-200 mx-2">/</span> 3</p>
                            <div className="flex gap-2">
                                {[1, 2, 3].map(s => (
                                    <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? "w-10 bg-[#FFD700] shadow-md" : "w-4 bg-slate-100"}`} />
                                ))}
                            </div>
                        </div>

                        {/* Step 1: Vehicle Details */}
                        {step === 1 && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                                <section>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[#004B7E] shadow-inner">
                                            <Wrench size={24} />
                                        </div>
                                        <h1 className="text-3xl font-black text-[#004B7E] uppercase tracking-tighter">
                                            Vehicle Details
                                        </h1>
                                    </div>
                                    <p className="text-slate-500 font-bold text-sm">Enter the basic details of the motorcycle.</p>
                                </section>

                                <div className="space-y-6">
                                    <div className="group">
                                        <label className="block text-[11px] text-[#004B7E] font-black mb-2 uppercase tracking-widest">Brand</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Honda, Yamaha, Kawasaki"
                                            value={brand}
                                            onChange={(e) => setBrand(e.target.value)}
                                            className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#004B7E] text-slate-800 font-bold transition-all outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="block text-[11px] text-[#004B7E] font-black mb-2 uppercase tracking-widest">Model</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., PCX 160, Wave 125i"
                                            value={model}
                                            onChange={(e) => setModel(e.target.value)}
                                            className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#004B7E] text-slate-800 font-bold transition-all outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="block text-[11px] text-[#004B7E] font-black mb-2 uppercase tracking-widest">License Plate</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., 1AB-1234 Bangkok"
                                            value={licensePlate}
                                            onChange={(e) => setLicensePlate(e.target.value)}
                                            className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#004B7E] text-slate-800 font-bold transition-all outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={nextStep}
                                    className="w-full h-16 mt-4 rounded-2xl bg-[#004B7E] text-white font-black text-lg hover:bg-[#003a61] shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                                >
                                    Continue
                                    <ChevronRight size={22} className="text-[#FFD700]" />
                                </button>
                            </div>
                        )}

                        {/* Step 2: Issue Description */}
                        {step === 2 && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                                <section>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[#004B7E] shadow-inner">
                                            <FileText size={24} />
                                        </div>
                                        <h1 className="text-3xl font-black text-[#004B7E] uppercase tracking-tighter">
                                            Repair Details
                                        </h1>
                                    </div>
                                    <p className="text-slate-500 font-bold text-sm">Select your preferred date and describe the issue.</p>
                                </section>

                                <div className="space-y-6">
                                    <div className="group">
                                        <label className="block text-[11px] text-[#004B7E] font-black mb-2 uppercase tracking-widest">Appointment Date</label>
                                        <input
                                            type="date"
                                            value={walkInDate}
                                            onChange={(e) => setWalkInDate(e.target.value)}
                                            className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#004B7E] text-slate-800 font-bold transition-all outline-none"
                                            required
                                            min={new Date().toISOString().split("T")[0]}
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="block text-[11px] text-[#004B7E] font-black mb-2 uppercase tracking-widest">Problem Symptoms</label>
                                        <textarea
                                            rows={5}
                                            placeholder="e.g., Squeaky brakes, Oil change, 10,000 km service."
                                            value={problem}
                                            onChange={(e) => setProblem(e.target.value)}
                                            className="w-full p-6 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#004B7E] text-slate-800 font-bold transition-all outline-none resize-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={prevStep}
                                        className="flex-1 h-16 bg-slate-50 text-slate-400 font-black rounded-2xl hover:bg-slate-100 transition-colors uppercase tracking-widest text-xs"
                                    >
                                        Go Back
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isLoading}
                                        className="flex-[2] h-16 rounded-2xl bg-[#004B7E] text-white font-black text-lg hover:bg-[#003a61] shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 size={24} className="animate-spin text-[#FFD700]" />
                                                Submitting...
                                            </>
                                        ) : (
                                            "Confirm Appointment"
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Confirmation */}
                        {step === 3 && (
                            <div className="text-center py-12 animate-in zoom-in-95 fade-in duration-500">
                                <div className="w-24 h-24 bg-green-50 border-4 border-white rounded-full mx-auto mb-8 flex items-center justify-center shadow-xl">
                                    <CheckCircle2 size={56} className="text-green-500" />
                                </div>
                                <h1 className="text-4xl font-black text-[#004B7E] uppercase tracking-tighter mb-4">
                                    Booking Confirmed!
                                </h1>
                                <p className="text-slate-500 font-bold max-w-sm mx-auto mb-10 leading-relaxed text-sm">
                                    We've received your appointment request. <br />
                                    You can track your repair status on the dashboard.
                                </p>
                                <button
                                    onClick={() => router.push("/dashboard")}
                                    className="px-12 py-4 rounded-2xl bg-[#004B7E] text-white font-black hover:bg-[#003a61] shadow-xl transition-all"
                                >
                                    Return to Dashboard
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
