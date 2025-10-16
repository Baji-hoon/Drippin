import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import { blobUrlToFile, resizeImageForThumbnail } from './utils';
import type { OutfitResult } from './types';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- AUTHENTICATION ---
export const signInWithGoogle = () => {
    return supabase.auth.signInWithOAuth({ provider: 'google' });
};
export const signUpWithEmail = (email, password, displayName) => {
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
;export const signInWithEmail = (email, password) => {
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
export interface OutfitResult {
    id?: number;
    user_id?: string;
    image_url: string; 
    outfit_vibe: string;
    look_score: number;
    look_comment: string;
    color_score: number;
    color_comment: string;
    // FIXED: This is now an array of strings
    suggestions: string[]; 
    observations: string;
    created_at?: string;
}

type SaveOutfitInput = Omit<OutfitResult, 'id' | 'created_at' | 'user_id'>;

export const saveOutfitResult = async (data: SaveOutfitInput): Promise<void> => {
  const { error } = await supabase
    .from('ratings')
    .insert({
      ...data,
      user_id: auth.currentUser?.id,
    });

  if (error) throw error;
};

export const getUserRatings = async (): Promise<OutfitResult[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data as OutfitResult[]) || [];
};

export const calculateUserStats = (ratings: OutfitResult[]) => {
    if (!ratings || ratings.length === 0) {
        return { totalRatings: 0, averageStyleScore: 0, averageColorScore: 0, styleFrequency: {} };
    }
    const stats = ratings.reduce((acc, rating) => {
        acc.styleFrequency[rating.outfit_vibe] = (acc.styleFrequency[rating.outfit_vibe] || 0) + 1;
        acc.totalStyleScore += rating.look_score || 0;
        acc.totalColorScore += rating.color_score || 0;
        return acc;
    }, { styleFrequency: {}, totalStyleScore: 0, totalColorScore: 0 });
    return {
        totalRatings: ratings.length,
        averageStyleScore: Number((stats.totalStyleScore / ratings.length).toFixed(1)),
        averageColorScore: Number((stats.totalColorScore / ratings.length).toFixed(1)),
        styleFrequency: stats.styleFrequency,
    };
};