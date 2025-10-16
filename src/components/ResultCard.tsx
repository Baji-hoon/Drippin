// src/components/ResultCard.tsx
import React from 'react';

interface ResultCardProps {
  title: string;
  score?: number;
  comment: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ title, score, comment }) => {
  const percentage = score ? score * 10 : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-lg font-bold text-gray-700">{title}</h3>
        {score && <p className="text-xl font-bold text-blue-600">{score.toFixed(1)}</p>}
      </div>
      {score && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
        </div>
      )}
      <p className="text-sm text-gray-600 mt-2">{comment}</p>
    </div>
  );
};

export default ResultCard;