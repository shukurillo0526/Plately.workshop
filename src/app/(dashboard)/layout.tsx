'use client';

import { useState } from 'react';
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
  Bell,
  ChevronDown,
  Menu,
  LogOut,
  Calendar,
  Megaphone,
  X,
} from 'lucide-react';
import { OfflineBanner } from '@/components/common/offline-banner';
import { LanguageSwitcher } from '@/components/common/language-switcher';
import { useAuthStore, ROUTE_PERMISSIONS } from '@/stores/auth-store';
import { useBranchStore } from '@/stores/branch-store';
import { useLanguageStore } from '@/stores/language-store';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { key: 'nav.dashboard', name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { key: 'nav.kds', name: 'KDS', href: '/kds', icon: ChefHat },
  { key: 'nav.menu', name: 'Menu', href: '/menu', icon: UtensilsCrossed },
  { key: 'nav.orders', name: 'Orders', href: '/orders', icon: ShoppingBag },
  { key: 'nav.reservations', name: 'Reservations', href: '/reservations', icon: Calendar },
  { key: 'nav.dispatch', name: 'Dispatch', href: '/dispatch', icon: Truck },
  { key: 'nav.customers', name: 'Customers', href: '/customers', icon: Users },
  { key: 'nav.marketing', name: 'Marketing', href: '/marketing', icon: Megaphone },
  { key: 'nav.analytics', name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { key: 'nav.settings', name: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { user, hasRole, setUser } = useAuthStore();
  const { getSelectedBranch } = useBranchStore();
  const { t } = useLanguageStore();
  
  const activeBranch = getSelectedBranch();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  };

  // Filter nav items based on roles
  const filteredNavItems = navItems.filter((item) => {
    if (item.href === '/') return true;
    const requiredRole = ROUTE_PERMISSIONS[item.href];
    if (!requiredRole) return true;
    return hasRole(requiredRole);
  });

  const restaurantName = user?.restaurant_name ?? 'My Restaurant';
  const branchName = activeBranch?.name ?? t('header.main_branch', 'Main Branch');
  
  let initials = 'PL';
  if (user?.display_name) {
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
          className="fixed inset-0 z-40 bg-black/50 xl:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-[260px] shrink-0 flex flex-col border-r border-[rgba(255,255,255,0.06)] bg-[rgba(13,17,23,0.8)] backdrop-blur-xl",
        "fixed inset-y-0 left-0 z-50 transition-transform duration-300 xl:relative xl:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f98b25] to-[#e07a00] flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <div>
              <h1 className="text-lg font-bold font-[family-name:var(--font-display)] text-white leading-none">Plately</h1>
              <p className="text-[10px] text-[#f98b25] uppercase tracking-[0.2em] font-medium leading-none mt-0.5">Workshop</p>
            </div>
          </div>
          {/* Close button on mobile */}
          <button 
            className="ml-auto text-gray-400 hover:text-white xl:hidden p-1"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-[rgba(249,139,37,0.15)] to-[rgba(249,139,37,0.05)] text-[#f98b25] shadow-[inset_0_0_0_1px_rgba(249,139,37,0.15)]'
                    : 'text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.04)]'
                )}
              >
                <Icon className={cn('w-[18px] h-[18px]', isActive && 'text-[#f98b25]')} strokeWidth={isActive ? 2 : 1.5} />
                <span>{t(item.key, item.name)}</span>
                {item.name === 'KDS' && (
                  <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded bg-[rgba(249,139,37,0.2)] text-[#f98b25] tabular-nums">
                    {t('nav.live', 'LIVE')}
                  </span>
                )}
              </Link>
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
            <span>{t('nav.sign_out', 'Sign Out')}</span>
          </button>
          
          <div className="flex items-center gap-2 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-gray-500">{t('nav.connected', 'Connected')}</span>
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
              className="xl:hidden p-1 -ml-4 text-gray-400 hover:text-white"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-base font-semibold font-[family-name:var(--font-display)] text-white">{restaurantName}</h2>
            <button className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#161b22] border border-[rgba(255,255,255,0.08)] rounded-full text-gray-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-colors">
              {branchName}
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            <button 
              className="relative w-9 h-9 rounded-lg bg-[#161b22] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-gray-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-colors"
              title={t('header.notifications', 'Notifications')}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#f98b25] rounded-full" />
            </button>
            
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#f98b25] to-[#e07a00] flex items-center justify-center text-sm font-bold text-white cursor-pointer select-none">
              {initials}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
