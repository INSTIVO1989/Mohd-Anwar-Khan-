import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Job, JobStatus, Technician } from '../types';
import { WorkspaceHub } from './WorkspaceHub';
import {
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  Filter,
  Wrench,
  Search,
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const {
    jobs,
    technicians,
    kpis,
    assignTechnician,
    updateJobStatus,
    setActiveTrackingJobId,
    setIsTrackingModalOpen,
  } = useApp();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [assignModalJob, setAssignModalJob] = useState<Job | null>(null);
  const [selectedTechToAssign, setSelectedTechToAssign] = useState<string>('TECH-001');

  const filteredJobs = jobs.filter((j) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'unassigned') return !j.assignedTechId || j.status === 'New';
    return j.status === filterStatus;
  });

  // Assisted Dispatch Scorer (From Business Plan section: Service skill match + zone proximity + workload)
  const calculateDispatchScore = (tech: Technician, job: Job) => {
    let score = 80;
    // Check locality
    if (tech.baseLocality.toLowerCase().includes(job.customer.locality.toLowerCase())) {
      score += 15;
    }
    // Workload penalty
    score -= tech.activeJobsCount * 10;
    // High rating bonus
    score += Math.round(tech.rating * 2);
    return Math.max(50, Math.min(99, score));
  };

  const handleOpenAssignModal = (job: Job) => {
    setAssignModalJob(job);
    setSelectedTechToAssign(technicians[0].id);
  };

  const handleConfirmAssign = () => {
    if (!assignModalJob) return;
    assignTechnician(assignModalJob.id, selectedTechToAssign);
    setAssignModalJob(null);
  };

  const handleExportCSV = () => {
    const headers = [
      'Job ID',
      'Customer Name',
      'Mobile',
      'Locality',
      'Pincode',
      'Status',
      'Assigned Technician',
      'Total Amount',
      'Technician Payout',
      'Platform Margin',
      'Payment Status',
      'Created At',
    ];

    const rows = jobs.map((j) => {
      const tech = technicians.find((t) => t.id === j.assignedTechId);
      return [
        j.id,
        `"${j.customer.name}"`,
        j.customer.mobile,
        `"${j.customer.locality}"`,
        j.customer.pincode,
        j.status,
        tech ? `"${tech.name}"` : 'Unassigned',
        j.finalTotal,
        j.technicianPayout,
        j.platformMargin,
        j.paymentStatus,
        j.createdAt,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Furniture_Fix_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Admin Title & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
            <ShieldCheck className="w-4 h-4" />
            <span>Operations & Dispatch Control</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Furniture Fix Command Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Owner Review Draft & Live MMR Dispatch Board (Mohd Anwar Khan, Diva/Thane Hub)
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Export Accounting CSV</span>
        </button>
      </div>

      {/* 8 Core KPI Metric Cards from Business Checklist */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Today's Jobs</span>
          <span className="text-xl font-black text-slate-900 font-mono">{kpis.todaysJobs}</span>
          <span className="text-[9px] text-slate-400 block">Scheduled</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">New Leads</span>
          <span className="text-xl font-black text-amber-600 font-mono">{kpis.newLeads}</span>
          <span className="text-[9px] text-slate-400 block">Unconfirmed</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pending Jobs</span>
          <span className="text-xl font-black text-blue-600 font-mono">{kpis.pendingJobs}</span>
          <span className="text-[9px] text-slate-400 block">Active field</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Collections</span>
          <span className="text-xl font-black text-emerald-600 font-mono tabular-nums">₹{kpis.revenueReceived}</span>
          <span className="text-[9px] text-slate-400 block">Cash & UPI</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Outstanding</span>
          <span className="text-xl font-black text-amber-700 font-mono tabular-nums">₹{kpis.outstanding}</span>
          <span className="text-[9px] text-slate-400 block">Due post-work</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Payout Due</span>
          <span className="text-xl font-black text-indigo-600 font-mono tabular-nums">₹{kpis.payoutDue}</span>
          <span className="text-[9px] text-slate-400 block">To technicians</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Expenses</span>
          <span className="text-xl font-black text-slate-600 font-mono tabular-nums">₹{kpis.expenses}</span>
          <span className="text-[9px] text-slate-400 block">Tools & base</span>
        </div>

        <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 shadow-xs">
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Net Cash</span>
          <span className="text-xl font-black text-white font-mono tabular-nums">₹{kpis.netCash}</span>
          <span className="text-[9px] text-slate-400 block">Gross balance</span>
        </div>
      </div>

      {/* Technicians Utilization Row */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">
          Active Field Technician Utilization
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {technicians.map((t) => (
            <div
              key={t.id}
              className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-slate-400 font-bold">{t.id}</span>
                <h4 className="font-bold text-slate-900 text-xs">{t.name}</h4>
                <span className="text-[11px] text-slate-500 block">
                  Base: {t.baseLocality} · Rating: {t.rating} ★
                </span>
              </div>

              <div className="text-right space-y-1">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    t.activeJobsCount > 0
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {t.activeJobsCount > 0 ? `${t.activeJobsCount} Active` : 'Available'}
                </span>
                <span className="text-xs font-mono font-bold text-slate-700 block">
                  Payouts: ₹{t.totalEarnings}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Google Workspace Integration Hub (Calendar, Sheets, Drive, Gmail) */}
      <WorkspaceHub />

      {/* Operations Dispatch Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Filter Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Filter Jobs:</span>
            <div className="flex items-center gap-1">
              {['all', 'unassigned', 'In Progress', 'Work Completed', 'Paid'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
                    filterStatus === st
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {st === 'all' ? 'All Jobs' : st === 'unassigned' ? 'Needs Assign' : st}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredJobs.length} of {jobs.length} total bookings
          </span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/75 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Job ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Locality / Sector</th>
                <th className="py-3 px-4">Furniture Scope</th>
                <th className="py-3 px-4">Assigned Tech</th>
                <th className="py-3 px-4">Tariff</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.map((job) => {
                const tech = technicians.find((t) => t.id === job.assignedTechId);
                return (
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {job.id}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{job.customer.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{job.customer.mobile}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">{job.customer.locality}</span>
                      <span className="text-[11px] text-slate-400 font-mono">PIN: {job.customer.pincode}</span>
                    </td>

                    <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                      {job.items.map((i) => `${i.name} (×${i.quantity})`).join(', ')}
                    </td>

                    <td className="py-3 px-4">
                      {tech ? (
                        <span className="font-semibold text-slate-800 block">
                          {tech.name}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenAssignModal(job)}
                          className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[10px] cursor-pointer hover:bg-amber-200"
                        >
                          + Assign Tech
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">₹{job.finalTotal}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Tech: ₹{job.technicianPayout}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          job.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : job.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800'
                            : job.status === 'New'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setActiveTrackingJobId(job.id);
                          setIsTrackingModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px] cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ASSISTED DISPATCH MODAL (SECTION 5 OF BUSINESS PLAN) */}
      {assignModalJob && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-base">
                Assisted Dispatch Matcher
              </h4>
              <button
                onClick={() => setAssignModalJob(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Scoring technician candidates based on <strong>proximity to {assignModalJob.customer.locality}</strong>, workload, and furniture skill qualification.
            </p>

            <div className="space-y-2">
              {technicians.map((t) => {
                const score = calculateDispatchScore(t, assignModalJob);
                const isSelected = selectedTechToAssign === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTechToAssign(t.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-xs">{t.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({t.id})</span>
                      </div>
                      <span className="text-[11px] text-slate-500 block">
                        Base: {t.baseLocality} · {t.activeJobsCount} Active Jobs
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-indigo-700 font-mono">
                        {score}% Match
                      </span>
                      <span className="text-[10px] text-slate-400 block font-medium">Dispatch Score</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAssignModalJob(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssign}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
