'use client';

import { useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { PilotRequestModal } from './pilot-request-modal';

interface SandboxBannerProps {
  isSandbox?: boolean;
}

export function SandboxBanner({ isSandbox = true }: SandboxBannerProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!isSandbox) return null;

  return (
    <>
      <div className="w-full bg-gradient-to-r from-[#1E2530] via-[#161B22] to-[#1E2530] border-b border-[rgba(249,139,37,0.2)] px-4 py-2 flex items-center justify-between text-xs shrink-0 select-none">
        <div className="flex items-center gap-2 text-gray-300">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#f98b25]/15 border border-[#f98b25]/30 text-[#f98b25] font-semibold text-[10px] tracking-wide uppercase">
            <Sparkles className="w-3 h-3" />
            Sandbox Mode
          </span>
          <span className="hidden sm:inline text-gray-400">
            Interactive evaluation environment with sample menu & KDS data.
          </span>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[rgba(249,139,37,0.12)] hover:bg-[rgba(249,139,37,0.22)] text-[#f98b25] font-medium transition-colors cursor-pointer text-xs"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Apply for Pilot</span>
          <ArrowRight className="w-3 h-3 ml-0.5" />
        </button>
      </div>

      <PilotRequestModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
