'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUpWithEmail, signInWithGoogle } from '@/lib/supabase';
import { GoogleLogo, ArrowClockwise } from 'phosphor-react';

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(''); // State for the new name field
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    setIsLoading(true);
    setError(null);
    // Pass the displayName to the signup function
    const { error } = await signUpWithEmail(email, password, displayName);
    if (error) {
        setError(error.message);
        setIsLoading(false);
    } else {
        router.push('/verify-email');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signInWithGoogle();
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-pastel-beige">
      <h1 className="boldonse-regular text-5xl font-extrabold text-black mb-8">DRIPPIN</h1>
      
      <div className="w-full max-w-sm bg-white rounded-2xl border-2 border-black shadow-[8px_8px_0px_#000000] p-8">
        <form onSubmit={handleSignup} className="space-y-4">
          {/* New Input Field for Display Name */}
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="ENTER YOUR NAME"
            required
            className="w-full p-3 text-center font-semibold text-black bg-transparent border-2 border-black border-dashed rounded-lg placeholder-gray-500 focus:outline-none focus:border-solid"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ENTER YOUR EMAIL"
            required
            className="w-full p-3 text-center font-semibold text-black bg-transparent border-2 border-black border-dashed rounded-lg placeholder-gray-500 focus:outline-none focus:border-solid"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="CREATE A PASSWORD"
            required
            minLength={6} // Good practice to enforce a minimum length
            className="w-full p-3 text-center font-semibold text-black bg-transparent border-2 border-black border-dotted rounded-lg placeholder-gray-500 focus:outline-none focus:border-solid"
          />
          {/* "Confirm Password" field removed */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#2564EB] text-white font-semibold py-3 rounded-full border-2 border-black shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center disabled:opacity-50"          >
            {isLoading ? <ArrowClockwise size={24} className="animate-spin mx-auto" /> : 'CREATE ACCOUNT'}
          </button>

          <div className="flex items-center space-x-2 pt-2">
            <div className="flex-grow h-px bg-gray-300"></div>
            <span className="text-gray-400 font-semibold text-sm">OR</span>
            <div className="flex-grow h-px bg-gray-300"></div>
          </div>

          {error && <p className="text-red-500 text-sm text-center !mt-2">{error}</p>}

        </form>
        
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full mt-3 bg-[#2564EB] text-white font-semibold py-3 rounded-full border-2 border-black shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center disabled:opacity-50"
        >
          {isLoading ? <ArrowClockwise size={24} className="animate-spin mx-auto" /> : (
            <>
              <GoogleLogo size={20} weight="bold" className="mr-2" />
              CONTINUE WITH GOOGLE
            </>
          )}
        </button>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account? <Link href="/login" className="font-bold text-black underline">Log In</Link>
        </p>
      </div>
    </main>
  );
}