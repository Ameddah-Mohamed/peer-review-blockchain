import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <Header onMenuToggle={() => setIsMobileSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

        {/* Minimal Academic Footer */}
        <footer className="border-t border-slate-200/80 bg-white/50 py-4 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">AcademicLedger</span>
            <span>•</span>
            <span className="text-slate-400">Decentralized Peer-Review & Integrity Protocol</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            SHA-256 Non-Repudiation • Double-Blind Sealed
          </div>
        </footer>
      </div>
    </div>
  );
};
