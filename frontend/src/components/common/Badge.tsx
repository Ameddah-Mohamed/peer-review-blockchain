import React from 'react';
import { getStatusBadgeVariant, getRecommendationBadge } from '../../utils/formatters';

interface BadgeProps {
  status?: string;
  recommendation?: string;
  customText?: string;
  customColor?: string;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  recommendation,
  customText,
  customColor,
  showDot = true,
  size = 'md',
}) => {
  let label = customText || '';
  let colorClass = customColor || 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-500';

  if (status) {
    const config = getStatusBadgeVariant(status);
    label = config.label;
    colorClass = config.className;
    dotColor = config.dotColor;
  } else if (recommendation) {
    const config = getRecommendationBadge(recommendation);
    label = config.label;
    colorClass = config.className;
  }

  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${colorClass} ${sizeClasses}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
      {label}
    </span>
  );
};
