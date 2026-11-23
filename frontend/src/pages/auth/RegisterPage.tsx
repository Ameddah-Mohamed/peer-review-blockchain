import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { UserRole } from '../../types';
import { FileText, Shield, User, Mail, Lock, Building, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('author');
  const [affiliation, setAffiliation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      showToast('warning', 'Missing Fields', 'Please complete all required fields.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name,
        email,
        password,
        role,
        affiliation,
      });

      showToast(
        'success',
        'Account Registered',
        `Welcome ${name}! Your pseudonym has been generated for double-blind privacy.`
      );

      if (role === 'author') navigate('/author');
      else if (role === 'reviewer') navigate('/reviewer');
      else if (role === 'admin') navigate('/admin');
    } catch (err: any) {
      showToast('error', 'Registration Failed', err.message || 'Unable to register user.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-md shadow-brand-500/20 mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create an Account</h2>
          <p className="text-xs text-slate-500 mt-1">
            Join the decentralized academic conference peer-review network
          </p>
        </div>

        {/* Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Your Conference Role *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('author')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    role === 'author'
                      ? 'bg-brand-50 border-brand-500 text-brand-900 ring-2 ring-brand-500/20 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-semibold">Author</div>
                  <div className="text-[10px] text-slate-500">Student/Researcher</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('reviewer')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    role === 'reviewer'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-semibold">Reviewer</div>
                  <div className="text-[10px] text-slate-500">Professor/Expert</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    role === 'admin'
                      ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-500/20 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-semibold">Admin</div>
                  <div className="text-[10px] text-slate-500">Organizer</div>
                </button>
              </div>
            </div>

            {/* Pseudonym banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <p>
                A unique pseudonym (e.g.{' '}
                <span className="font-mono font-bold text-purple-700">
                  {role === 'author' ? 'AUTH-XXXXXX' : role === 'reviewer' ? 'REV-XXXXXX' : 'ADM-XXXXXX'}
                </span>
                ) will be generated automatically to uphold double-blind privacy.
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Alice Chen"
                  className="w-full text-xs sm:text-sm pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Institutional Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full text-xs sm:text-sm pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            {/* Affiliation */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                University / Institution
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  placeholder="e.g. Department of Computer Science"
                  className="w-full text-xs sm:text-sm pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-xs sm:text-sm pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Complete Registration
            </Button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
