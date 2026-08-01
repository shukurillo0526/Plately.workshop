"use client";

import React from 'react';
import { Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ThermalReceipt } from './thermal-receipt';

export interface PrintReceiptDialogProps {
  order: any | null; // Accepting Order | KDSOrder
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrintReceiptDialog({ order, open, onOpenChange }: PrintReceiptDialogProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[#0D1117] text-white border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center text-white">
            <span>Order Receipt - {order?.orderNumber}</span>
          </DialogTitle>
        </DialogHeader>
        
        {order && (
          <div className="flex justify-center max-h-[60vh] overflow-y-auto bg-zinc-900 p-4 rounded-md my-4 border border-zinc-800">
            <ThermalReceipt order={order} />
          </div>
        )}
        
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="text-black border-zinc-700 hover:bg-zinc-200"
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePrint} 
            className="bg-[#f98b25] hover:bg-[#e07d20] text-white"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
