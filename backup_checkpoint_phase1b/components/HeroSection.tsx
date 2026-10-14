import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MASTER_RATE_CARD } from '../data/rateCard';
import { CheckCircle2, Shield, Clock, MapPin, Calculator, ArrowRight, MessageSquare } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { addToCart, setIsBookingModalOpen, setIsChatDrawerOpen } = useApp();
  const [selectedQuickServiceId, setSelectedQuickServiceId] = useState('bed_hydraulic');

  const selectedItem = MASTER_RATE_CARD.find((i) => i.id === selectedQuickServiceId) || MASTER_RATE_CARD[0];

  const handleQuickAdd = () => {
    addToCart(selectedItem);
    setIsBookingModalOpen(true);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8">
      {/* Background subtle grid pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:20px_20px]" />

      <div className="relative max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Proposition and Core Claims */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-xs font-semibold text-amber-400">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span>Diva & Thane Hub · Serving Entire Mumbai Metropolitan Region</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] text-balance">
              Expert Furniture Assembly at Your Home.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Need a bed, wardrobe, office chair, study table or TV unit assembled? Furniture Fix provides precision on-site assembly across Mumbai, Thane, and Navi Mumbai. We confirm the scope and exact price upfront — <strong className="text-white font-semibold">zero advance payment, pay only after the job is completed.</strong>
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => setIsBookingModalOpen(true)}
                className="px-6 py-3.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center gap-2.5 text-sm cursor-pointer whitespace-nowrap"
              >
                <span>Book Assembly Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsChatDrawerOpen(true)}
                className="px-5 py-3.5 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 font-semibold rounded-xl transition-all flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap"
              >
                <MessageSquare className="w-4 h-4 text-teal-400" />
                <span>Ask Location & Rate AI</span>
              </button>
            </div>

            {/* 4 Trust Points Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-800/80 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>8 AM – 10 PM Everyday</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Pay After Completion</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Transparent Rate Card</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Free Travel in Core MMR</span>
              </div>
            </div>
          </div>

          {/* Right Column: Instant Tariff Estimator Card */}
          <div className="lg:col-span-5">
            <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200 relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-slate-900 text-base">
                    Instant 2026 Rate Estimator
                  </h3>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                  Official Tariff
                </span>
              </div>

              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Select Your Furniture Item:
                  </label>
                  <select
                    value={selectedQuickServiceId}
                    onChange={(e) => setSelectedQuickServiceId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                  >
                    <optgroup label="Popular Beds">
                      <option value="bed_hydraulic">Hydraulic / Storage Bed (₹1,199)</option>
                      <option value="bed_queen">Queen Bed, Standard (₹699)</option>
                      <option value="bed_king">King Bed, Standard (₹899)</option>
                      <option value="bed_single">Single Bed, Standard (₹499)</option>
                    </optgroup>
                    <optgroup label="Wardrobes & Storage">
                      <option value="wardrobe_sliding">Sliding Wardrobe 2/3 Door (₹1,899)</option>
                      <option value="wardrobe_3door">3-Door Wardrobe Hinged (₹1,399)</option>
                      <option value="wardrobe_2door">2-Door Wardrobe Hinged (₹999)</option>
                      <option value="wardrobe_4door">4-Door Wardrobe Hinged (₹1,799)</option>
                      <option value="wardrobe_pax_modular">Modular / IKEA PAX (From ₹2,499)</option>
                    </optgroup>
                    <optgroup label="Chairs, Tables & Desks">
                      <option value="chair_office">Standard Office Chair (₹399)</option>
                      <option value="chair_gaming">Gaming Chair / Recliner (₹699)</option>
                      <option value="table_study">Study Table / Computer Desk (₹499)</option>
                      <option value="table_dining_4">Dining Table 4-Seat (₹799)</option>
                      <option value="table_dining_6">Dining Table 6-Seat (₹999)</option>
                    </optgroup>
                    <optgroup label="Living & TV Mounting">
                      <option value="mount_tv">TV Wall Mounting Bracket (₹799)</option>
                      <option value="media_tv_small">TV Unit / Console Freestanding (₹599)</option>
                      <option value="sofa_3seat">3-Seater Sofa Assembly (₹999)</option>
                      <option value="mount_simple_shelf">Simple Wall Shelf / Mirror (₹499)</option>
                    </optgroup>
                  </select>
                </div>

                {/* Selected Item Breakdown Box */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500 font-medium">Estimated Labour Tariff:</span>
                    <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                      {selectedItem.priceType === 'from' ? 'From ' : ''}₹{selectedItem.customerPrice}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-200">
                    <p className="font-medium text-slate-700">Scope Included:</p>
                    <p className="text-[12px] leading-relaxed text-slate-500">
                      {selectedItem.includedScope}
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5 text-teal-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Included travel across Diva, Thane, Navi Mumbai, Mulund, Powai, etc.</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Onsite add-ons (if any) require customer approval before work starts.</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleQuickAdd}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                >
                  <span>Select & Continue Booking</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
