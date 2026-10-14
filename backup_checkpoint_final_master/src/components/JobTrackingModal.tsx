import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Job, JobStatus } from '../types';
import { getBookingById } from '../services/firestoreService';
import {
  X,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  Phone,
  AlertTriangle,
  Receipt,
  QrCode,
  Share2,
  Check,
  Wrench,
  Loader2,
} from 'lucide-react';

const STATUS_ORDER: JobStatus[] = [
  'New',
  'Scheduled',
  'Assigned',
  'Accepted',
  'In Progress',
  'Work Completed',
  'Paid',
];

export const JobTrackingModal: React.FC = () => {
  const {
    isTrackingModalOpen,
    setIsTrackingModalOpen,
    activeTrackingJobId,
    setActiveTrackingJobId,
    jobs,
    technicians,
    respondToAddOn,
    recordPayment,
    firebaseUser,
    setIsAuthModalOpen,
  } = useApp();

  const [searchId, setSearchId] = useState('');
  const [remoteJob, setRemoteJob] = useState<Job | null>(null);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);
  const [searchNotFound, setSearchNotFound] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash'>('UPI');
  const [showQr, setShowQr] = useState(false);

  const targetId = activeTrackingJobId || searchId.trim();

  // Look in local jobs first
  const localJob = jobs.find((j) => j.id.toLowerCase() === targetId.toLowerCase());

  // If not in local jobs, query Firestore
  useEffect(() => {
    if (!targetId || localJob) {
      setRemoteJob(null);
      setSearchNotFound(false);
      return;
    }

    let isMounted = true;
    setIsSearchingRemote(true);
    setSearchNotFound(false);

    getBookingById(targetId)
      .then((doc) => {
        if (!isMounted) return;
        if (doc) {
          setRemoteJob(doc);
          setSearchNotFound(false);
        } else {
          setRemoteJob(null);
          setSearchNotFound(true);
        }
      })
      .catch((err) => {
        console.error('Remote lookup failed:', err);
        if (isMounted) setSearchNotFound(true);
      })
      .finally(() => {
        if (isMounted) setIsSearchingRemote(false);
      });

    return () => {
      isMounted = false;
    };
  }, [targetId, localJob]);

  if (!isTrackingModalOpen) return null;

  const currentJob: Job | undefined = localJob || remoteJob || jobs[0];

  const assignedTech = technicians.find((t) => t.id === currentJob?.assignedTechId);

  const getStatusIndex = (status: JobStatus) => {
    return STATUS_ORDER.indexOf(status);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      setActiveTrackingJobId(searchId.trim().toUpperCase());
    }
  };

  const handlePayNow = () => {
    if (!currentJob) return;
    recordPayment(currentJob.id, paymentMethod);
    setShowQr(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 block">
              Furniture Fix Job Tracking
            </span>
            <h3 className="text-base font-bold font-mono">
              Job ID: {currentJob ? currentJob.id : 'Search Booking'}
            </h3>
          </div>

          <button
            onClick={() => setIsTrackingModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lookup bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter Job ID (e.g. FF-26-04287)..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSearchingRemote}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSearchingRemote && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Track</span>
            </button>
          </form>

          {searchNotFound && (
            <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
              <p className="text-xs text-amber-900 font-medium">
                No active booking found matching "{targetId}" in this session, or access is protected by privacy rules.
              </p>
              {!firebaseUser && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-amber-800">Booked with your Google account?</span>
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Sign In to View
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {currentJob ? (
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Status Stepper Header */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[11px] text-slate-500 block font-medium">Current Status</span>
                  <span className="text-base font-black text-slate-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    {currentJob.status}
                  </span>
                </div>

                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    currentJob.paymentStatus === 'Paid'
                      ? 'bg-teal-100 text-teal-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {currentJob.paymentStatus === 'Paid' ? 'Paid in Full' : 'Payment Due After Work'}
                </span>
              </div>

              {/* Progress Steps */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 text-center text-[10px]">
                {STATUS_ORDER.map((s, idx) => {
                  const currentIdx = getStatusIndex(currentJob.status);
                  const isDone = currentIdx >= idx;
                  const isCurrent = currentJob.status === s;
                  return (
                    <div key={s} className="space-y-1">
                      <div
                        className={`h-2 rounded-full transition-colors ${
                          isDone ? 'bg-teal-600' : 'bg-slate-200'
                        }`}
                      />
                      <span
                        className={`block truncate font-medium ${
                          isCurrent
                            ? 'text-teal-700 font-bold'
                            : isDone
                            ? 'text-slate-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {s}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PENDING ADD-ON APPROVAL ALERT (CRITICAL WORKFLOW FROM PLAN) */}
            {currentJob.addOns.filter((a) => a.status === 'pending').length > 0 && (
              <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-xl space-y-3 animate-pulse">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>On-Site Add-On Request Awaiting Your Approval!</span>
                </div>
                <p className="text-xs text-amber-800">
                  Your technician has inspected the furniture on-site and proposed the following additional line item. We will NOT begin extra work until you approve:
                </p>

                {currentJob.addOns
                  .filter((a) => a.status === 'pending')
                  .map((addOn) => (
                    <div
                      key={addOn.id}
                      className="bg-white p-3 rounded-lg border border-amber-200 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">
                          {addOn.description}
                        </span>
                        <span className="text-[11px] text-amber-700 font-mono font-bold">
                          +₹{addOn.amount}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => respondToAddOn(currentJob.id, addOn.id, false)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => respondToAddOn(currentJob.id, addOn.id, true)}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer shadow-xs"
                        >
                          Approve ₹{addOn.amount}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Assigned Technician Card */}
            {assignedTech && (
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-sm">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 block">
                        Assigned Specialist
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {assignedTech.name}
                      </h4>
                      <span className="text-xs text-slate-500 font-medium">
                        Rating: {assignedTech.rating} ★ · Base: {assignedTech.baseLocality}
                      </span>
                    </div>
                  </div>

                  <a
                    href={`tel:${assignedTech.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg"
                  >
                    <Phone className="w-3.5 h-3.5 text-amber-600" />
                    <span>Call Tech</span>
                  </a>
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg flex items-center justify-between">
                  <span>Scheduled Appointment Window:</span>
                  <strong className="text-slate-900">
                    {currentJob.appointmentDate} ({currentJob.appointmentSlot})
                  </strong>
                </div>
              </div>
            )}

            {/* Itemized Order & Invoice Summary */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-slate-400" />
                <span>Job Itemization & Scope</span>
              </h4>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2 text-xs">
                {currentJob.items.map((i, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-200/60 last:border-0">
                    <div>
                      <span className="font-semibold text-slate-900">{i.name}</span>
                      <span className="text-[11px] text-slate-500 block">Qty: {i.quantity}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{i.total}
                    </span>
                  </div>
                ))}

                {/* Approved Add-Ons */}
                {currentJob.addOns.filter((a) => a.status === 'approved').map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-1 text-teal-700 font-medium">
                    <span>Approved Add-on: {a.description}</span>
                    <span className="font-mono font-bold">+₹{a.amount}</span>
                  </div>
                ))}

                {/* Travel */}
                <div className="flex items-center justify-between py-1 text-slate-600">
                  <span>Travel Fee ({currentJob.customer.locality}):</span>
                  <span className="font-mono font-medium">
                    {currentJob.travelCharge === 0 ? 'FREE' : `₹${currentJob.travelCharge}`}
                  </span>
                </div>

                {/* Total */}
                <div className="pt-2 border-t border-slate-300 flex items-baseline justify-between">
                  <span className="font-bold text-slate-900 text-sm">Total Amount Due:</span>
                  <span className="font-mono font-black text-xl text-slate-950">
                    ₹{currentJob.finalTotal}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Closeout Section */}
            {currentJob.paymentStatus === 'Pending' && ['Work Completed', 'Customer Confirmed', 'In Progress'].includes(currentJob.status) && (
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-teal-700" />
                    <div>
                      <h4 className="font-bold text-teal-950 text-xs">
                        Ready to Pay on Completion?
                      </h4>
                      <p className="text-[11px] text-teal-800">
                        Pay Mohd Anwar Khan / Furniture Fix directly via UPI or Cash
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-teal-200 text-xs">
                    <button
                      onClick={() => setPaymentMethod('UPI')}
                      className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${
                        paymentMethod === 'UPI' ? 'bg-teal-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      UPI QR
                    </button>
                    <button
                      onClick={() => setPaymentMethod('Cash')}
                      className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${
                        paymentMethod === 'Cash' ? 'bg-teal-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      Cash
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handlePayNow}
                    className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm Payment of ₹{currentJob.finalTotal} ({paymentMethod})</span>
                  </button>
                </div>
              </div>
            )}

            {/* Paid Receipt Confirmation */}
            {currentJob.paymentStatus === 'Paid' && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Payment Verified: {currentJob.paymentReference}</span>
                </div>
                <span className="font-bold">Receipt Available</span>
              </div>
            )}

            {/* Audit Status Log */}
            <div className="space-y-2 pt-2">
              <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Audit Status Timeline
              </h5>
              <div className="space-y-1.5 text-xs text-slate-600">
                {currentJob.statusHistory.map((sh, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px]">
                    <span className="font-mono text-slate-400 shrink-0">
                      {new Date(sh.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="font-bold text-slate-700">{sh.actor}:</span>
                    <span className="text-slate-600">{sh.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs">
            Job ID not found. Please verify the code or submit a new booking.
          </div>
        )}
      </div>
    </div>
  );
};
