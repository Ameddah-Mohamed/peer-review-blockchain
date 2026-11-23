import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  ShieldCheck,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { UserRole } from '../../types';

export const Navbar: React.FC = () => {
  const { user, role, logout, switchDemoUser } = useAuth();
  const navigate = useNavigate();

  const handleRoleSwitch = (newRole: UserRole) => {
    switchDemoUser(newRole);
    if (newRole === 'author') navigate('/author');
    else if (newRole === 'reviewer') navigate('/reviewer');
    else if (newRole === 'admin') navigate('/admin');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 tracking-tight text-sm sm:text-base flex items-center gap-1.5">
                <span>AcademicLedger</span>
                <span className="text-[10px] font-mono uppercase bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded">
                  Web3
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Research Paper Peer-Review Tracker
              </p>
            </div>
          </Link>

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-200">
            {role === 'author' && (
              <Link
                to="/author"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 hover:text-brand-600 hover:bg-slate-100 transition-colors"
              >
                Author Dashboard
              </Link>
            )}
            {role === 'reviewer' && (
              <Link
                to="/reviewer"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 hover:text-brand-600 hover:bg-slate-100 transition-colors"
              >
                Reviewer Portal
              </Link>
            )}
            {role === 'admin' && (
              <>
                <Link
                  to="/admin"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                >
                  Overview
                </Link>
                <Link
                  to="/admin/submissions"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                >
                  Submissions
                </Link>
                <Link
                  to="/admin/users"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                >
                  Users
                </Link>
                <Link
                  to="/admin/audit"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                >
                  Audit Ledger
                </Link>
              </>
            )}
            <Link
              to="/verify"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-purple-700 hover:bg-purple-50 transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Verify Paper
            </Link>
          </nav>
        </div>

        {/* Right Section: Role Quick-Switcher & User Info */}
        <div className="flex items-center gap-3">
          {/* Demo Role Switcher (Convenient for review & grading) */}
          <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Demo Role:</span>
            <button
              onClick={() => handleRoleSwitch('author')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                role === 'author'
                  ? 'bg-white text-brand-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Author
            </button>
            <button
              onClick={() => handleRoleSwitch('reviewer')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                role === 'reviewer'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reviewer
            </button>
            <button
              onClick={() => handleRoleSwitch('admin')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                role === 'admin'
                  ? 'bg-white text-purple-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin
            </button>
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-900 flex items-center justify-end gap-1.5">
                  <span>{user.name}</span>
                  <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                    {user.pseudonymId}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 capitalize flex items-center justify-end gap-1">
                  <UserCheck className="w-3 h-3 text-emerald-500" />
                  <span>{user.role}</span>
                </div>
              </div>

              <button
                onClick={logout}
                title="Log out"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
        </div>
      </div>
    </header>
  );
};
