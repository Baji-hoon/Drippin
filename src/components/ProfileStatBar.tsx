import React from 'react';

interface ProfileStatBarProps {
  label: string;
  value: number;
  maxValue?: number;
  displayAsPercent?: boolean;
}

const ProfileStatBar: React.FC<ProfileStatBarProps> = ({ label, value, maxValue = 10, displayAsPercent = false }) => {
  const percentage = (value / (displayAsPercent ? 100 : maxValue)) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-lg font-semibold text-slate-700">{label}</span>
        <span className="text-lg font-bold text-slate-800">
          {displayAsPercent ? `${value}%` : value.toFixed(1)}
        </span>
      </div>
      {/* Thicker progress bar with border */}
      <div className="w-full bg-slate-100 rounded-full h-4 border-3 border-black">
        <div 
          className="bg-[#2564EB] h-full rounded-full" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProfileStatBar;
