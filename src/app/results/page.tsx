'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { saveOutfitResult } from '@/lib/supabase';
import { blobUrlToFile } from '@/lib/utils';
import { useData } from '@/contexts/DataContext';
import { ArrowClockwise, Lightbulb } from 'phosphor-react';
import toast from 'react-hot-toast';
import type { OutfitResult, LocalOutfitResult } from '@/lib/types';

const ResultCard = ({ title, score, comment }: { title: string; score?: number; comment: string }) => {
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
  const { addOptimisticRating, updateRatingAfterSave, user, loading } = useData();
  const [result, setResult] = useState<LocalOutfitResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const hasSavedRef = useRef(false);
  const optimisticAddedRef = useRef(false);

  const PENDING_KEY = 'pendingOutfitResults';
  const enqueuePending = (item: LocalOutfitResult) => {
    try {
      const list: LocalOutfitResult[] = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
      list.push(item);
      localStorage.setItem(PENDING_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to enqueue pending outfit result', e);
    }
  };
  const dequeueAllPending = (): LocalOutfitResult[] => {
    try {
      const list: LocalOutfitResult[] = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
      localStorage.removeItem(PENDING_KEY);
      return Array.isArray(list) ? list : [];
    } catch {
      localStorage.removeItem(PENDING_KEY);
      return [];
    }
  };

  useEffect(() => {
    const storedResult = sessionStorage.getItem('outfitResult');
    if (storedResult) {
      try {
        const parsedResult = JSON.parse(storedResult) as LocalOutfitResult;
        setResult(parsedResult);
      } catch (e) {
        console.error('Failed to parse result from session storage', e);
        router.push('/');
      }
    } else {
      router.push('/');
    }
  }, [router]);

  const retry = async <T,>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
    let lastError: unknown;
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i === retries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, delay * 2 ** i));
      }
    }
  throw lastError as unknown as Error;
  };

  const ensureDataUrl = async (src: string): Promise<string> => {
    if (src.startsWith('data:')) return src;
    if (src.startsWith('blob:')) {
      const file = await blobUrlToFile(src, 'outfit.jpg');
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      return dataUrl;
    }
    return src;
  };

  useEffect(() => {
    if (!result) return;
    if (loading || !user) return;
    if (hasSavedRef.current) return;
    hasSavedRef.current = true;

    const createOptimistic = (r: LocalOutfitResult): OutfitResult => ({
      id: Date.now(),
      image_url: r.imageUrl,
      created_at: new Date().toISOString(),
      outfit_vibe: r.outfit_vibe,
      look_score: r.look_score,
      look_comment: r.look_comment,
      color_score: r.color_score,
      color_comment: r.color_comment,
      suggestions: r.suggestions || [],
      observations: r.observations || '',
    });

    const persist = async () => {
      setIsSaving(true);
      try {
  // Use the imageUrl as-is (Preview normalizes to data URL). Avoid fetching blob URLs here to prevent console GET errors.
  const imageDataUrl = result.imageUrl;
  setResult((prev) => (prev ? { ...prev, imageUrl: imageDataUrl } : prev));
  try {
          const current = sessionStorage.getItem('outfitResult');
          if (current) {
            const parsed = JSON.parse(current as string);
            parsed.imageUrl = imageDataUrl;
            sessionStorage.setItem('outfitResult', JSON.stringify(parsed));
          }
        } catch {}

        let tempId: number | null = null;
        if (!optimisticAddedRef.current) {
          optimisticAddedRef.current = true;
          const optimistic = createOptimistic({ ...result, imageUrl: imageDataUrl });
          tempId = optimistic.id;
          addOptimisticRating(optimistic);
        }

        const saved = await retry(() =>
          saveOutfitResult({
            image_url: imageDataUrl,
            outfit_vibe: result.outfit_vibe,
            look_score: result.look_score,
            look_comment: result.look_comment,
            color_score: result.color_score,
            color_comment: result.color_comment,
            suggestions: result.suggestions || [],
            observations: result.observations || '',
          })
        );

        if (saved && saved.image_url) {
          setResult((prev) => (prev ? { ...prev, imageUrl: saved.image_url } : prev));
          if (tempId != null) updateRatingAfterSave(tempId, saved);
        }
        toast.success('Outfit saved successfully!');
        sessionStorage.removeItem('outfitResult');
      } catch (error: unknown) {
        let message = 'Unknown error';
        let code = 'No code';
        let details = 'No details';
        let stack = 'No stack trace';
        if (typeof error === 'object' && error !== null) {
          message = (error as { message?: string }).message ?? message;
          code = (error as { code?: string }).code ?? code;
          details = (error as { details?: string }).details ?? details;
          stack = (error as { stack?: string }).stack ?? stack;
        }
        console.error('Failed to save result in background:', {
          error,
          message,
          code,
          details,
          stack,
          result,
        });
        console.error('Save error details ->', message, code, details, stack);
        toast.error('Saving failed. Will retry automatically.');
        // Ensure we enqueue with data URL to avoid future blob errors
        const normalized: LocalOutfitResult = {
          ...result,
          imageUrl: result.imageUrl.startsWith('data:') ? result.imageUrl : (await ensureDataUrl(result.imageUrl)),
        };
        enqueuePending(normalized);
        sessionStorage.removeItem('outfitResult');
      } finally {
        setIsSaving(false);
      }
    };

    persist();
  }, [result, addOptimisticRating, updateRatingAfterSave, user, loading]);

  useEffect(() => {
    if (loading || !user) return;
    const flushPending = async () => {
      const pending = dequeueAllPending();
      for (const item of pending) {
        try {
          // If a stale blob URL slipped into the queue from an older version, skip converting it to avoid console fetch errors
          if (item.imageUrl.startsWith('blob:')) {
            enqueuePending(item);
            continue;
          }
          const imageDataUrl = item.imageUrl.startsWith('data:')
            ? item.imageUrl
            : await ensureDataUrl(item.imageUrl);

          await retry(() =>
            saveOutfitResult({
              image_url: imageDataUrl,
              outfit_vibe: item.outfit_vibe,
              look_score: item.look_score,
              look_comment: item.look_comment,
              color_score: item.color_score,
              color_comment: item.color_comment,
              suggestions: item.suggestions || [],
              observations: item.observations || '',
            })
          );
        } catch {
          enqueuePending(item);
          break;
        }
      }
    };

    flushPending();
    const onOnline = () => flushPending();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [user, loading]);

  if (!result) {
    return (
      <div className="flex items-center justify-center h-screen bg-pastel-beige">
        <ArrowClockwise size={48} className="animate-spin" />
      </div>
    );
  }

  return (
    <main>
      <div className="flex justify-center items-start min-h-screen p-4 py-10 pb-24">
        <div className="w-full max-w-sm bg-white rounded-2xl border-2 border-black shadow-[6px_6px_0px_#000000] p-5">
          <div className="w-full h-auto rounded-xl border-2 border-black overflow-hidden mb-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
          <div className="text-center mt-4">
            <p className="text-xs text-slate-600">
              MADE BY <a href="https://www.instagram.com/main.baji.hoon/" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-black">BAJI</a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense>
      <ResultsComponent />
    </Suspense>
  );
}