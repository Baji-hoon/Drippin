'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowCounterClockwise, X, CameraRotate } from 'phosphor-react';
import Image from 'next/image';

export default function SnapPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const startCamera = useCallback(async () => {
    setImageSrc(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        // Stop any existing stream before starting a new one
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: facingMode, 
            width: { ideal: 1080 }, 
            height: { ideal: 1920 },
            // @ts-expect-error - zoom is not in the standard but works on some browsers
            zoom: 1.0
          } 
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
  }, [facingMode]);

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
        if (facingMode === 'user') {
            context.translate(video.videoWidth, 0);
            context.scale(-1, 1);
        }
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

  const toggleCamera = () => {
    setFacingMode(prevMode => (prevMode === 'user' ? 'environment' : 'user'));
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
          // New container to enforce aspect ratio
          <div className="w-full max-w-md mx-auto aspect-[9/16] relative bg-black rounded-lg overflow-hidden shadow-lg">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt="Captured outfit"
                layout="fill"
                objectFit="contain"
                priority
                unoptimized // Add this for data URLs
              />
            ) : (
              <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}></video>
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
            <div className="flex w-full justify-around items-center">
                <div className="w-16 h-16"></div> {/* Placeholder for alignment */}
                <button onClick={handleCapture} className="w-20 h-20 rounded-full bg-white border-4 border-black ring-2 ring-white" aria-label="Take picture"></button>
                <button onClick={toggleCamera} className="flex flex-col items-center text-white p-2">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center"><CameraRotate size={32} /></div>
                </button>
            </div>
        )}
      </div>
      {/* The BottomNav has been removed for a full-screen experience */}
    </main>
  );
}