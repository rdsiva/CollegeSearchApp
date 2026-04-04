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

  return (
    <SessionContext.Provider value={{ favorites, addToFavorites, addManyToFavorites, removeFromFavorites, clearFavorites }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
