'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChange, getUserRatings, calculateUserStats } from '@/lib/supabase';
import type { User, OutfitResult } from '@/lib/supabase';

// Define the shape of our cache
interface DataContextType {
  user: User | null;
  ratings: OutfitResult[];
  stats: any;
  loading: boolean;
  addOptimisticRating: (newRating: OutfitResult) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ratings, setRatings] = useState<OutfitResult[]>([]);
  const [stats, setStats] = useState(null);
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
  }, [fetchUserData]);

  // FIXED: This function now updates both ratings and stats for a complete optimistic update.
  const addOptimisticRating = (newRating: OutfitResult) => {
    // 1. Create the new, updated list of ratings
    const newRatings = [newRating, ...ratings];
    
    // 2. Immediately update the ratings state for the history page
    setRatings(newRatings);
    
    // 3. Immediately recalculate and update the stats for the profile page
    const newStats = calculateUserStats(newRatings);
    setStats(newStats);
  };

  const value = { user, ratings, stats, loading, addOptimisticRating };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}