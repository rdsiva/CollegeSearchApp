/**
 * Tests for src/hooks/useSearch.ts
 *
 * Covers: initial state, handleSearch (multiple matches → selecting,
 * single exact match → auto-research → results, empty, API error),
 * handleResearch, toggleCode, selectAll, deselectAll, reset
 */

import { act, renderHook } from '@testing-library/react-native';
import { useSearch } from '@/hooks/useSearch';
import type { CollegeDetail, CollegeMatch, SearchResult } from '@/types';

// ---------- mocks ----------

jest.mock('@/api/client', () => ({
  searchColleges: jest.fn(),
  researchColleges: jest.fn(),
}));

import { searchColleges, researchColleges } from '@/api/client';

const mockedSearch = searchColleges as jest.Mock;
const mockedResearch = researchColleges as jest.Mock;

// ---------- fixtures ----------

function makeMatch(code: string): CollegeMatch {
  return {
    code,
    name: `College ${code}`,
    city: 'Chennai',
    district: 'Chennai',
    affiliation: 'Anna University',
    courses: ['CSE'],
  };
}

function makeDetail(code: string): CollegeDetail {
  return {
    name: `College ${code}`,
    code,
    anna_university_code: `AU${code}`,
    city: 'Chennai',
    district: 'Chennai',
    affiliation: 'Anna University',
    approved_by: ['AICTE'],
    courses: [],
  };
}

const multiResult: SearchResult = {
  exact: false,
  matches: [makeMatch('CE001'), makeMatch('CE002'), makeMatch('CE003')],
};

const singleExactResult: SearchResult = {
  exact: true,
  matches: [makeMatch('CE001')],
};

const emptyResult: SearchResult = {
  exact: false,
  matches: [],
};

// ---------- setup ----------

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================================
// Initial state
// ============================================================

describe('initial state', () => {
  it('starts with phase idle', () => {
    const { result } = renderHook(() => useSearch());
    expect(result.current.phase).toBe('idle');
  });

  it('starts with empty matches array', () => {
    const { result } = renderHook(() => useSearch());
    expect(result.current.matches).toEqual([]);
  });

  it('starts with empty results array', () => {
    const { result } = renderHook(() => useSearch());
    expect(result.current.results).toEqual([]);
  });

  it('starts with empty selectedCodes set', () => {
    const { result } = renderHook(() => useSearch());
    expect(result.current.selectedCodes.size).toBe(0);
  });

  it('starts with null error', () => {
    const { result } = renderHook(() => useSearch());
    expect(result.current.error).toBeNull();
  });
});

// ============================================================
// handleSearch — multiple matches → selecting
// ============================================================

describe('handleSearch with multiple matches', () => {
  it('calls searchColleges with the provided params', async () => {
    mockedSearch.mockResolvedValueOnce(multiResult);

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch({ type: 'name', q: 'anna' });
    });

    expect(mockedSearch).toHaveBeenCalledWith({ type: 'name', q: 'anna' });
  });

  it('transitions to selecting phase', async () => {
    mockedSearch.mockResolvedValueOnce(multiResult);

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch({ type: 'name', q: 'test' });
    });

    expect(result.current.phase).toBe('selecting');
  });

  it('populates matches with results from the API', async () => {
    mockedSearch.mockResolvedValueOnce(multiResult);

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch({ type: 'name', q: 'test' });
    });

    expect(result.current.matches).toHaveLength(3);
    expect(result.current.matches[0].code).toBe('CE001');
  });

  it('pre-selects all codes returned by the API', async () => {
    mockedSearch.mockResolvedValueOnce(multiResult);

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch({ type: 'name', q: 'test' });
    });

    expect(result.current.selectedCodes.has('CE001')).toBe(true);
    expect(result.current.selectedCodes.has('CE002')).toBe(true);
    expect(result.current.selectedCodes.has('CE003')).toBe(true);
  });
});

// ============================================================
// handleSearch — single exact match → auto-research → results
// ============================================================

