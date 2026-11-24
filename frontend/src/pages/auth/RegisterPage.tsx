import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { UserRole } from '../../types';
import { ShieldCheck, User, Mail, Lock, Building, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon & Wordmark */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20 mx-auto">
            <span className="font-mono text-base tracking-tighter">AL</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Create Academic Identity
          </h2>
          <p className="text-xs text-slate-500">
            Join the decentralized conference review & verification network
          </p>
        </div>

        {/* Card */}
        <div className="mt-6 bg-white py-8 px-6 shadow-2xs rounded-xl border border-slate-200 sm:px-8 space-y-5">
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
                  className={`p-3 rounded-lg border text-center transition-all ${
                    role === 'author'
                      ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-semibold">Author</div>
                  <div className={`text-[10px] mt-0.5 ${role === 'author' ? 'text-slate-300' : 'text-slate-400'}`}>
                    Submit Manuscripts
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('reviewer')}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    role === 'reviewer'
                      ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-semibold">Reviewer</div>
                  <div className={`text-[10px] mt-0.5 ${role === 'reviewer' ? 'text-slate-300' : 'text-slate-400'}`}>
                    Peer Committee Expert
                  </div>
                </button>
              </div>
            </div>

            {/* Pseudonym banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                A unique, cryptographically random pseudonym (e.g.{' '}
                <span className="font-mono font-medium text-slate-900">
                  {role === 'author' ? 'AUTH-9F4B12' : 'REV-8C2190'}
                </span>
                ) will be generated for you to ensure rigorous double-blind evaluation.
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Alice Chen"
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Institutional Email *
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

            {/* Affiliation */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                University / Institution
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  placeholder="e.g. Department of Computer Science, University"
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password *</label>
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
              className="w-full mt-2"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Register Identity
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
