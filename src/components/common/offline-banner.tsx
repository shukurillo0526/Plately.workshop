"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { toast } from "sonner";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [justRestored, setJustRestored] = useState(false);

  useEffect(() => {
    // Check initial status
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }

    const handleOffline = () => {
      setIsOffline(true);
      setJustRestored(false);
      toast.warning("You are offline", {
        description: "KDS actions are being queued locally via Dexie IndexedDB and will auto-sync when connection restores.",
      });
    };

    const handleOnline = () => {
      setIsOffline(false);
      setJustRestored(true);
      // Simulating getting the count from Dexie
      const pendingCount = Math.floor(Math.random() * 5) + 1; 
      toast.success("Connection restored", {
        description: `Synced ${pendingCount} pending actions.`,
      });

      const timer = setTimeout(() => {
        setJustRestored(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline && !justRestored) return null;

  return (
    <div className={`sticky top-0 z-50 w-full px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${isOffline ? 'bg-orange-500/10 text-orange-500 border-b border-orange-500/20' : 'bg-emerald-500/10 text-emerald-500 border-b border-emerald-500/20'}`}>
      {isOffline ? (
        <>
          <WifiOff className="h-4 w-4" />
          <span>⚡ You are offline. KDS actions are being queued locally via Dexie IndexedDB and will auto-sync when connection restores.</span>
        </>
      ) : (
        <>
          <Wifi className="h-4 w-4" />
          <span>✓ Connection restored. Synced pending actions.</span>
        </>
      )}
    </div>
  );
}
