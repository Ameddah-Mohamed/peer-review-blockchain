import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { UserRole } from '../../types';
import {
  LayoutDashboard,
  FileText,
  Users,
  CheckSquare,
  FileEdit,
  Fingerprint,
  LogOut,
  ChevronDown,
  Layers,
  Copy,
  Check,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, role, logout, switchDemoUser } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const handleRoleChange = async (targetRole: UserRole) => {
    setIsRoleDropdownOpen(false);
    if (targetRole === role) return;

    await switchDemoUser(targetRole);
    showToast('info', 'Switched Persona', `Active workspace shifted to ${targetRole.toUpperCase()}`);

    if (targetRole === 'admin') navigate('/admin');
    else if (targetRole === 'reviewer') navigate('/reviewer');
    else if (targetRole === 'author') navigate('/author');

    if (onClose) onClose();
  };

  const handleCopyPseudonym = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user?.pseudonymId) {
      navigator.clipboard.writeText(user.pseudonymId);
      setCopiedId(true);
      showToast('info', 'Pseudonym Copied', `Pseudonym ${user.pseudonymId} copied to clipboard.`);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    showToast('info', 'Logged Out', 'You have been disconnected from the ledger.');
  };

  // Determine navigation items based on current role
  const getNavItems = () => {
    const items = [];

    if (role === 'admin') {
      items.push(
        { label: 'Conference Overview', path: '/admin', icon: LayoutDashboard },
        { label: 'Submissions Ledger', path: '/admin/submissions', icon: FileText },
        { label: 'Reviewer Committee', path: '/admin/users', icon: Users },
        { label: 'On-Chain Audit Trail', path: '/admin/audit', icon: Layers }
      );
    } else if (role === 'reviewer') {
      items.push(
        { label: 'Evaluation Desk', path: '/reviewer', icon: CheckSquare }
      );
    } else {
      items.push(
        { label: 'My Manuscripts', path: '/author', icon: FileEdit }
      );
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0c0e14] text-slate-300 border-r border-white/10 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 px-5 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Custom Geometric Brand Mark */}
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
              <span className="font-mono text-xs tracking-tighter">AL</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white tracking-tight text-sm">
                  AcademicLedger
                </span>
              </div>
              <p className="text-[9px] text-slate-400 font-mono tracking-wide">
                Protocol v1.2 • Mainnet
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-md md:hidden hover:bg-white/5"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Role Quick Switcher Pill / Dropdown */}
        <div className="p-3 border-b border-white/5 shrink-0">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all text-xs group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-2 h-2 rounded-full ${
                    role === 'admin'
                      ? 'bg-purple-400'
                      : role === 'reviewer'
                      ? 'bg-emerald-400'
                      : 'bg-sky-400'
                  }`}
                />
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  Role:
                </span>
                <span className="font-semibold text-white capitalize truncate">
                  {role || 'Select'}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  isRoleDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Role Dropdown Menu */}
            {isRoleDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#141824] border border-white/10 rounded-md shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] uppercase font-mono text-slate-400 border-b border-white/5">
                  Fast Switch Persona
                </div>
                {(['author', 'reviewer', 'admin'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleChange(r)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                      role === r
                        ? 'bg-emerald-500/15 text-emerald-300 font-medium'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          r === 'admin'
                            ? 'bg-purple-400'
                            : r === 'reviewer'
                            ? 'bg-emerald-400'
                            : 'bg-sky-400'
                        }`}
                      />
                      <span className="capitalize">{r}</span>
                    </div>
                    {role === r && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto sidebar-scroll px-3 py-3 space-y-5">
          {/* Main Navigation */}
          <div>
            <div className="px-3 mb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Workspace
            </div>
            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => onClose && onClose()}
                    className={`group flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-500/15 text-white shadow-inner font-semibold border-l-2 border-emerald-400'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-300'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Verification & Public Tools */}
          <div>
            <div className="px-3 mb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Ledger Registry
            </div>
            <nav className="space-y-0.5">
              <NavLink
                to="/verify"
                onClick={() => onClose && onClose()}
                className={`group flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  location.pathname === '/verify'
                    ? 'bg-emerald-500/15 text-white shadow-inner font-semibold border-l-2 border-emerald-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Fingerprint
                  className={`w-4 h-4 transition-colors ${
                    location.pathname === '/verify'
                      ? 'text-emerald-400'
                      : 'text-slate-400 group-hover:text-slate-300'
                  }`}
                />
                <span className="truncate">Verify Manuscript Proof</span>
              </NavLink>
            </nav>
          </div>

          {/* Live Node Status Card */}
          <div className="p-2.5 rounded-md bg-white/[0.03] border border-white/5 text-[11px] space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Hardhat Node
              </span>
              <span className="font-mono text-[9px] text-emerald-400 bg-emerald-950/40 px-1 py-0.2 rounded border border-emerald-800/40">
                #31337
              </span>
            </div>
            <p className="text-slate-400 text-[10px] leading-relaxed">
              Double-Blind Privacy & Smart Contract Notarization
            </p>
          </div>
        </div>

        {/* User Profile & Sign Out Footer */}
        <div className="p-3 border-t border-white/10 shrink-0 bg-[#0c0e14]">
          <div className="p-2 rounded-md bg-white/[0.03] border border-white/5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {/* User Avatar Initial */}
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                {user?.name
                  ? user.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : 'U'}
              </div>

              <div className="min-w-0">
                <div className="text-xs font-medium text-white truncate leading-tight">
                  {user?.name || 'Academic User'}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] font-mono text-emerald-400 font-medium">
                    {user?.pseudonymId || 'ANON'}
                  </span>
                  {user?.pseudonymId && (
                    <button
                      type="button"
                      onClick={handleCopyPseudonym}
                      title={`Copy ${user.pseudonymId}`}
                      className="text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {copiedId ? (
                        <Check className="w-2.5 h-2.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-2.5 h-2.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-md transition-colors shrink-0"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
