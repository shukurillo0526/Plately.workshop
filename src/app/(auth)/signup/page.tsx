'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Mail, Lock, ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [restaurantName, setRestaurantName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          restaurant_name: restaurantName,
        }
      }
    });
    
    setIsLoading(false);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Check your email to confirm your account');
      router.push('/login');
    }
  };

  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#161b22] p-8 shadow-xl">
      <h2 className="text-2xl font-bold mb-6 font-[family-name:var(--font-display)] text-white">Create your Workshop</h2>
      
      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Restaurant Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Building2 className="h-5 w-5" />
            </div>
            <input 
              type="text" 
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              className="w-full bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-[#f98b25] focus:ring-1 focus:ring-[#f98b25] transition-all"
              placeholder="My Awesome Restaurant"
              required
              disabled={isLoading}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Mail className="h-5 w-5" />
            </div>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-[#f98b25] focus:ring-1 focus:ring-[#f98b25] transition-all"
              placeholder="manager@restaurant.com"
              required
              disabled={isLoading}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Lock className="h-5 w-5" />
            </div>
            <input 
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(
                "w-full bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-xl pl-10 pr-10 py-2.5 text-white focus:outline-none focus:border-[#f98b25] focus:ring-1 focus:ring-[#f98b25] transition-all",
                showPassword ? "font-sans" : "font-mono"
              )}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={cn(
                "w-full bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-xl pl-10 pr-10 py-2.5 text-white focus:outline-none focus:border-[#f98b25] focus:ring-1 focus:ring-[#f98b25] transition-all",
                showConfirmPassword ? "font-sans" : "font-mono"
              )}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-[#f98b25] to-[#d67215] hover:from-[#e07a00] hover:to-[#c2620f] text-white font-semibold py-2.5 px-4 rounded-xl transition-all mt-6 shadow-lg shadow-orange-500/20 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Creating...
            </>
          ) : (
            'Create Workshop'
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
  );
}
