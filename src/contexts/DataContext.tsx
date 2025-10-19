'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChange, getUserRatings, calculateUserStats } from '@/lib/supabase';
import type { User } from '@/lib/supabase';
import type { OutfitResult } from '@/lib/types';

// Define the shape of our cache
// FIXED: Define a specific type for our user stats to replace 'any'
interface UserStats {
  totalRatings: number;
  averageStyleScore: number;
  averageColorScore: number;
  styleFrequency: Record<string, number>;
}
// Update the context type to use our new UserStats interface
interface DataContextType {
  user: User | null;
  ratings: OutfitResult[];
  stats: UserStats | null; // Use the specific type here
  loading: boolean;
  addOptimisticRating: (newRating: OutfitResult) => void;
  updateRatingAfterSave: (
    tempId: number,
    saved: { id: number; image_url: string; created_at: string }
  ) => void;
}
const DataContext = createContext<DataContextType | undefined>(undefined);
export function DataProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ratings, setRatings] = useState<OutfitResult[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null); // Use the specific type here
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async () => {
    try {
      const userRatings = await getUserRatings();
      const calculatedStats = calculateUserStats(userRatings);
      setRatings(userRatings);
      setStats(calculatedStats);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const subscription = onAuthStateChange(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchUserData();
      } else {
        setUser(null);
        setRatings([]);
        setStats(null);
      }
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, [fetchUserData]); // Added missing dependency

  // Memoize to provide a stable reference and avoid re-running consumers' effects unnecessarily
  const addOptimisticRating = useCallback((rating: OutfitResult) => {
    setRatings(prev => [rating, ...prev]);
  }, []);

  const updateRatingAfterSave = useCallback(
    (tempId: number, saved: { id: number; image_url: string; created_at: string }) => {
      setRatings(prev =>
        prev.map(r =>
          r.id === tempId ? { ...r, id: saved.id, image_url: saved.image_url, created_at: saved.created_at } : r
        )
      );
    },
    []
  );

  const value = { user, ratings, stats, loading, addOptimisticRating, updateRatingAfterSave };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}