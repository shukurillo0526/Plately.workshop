'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ChefHat,
  UtensilsCrossed,
  ShoppingBag,
  Truck,
  Users,
  BarChart3,
  Settings,
  Menu,
  LogOut,
  Calendar,
  Megaphone,
  X,
  Globe,
  Bot,
  PhoneCall,
} from 'lucide-react';
import { OfflineBanner } from '@/components/common/offline-banner';
import { LanguageSwitcher } from '@/components/common/language-switcher';
import { BranchSwitcher } from '@/components/common/branch-switcher';
import { NotificationCenter } from '@/components/common/notification-center';
import { useAuthStore, ROUTE_PERMISSIONS } from '@/stores/auth-store';
import { useLanguageStore } from '@/stores/language-store';
import { createClient } from '@/lib/supabase/client';

interface NavSection {
  titleKey?: string;
  items: Array<{
    key: string;
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
  }>;
}

const navSections: NavSection[] = [
  {
    items: [
      { key: 'nav.dashboard', name: 'Dashboard', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    titleKey: 'nav.section.kitchen',
    items: [
      { key: 'nav.kds', name: 'KDS', href: '/kds', icon: ChefHat },
      { key: 'nav.orders', name: 'Orders', href: '/orders', icon: ShoppingBag },
      { key: 'nav.menu', name: 'Menu', href: '/menu', icon: UtensilsCrossed },
      { key: 'nav.reservations', name: 'Reservations', href: '/reservations', icon: Calendar },
      { key: 'nav.dispatch', name: 'Dispatch', href: '/dispatch', icon: Truck },
    ],
  },
  {
    titleKey: 'nav.section.omnichannel',
    items: [
      { key: 'nav.website', name: 'Website Builder', href: '/website', icon: Globe },
      { key: 'nav.agents', name: 'AI Agents', href: '/agents', icon: Bot },
      { key: 'nav.voice', name: 'Voice Calls', href: '/voice', icon: PhoneCall },
    ],
  },
  {
    titleKey: 'nav.section.growth',
    items: [
      { key: 'nav.customers', name: 'Customers', href: '/customers', icon: Users },
      { key: 'nav.marketing', name: 'Marketing', href: '/marketing', icon: Megaphone },
      { key: 'nav.analytics', name: 'Analytics', href: '/analytics', icon: BarChart3 },
      { key: 'nav.settings', name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // If on onboarding, render standalone without dashboard sidebar/header
  if (pathname.startsWith('/onboarding')) {
    return <div className="min-h-screen bg-[#0D1117] text-white">{children}</div>;
  }

  const { user, hasRole, setUser } = useAuthStore();
  const { t } = useLanguageStore();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  };

  const restaurantName = mounted ? (user?.restaurant_name ?? 'My Restaurant') : 'My Restaurant';
  
  let initials = 'PL';
  if (mounted && user?.display_name && user.display_name.trim().length > 0) {
    const parts = user.display_name.trim().split(/\s+/);
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts[0].length >= 2) {
      initials = parts[0].substring(0, 2).toUpperCase();
    } else {
      initials = parts[0][0].toUpperCase();
    }
  }

  return (
    <div className="flex h-screen bg-[#0D1117] overflow-hidden relative">
      {/* Mobile Sidebar Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-[260px] shrink-0 flex flex-col border-r border-[rgba(255,255,255,0.06)] bg-[rgba(13,17,23,0.8)] backdrop-blur-xl",
        "fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Plately Workshop" className="w-9 h-9 object-contain drop-shadow-sm" />
            <div>
              <h1 className="text-lg font-bold font-[family-name:var(--font-display)] text-white leading-none">Plately</h1>
              <p className="text-[10px] text-[#f98b25] uppercase tracking-[0.2em] font-medium leading-none mt-0.5">Workshop</p>
            </div>
          </div>
          {/* Close button on mobile */}
          <button 
            className="ml-auto text-gray-400 hover:text-white lg:hidden p-1"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-3.5 overflow-y-auto">
          {navSections.map((section, sIdx) => {
            const visibleItems = section.items.filter((item) => {
              if (item.href === '/') return true;
              const requiredRole = ROUTE_PERMISSIONS[item.href];
              if (!requiredRole) return true;
              return mounted ? hasRole(requiredRole) : true;
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-0.5">
                {section.titleKey && (
                  <p className="px-3 pt-1 pb-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {mounted ? t(section.titleKey, section.titleKey) : section.titleKey}
                  </p>
                )}
                {visibleItems.map((item) => {
                  const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-[rgba(249,139,37,0.15)] to-[rgba(249,139,37,0.05)] text-[#f98b25] shadow-[inset_0_0_0_1px_rgba(249,139,37,0.15)]'
                          : 'text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.04)]'
                      )}
                    >
                      <Icon className={cn('w-[18px] h-[18px]', isActive && 'text-[#f98b25]')} strokeWidth={isActive ? 2 : 1.5} />
                      <span suppressHydrationWarning>{mounted ? t(item.key, item.name) : item.name}</span>
                      {item.name === 'KDS' && (
                        <span suppressHydrationWarning className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded bg-[rgba(249,139,37,0.2)] text-[#f98b25] tabular-nums">
                          {mounted ? t('nav.live', 'LIVE') : 'LIVE'}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Sign out and Connection Status Footer */}
        <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.06)]">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-2 py-2 -mx-2 mb-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.04)] transition-all duration-200"
          >
            <LogOut className="w-[18px] h-[18px]" strokeWidth={1.5} />
            <span suppressHydrationWarning>{mounted ? t('nav.sign_out', 'Sign Out') : 'Sign Out'}</span>
          </button>
          
          <div className="flex items-center gap-2 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span suppressHydrationWarning className="text-gray-500">{mounted ? t('nav.connected', 'Connected') : 'Connected'}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full min-w-0">
        <OfflineBanner />
        {/* Topbar */}
        <header className="h-16 shrink-0 flex items-center justify-between px-8 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(13,17,23,0.6)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1 -ml-4 text-gray-400 hover:text-white"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 suppressHydrationWarning className="text-base font-semibold font-[family-name:var(--font-display)] text-white">{restaurantName}</h2>
            <BranchSwitcher />
          </div>
          
          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            <NotificationCenter />
            
            <div suppressHydrationWarning className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#f98b25] to-[#e07a00] flex items-center justify-center text-sm font-bold text-white cursor-pointer select-none">
              {initials}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className={cn("flex-1", pathname === '/kds' ? "overflow-hidden p-0" : "overflow-y-auto p-8")}>
          {children}
        </div>
      </main>
    </div>
  );
}
