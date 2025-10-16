'use client';
import { useData } from '@/contexts/DataContext'; // 1. Import our custom hook
import BottomNav from '@/components/BottomNav';
import { ArrowClockwise } from 'phosphor-react';
import HistoryCard from '@/components/HistoryCard';

export default function HistoryPage() {
  // 2. Get data and loading state directly from the global cache
  const { ratings, loading } = useData();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-pastel-beige">
        <ArrowClockwise size={48} className="animate-spin" />
      </div>
    );
  }

  return (
    <main className="bg-pastel-beige min-h-screen">
      <div className="max-w-sm mx-auto p-4 pb-24">
        <h1 className="boldonse-regular text-2xl font-bold uppercase text-black mb-1">History</h1>
        
        {ratings.length === 0 && !loading && (
          <p className="text-center text-slate-500 mt-8">You haven't rated any outfits yet.</p>
        )}
        
        <div className="space-y-6 mt-6">
          {/* 3. Render the ratings from the cache */}
          {ratings.map((rating, index) => (
            <HistoryCard 
              key={rating.id || index}
              imageUrl={rating.image_url}
              styleScore={rating.look_score} 
              styleName={rating.outfit_vibe} 
              colorScore={rating.color_score} 
            />
          ))}
        </div>
      </div>
      <BottomNav />
    </main>
  );
}