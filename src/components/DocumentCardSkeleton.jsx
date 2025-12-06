import React from 'react';
import { Skeleton } from './ui/skeleton';

const DocumentCardSkeleton = () => {
  return (
    <div 
      className="grid grid-cols-[auto_1fr_176px_124px_72px] items-center gap-4 px-8 py-3"
      style={{ borderBottom: '1px solid #f0f0f0' }}
    >
      {/* Checkbox */}
      <div className="flex items-center justify-center w-6">
        <Skeleton className="h-4 w-4 rounded" />
      </div>

      {/* Document Name */}
      <div className="min-w-0 space-y-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>

      {/* Category */}
      <div>
        <Skeleton className="h-7 w-24 rounded-md" />
      </div>

      {/* Date */}
      <div>
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
  );
};

export default DocumentCardSkeleton;