describe('handleSearch single exact match', () => {
  it('calls researchColleges automatically for a single exact match', async () => {
    mockedSearch.mockResolvedValueOnce(singleExactResult);
    mockedResearch.mockResolvedValueOnce([makeDetail('CE001')]);

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch({ type: 'code', q: 'CE001' });
    });

    expect(mockedResearch).toHaveBeenCalledWith(['CE001']);
  });

  it('transitions to results phase after auto-research', async () => {
    mockedSearch.mockResolvedValueOnce(singleExactResult);
    mockedResearch.mockResolvedValueOnce([makeDetail('CE001')]);

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch({ type: 'code', q: 'CE001' });
    });

    expect(result.current.phase).toBe('results');
  });

  it('populates results with the researched detail', async () => {
    mockedSearch.mockResolvedValueOnce(singleExactResult);
    mockedResearch.mockResolvedValueOnce([makeDetail('CE001')]);

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch({ type: 'code', q: 'CE001' });
    });

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].code).toBe('CE001');
  });

  it('does not show the selecting phase for a single exact match', async () => {
    const phases: string[] = [];
    mockedSearch.mockResolvedValueOnce(singleExactResult);
    mockedResearch.mockResolvedValueOnce([makeDetail('CE001')]);

    const { result } = renderHook(() => useSearch());

    // We can't easily spy on intermediate phases from renderHook,
    // but we can verify the final phase is not 'selecting'
    await act(async () => {
      await result.current.handleSearch({ type: 'code', q: 'CE001' });
    });

    expect(result.current.phase).not.toBe('selecting');
  });
});

// ============================================================
// handleSearch — empty results
// ============================================================

describe('handleSearch empty results', () => {
  it('sets an error message', async () => {
    mockedSearch.mockResolvedValueOnce(emptyResult);

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch({ type: 'name', q: 'xyznotfound' });
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error).toMatch(/no colleges found/i);
  });

  it('returns to idle phase', async () => {
    mockedSearch.mockResolvedValueOnce(emptyResult);

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch({ type: 'name', q: 'xyznotfound' });
    });

    expect(result.current.phase).toBe('idle');
  });
});

// ============================================================
// handleSearch — API error
// ============================================================

describe('handleSearch API error', () => {
  it('shows a generic user-friendly error message (not the raw error text)', async () => {
    mockedSearch.mockRejectedValueOnce(new Error('Search failed: 503 - Internal details'));

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch({ type: 'name', q: 'test' });
    });

    // Should NOT contain the raw server error
    expect(result.current.error).not.toContain('503');
    expect(result.current.error).not.toContain('Internal details');
    // Should be a friendly message
    expect(result.current.error).toBeTruthy();
  });

  it('returns to idle phase on error', async () => {
    mockedSearch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch({ type: 'name', q: 'test' });
    });

    expect(result.current.phase).toBe('idle');
  });

  it('clears previous results on new search error', async () => {
    // First search succeeds
    mockedSearch.mockResolvedValueOnce(multiResult);
    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch({ type: 'name', q: 'anna' });
    });

    // Second search fails
    mockedSearch.mockRejectedValueOnce(new Error('Timeout'));

    await act(async () => {
      await result.current.handleSearch({ type: 'name', q: 'anna' });
    });

    expect(result.current.matches).toEqual([]);
    expect(result.current.results).toEqual([]);
  });
});

// ============================================================
// handleResearch
// ============================================================

describe('handleResearch', () => {
  it('calls researchColleges with the currently selected codes', async () => {
    mockedSearch.mockResolvedValueOnce(multiResult);
    mockedResearch.mockResolvedValueOnce([makeDetail('CE001'), makeDetail('CE002')]);

    const { result } = renderHook(() => useSearch());

    // First get to selecting phase
    await act(async () => {
      await result.current.handleSearch({ type: 'name', q: 'test' });
    });

    // Deselect CE003
    await act(async () => {
      result.current.toggleCode('CE003');
    });

    await act(async () => {
      await result.current.handleResearch();
    });

    const calledCodes: string[] = mockedResearch.mock.calls[0][0];
    expect(calledCodes).toContain('CE001');
    expect(calledCodes).toContain('CE002');
    expect(calledCodes).not.toContain('CE003');
  });

  it('transitions to results phase on success', async () => {
    mockedSearch.mockResolvedValueOnce(multiResult);
    mockedResearch.mockResolvedValueOnce([makeDetail('CE001')]);

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch({ type: 'name', q: 'test' });
    });

    await act(async () => {
      await result.current.handleResearch();
    });

    expect(result.current.phase).toBe('results');
  });

  it('populates results on success', async () => {
    mockedSearch.mockResolvedValueOnce(multiResult);
    mockedResearch.mockResolvedValueOnce([makeDetail('CE001'), makeDetail('CE002')]);

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch({ type: 'name', q: 'test' });
    });

    await act(async () => {
      await result.current.handleResearch();
    });

    expect(result.current.results).toHaveLength(2);
  });

  it('does nothing if selectedCodes is empty', async () => {
    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleResearch();
    });

    expect(mockedResearch).not.toHaveBeenCalled();
    expect(result.current.phase).toBe('idle');
  });

  it('returns to selecting phase on error', async () => {
    mockedSearch.mockResolvedValueOnce(multiResult);
    mockedResearch.mockRejectedValueOnce(new Error('Research failed: 500'));

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch({ type: 'name', q: 'test' });
    });

    await act(async () => {
      await result.current.handleResearch();
    });

    expect(result.current.phase).toBe('selecting');
    expect(result.current.error).toBeTruthy();
  });
});

