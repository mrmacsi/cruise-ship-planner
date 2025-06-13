import React from 'react';

export const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" role="status" aria-label="Loading">
      <span className="sr-only">Loading...</span>
    </div>
  </div>
); 