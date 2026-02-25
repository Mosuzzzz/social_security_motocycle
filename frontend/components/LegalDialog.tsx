import React from "react";
import { X } from "lucide-react";

interface LegalDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: React.ReactNode;
}

export default function LegalDialog({ isOpen, onClose, title, content }: LegalDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            <div className="relative w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    <div className="prose prose-slate max-w-none text-slate-600 text-[14px] leading-relaxed space-y-4">
                        {content}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-black text-white font-bold rounded-lg hover:bg-slate-800 transition-all text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
