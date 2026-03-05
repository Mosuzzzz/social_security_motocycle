"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import DashboardLayout from "@/components/DashboardLayout";
import {
    ChevronLeft,
    CreditCard,
    Smartphone,
    User,
    CheckCircle2,
    ShieldCheck,
    Receipt,
    Wallet,
    ArrowRight,
    ArrowLeft
} from "lucide-react";
import PromptPayModal from "@/components/PromptPayModal";

interface ServiceItem {
    id?: number;
    description: string;
    price: number;
}

interface ServiceOrder {
    id: number;
    status: string;
    total_price: number;
    items: ServiceItem[];
    customer_id: number;
}

export default function CheckoutPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { showToast } = useToast();

    const [order, setOrder] = useState<ServiceOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState<"card" | "promptpay">("card");
    const [isProcessing, setIsProcessing] = useState(false);
    const [promptPayData, setPromptPayData] = useState<{ url: string; amount: number } | null>(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const data = await apiFetch(`/api/orders/${params.id}`);
                setOrder(data);
            } catch (err) {
                showToast("Failed to load order details", "error");
                router.push("/dashboard/payments");
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) fetchOrder();
    }, [params.id, router, params.id, showToast]);

    const handlePayment = async () => {
        if (!order) return;

        let omise = (window as any).OmiseCard;
        if (!omise) {
            for (let i = 0; i < 30; i++) {
                await new Promise(resolve => setTimeout(resolve, 100));
                omise = (window as any).OmiseCard;
                if (omise) break;
            }
        }

        if (!omise) {
            showToast("Payment gateway could not be initialized. Please refresh the page.", "error");
            return;
        }

        setIsProcessing(true);

        omise.configure({
            publicKey: process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY,
            currency: 'thb',
            frameLabel: 'MotoFlow Service - Center',
            submitLabel: 'PAY NOW',
        });

        const config: any = {
            amount: order.total_price * 100,
            currency: 'thb',
            onCreateTokenSuccess: async (nonce: string) => {
                await submitPayment(nonce);
            },
            onCreateSourceSuccess: async (nonce: string) => {
                await submitPayment(nonce);
            }
        };

        if (paymentMethod === "card") {
            omise.open({
                ...config,
                defaultPaymentMethod: 'credit_card',
            });
        } else {
            omise.open({
                ...config,
                defaultPaymentMethod: 'promptpay',
            });
        }

        setIsProcessing(false);
    };

    const submitPayment = async (nonce: string) => {
        if (!order) return;

        try {
            setIsProcessing(true);
            const result = await apiFetch("/api/payments", {
                method: "POST",
                body: JSON.stringify({
                    order_id: order.id,
                    payment_token: nonce
                }),
            });

            if (result.status === "Pending" && result.details?.scannable_code?.image?.download_uri) {
                setPromptPayData({
                    url: result.details.scannable_code.image.download_uri,
                    amount: order.total_price
                });
                showToast("Please scan the QR code to complete payment", "info");
            } else {
                showToast("Payment successful!", "success");
                router.push("/dashboard/payments");
            }
        } catch (err: unknown) {
            showToast((err as Error).message || "Payment failed", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) return (
        <DashboardLayout>
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-[#004B7E] rounded-full animate-spin"></div>
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Connecting to secure payment system...</span>
            </div>
        </DashboardLayout>
    );

    if (!order) return null;

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-10 py-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-slate-400 hover:text-[#004B7E] transition-colors text-[10px] font-black uppercase tracking-widest mb-4 group"
                        >
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            Back to Repair Order
                        </button>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#004B7E]/5 text-[#004B7E] text-[10px] font-black uppercase tracking-wider border border-[#004B7E]/10">
                            <ShieldCheck size={14} />
                            Secure Payment System
                        </div>
                        <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">
                            Payment
                        </h1>
                        <p className="text-slate-400 font-bold text-sm max-w-md">Verify details and complete payment to finish the repair process</p>
                    </div>

                    <div className="flex bg-slate-50/50 p-1 rounded-2xl border border-slate-100 shrink-0">
                        <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-xl shadow-sm">
                            <Receipt size={20} className="text-[#004B7E]" />
                            <span className="text-sm font-black text-slate-800">#SO-{order.id}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-10">
                        {/* Select Payment Method */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-[#004B7E] uppercase tracking-[0.2em] flex items-center gap-2 px-2">
                                <Wallet size={18} />
                                Select Payment Method
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => setPaymentMethod("card")}
                                    className={`relative p-8 rounded-[2.5rem] border transition-all text-left overflow-hidden group ${paymentMethod === "card" ? "border-[#FFD700] bg-[#FFD700]/5 shadow-xl shadow-[#FFD700]/10" : "border-slate-100 bg-white hover:border-[#004B7E] shadow-sm hover:shadow-lg"}`}
                                >
                                    <div className="relative z-10 flex flex-col items-start gap-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${paymentMethod === "card" ? "bg-[#004B7E] text-white" : "bg-slate-50 text-slate-400"}`}>
                                            <CreditCard size={28} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-slate-800 uppercase">Credit / Debit Card</h4>
                                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Visa, Mastercard, JCB</p>
                                        </div>
                                    </div>
                                    {paymentMethod === "card" && (
                                        <div className="absolute top-6 right-6 text-[#004B7E]">
                                            <CheckCircle2 size={24} />
                                        </div>
                                    )}
                                </button>

                                <button
                                    onClick={() => setPaymentMethod("promptpay")}
                                    className={`relative p-8 rounded-[2.5rem] border transition-all text-left overflow-hidden group ${paymentMethod === "promptpay" ? "border-[#FFD700] bg-[#FFD700]/5 shadow-xl shadow-[#FFD700]/10" : "border-slate-100 bg-white hover:border-[#004B7E] shadow-sm hover:shadow-lg"}`}
                                >
                                    <div className="relative z-10 flex flex-col items-start gap-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${paymentMethod === "promptpay" ? "bg-[#004B7E] text-white" : "bg-slate-50 text-slate-400"}`}>
                                            <Smartphone size={28} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-slate-800 uppercase">PromptPay</h4>
                                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Pay via QR Code</p>
                                        </div>
                                    </div>
                                    {paymentMethod === "promptpay" && (
                                        <div className="absolute top-6 right-6 text-[#004B7E]">
                                            <CheckCircle2 size={24} />
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 shadow-xl">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 text-[#004B7E] shrink-0">
                                <User size={32} />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">User Information</h3>
                                <p className="text-slate-400 font-bold text-sm uppercase">Account: <span className="text-[#004B7E]">{user?.username}</span></p>
                            </div>
                            <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
                                <ShieldCheck size={14} className="text-emerald-500" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Secure Merchant</span>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Order Summary */}
                    <div className="space-y-6">
                        <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] space-y-8 flex flex-col shadow-xl">
                            <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                                <h3 className="text-lg font-black text-[#004B7E] uppercase tracking-tight">Payment Summary</h3>
                                <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                                    <Receipt size={18} />
                                </div>
                            </div>

                            <div className="space-y-6 flex-1 max-h-[300px] overflow-y-auto px-1 custom-scrollbar">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex flex-col space-y-1">
                                        <div className="flex items-start justify-between gap-4">
                                            <span className="font-bold text-slate-800 leading-tight text-sm">{item.description}</span>
                                            <span className="font-black text-[#004B7E] shrink-0 text-sm">฿{item.price.toLocaleString()}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Repair Service</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-8 border-t border-slate-50 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Amount</span>
                                    <span className="text-3xl font-black text-[#004B7E] tracking-tighter leading-none">฿{order.total_price.toLocaleString()}</span>
                                </div>

                                <button
                                    onClick={handlePayment}
                                    disabled={isProcessing}
                                    className="w-full h-16 bg-[#FFD700] text-[#004B7E] font-black rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FFD700]/20 active:scale-95 disabled:opacity-50 group/btn mt-4 uppercase tracking-[0.2em] text-[10px]"
                                >
                                    {isProcessing ? (
                                        <div className="w-5 h-5 border-2 border-[#004B7E]/20 border-t-[#004B7E] rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            Pay Now
                                            <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="p-8 bg-[#004B7E]/5 border border-[#004B7E]/10 rounded-[2.5rem] space-y-4 shadow-sm">
                            <div className="flex items-center gap-2 text-[#004B7E]">
                                <ShieldCheck size={18} />
                                <h4 className="font-black text-[9px] uppercase tracking-[0.2em]">Security Standard</h4>
                            </div>
                            <p className="text-slate-400 text-[9px] font-bold leading-relaxed uppercase tracking-wider">
                                Your information is encrypted using AES-256 and processed directly via Omise.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {promptPayData && (
                <PromptPayModal
                    qrCodeUrl={promptPayData.url}
                    amount={promptPayData.amount}
                    onClose={() => {
                        setPromptPayData(null);
                        router.push("/dashboard/payments");
                    }}
                />
            )}
        </DashboardLayout>
    );
}
