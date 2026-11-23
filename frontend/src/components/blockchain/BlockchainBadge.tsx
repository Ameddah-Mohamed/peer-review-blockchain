import React from 'react';
import { ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';

interface BlockchainBadgeProps {
  verified?: boolean;
  blockNumber?: number;
  txHash?: string;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export const BlockchainBadge: React.FC<BlockchainBadgeProps> = ({
  verified = true,
  blockNumber,
  onClick,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border transition-all ${
        verified
          ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100/80 hover:border-purple-300'
          : 'bg-rose-50 text-rose-700 border-rose-200'
      } ${sizeClasses} ${onClick ? 'cursor-pointer hover:shadow-xs' : 'cursor-default'}`}
    >
      {verified ? (
        <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
      ) : (
        <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
      )}
      <span>{verified ? 'On-Chain Verified' : 'Unverified'}</span>
      {blockNumber && (
        <span className="font-mono text-[10px] bg-purple-200/60 text-purple-800 px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5">
          <Cpu className="w-2.5 h-2.5" />#{blockNumber}
        </span>
      )}
    </button>
  );
};
