import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { MapPin, Award, TrendingUp, DollarSign, ThumbsUp, ThumbsDown, Star, ExternalLink, ChevronDown, ChevronUp, PlusCircle, MessageCircle, GitCompare } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { useChat } from '../context/ChatContext';
import { useCompare } from '../context/CompareContext';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
const CATEGORIES = ['OC', 'BC', 'BCM', 'MBC', 'SC', 'ST', 'SCA'];

const YEAR_TABS = [
  { key: 'cutoffs_2026_predicted', label: '2026 Predicted', color: 'bg-purple-50 text-purple-700 border-purple-300' },
  { key: 'cutoffs_2025',           label: '2025 Expected',  color: 'bg-blue-50 text-blue-700 border-blue-300' },
  { key: 'cutoffs',                label: '2024 Actual',    color: 'bg-gray-50 text-gray-700 border-gray-300' },
];

function CutoffsTable({ courses }) {
  const [activeTab, setActiveTab] = useState('cutoffs_2026_predicted');

  // Determine which tabs have data
  const availableTabs = YEAR_TABS.filter((t) =>
    courses.some((c) => c[t.key] && Object.values(c[t.key]).some((v) => v != null))
  );
  const tab = availableTabs.find((t) => t.key === activeTab) || availableTabs[0];
  if (!tab) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-gray-600">TNEA Cutoffs</h4>
        <div className="flex gap-1">
          {availableTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                tab.key === t.key ? t.color : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab.key === 'cutoffs_2026_predicted' && (
        <p className="text-xs text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg mb-2 border border-purple-200">
          2026 cutoffs are AI-predicted based on 2024–2025 trends. Actual values may vary.
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-600 min-w-48">Branch</th>
              {CATEGORIES.map((cat) => (
                <th key={cat} className="px-3 py-2 text-center font-semibold text-gray-600">{cat}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {courses.map((branch) => {
              const cutoffs = branch[tab.key] || {};
              return (
                <tr key={branch.branch_code} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-800 font-medium">
                    {branch.branch_name}
                    <span className="ml-1.5 text-gray-400 font-normal">({branch.branch_code})</span>
                  </td>
                  {CATEGORIES.map((cat) => (
                    <td key={cat} className="px-3 py-2 text-center text-gray-600">
                      {cutoffs[cat] ?? <span className="text-gray-300">—</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScoreBadge({ score }) {
  const color = score >= 75 ? 'bg-green-100 text-green-700 border-green-200'
    : score >= 55 ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
    : 'bg-red-100 text-red-600 border-red-200';
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${color}`}>
      {score.toFixed(1)}/100
    </span>
  );
}

export default function CollegeCard({ college }) {
  const [expanded, setExpanded] = useState(false);
  const { addToFavorites, favorites } = useSession();
  const { openForCollege } = useChat();
  const { addToCompare, removeFromCompare, isInCompare, isFull } = useCompare();
  const isInFavorites = favorites.some((f) => f.code === college.code);
  const inCompare = isInCompare(college.code);

  const placementData = college.placement?.avg_lpa ? [
    { name: 'Avg LPA', value: college.placement.avg_lpa },
    { name: 'Highest LPA', value: college.placement.highest_lpa ?? 0 },
  ] : [];

  const feesData = [
    college.fees?.tnea && { name: 'TNEA', value: college.fees.tnea },
    college.fees?.management && { name: 'Mgmt', value: college.fees.management },
    college.fees?.hostel && { name: 'Hostel', value: college.fees.hostel },
  ].filter(Boolean);

  const scoreBreakdownData = college.score_breakdown ? [
    { name: 'Placement', value: college.score_breakdown.placement },
    { name: 'Fees', value: college.score_breakdown.fees_affordability },
    { name: 'Reviews', value: college.score_breakdown.reviews_sentiment },
    { name: 'Infra', value: college.score_breakdown.infrastructure },
    { name: 'Location', value: college.score_breakdown.location },
  ] : [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-gray-900">{college.name}</h3>
              <span className="font-mono text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                {college.anna_university_code}
              </span>
              {college.nirf_rank && (
                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium">
                  NIRF #{college.nirf_rank}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin size={11} /> {college.city}, {college.district}
              </span>
              <span>{college.affiliation}</span>
              {college.approved_by.length > 0 && (
                <span className="text-gray-400">Approved: {college.approved_by.join(', ')}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {college.score != null && <ScoreBadge score={college.score} />}
            <button
              onClick={() => openForCollege(college)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-medium transition-colors border border-blue-200"
            >
              <span className="text-sm leading-none">🎓</span> Ask College Buddy
            </button>
            <button
              onClick={() => inCompare ? removeFromCompare(college.code) : addToCompare(college)}
              disabled={!inCompare && isFull()}
              title={isFull() && !inCompare ? 'Max 5 colleges in compare' : ''}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border
                ${inCompare
                  ? 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed'}`}
            >
              <GitCompare size={13} /> {inCompare ? 'Added' : 'Compare'}
            </button>
            {!isInFavorites ? (
              <button
                onClick={() => addToFavorites(college)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg text-xs font-medium transition-colors border border-yellow-200"
              >
                <PlusCircle size={13} /> Add to Favorites
              </button>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium border border-green-200">
                <Star size={13} className="fill-green-500" /> In Favorites
              </span>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-blue-50 rounded-xl p-3">
            <div className="text-xs text-blue-500 font-medium">Avg Package</div>
            <div className="text-lg font-bold text-blue-800 mt-0.5">
              {college.placement?.avg_lpa ? `${college.placement.avg_lpa} LPA` : '—'}
            </div>
          </div>
          <div className="bg-green-50 rounded-xl p-3">
            <div className="text-xs text-green-500 font-medium">TNEA Fees/yr</div>
            <div className="text-lg font-bold text-green-800 mt-0.5">
              {college.fees?.tnea ? `₹${(college.fees.tnea / 1000).toFixed(0)}K` : '—'}
            </div>
          </div>
          <div className="bg-purple-50 rounded-xl p-3">
            <div className="text-xs text-purple-500 font-medium">Sentiment</div>
            <div className="text-lg font-bold text-purple-800 mt-0.5">
              {college.reviews?.sentiment_score != null
                ? `${college.reviews.sentiment_score.toFixed(1)}/10`
                : '—'}
            </div>
          </div>
          <div className="bg-orange-50 rounded-xl p-3">
            <div className="text-xs text-orange-500 font-medium">Placement %</div>
            <div className="text-lg font-bold text-orange-800 mt-0.5">
              {college.placement?.placement_percentage ? `${college.placement.placement_percentage}%` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews summary */}
      {college.reviews && (
        <div className="px-6 py-4 border-b border-gray-100 grid sm:grid-cols-2 gap-4">
          {college.reviews.pros?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-green-700">
                <ThumbsUp size={13} /> Pros
              </div>
              <ul className="space-y-1">
                {college.reviews.pros.map((p, i) => (
                  <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {college.reviews.cons?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-red-600">
                <ThumbsDown size={13} /> Cons
              </div>
              <ul className="space-y-1">
                {college.reviews.cons.map((c, i) => (
                  <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {college.reviews.summary && (
            <p className="sm:col-span-2 text-xs text-gray-500 italic border-t border-gray-100 pt-3 mt-1">
              {college.reviews.summary}
            </p>
          )}
        </div>
      )}

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-6 py-3 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
      >
        {expanded ? <><ChevronUp size={13} /> Hide details</> : <><ChevronDown size={13} /> Show charts & cutoffs</>}
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-6 border-t border-gray-100 pt-4">
          {/* Charts */}
          <div className="grid sm:grid-cols-2 gap-6">
            {placementData.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-600 mb-3 flex items-center gap-1.5">
                  <TrendingUp size={13} /> Placement (LPA)
                </h4>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={placementData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [`₹${v} LPA`]} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {feesData.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-600 mb-3 flex items-center gap-1.5">
                  <DollarSign size={13} /> Fees Breakdown (₹)
                </h4>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={feesData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={55}
                      label={({ name }) => name}
                      labelLine={false}
                    >
                      {feesData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`]} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Score breakdown */}
          {scoreBreakdownData.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 mb-3 flex items-center gap-1.5">
                <Award size={13} /> Score Breakdown
              </h4>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={scoreBreakdownData} layout="vertical" margin={{ top: 0, right: 30, left: 50, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 40]} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
                  <Tooltip formatter={(v) => [`${v.toFixed(2)} pts`]} />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Cutoffs table — 3-year comparison */}
          {college.courses?.length > 0 && (
            <CutoffsTable courses={college.courses} />
          )}

          {/* Top companies */}
          {college.placement?.top_companies?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 mb-2">Top Recruiters</h4>
              <div className="flex flex-wrap gap-1.5">
                {college.placement.top_companies.map((c) => (
                  <span key={c} className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Google Reviews */}
          {college.reviews?.review_texts?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                <Star size={13} className="text-yellow-500" /> Google Reviews
                {college.reviews.google_rating && (
                  <span className="ml-1 text-yellow-600 font-bold">{college.reviews.google_rating}/5</span>
                )}
              </h4>
              <div className="space-y-2">
                {college.reviews.review_texts.map((text, i) => (
                  <div key={i} className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 leading-relaxed">
                    "{text.length > 200 ? text.slice(0, 200) + '…' : text}"
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* YouTube videos */}
          {college.youtube_videos?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 mb-2">Related Videos</h4>
              <ul className="space-y-1.5">
                {college.youtube_videos.map((v, i) => (
                  <li key={i}>
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <ExternalLink size={11} /> {v.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
