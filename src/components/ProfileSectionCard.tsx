import React from 'react';

interface ProfileSectionCardProps {
  title: string;
  children: React.ReactNode;
}

const ProfileSectionCard: React.FC<ProfileSectionCardProps> = ({ title, children }) => {
  return (
    <div className="w-full bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000000] p-5">
      <h3
        className="text-xl font-bold text-slate-800 uppercase tracking-tight mb-4"
        style={{ wordSpacing: '0.2em' }} // Add this line for word spacing
      >
        {title}
      </h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

export default ProfileSectionCard;
