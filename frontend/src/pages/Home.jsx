import { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import CollegeSelector from '../components/CollegeSelector';
import CollegeCard from '../components/CollegeCard';
import FavoritesGrid from '../components/FavoritesGrid';
import { searchColleges, researchColleges } from '../api/client';
import { useSession } from '../context/SessionContext';

export default function Home() {
  const [searchLoading, setSearchLoading] = useState(false);
  const [researchLoading, setResearchLoading] = useState(false);
  const [matches, setMatches] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const { addManyToFavorites } = useSession();

  async function handleSearch(params) {
    setSearchLoading(true);
    setError(null);
    setMatches(null);
    setResults([]);
    try {
      let data;
      if (params.type === 'cutoff' && params.courses && params.courses.length > 0) {
        const calls = params.courses.map((c) =>
          searchColleges({ ...params, course: c, courses: undefined })
        );
        const allResults = await Promise.all(calls);
        const seen = new Set();
        const merged = allResults
          .flatMap((r) => r.matches)
          .filter((m) => {
            if (seen.has(m.code)) return false;
            seen.add(m.code);
            return true;
          });
        data = { matches: merged, exact: false };
      } else {
        data = await searchColleges(params);
      }
      if (data.exact && data.matches.length === 1) {
        // Single exact match — go straight to research
        await handleResearch([data.matches[0].code]);
      } else {
        setMatches(data.matches);
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleResearch(codes) {
    setResearchLoading(true);
    setError(null);
    try {
      const data = await researchColleges(codes);
      setResults(data);
      setMatches(null);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to fetch college details.');
    } finally {
      setResearchLoading(false);
    }
  }

  function handleAddAllToFavorites() {
    addManyToFavorites(results);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 no-print">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <h1 className="text-2xl font-bold text-gray-900">
            TN College Research Assistant
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Search Tamil Nadu engineering colleges by name, code, or cutoff mark
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <div className="no-print">
          <SearchBar onSearch={handleSearch} loading={searchLoading || researchLoading} />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 no-print">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Loading state */}
        {(searchLoading || researchLoading) && (
          <div className="flex items-center justify-center py-12 no-print">
            <Loader2 size={28} className="animate-spin text-blue-500" />
            <span className="ml-3 text-gray-500 text-sm">
              {researchLoading ? 'Researching colleges — fetching reviews & AI analysis...' : 'Searching...'}
            </span>
          </div>
        )}

        {/* Multi-select when multiple matches */}
        {matches && matches.length > 0 && !searchLoading && !researchLoading && (
          <div className="no-print">
            <CollegeSelector
              matches={matches}
              onResearch={handleResearch}
              loading={researchLoading}
            />
          </div>
        )}

        {matches && matches.length === 0 && !searchLoading && (
          <div className="text-center py-10 text-gray-400 text-sm no-print">
            No colleges found matching your search.
          </div>
        )}

        {/* Research results */}
        {results.length > 0 && !researchLoading && (
          <div className="space-y-4 no-print">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">
                Research Results ({results.length})
              </h2>
              <button
                onClick={handleAddAllToFavorites}
                className="text-xs px-3 py-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors font-medium"
              >
                Add all to Favorites
              </button>
            </div>
            {results.map((college) => (
              <CollegeCard key={college.code} college={college} />
            ))}
          </div>
        )}

        {/* Favorites grid — always visible */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">My Favorites</h2>
          <FavoritesGrid onViewDetails={setSelectedDetail} />
        </div>
      </main>
    </div>
  );
}
