import { useState } from 'react';
import { AlertCircle, Loader2, FlaskConical, X } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import CollegeSelector from '../components/CollegeSelector';
import CollegeCard from '../components/CollegeCard';
import FavoritesGrid from '../components/FavoritesGrid';
import { searchColleges, researchColleges } from '../api/client';
import { useSession } from '../context/SessionContext';

const MAX_RESEARCH = 5;

export default function Home() {
  const [searchLoading, setSearchLoading] = useState(false);
  const [researchLoading, setResearchLoading] = useState(false);
  const [matches, setMatches] = useState(null);
  const [error, setError] = useState(null);

  // Session-scoped: persists across multiple searches until page reload
  const [researchedColleges, setResearchedColleges] = useState([]);
  const [selectedDetail, setSelectedDetail] = useState(null);

  const { addManyToFavorites } = useSession();

  function mergeResearched(newColleges) {
    setResearchedColleges((prev) => {
      const existingCodes = new Set(prev.map((c) => c.code));
      const fresh = newColleges.filter((c) => !existingCodes.has(c.code));
      // Newest batch at top; update existing records if re-researched
      const updated = prev.map((c) => {
        const refreshed = newColleges.find((n) => n.code === c.code);
        return refreshed ?? c;
      });
      return [...fresh, ...updated];
    });
  }

  async function handleSearch(params) {
    setSearchLoading(true);
    setError(null);
    setMatches(null);
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
        // Single exact match — research immediately
        await doResearch([data.matches[0].code]);
      } else {
        setMatches(data.matches);
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  }

  async function doResearch(codes) {
    const batch = codes.slice(0, MAX_RESEARCH);
    setResearchLoading(true);
    setError(null);
    try {
      const data = await researchColleges(batch);
      mergeResearched(data);
      setMatches(null); // dismiss selector after research
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to fetch college details.');
    } finally {
      setResearchLoading(false);
    }
  }

  function handleAddAllToFavorites() {
    addManyToFavorites(researchedColleges);
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

        {/* Loading */}
        {(searchLoading || researchLoading) && (
          <div className="flex items-center justify-center py-12 no-print">
            <Loader2 size={28} className="animate-spin text-blue-500" />
            <span className="ml-3 text-gray-500 text-sm">
              {researchLoading
                ? 'Researching colleges — fetching reviews & AI analysis...'
                : 'Searching...'}
            </span>
          </div>
        )}

        {/* Search results selector */}
        {matches && matches.length > 0 && !searchLoading && !researchLoading && (
          <div className="no-print">
            <CollegeSelector
              matches={matches}
              onResearch={doResearch}
              loading={researchLoading}
            />
          </div>
        )}

        {matches && matches.length === 0 && !searchLoading && (
          <div className="text-center py-10 text-gray-400 text-sm no-print">
            No colleges found matching your search.
          </div>
        )}

        {/* Researched colleges — persists for the session */}
        {researchedColleges.length > 0 && !researchLoading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical size={16} className="text-blue-600" />
                <h2 className="text-sm font-semibold text-gray-700">
                  Researched Colleges ({researchedColleges.length})
                </h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  This session
                </span>
              </div>
              <div className="flex items-center gap-2 no-print">
                <button
                  onClick={handleAddAllToFavorites}
                  className="text-xs px-3 py-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors font-medium"
                >
                  ★ Add all to Favorites
                </button>
                <button
                  onClick={() => setResearchedColleges([])}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={12} /> Clear
                </button>
              </div>
            </div>
            {researchedColleges.map((college) => (
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
