'use client';

import { useState, useEffect } from 'react';
import { ChefHat, Maximize2, Minimize2, Volume2, VolumeX } from 'lucide-react';
import { OrderCard } from '@/components/kds/order-card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import { KDSOrder } from '@/stores/kds-store';

// Sample orders based on KDS requirements
const createSampleOrders = (): KDSOrder[] => {
  const now = Date.now();
  return [
    {
      id: '1', order_number: 'PLT-10241', status: 'confirmed' as const, customer_name: 'Alisher N.', 
      order_type: 'delivery' as const, created_at: new Date(now - 60000).toISOString(), accepted_at: null, estimated_minutes: null, priority: 'normal' as const, delivery_address: null, auto_reject_at: null,
      items: [{ menu_item_id: '1', name: 'Osh (Plov)', quantity: 2, modifiers: [], special_instructions: null }, { menu_item_id: '2', name: 'Achichuk', quantity: 1, modifiers: [], special_instructions: null }],
      total: 125000
    },
    {
      id: '2', order_number: 'PLT-10242', status: 'confirmed' as const, customer_name: 'Dildora T.', 
      order_type: 'pickup' as const, created_at: new Date(now - 200000).toISOString(), accepted_at: null, estimated_minutes: null, priority: 'normal' as const, delivery_address: null, auto_reject_at: null,
      items: [{ menu_item_id: '3', name: 'Somsa', quantity: 4, modifiers: [], special_instructions: 'Extra spicy please' }],
      total: 40000
    },
    {
      id: '3', order_number: 'PLT-10243', status: 'preparing' as const, customer_name: 'Timur Y.', 
      order_type: 'dine_in' as const, created_at: new Date(now - 600000).toISOString(), accepted_at: null, estimated_minutes: null, priority: 'normal' as const, delivery_address: null, auto_reject_at: null,
      items: [{ menu_item_id: '4', name: 'Shashlik (Beef)', quantity: 3, modifiers: [], special_instructions: null }, { menu_item_id: '5', name: 'Non', quantity: 2, modifiers: [], special_instructions: null }],
      total: 85000
    },
    {
      id: '4', order_number: 'PLT-10244', status: 'preparing' as const, customer_name: 'Malika B.', 
      order_type: 'delivery' as const, created_at: new Date(now - 1000000).toISOString(), accepted_at: null, estimated_minutes: null, priority: 'normal' as const, delivery_address: null, auto_reject_at: null,
      items: [{ menu_item_id: '6', name: 'Manti', quantity: 1, modifiers: [], special_instructions: null }],
      total: 45000
    },
    {
      id: '5', order_number: 'PLT-10245', status: 'ready' as const, customer_name: 'Rustam A.', 
      order_type: 'pickup' as const, created_at: new Date(now - 1500000).toISOString(), accepted_at: null, estimated_minutes: null, priority: 'normal' as const, delivery_address: null, auto_reject_at: null,
      items: [{ menu_item_id: '7', name: 'Lagman', quantity: 2, modifiers: [], special_instructions: null }],
      total: 90000
    },
    {
      id: '6', order_number: 'PLT-10246', status: 'ready' as const, customer_name: 'Aziz K.', 
      order_type: 'delivery' as const, created_at: new Date(now - 1800000).toISOString(), accepted_at: null, estimated_minutes: null, priority: 'normal' as const, delivery_address: null, auto_reject_at: null,
      items: [{ menu_item_id: '8', name: 'Choyxona Palov', quantity: 5, modifiers: [], special_instructions: null }],
      total: 250000
    },
    {
      id: '7', order_number: 'PLT-10247', status: 'dispatched' as const, customer_name: 'Nodira S.', 
      order_type: 'delivery' as const, created_at: new Date(now - 3000000).toISOString(), accepted_at: null, estimated_minutes: null, priority: 'normal' as const, delivery_address: null, auto_reject_at: null,
      items: [{ menu_item_id: '3', name: 'Somsa', quantity: 10, modifiers: [], special_instructions: null }],
      total: 100000
    }
  ];
};

