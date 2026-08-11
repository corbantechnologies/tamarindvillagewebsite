import React, { useState, useEffect } from "react";
import { Sparkles, Ship, Heart, Briefcase, CheckCircle2, ArrowRight, FileText, ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { loadEventPackages, EventPackage } from "../utils/extrasStore";

interface EventsAndChartersSectionProps {
  onOpenTransferModal?: () => void;
  onOpenCustomizer?: () => void;
  eventPackagesList?: EventPackage[];
  isAdmin?: boolean;
}

export default function EventsAndChartersSection({ onOpenTransferModal, onOpenCustomizer, eventPackagesList, isAdmin }: EventsAndChartersSectionProps) {
  const [packages, setPackages] = useState<EventPackage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (eventPackagesList && eventPackagesList.length > 0) {
      setPackages(eventPackagesList);
    } else {
      setPackages(loadEventPackages());
    }
  }, [eventPackagesList]);

  // Form state
  const [eventType, setEventType] = useState("wedding");
  const [guestCount, setGuestCount] = useState("50-100");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredVenue, setPreferredVenue] = useState("cliffside-lawn");
  const [cateringStyle, setCateringStyle] = useState("seafood-banquet");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [visionDetails, setVisionDetails] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [rfpRef, setRfpRef] = useState("");

  const handleNext = () => {
    if (packages.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % packages.length);
  };

  const handlePrev = () => {
    if (packages.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + packages.length) % packages.length);
  };

  const handleRfpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      alert("Please provide your Name, Email, and Phone number.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const ref = `RFP-TV-${Math.floor(10000 + Math.random() * 90000)}`;
      setRfpRef(ref);
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1200);
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "heart":
        return <Heart className="w-3.5 h-3.5" />;
      case "ship":
        return <Ship className="w-3.5 h-3.5" />;
      case "briefcase":
        return <Briefcase className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  const activePackage = packages[currentIndex] || packages[0];

  return (
    <section className="py-20 bg-brand-dark text-white scroll-mt-12 relative overflow-hidden" id="events-charters-section">
      {/* Background visual accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-teal/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-gold/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-gold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
              Exclusive Celebrations & Charters
            </span>
            {isAdmin && onOpenCustomizer && (
              <button
                onClick={onOpenCustomizer}
                className="text-[10px] text-stone-400 hover:text-brand-gold border border-stone-800 hover:border-brand-gold px-2 py-0.5 transition-colors flex items-center gap-1 cursor-pointer"
                title="Edit Weddings & Charters (Staff Mode)"
              >
                <Settings className="w-3 h-3" />
                <span>Edit Extras</span>
              </button>
            )}
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
            Weddings, Private Events & Dhow Charters
          </h2>
          <p className="text-stone-300 font-light mt-4 text-sm sm:text-base leading-relaxed">
            Host unforgettable oceanfront weddings, executive retreats, and private sunset dhow cruises. Backed by Tamarind Restaurant’s world-renowned catering and Tudor Creek’s breathtaking waterfront backdrop.
          </p>
        </div>

        {/* INTERACTIVE EVENT CAROUSEL (Replaces static stacked vertical cards) */}
        {packages.length > 0 && (
          <div className="mb-20">
            {/* Carousel Header & Navigation Controls */}
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-brand-gold uppercase tracking-widest">
                  Featured Experiences Carousel
                </span>
                <span className="text-stone-600 text-xs">|</span>
                <span className="text-xs text-stone-400 font-mono">
                  {currentIndex + 1} of {packages.length}
                </span>
              </div>

              {/* Prev / Next Arrows & Dots */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1.5 mr-2">
                  {packages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === currentIndex ? "w-6 bg-brand-gold" : "w-2 bg-stone-700 hover:bg-stone-500"
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>

                <button
                  onClick={handlePrev}
                  className="w-9 h-9 border border-stone-700 hover:border-brand-gold hover:text-brand-gold bg-stone-900/80 text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Previous event option"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  className="w-9 h-9 border border-stone-700 hover:border-brand-gold hover:text-brand-gold bg-stone-900/80 text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Next event option"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Carousel Slide Card Container */}
            <div className="relative overflow-hidden bg-[#221f1d] border border-stone-800 shadow-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePackage.id || currentIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-12 items-stretch"
                >
                  {/* Left Column: Image Banner */}
                  <div className="lg:col-span-7 relative min-h-[300px] sm:min-h-[400px] bg-stone-900 overflow-hidden">
                    <img 
                      src={activePackage.image} 
                      alt={activePackage.title} 
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-102"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-brand-dark/30 pointer-events-none" />

                    <div className="absolute top-4 left-4 bg-brand-dark/90 backdrop-blur-md px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-widest text-brand-gold flex items-center gap-1.5 border border-brand-gold/30">
                      {renderIcon(activePackage.tagIcon)}
                      <span>{activePackage.tag}</span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                      <span className="bg-black/70 backdrop-blur-sm text-stone-200 text-[11px] px-3 py-1 font-mono border border-stone-700">
                        👥 {activePackage.capacityText}
                      </span>
                      <span className="bg-black/70 backdrop-blur-sm text-stone-200 text-[11px] px-3 py-1 font-mono border border-stone-700">
                        🍽️ {activePackage.cateringText}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Details & CTA */}
                  <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between space-y-6">
                    <div>
                      <div className="text-[10px] uppercase font-mono font-bold text-brand-gold tracking-widest mb-1">
                        {activePackage.extraHighlight}
                      </div>
                      <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-3">
                        {activePackage.title}
                      </h3>
                      <p className="text-stone-300 text-xs sm:text-sm font-light leading-relaxed mb-6">
                        {activePackage.description}
                      </p>

                      <div className="space-y-2.5 border-t border-stone-800 pt-5">
                        {activePackage.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-2.5 text-xs text-stone-200">
                            <CheckCircle2 className="w-4 h-4 text-brand-gold flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-4 border-t border-stone-800/80 flex flex-col sm:flex-row items-center gap-3">
                      <a 
                        href="#rfp-form" 
                        onClick={() => setEventType(activePackage.id)}
                        className="w-full text-center py-3.5 bg-brand-gold hover:bg-amber-500 text-brand-dark font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
                      >
                        <span>{activePackage.ctaText || "Inquire Event Dates"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Small Quick-Selector Bar underneath carousel */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              {packages.map((pkg, idx) => (
                <button
                  key={pkg.id || idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`p-3 text-left border text-xs transition-all cursor-pointer truncate ${
                    idx === currentIndex
                      ? "border-brand-gold bg-brand-gold/10 text-brand-gold font-bold"
                      : "border-stone-800 bg-[#1c1a18] text-stone-400 hover:text-stone-200 hover:border-stone-700"
                  }`}
                >
                  <div className="text-[9px] uppercase font-mono text-stone-500 truncate mb-0.5">
                    {pkg.tag}
                  </div>
                  <div className="truncate font-serif font-semibold">{pkg.title}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* REQUEST FOR PROPOSAL (RFP) FORM SECTION */}
        <div className="bg-[#1A1817] border border-stone-800 p-8 sm:p-12 relative overflow-hidden" id="rfp-form">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <span className="text-[10px] uppercase font-mono tracking-widest text-brand-gold font-bold block mb-1">
              Event Planning & Proposals
            </span>
            <h3 className="font-serif text-3xl font-bold text-white">Request for Proposal (RFP)</h3>
            <p className="text-stone-300 text-xs sm:text-sm font-light mt-2 leading-relaxed">
              Tell us about your event vision, target dates, and estimated guest count. Our Tamarind Events Concierge team will craft a customized proposal within 24 hours.
            </p>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleRfpSubmit} className="max-w-4xl mx-auto space-y-6">
              
              {/* Event Type & Guests */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-300 mb-1">
                    Event Category *
                  </label>
                  <select 
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-stone-700 bg-stone-900 text-white rounded-none focus:outline-none focus:border-brand-gold"
                    id="rfp-select-event-type"
                  >
                    {packages.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-300 mb-1">
                    Estimated Guest Count *
                  </label>
                  <select 
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-stone-700 bg-stone-900 text-white rounded-none focus:outline-none focus:border-brand-gold"
                    id="rfp-select-guests"
                  >
                    <option value="10-25">Intimate (10 – 25 Guests)</option>
                    <option value="25-50">Medium (25 – 50 Guests)</option>
                    <option value="50-100">Large (50 – 100 Guests)</option>
                    <option value="100-200">Grand (100 – 200 Guests)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-300 mb-1">
                    Target Date / Month *
                  </label>
                  <input 
                    type="date"
                    required
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-stone-700 bg-stone-900 text-white rounded-none focus:outline-none focus:border-brand-gold"
                  />
                </div>
              </div>

              {/* Venue & Catering preferences */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-300 mb-1">
                    Preferred Setting
                  </label>
                  <select 
                    value={preferredVenue}
                    onChange={(e) => setPreferredVenue(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-stone-700 bg-stone-900 text-white rounded-none focus:outline-none focus:border-brand-gold"
                  >
                    <option value="cliffside-lawn">Cliffside Garden Lawn (Tudor Creek View)</option>
                    <option value="tamarind-dhow">Tamarind Dhow Private Vessel</option>
                    <option value="dawa-terrace">Dawa Terrace Sunset Lounge</option>
                    <option value="tamarind-restaurant">Tamarind Restaurant Main Dining Veranda</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-300 mb-1">
                    Catering & Refreshment Style
                  </label>
                  <select 
                    value={cateringStyle}
                    onChange={(e) => setCateringStyle(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-stone-700 bg-stone-900 text-white rounded-none focus:outline-none focus:border-brand-gold"
                  >
                    <option value="seafood-banquet">Fresh Seafood Banquet & Lobster Station</option>
                    <option value="swahili-bbq">Swahili Oceanfront Grill & BBQ</option>
                    <option value="plated-dinner">Multi-Course Plated Fine Dining</option>
                    <option value="cocktail-canapes">Cocktail Receptions & Canapé Trays</option>
                  </select>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-300 mb-1">
                    Contact Full Name *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Michael Omondi"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-stone-700 bg-stone-900 text-white rounded-none focus:outline-none focus:border-brand-gold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-300 mb-1">
                    Email Address *
                  </label>
                  <input 
                    type="email" 
                    required
                    placeholder="michael@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-stone-700 bg-stone-900 text-white rounded-none focus:outline-none focus:border-brand-gold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-300 mb-1">
                    Phone / WhatsApp *
                  </label>
                  <input 
                    type="tel" 
                    required
                    placeholder="+254 700 000 000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-stone-700 bg-stone-900 text-white rounded-none focus:outline-none focus:border-brand-gold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-300 mb-1">
                    Company / Organization
                  </label>
                  <input 
                    type="text" 
                    placeholder="Optional"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-stone-700 bg-stone-900 text-white rounded-none focus:outline-none focus:border-brand-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-300 mb-1">
                  Tell Us About Your Vision & Special Requirements
                </label>
                <textarea 
                  rows={3}
                  placeholder="e.g. Sunset wedding vows on the lawn followed by dhow dinner cruise, live Taarab band, specific floral theme..."
                  value={visionDetails}
                  onChange={(e) => setVisionDetails(e.target.value)}
                  className="w-full text-xs p-3.5 border border-stone-700 bg-stone-900 text-white rounded-none focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-10 py-4 bg-brand-gold hover:bg-amber-500 text-brand-dark font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 shadow-lg"
                  id="btn-submit-rfp"
                >
                  {isSubmitting ? (
                    <span>Submitting RFP...</span>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Submit Request for Proposal</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          ) : (
            <div className="p-8 text-center space-y-4">
              <div className="w-14 h-14 bg-amber-500/20 text-brand-gold rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-serif text-2xl font-bold text-white">Proposal Request Received</h4>
              <p className="text-stone-300 text-xs sm:text-sm font-light max-w-lg mx-auto leading-relaxed">
                Thank you, <strong className="text-white">{name}</strong>. Your Request for Proposal (<span className="font-mono text-brand-gold">{rfpRef}</span>) has been assigned to our Senior Events Director. We will contact you at <span className="text-white">{email}</span> within 24 hours with venue availability and a bespoke quotation.
              </p>
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="px-6 py-2.5 border border-stone-700 text-stone-300 hover:text-white hover:border-white text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
              >
                Submit Another Inquiry
              </button>
            </div>
          )}

        </div>

      </div>
    </section>
  );
}
