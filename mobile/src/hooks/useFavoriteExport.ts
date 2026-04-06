import { useState } from 'react';
import { exportCsv, exportWord } from '@/api/client';
import type { CollegeDetail } from '@/types';

export function useFavoriteExport() {
  const [exporting, setExporting] = useState<'csv' | 'word' | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExportCsv = async (colleges: CollegeDetail[]) => {
    setExporting('csv');
    setExportError(null);
    try {
      await exportCsv(colleges);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  const handleExportWord = async (colleges: CollegeDetail[]) => {
    setExporting('word');
    setExportError(null);
    try {
      await exportWord(colleges);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  return { exporting, exportError, handleExportCsv, handleExportWord };
}
