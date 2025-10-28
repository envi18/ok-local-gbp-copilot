// src/components/simulator/ActionButtons.tsx
// Google-style action buttons (Order, Directions, Save, Share, Call)

import { Bookmark, MapPin, Navigation, Phone, Share2, ShoppingBag } from 'lucide-react';
import React from 'react';

interface ActionButtonsProps {
  phone?: string;
  website?: string;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ phone, website }) => {
  const handleOrderPickup = () => {
    console.log('Order pickup clicked');
  };

  const handleOrderDelivery = () => {
    console.log('Order delivery clicked');
  };

  const handleDirections = () => {
    console.log('Directions clicked');
  };

  const handleSave = () => {
    console.log('Save clicked');
  };

  const handleShare = () => {
    console.log('Share clicked');
  };

  const handleCall = () => {
    if (phone) {
      window.open(`tel:${phone}`);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Order pickup */}
        <button
          onClick={handleOrderPickup}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        >
          <ShoppingBag size={16} className="text-blue-600" />
          <span>Order pickup</span>
        </button>

        {/* Order delivery */}
        <button
          onClick={handleOrderDelivery}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        >
          <MapPin size={16} className="text-blue-600" />
          <span>Order delivery</span>
        </button>

        {/* Directions */}
        <button
          onClick={handleDirections}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        >
          <Navigation size={16} className="text-blue-600" />
          <span>Directions</span>
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        >
          <Bookmark size={16} />
          <span>Save</span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        >
          <Share2 size={16} />
          <span>Share</span>
        </button>

        {/* Call */}
        {phone && (
          <button
            onClick={handleCall}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
          >
            <Phone size={16} />
            <span>Call</span>
          </button>
        )}
      </div>
    </div>
  );
};