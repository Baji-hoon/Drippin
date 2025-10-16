'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { onAuthStateChange, User } from '@/lib/supabase';
import { ArrowClockwise } from 'phosphor-react';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subscription = onAuthStateChange((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    // FIXED: Added '/verify-email' to the list of public authentication pages.
    const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/verify-email';

    if (!user && !isAuthPage) {
      router.push('/login');
    }

    if (user && isAuthPage) {
      router.push('/');
    }
  }, [user, loading, pathname, router]);


  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-pastel-beige">
        <ArrowClockwise size={48} className="animate-spin" />
      </div>
    );
  }
  
  return <>{children}</>;
}