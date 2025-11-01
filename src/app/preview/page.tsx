'use client';
import { useState, Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowClockwise } from 'phosphor-react';
import { blobUrlToFile, fileToBase64JpegDownscaled } from '@/lib/utils';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

const fashionTips = [
  "Balance is key. Pair baggy items with something more fitted.",
  "A great fit is more important than a brand name.",
  "Good shoes can make or break an entire outfit.",
  "Don't be afraid to experiment with color and texture.",
  "Confidence is your best accessory.",
  "The right accessories can elevate any look.",
  "When in doubt, go monochrome for a sleek appearance.",
  "Layering adds depth and interest to your outfit."
];

// --- PRODUCTION-LEVEL API CALL WITH RETRY LOGIC ---
interface RatingResult {
  look_score: number;
  color_score: number;
  outfit_vibe: string;
  overall_feedback: string;
  [key: string]: unknown;
}

const rateOutfitWithGemini = async (
  uploadedFile: File, 
  accessToken: string, 
  retries = 3
): Promise<RatingResult> => {
  const { base64, mimeType } = await fileToBase64JpegDownscaled(uploadedFile, 1024, 0.85);
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
      
      const response = await fetch('/api/rate-outfit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${accessToken}` 
        },
        body: JSON.stringify({ image: base64, mimeType }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const result = await response.json();
      
      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 401) {
          throw new Error('Authentication expired. Please log in again.');
        }
        if (response.status === 429) {
          throw new Error('Too many requests. Please try again in a moment.');
        }
        throw new Error(result.error || `API error: ${response.status}`);
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get rating from API');
      }
      
      return result.rating;
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorName = error instanceof Error ? error.name : '';
      
      // Don't retry on auth errors or client errors
      if (errorMessage.includes('Authentication') || 
          errorMessage.includes('401') ||
          errorName === 'AbortError') {
        throw error;
      }
      
      // Retry on network errors or server errors
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        continue;
      }
      
      throw error;
    }
  }
  
  throw new Error('Failed after multiple attempts');
};

function PreviewComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useData();
  
  // Simplified state management
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tip, setTip] = useState(fashionTips[0]);
  const [imageReady, setImageReady] = useState(false);
  
  const initRef = useRef(false);
  const processingRef = useRef(false);

  // Initialize image source
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    // Check URL params first (file uploads)
    const urlImage = searchParams.get('imageUrl');
    if (urlImage) {
      console.log('Image from URL params:', urlImage);
      setImageUrl(urlImage);
      return;
    }

    // Check sessionStorage (camera snaps)
    const capturedImage = sessionStorage.getItem('capturedImage');
    if (capturedImage) {
      console.log('Image from sessionStorage');
      setImageUrl(capturedImage);
      sessionStorage.removeItem('capturedImage'); // Clean up immediately
      return;
    }

    // No image found, redirect
    console.log('No image found, redirecting...');
    router.replace('/');
  }, [searchParams, router]);


  // Rotate tips during processing
  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setTip(fashionTips[Math.floor(Math.random() * fashionTips.length)]);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isProcessing]);

  // Handle successful image load
  const handleImageLoad = () => {
    console.log('Image loaded successfully');
    setImageReady(true);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Image failed to load:', e);
    setError('Failed to load image. The image URL may be invalid or expired.');
    setTimeout(() => router.replace('/'), 3000);
  };

  const handleRateMyDrip = async () => {
    if (!imageUrl || processingRef.current || !imageReady) return;
    
    // Enforce login requirement
    if (!user) {
      setError('Please log in to rate your outfit.');
      setTimeout(() => router.push('/login'), 2000);
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);
    setError(null);

    try {
      // Convert blob URL to file
      const file = await blobUrlToFile(imageUrl, 'outfit.jpg');
      
      // Validate file
      if (!file || file.size === 0) {
        throw new Error('Invalid image file');
      }
      
      // Normalize preview image to data URL
      const { base64, mimeType } = await fileToBase64JpegDownscaled(file, 1024, 0.85);
      const imageDataUrl = `data:${mimeType};base64,${base64}`;
      
      // Get Supabase access token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      
      if (!accessToken) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Call API with retry logic
      const result = await rateOutfitWithGemini(file, accessToken);
      
      // Store result and navigate
      const outfitResult = { imageUrl: imageDataUrl, ...result };
      sessionStorage.setItem('outfitResult', JSON.stringify(outfitResult));
      
      router.push('/results');
      
    } catch (err: unknown) {
      processingRef.current = false;
      setIsProcessing(false);
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  const handleCancel = () => {
    // Clean up blob URL if it exists
    if (imageUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
    }
    router.back();
  };

  // Show loading/error state while waiting for image
  if (!imageUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-pastel-beige">
        <ArrowClockwise size={48} className="animate-spin text-black mb-4" />
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  // Main preview interface
  return (
    <main className="bg-pastel-beige min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border-2 border-black shadow-[8px_8px_0px_#000000] overflow-hidden">
        {/* Image Container */}
        <div className="relative w-full aspect-[4/6] bg-slate-100">
          {!imageReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <ArrowClockwise size={32} className="animate-spin text-slate-400" />
            </div>
          )}
          <Image
            src={imageUrl}
            alt="Outfit Preview"
            fill
            className="object-cover"
            priority
            unoptimized
            onLoad={handleImageLoad}
            onError={handleImageError}
            sizes="(max-width: 768px) 100vw, 384px"
          />
          
          {/* Rating Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center z-10">
              <ArrowClockwise size={56} className="animate-spin mb-6" />
              <p className="text-xl font-bold mb-3">Analyzing your drip...</p>
              <div className="max-w-xs">
                <p className="text-sm italic opacity-90 transition-opacity duration-500">
                  &quot;{tip}&quot;
                </p>
              </div>
              <div className="mt-6 flex gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        {!isProcessing && (
          <div className="p-4 space-y-3 bg-white">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
                <p className="text-red-600 text-center text-sm">{error}</p>
              </div>
            )}
            <button 
              onClick={handleRateMyDrip}
              disabled={!user || !imageReady}
              className="w-full bg-[#2564EB] text-white font-semibold py-3 rounded-full border-2 border-black shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!imageReady ? 'LOADING...' : !user ? 'LOG IN TO RATE' : 'RATE MY DRIP'}
            </button>
            <button 
              onClick={handleCancel}
              disabled={isProcessing}
              className="w-full bg-white text-black font-semibold py-3 rounded-full border-2 border-black shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50"
            >
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