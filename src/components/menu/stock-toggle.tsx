"use client";

import { cn } from "@/lib/utils";

interface StockToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function StockToggle({ checked, onChange, disabled, size = "md", className }: StockToggleProps) {
  const isSm = size === "sm";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f98b25] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1117]",
        isSm ? "h-5 w-9" : "h-6 w-11",
        checked ? "bg-emerald-500" : "bg-gray-600",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-block rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out transform",
          isSm ? "h-4 w-4" : "h-5 w-5",
          checked ? (isSm ? "translate-x-4" : "translate-x-5") : "translate-x-0"
        )}
      />
    </button>
  );
}
