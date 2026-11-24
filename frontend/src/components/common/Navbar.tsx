import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Zap,
  Check,
  Menu,
  X,
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  ScrollText,
} from 'lucide-react';
import { UserRole } from '../../types';

interface DemoPersona {
  role: UserRole;
  label: string;
  name: string;
  pseudonym: string;
  affiliation: string;
}

const DEMO_PERSONAS: DemoPersona[] = [
  {
    role: 'author',
    label: 'Author',
    name: 'Alice Johnson',
    pseudonym: 'AUTH-2DE621',
    affiliation: 'School of Computing',
  },
  {
    role: 'reviewer',
    label: 'Reviewer',
    name: 'Prof. Arthur Smith',
    pseudonym: 'REV-0EBCE8',
    affiliation: 'Dept. of Distributed Systems',
  },
  {
    role: 'admin',
    label: 'Administrator',
    name: 'Conference Chair',
    pseudonym: 'ADM-342DC4',
    affiliation: 'ICDS Program Committee',
  },
];

export const Navbar: React.FC = () => {
  const { user, role, logout, switchDemoUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const demoMenuRef = useRef<HTMLDivElement>(null);
  const demoButtonRef = useRef<HTMLButtonElement>(null);

  // Close menus on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        demoMenuRef.current &&
        !demoMenuRef.current.contains(e.target as Node) &&
        demoButtonRef.current &&
        !demoButtonRef.current.contains(e.target as Node)
      ) {
        setIsDemoOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDemoOpen(false);
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close menus when route changes
  useEffect(() => {
    setIsDemoOpen(false);
    setIsMobileOpen(false);
  }, [location.pathname]);

  const handleRoleSwitch = async (newRole: UserRole) => {
    setIsDemoOpen(false);
    setIsMobileOpen(false);
    await switchDemoUser(newRole);
    if (newRole === 'author') navigate('/author');
    else if (newRole === 'reviewer') navigate('/reviewer');
    else if (newRole === 'admin') navigate('/admin');
  };

  const rolePillStyles: Record<UserRole, { badge: string; dot: string; text: string }> = {
    admin: {
      badge: 'bg-purple-50 text-purple-700 border-purple-200/80 hover:bg-purple-100/70',
      dot: 'bg-purple-600',
      text: 'text-purple-700',
    },
    reviewer: {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/70',
      dot: 'bg-emerald-600',
      text: 'text-emerald-700',
    },
    author: {
      badge: 'bg-brand-50 text-brand-700 border-brand-200/80 hover:bg-brand-100/70',
      dot: 'bg-brand-600',
      text: 'text-brand-700',
    },
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
      isActive
        ? 'bg-slate-100 text-slate-900 font-semibold shadow-2xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
    }`;

  const currentRoleStyle = role ? rolePillStyles[role] : rolePillStyles.author;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Main Navigation */}
        <div className="flex items-center gap-6 min-w-0">
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tracking-tight text-sm sm:text-base">
                AcademicLedger
              </span>
              <span className="text-[10px] font-mono uppercase bg-purple-50 text-purple-700 border border-purple-200/70 font-semibold px-1.5 py-0.5 rounded-full">
                Web3
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-200/80" aria-label="Primary">
            {role === 'author' && (
              <NavLink to="/author" className={navLinkClass}>
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Author Dashboard</span>
              </NavLink>
            )}
            {role === 'reviewer' && (
              <NavLink to="/reviewer" className={navLinkClass}>
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Reviewer Portal</span>
              </NavLink>
            )}
            {role === 'admin' && (
              <>
                <NavLink to="/admin" end className={navLinkClass}>
                  <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
                  <span>Overview</span>
                </NavLink>
                <NavLink to="/admin/submissions" className={navLinkClass}>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                  <span>Submissions</span>
                </NavLink>
                <NavLink to="/admin/users" className={navLinkClass}>
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>Users</span>
                </NavLink>
                <NavLink to="/admin/audit" className={navLinkClass}>
                  <ScrollText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Audit Ledger</span>
                </NavLink>
              </>
            )}
            <NavLink
              to="/verify"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'bg-purple-50 text-purple-800 border border-purple-200/80 shadow-2xs'
                    : 'text-purple-700 hover:bg-purple-50/70'
                }`
              }
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verify Paper</span>
            </NavLink>
          </nav>
        </div>

        {/* Right: Demo Switcher Dropdown & User Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Compact Demo Role Switcher Dropdown */}
          <div className="relative">
            <button
              ref={demoButtonRef}
              type="button"
              onClick={() => setIsDemoOpen((prev) => !prev)}
              aria-expanded={isDemoOpen}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                currentRoleStyle.badge
              }`}
              title="Fast Switch Demo Account"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
              <span className="capitalize font-semibold text-slate-800">
                {role ? `${role}` : 'Demo'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${
                  isDemoOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isDemoOpen && (
              <div
                ref={demoMenuRef}
                className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-lg border border-slate-200/90 py-1.5 z-50 animate-in fade-in duration-150"
              >
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Role Switcher
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Switch demo personas for testing
                  </div>
                </div>
                <div className="p-1 space-y-0.5">
                  {DEMO_PERSONAS.map((persona) => {
                    const isSelected = role === persona.role;
                    return (
                      <button
                        key={persona.role}
                        type="button"
                        onClick={() => handleRoleSwitch(persona.role)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                          isSelected
                            ? 'bg-slate-100 text-slate-900 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              rolePillStyles[persona.role].dot
                            }`}
                          />
                          <div className="truncate">
                            <div className="text-xs font-semibold capitalize flex items-center gap-1.5">
                              <span>{persona.label}</span>
                              <span className="text-[9px] font-mono px-1 py-0.2 bg-slate-200/70 text-slate-600 rounded">
                                {persona.pseudonym}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {persona.name}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-brand-600 shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* User Account / Sign In */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200/80">
              {/* Avatar Pill */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-1 shadow-2xs shrink-0 ${
                  role === 'admin'
                    ? 'bg-purple-100 text-purple-700 ring-purple-300/60'
                    : role === 'reviewer'
                    ? 'bg-emerald-100 text-emerald-700 ring-emerald-300/60'
                    : 'bg-brand-100 text-brand-700 ring-brand-300/60'
                }`}
                title={`${user.name} (${user.role})`}
              >
                {user.name
                  ? user.name
                      .split(' ')
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : 'U'}
              </div>

              {/* Name & Pseudonym Label (Visible on wider screens) */}
              <div className="hidden lg:block text-left max-w-[140px]">
                <div className="text-xs font-semibold text-slate-900 truncate" title={user.name}>
                  {user.name}
                </div>
                <div className="text-[10px] font-mono text-slate-500 truncate flex items-center gap-1">
                  <span>{user.pseudonymId}</span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-0.5"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm transition-colors"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMobileOpen((prev) => !prev)}
            aria-expanded={isMobileOpen}
            className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/98 px-4 pt-3 pb-4 space-y-3">
          <nav className="flex flex-col space-y-1" aria-label="Mobile Primary">
            {role === 'author' && (
              <NavLink to="/author" className={navLinkClass}>
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Author Dashboard</span>
              </NavLink>
            )}
            {role === 'reviewer' && (
              <NavLink to="/reviewer" className={navLinkClass}>
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Reviewer Portal</span>
              </NavLink>
            )}
            {role === 'admin' && (
              <>
                <NavLink to="/admin" end className={navLinkClass}>
                  <LayoutDashboard className="w-4 h-4 text-slate-500" />
                  <span>Overview</span>
                </NavLink>
                <NavLink to="/admin/submissions" className={navLinkClass}>
                  <FileSpreadsheet className="w-4 h-4 text-slate-500" />
                  <span>Submissions</span>
                </NavLink>
                <NavLink to="/admin/users" className={navLinkClass}>
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>Users</span>
                </NavLink>
                <NavLink to="/admin/audit" className={navLinkClass}>
                  <ScrollText className="w-4 h-4 text-slate-500" />
                  <span>Audit Ledger</span>
                </NavLink>
              </>
            )}
            <NavLink
              to="/verify"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'bg-purple-100 text-purple-800'
                    : 'text-purple-700 hover:bg-purple-50'
                }`
              }
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Paper</span>
            </NavLink>
          </nav>

          {/* Mobile User Information */}
          {user && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-900">{user.name}</div>
                <div className="text-[10px] font-mono text-slate-500">
                  {user.pseudonymId} · <span className="capitalize">{user.role}</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded-md hover:bg-rose-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
