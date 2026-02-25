import React from "react";
import { X, ArrowRight, Download, Share2 } from "lucide-react";

interface PromptPayModalProps {
    qrCodeUrl: string;
    amount: number;
    onClose: () => void;
}

export default function PromptPayModal({ qrCodeUrl, amount, onClose }: PromptPayModalProps) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative w-full max-w-md bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#004B7E] rounded-xl flex items-center justify-center">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c5/PromptPay-logo.png" alt="PromptPay" className="w-8 invert brightness-0" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">PromptPay</h3>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Scan to Pay</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8 flex flex-col items-center">
                    <div className="text-center space-y-1">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Amount Due</p>
                        <h4 className="text-4xl font-black text-[#004B7E]">฿{amount.toLocaleString()}</h4>
                    </div>

                    <div className="relative group">
                        <div className="absolute -inset-4 bg-[#004B7E]/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative p-6 bg-white rounded-3xl shadow-xl border border-slate-100">
                            <img src={qrCodeUrl} alt="PromptPay QR Code" className="w-64 h-64" />
                        </div>
                    </div>

                    <div className="w-full space-y-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 bg-[#004B7E]/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                    <div className="w-1.5 h-1.5 bg-[#004B7E] rounded-full"></div>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase">
                                    Open your banking app and scan this QR code to complete the payment.
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 bg-[#004B7E]/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                    <div className="w-1.5 h-1.5 bg-[#004B7E] rounded-full"></div>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase">
                                    The system will automatically verify the payment within a few minutes.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button className="flex items-center justify-center gap-2 py-3 bg-white hover:bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-100 transition-all shadow-sm">
                                <Download size={14} />
                                Save Image
                            </button>
                            <button className="flex items-center justify-center gap-2 py-3 bg-white hover:bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-100 transition-all shadow-sm">
                                <Share2 size={14} />
                                Share Payment
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Payment Security by Omise</p>
                    <ArrowRight size={14} className="text-[#004B7E]" />
                </div>
            </div>
        </div>
    );
}
