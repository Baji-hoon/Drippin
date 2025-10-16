'use client';

import Link from 'next/link';
import { PaperPlaneTilt } from 'phosphor-react';

export default function VerifyEmailPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-pastel-beige">
        <div className="w-full max-w-sm text-center bg-white rounded-2xl border-2 border-black shadow-[8px_8px_0px_#000000] p-8">
            <PaperPlaneTilt size={64} weight="duotone" className="mx-auto text-blue-500 mb-4" />
            <h1 className="text-2xl font-bold text-black">Check Your Inbox!</h1>
            <p className="text-gray-600 mt-2 mb-6">A confirmation link has been sent to your email. Please click it to verify your account.</p>
            {/* New Link to Login Page */}
            <Link href="/login" className="w-full bg-[#2564EB] text-white font-semibold py-3 rounded-full border-2 border-black shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center disabled:opacity-50" >
                Back to Log In
            </Link>
        </div>
    </main>
  );
}