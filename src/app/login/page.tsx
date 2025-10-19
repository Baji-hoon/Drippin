'use client';
import { useState } from 'react';
import Link from 'next/link';
import { signInWithEmail, signInWithGoogle } from '@/lib/supabase';
import { GoogleLogo, ArrowClockwise } from 'phosphor-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setLoginMessage(null);
    const { error } = await signInWithEmail(email, password);
    if (error) {
      if (error.message.includes("Email not confirmed")) {
        setError("Please check your inbox and verify your email first.");
      } else {
        setError("Invalid login credentials.");
      }
      setIsLoading(false);
    } 
    // On successful login, the AuthWrapper will handle the redirect automatically.
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signInWithGoogle();
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-pastel-beige">
      <h1 className="boldonse-regular text-5xl font-extrabold text-black mb-8">DRIPPIN</h1>
      
      <div className="w-full max-w-sm bg-white rounded-2xl border-2 border-black shadow-[8px_8px_0px_#000000] p-8">
        <form onSubmit={handleLogin} className="space-y-4">
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
            placeholder="ENTER YOUR PASSWORD"
            required
            className="w-full p-3 text-center font-semibold text-black bg-transparent border-2 border-black border-dotted rounded-lg placeholder-gray-500 focus:outline-none focus:border-solid"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#2564EB] text-white font-semibold py-3 rounded-full border-2 border-black shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center disabled:opacity-50"           >
            {isLoading ? <ArrowClockwise size={24} className="animate-spin mx-auto" /> : 'LOG IN'}
          </button>

          <div className="flex items-center space-x-2 pt-2">
            <div className="flex-grow h-px bg-gray-300"></div>
            <span className="text-gray-400 font-semibold text-sm">OR</span>
            <div className="flex-grow h-px bg-gray-300"></div>
          </div>

          {error && <p className="text-red-500 text-sm text-center !mt-2">{error}</p>}
          {loginMessage && <p className="text-green-500 text-sm text-center !mt-2">{loginMessage}</p>}

        </form>
        
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full mt-3 bg-[#2564EB] text-white font-semibold py-3 rounded-full border-2 border-black shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center disabled:opacity-50"
        >
          {isLoading ? <ArrowClockwise size={24} className="animate-spin" /> : (
            <>
              <GoogleLogo size={20} weight="bold" className="mr-2" />
              CONTINUE WITH GOOGLE
            </>
          )}
        </button>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account? <Link href="/signup" className="font-bold text-black underline">Sign Up</Link>
        </p>
      </div>
    </main>
  );
}