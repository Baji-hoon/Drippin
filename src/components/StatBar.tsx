// src/components/StatBar.tsx
import React from 'react';

interface StatBarProps {
  label: string;
  value: number;
  maxValue?: number;
}

const StatBar: React.FC<StatBarProps> = ({ label, value, maxValue = 10 }) => {
  const percentage = (value / maxValue) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-base font-semibold text-slate-700">{label}</span>
        <span className="text-lg font-bold text-slate-800">{value.toFixed(1)}</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2">
        {/* Progress bar is now blue */}
        <div 
          className="bg-blue-600 h-2 rounded-full" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default StatBar;