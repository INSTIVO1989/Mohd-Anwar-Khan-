/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { InteractiveMap } from './components/InteractiveMap';
import { RateCardGrid } from './components/RateCardGrid';
import { HowItWorks } from './components/HowItWorks';
import { Footer } from './components/Footer';
import { RoleSwitcher } from './components/RoleSwitcher';
import { BookingModal } from './components/BookingModal';
import { JobTrackingModal } from './components/JobTrackingModal';
import { ChatAssistantDrawer } from './components/ChatAssistantDrawer';
import { TechnicianPortal } from './components/TechnicianPortal';
import { AdminPortal } from './components/AdminPortal';
import { AuthModal } from './components/AuthModal';

const AppContent: React.FC = () => {
  const { role } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-amber-500 selection:text-white">
      {/* Top Bar Navigation */}
      <Navbar />

      {/* Main Dynamic View based on Current Role */}
      <main className="flex-1">
        {role === 'customer' && (
          <>
            <HeroSection />
            <InteractiveMap />
            <RateCardGrid />
            <HowItWorks />
            <Footer />
          </>
        )}

        {role === 'technician' && (
          <div className="pb-24">
            <TechnicianPortal />
          </div>
        )}

        {role === 'admin' && (
          <div className="pb-24">
            <AdminPortal />
          </div>
        )}
      </main>

      {/* Global Interactive Modals & Drawers */}
      <BookingModal />
      <JobTrackingModal />
      <ChatAssistantDrawer />
      <AuthModal />

      {/* Role Switcher floating bar at bottom */}
      <RoleSwitcher />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
