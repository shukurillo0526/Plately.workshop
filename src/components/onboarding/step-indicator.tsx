import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  steps: { label: string }[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        {/* Background Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[rgba(255,255,255,0.08)] -z-10 -translate-y-1/2" />
        
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isFuture = index > currentStep;
          
          return (
            <div key={step.label} className="flex flex-col items-center relative z-10">
              <div 
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300",
                  isCompleted ? "bg-[#34d399] border-[#34d399] text-black" :
                  isCurrent ? "bg-[#0D1117] border-[#f98b25] text-[#f98b25]" :
                  "bg-[#0D1117] border-[rgba(255,255,255,0.15)] text-gray-500"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
                
                {isCurrent && (
                  <span className="absolute w-10 h-10 rounded-full border border-[#f98b25] animate-ping opacity-30" />
                )}
              </div>
              <span 
                className={cn(
                  "absolute -bottom-6 text-xs font-medium whitespace-nowrap transition-colors duration-300",
                  isCompleted ? "text-[#34d399]" :
                  isCurrent ? "text-[#f98b25]" :
                  "text-gray-500"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
