import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export interface SkeletonProps {
  count?: number;
  height?: number | string;
  width?: number | string;
  circle?: boolean;
  className?: string;
}

export const LoadingSkeleton: React.FC<SkeletonProps> = ({
  count = 1,
  height,
  width,
  circle = false,
  className = ''
}) => {
  return (
    <Skeleton
      count={count}
      height={height}
      width={width}
      circle={circle}
      className={className}
      baseColor="#374151" // Tailwind gray-700
      highlightColor="#4B5563" // Tailwind gray-600
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="rounded-lg bg-gray-800 border border-gray-700 p-4 animate-pulse">
      <div className="h-4 w-1/3 bg-gray-700 rounded mb-4"></div>
      <div className="h-20 bg-gray-700 rounded mb-4"></div>
      <div className="flex justify-between">
        <div className="h-8 w-1/3 bg-gray-700 rounded"></div>
        <div className="h-8 w-8 bg-gray-700 rounded"></div>
      </div>
    </div>
  );
};

export const ContractCardSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
};

export const CodeSkeleton: React.FC = () => {
  return (
    <div className="rounded-lg bg-gray-900 border border-gray-800 p-4 space-y-2">
      <div className="flex space-x-2">
        <div className="h-4 w-16 bg-gray-800 rounded"></div>
        <div className="h-4 w-16 bg-gray-800 rounded"></div>
        <div className="h-4 w-20 bg-gray-800 rounded"></div>
      </div>
      <div className="h-4 w-2/3 bg-gray-800 rounded"></div>
      <div className="h-4 w-4/5 bg-gray-800 rounded"></div>
      <div className="h-4 w-1/2 bg-gray-800 rounded"></div>
      <div className="h-4 w-3/4 bg-gray-800 rounded"></div>
      <div className="h-4 w-2/3 bg-gray-800 rounded"></div>
      <div className="h-4 w-1/2 bg-gray-800 rounded"></div>
      <div className="h-4 w-4/5 bg-gray-800 rounded"></div>
    </div>
  );
};

export default LoadingSkeleton; 