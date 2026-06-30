import React, { useState } from "react";
import { APARTMENTS, PACKAGES } from "../data";
import { useLiveRates } from "../utils/profitroom";
import { X, Calendar, CheckCircle, ArrowRight, DollarSign, Calculator, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialApartmentId?: string;
  initialPackageId?: string;
}

export default function BookingModal({ isOpen, onClose, initialApartmentId, initialPackageId }: BookingModalProps) {
  const [apartmentId, setApartmentId] = useState(initialApartmentId || "1-bedroom");
  const [packageId, setPackageId] = useState("bb");
  const [bookingMode, setBookingMode] = useState<"live" | "inquiry">("live");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  
  // Set guest count default based on selected apartment
  const selectedApartment = APARTMENTS.find(a => a.id === apartmentId) || APARTMENTS[0];
  const [guests, setGuests] = useState(selectedApartment.maxGuests);

  const { getLivePrice } = useLiveRates();
  const { price: livePrice, isLive: isPriceLive } = getLivePrice(apartmentId, selectedApartment.pricePerNight);

  React.useEffect(() => {
    if (isOpen) {
      if (initialApartmentId) {
        setApartmentId(initialApartmentId);
        const apt = APARTMENTS.find(a => a.id === initialApartmentId);
        if (apt) {
          setGuests(apt.maxGuests);
        }
      }
      if (initialPackageId) {
        setPackageId(initialPackageId);
        setBookingMode("inquiry");
      }
    }
  }, [isOpen, initialApartmentId, initialPackageId]);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [requests, setRequests] = useState("");
  const [promocode, setPromocode] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Profitroom booking launcher (Option B: Custom Form Integration)
  const handleProfitroomBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkIn || !checkOut) {
      alert("Please select both Check-In and Check-Out dates first to check live rates.");
      return;
    }

    // Call the global Booking.Open function loaded from the Profitroom script
    if (typeof (window as any).Booking !== "undefined") {
      (window as any).Booking.Open({
        checkin: checkIn,
        checkout: checkOut,
        occupancy: String(guests),
        promocode: promocode || undefined
      });
    } else {
      // Fallback: build a direct secure booking URL if the script is still loading or iframe sandbox blocks direct action
      const fallbackUrl = `https://wis.upperbooking.com/tamarindvillage/booking?locale=en&checkin=${checkIn}&checkout=${checkOut}&occupancy=${guests}${promocode ? `&promocode=${encodeURIComponent(promocode)}` : ""}`;
      window.open(fallbackUrl, "_blank", "noopener,noreferrer");
    }
  };

  // Update guests limits if apartment changes
  const handleApartmentChange = (id: string) => {
    setApartmentId(id);
    const apt = APARTMENTS.find(a => a.id === id);
    if (apt) {
      setGuests(apt.maxGuests);
    }
  };

  const calculateCostBreakdown = () => {
    if (!checkIn || !checkOut) return null;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime <= 0) return null;

    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const basePrice = livePrice * nights;
    
    const pkg = PACKAGES.find(p => p.id === packageId) || PACKAGES[0];
    const packageRate = pkg.pricePerPersonPerDay;
    const packageCost = packageRate * guests * nights;
    
    const subtotal = basePrice + packageCost;
    const resortFee = Math.round(subtotal * 0.08); // 8% local hotel/service tax
    const total = subtotal + resortFee;

    return {
      nights,
      basePrice,
      packageCost,
      resortFee,
      total
    };
  };

  const breakdown = calculateCostBreakdown();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      alert("Please enter your contact details.");
      return;
    }
    setIsSubmitted(true);
  };

  const handleClose = () => {
    setIsSubmitted(false);
    // Reset dates & contacts
    setCheckIn("");
    setCheckOut("");
    setName("");
    setEmail("");
    setPhone("");
    setRequests("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-sm overflow-y-auto" id="booking-modal-overlay">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-2xl bg-white rounded-none shadow-2xl border border-stone-200 overflow-hidden"
          id="booking-modal-container"
        >
          {/* Header Banner */}
          <div className="bg-brand-dark text-white px-8 py-5 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl font-bold tracking-wider text-brand-gold uppercase">Resort Reservation Desk</h3>
              <p className="text-xs text-stone-400 font-light mt-0.5">Tamarind Village Mombasa Serviced Apartments</p>
            </div>
            <button 
              onClick={handleClose}
              className="p-1.5 rounded-none hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
              id="btn-close-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-teal uppercase tracking-widest">
                    <Info className="w-4 h-4" />
                    <span>Configure Your Stay Details</span>
                  </div>
                </div>

                {/* Booking Mode Selector Tab Bar */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 border border-stone-200">
                  <button
                    type="button"
                    onClick={() => setBookingMode("live")}
                    className={`py-2 px-3 text-center text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      bookingMode === "live"
                        ? "bg-brand-teal text-brand-dark"
                        : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    Direct Live Booking
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingMode("inquiry")}
                    className={`py-2 px-3 text-center text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      bookingMode === "inquiry"
                        ? "bg-brand-teal text-brand-dark"
                        : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    Custom Inquiry / Proposal
                  </button>
                </div>

                {/* Grid 1: Apartment Type, Boarding Package & Promocode */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                      Select Suite Category
                    </label>
                    <select
                      value={apartmentId}
                      onChange={(e) => handleApartmentChange(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-none text-stone-800 bg-stone-50 font-medium focus:outline-none focus:border-brand-teal"
                      id="modal-select-apartment"
                    >
                      {APARTMENTS.map(apt => (
                        <option key={apt.id} value={apt.id}>
                          {apt.name} (Base: ${apt.pricePerNight}/nt)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                      Boarding Package
                    </label>
                    <select
                      value={packageId}
                      onChange={(e) => setPackageId(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-none text-stone-800 bg-stone-50 font-medium focus:outline-none focus:border-brand-teal"
                      id="modal-select-package"
                    >
                      {PACKAGES.map(pkg => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} (+${pkg.pricePerPersonPerDay}/p/day)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                      Promo / Voucher Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SUMMER26"
                      value={promocode}
                      onChange={(e) => setPromocode(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-none text-stone-800 bg-stone-50 font-medium focus:outline-none focus:border-brand-teal uppercase"
                      id="modal-promocode"
                    />
                  </div>
                </div>

                {/* Grid 2: Dates and Guests */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1.5">Check-In Date</label>
                    <input
                      type="date"
                      required
                      min="2026-06-29"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-none text-stone-800 bg-stone-50 focus:outline-none focus:border-brand-teal"
                      id="modal-checkin"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1.5">Check-Out Date</label>
                    <input
                      type="date"
                      required
                      min={checkIn || "2026-06-29"}
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-none text-stone-800 bg-stone-50 focus:outline-none focus:border-brand-teal"
                      id="modal-checkout"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1.5">Total Guests</label>
                    <div className="flex items-center border border-stone-300 rounded-none overflow-hidden bg-stone-50 h-[38px]">
                      <button
                        type="button"
                        onClick={() => setGuests(prev => Math.max(1, prev - 1))}
                        className="px-3.5 h-full text-stone-600 hover:bg-stone-200 text-xs font-bold transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center text-xs font-bold text-stone-800">{guests}</span>
                      <button
                        type="button"
                        onClick={() => setGuests(prev => Math.min(selectedApartment.maxGuests, prev + 1))}
                        className="px-3.5 h-full text-stone-600 hover:bg-stone-200 text-xs font-bold transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Estimate Breakdown Container */}
                {breakdown ? (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-5 bg-brand-sand border border-stone-200 rounded-none space-y-2 text-xs"
                    id="modal-breakdown"
                  >
                    <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-stone-200 text-brand-dark font-bold font-serif text-sm">
                      <Calculator className="w-4 h-4 text-brand-teal" />
                      <span>Live Cost Estimation Breakdown</span>
                    </div>
                    
                    <div className="flex justify-between text-stone-600">
                      <span className="flex items-center gap-1">
                        {selectedApartment.name} ({breakdown.nights} nights x ${livePrice})
                        {isPriceLive && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" title="Live price connected to booking engine"></span>
                        )}
                      </span>
                      <span className="font-semibold text-stone-800">${breakdown.basePrice}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>{PACKAGES.find(p => p.id === packageId)?.name} Package ({guests} guests x ${PACKAGES.find(p => p.id === packageId)?.pricePerPersonPerDay}/day)</span>
                      <span className="font-semibold text-stone-800">${breakdown.packageCost}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>Local Resort Service Tax (8%)</span>
                      <span className="font-semibold text-stone-800">${breakdown.resortFee}</span>
                    </div>
                    
                    <div className="border-t border-stone-300 pt-3 mt-2 flex justify-between text-sm font-serif font-bold text-brand-dark">
                      <span>Estimated Inquiry Total</span>
                      <span className="text-brand-teal text-base">${breakdown.total} USD</span>
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-4 bg-brand-teal/5 border border-brand-teal/15 rounded-none text-xs text-brand-dark text-center font-light">
                    Provide your desired arrival & departure dates above to calculate a cost summary.
                  </div>
                )}
              </div>

              {/* Guest Details Area (Only in Inquiry Mode) */}
              {bookingMode === "inquiry" && (
                <div className="space-y-4 pt-4 border-t border-stone-200">
                  <div className="text-[10px] font-bold text-stone-800 uppercase tracking-widest block">
                    Guest Contact Information
                  </div>

                  <div className="space-y-3">
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Your Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-none text-stone-800 focus:outline-none focus:border-brand-teal"
                        id="modal-name"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="email"
                        required
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-none text-stone-800 focus:outline-none focus:border-brand-teal"
                        id="modal-email"
                      />
                      <input
                        type="tel"
                        required
                        placeholder="Phone Number (e.g., +254...)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-none text-stone-800 focus:outline-none focus:border-brand-teal"
                        id="modal-phone"
                      />
                    </div>

                    <div>
                      <textarea
                        placeholder="Special Requests (e.g. airport pickup, dietary needs, crib request, dhow boarding details)"
                        rows={3}
                        value={requests}
                        onChange={(e) => setRequests(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-none text-stone-800 focus:outline-none focus:border-brand-teal resize-none"
                        id="modal-requests"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-4 pt-4 border-t border-stone-200">
                {bookingMode === "live" ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-brand-teal/5 border border-brand-teal/15 text-left space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="text-[10px] font-bold text-brand-teal uppercase tracking-wider flex items-center gap-1.5">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live Profitroom Direct Booking
                          </h4>
                          <p className="text-[11px] text-stone-500 font-light mt-0.5">
                            Instantly check direct rates, live availability, and lock in best-rate direct resort pricing.
                          </p>
                        </div>
                      </div>
                      
                      {!checkIn || !checkOut ? (
                        <div className="text-xs text-amber-600 font-light italic bg-amber-50 border border-amber-200/40 p-3">
                          *Please select Check-In and Check-Out dates above to enable direct instant booking.
                        </div>
                      ) : null}

                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          type="button"
                          onClick={handleClose}
                          className="sm:w-1/3 py-3 border border-brand-dark hover:bg-stone-50 text-brand-dark font-bold rounded-none text-xs uppercase tracking-widest transition-colors duration-200 cursor-pointer text-center"
                        >
                          Close
                        </button>
                        <button
                          type="button"
                          onClick={handleProfitroomBook}
                          disabled={!checkIn || !checkOut}
                          className={`sm:w-2/3 py-3 font-bold rounded-none text-xs uppercase tracking-widest transition-colors duration-200 cursor-pointer text-center flex items-center justify-center gap-2 ${
                            checkIn && checkOut 
                              ? "bg-brand-teal text-brand-dark hover:bg-brand-dark hover:text-white" 
                              : "bg-stone-100 text-stone-400 cursor-not-allowed"
                          }`}
                          id="btn-modal-profitroom-direct-book"
                        >
                          <span>Book Instantly via Profitroom</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="sm:w-1/3 py-3 border border-brand-dark hover:bg-stone-50 text-brand-dark font-bold rounded-none text-xs uppercase tracking-widest transition-colors duration-200 cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="sm:w-2/3 py-3 bg-brand-dark hover:bg-brand-teal text-white font-bold rounded-none text-xs uppercase tracking-widest transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer"
                      id="btn-modal-submit"
                    >
                      <span>Submit Proposal Inquiry</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </form>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-10 text-center space-y-6"
              id="modal-success"
            >
              <div className="w-12 h-12 bg-brand-teal/10 text-brand-teal rounded-none flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              
              <div>
                <h4 className="font-serif text-2xl text-brand-dark font-bold">Booking Inquiry Submitted!</h4>
                <p className="text-stone-500 text-xs mt-1.5 font-light">
                  Our offline booking engine has recorded your credentials.
                </p>
              </div>

              <div className="p-5 bg-brand-sand border border-stone-200 rounded-none text-xs text-left space-y-2 text-stone-600 max-w-md mx-auto font-light">
                <p><strong>Apartment:</strong> {selectedApartment.name}</p>
                <p><strong>Boarding Plan:</strong> {PACKAGES.find(p => p.id === packageId)?.name}</p>
                <p><strong>Lead Guest:</strong> {name}</p>
                <p><strong>Primary Phone:</strong> {phone}</p>
                {breakdown && (
                  <p className="text-brand-teal font-semibold pt-1.5 border-t border-stone-200 mt-1 flex justify-between items-center text-sm">
                    <span>Estimated Total:</span>
                    <span>${breakdown.total} USD</span>
                  </p>
                )}
              </div>

              <p className="text-stone-500 text-xs font-light leading-relaxed max-w-md mx-auto">
                Thank you for selecting Tamarind Village Mombasa. Our booking representative will review suite availability for your dates and reach out via email (<span className="font-medium text-stone-800">{email}</span>) within 2 hours to confirm your reservation and send formal billing invoices.
              </p>

              <button
                onClick={handleClose}
                className="px-8 py-3 bg-brand-dark hover:bg-brand-teal text-white font-bold rounded-none text-[11px] uppercase tracking-widest transition-colors duration-200 cursor-pointer"
                id="btn-modal-success-close"
              >
                Return to Site
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
