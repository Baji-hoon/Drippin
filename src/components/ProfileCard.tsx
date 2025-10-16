// src/components/ProfileCard.tsx
import React from 'react';

interface ProfileCardProps {
  title: string;
  children: React.ReactNode;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ title, children }) => {
  return (
    // Removed 45-degree shadow, added new clean style
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-xl font-bold text-slate-800 mb-4">{title}</h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

export default ProfileCard;