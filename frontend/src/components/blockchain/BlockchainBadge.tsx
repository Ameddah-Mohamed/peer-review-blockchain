import React from 'react';
import { ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';

interface BlockchainBadgeProps {
  verified?: boolean;
  blockNumber?: number;
  txHash?: string;
  onClick?: () => void;
  size?: 'xs' | 'sm' | 'md';
}

export const BlockchainBadge: React.FC<BlockchainBadgeProps> = ({
  verified = true,
  blockNumber,
  onClick,
  size = 'sm',
}) => {
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`inline-flex items-center font-medium rounded-md border transition-colors ${
        verified
          ? 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
          : 'bg-rose-50 text-rose-800 border-rose-200'
      } ${sizeClasses[size]} ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      title={onClick ? 'Click to inspect cryptographic proof' : undefined}
    >
      {verified ? (
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      ) : (
        <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
      )}
      <span>{verified ? 'Ledger Verified' : 'Unverified'}</span>
      {blockNumber !== undefined && blockNumber > 0 && (
        <span className="font-mono text-[10px] text-slate-500 tabular-nums border-l border-slate-200 pl-1.5 ml-0.5 inline-flex items-center gap-0.5">
          <Cpu className="w-2.5 h-2.5 text-slate-400" />#{blockNumber}
        </span>
      )}
    </button>
  );
};
