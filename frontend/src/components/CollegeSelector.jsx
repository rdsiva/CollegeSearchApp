import { useState } from 'react';
import { MapPin, BookOpen, CheckSquare, Square, ChevronRight, ChevronLeft, Loader2, AlertTriangle } from 'lucide-react';

const MAX_RESEARCH = 5;

// Compute page size from viewport height: each row ~72px, overhead ~240px
function getPageSize() {
  return Math.max(5, Math.min(20, Math.floor((window.innerHeight - 240) / 72)));
}

export default function CollegeSelector({ matches, onResearch, loading }) {
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(0);

  const PAGE_SIZE = getPageSize();
  const totalPages = Math.ceil(matches.length / PAGE_SIZE);
  const visible = matches.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function toggle(code) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === matches.length) setSelected(new Set());
    else setSelected(new Set(matches.map((m) => m.code)));
  }

  function handleResearch() {
    if (selected.size === 0) return;
    const codes = [...selected].slice(0, MAX_RESEARCH);
    onResearch(codes);
  }

  const allSelected = selected.size === matches.length && matches.length > 0;
  const overLimit = selected.size > MAX_RESEARCH;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-700">
          {matches.length} college{matches.length !== 1 ? 's' : ''} found
          {totalPages > 1 && (
            <span className="text-gray-400 font-normal ml-1">
              · page {page + 1} of {totalPages}
            </span>
          )}
        </span>
        <button
          onClick={toggleAll}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          {allSelected ? <CheckSquare size={14} /> : <Square size={14} />}
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>

      {/* College list */}
      <div className="divide-y divide-gray-50">
        {visible.map((college) => {
          const isChecked = selected.has(college.code);
          return (
            <button
              key={college.code}
              onClick={() => toggle(college.code)}
              className={`w-full flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left ${
                isChecked ? 'bg-blue-50' : ''
              }`}
            >
              <div className="mt-0.5 flex-shrink-0 text-blue-600">
                {isChecked ? <CheckSquare size={18} /> : <Square size={18} className="text-gray-300" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-gray-900">{college.name}</span>
                  {college.nirf_rank != null && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold border border-blue-200">
                      NIRF #{college.nirf_rank}
                    </span>
                  )}
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono">
                    {college.code}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin size={11} /> {college.city}, {college.district}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span>{college.affiliation}</span>
                </div>
                {college.courses.length > 0 && (
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    <BookOpen size={11} className="text-gray-400" />
                    {college.courses.slice(0, 3).map((c) => (
                      <span key={c} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                        {c.replace('Computer Science and Engineering', 'CSE')
                          .replace('Information Technology', 'IT')
                          .replace('Artificial Intelligence and Data Science', 'AI & DS')
                          .replace('Electronics and Communication Engineering', 'ECE')
                          .replace('Cyber Security', 'CY')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={13} /> Prev
          </button>
          <span className="text-xs text-gray-500 tabular-nums">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, matches.length)} of {matches.length}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <ChevronRight size={13} />
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 flex-wrap gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-gray-500">
            {selected.size > 0 ? `${selected.size} selected` : 'Select colleges above'}
          </span>
          {overLimit && (
            <span className="flex items-center gap-1 text-xs text-amber-600">
              <AlertTriangle size={12} />
              Only {MAX_RESEARCH} will be researched at a time
            </span>
          )}
        </div>
        <button
          onClick={handleResearch}
          disabled={selected.size === 0 || loading}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Researching...
            </>
          ) : (
            <>
              Research {overLimit ? `top ${MAX_RESEARCH}` : selected.size > 0 ? `(${selected.size})` : ''} <ChevronRight size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
