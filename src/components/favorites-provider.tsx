"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface FavoriteItem {
  id: number;
  name: string;
  price: number;
  photo?: string | null;
  brand?: string | null;
  model?: string | null;
  grade?: string | null;
  color?: string | null;
  sku?: string | null;
  addedAt: string;
}

export interface FavoritesContextType {
  favorites: FavoriteItem[];
  isFavorite: (id: number) => boolean;
  toggleFavorite: (item: Omit<FavoriteItem, "addedAt">) => void;
  removeFavorite: (id: number) => void;
  clearFavorites: () => void;
  favoritesCount: number;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

const STORAGE_KEY = "etjoaigi_favorites";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to load favorites from localStorage", e);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.warn("Failed to save favorites to localStorage", e);
    }
  }, [favorites, hydrated]);

  const isFavorite = (id: number) => {
    return favorites.some((f) => f.id === id);
  };

  const toggleFavorite = (item: Omit<FavoriteItem, "addedAt">) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === item.id);
      if (exists) {
        return prev.filter((f) => f.id !== item.id);
      }
      return [
        {
          ...item,
          addedAt: new Date().toISOString(),
        },
        ...prev,
      ];
    });
  };

  const removeFavorite = (id: number) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        removeFavorite,
        clearFavorites,
        favoritesCount: favorites.length,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

const defaultFavoritesContext: FavoritesContextType = {
  favorites: [],
  isFavorite: () => false,
  toggleFavorite: () => {},
  removeFavorite: () => {},
  clearFavorites: () => {},
  favoritesCount: 0,
};

export function useFavorites() {
  const context = useContext(FavoritesContext);
  return context ?? defaultFavoritesContext;
}
