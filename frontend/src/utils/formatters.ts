export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString: string | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return formatDate(dateString);
  } catch {
    return dateString;
  }
}

export function truncateHash(hash: string | undefined, head = 6, tail = 4): string {
  if (!hash) return '—';
  if (hash.length <= head + tail + 3) return hash;
  return `${hash.slice(0, head)}...${hash.slice(-tail)}`;
}

export function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function getStatusBadgeVariant(status: string): {
  label: string;
  className: string;
  dotColor: string;
} {
  switch (status) {
    case 'accepted':
      return {
        label: 'Accepted',
        className: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
        dotColor: 'bg-emerald-600',
      };
    case 'rejected':
      return {
        label: 'Rejected',
        className: 'bg-rose-50 text-rose-800 border-rose-200/80',
        dotColor: 'bg-rose-600',
      };
    case 'under_review':
      return {
        label: 'Under Review',
        className: 'bg-sky-50 text-sky-800 border-sky-200/80',
        dotColor: 'bg-sky-600',
      };
    case 'revision_requested':
      return {
        label: 'Revision Requested',
        className: 'bg-amber-50 text-amber-800 border-amber-200/80',
        dotColor: 'bg-amber-600',
      };
    case 'submitted':
    default:
      return {
        label: 'Submitted',
        className: 'bg-slate-50 text-slate-700 border-slate-200',
        dotColor: 'bg-slate-500',
      };
  }
}

export function getRecommendationBadge(recommendation: string): {
  label: string;
  className: string;
} {
  switch (recommendation) {
    case 'strong_accept':
      return { label: 'Strong Accept', className: 'bg-emerald-50 text-emerald-800 border-emerald-200/80' };
    case 'accept':
      return { label: 'Accept', className: 'bg-emerald-50/60 text-emerald-700 border-emerald-200/60' };
    case 'borderline':
      return { label: 'Borderline', className: 'bg-amber-50 text-amber-800 border-amber-200/80' };
    case 'reject':
      return { label: 'Reject', className: 'bg-rose-50/60 text-rose-700 border-rose-200/60' };
    case 'strong_reject':
      return { label: 'Strong Reject', className: 'bg-rose-50 text-rose-800 border-rose-200/80' };
    default:
      return { label: recommendation, className: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
}
