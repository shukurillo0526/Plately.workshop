import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background pattern/gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#1c2333]/50 via-[#0D1117] to-[#0D1117] -z-10" />
      
      <div className="mb-8 flex flex-col items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#f98b25] to-[#d67215] flex items-center justify-center shadow-lg shadow-orange-500/20">
            <span className="text-white font-bold text-2xl font-[family-name:var(--font-display)]">P</span>
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] text-white tracking-tight leading-none">
              Plately
            </h1>
            <span className="text-[#f98b25] text-xs font-bold tracking-widest uppercase mt-1">
              WORKSHOP
            </span>
          </div>
        </div>
      </div>
      
      <div className="w-full max-w-md z-10">
        {children}
      </div>
    </div>
  );
}