import { PrintReceiptDialog } from '@/components/orders/print-receipt-dialog';

export default function KDSPage() {
  const [orders, setOrders] = useState<KDSOrder[]>(createSampleOrders);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);
  const [printingOrder, setPrintingOrder] = useState<KDSOrder | null>(null);

  useEffect(() => {
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAction = (orderId: string, action: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      
      let nextStatus = order.status;
      switch (action) {
        case 'accept': nextStatus = 'preparing'; break;
        case 'reject': 
          toast.success(`Order ${order.order_number} rejected`);
          return { ...order, status: 'rejected' }; // This will hide it
        case 'ready': nextStatus = 'ready'; break;
        case 'dispatch': nextStatus = 'dispatched'; break;
        case 'complete': 
          toast.success(`Order ${order.order_number} completed`);
          return { ...order, status: 'completed' }; // This will hide it
      }
      
      if (nextStatus !== order.status) {
        toast.success(`Order ${order.order_number} moved to ${nextStatus}`);
      }
      return { ...order, status: nextStatus };
    }));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Tashkent',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const columns = [
    { id: 'confirmed', title: 'NEW', color: 'bg-amber-500' },
    { id: 'preparing', title: 'PREPARING', color: 'bg-blue-500' },
    { id: 'ready', title: 'READY', color: 'bg-emerald-500' },
    { id: 'dispatched', title: 'DISPATCHED', color: 'bg-purple-500' },
  ] as const;

  return (
    <div className="flex flex-col h-screen bg-[#0D1117] text-white overflow-hidden">
      {/* Toolbar */}
      <header className="h-16 border-b border-[rgba(255,255,255,0.06)] bg-[#161b22] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-[#f98b25] p-2 rounded-lg text-white">
            <ChefHat size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Kitchen Display</h1>
          <div className="ml-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium text-emerald-400">Connected</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="font-mono text-xl font-semibold text-gray-200 tracking-wider">
            {formattedTime}
          </div>
          
          <div className="flex items-center gap-2">
            <Switch 
              id="auto-accept" 
              checked={autoAccept} 
              onCheckedChange={setAutoAccept}
              className="data-[state=checked]:bg-emerald-500"
            />
            <Label htmlFor="auto-accept" className="text-sm text-gray-300">Auto-accept</Label>
          </div>

          <div className="h-6 w-px bg-[rgba(255,255,255,0.1)]" />

          <button 
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isSoundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          
          <button 
            onClick={toggleFullscreen}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="flex-1 overflow-hidden p-6">
        <div className="grid grid-cols-4 gap-6 h-full">
          {columns.map(col => {
            const colOrders = orders.filter(o => o.status === col.id);
            
            return (
              <div key={col.id} className="flex flex-col h-full bg-[#1c2333]/50 rounded-2xl border border-[rgba(255,255,255,0.04)] overflow-hidden">
                <div className="p-4 border-b border-[rgba(255,255,255,0.04)] bg-[#1c2333]">
                  <div className={`w-12 h-1 rounded-full mb-3 ${col.color}`} />
                  <div className="flex justify-between items-center">
                    <h2 className="font-bold text-gray-200 tracking-wide">{col.title}</h2>
                    <div className="bg-[rgba(255,255,255,0.1)] text-white px-2.5 py-0.5 rounded-full text-sm font-semibold">
                      {colOrders.length}
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <AnimatePresence mode="popLayout">
                    {colOrders.map(order => (
                      <OrderCard 
                        key={order.id} 
                        order={order} 
                        column={col.id} 
                        onAction={handleAction} 
                        onPrint={(o) => setPrintingOrder(o)}
                      />
                    ))}
                  </AnimatePresence>
                  
                  {colOrders.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                      <ChefHat size={48} className="mb-4" />
                      <p>No orders</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <PrintReceiptDialog
        order={printingOrder}
        open={!!printingOrder}
        onOpenChange={(open) => !open && setPrintingOrder(null)}
      />
    </div>
  );
}
