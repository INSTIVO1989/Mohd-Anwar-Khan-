import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MASTER_RATE_CARD } from '../data/rateCard';
import { ServiceCategory, RateCardItem } from '../types';
import { Search, Plus, Check, ShoppingBag, ArrowRight, ShieldCheck, Tag } from 'lucide-react';

const CATEGORIES: Array<'All' | ServiceCategory> = [
  'All',
  'Beds & Mattresses',
  'Wardrobes & Storage',
  'Chairs & Tables',
  'Living & Media',
  'Mounting & Wall Installation',
  'Repairs, Fittings & Relocation',
  'Fitness & Misc',
];

export const RateCardGrid: React.FC = () => {
  const { cart, addToCart, removeFromCart, setIsBookingModalOpen, cartTotal } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<'All' | ServiceCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = MASTER_RATE_CARD.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.includedScope.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getItemCountInCart = (itemId: string) => {
    const found = cart.find((c) => c.item.id === itemId);
    return found ? found.quantity : 0;
  };

  return (
    <section id="services" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold mb-3">
            <Tag className="w-3.5 h-3.5 text-amber-600" />
            <span>2026 Customer Master Tariff</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Transparent, Itemized Rate Card
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            No bargaining, no surprise bills. Standard ready-to-assemble rates across Mumbai MMR. We confirm the scope before work starts, and payment is collected strictly after completion.
          </p>
        </div>

        {/* Filter controls & Search */}
        <div className="space-y-4 mb-8">
          {/* Search Input */}
          <div className="relative max-w-md mx-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search services (e.g. hydraulic bed, sliding wardrobe, chair)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs (Segmented Controls) */}
          <div className="flex items-center justify-start sm:justify-center gap-1.5 overflow-x-auto py-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const count = getItemCountInCart(item.id);
            return (
              <div
                key={item.id}
                className={`rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between ${
                  count > 0
                    ? 'border-amber-500 bg-amber-50/20 shadow-md ring-1 ring-amber-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {item.category}
                    </span>
                    {item.popular && (
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                        Most Popular
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {item.name}
                  </h3>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                      {item.priceType === 'from' ? 'From ' : ''}₹{item.customerPrice}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">/ item</span>
                  </div>

                  {/* Included scope */}
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-700">Included Scope:</p>
                    <p className="text-[12px] leading-relaxed text-slate-500">
                      {item.includedScope}
                    </p>
                    {item.notes && (
                      <p className="text-[11px] text-amber-700 italic pt-1">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Add to estimate button */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400 font-medium">
                    Pay after job
                  </div>

                  {count > 0 ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                        title="Remove"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold font-mono px-1">
                        {count} in Quote
                      </span>
                      <button
                        onClick={() => addToCart(item)}
                        className="px-2.5 py-1 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
                        title="Add another"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(item)}
                      className="px-3.5 py-1.5 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-amber-500 hover:text-slate-950 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Quote</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
            <p className="text-sm font-semibold text-slate-600">No items matched your search.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="mt-2 text-xs font-bold text-amber-600 hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Floating Cart & Estimate Bar when items are selected */}
        {cart.length > 0 && (
          <div className="fixed bottom-18 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-950 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-6 max-w-lg w-[92vw] sm:w-auto justify-between animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)} items selected
                </span>
                <span className="text-base font-black text-amber-400 font-mono tabular-nums">
                  Total Est: ₹{cartTotal}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm whitespace-nowrap active:scale-95"
            >
              <span>Continue Booking</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
