/**
 * Tests for src/hooks/useFavoriteExport.ts
 *
 * Covers: handleExportCsv, handleExportWord, loading state transitions,
 *         error handling and error clearing on next attempt
 */

import { act, renderHook } from '@testing-library/react-native';
import { useFavoriteExport } from '@/hooks/useFavoriteExport';
import type { CollegeDetail } from '@/types';

// ---------- mocks ----------

jest.mock('@/api/client', () => ({
  exportCsv: jest.fn(),
  exportWord: jest.fn(),
}));

import { exportCsv, exportWord } from '@/api/client';

const mockedExportCsv = exportCsv as jest.Mock;
const mockedExportWord = exportWord as jest.Mock;

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

const colleges = [makeCollege('CE001'), makeCollege('CE002')];

// ---------- setup ----------

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================================
// Initial state
// ============================================================

describe('initial state', () => {
  it('starts with exporting null', () => {
    const { result } = renderHook(() => useFavoriteExport());
    expect(result.current.exporting).toBeNull();
  });

  it('starts with exportError null', () => {
    const { result } = renderHook(() => useFavoriteExport());
    expect(result.current.exportError).toBeNull();
  });
});

// ============================================================
// handleExportCsv
// ============================================================

describe('handleExportCsv', () => {
  it('calls exportCsv with the provided colleges', async () => {
    mockedExportCsv.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useFavoriteExport());

    await act(async () => {
      await result.current.handleExportCsv(colleges);
    });

    expect(mockedExportCsv).toHaveBeenCalledWith(colleges);
  });

  it('sets exporting to "csv" while the call is in progress', async () => {
    let resolveExport!: () => void;
    mockedExportCsv.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveExport = resolve;
        })
    );

    const { result } = renderHook(() => useFavoriteExport());

    // Start the export without awaiting
    act(() => {
      result.current.handleExportCsv(colleges);
    });

    // While pending, exporting should be 'csv'
    expect(result.current.exporting).toBe('csv');

    // Now resolve the export
    await act(async () => {
      resolveExport();
    });

    expect(result.current.exporting).toBeNull();
  });

  it('resets exporting to null after success', async () => {
    mockedExportCsv.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useFavoriteExport());

    await act(async () => {
      await result.current.handleExportCsv(colleges);
    });

    expect(result.current.exporting).toBeNull();
  });

  it('resets exporting to null after failure', async () => {
    mockedExportCsv.mockRejectedValueOnce(new Error('Export failed'));

    const { result } = renderHook(() => useFavoriteExport());

    await act(async () => {
      await result.current.handleExportCsv(colleges);
    });

    expect(result.current.exporting).toBeNull();
  });

  it('sets exportError when exportCsv throws', async () => {
    mockedExportCsv.mockRejectedValueOnce(new Error('Server down'));

    const { result } = renderHook(() => useFavoriteExport());

    await act(async () => {
      await result.current.handleExportCsv(colleges);
    });

    expect(result.current.exportError).toBe('Server down');
  });

  it('sets generic exportError for non-Error throws', async () => {
    mockedExportCsv.mockRejectedValueOnce('raw string error');

    const { result } = renderHook(() => useFavoriteExport());

    await act(async () => {
      await result.current.handleExportCsv(colleges);
    });

    expect(result.current.exportError).toBe('Export failed');
  });

  it('clears exportError on next export attempt', async () => {
    mockedExportCsv.mockRejectedValueOnce(new Error('First failure'));

    const { result } = renderHook(() => useFavoriteExport());

    await act(async () => {
      await result.current.handleExportCsv(colleges);
    });

    expect(result.current.exportError).not.toBeNull();

    // Second attempt succeeds
    mockedExportCsv.mockResolvedValueOnce(undefined);

    await act(async () => {
      await result.current.handleExportCsv(colleges);
    });

    expect(result.current.exportError).toBeNull();
  });
});

// ============================================================
// handleExportWord
// ============================================================

describe('handleExportWord', () => {
  it('calls exportWord with the provided colleges', async () => {
    mockedExportWord.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useFavoriteExport());

    await act(async () => {
      await result.current.handleExportWord(colleges);
    });

    expect(mockedExportWord).toHaveBeenCalledWith(colleges);
  });

  it('sets exporting to "word" while the call is in progress', async () => {
    let resolveExport!: () => void;
    mockedExportWord.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveExport = resolve;
        })
    );

    const { result } = renderHook(() => useFavoriteExport());

    act(() => {
      result.current.handleExportWord(colleges);
    });

    expect(result.current.exporting).toBe('word');

    await act(async () => {
      resolveExport();
    });

    expect(result.current.exporting).toBeNull();
  });

  it('resets exporting to null after success', async () => {
    mockedExportWord.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useFavoriteExport());

    await act(async () => {
      await result.current.handleExportWord(colleges);
    });

    expect(result.current.exporting).toBeNull();
  });

  it('resets exporting to null after failure', async () => {
    mockedExportWord.mockRejectedValueOnce(new Error('Disk full'));

    const { result } = renderHook(() => useFavoriteExport());

    await act(async () => {
      await result.current.handleExportWord(colleges);
    });

    expect(result.current.exporting).toBeNull();
  });

  it('sets exportError when exportWord throws', async () => {
    mockedExportWord.mockRejectedValueOnce(new Error('Sharing unavailable'));

    const { result } = renderHook(() => useFavoriteExport());

    await act(async () => {
      await result.current.handleExportWord(colleges);
    });

    expect(result.current.exportError).toBe('Sharing unavailable');
  });

  it('sets generic exportError for non-Error throws', async () => {
    mockedExportWord.mockRejectedValueOnce(42);

    const { result } = renderHook(() => useFavoriteExport());

    await act(async () => {
      await result.current.handleExportWord(colleges);
    });

    expect(result.current.exportError).toBe('Export failed');
  });

  it('clears exportError on next export attempt', async () => {
    mockedExportWord.mockRejectedValueOnce(new Error('First failure'));

    const { result } = renderHook(() => useFavoriteExport());

    await act(async () => {
      await result.current.handleExportWord(colleges);
    });

    expect(result.current.exportError).not.toBeNull();

    mockedExportWord.mockResolvedValueOnce(undefined);

    await act(async () => {
      await result.current.handleExportWord(colleges);
    });

    expect(result.current.exportError).toBeNull();
  });
});

// ============================================================
// Cross-function: exporting state does not bleed between calls
// ============================================================

describe('exporting state isolation', () => {
  it('csv export calls exportCsv (not exportWord)', async () => {
    mockedExportCsv.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useFavoriteExport());

    await act(async () => {
      await result.current.handleExportCsv(colleges);
    });

    expect(mockedExportCsv).toHaveBeenCalledWith(colleges);
    expect(mockedExportWord).not.toHaveBeenCalled();
    // After completion, exporting must be null (not stuck on 'csv')
    expect(result.current.exporting).toBeNull();
  });

  it('word export calls exportWord (not exportCsv)', async () => {
    mockedExportWord.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useFavoriteExport());

    await act(async () => {
      await result.current.handleExportWord(colleges);
    });

    expect(mockedExportWord).toHaveBeenCalledWith(colleges);
    expect(mockedExportCsv).not.toHaveBeenCalled();
    // After completion, exporting must be null (not stuck on 'word')
    expect(result.current.exporting).toBeNull();
  });
});
