'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowCounterClockwise, X } from 'phosphor-react';
import Image from 'next/image';

export default function SnapPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setImageSrc(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1920 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setError("Camera access was denied. Please enable camera permissions.");
      }
    } else {
      setError("Your browser does not support camera access.");
    }
  }, []);

  useEffect(() => {
    startCamera();
    const videoEl = videoRef.current; // Capture the ref value at effect run
    return () => {
      if (videoEl && videoEl.srcObject) {
        const stream = videoEl.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.translate(video.videoWidth, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9); // High quality JPEG
        setImageSrc(dataUrl);

        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleConfirm = () => {
    if (imageSrc) {
      // FIXED: Store the large image data in sessionStorage instead of the URL
      sessionStorage.setItem('capturedImage', imageSrc);
      router.push(`/preview`); // Navigate without the massive query parameter
    }
  };

  return (
    <main className="flex flex-col h-screen bg-black text-white">
      {/* Close Button */}
      <div className="absolute top-4 left-4 z-20">
        <button onClick={() => router.back()} className="p-2 bg-black/50 rounded-full">
            <X size={28} />
        </button>
      </div>

      <div className="relative flex-grow flex items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} className="hidden"></canvas>
        {error ? (
          <div className="p-8 text-center"><h2 className="text-xl font-bold mb-2">Camera Error</h2><p>{error}</p></div>
        ) : (
          // The container for both video and image to ensure consistent sizing
          <div className="absolute inset-0 flex items-center justify-center">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt="Captured outfit"
                fill
                className="w-full h-full object-contain"
                priority
                unoptimized // Add this for data URLs
              />
            ) : (
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]"></video>
            )}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 p-4 bg-black flex justify-center items-center h-32">
        {imageSrc ? (
          <div className="flex w-full justify-around items-center">
            <button onClick={startCamera} className="flex flex-col items-center text-white p-2">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center"><ArrowCounterClockwise size={32} /></div>
              <span className="mt-2 text-sm font-semibold">Retake</span>
            </button>
            <button onClick={handleConfirm} className="flex flex-col items-center text-white p-2">
              <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center border-4 border-black ring-2 ring-blue-500"><Check size={40} /></div>
              <span className="mt-2 text-sm font-semibold">Use Photo</span>
            </button>
          </div>
        ) : (
          <button onClick={handleCapture} className="w-20 h-20 rounded-full bg-white border-4 border-black ring-2 ring-white" aria-label="Take picture"></button>
        )}
      </div>
      {/* The BottomNav has been removed for a full-screen experience */}
    </main>
  );
}