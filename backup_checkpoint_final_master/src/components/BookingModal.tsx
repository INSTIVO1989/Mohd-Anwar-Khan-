import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MASTER_RATE_CARD, MMR_ZONES } from '../data/rateCard';
import { JobItem } from '../types';
import {
  X,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  FileText,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Plus,
  Trash2,
} from 'lucide-react';

export const BookingModal: React.FC = () => {
  const {
    isBookingModalOpen,
    setIsBookingModalOpen,
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    createBooking,
    selectedZone,
    currentUser,
    firebaseUser,
  } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState(() => firebaseUser?.displayName || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState(() => firebaseUser?.email || '');
  const [address, setAddress] = useState('');
  const [locality, setLocality] = useState(selectedZone?.name || 'Thane West');
  const [pincode, setPincode] = useState(selectedZone?.pincode || '400601');
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [appointmentSlot, setAppointmentSlot] = useState('10:00 AM – 12:00 PM');
  const [description, setDescription] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Manual service selector for step 1 if cart is empty
  const [quickServiceId, setQuickServiceId] = useState('bed_hydraulic');

  if (!isBookingModalOpen) return null;

  // Determine travel allowance
  const currentZone = MMR_ZONES.find(
    (z) => z.name.toLowerCase() === locality.toLowerCase() || z.pincode === pincode.trim()
  );
  const travelCharge = currentZone?.travelCharge || 0;

  // Compute items total
  const itemsTotal = cart.reduce((sum, item) => sum + item.item.customerPrice * item.quantity, 0);
  const grandTotal = itemsTotal + travelCharge;

  const handleNextStep = () => {
    setErrorMsg('');
    if (step === 1) {
      if (cart.length === 0) {
        setErrorMsg('Please add at least one furniture item to your booking.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!customerName.trim() || !customerPhone.trim() || !address.trim() || !pincode.trim()) {
        setErrorMsg('Please complete all required contact and location fields.');
        return;
      }
      if (customerPhone.trim().replace(/\D/g, '').length < 10) {
        setErrorMsg('Please enter a valid 10-digit mobile number.');
        return;
      }
      setStep(3);
    }
  };

  const handleSubmitBooking = async () => {
    if (!consentAccepted) {
      setErrorMsg('Please accept the service policy to confirm your booking.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const jobItems: JobItem[] = cart.map((c) => ({
        serviceId: c.item.id,
        name: c.item.name,
        category: c.item.category,
        quantity: c.quantity,
        unitPrice: c.item.customerPrice,
        total: c.item.customerPrice * c.quantity,
      }));

      // Estimate technician payout based on items
      const estimatedTechPayout = cart.reduce(
        (sum, c) => sum + c.item.technicianPayoutAmount * c.quantity,
        0
      );

      await createBooking({
        customer: {
          name: customerName,
          mobile: customerPhone,
          email: customerEmail || undefined,
          address,
          locality,
          pincode,
        },
        items: jobItems,
        appointmentDate,
        appointmentSlot,
        description: description || undefined,
        travelCharge,
        baseTotal: itemsTotal,
        finalTotal: grandTotal,
        paymentStatus: 'Pending',
        technicianPayout: estimatedTechPayout,
        platformMargin: grandTotal - estimatedTechPayout,
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Failed to submit booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <span>Book Furniture Assembly</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-500/20 px-2 py-0.5 rounded">
                Pay After Work
              </span>
            </h3>
            <span className="text-xs text-slate-400">
              Step {step} of 3 · {step === 1 ? 'Selected Items' : step === 2 ? 'Your Location' : 'Date & Confirmation'}
            </span>
          </div>

          <button
            onClick={() => setIsBookingModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="grid grid-cols-3 bg-slate-100 h-1.5">
          <div className={`h-full ${step >= 1 ? 'bg-amber-500' : 'bg-slate-200'}`} />
          <div className={`h-full ${step >= 2 ? 'bg-amber-500' : 'bg-slate-200'}`} />
          <div className={`h-full ${step >= 3 ? 'bg-amber-500' : 'bg-slate-200'}`} />
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-6">
          {/* STEP 1: REVIEW ITEMS */}
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Review Items in Your Booking
              </h4>

              {cart.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-3">
                  <p className="text-xs text-slate-600 font-medium">Your quote cart is empty.</p>
                  <div className="flex items-center gap-2 justify-center">
                    <select
                      value={quickServiceId}
                      onChange={(e) => setQuickServiceId(e.target.value)}
                      className="text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                    >
                      {MASTER_RATE_CARD.slice(0, 10).map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name} (₹{i.customerPrice})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const item = MASTER_RATE_CARD.find((i) => i.id === quickServiceId);
                        if (item) addToCart(item);
                      }}
                      className="px-3 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {cart.map((c) => (
                    <div
                      key={c.item.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{c.item.name}</span>
                        <span className="text-[11px] text-slate-500">
                          ₹{c.item.customerPrice} × {c.quantity}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-900">
                          ₹{c.item.customerPrice * c.quantity}
                        </span>
                        <button
                          onClick={() => removeFromCart(c.item.id)}
                          className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Subtotal Box */}
              {cart.length > 0 && (
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">Estimated Labour Total:</span>
                  <span className="font-mono font-bold text-base text-slate-950">
                    ₹{itemsTotal}
                  </span>
                </div>
              )}

              <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Zero advance deposit. Amount due only after full inspection and completion.</span>
              </div>
            </div>
          )}

          {/* STEP 2: ADDRESS & CONTACT */}
          {step === 2 && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Your Address in Mumbai MMR
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Mohd Anwar"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile / WhatsApp *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+91 98200 XXXXX"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Street Address / Society / Flat No. *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Flat 604, Building 3, Hiranandani Estate, Patlipada"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Locality / Sector *
                  </label>
                  <select
                    value={locality}
                    onChange={(e) => {
                      setLocality(e.target.value);
                      const z = MMR_ZONES.find((x) => x.name === e.target.value);
                      if (z) setPincode(z.pincode);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                  >
                    {MMR_ZONES.map((z) => (
                      <option key={z.name} value={z.name}>
                        {z.name} ({z.zone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 400607"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Serviceability feedback banner */}
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-center justify-between">
                <span>
                  {travelCharge === 0 ? 'Core Zone: Free travel included' : `Extended Zone: Travel allowance ₹${travelCharge}`}
                </span>
                <span className="font-bold font-mono">
                  {travelCharge === 0 ? '₹0.00' : `+₹${travelCharge}`}
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: SCHEDULE & CONFIRM */}
          {step === 3 && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                3. Choose Appointment Window
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preferred Date *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Time Window (8 AM – 10 PM) *
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={appointmentSlot}
                      onChange={(e) => setAppointmentSlot(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                    >
                      <option value="09:00 AM – 11:00 AM">09:00 AM – 11:00 AM</option>
                      <option value="11:00 AM – 01:00 PM">11:00 AM – 01:00 PM</option>
                      <option value="02:00 PM – 04:00 PM">02:00 PM – 04:00 PM</option>
                      <option value="04:00 PM – 06:00 PM">04:00 PM – 06:00 PM</option>
                      <option value="06:00 PM – 08:00 PM">06:00 PM – 08:00 PM</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Furniture Brand / Model Details (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Wakefit hydraulic queen bed, 3 packages, unboxed"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              {/* Grand Total Summary */}
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Labour Tariff ({cart.reduce((s, i) => s + i.quantity, 0)} items):</span>
                  <span className="font-mono">₹{itemsTotal}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Travel Fee ({locality}):</span>
                  <span className="font-mono">{travelCharge === 0 ? 'FREE' : `₹${travelCharge}`}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">Total Payable On Completion:</span>
                  <span className="text-xl font-black font-mono text-white">₹{grandTotal}</span>
                </div>
              </div>

              {/* Consent check */}
              <label className="flex items-start gap-2.5 text-[11px] text-slate-600 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <span>
                  I agree that Furniture Fix confirms scope and price before work begins, and I will pay the technician upon successful completion. No service warranty is offered; concerns are assessed on the job record.
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as 1 | 2)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl cursor-pointer"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={handleNextStep}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Next: {step === 1 ? 'Location' : 'Schedule'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSubmitBooking}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>{isSubmitting ? 'Creating Booking...' : 'Confirm Booking (₹0 Advance)'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
