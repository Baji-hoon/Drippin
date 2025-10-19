import React, { useState } from 'react';
import Image from 'next/image';

interface HistoryCardProps {
  imageUrl: string;
  styleScore?: number;
  styleName?: string;
  colorScore?: number;
}

const HistoryCard: React.FC<HistoryCardProps> = ({ 
  imageUrl, 
  styleScore = 0,
  styleName = 'N/A',
  colorScore = 0
}) => {
  const [showModal, setShowModal] = useState(false);
  const isTemporary = imageUrl?.startsWith('blob:') || imageUrl?.startsWith('data:');
  const validImageUrl = imageUrl || '/placeholder-image.jpg';

  const formatScore = (score: number | undefined) => {
    return typeof score === 'number' ? score.toFixed(1) : '0.0';
  };

  return (
    <>
      <div className="w-full bg-white rounded-2xl border-2 border-black shadow-[6px_6px_0px_#000000] overflow-hidden">
        {/* Image container with relative positioning */}
        <div 
          className="relative w-full aspect-[4/3] cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          {isTemporary ? (
            // Next Image cannot preload blob: URLs; use an unoptimized img as a fallback
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={validImageUrl}
              alt={`Outfit: ${styleName}`}
              className="absolute inset-0 w-full h-full object-cover object-top"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/placeholder-image.jpg';
              }}
            />
          ) : (
            <Image
              src={validImageUrl}
              alt={`Outfit: ${styleName}`}
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-image.jpg';
              }}
            />
          )}
        </div>
        
        {/* Rating Details Section */}
        <div className="bg-white border-t-2 border-black">
          <div className="grid grid-cols-3">
            {/* Style Score */}
            <div className="flex flex-col items-center justify-center p-3 border-r-2 border-black">
              <span className="text-2xl font-bold text-slate-800">
                {formatScore(styleScore)}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 uppercase tracking-wider">STYLE</span>
            </div>
            {/* Category */}
            <div className="flex items-center justify-center p-3">
              <span className="text-sm font-medium text-slate-800 uppercase text-center">
                {styleName || 'N/A'}
              </span>
            </div>
            {/* Color Score */}
            <div className="flex flex-col items-center justify-center p-3 border-l-2 border-black">
              <span className="text-2xl font-bold text-slate-800">
                {formatScore(colorScore)}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 uppercase tracking-wider">COLOR</span>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div className="relative max-w-4xl w-full h-auto max-h-[90vh]">
            {isTemporary ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={validImageUrl}
                alt={`Outfit: ${styleName} (Full View)`}
                className="w-full h-auto object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <Image
                src={validImageUrl}
                alt={`Outfit: ${styleName} (Full View)`}
                width={1200}
                height={1200}
                className="w-full h-auto object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <button
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg"
              onClick={() => setShowModal(false)}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default HistoryCard;
