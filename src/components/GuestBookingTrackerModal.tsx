import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Calendar, Users, MapPin, Phone, Mail, ShieldCheck, CheckCircle2,
  Clock, AlertCircle, ArrowRight, Copy, Check, MessageSquare, CreditCard,
  RefreshCw, X, ChevronRight, Download, DollarSign, Utensils, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface GuestBookingTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialToken?: string;
  onOpenBookingModal?: () => void;
}

export default function GuestBookingTrackerModal({
  isOpen,
  onClose,
  initialToken,
  onOpenBookingModal
}: GuestBookingTrackerModalProps) {
  const [tokenInput, setTokenInput] = useState(initialToken || "");
  const [activeToken, setActiveToken] = useState(initialToken || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inquiry, setInquiry] = useState<any | null>(null);

  // Modification Form State
  const [showModForm, setShowModForm] = useState(false);
  const [modCheckIn, setModCheckIn] = useState("");
  const [modCheckOut, setModCheckOut] = useState("");
  const [modGuests, setModGuests] = useState(2);
  const [modNote, setModNote] = useState("");
  const [modSubmitting, setModSubmitting] = useState(false);
  const [modSuccess, setModSuccess] = useState(false);

  // Payment Form State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "card" | "bank">("mpesa");
  const [paymentRef, setPaymentRef] = useState("");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Copy Feedback
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync initialToken if changed
  useEffect(() => {
    if (initialToken) {
      setTokenInput(initialToken);
      setActiveToken(initialToken);
      fetchBookingDetails(initialToken);
    }
  }, [initialToken]);

  // Fetch booking details by token or reference
  const fetchBookingDetails = async (tokenToFetch: string) => {
    if (!tokenToFetch.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/track?token=${encodeURIComponent(tokenToFetch.trim())}`);
      const data = await res.json();
      if (res.ok && data.success && data.inquiry) {
        setInquiry(data.inquiry);
        // Pre-populate modification fields
        const p = data.inquiry.payload || {};
        if (p.checkIn) setModCheckIn(p.checkIn);
        if (p.checkOut) setModCheckOut(p.checkOut);
        if (p.guests) setModGuests(p.guests);
      } else {
        setError(data.error || "No reservation or inquiry found with this reference code or token. Please check the link or contact our front desk.");
        setInquiry(null);
      }
    } catch (err: any) {
      console.error("Failed to track reservation:", err);
      setError("Unable to connect to the Tamarind reservation server. Please check your internet connection.");
      setInquiry(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setActiveToken(tokenInput.trim());
    fetchBookingDetails(tokenInput.trim());
  };

  // Submit modification request
  const handleRequestChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiry) return;
    setModSubmitting(true);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: inquiry.payload?.guestToken || inquiry.id,
          action: "request_change",
          changeData: {
            checkIn: modCheckIn,
            checkOut: modCheckOut,
            guests: modGuests,
            notes: modNote,
            requestedAt: new Date().toISOString()
          }
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setModSuccess(true);
        setInquiry(data.inquiry);
        toast.success("Stay modification request sent to Reservations!");
        setTimeout(() => {
          setShowModForm(false);
          setModSuccess(false);
        }, 2500);
      } else {
        toast.error(data.error || "Failed to submit modification request.");
      }
    } catch (err: any) {
      toast.error("Network error. Please try again.");
    } finally {
      setModSubmitting(false);
    }
  };

  // Record payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiry) return;
    setPaymentSubmitting(true);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: inquiry.payload?.guestToken || inquiry.id,
          action: "record_payment",
          payment: {
            method: paymentMethod,
            reference: paymentRef || `MANUAL-${Date.now()}`,
            phoneNumber: mpesaPhone,
            amount: inquiry.payload?.totalCost || 0,
            submittedAt: new Date().toISOString()
          }
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPaymentSuccess(true);
        setInquiry(data.inquiry);
        toast.success("Payment details submitted successfully!");
        setTimeout(() => {
          setShowPaymentModal(false);
          setPaymentSuccess(false);
        }, 2500);
      } else {
        toast.error(data.error || "Failed to record payment.");
      }
    } catch (err: any) {
      toast.error("Payment processing error. Please try again.");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Status progression mapping
  const getStatusStep = (status: string) => {
    switch (status) {
      case "Pending":
        return 1;
      case "Reviewed":
        return 2;
      case "Offer Sent":
      case "Contacted":
        return 3;
      case "Booked (Won)":
        return 4;
      case "Cancelled (Lost)":
        return -1;
      default:
        return 1;
    }
  };

  const copyMagicLink = () => {
    const url = `${window.location.origin}/?token=${inquiry?.payload?.guestToken || activeToken}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!isOpen) return null;

  const p = inquiry?.payload || {};
  const currentStep = inquiry ? getStatusStep(inquiry.status) : 1;
  const isCancelled = inquiry?.status === "Cancelled (Lost)";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Main Container */}
      <div className="relative w-full max-w-3xl bg-white text-brand-dark shadow-2xl z-10 my-auto overflow-hidden border border-stone-200">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#821124] to-[#560A17] text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 border border-white/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-brand-gold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-brand-gold bg-black/30 px-2 py-0.5">
                  No-Login Secure Guest Portal
                </span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-normal text-white mt-0.5">
                Track & Manage Your Reservation
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-8 max-h-[80vh] overflow-y-auto space-y-6">

          {/* Search Bar if not yet loaded or user wants to lookup another token */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter your Guest Token or Ref Code (e.g. tv_guest_... or inq_...)"
                className="w-full text-xs sm:text-sm px-4 py-3 border border-stone-300 focus:outline-none focus:border-brand-teal font-mono bg-stone-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !tokenInput.trim()}
              className="px-6 py-3 bg-brand-dark hover:bg-brand-teal text-white font-bold text-xs uppercase tracking-widest transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Track</span>}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Reservation lookup failed</p>
                <p className="mt-0.5 font-light">{error}</p>
              </div>
            </div>
          )}

          {/* Inquiry Found Card */}
          {inquiry && (
            <div className="space-y-6">

              {/* Status Stepper */}
              <div className="bg-stone-50 p-5 border border-stone-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-stone-200">
                  <div>
                    <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">Reference Number</span>
                    <span className="font-mono text-sm font-bold text-brand-dark">{inquiry.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">Live Status:</span>
                    <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-none ${
                      inquiry.status === "Booked (Won)" ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                      inquiry.status === "Offer Sent" ? "bg-purple-100 text-purple-800 border border-purple-300" :
                      inquiry.status === "Cancelled (Lost)" ? "bg-stone-200 text-stone-700" :
                      "bg-amber-100 text-amber-800 border border-amber-300"
                    }`}>
                      {inquiry.status}
                    </span>
                  </div>
                </div>

                {/* Stepper Visualization */}
                {!isCancelled ? (
                  <div className="grid grid-cols-4 gap-2 text-center pt-2">
                    {[
                      { step: 1, label: "Request Received", desc: "Submitted online" },
                      { step: 2, label: "Concierge Review", desc: "Checking dates" },
                      { step: 3, label: "Quote Sent", desc: "Rates & details ready" },
                      { step: 4, label: "Confirmed & Booked", desc: "Stay secured" }
                    ].map((st) => {
                      const isPastOrCurrent = currentStep >= st.step;
                      const isCurrent = currentStep === st.step;
                      return (
                        <div key={st.step} className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                            isCurrent
                              ? "bg-brand-teal text-white ring-4 ring-brand-teal/20"
                              : isPastOrCurrent
                              ? "bg-emerald-600 text-white"
                              : "bg-stone-200 text-stone-500"
                          }`}>
                            {isPastOrCurrent && !isCurrent ? <Check className="w-4 h-4" /> : st.step}
                          </div>
                          <span className={`text-[11px] font-bold mt-2 uppercase tracking-tight ${
                            isCurrent ? "text-brand-teal" : isPastOrCurrent ? "text-stone-800" : "text-stone-400"
                          }`}>
                            {st.label}
                          </span>
                          <span className="text-[9px] text-stone-400 hidden sm:block mt-0.5">{st.desc}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-stone-100 text-stone-600 text-xs text-center font-mono">
                    This reservation inquiry has been marked as closed or cancelled. Contact our desk if you would like to reactivate.
                  </div>
                )}
              </div>

              {/* Booking Summary Box */}
              <div className="border border-stone-200 p-5 bg-white space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <h3 className="font-serif text-lg font-bold text-brand-dark flex items-center gap-2">
                    {inquiry.type === "apartment" ? (
                      <>
                        <Sparkles className="w-4 h-4 text-brand-gold" />
                        <span>{p.apartmentName || "Luxury Apartment Suite"}</span>
                      </>
                    ) : (
                      <>
                        <Utensils className="w-4 h-4 text-brand-gold" />
                        <span>{p.diningName || "Dining Reservation"}</span>
                      </>
                    )}
                  </h3>
                  <button
                    onClick={copyMagicLink}
                    className="text-[11px] font-mono text-stone-500 hover:text-brand-teal flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 border border-stone-200 transition-colors cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Magic Link</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-mono block">Guest Name</span>
                    <span className="font-bold text-stone-800">{p.name || "Valued Guest"}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-mono block">Guests</span>
                    <span className="font-bold text-stone-800">{p.guests || 1} Guests</span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-mono block">Dates</span>
                    <span className="font-bold text-stone-800">
                      {p.checkIn ? `${p.checkIn} → ${p.checkOut}` : p.date ? `${p.date} (${p.time})` : "Dates Flexible"}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-mono block">Boarding Plan</span>
                    <span className="font-bold text-brand-teal uppercase">{p.packageId || "Self Catering"}</span>
                  </div>
                </div>

                {/* Quoted Pricing & Payment Status */}
                <div className="bg-stone-50 p-4 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block">Total Quoted Amount</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif text-2xl font-bold text-brand-dark">
                        ${p.totalCost ? Number(p.totalCost).toLocaleString() : "Custom Quote"}
                      </span>
                      {p.totalCost && (
                        <span className="text-xs text-stone-500 font-mono">
                          (~{(Number(p.totalCost) * 135).toLocaleString()} KES)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500">Payment Status:</span>
                    <span className={`px-2.5 py-1 text-xs font-mono font-bold uppercase ${
                      p.paymentStatus === "fully_paid"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : p.paymentStatus === "deposit_paid"
                        ? "bg-blue-100 text-blue-800 border border-blue-300"
                        : "bg-amber-50 text-amber-900 border border-amber-200"
                    }`}>
                      {p.paymentStatus ? p.paymentStatus.replace("_", " ") : "Pending Payment"}
                    </span>
                  </div>
                </div>

                {p.requests && (
                  <div className="text-xs text-stone-600 bg-stone-50/70 p-3 border-l-2 border-stone-300">
                    <span className="font-bold block text-[10px] uppercase font-mono text-stone-400">Your Special Requests:</span>
                    <p className="mt-0.5">{p.requests}</p>
                  </div>
                )}
              </div>

              {/* LIVE CONCIERGE PAYMENT LINK BANNER (IF CONFIGURED BY STAFF) */}
              {p.paymentLink && (
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-500 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                  <div className="text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 text-emerald-800 font-bold text-xs uppercase font-mono">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Official Online Payment Link Ready</span>
                    </div>
                    <p className="text-stone-600 text-xs mt-0.5 font-light">
                      The Tamarind reservations team has prepared your verified checkout link for this stay.
                    </p>
                  </div>
                  <a
                    href={p.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-md flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <span>Pay ${p.totalCost ? Number(p.totalCost).toLocaleString() : ""} Online Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Guest Self-Service Action Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Request Modification */}
                <button
                  onClick={() => setShowModForm(!showModForm)}
                  className="py-3 px-4 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <Calendar className="w-4 h-4 text-brand-teal" />
                  <span>Request Changes</span>
                </button>

                {/* 2. Make Direct Payment */}
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="py-3 px-4 bg-brand-gold hover:bg-amber-500 text-brand-dark text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Direct Payment</span>
                </button>

                {/* 3. Direct WhatsApp Concierge */}
                <a
                  href={`https://wa.me/254725959552?text=${encodeURIComponent(
                    `Hello Tamarind Reservations, I am inquiring about my reservation ${inquiry.id} (${p.apartmentName || p.diningName || "Tamarind Mombasa"}). Could you assist me with the details?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp Host</span>
                </a>
              </div>

              {/* Inline Modification Request Form */}
              <AnimatePresence>
                {showModForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden border border-brand-teal/40 bg-brand-teal/5 p-5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-serif text-base font-bold text-brand-dark">
                        Request Date or Guest Count Modification
                      </h4>
                      <button
                        onClick={() => setShowModForm(false)}
                        className="text-stone-400 hover:text-stone-700 text-sm"
                      >
                        Cancel
                      </button>
                    </div>

                    {modSuccess && (
                      <div className="mb-4 p-3 bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Modification request received! Our reservations team will update your proposal.</span>
                      </div>
                    )}

                    <form onSubmit={handleRequestChange} className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-stone-600 font-bold uppercase text-[10px] mb-1">
                            New Check-In Date
                          </label>
                          <input
                            type="date"
                            value={modCheckIn}
                            onChange={(e) => setModCheckIn(e.target.value)}
                            className="w-full p-2 border border-stone-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-stone-600 font-bold uppercase text-[10px] mb-1">
                            New Check-Out Date
                          </label>
                          <input
                            type="date"
                            value={modCheckOut}
                            onChange={(e) => setModCheckOut(e.target.value)}
                            className="w-full p-2 border border-stone-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-stone-600 font-bold uppercase text-[10px] mb-1">
                            Updated Guests
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={modGuests}
                            onChange={(e) => setModGuests(Number(e.target.value))}
                            className="w-full p-2 border border-stone-300 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-stone-600 font-bold uppercase text-[10px] mb-1">
                          Notes / Reason for Change
                        </label>
                        <textarea
                          rows={2}
                          value={modNote}
                          onChange={(e) => setModNote(e.target.value)}
                          placeholder="e.g. Flight was rescheduled to arrive one day later; requesting early check-in."
                          className="w-full p-2 border border-stone-300 bg-white"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={modSubmitting}
                          className="px-6 py-2.5 bg-brand-teal text-white font-bold text-xs uppercase tracking-widest hover:bg-brand-teal-dark transition-colors cursor-pointer flex items-center gap-2"
                        >
                          {modSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Submit Changes to Concierge</span>}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Direct Payment Modal / Tab */}
              <AnimatePresence>
                {showPaymentModal && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="border border-stone-300 bg-stone-50 p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                      <h4 className="font-serif text-lg font-bold text-brand-dark flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-700" />
                        <span>Direct Payment & Deposit Portal</span>
                      </h4>
                      <button
                        onClick={() => setShowPaymentModal(false)}
                        className="text-stone-400 hover:text-stone-700 text-xs font-mono"
                      >
                        [Close]
                      </button>
                    </div>

                    {paymentSuccess && (
                      <div className="p-4 bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Payment recorded! Our finance team is validating your transaction and will issue your formal receipt.</span>
                      </div>
                    )}

                    {/* Method Selector */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "mpesa", label: "M-Pesa Paybill" },
                        { id: "card", label: "Credit / Debit Card" },
                        { id: "bank", label: "Direct Bank Wire" }
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id as any)}
                          className={`py-2 px-3 text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                            paymentMethod === m.id
                              ? "bg-brand-dark text-white border-brand-dark"
                              : "bg-white text-stone-700 border-stone-300 hover:bg-stone-100"
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    {/* M-PESA Instructions */}
                    {paymentMethod === "mpesa" && (
                      <div className="p-4 bg-white border border-emerald-300 space-y-3 text-xs">
                        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                          <span className="font-bold text-emerald-800 uppercase font-mono">Safaricom M-Pesa Instructions:</span>
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 font-bold">Instant Confirmation</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-stone-600">
                          <li>Go to M-PESA menu on your phone and select <strong>Lipa na M-PESA</strong> ➔ <strong>Paybill</strong></li>
                          <li>Enter Business No: <strong className="font-mono text-brand-dark">512200</strong> (Tamarind Mombasa)</li>
                          <li>Enter Account No: <strong className="font-mono text-brand-dark">TVL-{inquiry.id.slice(4, 11).toUpperCase()}</strong></li>
                          <li>Enter Amount: <strong className="font-mono text-emerald-800">{p.totalCost ? `KES ${(Number(p.totalCost) * 135).toLocaleString()}` : "Quoted Amount"}</strong></li>
                          <li>Enter your M-Pesa PIN and complete transaction</li>
                        </ol>

                        <form onSubmit={handleRecordPayment} className="pt-2 flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Enter M-Pesa Confirmation Code (e.g. QJD78KL9M)"
                            value={paymentRef}
                            onChange={(e) => setPaymentRef(e.target.value.toUpperCase())}
                            className="flex-1 p-2 border border-stone-300 font-mono text-xs uppercase"
                          />
                          <button
                            type="submit"
                            disabled={paymentSubmitting || !paymentRef.trim()}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            {paymentSubmitting ? "Verifying..." : "Submit M-Pesa Code"}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Card Instructions */}
                    {paymentMethod === "card" && (
                      <div className="p-4 bg-white border border-stone-300 space-y-3 text-xs">
                        <p className="text-stone-600">
                          Online credit/debit card checkout via 3D-Secure Pesapal / Visa / Mastercard payment gateway.
                        </p>
                        <form onSubmit={handleRecordPayment} className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="Cardholder Full Name"
                              required
                              className="p-2 border border-stone-300 text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Pesapal / Bank Transaction Ref (if completed)"
                              value={paymentRef}
                              onChange={(e) => setPaymentRef(e.target.value)}
                              className="p-2 border border-stone-300 text-xs font-mono"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={paymentSubmitting}
                            className="w-full py-2.5 bg-brand-dark hover:bg-brand-teal text-white font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer"
                          >
                            {paymentSubmitting ? "Processing..." : "Confirm Card Payment"}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Bank Wire Instructions */}
                    {paymentMethod === "bank" && (
                      <div className="p-4 bg-white border border-stone-300 space-y-2 text-xs text-stone-700">
                        <p className="font-bold text-brand-dark">Bank Wire / RTGS Transfer Details:</p>
                        <div className="font-mono text-[11px] bg-stone-50 p-3 space-y-1">
                          <p><strong>Bank:</strong> I&M Bank Kenya</p>
                          <p><strong>Account Name:</strong> Tamarind Village Ltd</p>
                          <p><strong>Account (USD):</strong> 01402938102938</p>
                          <p><strong>Account (KES):</strong> 01402938102901</p>
                          <p><strong>Swift Code:</strong> IMBLKENA</p>
                          <p><strong>Payment Reference:</strong> {inquiry.id}</p>
                        </div>
                        <p className="text-[11px] text-stone-500 italic">
                          Please send proof of transfer to reservations.village@tamarind.co.ke with your reference number.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* GUEST-FACING AUDIT & ACTIVITY TIMELINE */}
              {p.auditTrail && p.auditTrail.length > 0 && (
                <div className="border-t border-stone-200 pt-4 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold block">
                    Reservation Activity Timeline
                  </span>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                    {p.auditTrail.slice().reverse().map((ev: any) => (
                      <div key={ev.id} className="flex items-start gap-2.5 text-xs text-stone-600 bg-stone-50 p-2 border border-stone-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-teal mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-stone-800 leading-tight">{ev.action}</p>
                          <span className="text-[9px] text-stone-400 font-mono block mt-0.5">
                            {new Date(ev.timestamp).toLocaleDateString()} {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-stone-100 px-6 py-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-stone-500 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span>Tamarind Reservations Desk operates daily from 7:00 AM – 10:00 PM EAT.</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="tel:+254725959552"
              className="text-stone-700 hover:text-brand-dark font-medium flex items-center gap-1"
            >
              <Phone className="w-3 h-3 text-brand-gold" />
              <span>+254 725 959 552</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
