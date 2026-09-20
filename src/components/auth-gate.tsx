"use client";

import { useState, useEffect, type ReactNode } from "react";
import { 
  Lock, 
  Loader2, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Building2, 
  ShoppingBag, 
  User, 
  KeyRound 
} from "lucide-react";
import Link from "next/link";

export function AuthGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null); // null = checking
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Check auth status on mount via cookie and API
  useEffect(() => {
    const hasCookie = typeof document !== "undefined" && 
      document.cookie.split(";").some((c) => c.trim().startsWith("demo_auth="));

    if (hasCookie) {
      setAuthed(true);
      return;
    }

    // Fallback ping to API to be 100% sure
    fetch("/api/auth")
      .then((res) => res.json())
      .then((data) => setAuthed(!!data.authed))
      .catch(() => setAuthed(false));
  }, []);

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setBusy(true);

    const u = customUser ?? username;
    const p = customPass ?? password;

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setAuthed(true);
      } else {
        setError(data.error || "Invalid username or password");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // Loading state
  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#071c2e]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#16c4df]/20 border border-[#16c4df]/40 shadow-lg shadow-[#16c4df]/20">
            <Building2 className="h-6 w-6 text-[#16c4df] animate-pulse" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#8edce8]/80">
            Loading Operations Floor...
          </span>
        </div>
      </div>
    );
  }

  // Authenticated — render the app
  if (authed) return <>{children}</>;

  // Login screen
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#071c2e] via-[#0d2d46] to-[#1D5D8B] px-4 py-12 text-[#FCFDF8]">
      {/* Decorative ambient lights & texture */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#16c4df]/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#f0d900]/10 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-b from-white/20 to-white/5 p-3.5 shadow-2xl backdrop-blur-xl">
            <Building2 className="h-8 w-8 text-[#16c4df]" />
          </div>

          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl drop-shadow-sm">
            ETJOAIGI TRADING
          </h1>
          <p className="mt-1 text-xs text-stone-300">
            Muntinlupa Inventory, Pricing & Surplus Operations Hub
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/20 bg-white/10 p-7 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          <div className="mb-6 border-b border-white/10 pb-4">
            <h2 className="font-display text-lg font-bold text-white">Staff Sign In</h2>
            <p className="text-[11.5px] text-stone-300">Enter your internal credentials to access the operations floor</p>
          </div>

          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-200 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  autoFocus
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full rounded-xl border border-white/20 bg-black/20 pl-10 pr-4 py-2.5 text-sm font-medium text-white placeholder-stone-400 outline-none transition focus:border-[#16c4df] focus:bg-black/30 focus:ring-2 focus:ring-[#16c4df]/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-200 mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/20 bg-black/20 pl-10 pr-10 py-2.5 text-sm font-medium text-white placeholder-stone-400 outline-none transition focus:border-[#16c4df] focus:bg-black/30 focus:ring-2 focus:ring-[#16c4df]/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white transition"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-500/20 border border-rose-400/40 p-3 text-xs font-semibold text-rose-200 animate-in fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !username.trim() || !password.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#16c4df] to-[#12a4bb] px-4 py-3 text-sm font-bold text-[#071c2e] shadow-lg shadow-[#16c4df]/20 transition duration-200 hover:brightness-110 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#071c2e]" />
              ) : (
                <>
                  Access Trading Floor <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Public Storefront Link */}
        <div className="mt-6 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#8edce8] transition hover:text-white"
          >
            <ShoppingBag className="h-3.5 w-3.5 text-[#16c4df]" />
            Looking for public inventory? Visit Customer Shop →
          </Link>
        </div>
      </div>
    </div>
  );
}
