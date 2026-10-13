import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MMR_ZONES } from '../data/rateCard';
import { ServiceZone } from '../types';
import { MapPin, Navigation, CheckCircle2, AlertCircle, Search, ArrowRight, Wrench } from 'lucide-react';

export const InteractiveMap: React.FC = () => {
  const { selectedZone, setSelectedZone, setIsBookingModalOpen, setIsChatDrawerOpen, technicians } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'core' | 'extended'>('all');

  // Filtered zones
  const filteredZones = MMR_ZONES.filter((z) => {
    const matchesSearch =
      z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.pincode.includes(searchQuery.trim());
    if (!matchesSearch) return false;
    if (filterType === 'core') return z.zone.includes('Core');
    if (filterType === 'extended') return z.zone.includes('Extended');
    return true;
  });

  const activeZone = selectedZone || MMR_ZONES[0];

  // Map coordinate projection helper (fitting Mumbai MMR bounding box ~ 18.8 to 19.35 lat, 72.8 to 73.2 lng into SVG 800x600)
  const projectCoords = (lat: number, lng: number) => {
    const minLat = 18.88;
    const maxLat = 19.32;
    const minLng = 72.78;
    const maxLng = 73.18;

    const x = ((lng - minLng) / (maxLng - minLng)) * 740 + 30;
    // Invert Y because latitude grows northwards
    const y = ((maxLat - lat) / (maxLat - minLat)) * 520 + 40;
    return { x, y };
  };

  const divaCoords = projectCoords(19.1892, 73.0425);

  const handleSelectZone = (zone: ServiceZone) => {
    setSelectedZone(zone);
  };

  return (
    <section id="map-section" className="py-16 bg-slate-100/70 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-700 mb-1">
              <Navigation className="w-4 h-4" />
              <span>Real-Time Service Coverage</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Mumbai Metropolitan Region (MMR) Interactive Map
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Centrally dispatched from our Diva & Thane operations hub. Select your locality or enter your pincode below to check instant coverage and travel allowance.
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-xs self-start md:self-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterType === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Zones ({MMR_ZONES.length})
            </button>
            <button
              onClick={() => setFilterType('core')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterType === 'core' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Core (Free Travel)
            </button>
            <button
              onClick={() => setFilterType('extended')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterType === 'extended' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Extended Zones
            </button>
          </div>
        </div>

        {/* Map Grid Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Interactive Vector Map Canvas */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
            {/* Top Bar inside Map Canvas: Search and Legend */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 z-10">
              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search locality or pincode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Map Legend */}
              <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500 border border-white shadow-xs inline-block" />
                  <span>Diva Hub</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />
                  <span>Core (Free)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" />
                  <span>Extended (Surcharge)</span>
                </div>
              </div>
            </div>

            {/* SVG Interactive Canvas */}
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
              <svg
                viewBox="0 0 800 600"
                className="w-full h-full select-none"
                style={{ filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.4))' }}
              >
                {/* Distance concentric radar circles from Diva */}
                <circle cx={divaCoords.x} cy={divaCoords.y} r="70" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3,3" />
                <circle cx={divaCoords.x} cy={divaCoords.y} r="140" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3,3" />
                <circle cx={divaCoords.x} cy={divaCoords.y} r="220" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
                <circle cx={divaCoords.x} cy={divaCoords.y} r="310" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />

                {/* Radius labels */}
                <text x={divaCoords.x + 72} y={divaCoords.y - 4} fill="#64748b" fontSize="10" fontFamily="sans-serif">10 km</text>
                <text x={divaCoords.x + 142} y={divaCoords.y - 4} fill="#64748b" fontSize="10" fontFamily="sans-serif">20 km</text>
                <text x={divaCoords.x + 222} y={divaCoords.y - 4} fill="#64748b" fontSize="10" fontFamily="sans-serif">30 km</text>

                {/* Connecting dispatch corridors */}
                {filteredZones.map((z) => {
                  const pt = projectCoords(z.lat, z.lng);
                  const isSelected = activeZone.name === z.name;
                  return (
                    <line
                      key={`line-${z.name}`}
                      x1={divaCoords.x}
                      y1={divaCoords.y}
                      x2={pt.x}
                      y2={pt.y}
                      stroke={isSelected ? '#f59e0b' : '#334155'}
                      strokeWidth={isSelected ? '2' : '0.75'}
                      strokeOpacity={isSelected ? '0.8' : '0.25'}
                    />
                  );
                })}

                {/* Diva Operations Hub Marker */}
                <g>
                  <circle cx={divaCoords.x} cy={divaCoords.y} r="14" fill="#f59e0b" fillOpacity="0.3" className="animate-ping" />
                  <circle cx={divaCoords.x} cy={divaCoords.y} r="9" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                  <text
                    x={divaCoords.x}
                    y={divaCoords.y + 20}
                    fill="#fbbf24"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    DIVA HUB (400612)
                  </text>
                </g>

                {/* Locality Markers */}
                {filteredZones.map((zone) => {
                  if (zone.name.includes('Diva')) return null; // already rendered
                  const pt = projectCoords(zone.lat, zone.lng);
                  const isSelected = activeZone.name === zone.name;
                  const isCore = zone.zone.includes('Core');

                  return (
                    <g
                      key={zone.name}
                      onClick={() => handleSelectZone(zone)}
                      className="cursor-pointer transition-transform duration-200 hover:scale-125"
                    >
                      {/* Selection halo */}
                      {isSelected && (
                        <circle cx={pt.x} cy={pt.y} r="16" fill="#38bdf8" fillOpacity="0.3" className="animate-pulse" />
                      )}

                      {/* Pin Circle */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isSelected ? '8' : '5.5'}
                        fill={isCore ? '#14b8a6' : '#d97706'}
                        stroke="#ffffff"
                        strokeWidth={isSelected ? '2' : '1.5'}
                      />

                      {/* Text Label */}
                      <text
                        x={pt.x}
                        y={pt.y - 9}
                        fill={isSelected ? '#ffffff' : '#cbd5e1'}
                        fontSize={isSelected ? '11' : '9.5'}
                        fontWeight={isSelected ? 'bold' : 'normal'}
                        textAnchor="middle"
                        className="pointer-events-none drop-shadow-md"
                      >
                        {zone.name.replace('Navi Mumbai - ', '').replace('West', 'W').replace('East', 'E')}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Bottom badge */}
              <div className="absolute bottom-2 left-3 bg-slate-950/80 backdrop-blur-xs text-[10px] text-slate-400 px-2.5 py-1 rounded-md border border-slate-800">
                Click any node to inspect serviceability & dispatch distance
              </div>
            </div>

            {/* Quick locality pills footer */}
            <div className="mt-3 flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none text-[11px]">
              <span className="text-slate-400 shrink-0 font-medium">Quick Pick:</span>
              {MMR_ZONES.slice(0, 8).map((z) => (
                <button
                  key={z.name}
                  onClick={() => handleSelectZone(z)}
                  className={`px-2.5 py-1 rounded-md font-medium shrink-0 transition-colors cursor-pointer ${
                    activeZone.name === z.name
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {z.name.replace('Navi Mumbai - ', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Selected Sector Details Card */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="space-y-5">
              <div className="pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
                    {activeZone.zone}
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    PIN: {activeZone.pincode}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                  {activeZone.name}
                </h3>
              </div>

              {/* Distance and Travel Allowance */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500 block">Distance from Hub</span>
                  <span className="text-lg font-black text-slate-900 font-mono">
                    {activeZone.distanceKm} km
                  </span>
                  <span className="text-[10px] text-slate-400 block">from Diva Hub (400612)</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500 block">Travel Allowance</span>
                  <span className={`text-lg font-black font-mono ${activeZone.travelCharge === 0 ? 'text-teal-600' : 'text-amber-600'}`}>
                    {activeZone.travelCharge === 0 ? '₹0 Free' : `₹${activeZone.travelCharge}`}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {activeZone.travelCharge === 0 ? 'Included in rate card' : 'Quoted upfront'}
                  </span>
                </div>
              </div>

              {/* Service Details & Technician Deployment */}
              <div className="space-y-3">
                <div className="text-xs space-y-1.5">
                  <div className="flex items-start gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Daily Arrival Windows:</strong> 8:00 AM – 10:00 PM (Seven days a week).
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Payment Policy:</strong> Pay after assembly via Cash or UPI QR.
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-700">
                    <Wrench className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Assigned Field Technicians:</strong> Mohd Anwar Khan, Prakash Vishwakarma, Swapnil Panchal.
                    </span>
                  </div>
                </div>

                {/* Core vs Extended notice */}
                {activeZone.travelCharge > 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      {activeZone.name} is in our Extended Zone. A flat ₹{activeZone.travelCharge} distance allowance applies and is confirmed before dispatch.
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>
                      {activeZone.name} is in our Core Service Zone. 100% free travel included with no hidden travel fees!
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-6 space-y-2 border-t border-slate-100">
              <button
                onClick={() => setIsBookingModalOpen(true)}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Book Assembly in {activeZone.name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsChatDrawerOpen(true)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Ask AI Assistant About This Area
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
