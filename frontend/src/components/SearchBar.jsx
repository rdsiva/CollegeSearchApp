import { useState } from 'react';
import { Search, Hash, TrendingDown, MapPin } from 'lucide-react';
import CutoffSearchForm from './CutoffSearchForm';

const MODES = [
  { id: 'name', label: 'By Name', icon: Search },
  { id: 'code', label: 'By Code', icon: Hash },
  { id: 'cutoff', label: 'By Cutoff', icon: TrendingDown },
];

const DISTRICTS = [
  'Ariyalur', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri',
  'Dindigul', 'Erode', 'Kanchipuram', 'Kanyakumari', 'Karur',
  'Krishnagiri', 'Madurai', 'Nagapattinam', 'Namakkal', 'Perambalur',
  'Pudukkottai', 'Ramanathapuram', 'Salem', 'Sivaganga', 'Thanjavur',
  'Theni', 'Thiruvarur', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
  'Tirupur', 'Tiruvallur', 'Tiruvannamalai', 'Vellore', 'Villupuram',
  'Virudhunagar',
];

export default function SearchBar({ onSearch, loading }) {
  const [mode, setMode] = useState('name');
  const [query, setQuery] = useState('');
  const [district, setDistrict] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch({ type: mode, q: query.trim(), district: district || undefined });
  }

  function handleCutoffSearch(params) {
    onSearch({ ...params, district: district || undefined });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      {/* Mode tabs */}
      <div className="flex gap-2 mb-4">
        {MODES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Location filter — shared across all modes */}
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
        <MapPin size={14} className="text-gray-400 flex-shrink-0" />
        <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Location</label>
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
        >
          <option value="">All Districts</option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        {district && (
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
            Includes nearby districts
          </span>
        )}
      </div>

      {mode === 'cutoff' ? (
        <CutoffSearchForm onSearch={handleCutoffSearch} loading={loading} />
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              mode === 'name'
                ? 'e.g. PSG College, SSN, Thiagarajar...'
                : 'e.g. 1116, 2614, 3456...'
            }
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      )}
    </div>
  );
}
