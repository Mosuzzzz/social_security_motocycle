"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import liff from "@line/liff";
import { apiFetch } from "@/lib/api";

interface User {
    user_id: number;
    username: string;
    role: "Admin" | "Customer" | "Mechanic";
    avatar_url?: string;
    name?: string;
    phone?: string;
}


interface AuthContextType {
    user: User | null;
    login: (token: string, refreshToken: string, userData: User) => void;
    logout: () => Promise<void>;
    updateUser: (userData: Partial<User>) => void;
    isLoading: boolean;
    isLiffLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLiffLoading, setIsLiffLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const initLiff = async () => {
            const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
            if (!liffId) {
                console.error("LIFF ID not found");
                setIsLiffLoading(false);
                return;
            }

            try {
                await liff.init({ liffId });
                console.log("LIFF initialized");
            } catch (err) {
                console.error("LIFF initialization failed", err);
            } finally {
                setIsLiffLoading(false);
            }
        };

        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (storedUser && token) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse stored user", e);
                localStorage.removeItem("user");
                localStorage.removeItem("token");
            }
        }

        initLiff();
        setIsLoading(false);
    }, []);

    const login = (token: string, refreshToken: string, userData: User) => {
        localStorage.setItem("token", token);
        localStorage.setItem("refresh_token", refreshToken);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        router.push("/dashboard");
    };

    const logout = async () => {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
            try {
                await apiFetch("/api/auth/logout", {
                    method: "POST",
                    body: JSON.stringify({ refresh_token: refreshToken }),
                });
            } catch (err) {
                console.error("Logout from backend failed", err);
            }
        }

        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        if (liff.isLoggedIn()) {
            liff.logout();
        }
        setUser(null);
        router.push("/login");
    };

    const updateUser = (userData: Partial<User>) => {
        if (user) {
            const updatedUser = { ...user, ...userData };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, isLoading, isLiffLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
