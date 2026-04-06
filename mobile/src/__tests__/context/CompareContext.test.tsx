/**
 * Tests for src/context/CompareContext.tsx
 *
 * Covers: addToCompare, duplicate prevention, max-5 cap,
 *         removeFromCompare, clearCompare, isInCompare, isFull
 */

import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { CompareProvider, useCompare } from '@/context/CompareContext';
import type { CollegeDetail } from '@/types';

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
  <CompareProvider>{children}</CompareProvider>
);

// ============================================================
// addToCompare
// ============================================================

describe('addToCompare', () => {
  it('adds a college and returns it in compareList', async () => {
    const { result } = renderHook(() => useCompare(), { wrapper });

    await act(async () => {
      result.current.addToCompare(makeCollege('CE001'));
    });

    expect(result.current.compareList).toHaveLength(1);
    expect(result.current.compareList[0].code).toBe('CE001');
  });

  it('adds multiple different colleges', async () => {
    const { result } = renderHook(() => useCompare(), { wrapper });

    await act(async () => {
      result.current.addToCompare(makeCollege('CE001'));
      result.current.addToCompare(makeCollege('CE002'));
      result.current.addToCompare(makeCollege('CE003'));
    });

    expect(result.current.compareList).toHaveLength(3);
  });
});

// ============================================================
// Duplicate prevention
// ============================================================

describe('duplicate prevention', () => {
  it('does not add the same college twice', async () => {
    const { result } = renderHook(() => useCompare(), { wrapper });

    await act(async () => {
      result.current.addToCompare(makeCollege('CE001'));
      result.current.addToCompare(makeCollege('CE001'));
    });

    expect(result.current.compareList).toHaveLength(1);
  });

  it('checks duplicates by code, not by reference', async () => {
    const { result } = renderHook(() => useCompare(), { wrapper });

    await act(async () => {
      result.current.addToCompare({ ...makeCollege('CE001'), name: 'Version A' });
      result.current.addToCompare({ ...makeCollege('CE001'), name: 'Version B' });
    });

    expect(result.current.compareList).toHaveLength(1);
    // First insertion wins
    expect(result.current.compareList[0].name).toBe('Version A');
  });
});

// ============================================================
// Max 5 cap
// ============================================================

describe('max 5 cap', () => {
  it('allows exactly 5 colleges', async () => {
    const { result } = renderHook(() => useCompare(), { wrapper });

    await act(async () => {
      for (let i = 1; i <= 5; i++) {
        result.current.addToCompare(makeCollege(`CE00${i}`));
      }
    });

    expect(result.current.compareList).toHaveLength(5);
    expect(result.current.isFull()).toBe(true);
  });

  it('rejects the 6th college — compareList stays at 5', async () => {
    const { result } = renderHook(() => useCompare(), { wrapper });

    await act(async () => {
      for (let i = 1; i <= 5; i++) {
        result.current.addToCompare(makeCollege(`CE00${i}`));
      }
    });

    await act(async () => {
      result.current.addToCompare(makeCollege('CE006'));
    });

    expect(result.current.compareList).toHaveLength(5);
    expect(result.current.compareList.map((c) => c.code)).not.toContain('CE006');
  });

  it('isFull returns false before reaching 5', async () => {
    const { result } = renderHook(() => useCompare(), { wrapper });

    await act(async () => {
      result.current.addToCompare(makeCollege('CE001'));
    });

    expect(result.current.isFull()).toBe(false);
  });
});

// ============================================================
// removeFromCompare
// ============================================================

