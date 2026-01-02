import { useLanguageStore } from '../../store/useLanguageStore';

interface QuickActionsProps {
  onSelect: (action: string) => void;
}

export default function QuickActions({ onSelect }: QuickActionsProps) {
  const { language, t } = useLanguageStore();

  const QUICK_ACTIONS = language === 'uz' ? [
    { label: `🦠 ${t.ai.quickQuestions.diseases}`, query: 'O\'simlik kasalligini aniqlashga yordam bering' },
    { label: `🧪 ${t.ai.quickQuestions.fertilizers}`, query: 'Qaysi o\'g\'itlarni ishlatish kerak?' },
    { label: `🌱 ${t.ai.quickQuestions.planting}`, query: 'Qachon ekish yaxshiroq?' },
    { label: `🐛 ${t.ai.quickQuestions.pests}`, query: 'Zararkunandalar bilan qanday kurashish kerak?' },
  ] : [
    { label: `🦠 ${t.ai.quickQuestions.diseases}`, query: 'Помоги определить болезнь растения' },
    { label: `🧪 ${t.ai.quickQuestions.fertilizers}`, query: 'Какие удобрения использовать?' },
    { label: `🌱 ${t.ai.quickQuestions.planting}`, query: 'Когда лучше сажать?' },
    { label: `🐛 ${t.ai.quickQuestions.pests}`, query: 'Как бороться с вредителями?' },
  ];

  return (
    <div className="px-4 py-3">
      <p className="text-xs text-earth-500 mb-2">
        {language === 'uz' ? 'Tezkor savollar:' : 'Быстрые вопросы:'}
      </p>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => onSelect(action.query)}
            className="quick-action flex-shrink-0"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
