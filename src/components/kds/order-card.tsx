'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { KDSOrder } from '@/stores/kds-store';
import { ElapsedTimer } from './elapsed-timer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

import { Printer } from 'lucide-react';

interface OrderCardProps {
  order: KDSOrder;
  column: 'confirmed' | 'preparing' | 'ready' | 'dispatched';
  onAction: (orderId: string, action: string) => void;
  onPrint?: (order: KDSOrder) => void;
}

export function OrderCard({ order, column, onAction, onPrint }: OrderCardProps) {
  const [isUrgent, setIsUrgent] = useState(false);

  // Time thresholds before an order becomes urgent
  const urgentThresholds = {
    confirmed: 3 * 60 * 1000, // 3 minutes
    preparing: 15 * 60 * 1000, // 15 minutes
    ready: 5 * 60 * 1000, // 5 minutes
    dispatched: 15 * 60 * 1000, // 15 minutes
  };

  const getOrderTypeStyles = (type: string) => {
    switch (type) {
      case 'delivery':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'pickup':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'dine_in':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getOrderTypeLabel = (type: string) => {
    switch (type) {
      case 'delivery': return 'Delivery';
      case 'pickup': return 'Pickup';
      case 'dine_in': return 'Dine-in';
      default: return type;
    }
  };

  const renderActions = () => {
    switch (column) {
      case 'confirmed':
        return (
          <div className="flex gap-2 mt-4">
            <Button 
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" 
              onClick={() => onAction(order.id, 'accept')}
            >
              Accept
            </Button>
            <Button 
              variant="destructive" 
              className="px-3"
              onClick={() => onAction(order.id, 'reject')}
            >
              Reject
            </Button>
          </div>
        );
      case 'preparing':
        return (
          <div className="flex gap-2 mt-4">
            <Button 
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" 
              onClick={() => onAction(order.id, 'ready')}
            >
              Mark Ready
            </Button>
          </div>
        );
      case 'ready':
        return (
          <div className="flex gap-2 mt-4">
            {order.order_type === 'delivery' ? (
              <Button 
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" 
                onClick={() => onAction(order.id, 'dispatch')}
              >
                Dispatch
              </Button>
            ) : (
              <Button 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" 
                onClick={() => onAction(order.id, 'complete')}
              >
                Complete
              </Button>
            )}
          </div>
        );
      case 'dispatched':
        return (
          <div className="flex gap-2 mt-4">
            <Button 
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" 
              onClick={() => onAction(order.id, 'complete')}
            >
              Complete
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "rounded-xl border bg-[#161b22] p-4 flex flex-col gap-3 transition-colors",
        "hover:border-[rgba(255,255,255,0.12)]",
        isUrgent ? "border-l-4 border-l-red-500 border-y-[rgba(255,255,255,0.06)] border-r-[rgba(255,255,255,0.06)]" : "border-[rgba(255,255,255,0.06)]"
      )}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="font-mono text-base font-bold text-white tracking-tight">{order.order_number}</span>
          {onPrint && (
            <button
              onClick={() => onPrint(order)}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-sm font-medium text-white mt-0.5">{order.customer_name}</div>
          <ElapsedTimer 
            startTime={order.created_at} 
            urgentAfterMs={urgentThresholds[column]} 
            onUrgent={setIsUrgent}
          />
          <Badge variant="outline" className={cn("px-2 py-0.5 text-xs font-semibold", getOrderTypeStyles(order.order_type))}>
            {getOrderTypeLabel(order.order_type)}
          </Badge>
        </div>
      </div>

      <div className="w-full h-px bg-white/5 my-1" />

      <div className="flex-1 flex flex-col gap-1.5 min-h-[60px]">
        {order.items.map((item, i) => (
          <div key={i} className="text-sm flex items-start text-gray-200">
            <span className="font-semibold text-white mr-1.5 min-w-[20px]">{item.quantity}x</span>
            <span className="leading-snug">{item.name}
              {item.modifiers && item.modifiers.length > 0 && (
                <span className="block text-xs text-gray-400 mt-0.5">
                  {item.modifiers.join(', ')}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
      
      {order.special_instructions && (
        <div className="text-xs bg-yellow-500/10 text-yellow-200 p-2 rounded border border-yellow-500/20 mt-1">
          <span className="font-semibold text-yellow-400">Note: </span>
          {order.special_instructions}
        </div>
      )}
      
      <div className="flex justify-between items-center mt-2">
        <div className="text-xs text-gray-500">Total</div>
        <div className="font-mono text-sm font-semibold text-white">
          {order.total?.toLocaleString('en-US').replace(/,/g, ' ')} UZS
        </div>
      </div>

      {renderActions()}
    </motion.div>
  );
}
