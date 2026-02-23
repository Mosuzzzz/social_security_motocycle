"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 5000);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 min-w-[320px] max-w-md">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
                            flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-right-10 duration-300
                            ${toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : ""}
                            ${toast.type === "error" ? "bg-red-500/10 border-red-500/20 text-red-400" : ""}
                            ${toast.type === "info" ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : ""}
                            ${toast.type === "warning" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : ""}
                        `}
                    >
                        <div className="mt-0.5">
                            {toast.type === "success" && <CheckCircle2 size={18} />}
                            {toast.type === "error" && <AlertCircle size={18} />}
                            {toast.type === "info" && <Info size={18} />}
                            {toast.type === "warning" && <AlertTriangle size={18} />}
                        </div>
                        <p className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-white/20 hover:text-white transition-colors p-0.5"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
