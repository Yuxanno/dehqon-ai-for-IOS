import { Search, Mic } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function SearchBar() {
  const { searchQuery, setSearchQuery } = useAppStore();

  return (
    <div className="flex gap-2 md:gap-3">
      <div className="relative flex-1 search-bar">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск товаров..."
          className="w-full h-11 md:h-12 pl-12 pr-12 rounded-xl bg-white border border-earth-200 
                     text-earth-900 placeholder:text-earth-400
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                     text-base transition-shadow"
        />
        <button 
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-earth-400 
                     hover:text-primary-500 active:scale-95 transition-all"
          aria-label="Голосовой поиск"
        >
          <Mic className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
