import { useState, useCallback } from 'react';
import { searchColleges, researchColleges } from '@/api/client';
import type { CollegeMatch, CollegeDetail, SearchParams, SearchResult } from '@/types';

export type SearchPhase = 'idle' | 'searching' | 'selecting' | 'researching' | 'results';

const MAX_RESEARCH = 5;

function mergeInto(prev: CollegeDetail[], incoming: CollegeDetail[]): CollegeDetail[] {
  const existingCodes = new Set(prev.map((c) => c.code));
  const fresh = incoming.filter((c) => !existingCodes.has(c.code));
  const updated = prev.map((c) => {
    const refreshed = incoming.find((n) => n.code === c.code);
    return refreshed ?? c;
  });
  return [...fresh, ...updated]; // newest first
}

export function useSearch() {
  const [phase, setPhase] = useState<SearchPhase>('idle');
  const [matches, setMatches] = useState<CollegeMatch[]>([]);
  const [results, setResults] = useState<CollegeDetail[]>([]);
  const [researchedColleges, setResearchedColleges] = useState<CollegeDetail[]>([]); // session cache
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (params: SearchParams) => {
    setError(null);
    setPhase('searching');
    setMatches([]);
    setResults([]);
    try {
      let data: SearchResult;
      if (params.type === 'cutoff' && params.courses && params.courses.length > 0) {
        const calls = params.courses.map((c) =>
          searchColleges({ ...params, course: c, courses: undefined })
        );
        const allResults = await Promise.all(calls);
        const seen = new Set<string>();
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
      if (data.matches.length === 0) {
        setPhase('idle');
        setError('No colleges found matching your search.');
        return;
      }
      if (data.exact && data.matches.length === 1) {
        // Auto-research single exact match
        setPhase('researching');
        const detail = await researchColleges([data.matches[0].code]);
        setResults(detail);
        setResearchedColleges((prev) => mergeInto(prev, detail));
        setPhase('results');
      } else {
        setMatches(data.matches);
        setSelectedCodes(new Set(data.matches.map((m) => m.code)));
        setPhase('selecting');
      }
    } catch (e) {
      console.error('Search error:', e);
      setError('Search failed. Please check your connection and try again.');
      setPhase('idle');
    }
  }, []);

  const handleResearch = useCallback(async () => {
    if (selectedCodes.size === 0) return;
    setError(null);
    setPhase('researching');
    try {
      const codes = Array.from(selectedCodes).slice(0, MAX_RESEARCH);
      const detail = await researchColleges(codes);
      setResults(detail);
      setResearchedColleges((prev) => mergeInto(prev, detail));
      setPhase('results');
    } catch (e) {
      console.error('Research error:', e);
      setError('Could not load college details. Please try again.');
      setPhase('selecting');
    }
  }, [selectedCodes]);

  const toggleCode = useCallback((code: string) => {
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedCodes(new Set(matches.map((m) => m.code)));
  }, [matches]);

  const deselectAll = useCallback(() => setSelectedCodes(new Set()), []);

  const clearResearched = useCallback(() => setResearchedColleges([]), []);

  const reset = useCallback(() => {
    setPhase('idle');
    setMatches([]);
    setResults([]);
    setSelectedCodes(new Set());
    setError(null);
    // researchedColleges intentionally kept — persists for session
  }, []);

  return {
    phase,
    matches,
    results,
    researchedColleges,
    selectedCodes,
    error,
    maxResearch: MAX_RESEARCH,
    handleSearch,
    handleResearch,
    toggleCode,
    selectAll,
    deselectAll,
    clearResearched,
    reset,
  };
}
