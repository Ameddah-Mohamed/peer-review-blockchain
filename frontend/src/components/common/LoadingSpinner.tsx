import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner: React.FC<{ message?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  message = 'Loading data...',
  size = 'md',
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Loader2 className={`${sizeMap[size]} text-brand-600 animate-spin`} />
      {message && <p className="text-xs font-medium text-slate-500 mt-3 animate-pulse">{message}</p>}
    </div>
  );
};
