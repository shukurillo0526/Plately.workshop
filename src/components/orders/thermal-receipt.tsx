import React from 'react';
import { cn } from '@/lib/utils';

export interface ReceiptItem {
  id?: string | number;
  menu_item_id?: string;
  name: string;
  quantity: number;
  price?: number;
  specialInstructions?: string | null;
  special_instructions?: string | null;
}

export interface ReceiptOrder {
  id: string | number;
  orderNumber?: string;
  order_number?: string;
  customerName?: string;
  customer_name?: string;
  customerPhone?: string;
  customer_phone?: string;
  orderType?: string;
  order_type?: string;
  items: (ReceiptItem | any)[];
  subtotal?: number;
  deliveryFee?: number;
  delivery_fee?: number;
  deliveryAddress?: string | null;
  delivery_address?: string | null;
  total?: number;
  createdAt?: string;
  created_at?: string;
  specialInstructions?: string | null;
  special_instructions?: string | null;
}

export interface ThermalReceiptProps {
  order: ReceiptOrder | any;
  className?: string;
}

function formatUZS(amount: number) {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' UZS';
}

export const ThermalReceipt = React.forwardRef<HTMLDivElement, ThermalReceiptProps>(
  ({ order, className }, ref) => {
    if (!order) return null;

    const orderNumber = order.orderNumber || order.order_number || String(order.id || '');
    const customerName = order.customerName || order.customer_name || 'Guest';
    const customerPhone = order.customerPhone || order.customer_phone;
    const orderType = (order.orderType || order.order_type || '').toUpperCase();
    const deliveryAddress = order.deliveryAddress || order.delivery_address;
    const specialInstructions = order.specialInstructions || order.special_instructions;

    const createdAt = order.createdAt || order.created_at;
    let formattedDate = 'N/A';
    if (createdAt) {
      try {
        const d = new Date(createdAt);
        formattedDate = isNaN(d.getTime())
          ? String(createdAt)
          : d.toLocaleString('en-US', {
              hour12: false,
              timeZone: 'Asia/Tashkent',
            });
      } catch {
        formattedDate = String(createdAt);
      }
    }

    const deliveryFee = order.deliveryFee ?? order.delivery_fee ?? 0;
    const subtotal = order.subtotal ?? (order.total != null ? order.total - deliveryFee : 0);
    const total = order.total ?? (subtotal + deliveryFee);

    return (
      <div 
        ref={ref} 
        className={cn(
          "bg-white text-black font-mono p-4 mx-auto w-full max-w-[315px] sm:max-w-[80mm] text-sm",
          "print:w-[80mm] print:m-0 print:p-0 print:block print:absolute print:left-0 print:top-0 print:h-auto",
          className
        )}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #thermal-receipt, #thermal-receipt * {
              visibility: visible;
            }
            #thermal-receipt {
              position: absolute;
              left: 0;
              top: 0;
            }
          }
        ` }} />
        <div id="thermal-receipt" className="flex flex-col w-full bg-white print:bg-white print:w-[80mm]">
          <div className="text-center font-bold mb-2">
            <div>PLATELY WORKSHOP</div>
            <div>Tashkent Palace</div>
          </div>
          
          <div className="mb-2 text-center text-xs">
            ================================
          </div>
          
          <div className="flex justify-between mb-1">
            <span>Order #:</span>
            <span className="font-bold">{orderNumber}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Date:</span>
            <span>{formattedDate}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Type:</span>
            <span>{orderType}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Customer:</span>
            <span>{customerName}</span>
          </div>
          {customerPhone && (
            <div className="flex justify-between mb-1">
              <span>Phone:</span>
              <span>{customerPhone}</span>
            </div>
          )}
          {deliveryAddress && (
            <div className="flex justify-between mb-1">
              <span>Address:</span>
              <span>{deliveryAddress}</span>
            </div>
          )}
          
          <div className="my-2 text-center text-xs">
            ================================
          </div>
          
          <div className="flex flex-col gap-2 mb-2">
            {order.items?.map((item: any, idx: number) => {
              const itemId = item.id || item.menu_item_id || idx;
              const itemSpecial = item.specialInstructions || item.special_instructions;
              const hasPrice = typeof item.price === 'number';
              return (
                <div key={itemId} className="flex flex-col">
                  <div className="flex justify-between">
                    <span>{item.quantity}x {item.name}</span>
                    <span>{hasPrice ? formatUZS(item.price * item.quantity) : ''}</span>
                  </div>
                  {itemSpecial && (
                    <div className="pl-4 uppercase font-bold text-xs mt-1">
                      *** {itemSpecial} ***
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {specialInstructions && (
            <div className="text-xs italic mb-2">
              Note: {specialInstructions}
            </div>
          )}

          <div className="my-2 text-center text-xs">
            ================================
          </div>
          
          <div className="flex justify-between mb-1">
            <span>Subtotal:</span>
            <span>{formatUZS(subtotal || 0)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Delivery:</span>
            <span>{formatUZS(deliveryFee || 0)}</span>
          </div>
          <div className="flex justify-between font-bold text-base mt-2">
            <span>TOTAL:</span>
            <span>{formatUZS(total || 0)}</span>
          </div>
          
          <div className="mt-6 mb-2 text-center text-xs">
            ================================
          </div>
          <div className="text-center mt-2">
            <div className="text-xs mb-1">PICKUP CODE</div>
            <div className="text-3xl font-bold tracking-widest">
              {orderNumber?.slice(-4) || '0000'}
            </div>
          </div>
          <div className="text-center text-xs mt-6 mb-2 pb-8">
            Thank you for choosing Plately!
          </div>
        </div>
      </div>
    );
  }
);
ThermalReceipt.displayName = 'ThermalReceipt';
