import { createContext, useContext, useState, useCallback } from 'react';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [favorites, setFavorites] = useState([]);

  const addToFavorites = useCallback((college) => {
    setFavorites((prev) => {
      const exists = prev.some((c) => c.code === college.code);
      if (exists) return prev;
      return [...prev, college];
    });
  }, []);

  const addManyToFavorites = useCallback((colleges) => {
    setFavorites((prev) => {
      const existingCodes = new Set(prev.map((c) => c.code));
      const newOnes = colleges.filter((c) => !existingCodes.has(c.code));
      return [...prev, ...newOnes];
    });
  }, []);

  const removeFromFavorites = useCallback((code) => {
    setFavorites((prev) => prev.filter((c) => c.code !== code));
  }, []);

  const clearFavorites = useCallback(() => setFavorites([]), []);

  const reorderFavorites = useCallback((fromIdx, toIdx) => {
    setFavorites((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }, []);

  const updateFavoritesCourses = useCallback((code, selectedCourses) => {
    setFavorites((prev) =>
      prev.map((f) => f.code === code ? { ...f, selectedCourses } : f)
    );
  }, []);

  return (
    <SessionContext.Provider value={{ favorites, addToFavorites, addManyToFavorites, removeFromFavorites, clearFavorites, reorderFavorites, updateFavoritesCourses }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
