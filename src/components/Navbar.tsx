import React from 'react';
import { useApp } from '../context/AppContext';
import { Wrench, Phone, MessageSquare, Search, ShoppingBag } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { cart, setIsBookingModalOpen, setIsTrackingModalOpen, setIsChatDrawerOpen } = useApp();

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (clean, single-line) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-500 flex items-center justify-center font-bold text-xl shadow-xs">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <a href="#" className="text-xl font-extrabold tracking-tight text-slate-900 block leading-tight">
              Furniture Fix
            </a>
            <span className="text-xs text-slate-500 font-medium hidden sm:block">
              Mumbai · Thane · Navi Mumbai
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (single line, no wrap) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
          <a href="#services" className="hover:text-slate-900 transition-colors whitespace-nowrap">
            Services & Rates
          </a>
          <a href="#map-section" className="hover:text-slate-900 transition-colors whitespace-nowrap">
            MMR Service Map
          </a>
          <a href="#how-it-works" className="hover:text-slate-900 transition-colors whitespace-nowrap">
            How It Works
          </a>
          <button
            onClick={() => setIsTrackingModalOpen(true)}
            className="hover:text-slate-900 transition-colors flex items-center gap-1.5 whitespace-nowrap text-slate-700 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            Track Job
          </button>
        </nav>

        {/* Zone 3: Primary Action & Quick Chat */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsChatDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Ask AI about locations and quotes"
          >
            <MessageSquare className="w-4 h-4 text-teal-600" />
            <span className="hidden sm:inline">Ask AI Assistant</span>
          </button>

          <a
            href="tel:+919594538117"
            className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1"
          >
            <Phone className="w-3.5 h-3.5 text-amber-600" />
            <span>+91 95945 38117</span>
          </a>

          <button
            onClick={() => setIsBookingModalOpen(true)}
            className="relative px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 transition-all rounded-lg shadow-sm flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Book a Service</span>
            {totalCartCount > 0 && (
              <span className="bg-white text-amber-700 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
