import { useLanguageStore } from '../../store/useLanguageStore';
import { Language } from '../../i18n/translations';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguageStore();

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  ];

  return (
    <div className="flex gap-2">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            language === lang.code
              ? 'bg-primary-100 text-primary-700'
              : 'bg-earth-100 text-earth-600 hover:bg-earth-200'
          }`}
        >
          <span>{lang.flag}</span>
          <span>{lang.label}</span>
        </button>
      ))}
    </div>
  );
}
