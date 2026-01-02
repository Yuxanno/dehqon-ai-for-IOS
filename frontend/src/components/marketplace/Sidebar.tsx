import { useState } from 'react';
import CategoryFilter from './CategoryFilter';

export default function Sidebar() {
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');

  return (
    <aside className="sidebar-filters">
      <div className="bg-white rounded-2xl p-5 shadow-sm sticky top-24">
        <h3 className="font-semibold text-earth-900 mb-4">Категории</h3>
        <CategoryFilter variant="vertical" />

        <hr className="my-5 border-earth-200" />

        <h3 className="font-semibold text-earth-900 mb-4">Narx, so'm</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="От"
            value={priceFrom}
            onChange={(e) => setPriceFrom(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-earth-200 text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <input
            type="number"
            placeholder="До"
            value={priceTo}
            onChange={(e) => setPriceTo(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-earth-200 text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <hr className="my-5 border-earth-200" />

        <h3 className="font-semibold text-earth-900 mb-4">Регион</h3>
        <select className="w-full px-3 py-2 rounded-lg border border-earth-200 text-sm
                          focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
          <option value="">Все регионы</option>
          <option value="krasnodar">Краснодарский край</option>
          <option value="rostov">Ростовская область</option>
          <option value="stavropol">Ставропольский край</option>
          <option value="voronezh">Воронежская область</option>
        </select>

        <button className="w-full mt-5 py-2.5 bg-primary-500 text-white font-medium rounded-xl
                          hover:bg-primary-600 transition-colors">
          Применить
        </button>

        <button className="w-full mt-2 py-2.5 text-earth-600 font-medium rounded-xl
                          hover:bg-earth-100 transition-colors">
          Сбросить
        </button>
      </div>
    </aside>
  );
}
