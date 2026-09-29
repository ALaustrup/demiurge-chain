'use client';

/**
 * Empty State Component
 * 
 * Placeholder for empty lists/content areas
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: ButtonProps['variant'];
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {/* Icon */}
      {icon && (
        <div className="w-16 h-16 mb-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl text-text-tertiary">
          {icon}
        </div>
      )}
      
      {/* Title */}
      <h3 className="font-display text-lg tracking-wider text-text-primary mb-2">
        {title}
      </h3>
      
      {/* Description */}
      {description && (
        <p className="text-sm text-text-secondary max-w-sm mb-6">
          {description}
        </p>
      )}
      
      {/* Action */}
      {action && (
        <Button
          variant={action.variant || 'secondary'}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

/**
 * Preset empty states
 */

export function NoPostsEmpty({ onCreatePost }: { onCreatePost?: () => void }) {
  return (
    <EmptyState
      icon="📭"
      title="No posts yet"
      description="Be the first to share something with the community!"
      action={onCreatePost ? { label: 'Create Post', onClick: onCreatePost } : undefined}
    />
  );
}

export function NoNFTsEmpty({ onMint }: { onMint?: () => void }) {
  return (
    <EmptyState
      icon="🎨"
      title="No NFTs found"
      description="Start your collection by minting your first DRC-369 NFT."
      action={onMint ? { label: 'Mint NFT', onClick: onMint } : undefined}
    />
  );
}

export function NoResultsEmpty({ onReset }: { onReset?: () => void }) {
  return (
    <EmptyState
      icon="🔍"
      title="No results found"
      description="Try adjusting your search or filter criteria."
      action={onReset ? { label: 'Clear Filters', onClick: onReset } : undefined}
    />
  );
}

export function OfflineEmpty({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon="📡"
      title="Connection lost"
      description="Unable to connect to the blockchain. Please check your connection."
      action={onRetry ? { label: 'Retry', onClick: onRetry } : undefined}
    />
  );
}
