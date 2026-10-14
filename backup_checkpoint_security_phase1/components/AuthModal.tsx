import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  ShieldCheck,
  User,
  Wrench,
  Lock,
  LogOut,
  CheckCircle,
  AlertCircle,
  X,
  Play,
  Globe,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalTargetRole,
    setAuthModalTargetRole,
    currentUser,
    firebaseUser,
    signInWithGoogle,
    signOutUser,
    isDemoMode,
    setIsDemoMode,
    switchDemoRole,
    role,
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [preferredRole, setPreferredRole] = useState<UserRole>(authModalTargetRole || 'customer');

  if (!isAuthModalOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await signInWithGoogle(preferredRole);
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Authentication was interrupted. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateDemoMode = () => {
    setIsDemoMode(true);
    if (authModalTargetRole) {
      switchDemoRole(authModalTargetRole);
    }
    setIsAuthModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white relative">
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Account & Access Control</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentUser ? 'Signed in user profile' : 'Sign in to access secure portals'}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Auth Status Card */}
          {firebaseUser ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {firebaseUser.photoURL ? (
                    <img
                      src={firebaseUser.photoURL}
                      alt={firebaseUser.displayName || 'User'}
                      className="w-10 h-10 rounded-full border border-slate-300"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold">
                      {firebaseUser.email?.slice(0, 2).toUpperCase() || 'FF'}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{firebaseUser.displayName || 'Authorized User'}</h4>
                    <p className="text-xs text-slate-500">{firebaseUser.email}</p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                    currentUser?.role === 'admin'
                      ? 'bg-indigo-100 text-indigo-800'
                      : currentUser?.role === 'technician'
                      ? 'bg-teal-100 text-teal-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {currentUser?.role || 'Customer'}
                </span>
              </div>

              {currentUser?.technicianId && (
                <div className="text-xs text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200 flex items-center justify-between font-medium">
                  <span>Linked Technician Identity:</span>
                  <span className="font-bold">{currentUser.technicianId}</span>
                </div>
              )}

              <button
                onClick={signOutUser}
                className="w-full mt-2 py-2 px-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <>
              {authModalTargetRole === 'admin' && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 leading-relaxed">
                    <p className="font-bold">Admin Dispatch Authorization Required</p>
                    <p className="mt-0.5 text-amber-800">
                      Live Cloud Admin access is strictly reserved for the verified business owner account (
                      <span className="font-semibold underline">furniturefixservice@gmail.com</span>). Public users cannot self-assign admin roles.
                    </p>
                  </div>
                </div>
              )}

              {/* Role Selection for registration / login */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                  Select Requested Role:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPreferredRole('customer')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      preferredRole === 'customer'
                        ? 'border-amber-500 bg-amber-50/50 shadow-xs ring-1 ring-amber-500'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-amber-600" />
                      <span className="font-bold text-xs text-slate-900">Customer</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Book services & track live status</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreferredRole('technician')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      preferredRole === 'technician'
                        ? 'border-teal-500 bg-teal-50/50 shadow-xs ring-1 ring-teal-500'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-teal-600" />
                      <span className="font-bold text-xs text-slate-900">Technician</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Field job queue & payouts</p>
                  </button>
                </div>
              </div>

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                  />
                </svg>
                <span>{loading ? 'Authenticating...' : 'Sign In with Google'}</span>
              </button>
            </>
          )}

          {/* Sandbox / Testing Mode Alternative */}
          <div className="pt-4 border-t border-slate-200">
            <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-purple-600" />
                  Testing & Evaluation Sandbox
                </span>
                <span className="text-[10px] bg-purple-200 text-purple-900 font-black px-2 py-0.5 rounded-full uppercase">
                  Zero Login
                </span>
              </div>
              <p className="text-[11px] text-purple-800 leading-normal">
                Want to test Customer, Technician (Mohd Anwar Khan / Prakash), and Admin dispatch workflows without logging into multiple Google accounts?
              </p>
              <button
                type="button"
                onClick={handleActivateDemoMode}
                className="w-full mt-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Switch to Sandbox Demo Mode</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
