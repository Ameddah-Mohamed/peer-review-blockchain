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
        `Welcome ${name}! Your cryptographic pseudonym has been assigned for double-blind privacy.`
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
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center mx-auto shadow-2xs mb-3">
            <FileText className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create an Account</h2>
          <p className="text-xs text-slate-500 mt-1">
            Join the academic conference peer-review network
          </p>
        </div>

        {/* Card */}
        <div className="bg-white p-6 sm:p-7 rounded-lg border border-slate-200 shadow-2xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selector */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Conference Role *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('author')}
                  className={`p-2.5 rounded-md border text-center transition-all ${
                    role === 'author'
                      ? 'bg-slate-100 border-slate-900 text-slate-900 font-semibold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-medium">Author</div>
                  <div className="text-[10px] text-slate-400">Student / Researcher</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('reviewer')}
                  className={`p-2.5 rounded-md border text-center transition-all ${
                    role === 'reviewer'
                      ? 'bg-slate-100 border-slate-900 text-slate-900 font-semibold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-medium">Reviewer</div>
                  <div className="text-[10px] text-slate-400">Professor / Expert</div>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Note: Administrator accounts are provisioned directly by conference organizers.
              </p>
            </div>

            {/* Pseudonym banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs text-slate-600 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <p>
                A unique pseudonym (e.g.{' '}
                <span className="font-mono font-bold text-slate-800">
                  {role === 'author' ? 'AUTH-XXXXXX' : 'REV-XXXXXX'}
                </span>
                ) will be generated automatically to uphold double-blind privacy.
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Alice Chen"
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Institutional Email *
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

            {/* Affiliation */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                University / Institution
              </label>
              <div className="relative">
                <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  placeholder="e.g. Department of Computer Science, State University"
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password *</label>
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
              Create Account
            </Button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-slate-900 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
