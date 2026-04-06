/**
 * Tests for src/context/SessionContext.tsx
 *
 * Covers: addToFavorites, addManyToFavorites, removeFromFavorites,
 *         clearFavorites, isFavorite, AsyncStorage persistence,
 *         corrupted storage, MAX_FAVORITES cap
 */

import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SessionProvider, useSession } from '@/context/SessionContext';
import type { CollegeDetail } from '@/types';

// ---------- mocks ----------

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

const mockedGetItem = AsyncStorage.getItem as jest.Mock;
const mockedSetItem = AsyncStorage.setItem as jest.Mock;

// ---------- helpers ----------

function makeCollege(code: string): CollegeDetail {
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

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SessionProvider>{children}</SessionProvider>
);

// ---------- setup ----------

beforeEach(() => {
  jest.clearAllMocks();
  mockedGetItem.mockResolvedValue(null);
  mockedSetItem.mockResolvedValue(undefined);
});

// ============================================================
// addToFavorites
// ============================================================

describe('addToFavorites', () => {
  it('adds a college to the favorites list', async () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    await act(async () => {
      result.current.addToFavorites(makeCollege('CE001'));
    });

    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0].code).toBe('CE001');
  });

  it('does not add a duplicate college (same code)', async () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    await act(async () => {
      result.current.addToFavorites(makeCollege('CE001'));
      result.current.addToFavorites(makeCollege('CE001'));
    });

    expect(result.current.favorites).toHaveLength(1);
  });

  it('adds two different colleges', async () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    await act(async () => {
      result.current.addToFavorites(makeCollege('CE001'));
      result.current.addToFavorites(makeCollege('CE002'));
    });

    expect(result.current.favorites).toHaveLength(2);
  });
});

// ============================================================
// addManyToFavorites
// ============================================================

describe('addManyToFavorites', () => {
  it('adds multiple new colleges at once', async () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    await act(async () => {
      result.current.addManyToFavorites([makeCollege('CE001'), makeCollege('CE002')]);
    });

    expect(result.current.favorites).toHaveLength(2);
  });

  it('skips colleges that are already in favorites (by code)', async () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    await act(async () => {
      result.current.addToFavorites(makeCollege('CE001'));
    });

    await act(async () => {
      result.current.addManyToFavorites([makeCollege('CE001'), makeCollege('CE002')]);
    });

    expect(result.current.favorites).toHaveLength(2);
    expect(result.current.favorites.map((f) => f.code)).toEqual(['CE001', 'CE002']);
  });

  it('handles an empty array gracefully', async () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    await act(async () => {
      result.current.addManyToFavorites([]);
    });

    expect(result.current.favorites).toHaveLength(0);
  });
});

// ============================================================
// removeFromFavorites
// ============================================================

describe('removeFromFavorites', () => {
  it('removes a college by code', async () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    await act(async () => {
      result.current.addToFavorites(makeCollege('CE001'));
      result.current.addToFavorites(makeCollege('CE002'));
    });

    await act(async () => {
      result.current.removeFromFavorites('CE001');
    });

    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0].code).toBe('CE002');
  });

  it('does nothing when removing a code that is not in favorites', async () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    await act(async () => {
      result.current.addToFavorites(makeCollege('CE001'));
    });

    await act(async () => {
      result.current.removeFromFavorites('NONEXISTENT');
    });

    expect(result.current.favorites).toHaveLength(1);
  });
});

// ============================================================
// clearFavorites
// ============================================================

describe('clearFavorites', () => {
  it('empties the favorites list', async () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    await act(async () => {
      result.current.addToFavorites(makeCollege('CE001'));
      result.current.addToFavorites(makeCollege('CE002'));
    });

    await act(async () => {
      result.current.clearFavorites();
    });

    expect(result.current.favorites).toHaveLength(0);
  });

  it('is safe to call on an already-empty list', async () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    await act(async () => {
      result.current.clearFavorites();
    });

    expect(result.current.favorites).toHaveLength(0);
  });
});

// ============================================================
// isFavorite
// ============================================================

describe('isFavorite', () => {
  it('returns true for a college that was added', async () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    await act(async () => {
      result.current.addToFavorites(makeCollege('CE001'));
    });

    expect(result.current.isFavorite('CE001')).toBe(true);
  });

  it('returns false for a college that was never added', () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    expect(result.current.isFavorite('NOTHERE')).toBe(false);
  });

  it('returns false after the college is removed', async () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    await act(async () => {
      result.current.addToFavorites(makeCollege('CE001'));
    });

    await act(async () => {
      result.current.removeFromFavorites('CE001');
    });

    expect(result.current.isFavorite('CE001')).toBe(false);
  });
});

