import { cn } from "@/lib/utils";

export type OrderStatus = 'confirmed' | 'preparing' | 'ready' | 'dispatched' | 'completed' | 'cancelled' | 'rejected';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const baseClasses = "rounded-full font-medium capitalize inline-flex items-center justify-center";
  const sizeClasses = size === 'sm' ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5";
  
  let colorClasses = "";
  switch (status) {
    case 'confirmed':
      colorClasses = "bg-gray-500/10 text-gray-400";
      break;
    case 'preparing':
      colorClasses = "bg-blue-500/10 text-blue-400";
      break;
    case 'ready':
      colorClasses = "bg-amber-500/10 text-amber-400";
      break;
    case 'dispatched':
      colorClasses = "bg-purple-500/10 text-purple-400";
      break;
    case 'completed':
      colorClasses = "bg-emerald-500/10 text-emerald-400";
      break;
    case 'cancelled':
    case 'rejected':
      colorClasses = "bg-red-500/10 text-red-400";
      break;
  }

  return (
    <span className={cn(baseClasses, sizeClasses, colorClasses, className)}>
      {status}
    </span>
  );
}
