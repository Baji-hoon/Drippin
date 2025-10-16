export interface OutfitRating {
  outfit_vibe: string;
  look_score: number;
  look_comment: string;
  color_score: number;
  color_comment: string;
  suggestion: string;
  observations: string;
}

export interface RatingDocument {
  id: string;
  userId: string;
  imageBase64: string;
  rating: OutfitRating;
  timestamp: string;
}