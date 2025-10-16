"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/contexts/DataContext';
import { logOut } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';
import ProfileSectionCard from '@/components/ProfileSectionCard';
import ProfileStatBar from '@/components/ProfileStatBar';
import { DotsThreeVertical, ArrowClockwise } from 'phosphor-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, stats, loading } = useData();

  const handleLogout = async () => {
    await logOut();
    router.push('/login');
  };
  
  const styleFrequencyArray = stats ? Object.entries(stats.styleFrequency)
    .map(([name, count]) => ({
      name,
      value: Math.round((count / stats.totalRatings) * 100),
    }))
    .sort((a, b) => b.value - a.value) : [];

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-screen bg-pastel-beige">
        <ArrowClockwise size={48} className="animate-spin" />
      </div>
    );
  }

  // DEFINITIVE FIX: This logic robustly finds the name and avatar
  // It checks the custom data from email sign-up first, then falls back to Google's data.
  const displayName = user.user_metadata.display_name || user.user_metadata.full_name || user.email;
  const avatarUrl = user.user_metadata.avatar_url || "https://i.ibb.co/QjGz5S3/avatar.png";

  return (
    <main className="bg-pastel-beige min-h-screen">
      <div className="max-w-sm mx-auto p-4 pb-24 space-y-8">
        
        <div className="w-full bg-white rounded-full border-2 border-black shadow-[4px_4px_0px_#000000] flex items-center p-2 space-x-4">
          <div className="w-16 h-16 rounded-full border-2 border-black overflow-hidden flex-shrink-0">
             {/* The img tag now uses our robust avatarUrl variable */}
             <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          </div>
          <div className="flex-grow min-w-0">
            {/* The h1 tag now uses our robust displayName variable */}
            <h1 className="text-2xl font-bold text-slate-900 truncate">{displayName}</h1>
            <p className="text-sm text-slate-500">3 Credits left</p>
          </div>
          <button className="p-2">
            <DotsThreeVertical size={28} weight="bold" />
          </button>
        </div>

        {stats && (
          <>
            <ProfileSectionCard title="Your Activity">
              <ProfileStatBar label="Overall style" value={stats.averageStyleScore} />
              <ProfileStatBar label="Color Harmony" value={stats.averageColorScore} />
            </ProfileSectionCard>
            {styleFrequencyArray.length > 0 && (
              <ProfileSectionCard title="Style Frequency">
                {styleFrequencyArray.map(style => (
                  <ProfileStatBar key={style.name} label={style.name} value={style.value} displayAsPercent={true} />
                ))}
              </ProfileSectionCard>
            )}
          </>
        )}
        
        <div className="pt-2">
           <button onClick={handleLogout} className="w-full bg-[#2564EB] text-white font-semibold py-3 rounded-full border-2 border-black shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
            LOG OUT
          </button>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}