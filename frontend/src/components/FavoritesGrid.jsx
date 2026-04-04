import { useState } from 'react';
import { Trash2, Download, FileText, Printer, Star, ChevronDown, ChevronUp, GitCompare } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { useCompare } from '../context/CompareContext';
import { exportCsv, exportWord } from '../api/client';

const CATEGORIES = ['OC', 'BC', 'BCM', 'MBC', 'SC', 'ST', 'SCA'];

function getCutoff(college, category) {
  if (!college.courses || college.courses.length === 0) return '-';
  const vals = college.courses
    .map((c) => c.cutoffs?.[category])
    .filter((v) => v != null);
  if (vals.length === 0) return '-';
  // Show range if multiple branches, else single value
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  return min === max ? min.toFixed(2) : `${min.toFixed(2)}–${max.toFixed(2)}`;
}

export default function FavoritesGrid({ onViewDetails }) {
  const { favorites, removeFromFavorites, clearFavorites } = useSession();
  const { addToCompare, removeFromCompare, isInCompare, isFull, setShowModal } = useCompare();
  const [expandCutoffs, setExpandCutoffs] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  function handlePrint() {
    window.print();
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Star size={16} className="text-yellow-500 fill-yellow-400" />
          <span className="font-semibold text-sm text-gray-700">
            Favorites ({favorites.length})
          </span>
        </div>
        <div className="flex gap-2 flex-wrap no-print">
          <button
            onClick={() => setExpandCutoffs((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cutoffs {expandCutoffs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <Download size={12} /> CSV
          </button>
          <button
            onClick={handleExportWord}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <FileText size={12} /> Word
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Printer size={12} /> Print
          </button>
          <button
            onClick={clearFavorites}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            Clear all
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-left">
              <th className="px-3 py-3 font-semibold no-print">
                <GitCompare size={13} className="inline" />
              </th>
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">Code</th>
              <th className="px-4 py-3 font-semibold min-w-56">College Name</th>
              <th className="px-4 py-3 font-semibold">District</th>
              <th className="px-4 py-3 font-semibold">Affiliation</th>
              <th className="px-4 py-3 font-semibold">NIRF</th>
              <th className="px-4 py-3 font-semibold">TNEA Fees</th>
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
              <tr key={college.code} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-3 no-print">
                  <input
                    type="checkbox"
                    checked={isInCompare(college.code)}
                    disabled={!isInCompare(college.code) && isFull()}
                    onChange={() => isInCompare(college.code)
                      ? removeFromCompare(college.code)
                      : addToCompare(college)}
                    title={isFull() && !isInCompare(college.code) ? 'Max 5 colleges' : 'Add to compare'}
                    className="w-3.5 h-3.5 rounded accent-purple-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                  />
                </td>
                <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                <td className="px-4 py-3 font-mono text-gray-600">{college.anna_university_code}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onViewDetails?.(college)}
                    className="text-blue-700 hover:text-blue-900 font-medium text-left hover:underline"
                  >
                    {college.name}
                  </button>
                </td>
                <td className="px-4 py-3 text-gray-600">{college.district}</td>
                <td className="px-4 py-3 text-gray-500">{college.affiliation}</td>
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
                      'bg-red-100 text-red-600'
                    }`}>
                      {college.score.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 no-print">
                  <button
                    onClick={() => removeFromFavorites(college.code)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    title="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
