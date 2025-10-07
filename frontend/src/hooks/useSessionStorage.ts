import { useState, useEffect } from 'react';

interface UseSessionStorageReturn<T> {
  value: T;
  setValue: (value: T) => void;
  clearValue: () => void;
  hasValue: boolean;
}

export function useSessionStorage<T>(
  key: string,
  initialValue: T
): UseSessionStorageReturn<T> {
  // Get from session storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to sessionStorage
  const setValue = (value: T) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting sessionStorage key "${key}":`, error);
    }
  };

  // Clear the value from sessionStorage
  const clearValue = () => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error clearing sessionStorage key "${key}":`, error);
    }
  };

  // Check if there's a value in sessionStorage
  const hasValue = storedValue !== initialValue && Object.keys(storedValue as any).length > 0;

  return {
    value: storedValue,
    setValue,
    clearValue,
    hasValue,
  };
}
