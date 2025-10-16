// src/components/RatingCategory.tsx
import StatBar from "./StatBar";

interface RatingCategoryProps {
  title: string;
  score: number;
  comment: string;
}

const RatingCategory: React.FC<RatingCategoryProps> = ({ title, score, comment }) => {
  return (
    <div className="bg-white/50 border border-purple-100 rounded-2xl p-4 backdrop-blur-sm">
      <StatBar label={title} value={score} />
      <p className="text-sm text-gray-600 mt-2 pl-1">{comment}</p>
    </div>
  );
};

export default RatingCategory;