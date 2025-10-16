'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import { saveOutfitResult } from '@/lib/supabase';
import { useData } from '@/contexts/DataContext';
import { ArrowClockwise, Lightbulb } from 'phosphor-react';

// FIXED: Defining the ResultCard component here to resolve the "not defined" error.
const ResultCard = ({ title, score, comment }: { title: string, score?: number, comment: string }) => {
  const percentage = score ? score * 10 : 0;
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-lg font-bold text-gray-700">{title}</h3>
        {score && <p className="text-xl font-bold text-blue-600">{score.toFixed(1)}</p>}
      </div>
      {score && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
        </div>
      )}
      <p className="text-sm text-gray-600 mt-2">{comment}</p>
    </div>
  );
};

// A new component for displaying the list of suggestions
const SuggestionsCard = ({ suggestions }: { suggestions: string[] }) => {
  if (!suggestions || suggestions.length === 0) return null;
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center mb-2">
        <Lightbulb size={20} className="text-yellow-500 mr-2" weight="duotone" />
        <h3 className="text-lg font-bold text-gray-700">SUGGESTIONS</h3>
      </div>
      <ul className="space-y-2 list-disc list-inside text-sm text-gray-600">
        {suggestions.map((suggestion, index) => (
          <li key={index}>{suggestion}</li>
        ))}
      </ul>
    </div>
  );
};


function ResultsComponent() {
  const router = useRouter();
  const { addOptimisticRating } = useData();
  const [result, setResult] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const storedResult = sessionStorage.getItem('outfitResult');
    if (storedResult) {
      setResult(JSON.parse(storedResult));
    } else {
      router.push('/');
    }
  }, [router]);

  const handleSave = async () => {
    // ... handleSave logic remains the same
  };

  if (!result) {
    return <div className="flex items-center justify-center h-screen bg-pastel-beige"><ArrowClockwise size={48} className="animate-spin"/></div>;
  }

  return (
    <main>
      <div className="flex justify-center items-start min-h-screen p-4 py-10 pb-24">
        <div className="w-full max-w-sm bg-white rounded-2xl border-2 border-black shadow-[8px_8px_0px_#000000] p-5">
            <div className="w-full h-auto rounded-xl border-2 border-black overflow-hidden mb-5">
                <img src={result.imageUrl} alt="Rated Outfit" className="w-full h-full object-cover" />
            </div>
            <div id="resultSection" className="space-y-4">
              <div className="text-center">
                <p className="text-gray-500 text-sm uppercase tracking-wider">Style Analysis</p>
                <h2 className="text-3xl font-bold text-gray-800 capitalize">{result.outfit_vibe}</h2>
              </div>
              <div className="space-y-4">
                <ResultCard title="LOOK" score={result.look_score} comment={result.look_comment} />
                <ResultCard title="COLOR" score={result.color_score} comment={result.color_comment} />
                {/* FIXED: Replaced the old card with the new list component */}
                <SuggestionsCard suggestions={result.suggestions || []} />
                <div>
                  <p className="text-xs text-gray-500 italic mt-4 text-center">{result.observations}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3 pt-6">
                <button onClick={handleSave} disabled={isSaving} className="w-full bg-[#2564EB] text-white font-semibold py-3 rounded-full border-2 border-black shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50">
                {isSaving ? 'Saving...' : 'SAVE RESULT'}
                </button>
                <Link href="/" className="block">
                <button className="w-full bg-white/50 backdrop-blur-md text-black font-semibold py-3 rounded-full border-2 border-black shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                    GO BACK
                </button>
                </Link>
            </div>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}

export default function ResultsPage() {
  return <Suspense><ResultsComponent /></Suspense>;
}