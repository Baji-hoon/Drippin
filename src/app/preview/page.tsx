'use client';
import { useState, Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowClockwise } from 'phosphor-react';
import { blobUrlToFile, fileToBase64 } from '@/lib/utils'; // Assuming utils.ts exists

const fashionTips = [
  "Balance is key. Pair baggy items with something more fitted.",
  "A great fit is more important than a brand name.",
  "Good shoes can make or break an entire outfit.",
  "Don't be afraid to experiment with color and texture.",
  "Confidence is your best accessory."
];

// This function can remain as it is, it's not part of the problem.
const rateOutfitWithGemini = async (uploadedFile: File) => {
    const base64Image = await fileToBase64(uploadedFile);
    const response = await fetch('/api/rate-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image, mimeType: uploadedFile.type }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to get rating from API');
    }
    return result.rating;
};

function PreviewComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // --- ROBUST STATE MANAGEMENT ---
  // We introduce a 'status' to explicitly track our progress.
  const [status, setStatus] = useState<'INITIALIZING' | 'FOUND' | 'NOT_FOUND'>('INITIALIZING');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tip, setTip] = useState(fashionTips[0]);

  // This is the definitive fix for the race condition.
const didInit = useRef(false);

useEffect(() => {
  if (didInit.current) return;

  // Check the URL first (for file uploads)
  const urlImage = searchParams.get('imageUrl');
  if (urlImage) {
    setImageUrl(urlImage);
    setStatus('FOUND');
    didInit.current = true;
    return;
  }

  // If no URL image, check sessionStorage (for camera snaps)
  const capturedImage = sessionStorage.getItem('capturedImage');
  if (capturedImage) {
    setImageUrl(capturedImage);
    sessionStorage.removeItem('capturedImage');
    setStatus('FOUND');
    didInit.current = true;
    return;
  }

  // ONLY if neither source has an image after checking both, we declare it NOT_FOUND.
  setStatus('NOT_FOUND');
  didInit.current = true;

}, [searchParams]); // This effect only needs to run when searchParams are ready.


  // A separate effect handles the redirect based on the final status.
  useEffect(() => {
    if (status === 'NOT_FOUND') {
      router.replace('/');
    }
  }, [status, router]);


  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setTip(fashionTips[Math.floor(Math.random() * fashionTips.length)]);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleRateMyDrip = async () => {
    if (!imageUrl) return;
    setIsLoading(true);
    setError(null);
    try {
      const file = await blobUrlToFile(imageUrl, 'outfit.jpg');
      const result = await rateOutfitWithGemini(file);
      const outfitResult = { imageUrl, ...result };
      sessionStorage.setItem('outfitResult', JSON.stringify(outfitResult));
      router.push('/results');
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleCancel = () => router.back();

  // If we are still initializing or about to redirect, show a spinner.
  if (status !== 'FOUND' || !imageUrl) {
    return (
        <div className="flex items-center justify-center h-screen bg-pastel-beige">
            <ArrowClockwise size={48} className="animate-spin"/>
        </div>
    );
  }

  // Only render the full page when status is definitively 'FOUND'.
  return (
    <main style={{ height: '100dvh' }} className="flex items-center justify-center p-4">
      <div className="w-full max-w-sm h-full grid grid-rows-[1fr_auto] bg-white rounded-2xl border-2 border-black shadow-[8px_8px_0px_#000000] overflow-hidden">
        <div className="relative min-h-0">
          <img src={imageUrl} alt="Outfit Preview" className="w-full h-full object-cover" />
          {isLoading && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center text-white p-4 text-center">
              <ArrowClockwise size={48} className="animate-spin mb-4" />
              <p className="text-lg font-semibold mb-2">Analyzing your drip...</p>
              <p className="text-sm italic transition-opacity duration-500">"{tip}"</p>
            </div>
          )}
        </div>
        
        {!isLoading && (
          <div className="p-4 space-y-3">
            {error && <p className="text-red-500 text-center text-sm mb-2">{error}</p>}
            <button onClick={handleRateMyDrip} className="w-full bg-[#2564EB] text-white font-semibold py-3 rounded-full border-2 border-black shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
              RATE MY DRIP
            </button>
            <button onClick={handleCancel} className="w-full bg-white/50 backdrop-blur-md text-black font-semibold py-3 rounded-full border-2 border-black shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
              CANCEL
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-pastel-beige"><ArrowClockwise size={48} className="animate-spin"/></div>}>
      <PreviewComponent />
    </Suspense>
  );
}