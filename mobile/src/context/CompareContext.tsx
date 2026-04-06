import React, { createContext, useContext, useState } from 'react';
import type { CollegeDetail } from '@/types';

const MAX_COMPARE = 5;

interface CompareContextValue {
  compareList: CollegeDetail[];
  addToCompare: (college: CollegeDetail) => void;
  removeFromCompare: (code: string) => void;
  clearCompare: () => void;
  isInCompare: (code: string) => boolean;
  isFull: () => boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareList, setCompareList] = useState<CollegeDetail[]>([]);

  const addToCompare = (college: CollegeDetail) =>
    setCompareList((prev) => {
      if (prev.length >= MAX_COMPARE) return prev;
      if (prev.some((c) => c.code === college.code)) return prev;
      return [...prev, college];
    });

  const removeFromCompare = (code: string) =>
    setCompareList((prev) => prev.filter((c) => c.code !== code));

  const clearCompare = () => setCompareList([]);

  const isInCompare = (code: string) => compareList.some((c) => c.code === code);

  const isFull = () => compareList.length >= MAX_COMPARE;

  return (
    <CompareContext.Provider
      value={{ compareList, addToCompare, removeFromCompare, clearCompare, isInCompare, isFull }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}
