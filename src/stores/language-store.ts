import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '@/lib/i18n/types';
import { TRANSLATIONS } from '@/lib/i18n/translations';

interface LanguageStore {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, defaultVal?: string) => string;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: 'uz', // Default to Uzbek for Tashkent beachhead

      setLanguage: (language) => set({ language }),

      t: (key, defaultVal) => {
        const lang = get().language;
        const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
        return dict[key] || defaultVal || key;
      },
    }),
    {
      name: 'plately-workshop-language',
    }
  )
);
