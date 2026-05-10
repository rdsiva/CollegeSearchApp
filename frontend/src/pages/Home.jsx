import { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle, Loader2, FlaskConical, X } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import CollegeSelector from '../components/CollegeSelector';
import CollegeCard from '../components/CollegeCard';
import FavoritesGrid from '../components/FavoritesGrid';
import LiveStats from '../components/LiveStats';
import ResearchQueue from '../components/ResearchQueue';
import ToastStack from '../components/Toast';
import { searchColleges, startResearchJob, getResearchJob } from '../api/client';
import { useSession } from '../context/SessionContext';

const POLL_INTERVAL_MS = 2500;
const COMPLETED_AUTO_DISMISS_MS = 8000;

const MAX_RESEARCH = 5;

export default function Home() {
  const [searchLoading, setSearchLoading] = useState(false);
  const [matches, setMatches] = useState(null);
  const [error, setError] = useState(null);

  // Session-scoped: persists across multiple searches until page reload
  const [researchedColleges, setResearchedColleges] = useState([]);
  const [selectedDetail, setSelectedDetail] = useState(null);

  // Async research queue
  const [jobs, setJobs] = useState([]); // each: { ...job state from backend, _resultsMerged: bool }
  const [toasts, setToasts] = useState([]);
  const codeToNameRef = useRef({}); // remember names from search matches so the queue can label codes
  const pollersRef = useRef({}); // jobId → interval id

  const { addManyToFavorites } = useSession();

  function mergeResearched(newColleges) {
    setResearchedColleges((prev) => {
      const existingCodes = new Set(prev.map((c) => c.code));
      const fresh = newColleges.filter((c) => !existingCodes.has(c.code));
      const updated = prev.map((c) => {
        const refreshed = newColleges.find((n) => n.code === c.code);
        return refreshed ?? c;
      });
      return [...fresh, ...updated];
    });
  }

  const pushToast = useCallback((kind, message, duration = 5000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((t) => [...t, { id, kind, message, duration }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const dismissJob = useCallback((id) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  // Poll a single job until it completes; merge incremental results into researchedColleges.
  const startPolling = useCallback((jobId) => {
    if (pollersRef.current[jobId]) return;
    const tick = async () => {
      try {
        const fresh = await getResearchJob(jobId);
        setJobs((prev) => {
          const idx = prev.findIndex((j) => j.id === fresh.id);
          if (idx === -1) return prev;
          const prior = prev[idx];
          // Merge any newly completed results into the global list
          const priorCodes = new Set(prior.results.map((r) => r.code));
          const freshlyDone = fresh.results.filter((r) => !priorCodes.has(r.code));
          if (freshlyDone.length) mergeResearched(freshlyDone);
          const next = [...prev];
          next[idx] = fresh;
          return next;
        });
        if (fresh.status === 'completed' || fresh.status === 'failed') {
          clearInterval(pollersRef.current[jobId]);
          delete pollersRef.current[jobId];
          const okCount = fresh.results.length;
          const errCount = Object.keys(fresh.errors || {}).length;
          if (fresh.status === 'failed' || (errCount > 0 && okCount === 0)) {
            pushToast('error', `Research failed for ${fresh.codes.length} college${fresh.codes.length > 1 ? 's' : ''}`);
          } else if (errCount > 0) {
            pushToast('info', `Research completed: ${okCount} done, ${errCount} failed`);
          } else {
            pushToast('success', `Research completed for ${okCount} college${okCount > 1 ? 's' : ''}`);
          }
          // Auto-dismiss the queue card after a beat
          setTimeout(() => dismissJob(jobId), COMPLETED_AUTO_DISMISS_MS);
        }
      } catch {
        // network blips are fine; keep polling
      }
    };
    tick();
    pollersRef.current[jobId] = setInterval(tick, POLL_INTERVAL_MS);
  }, [pushToast, dismissJob]);

  // Cleanup any pollers on unmount
  useEffect(() => {
    return () => {
      Object.values(pollersRef.current).forEach((id) => clearInterval(id));
      pollersRef.current = {};
    };
  }, []);

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
      // Remember names so the queue card can label codes
      data.matches.forEach((m) => { codeToNameRef.current[m.code] = m.name; });
      if (data.exact && data.matches.length === 1) {
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
    setError(null);
    try {
      const job = await startResearchJob(batch);
      setJobs((prev) => [job, ...prev]);
      startPolling(job.id);
      setMatches(null); // dismiss selector — results land in the queue
      pushToast('info', `Research queued for ${batch.length} college${batch.length > 1 ? 's' : ''}`, 3000);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to queue research job.');
    }
  }

  function handleAddAllToFavorites() {
    addManyToFavorites(researchedColleges);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 no-print">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              TN College Research Assistant
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Search Tamil Nadu engineering colleges by name, code, or cutoff mark
            </p>
          </div>
          <div className="shrink-0 mt-1">
            <LiveStats />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <div className="no-print">
          <SearchBar onSearch={handleSearch} loading={searchLoading} />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 no-print">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Search loading */}
        {searchLoading && (
          <div className="flex items-center justify-center py-12 no-print">
            <Loader2 size={28} className="animate-spin text-blue-500" />
            <span className="ml-3 text-gray-500 text-sm">Searching...</span>
          </div>
        )}

        {/* Search results selector */}
        {matches && matches.length > 0 && !searchLoading && (
          <div className="no-print">
            <CollegeSelector matches={matches} onResearch={doResearch} loading={false} />
          </div>
        )}

        {matches && matches.length === 0 && !searchLoading && (
          <div className="text-center py-10 text-gray-400 text-sm no-print">
            No colleges found matching your search.
          </div>
        )}

        {/* Async research queue — appears below search results */}
        <ResearchQueue
          jobs={jobs}
          onDismiss={dismissJob}
          codeToName={codeToNameRef.current}
        />

        {/* Researched colleges — persists for the session */}
        {researchedColleges.length > 0 && (
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

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
