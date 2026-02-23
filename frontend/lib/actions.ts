"use server";

import { apiFetch } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function updateOrderStatusAction(formData: FormData) {
    const orderId = formData.get("orderId");
    const status = formData.get("status");
    const totalPrice = formData.get("totalPrice");

    try {
        await apiFetch(`/api/orders/${orderId}/status`, {
            method: "POST",
            body: JSON.stringify({
                order_id: Number(orderId),
                status,
                total_price: totalPrice ? Number(totalPrice) : undefined,
            }),
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function useStockItemAction(orderId: number, stockItemId: number, quantity: number) {
    try {
        await apiFetch("/api/stock/use", {
            method: "POST",
            body: JSON.stringify({
                order_id: orderId,
                stock_item_id: stockItemId,
                quantity,
            }),
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function addStockItemAction(formData: FormData) {
    const name = formData.get("name");
    const price = formData.get("price");
    const quantity = formData.get("quantity");

    try {
        await apiFetch("/api/stock", {
            method: "POST",
            body: JSON.stringify({
                name,
                price: Number(price),
                quantity: Number(quantity),
            }),
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
