import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import { blobUrlToFile, resizeImageForThumbnail } from './utils';

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

export const saveOutfitResult = async (result: Omit<OutfitResult, 'user_id' | 'id'> & { imageUrl: string }) => {
  try {
    // Validate input data
    const requiredFields = ['imageUrl', 'outfit_vibe', 'look_score', 'look_comment', 'color_score', 'color_comment', 'suggestions', 'observations'];
    const missingFields = requiredFields.filter(field => result[field as keyof typeof result] === undefined || result[field as keyof typeof result] === null);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Ensure suggestions is an array
    if (!Array.isArray(result.suggestions)) {
      throw new Error('Suggestions must be an array of strings');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Process image
    let resizedImageUrl: string;
    try {
      const imageFile = await blobUrlToFile(result.imageUrl, 'outfit_thumbnail.jpg');
      resizedImageUrl = await resizeImageForThumbnail(imageFile);
    } catch (imageError) {
      throw new Error(`Image processing failed: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`);
    }

    // Insert into ratings table
    const { error } = await supabase.from('ratings').insert({
      user_id: user.id,
      image_url: resizedImageUrl,
      outfit_vibe: result.outfit_vibe,
      look_score: result.look_score,
      look_comment: result.look_comment,
      color_score: result.color_score,
      color_comment: result.color_comment,
      suggestions: result.suggestions || [],
      observations: result.observations || '',
    });

    if (error) {
      throw new Error(`Supabase insert failed: ${error.message || 'Unknown error'}, code: ${error.code || 'No code'}, details: ${error.details || 'No details'}`);
    }
  } catch (error) {
    console.error('Error in saveOutfitResult:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      code: error instanceof Error && 'code' in error ? error.code : 'No code',
      details: error instanceof Error && 'details' in error ? error.details : 'No details',
    });
    throw error;
  }
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