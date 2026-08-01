import React from 'react';
import { cn } from '@/lib/utils';

export interface ReceiptItem {
  id: string | number;
  name: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

export interface ReceiptOrder {
  id: string | number;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  orderType: string;
  items: ReceiptItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
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
            <span className="font-bold">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Date:</span>
            <span>
              {new Date(order.createdAt).toLocaleString('en-US', { 
                hour12: false, 
                timeZone: 'Asia/Tashkent' 
              })}
            </span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Type:</span>
            <span>{order.orderType}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Customer:</span>
            <span>{order.customerName}</span>
          </div>
          {order.customerPhone && (
            <div className="flex justify-between mb-1">
              <span>Phone:</span>
              <span>{order.customerPhone}</span>
            </div>
          )}
          
          <div className="my-2 text-center text-xs">
            ================================
          </div>
          
          <div className="flex flex-col gap-2 mb-2">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex flex-col">
                <div className="flex justify-between">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{formatUZS(item.price * item.quantity)}</span>
                </div>
                {item.specialInstructions && (
                  <div className="pl-4 uppercase font-bold text-xs mt-1">
                    *** {item.specialInstructions} ***
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="my-2 text-center text-xs">
            ================================
          </div>
          
          <div className="flex justify-between mb-1">
            <span>Subtotal:</span>
            <span>{formatUZS(order.subtotal || 0)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Delivery:</span>
            <span>{formatUZS(order.deliveryFee || 0)}</span>
          </div>
          <div className="flex justify-between font-bold text-base mt-2">
            <span>TOTAL:</span>
            <span>{formatUZS(order.total || 0)}</span>
          </div>
          
          <div className="mt-6 mb-2 text-center text-xs">
            ================================
          </div>
          <div className="text-center mt-2">
            <div className="text-xs mb-1">PICKUP CODE</div>
            <div className="text-3xl font-bold tracking-widest">
              {order.orderNumber?.slice(-4) || '0000'}
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
