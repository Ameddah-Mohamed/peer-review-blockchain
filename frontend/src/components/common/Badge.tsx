import React from 'react';
import { getStatusBadgeVariant, getRecommendationBadge } from '../../utils/formatters';

interface BadgeProps {
  status?: string;
  recommendation?: string;
  customText?: string;
  customColor?: string;
  showDot?: boolean;
  size?: 'xs' | 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  recommendation,
  customText,
  customColor,
  showDot = true,
  size = 'sm',
}) => {
  let label = customText || '';
  let colorClass = customColor || 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  if (status) {
    const config = getStatusBadgeVariant(status);
    label = config.label;
    colorClass = config.className;
    dotColor = config.dotColor;
  } else if (recommendation) {
    const config = getRecommendationBadge(recommendation);
    label = config.label;
    colorClass = config.className;
    dotColor = 'bg-slate-500';
  }

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border tracking-tight ${colorClass} ${sizeClasses[size]}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />}
      <span className="truncate">{label}</span>
    </span>
  );
};