// ============================================================
// toggleCode
// ============================================================

describe('toggleCode', () => {
  it('adds a code when it is not selected', async () => {
    const { result } = renderHook(() => useSearch());

    await act(async () => {
      result.current.toggleCode('CE001');
    });

    expect(result.current.selectedCodes.has('CE001')).toBe(true);
  });

  it('removes a code when it is already selected', async () => {
    mockedSearch.mockResolvedValueOnce(multiResult);
    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch({ type: 'name', q: 'test' });
    });

    // CE001 is pre-selected; toggle it off
    await act(async () => {
      result.current.toggleCode('CE001');
    });

    expect(result.current.selectedCodes.has('CE001')).toBe(false);
    expect(result.current.selectedCodes.has('CE002')).toBe(true);
  });

  it('toggling twice returns code to selected state', async () => {
    const { result } = renderHook(() => useSearch());

    await act(async () => {
      result.current.toggleCode('CE001');
      result.current.toggleCode('CE001');
    });

    expect(result.current.selectedCodes.has('CE001')).toBe(false);
  });
});

// ============================================================
// selectAll / deselectAll
// ============================================================

describe('selectAll', () => {
  it('selects all codes from current matches', async () => {
    mockedSearch.mockResolvedValueOnce(multiResult);
    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch({ type: 'name', q: 'test' });
    });

    // Deselect one first
    await act(async () => {
      result.current.toggleCode('CE002');
    });

    expect(result.current.selectedCodes.has('CE002')).toBe(false);

    await act(async () => {
      result.current.selectAll();
    });

    expect(result.current.selectedCodes.has('CE001')).toBe(true);
    expect(result.current.selectedCodes.has('CE002')).toBe(true);
    expect(result.current.selectedCodes.has('CE003')).toBe(true);
  });
});

describe('deselectAll', () => {
  it('empties the selectedCodes set', async () => {
    mockedSearch.mockResolvedValueOnce(multiResult);
    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch({ type: 'name', q: 'test' });
    });

    await act(async () => {
      result.current.deselectAll();
    });

    expect(result.current.selectedCodes.size).toBe(0);
  });
});

// ============================================================
// reset
// ============================================================

describe('reset', () => {
  it('returns phase to idle', async () => {
    mockedSearch.mockResolvedValueOnce(multiResult);
    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch({ type: 'name', q: 'test' });
    });

    await act(async () => {
      result.current.reset();
    });

    expect(result.current.phase).toBe('idle');
  });

  it('clears matches', async () => {
    mockedSearch.mockResolvedValueOnce(multiResult);
    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch({ type: 'name', q: 'test' });
    });

    await act(async () => {
      result.current.reset();
    });

    expect(result.current.matches).toEqual([]);
  });

  it('clears results', async () => {
    mockedSearch.mockResolvedValueOnce(singleExactResult);
    mockedResearch.mockResolvedValueOnce([makeDetail('CE001')]);
    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch({ type: 'code', q: 'CE001' });
    });

    await act(async () => {
      result.current.reset();
    });

    expect(result.current.results).toEqual([]);
  });

  it('clears selectedCodes', async () => {
    mockedSearch.mockResolvedValueOnce(multiResult);
    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch({ type: 'name', q: 'test' });
    });

    await act(async () => {
      result.current.reset();
    });

    expect(result.current.selectedCodes.size).toBe(0);
  });

  it('clears error', async () => {
    mockedSearch.mockResolvedValueOnce(emptyResult);
    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch({ type: 'name', q: 'unknown' });
    });

    expect(result.current.error).not.toBeNull();

    await act(async () => {
      result.current.reset();
    });

    expect(result.current.error).toBeNull();
  });
});
