// src/components/simulator/BusinessInfoSection.tsx
// Google-style business information section

import { Clock, Globe, MapPin, Phone } from 'lucide-react';
import React from 'react';

interface BusinessInfo {
  address?: string;
  phone?: string;
  website?: string;
  hours?: {
    status: 'open' | 'closed';
    closeTime?: string;
  };
}

interface BusinessInfoSectionProps {
  businessInfo: BusinessInfo;
}

export const BusinessInfoSection: React.FC<BusinessInfoSectionProps> = ({ businessInfo }) => {
  return (
    <div className="bg-white rounded-lg p-6">
      <div className="space-y-4">
        {/* Address */}
        {businessInfo.address && (
          <div className="flex items-start gap-3">
            <MapPin size={20} className="text-gray-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-gray-900 mb-1">Address:</div>
              <div className="text-sm text-gray-700">{businessInfo.address}</div>
              <a
                href="#"
                className="text-sm text-blue-600 hover:underline mt-1 inline-block"
              >
                Get directions
              </a>
            </div>
          </div>
        )}

        {/* Hours */}
        {businessInfo.hours && (
          <div className="flex items-start gap-3">
            <Clock size={20} className="text-gray-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-gray-900 mb-1">Hours:</div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium ${
                    businessInfo.hours.status === 'open'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {businessInfo.hours.status === 'open' ? 'Open' : 'Closed'}
                </span>
                {businessInfo.hours.closeTime && (
                  <span className="text-sm text-gray-600">
                    · Closes {businessInfo.hours.closeTime}
                  </span>
                )}
              </div>
              <a
                href="#"
                className="text-sm text-blue-600 hover:underline mt-1 inline-block"
              >
                See full hours
              </a>
            </div>
          </div>
        )}

        {/* Phone */}
        {businessInfo.phone && (
          <div className="flex items-start gap-3">
            <Phone size={20} className="text-gray-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-gray-900 mb-1">Phone:</div>
              <a
                href={`tel:${businessInfo.phone}`}
                className="text-sm text-blue-600 hover:underline"
              >
                {businessInfo.phone}
              </a>
            </div>
          </div>
        )}

        {/* Website */}
        {businessInfo.website && (
          <div className="flex items-start gap-3">
            <Globe size={20} className="text-gray-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-gray-900 mb-1">Website:</div>
              <a
                href={businessInfo.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                {businessInfo.website}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};