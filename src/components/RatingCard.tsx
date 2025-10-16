// src/components/RatingCard.tsx
import React from 'react';

interface RatingCardProps {
  title: string;
  score: number;
  comment: string;
}

const RatingCard: React.FC<RatingCardProps> = ({ title, score, comment }) => {
  const percentage = score * 10; // e.g., 8.2 -> 82%

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-sm font-bold uppercase tracking-wider text-slate-500">{title}</span>
        <span className="text-xl font-bold text-slate-800">{score.toFixed(1)}</span>
      </div>
      {/* Progress Bar */}
      <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
        <div 
          className="bg-blue-500 h-1.5 rounded-full" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-sm text-slate-600">{comment}</p>
    </div>
  );
};

export default RatingCard;