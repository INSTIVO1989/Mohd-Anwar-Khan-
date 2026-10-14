import React from 'react';
import { Wrench, Phone, Mail, MapPin, Clock, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-24 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-extrabold text-base">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                <Wrench className="w-4 h-4" />
              </div>
              <span>Furniture Fix</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Specialist on-site furniture assembly, installation, and minor repair service based in Diva, Thane. Serving households, renters, and offices across the Mumbai Metropolitan Region.
            </p>
            <div className="text-[11px] text-slate-400 space-y-1 pt-1">
              <p><strong>Owner / Operator:</strong> Mohd Anwar Khan</p>
              <p><strong>Central Base:</strong> Diva, Thane, Maharashtra 400612</p>
            </div>
          </div>

          {/* Quick Contact & Hours */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">
              Direct Contact & Hours
            </h4>
            <div className="space-y-2 text-[12px] text-slate-300">
              <a
                href="tel:+919594538117"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>+91 95945 38117</span>
              </a>

              <a
                href="https://wa.me/919594538117"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0">W</span>
                <span>WhatsApp Booking Support</span>
              </a>

              <a
                href="mailto:furniturefixservice@gmail.com"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>furniturefixservice@gmail.com</span>
              </a>

              <div className="flex items-center gap-2 text-slate-400 pt-1">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>8:00 AM – 10:00 PM (Seven days a week)</span>
              </div>
            </div>
          </div>

          {/* Core Service Localities */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">
              Primary Coverage Sectors
            </h4>
            <ul className="grid grid-cols-2 gap-1 text-[11px] text-slate-400">
              <li>• Diva (Hub 400612)</li>
              <li>• Thane West & East</li>
              <li>• Kalwa & Mumbra</li>
              <li>• Dombivli & Kalyan</li>
              <li>• Mulund & Bhandup</li>
              <li>• Kanjurmarg & Powai</li>
              <li>• Andheri & Ghatkopar</li>
              <li>• Navi Mumbai (Airoli/Vashi)</li>
            </ul>
          </div>

          {/* Legal and Consumer terms */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">
              Operational Terms & Policy
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              No advance payment is required. The customer pays after agreed work is inspected and completed. Scope and pricing are confirmed before dispatch.
            </p>
            <div className="p-2.5 bg-slate-800/80 rounded-lg text-[10px] text-slate-300 border border-slate-700/60 space-y-1">
              <p className="font-semibold text-amber-400">Warranty Statement:</p>
              <p className="text-slate-400">
                Furniture Fix does not offer a blanket service warranty. Concerns are assessed individually based on verified job records and photographic evidence.
              </p>
            </div>
          </div>
        </div>

        {/* Copyright and consent footer */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 Furniture Fix. All rights reserved. Operated by Mohd Anwar Khan.</p>
          <div className="flex items-center gap-4">
            <span>DPDP 2025/2026 Notice Active</span>
            <span>·</span>
            <span>MMR Dispatch System</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
