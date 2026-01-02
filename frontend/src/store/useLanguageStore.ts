import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, Language, TranslationKeys } from '../i18n/translations';

interface LanguageState {
  language: Language;
  t: TranslationKeys;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'uz',
      t: translations.uz,
      setLanguage: (lang) => set({
        language: lang,
        t: translations[lang],
      }),
    }),
    {
      name: 'dehqonjon-language',
      partialize: (state) => ({ language: state.language }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.t = translations[state.language];
        }
      },
    }
  )
);
