"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
    ChevronLeft,
    CreditCard,
    Smartphone,
    User,
    Mail,
    Phone,
    CheckCircle,
    Info,
    ShieldCheck
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
    }, [params.id]);

    const handlePayment = async () => {
        if (!order) return;

        // Wait up to 3 seconds for OmiseCard to load if it's not ready
        let omise = (window as any).OmiseCard;
        if (!omise) {
            console.log("Waiting for OmiseCard to load...");
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
            frameLabel: 'MotoFlow Service',
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
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
    );

    if (!order) return null;

    return (
        <div className="min-h-screen bg-[#F9FAFB] text-zinc-900 font-sans selection:bg-indigo-100">
            <div className="max-w-[1200px] mx-auto min-h-screen flex flex-col md:flex-row shadow-2xl bg-white overflow-hidden">

                {/* Left Column: Payment Info */}
                <div className="flex-1 p-8 md:p-16 space-y-12">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => router.back()}
                            className="p-2 -ml-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400 hover:text-zinc-900"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-black text-xl italic shadow-xl">
                                M
                            </div>
                            <span className="font-bold text-xl tracking-tighter">MotoFlow</span>
                        </div>
                    </div>

                    {/* Greeting */}
                    <div className="space-y-2">
                        <p className="text-zinc-500 font-medium">Hi {user?.username},</p>
                        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">
                            Pay MotoFlow <span className="text-indigo-600">฿{order.total_price.toLocaleString()}</span>
                        </h1>
                    </div>


                    {/* Payment Methods */}
                    <div className="space-y-4">
                        <div
                            onClick={() => setPaymentMethod("card")}
                            className={`p-6 border-2 rounded-2xl cursor-pointer transition-all flex items-center justify-between group ${paymentMethod === "card" ? "border-indigo-600 bg-indigo-50/10 shadow-md" : "border-zinc-100 hover:border-zinc-200"}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${paymentMethod === "card" ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-400"}`}>
                                    <CreditCard size={24} />
                                </div>
                                <div>
                                    <p className="font-bold text-zinc-900">Credit / Debit Card</p>
                                    <div className="flex gap-1 mt-1">
                                        <div className="w-6 h-4 bg-zinc-200 rounded-[2px]"></div>
                                        <div className="w-6 h-4 bg-zinc-200 rounded-[2px]"></div>
                                        <div className="w-6 h-4 bg-zinc-200 rounded-[2px]"></div>
                                    </div>
                                </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === "card" ? "border-indigo-600" : "border-zinc-300"}`}>
                                {paymentMethod === "card" && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>}
                            </div>
                        </div>

                        <div
                            onClick={() => setPaymentMethod("promptpay")}
                            className={`p-6 border-2 rounded-2xl cursor-pointer transition-all flex items-center justify-between group ${paymentMethod === "promptpay" ? "border-indigo-600 bg-indigo-50/10 shadow-md" : "border-zinc-100 hover:border-zinc-200"}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${paymentMethod === "promptpay" ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-400"}`}>
                                    <Smartphone size={24} />
                                </div>
                                <div>
                                    <p className="font-bold text-zinc-900">PromptPay QR</p>
                                    <p className="text-xs text-zinc-500">Scan with any banking app</p>
                                </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === "promptpay" ? "border-indigo-600" : "border-zinc-300"}`}>
                                {paymentMethod === "promptpay" && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>}
                            </div>
                        </div>
                    </div>

                    {/* Personal Information */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Personal Information</h3>
                        </div>
                        <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-400">
                                    <User size={16} />
                                </div>
                                <span className="font-medium text-zinc-700">{user?.username}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-400">
                                    <Smartphone size={16} />
                                </div>
                                <span className="font-medium text-zinc-700">Verified Account</span>
                            </div>
                        </div>
                    </div>

                    {/* Pay Button */}
                    <button
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="w-full py-4 bg-zinc-900 text-white font-black rounded-xl hover:bg-black transition-all shadow-xl shadow-zinc-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                    >
                        {isProcessing ? "Processing..." : `Pay ฿${order.total_price.toLocaleString()}`}
                    </button>

                    <div className="flex items-center justify-center gap-4 text-zinc-400">
                        <div className="flex items-center gap-1.5 grayscale opacity-50">
                            <ShieldCheck size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Secure Payment</span>
                        </div>
                        <div className="w-1 h-1 bg-zinc-300 rounded-full"></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">PCI-DSS Compliant</span>
                    </div>
                </div>

                {/* Right Column: Order Summary */}
                <div className="w-full md:w-[450px] bg-zinc-50 border-l border-zinc-100 p-8 md:p-16 flex flex-col">
                    <div className="flex-1 space-y-8">
                        <h3 className="text-xl font-extrabold tracking-tight text-zinc-900 border-b border-zinc-200 pb-4">Summary</h3>

                        <div className="space-y-6">
                            {order.items.length > 0 ? order.items.map((item, idx) => (
                                <div key={idx} className="flex flex-col space-y-1">
                                    <div className="flex items-start justify-between gap-4">
                                        <span className="font-bold text-zinc-900 leading-tight">{item.description}</span>
                                        <span className="font-bold text-zinc-900 shrink-0">฿{item.price.toLocaleString()}</span>
                                    </div>
                                    <span className="text-xs text-zinc-500 font-medium tracking-tight">Quantity 1 • ฿{item.price.toLocaleString()} each</span>
                                </div>
                            )) : (
                                <div className="text-zinc-400 italic text-sm">No items found in this order.</div>
                            )}
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t-2 border-dashed border-zinc-200 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                            <span className="font-bold text-zinc-900 leading-none">฿{order.total_price.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Taxes</span>
                            <span className="font-bold text-zinc-900 leading-none">฿0.00</span>
                        </div>
                        <div className="flex items-center justify-between pt-4">
                            <span className="text-lg font-black tracking-tight text-zinc-900">Total order amount</span>
                            <span className="text-2xl font-black tracking-tighter text-indigo-600 italic">฿{order.total_price.toLocaleString()}</span>
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
        </div>
    );
}
