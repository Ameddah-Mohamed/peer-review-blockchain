import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react';

interface DemoProfile {
  role: 'author' | 'reviewer' | 'admin';
  label: string;
  name: string;
  email: string;
  password: string;
  pseudonym: string;
}

const DEMO_PROFILES: DemoProfile[] = [
  {
    role: 'author',
    label: 'Author',
    name: 'Alice Johnson',
    email: 'alice.student@university.edu',
    password: 'AuthorPassword123!',
    pseudonym: 'AUTH-2DE621',
  },
  {
    role: 'reviewer',
    label: 'Reviewer',
    name: 'Prof. Arthur Smith',
    email: 'prof.smith@university.edu',
    password: 'ReviewerPassword123!',
    pseudonym: 'REV-0EBCE8',
  },
  {
    role: 'admin',
    label: 'Admin',
    name: 'Conference Chair',
    email: 'admin@conference.edu',
    password: 'AdminPassword123!',
    pseudonym: 'ADM-342DC4',
  },
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('warning', 'Missing Fields', 'Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const loggedInUser = await login(email, password);
      showToast('success', 'Authenticated', 'Welcome to AcademicLedger.');

      if (from && from !== '/') {
        navigate(from, { replace: true });
      } else if (loggedInUser?.role === 'author') {
        navigate('/author', { replace: true });
      } else if (loggedInUser?.role === 'reviewer') {
        navigate('/reviewer', { replace: true });
      } else if (loggedInUser?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/author', { replace: true });
      }
    } catch (err: any) {
      showToast('error', 'Login Failed', err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (profile: DemoProfile) => {
    setEmail(profile.email);
    setPassword(profile.password);
    setIsLoading(true);
    try {
      const loggedInUser = await login(profile.email, profile.password);
      showToast('info', 'Demo Profile Active', `Signed in as ${profile.name} (${profile.label})`);
      if (from && from !== '/') {
        navigate(from, { replace: true });
      } else if (loggedInUser?.role === 'author') {
        navigate('/author', { replace: true });
      } else if (loggedInUser?.role === 'reviewer') {
        navigate('/reviewer', { replace: true });
      } else if (loggedInUser?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/author', { replace: true });
      }
    } catch (err: any) {
      showToast('error', 'Demo Login Error', err.message || 'Failed to authenticate.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon & Wordmark */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20 mx-auto">
            <span className="font-mono text-base tracking-tighter">AL</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            AcademicLedger
          </h2>
          <p className="text-xs text-slate-500">
            Decentralized Peer-Review & Research Document Notarization
          </p>
        </div>

        {/* Main Card */}
        <div className="mt-6 bg-white py-8 px-6 shadow-2xs rounded-xl border border-slate-200 sm:px-8 space-y-6">
          {/* Quick Demo Switcher */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <span>Quick Demo Sign-In</span>
              <span className="font-mono text-emerald-600">1-Click</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_PROFILES.map((p) => (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => handleQuickDemo(p)}
                  className="p-2 rounded-lg border border-slate-200 text-center hover:border-slate-400 hover:bg-slate-50/80 transition-all text-xs"
                >
                  <div className="font-bold text-slate-900">{p.label}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{p.name.split(' ')[0]}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-400">or sign in with credentials</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50"
                />
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              type="submit"
              isLoading={isLoading}
              className="w-full"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Sign In to Workspace
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
            Need a participant account?{' '}
            <Link to="/register" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Register New Identity
            </Link>
          </div>
        </div>

        {/* Security / Privacy Footer */}
        <div className="mt-4 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Double-blind pseudonymity cryptographically guaranteed</span>
        </div>
      </div>
    </div>
  );
};
