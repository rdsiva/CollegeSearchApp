import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CollegeDetail } from '@/types';

const STORAGE_KEY = 'tn_college_favorites';
const MAX_FAVORITES = 500; // L2: prevent unbounded storage growth

interface SessionContextValue {
  favorites: CollegeDetail[];
  addToFavorites: (college: CollegeDetail) => void;
  addManyToFavorites: (colleges: CollegeDetail[]) => void;
  removeFromFavorites: (code: string) => void;
  clearFavorites: () => void;
  isFavorite: (code: string) => boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<CollegeDetail[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        // L1: validate parsed value is an array before trusting it
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Enforce max cap in case storage grew beyond limit on an older version
          setFavorites((parsed as CollegeDetail[]).slice(0, MAX_FAVORITES));
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favorites)).catch(() => {});
  }, [favorites, loaded]);

  const addToFavorites = (college: CollegeDetail) =>
    setFavorites((prev) => {
      if (prev.some((f) => f.code === college.code)) return prev;
      if (prev.length >= MAX_FAVORITES) return prev; // L2: enforce cap
      return [...prev, college];
    });

  const addManyToFavorites = (colleges: CollegeDetail[]) =>
    setFavorites((prev) => {
      const existingCodes = new Set(prev.map((f) => f.code));
      const newOnes = colleges.filter((c) => !existingCodes.has(c.code));
      const combined = [...prev, ...newOnes];
      return combined.slice(0, MAX_FAVORITES); // L2: enforce cap
    });

  const removeFromFavorites = (code: string) =>
    setFavorites((prev) => prev.filter((f) => f.code !== code));

  const clearFavorites = () => setFavorites([]);
  const isFavorite = (code: string) => favorites.some((f) => f.code === code);

  return (
    <SessionContext.Provider
      value={{ favorites, addToFavorites, addManyToFavorites, removeFromFavorites, clearFavorites, isFavorite }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
