import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { truncateHash } from '../../utils/formatters';

interface HashViewerProps {
  hash: string;
  type?: 'fileHash' | 'txHash' | 'address';
  label?: string;
  truncate?: boolean;
  head?: number;
  tail?: number;
}

export const HashViewer: React.FC<HashViewerProps> = ({
  hash,
  type = 'fileHash',
  label,
  truncate = true,
  head = 8,
  tail = 6,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayText = truncate ? truncateHash(hash, head, tail) : hash;

  return (
    <div className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono text-xs text-slate-700 transition-colors">
      {label && <span className="font-sans text-[10px] text-slate-400 font-medium uppercase">{label}:</span>}
      <span title={hash} className="select-all tabular-nums">
        {displayText}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        title="Copy to clipboard"
        className="text-slate-400 hover:text-slate-700 transition-colors p-0.5"
      >
        {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
      </button>
      {type === 'txHash' && (
        <span title="Recorded on Blockchain Ledger" className="text-slate-400">
          <ExternalLink className="w-3 h-3 opacity-60" />
        </span>
      )}
    </div>
  );
};
