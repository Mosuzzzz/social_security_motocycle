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

            <div className="bg-white dark:bg-card w-full max-w-sm rounded-[32px] overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-300 border border-border">
                <div className="p-8 space-y-8">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="w-12 h-12 bg-ios-blue/10 text-ios-blue rounded-2xl flex items-center justify-center mb-2">
                                <Wrench size={24} />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight">Receipt</h2>
                            <p className="text-ios-gray text-xs font-bold uppercase tracking-widest">Order #SO-{order.id}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                            <X size={20} className="text-ios-gray" />
                        </button>
                    </div>

                    <div className="py-6 border-y border-border space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-ios-gray font-bold">Status</span>
                            <span className="inline-flex items-center gap-1.5 text-ios-green font-bold">
                                <CheckCircle2 size={14} />
                                {order.status}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-ios-gray font-bold">Date</span>
                            <span className="font-bold">{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2">
                            <span className="font-bold">Total</span>
                            <span className="text-2xl font-black text-ios-blue">฿{order.total_price.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center gap-3 border border-border">
                            <div className="w-10 h-10 bg-ios-green/10 rounded-xl flex items-center justify-center">
                                <CheckCircle2 size={20} className="text-ios-green" />
                            </div>
                            <div className="text-xs">
                                <p className="font-bold">Payment Verified</p>
                                <p className="text-ios-gray font-medium">Secured by Omise</p>
                            </div>
                        </div>

                        <button
                            onClick={() => window.print()}
                            className="w-full py-4 bg-ios-blue text-white font-bold rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-ios-blue/20 active:scale-95"
                        >
                            <Download size={20} />
                            Save Receipt
                        </button>
                    </div>

                    <p className="text-center text-[10px] text-ios-gray font-black uppercase tracking-widest">
                        MotoFlow Service
                    </p>
                </div>
            </div>
        </div>
    );
}
