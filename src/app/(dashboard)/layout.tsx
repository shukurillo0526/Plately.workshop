'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Wifi,
  WifiOff,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'KDS', href: '/kds', icon: ChefHat },
  { name: 'Menu', href: '/menu', icon: UtensilsCrossed },
  { name: 'Orders', href: '/orders', icon: ShoppingBag },
  { name: 'Dispatch', href: '/dispatch', icon: Truck },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

import { OfflineBanner } from '@/components/common/offline-banner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-[#0D1117] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] shrink-0 flex flex-col border-r border-[rgba(255,255,255,0.06)] bg-[rgba(13,17,23,0.8)] backdrop-blur-xl">
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
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-[rgba(249,139,37,0.15)] to-[rgba(249,139,37,0.05)] text-[#f98b25] shadow-[inset_0_0_0_1px_rgba(249,139,37,0.15)]'
                    : 'text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.04)]'
                )}
              >
                <Icon className={cn('w-[18px] h-[18px]', isActive && 'text-[#f98b25]')} strokeWidth={isActive ? 2 : 1.5} />
                <span>{item.name}</span>
                {item.name === 'KDS' && (
                  <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded bg-[rgba(249,139,37,0.2)] text-[#f98b25] tabular-nums">LIVE</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Connection Status Footer */}
        <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-gray-500">Connected</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <OfflineBanner />
        {/* Topbar */}
        <header className="h-16 shrink-0 flex items-center justify-between px-8 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(13,17,23,0.6)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold font-[family-name:var(--font-display)] text-white">Tashkent Palace</h2>
            <button className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#161b22] border border-[rgba(255,255,255,0.08)] rounded-full text-gray-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-colors">
              Main Branch
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative w-9 h-9 rounded-lg bg-[#161b22] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-gray-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#f98b25] rounded-full" />
            </button>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#f98b25] to-[#e07a00] flex items-center justify-center text-sm font-bold text-white cursor-pointer">
              JD
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
