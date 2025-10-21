'use client';
import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link for navigation
import BottomNav from '@/components/BottomNav';
import { onAuthStateChange, signInWithGoogle, User } from '@/lib/supabase';
import { ArrowClockwise } from 'phosphor-react';
import imageCompression from 'browser-image-compression';

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const subscription = onAuthStateChange((currentUser) => {
      setUser(currentUser);
    });
    return () => subscription?.unsubscribe();
  }, []);

  const handleAuthOrAction = (action: () => void) => {
    if (!user) {
      signInWithGoogle().catch(err => console.error("Sign-in error:", err));
      return;
    }
    action();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      try {
        let imageFile = file;
        // Vercel's serverless function payload limit is ~4.5MB.
        // We'll compress if the file is larger than 3MB to be safe.
        const sizeLimit = 3 * 1024 * 1024; // 3MB

        if (file.size > sizeLimit) {
          console.log(`Image size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds limit, compressing...`);
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };
          imageFile = await imageCompression(file, options);
          console.log(`Image compressed to ${(imageFile.size / 1024 / 1024).toFixed(2)}MB`);
        }

        const imageUrl = URL.createObjectURL(imageFile);
        router.push(`/preview?imageUrl=${encodeURIComponent(imageUrl)}`);
      } catch (error) {
        console.error('Error processing image:', error);
        setIsLoading(false);
        // Optionally, show an error message to the user
      }
    }
  };
  
  const renderButtonContent = (text: string) => {
    if (isLoading && text === 'Upload') { // Only show loading for upload
      return (
        <span className="flex items-center justify-center">
          <ArrowClockwise size={24} className="animate-spin mr-2" />
          Processing...
        </span>
      );
    }
    return text;
  };

  return (
    <main 
      className="relative w-full h-screen flex flex-col bg-cover bg-center" 
    >
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
      <div className="absolute inset-0 bg-pastel-beige/50"></div>
      <div className="relative z-10 flex-grow flex flex-col justify-center items-center lg:items-start p-8">
        <div className="text-center lg:text-left lg:pl-16">
          <h1 className="font-boldonse text-5xl md:text-9xl font-bold text-black tracking-wider">DRIPPIN</h1>
          <p className="text-slate-700 mt- text-lg"><b>AI</b> feedback on your outfit.</p>
          <p className="text-slate-700 mt-2 mb-8 text-sm"><i>Upload your full outfit for better results.</i>.</p>
          <div className="space-y-4 max-w-xs mx-auto lg:mx-0">
            <button 
              onClick={() => handleAuthOrAction(() => fileInputRef.current?.click())} 
              disabled={isLoading} 
              className="w-full bg-[#2564EB] text-white font-semibold py-3 px-8 rounded-full border-2 border-black shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50"
            >
              {renderButtonContent('Upload')}
            </button>
            {/* The Snap button now uses a Link component for direct navigation */}
            <Link href="/snap" passHref className="block">
              <button 
                className="w-full bg-white/50 backdrop-blur-md text-black font-semibold py-3 px-8 rounded-full border-2 border-black shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
              >
                Snap
              </button>
            </Link>
          </div>
        </div>
      </div>
      <div className="absolute bottom-24 w-full text-center z-20">
        <p className="text-xs text-slate-600">
          MADE BY <a href="https://www.instagram.com/main.baji.hoon/" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-black">BAJI</a>
        </p>
      </div>
      <BottomNav />
    </main>
  );
}