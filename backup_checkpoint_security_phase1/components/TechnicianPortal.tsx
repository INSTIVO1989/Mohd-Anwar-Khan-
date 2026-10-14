import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Job } from '../types';
import {
  Wrench,
  Navigation,
  CheckCircle,
  PlusCircle,
  Clock,
  MapPin,
  Phone,
  DollarSign,
  AlertCircle,
  Camera,
  Check,
  ChevronRight,
} from 'lucide-react';

export const TechnicianPortal: React.FC = () => {
  const {
    jobs,
    selectedTechId,
    setSelectedTechId,
    technicians,
    updateJobStatus,
    requestAddOn,
    completeJob,
    recordPayment,
    isDemoMode,
    currentUser,
    firebaseUser,
    setIsAuthModalOpen,
    setAuthModalTargetRole,
    setIsDemoMode,
  } = useApp();

  const [activeJobModal, setActiveJobModal] = useState<Job | null>(null);
  const [isAddOnModalOpen, setIsAddOnModalOpen] = useState(false);
  const [addOnDescription, setAddOnDescription] = useState('Wall anchoring & anti-tip brackets');
  const [addOnAmount, setAddOnAmount] = useState<number>(300);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('All bolts tightened, hydraulic struts tested, work area cleaned.');

  // Enforce access authorization in Live Mode
  if (!isDemoMode && currentUser?.role !== 'technician' && currentUser?.role !== 'admin') {
    return (
      <div className="py-16 px-4 max-w-2xl mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto shadow-sm">
          <Wrench className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Technician Field Access Required</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Please sign in with your verified technician credentials to view your assigned work orders and log on-site completion.
          </p>
          {firebaseUser && (
            <p className="text-xs text-slate-500 font-medium">
              Signed in as: <span className="font-semibold text-slate-800">{firebaseUser.email}</span> (Role: {currentUser?.role || 'Customer'})
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              setAuthModalTargetRole('technician');
              setIsAuthModalOpen(true);
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
          >
            Sign In with Technician Account
          </button>
          <button
            onClick={() => setIsDemoMode(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Switch to Sandbox Demo Mode
          </button>
        </div>
      </div>
    );
  }

  // In live mode, technician ID is bound to the verified profile
  const effectiveTechId = (!isDemoMode && currentUser?.technicianId) ? currentUser.technicianId : selectedTechId;
  const currentTechnician = technicians.find((t) => t.id === effectiveTechId) || technicians[0];

  // Jobs assigned to this technician
  const techJobs = jobs.filter((j) => j.assignedTechId === effectiveTechId);
  const activeJobs = techJobs.filter((j) => !['Completed', 'Paid', 'Cancelled'].includes(j.status));
  const completedJobs = techJobs.filter((j) => ['Work Completed', 'Customer Confirmed', 'Paid'].includes(j.status));

  const handleStartJob = (jobId: string) => {
    updateJobStatus(jobId, 'In Progress', 'Technician arrived at premises and commenced work', currentTechnician.name);
  };

  const handleAcceptJob = (jobId: string) => {
    updateJobStatus(jobId, 'Accepted', 'Technician acknowledged and scheduled transit', currentTechnician.name);
  };

  const handleOpenAddOnModal = (job: Job) => {
    setActiveJobModal(job);
    setIsAddOnModalOpen(true);
  };

  const handleSubmitAddOn = () => {
    if (!activeJobModal || !addOnDescription.trim() || addOnAmount <= 0) return;
    requestAddOn(activeJobModal.id, addOnDescription, addOnAmount);
    setIsAddOnModalOpen(false);
  };

  const handleOpenCompleteModal = (job: Job) => {
    setActiveJobModal(job);
    setIsCompleteModalOpen(true);
  };

  const handleFinishCompletion = () => {
    if (!activeJobModal) return;
    completeJob(activeJobModal.id, completionNotes);
    setIsCompleteModalOpen(false);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      {/* Technician Profile Card Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center font-bold text-xl">
            <Wrench className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                Technician Field Portal
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {currentTechnician.id}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
              {currentTechnician.name}
            </h2>
            <p className="text-xs text-slate-400">
              Base Hub: {currentTechnician.baseLocality} · Rating: {currentTechnician.rating} ★
            </p>
          </div>
        </div>

        {/* Switch technician dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400 font-medium">Switch Staff:</label>
          <select
            value={selectedTechId}
            onChange={(e) => setSelectedTechId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none font-semibold cursor-pointer"
          >
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI stats for technician */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium block">Active Jobs</span>
          <span className="text-2xl font-black text-slate-900 font-mono">
            {activeJobs.length}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium block">Completed Today</span>
          <span className="text-2xl font-black text-teal-600 font-mono">
            {completedJobs.length}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium block">Payout Accrued</span>
          <span className="text-2xl font-black text-amber-600 font-mono tabular-nums">
            ₹{techJobs.reduce((sum, j) => sum + j.technicianPayout, 0)}
          </span>
        </div>
      </div>

      {/* Active Jobs Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-base">
            Today's Assigned Route ({activeJobs.length} Jobs Pending)
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Operating Hours: 8:00 AM – 10:00 PM
          </span>
        </div>

        {activeJobs.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
            No active jobs in your queue. Great job! Check with dispatcher for new incoming requests.
          </div>
        ) : (
          activeJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {job.id}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                      {job.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-base mt-1">
                    {job.customer.name}
                  </h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.customer.address}, {job.customer.locality} ({job.customer.pincode})</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-medium">Your Payout:</span>
                  <span className="text-lg font-black font-mono text-teal-600">
                    ₹{job.technicianPayout}
                  </span>
                </div>
              </div>

              {/* Items & Scope */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
                <span className="font-semibold text-slate-700 block">Furniture to Assemble:</span>
                {job.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-slate-600">
                    <span>• {it.name} (Qty: {it.quantity})</span>
                    <span className="font-mono font-semibold">₹{it.total}</span>
                  </div>
                ))}
                {job.description && (
                  <p className="text-[11px] text-amber-800 italic pt-1 border-t border-slate-200">
                    Notes: {job.description}
                  </p>
                )}
              </div>

              {/* Add-ons status */}
              {job.addOns.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <span className="font-semibold text-slate-700">Add-On History:</span>
                  {job.addOns.map((a) => (
                    <div
                      key={a.id}
                      className={`p-2 rounded-lg flex items-center justify-between text-[11px] ${
                        a.status === 'approved'
                          ? 'bg-teal-50 text-teal-800'
                          : a.status === 'pending'
                          ? 'bg-amber-50 text-amber-800 font-bold'
                          : 'bg-red-50 text-red-800'
                      }`}
                    >
                      <span>{a.description}</span>
                      <span className="uppercase font-mono">{a.status}: ₹{a.amount}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                {/* Navigate via Google Maps */}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${job.customer.address}, ${job.customer.locality}, Mumbai`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5 text-teal-600" />
                  <span>Google Maps Route</span>
                </a>

                {/* Call Customer */}
                <a
                  href={`tel:${job.customer.mobile}`}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-600" />
                  <span>Call Customer</span>
                </a>

                {/* Status Transitions */}
                {job.status === 'Assigned' && (
                  <button
                    onClick={() => handleAcceptJob(job.id)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl cursor-pointer ml-auto"
                  >
                    Accept Job
                  </button>
                )}

                {job.status === 'Accepted' && (
                  <button
                    onClick={() => handleStartJob(job.id)}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl cursor-pointer ml-auto"
                  >
                    Start Work Onsite
                  </button>
                )}

                {job.status === 'In Progress' && (
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => handleOpenAddOnModal(job)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-amber-400 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Request Add-On</span>
                    </button>

                    <button
                      onClick={() => handleOpenCompleteModal(job)}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Complete Work</span>
                    </button>
                  </div>
                )}

                {['Work Completed', 'Customer Confirmed'].includes(job.status) && job.paymentStatus === 'Pending' && (
                  <button
                    onClick={() => recordPayment(job.id, 'Cash')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer ml-auto"
                  >
                    Collect Cash / UPI (₹{job.finalTotal})
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Completed jobs history */}
      {completedJobs.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-slate-200">
          <h3 className="font-bold text-slate-800 text-sm">
            Completed / Paid Records ({completedJobs.length})
          </h3>
          <div className="space-y-2">
            {completedJobs.map((cj) => (
              <div
                key={cj.id}
                className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{cj.id}</span>
                    <span className="text-teal-700 font-semibold">{cj.customer.name}</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    {cj.items.map((i) => i.name).join(', ')}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-teal-600 uppercase font-bold block">
                    Paid ({cj.paymentMethod || 'UPI'})
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    Earned: ₹{cj.technicianPayout}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: REQUEST ADD-ON (FROM BUSINESS PLAN) */}
      {isAddOnModalOpen && activeJobModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-base">
                Propose Onsite Add-On
              </h4>
              <button
                onClick={() => setIsAddOnModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              According to the Furniture Fix rule, technicians must never inflate bills secretly. Propose the additional scope here so the customer approves it on their device first.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Extra Service / Scope Description:
              </label>
              <select
                value={addOnDescription}
                onChange={(e) => setAddOnDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
              >
                <option value="Wall anchoring for hydraulic bed (high security)">
                  Wall anchoring for hydraulic bed (₹300)
                </option>
                <option value="Drawer telescopic channel replacement">
                  Drawer channel replacement (₹299)
                </option>
                <option value="Cabinet hinge realignment and tuning">
                  Cabinet hinge realignment (₹199)
                </option>
                <option value="Simple mirror / shelf wall mounting">
                  Simple wall mounting (₹499)
                </option>
                <option value="Old furniture dismantling assistance">
                  Dismantling assistance (₹350)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Charge Amount (₹):
              </label>
              <input
                type="number"
                value={addOnAmount}
                onChange={(e) => setAddOnAmount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddOnModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAddOn}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
              >
                Submit to Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COMPLETE JOB */}
      {isCompleteModalOpen && activeJobModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-base">
                Confirm Work Completion
              </h4>
              <button
                onClick={() => setIsCompleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Verify that the customer inspected all drawers, doors, and bed mechanisms.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Technician Inspection Notes:
              </label>
              <textarea
                rows={2}
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
              />
            </div>

            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 flex items-center gap-2">
              <Camera className="w-4 h-4 text-teal-600" />
              <span>Completion evidence photo recorded to job file.</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCompleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleFinishCompletion}
                className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs"
              >
                Mark Completed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