// ============================================================
// AsyncStorage persistence
// ============================================================

describe('AsyncStorage persistence', () => {
  it('loads favorites from AsyncStorage on mount', async () => {
    const stored = [makeCollege('CE001'), makeCollege('CE002')];
    mockedGetItem.mockResolvedValueOnce(JSON.stringify(stored));

    const { result } = renderHook(() => useSession(), { wrapper });
    // Wait for the async effect to settle
    await act(async () => {});

    expect(result.current.favorites).toHaveLength(2);
    expect(result.current.favorites[0].code).toBe('CE001');
  });

  it('calls setItem with STORAGE_KEY after a state change', async () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    // Wait for the initial load effect
    await act(async () => {});

    mockedSetItem.mockClear();

    await act(async () => {
      result.current.addToFavorites(makeCollege('CE001'));
    });

    expect(mockedSetItem).toHaveBeenCalledWith(
      'tn_college_favorites',
      JSON.stringify([makeCollege('CE001')])
    );
  });

  it('does NOT call setItem before the initial load completes (no premature persist)', async () => {
    // We track setItem calls during first render before act resolves
    let callsDuringMount = 0;
    mockedSetItem.mockImplementation(() => {
      callsDuringMount++;
      return Promise.resolve(undefined);
    });

    // Mount but do NOT await act — setItem before load must not fire
    renderHook(() => useSession(), { wrapper });

    // setItem should be 0 synchronously (before getItem resolves)
    expect(callsDuringMount).toBe(0);
  });
});

// ============================================================
// Corrupted storage
// ============================================================

describe('corrupted storage', () => {
  it('keeps favorites empty when stored value is not an array', async () => {
    // Stored value is a plain object, not an array
    mockedGetItem.mockResolvedValueOnce(JSON.stringify({ code: 'CE001' }));

    const { result } = renderHook(() => useSession(), { wrapper });
    await act(async () => {});

    expect(result.current.favorites).toHaveLength(0);
  });

  it('keeps favorites empty when stored value is invalid JSON', async () => {
    mockedGetItem.mockResolvedValueOnce('NOT_VALID_JSON{{{');

    const { result } = renderHook(() => useSession(), { wrapper });
    await act(async () => {});

    expect(result.current.favorites).toHaveLength(0);
  });

  it('keeps favorites empty when stored value is a JSON string (not array)', async () => {
    mockedGetItem.mockResolvedValueOnce(JSON.stringify('just a string'));

    const { result } = renderHook(() => useSession(), { wrapper });
    await act(async () => {});

    expect(result.current.favorites).toHaveLength(0);
  });
});

// ============================================================
// MAX_FAVORITES cap
// ============================================================

describe('MAX_FAVORITES cap (500)', () => {
  it('does not exceed 500 items via addToFavorites', async () => {
    // Pre-seed storage with 500 colleges
    const stored = Array.from({ length: 500 }, (_, i) => makeCollege(`CODE${i}`));
    mockedGetItem.mockResolvedValueOnce(JSON.stringify(stored));

    const { result } = renderHook(() => useSession(), { wrapper });
    await act(async () => {});

    expect(result.current.favorites).toHaveLength(500);

    // Attempt to add a 501st
    await act(async () => {
      result.current.addToFavorites(makeCollege('CODE_OVERFLOW'));
    });

    expect(result.current.favorites).toHaveLength(500);
  });

  it('does not exceed 500 items via addManyToFavorites', async () => {
    const stored = Array.from({ length: 498 }, (_, i) => makeCollege(`CODE${i}`));
    mockedGetItem.mockResolvedValueOnce(JSON.stringify(stored));

    const { result } = renderHook(() => useSession(), { wrapper });
    await act(async () => {});

    // Add 5 new ones — only 2 should fit
    await act(async () => {
      result.current.addManyToFavorites([
        makeCollege('NEW1'),
        makeCollege('NEW2'),
        makeCollege('NEW3'),
        makeCollege('NEW4'),
        makeCollege('NEW5'),
      ]);
    });

    expect(result.current.favorites).toHaveLength(500);
  });

  it('enforces max cap on data loaded from storage that exceeded the old limit', async () => {
    // Simulate storage from an older version that had 600 items
    const stored = Array.from({ length: 600 }, (_, i) => makeCollege(`CODE${i}`));
    mockedGetItem.mockResolvedValueOnce(JSON.stringify(stored));

    const { result } = renderHook(() => useSession(), { wrapper });
    await act(async () => {});

    expect(result.current.favorites).toHaveLength(500);
  });
});
