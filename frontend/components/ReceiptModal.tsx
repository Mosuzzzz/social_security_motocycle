"use client";

import React from "react";
import { X, Download, Wrench, CheckCircle2 } from "lucide-react";

interface ReceiptProps {
    order: {
        id: number;
        status: string;
        total_price: number;
        bike_id?: number;
    };
    onClose: () => void;
}

export default function ReceiptModal({ order, onClose }: ReceiptProps) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={onClose} />

            <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100">
                <div className="p-8 space-y-8">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="w-12 h-12 bg-[#004B7E]/5 text-[#004B7E] rounded-2xl flex items-center justify-center mb-2">
                                <Wrench size={24} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Payment Receipt</h2>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Order #SO-{order.id}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>

                    <div className="py-6 border-y border-slate-50 space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Status</span>
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-black uppercase text-[10px] tracking-widest">
                                <CheckCircle2 size={14} />
                                {order.status === "Paid" ? "Paid" : order.status}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Payment Date</span>
                            <span className="font-black text-slate-800 uppercase text-[10px] tracking-widest">{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2">
                            <span className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Total Amount Paid</span>
                            <span className="text-2xl font-black text-[#004B7E]">฿{order.total_price.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-emerald-50 rounded-2xl flex items-center gap-3 border border-emerald-100">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <CheckCircle2 size={20} className="text-emerald-500" />
                            </div>
                            <div className="text-[10px]">
                                <p className="font-black text-emerald-700 uppercase tracking-widest">Payment Successful</p>
                                <p className="text-emerald-600/60 font-bold uppercase tracking-widest">Secured by Omise</p>
                            </div>
                        </div>

                        <button
                            onClick={() => window.print()}
                            className="w-full py-4 bg-[#FFD700] text-[#004B7E] font-black rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FFD700]/20 active:scale-95 uppercase tracking-widest text-[10px]"
                        >
                            <Download size={20} />
                            Download Receipt
                        </button>
                    </div>

                    <p className="text-center text-[9px] text-slate-400 font-black uppercase tracking-widest">
                        MotoFlow Service • Automotive Solutions
                    </p>
                </div>
            </div>
        </div>
    );
}
