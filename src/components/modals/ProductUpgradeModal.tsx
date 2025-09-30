// src/components/modals/ProductUpgradeModal.tsx
import { ArrowRight, CheckCircle, Lock, X } from 'lucide-react';
import React, { useState } from 'react';
import type { Product } from '../../types/products';

interface ProductUpgradeModalProps {
  product: Product;
  onRequestAccess: () => Promise<void>;
  onClose: () => void;
}

export const ProductUpgradeModal: React.FC<ProductUpgradeModalProps> = ({
  product,
  onRequestAccess,
  onClose,
}) => {
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [requestSent, setRequestSent] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestAccess = async () => {
    setIsRequesting(true);
    setError(null);

    try {
      await onRequestAccess();
      setRequestSent(true);
    } catch (err) {
      console.error('Error requesting access:', err);
      setError('Failed to send access request. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        <div className="p-8">
          {!requestSent ? (
            <>
              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Lock size={32} className="text-white" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
                Upgrade Required
              </h2>

              {/* Product name */}
              <p className="text-center text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                {product.display_name}
              </p>

              {/* Description */}
              {product.description && (
                <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                  {product.description}
                </p>
              )}

              {/* Error message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Action button */}
              <button
                onClick={handleRequestAccess}
                disabled={isRequesting}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRequesting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending Request...
                  </>
                ) : (
                  <>
                    Request Access
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              {/* Info text */}
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                Our team will contact you shortly to discuss upgrading your account.
              </p>
            </>
          ) : (
            <>
              {/* Success icon */}
              <div className="w-16 h-16 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle size={32} className="text-white" />
              </div>

              {/* Success title */}
              <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
                Request Sent!
              </h2>

              {/* Success message */}
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Your access request for <strong>{product.display_name}</strong> has been sent to our team. 
                We'll contact you shortly to complete your upgrade.
              </p>

              {/* Close button */}
              <button
                onClick={onClose}
                className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};