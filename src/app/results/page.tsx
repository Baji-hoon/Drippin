'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { saveOutfitResult } from '@/lib/supabase';
import { useData } from '@/contexts/DataContext';
import { ArrowClockwise, Lightbulb } from 'phosphor-react';
import toast from 'react-hot-toast';

// Define interface for result
interface OutfitResult {
  imageUrl: string;
  outfit_vibe: string;
  look_score: number;
  look_comment: string;
  color_score: number;
  color_comment: string;
  suggestions?: string[];
  observations?: string;
}

const ResultCard = ({ title, score, comment }: { title: string, score?: number, comment: string }) => {
  if (!score) return null;
  const percentage = score * 10;
  return (
    <div className="bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_#000000] p-5">
      <div className="flex justify-between items-baseline mb-1">
        <h3 className="text-lg font-bold text-gray-700 uppercase">{title}</h3>
        <p className="text-xl font-bold text-blue-600">{score.toFixed(1)}</p>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
      </div>
      <p className="text-sm text-gray-600 mt-2">{comment}</p>
    </div>
  );
};

const SuggestionsCard = ({ suggestions }: { suggestions: string[] }) => {
  if (!suggestions || suggestions.length === 0) return null;
  return (
    <div className="bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_#000000] p-5">
      <div className="flex items-center mb-2">
        <Lightbulb size={20} className="text-yellow-500 mr-2" weight="bold" />
        <h3 className="text-lg font-bold text-gray-700 uppercase">Suggestions</h3>
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
  const [result, setResult] = useState<OutfitResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const storedResult = sessionStorage.getItem('outfitResult');
    if (storedResult) {
      const parsedResult = JSON.parse(storedResult);
      console.log('Loaded result:', parsedResult); // Debug: Log result
      setResult(parsedResult);
    } else {
      toast.error("No outfit data available.");
      router.push('/');
    }
  }, [router]);

  const retry = async (fn: () => Promise<any>, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * 2 ** i));
      }
    }
  };

  useEffect(() => {
    if (!result) return;

    const saveResult = async () => {
      setIsSaving(true);

      // Validate required fields
      const requiredFields = ['imageUrl', 'outfit_vibe', 'look_score', 'look_comment', 'color_score', 'color_comment'];
      const missingFields = requiredFields.filter(field => result[field as keyof OutfitResult] === undefined || result[field as keyof OutfitResult] === null);
      if (missingFields.length > 0) {
        console.error("Missing required fields:", missingFields);
        toast.error(`Missing required fields: ${missingFields.join(', ')}`);
        setIsSaving(false);
        return;
      }

      // Validate imageUrl
      if (!result.imageUrl || !result.imageUrl.startsWith('blob:') && !result.imageUrl.match(/^https?:\/\//)) {
        console.error("Invalid imageUrl:", result.imageUrl);
        toast.error("Invalid image URL. Please try again.");
        setIsSaving(false);
        return;
      }

      // Optimistic Update
      const optimisticResult = {
        id: Date.now(),
        ...result,
        image_url: result.imageUrl,
        created_at: new Date().toISOString(),
      };
      addOptimisticRating(optimisticResult);

      // Background save with retry
      try {
        await retry(() =>
          saveOutfitResult({
            imageUrl: result.imageUrl,
            outfit_vibe: result.outfit_vibe,
            look_score: result.look_score,
            look_comment: result.look_comment,
            color_score: result.color_score,
            color_comment: result.color_comment,
            suggestions: result.suggestions || [],
            observations: result.observations || '',
            image_url: result.imageUrl,
          })
        );
        toast.success("Outfit saved successfully!");
      } catch (error: any) {
        console.error("Failed to save result in background:", {
          error: error, // Log raw error
          message: error.message || "Unknown error",
          code: error.code || "No code",
          details: error.details || "No details",
          stack: error.stack || "No stack trace",
          result: result, // Log input data for debugging
        });
        toast.error("Failed to save outfit. It has been saved locally and will retry later.");
        localStorage.setItem('failedOutfitResult', JSON.stringify(result));
      } finally {
        sessionStorage.removeItem('outfitResult');
        setIsSaving(false);
      }
    };

    saveResult();
  }, [result]);

  if (!result) {
    return <div className="flex items-center justify-center h-screen bg-pastel-beige"><ArrowClockwise size={48} className="animate-spin"/></div>;
  }

  return (
    <main>
      <div className="flex justify-center items-start min-h-screen p-4 py-10 pb-24">
        <div className="w-full max-w-sm bg-white rounded-2xl border-2 border-black shadow-[6px_6px_0px_#000000] p-5">
          <div className="w-full h-auto rounded-xl border-2 border-black overflow-hidden mb-5">
            <img src={result.imageUrl} alt="Rated Outfit" className="w-full h-full object-cover" />
          </div>
          <div id="resultSection" className="space-y-6">
            <div className="text-center">
              <p className="text-gray-500 text-sm uppercase tracking-wider">Style Analysis</p>
              <h2 className="boldonse-regular text-2xl font-bold text-gray-800 capitalize">{result.outfit_vibe}</h2>
            </div>
            <div className="space-y-4">
              <ResultCard title="LOOK" score={result.look_score} comment={result.look_comment} />
              <ResultCard title="COLOR" score={result.color_score} comment={result.color_comment} />
              <SuggestionsCard suggestions={result.suggestions || []} />
              <div>
                <p className="text-xs text-gray-500 italic mt-4 text-center">{result.observations}</p>
              </div>
            </div>
          </div>
          <div className="space-y-3 pt-6">
            <Link href="/" className="block">
              <button
                className="w-full bg-[#2564EB] text-white font-semibold py-3 rounded-full border-2 border-black shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50"
                disabled={isSaving}
              >
                GO BACK
              </button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return <Suspense><ResultsComponent /></Suspense>;
}