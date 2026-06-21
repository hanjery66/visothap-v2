"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldAlert, AlertCircle, User, Lock, Loader2 } from "lucide-react";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
  const { data: session } = useSession();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Debug logs for login page
  useEffect(() => {
    console.log("Login Page - pathname:", window.location.pathname);
    console.log("Login Page - callbackUrl:", callbackUrl);
    console.log("Login Page - session:", session);
  }, [callbackUrl, session]);

  useEffect(() => {
    if (session) {
      console.log("Login Page - Redirecting to:", callbackUrl);
      router.replace(callbackUrl);
    }
  }, [session, router, callbackUrl]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter both Username and Password.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await authClient.signIn.username({
        username: username.trim(),
        password: password,
      });

      if (signInError) {
        setError(
          signInError.message ||
            "Login failed. Please verify your credentials.",
        );
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(
        err?.message || "A system error occurred. Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md  border border-primary/30 shadow-[0_0_60px_rgba(21,190,206,0.06)] rounded-2xl p-8 relative overflow-hidden">
      {/* Decorative top lightbar */}
      <div className="absolute top-0 left-0 right-0 h-[2px]  from-transparent via-primary to-transparent opacity-80" />

      {/* Brand logo & header */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-xl flex border border-primary/30 items-center justify-center shadow-inner mb-4">
          <ShieldAlert size={24} strokeWidth={2} className="text-primary" />
        </div>
        <h1 className="text-xl font-bold tracking-tight  from-primary to-primary/60  text-primary">
          VISOTHAP ADMIN
        </h1>
        <p className=" text-xs mt-1">Lottery Numbers Management System Login</p>
      </div>

      {/* Form content */}
      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        {error && (
          <div className="p-3 bg-primary/10 border border-primary/30 text-primary rounded-lg flex items-center gap-2">
            <AlertCircle size={14} strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-1.5 text-left">
          <label className="text-xs font-bold text-primary uppercase tracking-wider px-1">
            Username
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-primary pointer-events-none">
              <User size={16} strokeWidth={2} />
            </span>
            <Input
              type="text"
              autoComplete="username"
              placeholder="Enter username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 h-auto  focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30 transition-all duration-200"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 text-left">
          <label className="text-xs font-bold text-primary uppercase tracking-wider px-1">
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-primary pointer-events-none">
              <Lock size={16} strokeWidth={2} />
            </span>
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="Enter password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 h-auto focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30 transition-all duration-200"
            />
          </div>
        </div>

        <Link
          href={"/"}
          className="text-primary hover:text-primary font-medium underline mt-2 w-full flex justify-center"
        >
          Back to home
        </Link>

        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin -ml-1 mr-3" />
              Logging in...
            </>
          ) : (
            "Login Now"
          )}
        </Button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-850 p-8 rounded-2xl h-[420px] flex items-center justify-center text-zinc-500">
          Loading login layout...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
