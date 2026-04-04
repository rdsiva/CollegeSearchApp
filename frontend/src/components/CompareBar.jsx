import { X, GitCompare, Trash2 } from 'lucide-react';
import { useCompare } from '../context/CompareContext';

export default function CompareBar() {
  const { compareList, removeFromCompare, clearCompare, setShowModal, MAX } = useCompare();

  if (compareList.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 px-4 py-3 flex items-center gap-3 flex-wrap max-w-3xl">
        {/* Label */}
        <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
          Compare ({compareList.length}/{MAX}):
        </span>

        {/* College chips */}
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {compareList.map((c) => (
            <div
              key={c.code}
              className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs text-blue-800 font-medium"
            >
              <span className="max-w-36 truncate">{c.name.split(' ').slice(0, 3).join(' ')}</span>
              <button
                onClick={() => removeFromCompare(c.code)}
                className="w-4 h-4 rounded-full hover:bg-blue-200 flex items-center justify-center transition-colors"
              >
                <X size={10} />
              </button>
            </div>
          ))}

          {/* Empty slot indicators */}
          {Array.from({ length: MAX - compareList.length }).map((_, i) => (
            <div
              key={i}
              className="w-24 h-6 border border-dashed border-gray-300 rounded-full bg-gray-50"
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={clearCompare}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Clear all"
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            disabled={compareList.length < 2}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <GitCompare size={13} />
            Compare Now
          </button>
        </div>
      </div>
    </div>
  );
}
