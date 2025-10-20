import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import type { OutfitResult as SharedOutfitResult } from './types';

// Lazily initialize the Supabase client to avoid throwing during import if envs are missing at build time
let supabaseClient: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
        throw new Error('Supabase environment variables are not configured');
    }
    if (!supabaseClient) {
        supabaseClient = createClient(url, key);
    }
    return supabaseClient;
}

// Backward-compatible export that proxies to the lazily created client
export const supabase = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        const client = getSupabase();
        // @ts-expect-error dynamic property forwarding
        const value = client[prop];
        if (typeof value === 'function') {
            return value.bind(client);
        }
        return value;
    },
});

// --- AUTHENTICATION ---
export const signInWithGoogle = () => {
    return supabase.auth.signInWithOAuth({ provider: 'google' });
};
export const signUpWithEmail = (email: string, password: string, displayName: string) => {
    // Generate a unique, random avatar URL based on the user's email
    const avatarUrl = `https://api.dicebear.com/8.x/avataaars-neutral/svg?seed=${encodeURIComponent(email)}`;

    return supabase.auth.signUp({ 
        email, 
        password,
        options: {
            data: {
                // This will store the name and avatar in the user's metadata
                display_name: displayName,
                avatar_url: avatarUrl,
            }
        }
    });
};
;export const signInWithEmail = (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
};
export const logOut = () => {
    return supabase.auth.signOut();
};
export const onAuthStateChange = (callback: (user: User | null) => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
        callback(session?.user ?? null);
    });
    return subscription;
};
export type { User };

// --- DATABASE ---
type SaveOutfitInput = Omit<SharedOutfitResult, 'id' | 'created_at' | 'user_id'>;

export const saveOutfitResult = async (data: SaveOutfitInput): Promise<{ id: number; image_url: string; created_at: string } | void> => {
    // Ensure we have the currently authenticated user
    const user = await getCurrentUserWithRetry();
    if (!user) throw new Error('Not authenticated');

    const { data: inserted, error } = await supabase
        .from('ratings')
        .insert({
            ...data,
            user_id: user.id,
        })
        .select('id,image_url,created_at')
        .single();

    if (error) throw error;
    return inserted as { id: number; image_url: string; created_at: string };
};

export const getUserRatings = async (): Promise<SharedOutfitResult[]> => {
    const user = await getCurrentUserWithRetry();
    if (!user) return [];

    const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data as SharedOutfitResult[]) || [];
};

export const calculateUserStats = (ratings: SharedOutfitResult[]) => {
    if (!ratings || ratings.length === 0) {
        return { totalRatings: 0, averageStyleScore: 0, averageColorScore: 0, styleFrequency: {} };
    }
    const stats = ratings.reduce(
      (acc: { styleFrequency: Record<string, number>; totalStyleScore: number; totalColorScore: number }, rating) => {
        acc.styleFrequency[rating.outfit_vibe] = (acc.styleFrequency[rating.outfit_vibe] || 0) + 1;
        acc.totalStyleScore += rating.look_score || 0;
        acc.totalColorScore += rating.color_score || 0;
        return acc;
      },
      { styleFrequency: {}, totalStyleScore: 0, totalColorScore: 0 }
    );
    return {
        totalRatings: ratings.length,
        averageStyleScore: Number((stats.totalStyleScore / ratings.length).toFixed(1)),
        averageColorScore: Number((stats.totalColorScore / ratings.length).toFixed(1)),
        styleFrequency: stats.styleFrequency,
    };
};

// Retry wrapper to handle transient network errors from supabase.auth.getUser()
async function getCurrentUserWithRetry(retries = 3, delayMs = 500): Promise<User | null> {
    let lastErr: unknown;
    for (let i = 0; i < retries; i++) {
        try {
            const { data, error } = await supabase.auth.getUser();
            if (error) throw error;
            return data?.user ?? null;
        } catch (e: unknown) {
            lastErr = e;
            // Non-fatal path: treat missing/invalid refresh token as "no user" rather than error
            const msg = (typeof e === 'object' && e && 'message' in e) ? String((e as { message?: string }).message ?? '') : '';
            if (/Invalid Refresh Token|Refresh Token Not Found|Invalid Refresh/i.test(msg)) {
                console.warn('Supabase auth: no valid session/refresh token; proceeding as unauthenticated');
                return null;
            }
            if (i === retries - 1) throw e;
            await new Promise(res => setTimeout(res, delayMs * (2 ** i)));
        }
    }
    throw lastErr as Error;
}