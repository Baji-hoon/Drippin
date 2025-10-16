export interface OutfitResult {
  id: number;
  user_id?: string;
  image_url: string;
  created_at: string;
  outfit_vibe: string;
  look_score: number;
  look_comment: string;
  color_score: number;
  color_comment: string;
  suggestions: string[];
  observations: string;
}

export interface LocalOutfitResult {
  imageUrl: string;
  outfit_vibe: string;
  look_score: number;
  look_comment: string;
  color_score: number;
  color_comment: string;
  suggestions?: string[];
  observations?: string;
}