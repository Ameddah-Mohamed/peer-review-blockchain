import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 text-center">
      <div className="max-w-md w-full space-y-4">
        <div className="w-12 h-12 rounded-md bg-white border border-slate-200 text-slate-500 flex items-center justify-center mx-auto shadow-2xs">
          <FileQuestion className="w-6 h-6 text-slate-600" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">404 — Page Not Found</h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            The requested manuscript, audit log, or page resource could not be located or has restricted access.
          </p>
        </div>
        <div className="pt-2">
          <Link to="/">
            <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Return to Workspace
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
