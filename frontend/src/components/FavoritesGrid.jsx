import { useState, useRef } from 'react';
import { Trash2, Download, FileText, Printer, Star, ChevronDown, ChevronUp, GitCompare, GripVertical, Pencil, X, Check } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { useCompare } from '../context/CompareContext';
import { exportCsv, exportWord } from '../api/client';

const CATEGORIES = ['OC', 'BC', 'BCM', 'MBC', 'SC', 'ST', 'SCA'];

function getCutoff(college, category) {
  const courses = college.selectedCourses
    ? college.courses?.filter((c) => college.selectedCourses.includes(c.branch_name))
    : college.courses;
  if (!courses || courses.length === 0) return '-';
  const vals = courses.map((c) => c.cutoffs?.[category]).filter((v) => v != null);
  if (vals.length === 0) return '-';
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  return min === max ? min.toFixed(2) : `${min.toFixed(2)}–${max.toFixed(2)}`;
}

function BranchEditModal({ college, onSave, onClose }) {
  const allBranches = college.courses?.map((c) => c.branch_name) ?? [];
  const initial = college.selectedCourses
    ? new Set(college.selectedCourses)
    : new Set(allBranches);
  const [selection, setSelection] = useState(initial);

  const toggle = (name) =>
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const handleSave = () => {
    const allSelected = selection.size === allBranches.length;
    onSave(allSelected ? undefined : Array.from(selection));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">Edit branches</h3>
            <p className="text-xs text-gray-500 mt-0.5">{college.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-3 border-b border-gray-100">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selection.size === allBranches.length}
              onChange={() =>
                selection.size === allBranches.length
                  ? setSelection(new Set())
                  : setSelection(new Set(allBranches))
              }
              className="accent-blue-600"
            />
            <span className="text-sm font-semibold text-gray-800">All Branches</span>
          </label>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-0.5">
          {allBranches.map((name) => (
            <label key={name} className="flex items-center gap-2 cursor-pointer py-1.5 hover:bg-gray-50 rounded px-1">
              <input
                type="checkbox"
                checked={selection.has(name)}
                onChange={() => toggle(name)}
                className="accent-blue-600"
              />
              <span className="text-sm text-gray-800">{name}</span>
            </label>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={selection.size === 0}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40"
          >
            Save ({selection.size})
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FavoritesGrid({ onViewDetails }) {
  const { favorites, removeFromFavorites, clearFavorites, reorderFavorites, updateFavoritesCourses } = useSession();
  const { addToCompare, removeFromCompare, isInCompare, isFull } = useCompare();
  const [expandCutoffs, setExpandCutoffs] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const dragIndex = useRef(null);
  const dragOverIndex = useRef(null);

  if (favorites.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center">
        <Star className="mx-auto mb-3 text-gray-300" size={32} />
        <p className="text-gray-500 text-sm">No colleges added yet.</p>
        <p className="text-gray-400 text-xs mt-1">Search and click "Add to Favorites" to build your list.</p>
      </div>
    );
  }

  async function handleExportCsv() {
    setExporting(true);
    try { await exportCsv(favorites); } finally { setExporting(false); }
  }

  async function handleExportWord() {
    setExporting(true);
    try { await exportWord(favorites); } finally { setExporting(false); }
  }

  const editingCollege = editingCode ? favorites.find((f) => f.code === editingCode) : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Star size={16} className="text-yellow-500 fill-yellow-400" />
          <span className="font-semibold text-sm text-gray-700">Favorites ({favorites.length})</span>
          <span className="text-xs text-gray-400 ml-1">· drag <GripVertical size={11} className="inline" /> to reorder</span>
        </div>
        <div className="flex gap-2 flex-wrap no-print">
          <button onClick={() => setExpandCutoffs((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Cutoffs {expandCutoffs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <button onClick={handleExportCsv} disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50">
            <Download size={12} /> CSV
          </button>
          <button onClick={handleExportWord} disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50">
            <FileText size={12} /> Word
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <Printer size={12} /> Print
          </button>
          <button onClick={clearFavorites}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
            Clear all
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-left">
              <th className="px-2 py-3 no-print w-6"></th>
              <th className="px-3 py-3 font-semibold no-print"><GitCompare size={13} className="inline" /></th>
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">Code</th>
              <th className="px-4 py-3 font-semibold min-w-48">College Name</th>
              <th className="px-4 py-3 font-semibold min-w-40">Branches</th>
              <th className="px-4 py-3 font-semibold">District</th>
              <th className="px-4 py-3 font-semibold">NIRF</th>
              <th className="px-4 py-3 font-semibold">Fees</th>
              <th className="px-4 py-3 font-semibold">Avg LPA</th>
              {expandCutoffs && CATEGORIES.map((cat) => (
                <th key={cat} className="px-3 py-3 font-semibold text-center">{cat}</th>
              ))}
              <th className="px-4 py-3 font-semibold text-center">Score</th>
              <th className="px-4 py-3 font-semibold no-print"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {favorites.map((college, idx) => (
              <tr
                key={college.code}
                className="hover:bg-blue-50/30 transition-colors"
                draggable
                onDragStart={() => { dragIndex.current = idx; }}
                onDragOver={(e) => { e.preventDefault(); dragOverIndex.current = idx; }}
                onDrop={() => {
                  if (dragIndex.current !== null && dragIndex.current !== dragOverIndex.current) {
                    reorderFavorites(dragIndex.current, dragOverIndex.current);
                  }
                  dragIndex.current = null;
                  dragOverIndex.current = null;
                }}
              >
                {/* Drag handle */}
                <td className="px-2 py-3 no-print cursor-grab text-gray-300 hover:text-gray-500">
                  <GripVertical size={14} />
                </td>
                {/* Compare checkbox */}
                <td className="px-3 py-3 no-print">
                  <input type="checkbox"
                    checked={isInCompare(college.code)}
                    disabled={!isInCompare(college.code) && isFull()}
                    onChange={() => isInCompare(college.code) ? removeFromCompare(college.code) : addToCompare(college)}
                    className="w-3.5 h-3.5 rounded accent-purple-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                  />
                </td>
                <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                <td className="px-4 py-3 font-mono text-gray-600">{college.anna_university_code}</td>
                <td className="px-4 py-3">
                  <button onClick={() => onViewDetails?.(college)}
                    className="text-blue-700 hover:text-blue-900 font-medium text-left hover:underline">
                    {college.name}
                  </button>
                </td>
                {/* Branches column */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {college.selectedCourses && college.selectedCourses.length > 0 ? (
                      <>
                        {college.selectedCourses.slice(0, 2).map((b) => (
                          <span key={b} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 max-w-[120px] truncate" title={b}>
                            {b.replace('Computer Science and Engineering', 'CSE')
                              .replace('Information Technology', 'IT')
                              .replace('Artificial Intelligence and Data Science', 'AI&DS')
                              .replace('Artificial Intelligence and Machine Learning', 'AIML')
                              .replace('Electronics and Communication Engineering', 'ECE')
                              .replace('Electrical and Electronics Engineering', 'EEE')
                              .replace('Mechanical Engineering', 'MECH')
                              .replace('Civil Engineering', 'CIVIL')}
                          </span>
                        ))}
                        {college.selectedCourses.length > 2 && (
                          <span className="text-xs text-gray-500">+{college.selectedCourses.length - 2}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 italic">All branches</span>
                    )}
                    <button
                      onClick={() => setEditingCode(college.code)}
                      className="ml-0.5 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit branches"
                    >
                      <Pencil size={11} />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{college.district}</td>
                <td className="px-4 py-3 text-center text-gray-600">
                  {college.nirf_rank ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {college.fees?.tnea ? `₹${college.fees.tnea.toLocaleString('en-IN')}` : '—'}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {college.placement?.avg_lpa ? `${college.placement.avg_lpa} LPA` : '—'}
                </td>
                {expandCutoffs && CATEGORIES.map((cat) => (
                  <td key={cat} className="px-3 py-3 text-center text-gray-600">
                    {getCutoff(college, cat)}
                  </td>
                ))}
                <td className="px-4 py-3 text-center">
                  {college.score != null ? (
                    <span className={`inline-block px-2 py-0.5 rounded-full font-semibold text-xs ${
                      college.score >= 75 ? 'bg-green-100 text-green-700' :
                      college.score >= 55 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-600'}`}>
                      {college.score.toFixed(1)}
                    </span>
                  ) : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 no-print">
                  <button onClick={() => removeFromFavorites(college.code)}
                    className="text-red-400 hover:text-red-600 transition-colors" title="Remove">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Branch edit modal */}
      {editingCollege && (
        <BranchEditModal
          college={editingCollege}
          onSave={(selectedCourses) => {
            updateFavoritesCourses(editingCollege.code, selectedCourses);
            setEditingCode(null);
          }}
          onClose={() => setEditingCode(null)}
        />
      )}
    </div>
  );
}
