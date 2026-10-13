import React from 'react';
import { useApp } from '../context/AppContext';
import { User, Wrench, ShieldCheck, ChevronUp } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { role, setRole, selectedTechId, setSelectedTechId, technicians, jobs } = useApp();

  const newJobsCount = jobs.filter((j) => j.status === 'New').length;
  const currentTechJobs = jobs.filter(
    (j) => j.assignedTechId === selectedTechId && !['Completed', 'Paid', 'Cancelled'].includes(j.status)
  ).length;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md text-white px-4 py-2.5 rounded-full shadow-2xl border border-slate-700/60 flex items-center gap-3 text-xs font-semibold max-w-[92vw] overflow-x-auto">
      <span className="text-slate-400 text-[11px] font-medium uppercase tracking-wider hidden sm:inline">
        View As:
      </span>

      <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-full border border-slate-700">
        {/* Customer Role */}
        <button
          onClick={() => setRole('customer')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap ${
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
          onClick={() => setRole('technician')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap relative ${
            role === 'technician'
              ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Technician</span>
          {currentTechJobs > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        {/* Admin Role */}
        <button
          onClick={() => setRole('admin')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap relative ${
            role === 'admin'
              ? 'bg-indigo-500 text-white font-bold shadow-xs'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Admin Dispatch</span>
          {newJobsCount > 0 && (
            <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
              {newJobsCount}
            </span>
          )}
        </button>
      </div>

      {/* When Technician view is active, allow quick selection of technician */}
      {role === 'technician' && (
        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
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
    </div>
  );
};
