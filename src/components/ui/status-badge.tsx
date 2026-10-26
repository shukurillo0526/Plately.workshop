import { cn } from "@/lib/utils";

export type OrderStatus =
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'dispatched'
  | 'delivering'
  | 'picked_up'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'failed_delivery';

interface StatusBadgeProps {
  status: OrderStatus | string;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const baseClasses = "rounded-full font-medium capitalize inline-flex items-center justify-center tracking-wide border";
  const sizeClasses = size === 'sm' ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-0.5";
  
  let colorClasses = "bg-gray-500/10 text-gray-400 border-gray-500/20";
  switch (status) {
    case 'confirmed':
      colorClasses = "bg-blue-500/10 text-blue-400 border-blue-500/20";
      break;
    case 'preparing':
      colorClasses = "bg-amber-500/10 text-amber-400 border-amber-500/20";
      break;
    case 'ready':
      colorClasses = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      break;
    case 'dispatched':
      colorClasses = "bg-purple-500/10 text-purple-400 border-purple-500/20";
      break;
    case 'delivering':
      colorClasses = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      break;
    case 'picked_up':
      colorClasses = "bg-teal-500/10 text-teal-400 border-teal-500/20";
      break;
    case 'completed':
      colorClasses = "bg-slate-500/10 text-slate-300 border-slate-500/20";
      break;
    case 'cancelled':
    case 'rejected':
    case 'failed_delivery':
      colorClasses = "bg-red-500/10 text-red-400 border-red-500/20";
      break;
  }

  const label = status.replace(/_/g, ' ');

  return (
    <span className={cn(baseClasses, sizeClasses, colorClasses, className)}>
      {label}
    </span>
  );
}
