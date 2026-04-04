import { X, Star, TrendingUp, DollarSign, Award, MapPin, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useCompare } from '../context/CompareContext';

const CATEGORIES = ['OC', 'BC', 'MBC', 'SC'];

function Cell({ value, highlight }) {
  return (
    <td className={`px-4 py-3 text-center text-sm ${highlight ? 'font-bold text-green-700 bg-green-50' : 'text-gray-700'}`}>
      {value ?? <span className="text-gray-300">—</span>}
    </td>
  );
}

function RowLabel({ icon: Icon, label }) {
  return (
    <td className="px-4 py-3 text-xs font-semibold text-gray-500 bg-gray-50 whitespace-nowrap sticky left-0 z-10">
      <span className="flex items-center gap-1.5">
        {Icon && <Icon size={12} />} {label}
      </span>
    </td>
  );
}

function getBestIdx(colleges, fn, higher = true) {
  const vals = colleges.map(fn);
  const valid = vals.filter((v) => v != null);
  if (!valid.length) return -1;
  const best = higher ? Math.max(...valid) : Math.min(...valid);
  return vals.indexOf(best);
}

export default function CompareModal() {
  const { compareList, showModal, setShowModal, removeFromCompare } = useCompare();
  if (!showModal) return null;

  const cols = compareList;
  const n = cols.length;

  const bestScore   = getBestIdx(cols, (c) => c.score);
  const bestAvgLpa  = getBestIdx(cols, (c) => c.placement?.avg_lpa);
  const lowestFees  = getBestIdx(cols, (c) => c.fees?.tnea, false);
  const bestRating  = getBestIdx(cols, (c) => c.reviews?.google_rating);
  const bestNirf    = getBestIdx(cols, (c) => c.nirf_rank, false); // lower is better

  // Shared branches across all selected colleges
  const allBranches = [...new Set(
    cols.flatMap((c) => (c.courses || []).map((br) => br.branch_code))
  )].slice(0, 8);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            College Comparison
            <span className="text-xs font-normal text-gray-400">({n} colleges)</span>
          </h2>
          <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable table */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-xs border-collapse">
            {/* College headers */}
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium bg-gray-50 sticky left-0 z-20 min-w-32">
                  Criteria
                </th>
                {cols.map((c, i) => (
                  <th key={c.code} className="px-4 py-3 text-center min-w-44">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-gray-900 text-sm leading-tight">{c.name}</span>
                        <button
                          onClick={() => removeFromCompare(c.code)}
                          className="p-0.5 text-gray-300 hover:text-red-400 transition-colors"
                          title="Remove from compare"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <span className="font-mono text-gray-400 text-xs">{c.anna_university_code}</span>
                      <span className="text-gray-500 text-xs flex items-center gap-1">
                        <MapPin size={10} /> {c.city}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {/* Overall Score */}
              <tr>
                <RowLabel icon={Award} label="Overall Score" />
                {cols.map((c, i) => (
                  <Cell key={c.code}
                    value={c.score != null ? `${c.score.toFixed(1)}/100` : null}
                    highlight={i === bestScore}
                  />
                ))}
              </tr>

              {/* Affiliation */}
              <tr className="bg-gray-50/50">
                <RowLabel label="Affiliation" />
                {cols.map((c) => (
                  <td key={c.code} className="px-4 py-3 text-center text-xs text-gray-600">
                    {c.affiliation}
                  </td>
                ))}
              </tr>

              {/* NIRF Rank */}
              <tr>
                <RowLabel icon={Award} label="NIRF Rank" />
                {cols.map((c, i) => (
                  <Cell key={c.code}
                    value={c.nirf_rank ? `#${c.nirf_rank}` : null}
                    highlight={i === bestNirf}
                  />
                ))}
              </tr>

              {/* Google Rating */}
              <tr className="bg-gray-50/50">
                <RowLabel icon={Star} label="Google Rating" />
                {cols.map((c, i) => (
                  <Cell key={c.code}
                    value={c.reviews?.google_rating ? `${c.reviews.google_rating}/5` : null}
                    highlight={i === bestRating}
                  />
                ))}
              </tr>

              {/* ── FEES ── */}
              <tr>
                <td colSpan={n + 1} className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wide bg-blue-50">
                  Fees
                </td>
              </tr>
              <tr>
                <RowLabel icon={DollarSign} label="TNEA Fees/yr" />
                {cols.map((c, i) => (
                  <Cell key={c.code}
                    value={c.fees?.tnea ? `₹${c.fees.tnea.toLocaleString('en-IN')}` : null}
                    highlight={i === lowestFees}
                  />
                ))}
              </tr>
              <tr className="bg-gray-50/50">
                <RowLabel label="Mgmt Fees/yr" />
                {cols.map((c) => (
                  <Cell key={c.code}
                    value={c.fees?.management ? `₹${c.fees.management.toLocaleString('en-IN')}` : null}
                  />
                ))}
              </tr>

              {/* ── PLACEMENTS ── */}
              <tr>
                <td colSpan={n + 1} className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wide bg-green-50">
                  Placements
                </td>
              </tr>
              <tr>
                <RowLabel icon={TrendingUp} label="Avg Package" />
                {cols.map((c, i) => (
                  <Cell key={c.code}
                    value={c.placement?.avg_lpa ? `${c.placement.avg_lpa} LPA` : null}
                    highlight={i === bestAvgLpa}
                  />
                ))}
              </tr>
              <tr className="bg-gray-50/50">
                <RowLabel label="Highest Package" />
                {cols.map((c) => (
                  <Cell key={c.code}
                    value={c.placement?.highest_lpa ? `${c.placement.highest_lpa} LPA` : null}
                  />
                ))}
              </tr>
              <tr>
                <RowLabel label="Placement %" />
                {cols.map((c) => (
                  <Cell key={c.code}
                    value={c.placement?.placement_percentage ? `${c.placement.placement_percentage}%` : null}
                  />
                ))}
              </tr>

              {/* ── CUTOFFS 2026 PREDICTED ── */}
              {allBranches.length > 0 && (
                <>
                  <tr>
                    <td colSpan={n + 1} className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wide bg-purple-50">
                      2026 Predicted Cutoffs (OC)
                    </td>
                  </tr>
                  {allBranches.map((brCode) => (
                    <tr key={brCode} className="bg-gray-50/30">
                      <RowLabel label={brCode} />
                      {cols.map((c) => {
                        const br = (c.courses || []).find((x) => x.branch_code === brCode);
                        const oc = br?.cutoffs_2026_predicted?.OC ?? br?.cutoffs_2025?.OC ?? br?.cutoffs?.OC;
                        return (
                          <td key={c.code} className="px-4 py-3 text-center text-xs text-gray-700">
                            {oc ?? <span className="text-gray-300">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              )}

              {/* ── REVIEWS ── */}
              <tr>
                <td colSpan={n + 1} className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wide bg-yellow-50">
                  Student Reviews
                </td>
              </tr>
              <tr>
                <RowLabel icon={ThumbsUp} label="Pros" />
                {cols.map((c) => (
                  <td key={c.code} className="px-4 py-3 align-top">
                    {c.reviews?.pros?.length ? (
                      <ul className="space-y-1">
                        {c.reviews.pros.map((p, i) => (
                          <li key={i} className="text-xs text-green-700 flex items-start gap-1">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                            {p.slice(0, 60)}
                          </li>
                        ))}
                      </ul>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50/50">
                <RowLabel icon={ThumbsDown} label="Cons" />
                {cols.map((c) => (
                  <td key={c.code} className="px-4 py-3 align-top">
                    {c.reviews?.cons?.length ? (
                      <ul className="space-y-1">
                        {c.reviews.cons.map((p, i) => (
                          <li key={i} className="text-xs text-red-600 flex items-start gap-1">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                            {p.slice(0, 60)}
                          </li>
                        ))}
                      </ul>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>

        {/* Footer legend */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-green-100 border border-green-300 inline-block" />
            Best value in row
          </span>
          <span>Select up to {5} colleges to compare side-by-side.</span>
        </div>
      </div>
    </div>
  );
}
