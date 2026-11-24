import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { FileText, ArrowRight, Lock, Mail } from 'lucide-react';

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
      }
    } catch (err: any) {
      showToast('error', 'Login Failed', err.message || 'Could not authenticate demo profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-sm w-full space-y-6">
        {/* Brand header */}
        <div className="text-center">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center mx-auto shadow-2xs mb-3">
            <FileText className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">AcademicLedger</h2>
          <p className="text-xs text-slate-500 mt-1">
            Peer-review tracker backed by distributed ledger proofs
          </p>
        </div>

        {/* Demo Accounts Bar */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Fast Switch Demo Accounts
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            {DEMO_PROFILES.map((p) => (
              <button
                key={p.role}
                type="button"
                onClick={() => handleQuickDemo(p)}
                className="p-2 rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-colors"
              >
                <div className="font-medium text-slate-800 text-xs">{p.label}</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">{p.pseudonym}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-medium text-slate-900 hover:underline">
              Register as Author or Reviewer
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
