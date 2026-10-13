import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { useApp } from '../context/AppContext';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from '../services/googleAuth';
import {
  listDriveFiles,
  createDriveFile,
  DriveFileItem,
  createSpreadsheet,
  listCalendarEvents,
  createCalendarEvent,
  CalendarEventItem,
  listGmailMessages,
  sendGmailMessage,
  GmailMessageHeader,
} from '../services/workspaceService';
import {
  Calendar,
  FileSpreadsheet,
  HardDrive,
  Mail,
  Send,
  Plus,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Clock,
  MapPin,
  Check,
  Shield,
  Loader2,
} from 'lucide-react';

export const WorkspaceHub: React.FC = () => {
  const { jobs, technicians } = useApp();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'sheets' | 'drive' | 'gmail'>('calendar');

  // Service States
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [gmailMessages, setGmailMessages] = useState<GmailMessageHeader[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal / Confirmations
  const [selectedJobToSync, setSelectedJobToSync] = useState<string>(jobs[0]?.id || '');
  const [syncSpreadsheetUrl, setSyncSpreadsheetUrl] = useState<string | null>(null);
  const [emailRecipient, setEmailRecipient] = useState(jobs[0]?.customer.email || 'customer@example.com');
  const [emailSubject, setEmailSubject] = useState(`Furniture Fix Booking Confirmation — ${jobs[0]?.id || 'FF-26-04287'}`);
  const [emailBody, setEmailBody] = useState(
    `Hello ${jobs[0]?.customer.name || 'Valued Customer'},\n\nYour Furniture Fix assembly appointment has been confirmed.\n\nJob ID: ${jobs[0]?.id}\nScheduled Window: ${jobs[0]?.appointmentDate} (${jobs[0]?.appointmentSlot})\nService Address: ${jobs[0]?.customer.address}, ${jobs[0]?.customer.locality}\nEstimated Amount: ₹${jobs[0]?.finalTotal}\n\nImportant Promise: Zero advance payment required. Payment is strictly collected after completion via Cash or UPI.\n\nThank you,\nMohd Anwar Khan\nFurniture Fix (+91 95945 38117)`
  );

  // Confirmation dialog state for destructive/mutating actions
  const [confirmationAction, setConfirmationAction] = useState<{
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch data whenever user connects or switches tab
  useEffect(() => {
    if (accessToken) {
      loadTabData(activeTab, accessToken);
    }
  }, [accessToken, activeTab]);

  const loadTabData = async (tab: string, token: string) => {
    setIsLoadingData(true);
    setStatusMessage(null);
    try {
      if (tab === 'calendar') {
        const events = await listCalendarEvents(token);
        setCalendarEvents(events);
      } else if (tab === 'drive') {
        const files = await listDriveFiles(token);
        setDriveFiles(files);
      } else if (tab === 'gmail') {
        const msgs = await listGmailMessages(token);
        setGmailMessages(msgs);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || `Failed to fetch ${tab} data` });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
        setStatusMessage({ type: 'success', text: `Connected as ${res.user.email}` });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to sign in with Google' });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setCurrentUser(null);
    setAccessToken(null);
    setCalendarEvents([]);
    setDriveFiles([]);
    setGmailMessages([]);
    setStatusMessage(null);
  };

  // 1. Google Calendar Sync with confirmation
  const triggerCalendarSync = () => {
    const job = jobs.find((j) => j.id === selectedJobToSync);
    if (!job || !accessToken) return;
    const tech = technicians.find((t) => t.id === job.assignedTechId);
    const techName = tech ? tech.name : 'Mohd Anwar Khan';

    setConfirmationAction({
      title: 'Sync Appointment to Google Calendar?',
      description: `This will create a new calendar event for Job ${job.id} (${job.customer.name}) on ${job.appointmentDate} during ${job.appointmentSlot}.`,
      onConfirm: async () => {
        try {
          const newEvent = await createCalendarEvent(accessToken, job, techName);
          setCalendarEvents((prev) => [newEvent, ...prev]);
          setStatusMessage({
            type: 'success',
            text: `Event "${newEvent.summary}" successfully added to Google Calendar!`,
          });
        } catch (e: any) {
          setStatusMessage({ type: 'error', text: e.message || 'Calendar sync failed' });
        }
      },
    });
  };

  // 2. Google Sheets Export with confirmation
  const triggerSheetsExport = () => {
    if (!accessToken) return;

    setConfirmationAction({
      title: 'Create Master Google Spreadsheet?',
      description: `This will create a new Google Sheet titled "Furniture Fix — 2026 Operations & Ledger" in your Google Drive with ${jobs.length} current job records and commission rows.`,
      onConfirm: async () => {
        try {
          const headerRow = [
            'Job ID',
            'Customer Name',
            'Mobile',
            'Locality',
            'Pincode',
            'Appointment Date',
            'Scope Items',
            'Status',
            'Total Tariff (INR)',
            'Technician Payout',
            'Platform Margin',
            'Payment Method',
            'Payment Status',
          ];

          const jobRows = jobs.map((j) => [
            j.id,
            j.customer.name,
            j.customer.mobile,
            j.customer.locality,
            j.customer.pincode,
            j.appointmentDate,
            j.items.map((i) => i.name).join(', '),
            j.status,
            j.finalTotal,
            j.technicianPayout,
            j.platformMargin,
            j.paymentMethod || 'Uncollected',
            j.paymentStatus,
          ]);

          const res = await createSpreadsheet(
            accessToken,
            `Furniture Fix — Master Ledger (${new Date().toISOString().slice(0, 10)})`,
            [headerRow, ...jobRows]
          );

          setSyncSpreadsheetUrl(res.spreadsheetUrl);
          setStatusMessage({
            type: 'success',
            text: 'Master spreadsheet successfully created in Google Sheets!',
          });
        } catch (e: any) {
          setStatusMessage({ type: 'error', text: e.message || 'Sheets export failed' });
        }
      },
    });
  };

  // 3. Google Drive Backup with confirmation
  const triggerDriveBackup = () => {
    if (!accessToken) return;

    setConfirmationAction({
      title: 'Upload Backup to Google Drive?',
      description:
        'This will upload a comprehensive JSON backup of all Furniture Fix bookings, rate card items, and technician logs directly into your Google Drive root folder.',
      onConfirm: async () => {
        try {
          const backupData = JSON.stringify(
            {
              business: 'Furniture Fix',
              owner: 'Mohd Anwar Khan',
              date: new Date().toISOString(),
              jobs,
              technicians,
            },
            null,
            2
          );

          const fileName = `Furniture_Fix_Backup_${new Date().toISOString().slice(0, 10)}.json`;
          const created = await createDriveFile(
            accessToken,
            fileName,
            'application/json',
            backupData
          );

          setDriveFiles((prev) => [created, ...prev]);
          setStatusMessage({
            type: 'success',
            text: `Backup file "${created.name}" uploaded to Google Drive!`,
          });
        } catch (e: any) {
          setStatusMessage({ type: 'error', text: e.message || 'Drive backup failed' });
        }
      },
    });
  };

  // 4. Gmail Send with confirmation
  const triggerGmailSend = () => {
    if (!accessToken || !emailRecipient.trim()) return;

    setConfirmationAction({
      title: `Send Email to ${emailRecipient}?`,
      description: `This will send an official booking confirmation email from your Gmail account (${currentUser?.email}) to ${emailRecipient}.`,
      onConfirm: async () => {
        try {
          await sendGmailMessage(accessToken, emailRecipient, emailSubject, emailBody);
          setStatusMessage({
            type: 'success',
            text: `Email successfully sent to ${emailRecipient} via Gmail!`,
          });
        } catch (e: any) {
          setStatusMessage({ type: 'error', text: e.message || 'Gmail sending failed' });
        }
      },
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden my-6">
      {/* Top Banner & Account Status */}
      <div className="p-5 sm:p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
              Google Workspace Center
            </span>
            <span className="text-xs text-slate-400">
              Drive · Sheets · Calendar · Gmail
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">
            Connected Business Integrations
          </h3>
          <p className="text-xs text-slate-400">
            Sync Furniture Fix appointments, customer sheets, drive backups, and emails with permission.
          </p>
        </div>

        {/* Authentication Button or User Badge */}
        <div>
          {!currentUser ? (
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {/* Official Google G Logo */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-slate-800/90 px-3 py-2 rounded-xl border border-slate-700">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Google User'}
                  className="w-8 h-8 rounded-full border border-teal-400"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                  {currentUser.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-left">
                <span className="text-xs font-bold text-white block leading-tight truncate max-w-[160px]">
                  {currentUser.displayName || 'Furniture Fix Admin'}
                </span>
                <span className="text-[10px] text-teal-300 font-mono block truncate max-w-[160px]">
                  {currentUser.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                title="Disconnect Google Account"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`px-6 py-2.5 text-xs flex items-center justify-between border-b ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex items-center border-b border-slate-200 px-6 bg-slate-50 overflow-x-auto">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'calendar'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span>Google Calendar ({calendarEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sheets')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'sheets'
              ? 'border-emerald-600 text-emerald-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Google Sheets</span>
        </button>

        <button
          onClick={() => setActiveTab('drive')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'drive'
              ? 'border-amber-600 text-amber-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HardDrive className="w-4 h-4 text-amber-600" />
          <span>Google Drive ({driveFiles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('gmail')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'gmail'
              ? 'border-red-600 text-red-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mail className="w-4 h-4 text-red-600" />
          <span>Gmail</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="p-6">
        {!currentUser ? (
          <div className="py-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6 text-teal-600" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">
              Google Workspace Sign-In Required
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              To view, schedule, export, or send emails through your Google account, click below to connect with permission from the app's users.
            </p>
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              {isSigningIn ? 'Opening Google Auth...' : 'Connect Google Workspace Account'}
            </button>
          </div>
        ) : (
          <div>
            {/* TAB 1: GOOGLE CALENDAR */}
            {activeTab === 'calendar' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                  <div>
                    <h4 className="font-bold text-indigo-950 text-sm">
                      Sync Job Appointment to Google Calendar
                    </h4>
                    <p className="text-xs text-indigo-800">
                      Creates an official calendar entry with start time, customer location, and items scope.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedJobToSync}
                      onChange={(e) => setSelectedJobToSync(e.target.value)}
                      className="text-xs bg-white border border-indigo-200 rounded-lg p-2 font-medium"
                    >
                      {jobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.id} — {j.customer.name} ({j.appointmentDate})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={triggerCalendarSync}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-xs whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Calendar</span>
                    </button>
                  </div>
                </div>

                {/* Calendar Events List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Upcoming Google Calendar Schedule
                    </h5>
                    <button
                      onClick={() => accessToken && loadTabData('calendar', accessToken)}
                      className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {isLoadingData ? (
                    <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      <span>Loading calendar events...</span>
                    </div>
                  ) : calendarEvents.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                      No upcoming calendar events found. Sync a booking above to add your first job to Google Calendar!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {calendarEvents.map((evt) => (
                        <div
                          key={evt.id}
                          className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <span className="font-bold text-slate-900 block">{evt.summary}</span>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {evt.start.dateTime
                                  ? new Date(evt.start.dateTime).toLocaleString([], {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : evt.start.date}
                              </span>
                              {evt.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span className="truncate max-w-xs">{evt.location}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {evt.htmlLink && (
                            <a
                              href={evt.htmlLink}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center gap-1 shrink-0"
                            >
                              <span>View in Google</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: GOOGLE SHEETS */}
            {activeTab === 'sheets' && (
              <div className="space-y-6">
                <div className="p-5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-emerald-950 text-base">
                        Export Master Ledger to Google Sheets
                      </h4>
                      <p className="text-xs text-emerald-800 leading-relaxed">
                        Creates an official spreadsheet directly in your Google Drive with {jobs.length} completed and active booking records, itemized revenues, technician payout calculations, and payment reconciliation.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      Live Sheets v4 API
                    </span>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={triggerSheetsExport}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Create / Export to Google Sheet</span>
                    </button>

                    {syncSpreadsheetUrl && (
                      <a
                        href={syncSpreadsheetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <span>Open Created Sheet</span>
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Preview Table of Data to be Exported */}
                <div className="space-y-2">
                  <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Spreadsheet Columns Preview ({jobs.length} Rows Ready)
                  </h5>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="grid grid-cols-4 sm:grid-cols-6 font-bold text-slate-700 border-b border-slate-200 pb-2">
                      <span>Job ID</span>
                      <span>Customer</span>
                      <span>Locality</span>
                      <span className="hidden sm:block">Scope</span>
                      <span>Total Tariff</span>
                      <span className="hidden sm:block">Status</span>
                    </div>
                    {jobs.slice(0, 4).map((j) => (
                      <div key={j.id} className="grid grid-cols-4 sm:grid-cols-6 text-slate-600 py-1 text-[11px]">
                        <span className="font-mono font-bold text-slate-900">{j.id}</span>
                        <span>{j.customer.name}</span>
                        <span>{j.customer.locality}</span>
                        <span className="hidden sm:block truncate">{j.items.map((i) => i.name).join(', ')}</span>
                        <span className="font-mono font-bold text-slate-900">₹{j.finalTotal}</span>
                        <span className="hidden sm:block">{j.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: GOOGLE DRIVE */}
            {activeTab === 'drive' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50/60 border border-amber-200 rounded-xl">
                  <div>
                    <h4 className="font-bold text-amber-950 text-sm">
                      Google Drive Backup & Archive
                    </h4>
                    <p className="text-xs text-amber-800">
                      Save raw JSON and customer receipts directly to your personal Google Drive storage.
                    </p>
                  </div>

                  <button
                    onClick={triggerDriveBackup}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-start sm:self-auto"
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>Upload Backup to Drive</span>
                  </button>
                </div>

                {/* Drive Files List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Recent Files in Your Google Drive
                    </h5>
                    <button
                      onClick={() => accessToken && loadTabData('drive', accessToken)}
                      className="text-xs text-slate-500 hover:text-amber-600 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {isLoadingData ? (
                    <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                      <span>Reading Google Drive files...</span>
                    </div>
                  ) : driveFiles.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                      No recent files located. Use the backup button above to save your first file!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {driveFiles.map((f) => (
                        <div
                          key={f.id}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">{f.name}</span>
                            <span className="text-[11px] text-slate-400">
                              {f.mimeType} {f.modifiedTime && `· Modified ${new Date(f.modifiedTime).toLocaleDateString()}`}
                            </span>
                          </div>

                          {f.webViewLink && (
                            <a
                              href={f.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg flex items-center gap-1 shrink-0"
                            >
                              <span>Open</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: GMAIL */}
            {activeTab === 'gmail' && (
              <div className="space-y-6">
                {/* Compose Booking Receipt Email */}
                <div className="p-5 bg-red-50/60 border border-red-200 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-red-950 text-base">
                        Send Booking Confirmation / Invoice via Gmail
                      </h4>
                      <p className="text-xs text-red-800">
                        Sends official communication directly from your connected address ({currentUser.email}).
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-800 bg-red-100 px-2 py-0.5 rounded">
                      Gmail API
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Select Job to Pre-Fill:
                        </label>
                        <select
                          value={selectedJobToSync}
                          onChange={(e) => {
                            const found = jobs.find((j) => j.id === e.target.value);
                            setSelectedJobToSync(e.target.value);
                            if (found) {
                              setEmailRecipient(found.customer.email || 'customer@example.com');
                              setEmailSubject(`Furniture Fix Booking Confirmation — ${found.id}`);
                              setEmailBody(
                                `Hello ${found.customer.name},\n\nYour Furniture Fix assembly appointment has been confirmed.\n\nJob ID: ${found.id}\nScheduled Window: ${found.appointmentDate} (${found.appointmentSlot})\nService Address: ${found.customer.address}, ${found.customer.locality}\nEstimated Amount: ₹${found.finalTotal}\n\nImportant Promise: Zero advance payment required. Payment is strictly collected after completion via Cash or UPI.\n\nThank you,\nMohd Anwar Khan\nFurniture Fix (+91 95945 38117)`
                              );
                            }
                          }}
                          className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium"
                        >
                          {jobs.map((j) => (
                            <option key={j.id} value={j.id}>
                              {j.id} — {j.customer.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Recipient Email:
                        </label>
                        <input
                          type="email"
                          value={emailRecipient}
                          onChange={(e) => setEmailRecipient(e.target.value)}
                          className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Subject Line:
                      </label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Message Body:
                      </label>
                      <textarea
                        rows={4}
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-mono"
                      />
                    </div>

                    <button
                      onClick={triggerGmailSend}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send Customer Email</span>
                    </button>
                  </div>
                </div>

                {/* Recent Gmail Messages List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Recent Business Email Messages
                    </h5>
                    <button
                      onClick={() => accessToken && loadTabData('gmail', accessToken)}
                      className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {isLoadingData ? (
                    <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                      <span>Checking Gmail inbox...</span>
                    </div>
                  ) : gmailMessages.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                      No matching furniture messages found in inbox. Use the compose form above to send an email!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {gmailMessages.map((m) => (
                        <div
                          key={m.id}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{m.subject}</span>
                            <span className="text-[10px] text-slate-400">{m.date}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 block">From: {m.from}</span>
                          {m.snippet && <p className="text-[11px] text-slate-600 italic">{m.snippet}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MANDATORY USER CONFIRMATION MODAL FOR DESTRUCTIVE / MUTATING OPERATIONS */}
      {confirmationAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  {confirmationAction.title}
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {confirmationAction.description}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setConfirmationAction(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const action = confirmationAction.onConfirm;
                  setConfirmationAction(null);
                  await action();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Confirm & Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
