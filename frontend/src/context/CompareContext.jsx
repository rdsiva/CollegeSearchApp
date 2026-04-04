import { createContext, useContext, useState } from 'react';

const CompareContext = createContext(null);

const MAX = 5;

export function CompareProvider({ children }) {
  const [compareList, setCompareList] = useState([]);
  const [showModal, setShowModal] = useState(false);

  function addToCompare(college) {
    setCompareList((prev) => {
      if (prev.some((c) => c.code === college.code)) return prev;
      if (prev.length >= MAX) return prev;
      return [...prev, college];
    });
  }

  function removeFromCompare(code) {
    setCompareList((prev) => prev.filter((c) => c.code !== code));
  }

  function clearCompare() {
    setCompareList([]);
    setShowModal(false);
  }

  function isInCompare(code) {
    return compareList.some((c) => c.code === code);
  }

  function isFull() {
    return compareList.length >= MAX;
  }

  return (
    <CompareContext.Provider value={{
      compareList, showModal, setShowModal,
      addToCompare, removeFromCompare, clearCompare,
      isInCompare, isFull, MAX,
    }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  return useContext(CompareContext);
}
