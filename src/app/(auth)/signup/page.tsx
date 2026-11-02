'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Mail, Lock, ShieldCheck, Eye, EyeOff, Loader2, Sparkles, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Creating account...');
  
  const [restaurantName, setRestaurantName] = useState('');
  const [cuisine, setCuisine] = useState('Uzbek');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantName.trim()) {
      toast.error('Please enter your restaurant name.');
      return;
    }
    if (!email.trim()) {
      toast.error('Please enter a valid email.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setLoadingStep('Provisioning your workshop...');

    try {
      // 1. Call server-side signup route (auto-confirms, creates restaurant, branch, staff & JWT claims)
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName: restaurantName.trim(),
          cuisine,
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Failed to create workshop');
      }

      setLoadingStep('Configuring kitchen display...');

      // 2. Fallback client sign-in if server instructed
      if (data.requiresClientLogin) {
        const supabase = createClient();
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
      }

      toast.success(`Workshop created for "${restaurantName.trim()}"! Welcome.`);
      window.location.href = data.redirect || '/';
    } catch (err: unknown) {
      console.error('[Signup] Error:', err);
      const msg = err instanceof Error ? err.message : 'An error occurred during sign up.';
      toast.error(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#161b22] p-8 shadow-xl">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] text-white">
            Create your Workshop
          </h2>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#34d399] bg-[rgba(52,211,153,0.12)] border border-[rgba(52,211,153,0.25)] px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#34d399]" />
            Instant Setup
          </span>
        </div>
        <p className="text-sm text-gray-400 mb-6">Launch your restaurant OS in under 30 seconds</p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Restaurant Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <Building2 className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f98b25] focus:ring-1 focus:ring-[#f98b25] transition-all"
                placeholder="e.g. Navoi Milliy Taomlari"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Cuisine Type</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <Utensils className="h-4 w-4" />
              </div>
              <select
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="w-full bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#f98b25] focus:ring-1 focus:ring-[#f98b25] transition-all appearance-none cursor-pointer"
                disabled={isLoading}
              >
                <option value="Uzbek">Uzbek Cuisine</option>
                <option value="Korean">Korean Cuisine</option>
                <option value="Japanese">Japanese Cuisine</option>
                <option value="Italian">Italian Cuisine</option>
                <option value="Fast Food">Fast Food & Burgers</option>
                <option value="Bakery & Cafe">Bakery & Cafe</option>
                <option value="Mixed">Mixed & International</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f98b25] focus:ring-1 focus:ring-[#f98b25] transition-all"
                placeholder="manager@restaurant.com"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(
                  'w-full bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f98b25] focus:ring-1 focus:ring-[#f98b25] transition-all',
                  showPassword ? 'font-sans' : 'font-mono'
                )}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-300"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={cn(
                  'w-full bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f98b25] focus:ring-1 focus:ring-[#f98b25] transition-all',
                  showConfirmPassword ? 'font-sans' : 'font-mono'
                )}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-300"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#f98b25] to-[#d67215] hover:from-[#e07a00] hover:to-[#c2620f] text-white font-semibold py-2.5 px-4 rounded-xl transition-all mt-6 shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                <span>{loadingStep}</span>
              </>
            ) : (
              <span>Create Workshop</span>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="text-[#f98b25] hover:text-[#f98b25]/80 font-medium hover:underline transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
