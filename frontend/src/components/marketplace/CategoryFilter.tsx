import { useAppStore } from '../../store/useAppStore';
import { CATEGORY_LABELS, CATEGORY_ICONS, type Category } from '../../types';
import clsx from 'clsx';

const categories: (Category | 'all')[] = ['all', 'seeds', 'fertilizers', 'equipment', 'services', 'animals'];

interface CategoryFilterProps {
  variant?: 'horizontal' | 'vertical';
}

export default function CategoryFilter({ variant = 'horizontal' }: CategoryFilterProps) {
  const { selectedCategory, setSelectedCategory } = useAppStore();

  if (variant === 'vertical') {
    return (
      <div className="space-y-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat === 'all' ? null : cat)}
            className={clsx(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors',
              (cat === 'all' && !selectedCategory) || selectedCategory === cat
                ? 'bg-primary-50 text-primary-700 font-medium'
                : 'text-earth-600 hover:bg-earth-100'
            )}
          >
            <span className="text-xl">{cat === 'all' ? '📋' : CATEGORY_ICONS[cat]}</span>
            <span>{cat === 'all' ? 'Все категории' : CATEGORY_LABELS[cat]}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setSelectedCategory(cat === 'all' ? null : cat)}
          className={clsx(
            'category-chip flex items-center gap-1.5',
            (cat === 'all' && !selectedCategory) || selectedCategory === cat
              ? 'category-chip-active'
              : ''
          )}
        >
          <span>{cat === 'all' ? '📋' : CATEGORY_ICONS[cat]}</span>
          <span>{cat === 'all' ? 'Все' : CATEGORY_LABELS[cat]}</span>
        </button>
      ))}
    </div>
  );
}
