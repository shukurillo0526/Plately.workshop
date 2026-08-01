import {
  DollarSign,
  ShoppingBag,
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ChefHat,
  Utensils,
} from 'lucide-react';

const stats = [
  {
    title: 'Total Revenue',
    value: '2,450,000',
    unit: 'soʻm',
    change: '+12%',
    trend: 'up' as const,
    subtitle: 'from yesterday',
    icon: DollarSign,
    gradient: 'from-amber-500/20 to-orange-500/10',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
  },
  {
    title: 'Orders Today',
    value: '142',
    unit: '',
    change: '+5%',
    trend: 'up' as const,
    subtitle: 'from yesterday',
    icon: ShoppingBag,
    gradient: 'from-blue-500/20 to-indigo-500/10',
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10',
  },
  {
    title: 'Avg Prep Time',
    value: '14m 20s',
    unit: '',
    change: '+1m',
    trend: 'down' as const,
    subtitle: 'from yesterday',
    icon: Clock,
    gradient: 'from-purple-500/20 to-violet-500/10',
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10',
  },
  {
    title: 'Active Customers',
    value: '28',
    unit: '',
    change: '',
    trend: 'up' as const,
    subtitle: 'Currently dining',
    icon: Users,
    gradient: 'from-emerald-500/20 to-teal-500/10',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10',
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back. Here's what's happening today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.trend === 'up' && stat.title !== 'Avg Prep Time';
          const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;
          const trendColor = isPositive ? 'text-emerald-400' : 'text-red-400';

          return (
            <div
              key={stat.title}
              className="group relative overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#161b22] p-5 hover:border-[rgba(255,255,255,0.12)] transition-all duration-300 hover:-translate-y-0.5"
            >
              {/* Gradient glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-400">{stat.title}</h3>
                  <div className={`w-9 h-9 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-[18px] h-[18px] ${stat.iconColor}`} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold font-[family-name:var(--font-mono)] text-white tracking-tight">
                    {stat.value}
                  </p>
                  {stat.unit && (
                    <span className="text-sm text-gray-500 font-medium">{stat.unit}</span>
                  )}
                </div>
                {stat.change && (
                  <div className="flex items-center gap-1 mt-2">
                    <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
                    <span className={`text-xs font-medium ${trendColor}`}>{stat.change}</span>
                    <span className="text-xs text-gray-600">{stat.subtitle}</span>
                  </div>
                )}
                {!stat.change && stat.subtitle && (
                  <p className="text-xs text-gray-600 mt-2">{stat.subtitle}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Orders */}
        <div className="lg:col-span-2 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#161b22] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold font-[family-name:var(--font-display)] text-white">Recent Orders</h2>
            <span className="text-xs text-gray-500">Last 24 hours</span>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1c2333] flex items-center justify-center">
                    <Utensils className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">PLT-{String(10240 + i).padStart(5, '0')}</p>
                    <p className="text-xs text-gray-500">2 items • Delivery</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium font-[family-name:var(--font-mono)] text-white">{(35000 + i * 12000).toLocaleString()} soʻm</p>
                  <p className="text-xs text-emerald-400">Completed</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#161b22] p-6">
          <h2 className="text-base font-semibold font-[family-name:var(--font-display)] text-white mb-5">Quick Actions</h2>
          <div className="space-y-2.5">
            {[
              { label: 'Open KDS', desc: 'Kitchen display', icon: ChefHat, href: '/kds', color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'View Orders', desc: 'Order history', icon: ShoppingBag, href: '/orders', color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Edit Menu', desc: 'Items & modifiers', icon: Utensils, href: '/menu', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            ].map((action) => {
              const ActionIcon = action.icon;
              return (
                <a
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors group"
                >
                  <div className={`w-9 h-9 rounded-lg ${action.bg} flex items-center justify-center`}>
                    <ActionIcon className={`w-[18px] h-[18px] ${action.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{action.label}</p>
                    <p className="text-xs text-gray-500">{action.desc}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
