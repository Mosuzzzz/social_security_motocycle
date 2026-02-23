import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MotoFlow | Premium Motorcycle Service",
  description: "Next-generation motorcycle service and inventory management system.",
};

import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";

import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-black text-white selection:bg-pink-500/30 font-sans`}
      >
        {/* Global Background Glowing Effects */}
        <div className="fixed inset-0 z-[-1] overflow-hidden bg-black pointer-events-none">
          <div className="absolute w-[800px] h-[300px] bg-gradient-to-r from-pink-600 to-red-600 blur-[100px] rounded-[100%] rotate-[-15deg] top-[15%] left-[-10%] opacity-60"></div>
          <div className="absolute w-[800px] h-[350px] bg-gradient-to-r from-purple-800 to-pink-500 blur-[120px] rounded-[100%] rotate-[15deg] top-[30%] right-[-10%] opacity-50"></div>
          <div className="absolute w-[1200px] h-[250px] bg-gradient-to-r from-transparent via-red-500 to-transparent blur-[80px] top-[40%] left-[-10%] opacity-40"></div>

          <div className="absolute w-[150%] h-[1200px] border-t border-white/20 rounded-[100%] top-[40%] left-[-25%] shadow-[0_0_50px_rgba(255,0,128,0.4)] transform -rotate-[5deg]"></div>
          <div className="absolute w-[130%] h-[1000px] border-t border-white/10 rounded-[100%] top-[30%] left-[-15%] transform rotate-[8deg]"></div>

          <div className="absolute top-[25%] left-[25%] w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white] opacity-70"></div>
          <div className="absolute top-[40%] left-[55%] w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_12px_white] opacity-60"></div>
          <div className="absolute top-[20%] right-[35%] w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white] opacity-80"></div>
          <div className="absolute top-[50%] right-[15%] w-1 h-1 bg-white rounded-full shadow-[0_0_6px_white] opacity-40"></div>
        </div>

        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
        <Script src="https://cdn.omise.co/omise.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
