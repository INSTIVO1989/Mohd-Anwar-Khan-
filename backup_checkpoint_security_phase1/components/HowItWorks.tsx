import React from 'react';
import { ClipboardList, CheckCircle2, Wrench, CreditCard, ShieldAlert } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-16 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 block mb-1">
            Simple 4-Step Process
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            How Furniture Fix Works
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Built for reliability, speed, and complete price transparency for homes and offices across the Mumbai Metropolitan Region.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-sm mb-4">
              01
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1.5">
              Select or Describe Item
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pick your bed, wardrobe, table, chair or TV unit from our 2026 Rate Card or ask our AI location assistant.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-black text-sm mb-4">
              02
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1.5">
              Confirmed Scope & Slot
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We verify locality serviceability from our Diva hub, confirm the exact price and assign a trained technician.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-black text-sm mb-4">
              03
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1.5">
              Respectful Assembly
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Technician arrives with proper tools, protects floors, completes assembly, and cleans up the working area.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-sm mb-4">
              04
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1.5">
              Inspect & Pay After Work
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Test every door, drawer, or lift mechanism. You pay the agreed amount only after complete satisfaction.
            </p>
          </div>
        </div>

        {/* Operating Policy Notice from Planning Blueprint */}
        <div className="mt-10 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 font-semibold block">
                Official Business Policy Disclosure:
              </strong>
              <span>
                Payment is strictly due after job completion. No blanket service warranty is offered; any concern reported is assessed individually based on the verified job record, photos, and evidence.
              </span>
            </div>
          </div>

          <div className="shrink-0 font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            Operating Hours: 8:00 AM – 10:00 PM
          </div>
        </div>
      </div>
    </section>
  );
};
