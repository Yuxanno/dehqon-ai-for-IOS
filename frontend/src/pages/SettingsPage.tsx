import { ArrowLeft, Globe, HelpCircle, Info, MapPin, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '../store/useLanguageStore';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import LocationSelector from '../components/common/LocationSelector';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { t, language } = useLanguageStore();

  const settingsItems = [
    { 
      icon: MapPin, 
      label: language === 'uz' ? 'Joylashuv' : 'Местоположение', 
      component: <LocationSelector /> 
    },
    { 
      icon: Globe, 
      label: t.profile.language, 
      component: <LanguageSwitcher /> 
    },
    { 
      icon: HelpCircle, 
      label: language === 'uz' ? 'Yordam' : 'Помощь',
      href: '/help'
    },
    { 
      icon: Info, 
      label: language === 'uz' ? 'Ilova haqida' : 'О приложении',
      value: 'v1.0.0'
    },
  ];

  return (
    <div className="min-h-screen bg-earth-50 pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-earth-100 sticky top-0 z-10">
        <div className="container-app py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-earth-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-earth-600" />
          </button>
          <h1 className="text-lg font-semibold text-earth-900">{t.profile.settings}</h1>
        </div>
      </div>

      <div className="container-app py-6">
        <div className="bg-white rounded-xl overflow-hidden">
          {settingsItems.map((item, index) => {
            const content = (
              <>
                <div className="w-10 h-10 rounded-full bg-earth-100 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-earth-600" />
                </div>
                <span className="flex-1 font-medium text-earth-900">{item.label}</span>
                {item.component ? (
                  item.component
                ) : item.value ? (
                  <span className="text-earth-500 text-sm">{item.value}</span>
                ) : item.href ? (
                  <ChevronRight className="w-5 h-5 text-earth-400" />
                ) : null}
              </>
            );

            if (item.href) {
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.href!)}
                  className={`w-full flex items-center gap-4 px-4 py-4 hover:bg-earth-50 transition-colors ${
                    index !== settingsItems.length - 1 ? 'border-b border-earth-100' : ''
                  }`}
                >
                  {content}
                </button>
              );
            }

            return (
              <div
                key={item.label}
                className={`flex items-center gap-4 px-4 py-4 ${
                  index !== settingsItems.length - 1 ? 'border-b border-earth-100' : ''
                }`}
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
