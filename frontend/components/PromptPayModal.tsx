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

            <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#004b7e] rounded-xl flex items-center justify-center">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c5/PromptPay-logo.png" alt="PromptPay" className="w-8 invert brightness-0" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white leading-tight">PromptPay</h3>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Scan to Pay</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-zinc-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8 flex flex-col items-center">
                    <div className="text-center space-y-1">
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Amount to Pay</p>
                        <h4 className="text-4xl font-black text-white italic">฿{amount.toLocaleString()}</h4>
                    </div>

                    <div className="relative group">
                        <div className="absolute -inset-4 bg-white/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative p-4 bg-white rounded-3xl shadow-2xl">
                            <img src={qrCodeUrl} alt="PromptPay QR Code" className="w-64 h-64" />
                        </div>
                    </div>

                    <div className="w-full space-y-4">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 bg-indigo-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Open your banking app and scan this QR code.
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 bg-indigo-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    The payment will be confirmed automatically.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl border border-white/10 transition-all">
                                <Download size={14} />
                                Save Image
                            </button>
                            <button className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl border border-white/10 transition-all">
                                <Share2 size={14} />
                                Share
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white/5 border-t border-white/5 flex items-center justify-between">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Payment Security by Omise</p>
                    <ArrowRight size={14} className="text-zinc-600" />
                </div>
            </div>
        </div>
    );
}
