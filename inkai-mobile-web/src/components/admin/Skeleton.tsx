import React from 'react';

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={`skeleton ${className}`} />
);

export const StatCardSkeleton = () => (
  <div className="glass-card p-4 flex flex-col gap-3">
    <div className="flex justify-between items-start">
      <Skeleton className="w-10 h-10 rounded-xl" />
      <Skeleton className="w-12 h-4 rounded-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="w-20 h-3" />
      <Skeleton className="w-16 h-8" />
      <Skeleton className="w-24 h-3" />
    </div>
  </div>
);

export const MemberItemSkeleton = () => (
  <div className="glass-card p-4 flex items-center justify-between border-white/5">
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="space-y-2 min-w-0 flex-1">
        <Skeleton className="w-3/4 h-3" />
        <div className="flex gap-2">
          <Skeleton className="w-16 h-2" />
          <Skeleton className="w-20 h-2" />
        </div>
      </div>
    </div>
    <div className="flex gap-1 ml-4">
      <Skeleton className="w-8 h-8 rounded-lg" />
      <Skeleton className="w-8 h-8 rounded-lg" />
    </div>
  </div>
);
