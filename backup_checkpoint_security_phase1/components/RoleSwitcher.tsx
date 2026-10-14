import React from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  User,
  Wrench,
  ShieldCheck,
  Globe,
  FlaskConical,
  Lock,
  LogOut,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const {
    isDemoMode,
    setIsDemoMode,
    role,
    setRole,
    selectedTechId,
    setSelectedTechId,
    technicians,
    jobs,
    currentUser,
    firebaseUser,
    setIsAuthModalOpen,
    setAuthModalTargetRole,
    switchDemoRole,
  } = useApp();

  const newJobsCount = jobs.filter((j) => j.status === 'New').length;
  const currentTechJobs = jobs.filter(
    (j) => j.assignedTechId === selectedTechId && !['Completed', 'Paid', 'Cancelled'].includes(j.status)
  ).length;

  const handleRoleClick = (targetRole: UserRole) => {
    if (isDemoMode) {
      // In Demo Mode: direct free switching for testing all business workflows
      switchDemoRole(targetRole);
      return;
    }

    // In Live Mode: Enforce strict RBAC access
    if (targetRole === 'customer') {
      setRole('customer');
      return;
    }

    if (!firebaseUser) {
      // Prompt sign in with required role
      setAuthModalTargetRole(targetRole);
      setIsAuthModalOpen(true);
      return;
    }

    if (targetRole === 'admin') {
      if (currentUser?.role === 'admin') {
        setRole('admin');
      } else {
        setAuthModalTargetRole('admin');
        setIsAuthModalOpen(true);
      }
      return;
    }

    if (targetRole === 'technician') {
      if (currentUser?.role === 'technician' || currentUser?.role === 'admin') {
        setRole('technician');
      } else {
        setAuthModalTargetRole('technician');
        setIsAuthModalOpen(true);
      }
      return;
    }
  };

  return (
    <aside aria-label="Role and Environment Controls" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1.5 max-w-[96vw]">
      {/* Clear Mode Indicator Pill */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold shadow-lg backdrop-blur-md border transition-all">
        {isDemoMode ? (
          <div className="flex items-center gap-2 text-purple-900 bg-purple-100 border border-purple-300 px-3 py-0.5 rounded-full">
            <FlaskConical className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
            <span>Sandbox Demo Mode (Mock Jobs & Fast Testing)</span>
            <button
              onClick={() => setIsDemoMode(false)}
              className="ml-1 text-[10px] bg-purple-700 hover:bg-purple-800 text-white px-2 py-0.5 rounded-full font-extrabold cursor-pointer transition-colors"
            >
              Switch to Live Cloud
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-900 bg-emerald-100 border border-emerald-300 px-3 py-0.5 rounded-full">
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>Live Cloud Mode (Cloud Firestore Active)</span>
            <button
              onClick={() => setIsDemoMode(true)}
              className="ml-1 text-[10px] bg-emerald-800 hover:bg-emerald-900 text-white px-2 py-0.5 rounded-full font-extrabold cursor-pointer transition-colors"
            >
              Enable Sandbox Demo
            </button>
          </div>
        )}
      </div>

      {/* Main Bottom Bar */}
      <div className="bg-slate-900/95 backdrop-blur-md text-white px-3 sm:px-4 py-2 rounded-full shadow-2xl border border-slate-700/80 flex items-center gap-2.5 text-xs font-semibold overflow-x-auto">
        <span className="text-slate-400 text-[11px] font-medium uppercase tracking-wider hidden sm:inline pl-1">
          {isDemoMode ? 'Preview Role:' : 'Portal:'}
        </span>

        <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-full border border-slate-700">
          {/* Customer Role */}
          <button
            onClick={() => handleRoleClick('customer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap ${
              role === 'customer'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Customer</span>
          </button>

          {/* Technician Role */}
          <button
            onClick={() => handleRoleClick('technician')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap relative ${
              role === 'technician'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Technician</span>
            {!isDemoMode && (!firebaseUser || currentUser?.role !== 'technician') && (
              <Lock className="w-2.5 h-2.5 text-slate-400 ml-0.5" />
            )}
            {currentTechJobs > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          {/* Admin Role */}
          <button
            onClick={() => handleRoleClick('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap relative ${
              role === 'admin'
                ? 'bg-indigo-500 text-white font-bold shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Dispatch</span>
            {!isDemoMode && (!firebaseUser || currentUser?.role !== 'admin') && (
              <Lock className="w-2.5 h-2.5 text-slate-400 ml-0.5" />
            )}
            {newJobsCount > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                {newJobsCount}
              </span>
            )}
          </button>
        </div>

        {/* When Technician view is active in Demo mode, allow rapid switching of tech identity */}
        {role === 'technician' && isDemoMode && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
            <span className="text-[10px] text-teal-300 font-bold uppercase hidden md:inline">Tech:</span>
            <select
              value={selectedTechId}
              onChange={(e) => setSelectedTechId(e.target.value)}
              className="bg-slate-800 text-teal-300 border border-slate-700 text-xs rounded-lg px-2 py-1 outline-none font-medium cursor-pointer"
            >
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.id})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* User Account / Auth Trigger */}
        <div className="pl-2 border-l border-slate-700 flex items-center">
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="User Profile & Authentication"
          >
            {firebaseUser ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="max-w-[80px] truncate">{firebaseUser.displayName?.split(' ')[0] || 'User'}</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Login</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
