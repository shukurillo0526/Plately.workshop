'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ElapsedTimerProps {
  startTime: string | Date;
  urgentAfterMs?: number; // default 180000 (3 min)
  className?: string;
  onUrgent?: (isUrgent: boolean) => void;
}

export function ElapsedTimer({ startTime, urgentAfterMs = 180000, className, onUrgent }: ElapsedTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const lastUrgentRef = useRef<boolean | null>(null);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    
    const tick = () => {
      setElapsed(Date.now() - start);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const isUrgent = elapsed > urgentAfterMs;
  
  useEffect(() => {
    if (lastUrgentRef.current !== isUrgent) {
      lastUrgentRef.current = isUrgent;
      onUrgent?.(isUrgent);
    }
  }, [isUrgent, onUrgent]);
  
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  
  const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className={cn(
      "font-mono text-sm font-medium transition-colors min-w-[48px] text-right",
      isUrgent ? "text-red-500 animate-pulse" : "text-gray-400",
      className
    )}>
      {formatted}
    </div>
  );
}
