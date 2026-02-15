import Link from "next/link";
import { Wrench, Shield, ArrowRight, Zap, PenTool as Tool } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#050505] text-white selection:bg-indigo-500/30 overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-indigo-600/20 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-purple-600/20 blur-[150px] rounded-full animate-pulse blur-delay-2000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 md:px-16 py-8 border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Wrench size={22} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">MotoFlow</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Sign In</Link>
          <Link
            href="/register"
            className="px-6 py-2.5 bg-white text-black text-sm font-bold rounded-full hover:bg-zinc-200 transition-all shadow-xl shadow-white/5 active:scale-95"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-24 md:py-40">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Available Nationwide</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] max-w-4xl text-balance bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          Revolutionize Your <br />
          <span className="text-indigo-500 italic">Motorcycle Service.</span>
        </h1>

        <p className="text-xl text-zinc-500 max-w-2xl mb-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
          The all-in-one platform for motorcycle owners and service centers. Book, track, and pay for services with ease.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
          <Link
            href="/register"
            className="px-10 py-5 bg-indigo-600 text-white text-lg font-bold rounded-[32px] hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-600/20 flex items-center gap-3 group"
          >
            Create Free Account
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="px-10 py-5 bg-white/5 border border-white/10 text-lg font-bold rounded-[32px] hover:bg-white/10 transition-all backdrop-blur-sm"
          >
            Log In
          </Link>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-40 max-w-6xl w-full">
          <FeatureCard
            icon={<Zap className="text-amber-500" />}
            title="Instant Booking"
            desc="Book your service slot in seconds directly from your phone."
          />
          <FeatureCard
            icon={<Tool className="text-indigo-500" />}
            title="Expert Mechanics"
            desc="Get matched with certified professionals for your specific bike model."
          />
          <FeatureCard
            icon={<Shield className="text-emerald-500" />}
            title="Secure Payments"
            desc="Pay safely using Omise integration with full transparency."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-8 border-t border-white/5 text-center text-zinc-600 text-xs tracking-widest uppercase font-bold">
        © 2026 MotoFlow Systems — Precision & Speed
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

function FeatureCard({ icon, title, desc }: FeatureCardProps) {
  return (
    <div className="p-8 bg-zinc-900 border border-white/5 rounded-[40px] text-left hover:border-white/10 transition-colors group">
      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-white/10 group-hover:ring-white/20 transition-all group-hover:scale-110">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