describe('removeFromCompare', () => {
  it('removes a college by code', async () => {
    const { result } = renderHook(() => useCompare(), { wrapper });

    await act(async () => {
      result.current.addToCompare(makeCollege('CE001'));
      result.current.addToCompare(makeCollege('CE002'));
    });

    await act(async () => {
      result.current.removeFromCompare('CE001');
    });

    expect(result.current.compareList).toHaveLength(1);
    expect(result.current.compareList[0].code).toBe('CE002');
  });

  it('does nothing when removing a code not in the list', async () => {
    const { result } = renderHook(() => useCompare(), { wrapper });

    await act(async () => {
      result.current.addToCompare(makeCollege('CE001'));
    });

    await act(async () => {
      result.current.removeFromCompare('NONEXISTENT');
    });

    expect(result.current.compareList).toHaveLength(1);
  });

  it('allows adding after removing when previously full', async () => {
    const { result } = renderHook(() => useCompare(), { wrapper });

    await act(async () => {
      for (let i = 1; i <= 5; i++) {
        result.current.addToCompare(makeCollege(`CE00${i}`));
      }
    });

    await act(async () => {
      result.current.removeFromCompare('CE001');
    });

    await act(async () => {
      result.current.addToCompare(makeCollege('CE006'));
    });

    expect(result.current.compareList).toHaveLength(5);
    expect(result.current.compareList.map((c) => c.code)).toContain('CE006');
  });
});

// ============================================================
// clearCompare
// ============================================================

describe('clearCompare', () => {
  it('empties the compare list', async () => {
    const { result } = renderHook(() => useCompare(), { wrapper });

    await act(async () => {
      result.current.addToCompare(makeCollege('CE001'));
      result.current.addToCompare(makeCollege('CE002'));
    });

    await act(async () => {
      result.current.clearCompare();
    });

    expect(result.current.compareList).toHaveLength(0);
  });

  it('is safe to call on an already-empty list', async () => {
    const { result } = renderHook(() => useCompare(), { wrapper });

    await act(async () => {
      result.current.clearCompare();
    });

    expect(result.current.compareList).toHaveLength(0);
  });

  it('resets isFull to false after clearing', async () => {
    const { result } = renderHook(() => useCompare(), { wrapper });

    await act(async () => {
      for (let i = 1; i <= 5; i++) {
        result.current.addToCompare(makeCollege(`CE00${i}`));
      }
    });

    await act(async () => {
      result.current.clearCompare();
    });

    expect(result.current.isFull()).toBe(false);
  });
});

// ============================================================
// isInCompare
// ============================================================

describe('isInCompare', () => {
  it('returns true for a college that was added', async () => {
    const { result } = renderHook(() => useCompare(), { wrapper });

    await act(async () => {
      result.current.addToCompare(makeCollege('CE001'));
    });

    expect(result.current.isInCompare('CE001')).toBe(true);
  });

  it('returns false for a college that was not added', () => {
    const { result } = renderHook(() => useCompare(), { wrapper });
    expect(result.current.isInCompare('CE001')).toBe(false);
  });

  it('returns false after the college is removed', async () => {
    const { result } = renderHook(() => useCompare(), { wrapper });

    await act(async () => {
      result.current.addToCompare(makeCollege('CE001'));
    });

    await act(async () => {
      result.current.removeFromCompare('CE001');
    });

    expect(result.current.isInCompare('CE001')).toBe(false);
  });
});

// ============================================================
// isFull
// ============================================================

describe('isFull', () => {
  it('returns false when the list is empty', () => {
    const { result } = renderHook(() => useCompare(), { wrapper });
    expect(result.current.isFull()).toBe(false);
  });

  it('returns true at exactly 5 items', async () => {
    const { result } = renderHook(() => useCompare(), { wrapper });

    await act(async () => {
      for (let i = 1; i <= 5; i++) {
        result.current.addToCompare(makeCollege(`CE00${i}`));
      }
    });

    expect(result.current.isFull()).toBe(true);
  });

  it('returns false with 4 items', async () => {
    const { result } = renderHook(() => useCompare(), { wrapper });

    await act(async () => {
      for (let i = 1; i <= 4; i++) {
        result.current.addToCompare(makeCollege(`CE00${i}`));
      }
    });

    expect(result.current.isFull()).toBe(false);
  });
});
