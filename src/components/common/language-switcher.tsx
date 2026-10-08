"use client";

import { useState } from 'react';
import { useLanguageStore } from '@/stores/language-store';
import { SUPPORTED_LANGUAGES, type Language } from '@/lib/i18n/types';
import { ChevronDown, Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentOption = SUPPORTED_LANGUAGES.find((opt) => opt.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#161b22] border border-[rgba(255,255,255,0.08)] text-gray-300 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-all text-xs font-medium"
      >
        <span className="text-sm">{currentOption.flag}</span>
        <span className="uppercase font-mono">{currentOption.code}</span>
        <ChevronDown className="w-3 h-3 text-gray-500" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1.5 w-36 bg-[#161b22] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-2xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            {SUPPORTED_LANGUAGES.map((opt) => (
              <button
                key={opt.code}
                onClick={() => {
                  setLanguage(opt.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors text-left ${
                  language === opt.code
                    ? 'bg-[#f98b25]/15 text-[#f98b25] font-semibold'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-sm">{opt.flag}</span>
                <span>{opt.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
