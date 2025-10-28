// src/components/simulator/PhotoGallery.tsx
// Google-style photo gallery with count overlay

import React from 'react';

interface Photo {
  mediaItemId: string;
  googleUrl?: string;
  category?: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  totalPhotos: number;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos, totalPhotos }) => {
  // Display first 5 photos in grid
  const displayPhotos = photos.slice(0, 5);

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="grid grid-cols-4 gap-2 relative">
        {/* Large left photo */}
        {displayPhotos[0] && (
          <div className="col-span-2 row-span-2 relative h-64 bg-gray-200 rounded-lg overflow-hidden">
            <img
              src={displayPhotos[0].googleUrl || '/placeholder-image.jpg'}
              alt="Business photo"
              className="w-full h-full object-cover"
            />
            
            {/* Photo count overlay */}
            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg">
              <span className="text-sm font-medium text-gray-900">
                {totalPhotos}+ Photos
              </span>
            </div>
          </div>
        )}

        {/* Smaller right photos */}
        <div className="col-span-2 grid grid-cols-2 gap-2">
          {displayPhotos.slice(1, 5).map((photo) => (
            <div
              key={photo.mediaItemId}
              className="h-[calc((16rem-0.5rem)/2)] bg-gray-200 rounded-lg overflow-hidden"
            >
              <img
                src={photo.googleUrl || '/placeholder-image.jpg'}
                alt="Business photo"
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};