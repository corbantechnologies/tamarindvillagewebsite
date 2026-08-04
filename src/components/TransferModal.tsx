import React, { useState, useEffect } from "react";
import { X, Plane, Train, Car, Calendar, Clock, Users, Luggage, CheckCircle2, ShieldCheck, Sparkles, ArrowRight, Phone, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { loadTransferVehicles, TransferVehicle } from "../utils/extrasStore";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehiclesList?: TransferVehicle[];
}

export default function TransferModal({ isOpen, onClose, vehiclesList }: TransferModalProps) {
  const [vehicles, setVehicles] = useState<TransferVehicle[]>([]);

  useEffect(() => {
    if (vehiclesList && vehiclesList.length > 0) {
      setVehicles(vehiclesList);
    } else {
      setVehicles(loadTransferVehicles());
    }
  }, [vehiclesList, isOpen]);

  const [terminal, setTerminal] = useState<"moi-airport" | "miritini-sgr" | "vipingo-airstrip">("moi-airport");
  const [transferType, setTransferType] = useState<"one-way-arrival" | "one-way-departure" | "round-trip">("one-way-arrival");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("executive-saloon");
  
  const [passengers, setPassengers] = useState<number>(2);
  const [luggageCount, setLuggageCount] = useState<number>(2);
  const [transferDate, setTransferDate] = useState<string>("");
  const [transferTime, setTransferTime] = useState<string>("");
  const [flightOrTrainNo, setFlightOrTrainNo] = useState<string>("");
  
  // Passenger details
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [specialRequests, setSpecialRequests] = useState<string>("");
  const [childSeatNeeded, setChildSeatNeeded] = useState<boolean>(false);
  const [welcomeDawaNeeded, setWelcomeDawaNeeded] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [bookingRef, setBookingRef] = useState<string>("");

  const activeVehicles = vehicles.length > 0 ? vehicles : loadTransferVehicles();
  const selectedVehicle = activeVehicles.find(v => v.id === selectedVehicleId) || activeVehicles[0];

  // Carousel index state for vehicle fleet selection
  const [vehicleCarouselIndex, setVehicleCarouselIndex] = useState(0);

  // Base pricing multiplier for round-trip vs one-way
  const multiplier = transferType === "round-trip" ? 1.85 : 1.0; // 15% discount on return
  const totalUsd = Math.round(selectedVehicle.rateUsd * multiplier);
  const totalKes = Math.round(selectedVehicle.rateKes * multiplier);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferDate || !name || !phone || !email) {
      alert("Please fill in all required fields (Date, Name, Email, Phone).");
      return;
    }

    setIsSubmitting(true);

    // Simulate transfer booking API call
    setTimeout(() => {
      const refCode = `TV-TRF-${Math.floor(100000 + Math.random() * 900000)}`;
      setBookingRef(refCode);
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1200);
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setName("");
    setEmail("");
    setPhone("");
    setFlightOrTrainNo("");
    setSpecialRequests("");
    setTransferDate("");
    setTransferTime("");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6" id="transfer-modal-backdrop">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white border border-stone-200 rounded-none w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative text-stone-800"
          id="transfer-modal-content"
        >
          {/* Top Header */}
          <div className="bg-brand-dark text-white p-6 sm:p-8 sticky top-0 z-20 border-b border-stone-800 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 text-brand-gold text-xs font-mono font-bold uppercase tracking-widest mb-1">
                <Car className="w-4 h-4 text-brand-gold" />
                <span>Chauffeur Concierge</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl text-white">Private Airport & SGR Transfers</h2>
              <p className="text-stone-300 text-xs font-light mt-1">
                Seamless, stress-free transfers between Tamarind Village and Moi International Airport or Miritini SGR Station.
              </p>
            </div>
            <button 
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="text-stone-400 hover:text-white p-2 transition-colors cursor-pointer"
              id="btn-close-transfer-modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
              
              {/* Step 1: Terminal & Route Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-brand-dark mb-3">
                  1. Select Pickup or Dropoff Location
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setTerminal("moi-airport")}
                    className={`p-4 text-left border rounded-none transition-all cursor-pointer flex flex-col justify-between ${
                      terminal === "moi-airport" 
                        ? "border-brand-teal bg-brand-teal/5 text-brand-dark shadow-sm" 
                        : "border-stone-200 hover:border-stone-400 text-stone-600 bg-stone-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Plane className={`w-5 h-5 ${terminal === "moi-airport" ? "text-brand-teal" : "text-stone-400"}`} />
                      <span className="text-[10px] font-mono text-stone-400">~30 mins drive</span>
                    </div>
                    <div>
                      <p className="font-serif text-sm font-bold block">Moi Int'l Airport (MBA)</p>
                      <p className="text-[11px] text-stone-500 font-light mt-0.5">Mombasa Airport Terminals</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTerminal("miritini-sgr")}
                    className={`p-4 text-left border rounded-none transition-all cursor-pointer flex flex-col justify-between ${
                      terminal === "miritini-sgr" 
                        ? "border-brand-teal bg-brand-teal/5 text-brand-dark shadow-sm" 
                        : "border-stone-200 hover:border-stone-400 text-stone-600 bg-stone-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Train className={`w-5 h-5 ${terminal === "miritini-sgr" ? "text-brand-teal" : "text-stone-400"}`} />
                      <span className="text-[10px] font-mono text-stone-400">~25 mins drive</span>
                    </div>
                    <div>
                      <p className="font-serif text-sm font-bold block">Miritini SGR Terminus</p>
                      <p className="text-[11px] text-stone-500 font-light mt-0.5">Madaraka Express Train</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTerminal("vipingo-airstrip")}
                    className={`p-4 text-left border rounded-none transition-all cursor-pointer flex flex-col justify-between ${
                      terminal === "vipingo-airstrip" 
                        ? "border-brand-teal bg-brand-teal/5 text-brand-dark shadow-sm" 
                        : "border-stone-200 hover:border-stone-400 text-stone-600 bg-stone-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Plane className={`w-5 h-5 ${terminal === "vipingo-airstrip" ? "text-brand-teal" : "text-stone-400"}`} />
                      <span className="text-[10px] font-mono text-stone-400">~45 mins drive</span>
                    </div>
                    <div>
                      <p className="font-serif text-sm font-bold block">Vipingo / Diani Airstrip</p>
                      <p className="text-[11px] text-stone-500 font-light mt-0.5">Regional Airstrip Connection</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 2: Transfer Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-brand-dark mb-3">
                  2. Journey Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "one-way-arrival", label: "One-Way Arrival", desc: "Terminal ➔ Tamarind Village" },
                    { id: "one-way-departure", label: "One-Way Departure", desc: "Tamarind Village ➔ Terminal" },
                    { id: "round-trip", label: "Round-Trip Transfer", desc: "Arrival + Departure (15% Savings)" }
                  ].map((tt) => (
                    <button
                      key={tt.id}
                      type="button"
                      onClick={() => setTransferType(tt.id as any)}
                      className={`p-3 text-left border rounded-none text-xs transition-all cursor-pointer ${
                        transferType === tt.id 
                          ? "border-brand-dark bg-brand-dark text-white font-bold" 
                          : "border-stone-200 text-stone-700 bg-white hover:bg-stone-50"
                      }`}
                    >
                      <p className="font-bold">{tt.label}</p>
                      <p className={`text-[10px] mt-0.5 font-light ${transferType === tt.id ? "text-stone-300" : "text-stone-500"}`}>{tt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Vehicle Fleet Selection Carousel */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold uppercase tracking-widest text-brand-dark">
                    3. Choose Your Vehicle Fleet ({activeVehicles.length} Options)
                  </label>
                  
                  {activeVehicles.length > 2 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-stone-500 font-mono mr-1">
                        Swipe or step
                      </span>
                      <button
                        type="button"
                        onClick={() => setVehicleCarouselIndex((prev) => (prev - 1 + activeVehicles.length) % activeVehicles.length)}
                        className="p-1 border border-stone-300 hover:border-brand-teal text-stone-600 hover:text-brand-teal transition-colors cursor-pointer"
                        title="Previous vehicle"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setVehicleCarouselIndex((prev) => (prev + 1) % activeVehicles.length)}
                        className="p-1 border border-stone-300 hover:border-brand-teal text-stone-600 hover:text-brand-teal transition-colors cursor-pointer"
                        title="Next vehicle"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Fleet Quick Selector Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
                  {activeVehicles.map((v, idx) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedVehicleId(v.id);
                        setVehicleCarouselIndex(idx);
                      }}
                      className={`px-3 py-1.5 text-xs whitespace-nowrap transition-all border cursor-pointer ${
                        selectedVehicleId === v.id
                          ? "bg-brand-teal text-white border-brand-teal font-bold shadow-sm"
                          : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                      }`}
                    >
                      {v.name} (${Math.round(v.rateUsd * multiplier)})
                    </button>
                  ))}
                </div>

                {/* Vehicles Grid / Carousel View */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeVehicles.map((v) => {
                    const vPriceUsd = Math.round(v.rateUsd * multiplier);
                    const vPriceKes = Math.round(v.rateKes * multiplier);
                    const isSelected = selectedVehicleId === v.id;

                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVehicleId(v.id)}
                        className={`border rounded-none p-4 cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected 
                            ? "border-brand-teal ring-2 ring-brand-teal/30 bg-brand-sand/30 shadow-md" 
                            : "border-stone-200 bg-white hover:border-stone-300"
                        }`}
                      >
                        <div>
                          <div className="aspect-[16/10] bg-stone-100 overflow-hidden mb-3 relative">
                            <img 
                              src={v.image} 
                              alt={v.name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            {isSelected && (
                              <span className="absolute top-2 right-2 bg-brand-teal text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider shadow-sm">
                                Selected Fleet
                              </span>
                            )}
                          </div>
                          
                          <h4 className="font-serif font-bold text-base text-brand-dark mb-1">{v.name}</h4>
                          <p className="text-[11px] text-stone-500 font-light leading-relaxed mb-3">{v.tagline}</p>
                          
                          <div className="flex items-center gap-3 text-[10px] text-stone-600 font-mono font-medium mb-3">
                            <span className="flex items-center gap-1"><Users className="w-3 h-3 text-brand-teal" /> {v.maxPassengers} Pass.</span>
                            <span className="flex items-center gap-1"><Luggage className="w-3 h-3 text-brand-teal" /> {v.maxLuggage} Bags</span>
                          </div>

                          <div className="space-y-1 mb-4 border-t border-stone-200/60 pt-3">
                            {v.features.map((feat, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-[10px] text-stone-600 font-light">
                                <CheckCircle2 className="w-3 h-3 text-brand-teal flex-shrink-0" />
                                <span>{feat}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                          <div>
                            <span className="text-[9px] text-stone-400 uppercase font-bold tracking-widest block">Transfer Rate</span>
                            <span className="font-serif font-bold text-sm text-brand-dark">${vPriceUsd} <span className="text-[10px] text-stone-500 font-normal">/ KES {vPriceKes.toLocaleString()}</span></span>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-brand-teal font-extrabold" : "text-stone-400"}`}>
                            {isSelected ? "✓ Selected" : "Select Vehicle"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 4: Arrival & Contact Details */}
              <div className="bg-stone-50 border border-stone-200 p-6 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-brand-dark border-b border-stone-200 pb-2">
                  4. Pickup Schedule & Passenger Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                      Transfer Date *
                    </label>
                    <input 
                      type="date" 
                      required
                      value={transferDate}
                      onChange={(e) => setTransferDate(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-none text-stone-800 focus:outline-none focus:border-brand-teal bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                      Estimated Time / Flight Time *
                    </label>
                    <input 
                      type="time" 
                      required
                      value={transferTime}
                      onChange={(e) => setTransferTime(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-none text-stone-800 focus:outline-none focus:border-brand-teal bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                      Flight # or Train Ticket #
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. KQ 608 or SGR Train E1"
                      value={flightOrTrainNo}
                      onChange={(e) => setFlightOrTrainNo(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-none text-stone-800 focus:outline-none focus:border-brand-teal bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                      Guest Full Name *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Sarah Jenkins"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-none text-stone-800 focus:outline-none focus:border-brand-teal bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                      Email Address *
                    </label>
                    <input 
                      type="email" 
                      required
                      placeholder="sarah@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-none text-stone-800 focus:outline-none focus:border-brand-teal bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                      Phone Number / WhatsApp *
                    </label>
                    <input 
                      type="tel" 
                      required
                      placeholder="+254 700 000 000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-none text-stone-800 focus:outline-none focus:border-brand-teal bg-white"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-6 text-xs text-stone-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={childSeatNeeded}
                      onChange={(e) => setChildSeatNeeded(e.target.checked)}
                      className="accent-brand-teal"
                    />
                    <span>Request Child Safety Seat</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={welcomeDawaNeeded}
                      onChange={(e) => setWelcomeDawaNeeded(e.target.checked)}
                      className="accent-brand-teal"
                    />
                    <span>Chauffeur Chilled Tamarind Dawa Refreshment</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Special Chauffeur Instructions or Extra Luggage
                  </label>
                  <textarea 
                    rows={2}
                    placeholder="e.g. Flight arrives early morning, 2 large golf bags..."
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full text-xs p-3 border border-stone-300 rounded-none text-stone-800 focus:outline-none focus:border-brand-teal bg-white"
                  />
                </div>
              </div>

              {/* Bottom Total & Submit */}
              <div className="bg-brand-dark text-white p-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-stone-400 font-mono uppercase tracking-widest block">Estimated Total Cost</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-2xl font-bold text-brand-gold">${totalUsd} USD</span>
                    <span className="text-xs text-stone-400 font-mono">(KES {totalKes.toLocaleString()})</span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-light block mt-0.5">
                    Pay upon arrival or add to room folio. Driver signage & baggage assistance included.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3.5 bg-brand-teal hover:bg-brand-teal-dark text-white font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
                  id="btn-submit-transfer"
                >
                  {isSubmitting ? (
                    <span>Confirming Chauffeur...</span>
                  ) : (
                    <>
                      <span>Reserve Private Transfer</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>
          ) : (
            /* Confirmation Screen */
            <div className="p-8 sm:p-12 text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-teal block mb-1">
                  Chauffeur Reservation Confirmed
                </span>
                <h3 className="font-serif text-3xl font-bold text-brand-dark">We Look Forward to Welcoming You!</h3>
                <p className="text-stone-500 text-xs sm:text-sm font-light max-w-md mx-auto mt-2 leading-relaxed">
                  Your transfer request has been received by the Tamarind Village Concierge Desk. Our private chauffeur will track your schedule and meet you with personalized signage.
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-200 p-6 max-w-lg mx-auto text-left space-y-2 text-xs text-stone-700">
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-stone-400 font-mono uppercase">Reservation Ref:</span>
                  <span className="font-mono font-bold text-brand-dark">{bookingRef}</span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-stone-400">Guest Name:</span>
                  <span className="font-bold">{name}</span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-stone-400">Terminal & Vehicle:</span>
                  <span className="font-medium">{terminal === "moi-airport" ? "Moi Int'l Airport" : terminal === "miritini-sgr" ? "Miritini SGR Terminus" : "Vipingo Airstrip"} ({selectedVehicle.name})</span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-stone-400">Transfer Rate:</span>
                  <span className="font-bold text-brand-dark">${totalUsd} / KES {totalKes.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-4 flex justify-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    onClose();
                  }}
                  className="px-8 py-3 bg-brand-dark text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-teal transition-all cursor-pointer"
                >
                  Done & Close
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
