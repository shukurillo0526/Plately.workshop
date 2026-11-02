'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Sparkles, ChefHat, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submitLogin = async (loginEmail: string, loginPass: string) => {
    try {
      // 1. Primary: Use server-side auth route (auto-confirms emails, self-heals claims & cookies)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPass,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('Welcome back to Plately Workshop!');
        window.location.href = data.redirect || '/';
        return;
      }

      // If server route returned an explicit error message
      if (data?.error) {
        // If server failed, attempt client-side fallback
        const supabase = createClient();
        const { error: clientError } = await supabase.auth.signInWithPassword({
          email: loginEmail.trim(),
          password: loginPass,
        });

        if (clientError) {
          toast.error(data.error || clientError.message);
          return;
        }

        toast.success('Signed in successfully!');
        window.location.href = '/';
        return;
      }

      throw new Error(data?.error || 'Authentication failed');
    } catch (err: unknown) {
      console.error('[Login] Error:', err);
      const msg = err instanceof Error ? err.message : 'Invalid login credentials.';
      toast.error(msg);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }
    setIsLoading(true);
    await submitLogin(email, password);
    setIsLoading(false);
  };

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    setEmail('demo@plately.app');
    setPassword('12345678');
    await submitLogin('demo@plately.app', '12345678');
    setIsDemoLoading(false);
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#161b22] p-8 shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] text-white">Welcome back</h2>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#f98b25] bg-[rgba(249,139,37,0.12)] border border-[rgba(249,139,37,0.25)] px-2 py-0.5 rounded-full">
            Workshop OS
          </span>
        </div>
        <p className="text-sm text-gray-400 mb-6">Sign in to manage your kitchen & orders</p>

        {/* 1-Click Demo Login Banner */}
        <div className="mb-6 p-4 rounded-xl border border-[rgba(249,139,37,0.3)] bg-gradient-to-br from-[rgba(249,139,37,0.12)] to-[rgba(249,139,37,0.04)]">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#f98b25] flex items-center justify-center text-black shrink-0 font-bold">
              <ChefHat className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                Live Restaurant Demo
                <Sparkles className="w-3.5 h-3.5 text-[#f98b25] animate-pulse" />
              </h3>
              <p className="text-xs text-gray-300 mt-0.5">
                Instant access to pre-seeded Kamolon kitchen, live KDS & menu items.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isLoading || isDemoLoading}
            className="w-full bg-[#f98b25] hover:bg-[#e07a00] text-black font-semibold text-sm py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
          >
            {isDemoLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Entering Kamolon OS...</span>
              </>
            ) : (
              <>
                <span>1-Click Demo Login</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="mt-2.5 pt-2 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between text-[11px] text-gray-400">
            <span>demo@plately.app</span>
            <span>Password: 12345678</span>
          </div>
        </div>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-[rgba(255,255,255,0.08)]"></div>
          <span className="flex-shrink mx-4 text-xs uppercase tracking-wider text-gray-500 font-medium">Or Sign In with Credentials</span>
          <div className="flex-grow border-t border-[rgba(255,255,255,0.08)]"></div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f98b25] focus:ring-1 focus:ring-[rgba(249,139,37,0.3)] transition-all"
                placeholder="manager@restaurant.com"
                required
                disabled={isLoading || isDemoLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f98b25] focus:ring-1 focus:ring-[rgba(249,139,37,0.3)] transition-all font-mono"
                placeholder="Enter your password"
                required
                disabled={isLoading || isDemoLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || isDemoLoading}
            className="w-full bg-gradient-to-r from-[#f98b25] to-[#e07a00] hover:from-[#e07a00] hover:to-[#c96a00] text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-[rgba(249,139,37,0.2)] mt-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Don't have a workshop yet?{' '}
          <Link href="/signup" className="text-[#f98b25] hover:text-[#e07a00] font-medium transition-colors hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
