import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const location = useLocation();

  // Resolve current section name and breadcrumb
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/admin') return { category: 'Administration', page: 'Conference Overview' };
    if (path === '/admin/submissions') return { category: 'Submissions', page: 'Manuscript Registry' };
    if (path === '/admin/users') return { category: 'Governance', page: 'Reviewer Committee' };
    if (path === '/admin/audit') return { category: 'Blockchain', page: 'Immutable Audit Trail' };
    if (path === '/author') return { category: 'Author Workspace', page: 'My Manuscripts' };
    if (path === '/reviewer') return { category: 'Committee Portal', page: 'Peer Evaluation Desk' };
    if (path === '/verify') return { category: 'Public Registry', page: 'Document Notarization' };
    return { category: 'Portal', page: 'Overview' };
  };

  const breadcrumb = getBreadcrumb();

  return (
    <header className="sticky top-0 z-30 h-14 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onMenuToggle}
          className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md md:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-800 tracking-tight">ICDS 2026</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 hidden sm:inline">{breadcrumb.category}</span>
          <span className="text-slate-300 hidden sm:inline">/</span>
          <span className="font-medium text-slate-900 truncate">{breadcrumb.page}</span>
        </div>
      </div>

      {/* Right-side status indicators */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        {/* On-Chain Verification Pill */}
        <div className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-1 rounded-full text-[11px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>EVM Consensus Active</span>
        </div>

        {/* Double-Blind Indicator */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden md:inline">Blind Review:</span>
          <span className="font-semibold text-slate-800">ENFORCED</span>
        </div>
      </div>
    </header>
  );
};
