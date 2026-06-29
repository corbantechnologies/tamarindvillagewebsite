import React, { useState } from "react";
import { ApartmentType, PackageType } from "../types";
import { PACKAGES } from "../data";
import { 
  ArrowLeft, Maximize2, Users, Bed, Bath, Eye, CheckCircle2, 
  Wifi, Wind, ChefHat, Tv, Lock, Coffee, Sparkles, Calendar, ArrowRight 
} from "lucide-react";
import { motion } from "motion/react";

interface ApartmentDetailProps {
  apartment: ApartmentType;
  onBack: () => void;
  onSelectApartment: (id: string) => void;
  allApartments: ApartmentType[];
  onBookNow: (apartmentId: string, packageId: string) => void;
}

export default function ApartmentDetail({ 
  apartment, 
  onBack, 
  onSelectApartment, 
  allApartments,
  onBookNow 
}: ApartmentDetailProps) {
  const [activeImage, setActiveImage] = useState(apartment.image);
  const [selectedPackage, setSelectedPackage] = useState<string>("bb");
  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");
  const [guestCount, setGuestCount] = useState<number>(apartment.maxGuests);
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Amenity icon mapping helper
  const getAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase();
    if (lower.includes("wi-fi") || lower.includes("internet")) return <Wifi className="w-5 h-5 text-brand-teal" />;
    if (lower.includes("conditioning") || lower.includes("air")) return <Wind className="w-5 h-5 text-brand-teal" />;
    if (lower.includes("kitchen") || lower.includes("cooking")) return <ChefHat className="w-5 h-5 text-brand-teal" />;
    if (lower.includes("tv") || lower.includes("dstv")) return <Tv className="w-5 h-5 text-brand-teal" />;
    if (lower.includes("safe") || lower.includes("electronic")) return <Lock className="w-5 h-5 text-brand-teal" />;
    if (lower.includes("coffee") || lower.includes("tea")) return <Coffee className="w-5 h-5 text-brand-teal" />;
    return <CheckCircle2 className="w-5 h-5 text-brand-teal" />;
  };

  // Cost calculation
  const calculateCost = () => {
    if (!checkIn || !checkOut) return null;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const timeDiff = end.getTime() - start.getTime();
    if (timeDiff <= 0) return null;
    
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const basePrice = apartment.pricePerNight * nights;
    
    const pkg = PACKAGES.find(p => p.id === selectedPackage);
    const packageRate = pkg ? pkg.pricePerPersonPerDay : 0;
    const packagePrice = packageRate * guestCount * nights;
    
    const subtotal = basePrice + packagePrice;
    const serviceFee = Math.round(subtotal * 0.08); // 8% resort service fee / tax
    const total = subtotal + serviceFee;
    
    return {
      nights,
      basePrice,
      packagePrice,
      serviceFee,
      total
    };
  };

  const cost = calculateCost();

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName || !inquiryEmail || !inquiryPhone) {
      alert("Please fill in all contact information.");
      return;
    }
    setIsSubmitted(true);
  };

  const handleRecommendClick = (id: string) => {
    onSelectApartment(id);
    // Reset states
    const targetApartment = allApartments.find(a => a.id === id);
    if (targetApartment) {
      setActiveImage(targetApartment.image);
      setGuestCount(targetApartment.maxGuests);
      setIsSubmitted(false);
      setCheckIn("");
      setCheckOut("");
    }
  };

  const otherApartments = allApartments.filter(a => a.id !== apartment.id);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      id={`apartment-detail-${apartment.id}`}
    >
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="group flex items-center gap-2 text-stone-600 hover:text-brand-teal font-medium mb-8 transition-colors duration-200 cursor-pointer"
        id="btn-back-to-apartments"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
        <span className="text-xs uppercase tracking-widest font-bold">Back to Tamarind Village</span>
      </button>

      {/* Main Apartment Title */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2 text-brand-teal text-xs font-bold tracking-widest uppercase">
          <Sparkles className="w-4 h-4" />
          <span>Primary Accommodation focus</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif text-brand-dark tracking-tight" id="apartment-title">
          {apartment.name}
        </h1>
        <p className="text-stone-500 mt-2 text-base sm:text-lg font-light leading-relaxed">
          Experience spacious luxury at Tudor Creek, Mombasa
        </p>
      </div>

      {/* Grid Layout: Images & Basic Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Left Side: Image Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[16/10] bg-stone-100 rounded-none overflow-hidden shadow-md group">
            <img 
              src={activeImage} 
              alt={apartment.name} 
              className="w-full h-full object-cover transform duration-500 group-hover:scale-102"
              referrerPolicy="no-referrer"
              id="main-gallery-image"
            />
            <div className="absolute top-4 left-4 bg-brand-dark/95 border border-stone-800 px-3 py-1.5 rounded-none text-[10px] font-bold uppercase tracking-widest text-brand-gold">
              {apartment.viewType}
            </div>
          </div>
          
          {/* Gallery Thumbnails */}
          <div className="grid grid-cols-3 gap-4">
            {apartment.gallery.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`relative aspect-[4/3] rounded-none overflow-hidden cursor-pointer transition-all duration-200 ${
                  activeImage === img 
                    ? "ring-2 ring-brand-teal ring-offset-2 scale-98 shadow-sm" 
                    : "opacity-75 hover:opacity-100 hover:scale-102"
                }`}
                id={`thumb-${idx}`}
              >
                <img 
                  src={img} 
                  alt={`${apartment.name} view ${idx + 1}`} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>

          {/* Detailed Description */}
          <div className="pt-6 border-t border-stone-200">
            <h3 className="text-xl font-serif text-brand-dark mb-3">About The Apartment</h3>
            <p className="text-stone-600 leading-relaxed font-light mb-6 text-xs sm:text-sm">
              {apartment.description}
            </p>
            
            <h4 className="text-lg font-serif text-brand-dark mb-3">Residence Highlights</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {apartment.highlights.map((highlight, idx) => (
                <div key={idx} className="flex gap-3 items-start bg-brand-sand/50 p-4 rounded-none border border-stone-200">
                  <div className="w-5 h-5 rounded-none bg-brand-teal text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold">
                    {idx + 1}
                  </div>
                  <p className="text-stone-700 text-xs sm:text-sm font-light leading-relaxed">{highlight}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Stay Calculator & Booking Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Apartment Specs Quick Board */}
          <div className="bg-brand-sand/40 border border-stone-200 rounded-none p-6 shadow-xs">
            <h3 className="text-lg font-serif text-brand-dark mb-4 pb-2 border-b border-stone-200">Residence Specifications</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-stone-200/60 rounded-none text-stone-700">
                  <Maximize2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Total Area</p>
                  <p className="text-xs sm:text-sm font-semibold text-stone-800">{apartment.size}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-stone-200/60 rounded-none text-stone-700">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Max Guests</p>
                  <p className="text-xs sm:text-sm font-semibold text-stone-800">{apartment.maxGuests} Adults</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-stone-200/60 rounded-none text-stone-700">
                  <Bed className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Configuration</p>
                  <p className="text-xs sm:text-sm font-semibold text-stone-800 truncate max-w-[150px]" title={apartment.bedConfig}>
                    {apartment.bedConfig.split(" ")[0]} Bed Bedding
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-stone-200/60 rounded-none text-stone-700">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Outlook</p>
                  <p className="text-xs sm:text-sm font-semibold text-stone-800">Sea & Creek</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-brand-teal/5 border border-brand-teal/15 rounded-none flex justify-between items-center">
              <div>
                <p className="text-[10px] text-brand-teal font-bold uppercase tracking-widest">Base Rate per Night</p>
                <p className="text-xs text-stone-500 font-light">Self-catering base price</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-serif text-brand-dark font-bold">${apartment.pricePerNight}</p>
                <p className="text-[10px] text-brand-teal font-bold uppercase tracking-wider">USD / room</p>
              </div>
            </div>
          </div>

          {/* Interactive Cost Calculator & Inquiry Form */}
          <div className="bg-white border border-stone-200 rounded-none shadow-sm overflow-hidden relative" id="booking-widget">
            <div className="bg-brand-dark text-white px-6 py-4">
              <h3 className="font-serif text-lg text-brand-gold font-bold uppercase tracking-wider">Secure Stay Inquiry</h3>
              <p className="text-xs text-stone-400 font-light mt-0.5">Calculate costs and send a direct booking request</p>
            </div>

            {!isSubmitted ? (
              <form onSubmit={handleInquirySubmit} className="p-6 space-y-4">
                {/* Check in & Check out */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">Check-in</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        required
                        min="2026-06-29"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-stone-300 rounded-none text-stone-800 bg-stone-50/50 focus:outline-none focus:border-brand-teal"
                        id="calc-checkin"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">Check-out</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        required
                        min={checkIn || "2026-06-29"}
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-stone-300 rounded-none text-stone-800 bg-stone-50/50 focus:outline-none focus:border-brand-teal"
                        id="calc-checkout"
                      />
                    </div>
                  </div>
                </div>

                {/* Package Option */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">Boarding Package</label>
                  <select 
                    value={selectedPackage}
                    onChange={(e) => setSelectedPackage(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-none text-stone-800 bg-stone-50/50 focus:outline-none focus:border-brand-teal"
                    id="calc-package"
                  >
                    {PACKAGES.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} (+${pkg.pricePerPersonPerDay}/person/day)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Number of Guests */}
                <div className="grid grid-cols-2 gap-3 items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-700">Number of Guests</label>
                  <div className="flex items-center border border-stone-300 rounded-none overflow-hidden bg-stone-50/50">
                    <button 
                      type="button"
                      onClick={() => setGuestCount(prev => Math.max(1, prev - 1))}
                      className="px-3 py-1.5 text-stone-600 hover:bg-stone-200 text-xs font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center text-xs font-bold text-stone-800">{guestCount}</span>
                    <button 
                      type="button"
                      onClick={() => setGuestCount(prev => Math.min(apartment.maxGuests, prev + 1))}
                      className="px-3 py-1.5 text-stone-600 hover:bg-stone-200 text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Price Summary Breakdown if dates selected */}
                {cost ? (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-4 bg-brand-sand border border-stone-200 rounded-none space-y-2 text-xs"
                    id="cost-breakdown-panel"
                  >
                    <div className="flex justify-between text-stone-600">
                      <span>Apartment Base ({cost.nights} nights x ${apartment.pricePerNight})</span>
                      <span className="font-semibold text-stone-800">${cost.basePrice}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>{PACKAGES.find(p => p.id === selectedPackage)?.name} upgrade</span>
                      <span className="font-semibold text-stone-800">${cost.packagePrice}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>Resort taxes & service fees (8%)</span>
                      <span className="font-semibold text-stone-800">${cost.serviceFee}</span>
                    </div>
                    <div className="border-t border-stone-300 pt-2 flex justify-between text-sm font-serif font-bold text-brand-dark">
                      <span>Estimated Total</span>
                      <span className="text-brand-teal">${cost.total} USD</span>
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-3 bg-brand-teal/5 border border-brand-teal/15 text-brand-dark rounded-none text-xs text-center font-light">
                    Select check-in and check-out dates to generate a real-time price estimation.
                  </div>
                )}

                {/* Guest Contact Details */}
                <div className="pt-2 space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-800 pb-1 border-b border-stone-200">Guest Contact Information</h4>
                  
                  <div>
                    <input 
                      type="text" 
                      required
                      placeholder="Your Full Name"
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-stone-300 rounded-none text-stone-800 focus:outline-none focus:border-brand-teal"
                      id="inquiry-name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="email" 
                      required
                      placeholder="Email Address"
                      value={inquiryEmail}
                      onChange={(e) => setInquiryEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-stone-300 rounded-none text-stone-800 focus:outline-none focus:border-brand-teal"
                      id="inquiry-email"
                    />
                    <input 
                      type="tel" 
                      required
                      placeholder="Phone (e.g. +254...)"
                      value={inquiryPhone}
                      onChange={(e) => setInquiryPhone(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-stone-300 rounded-none text-stone-800 focus:outline-none focus:border-brand-teal"
                      id="inquiry-phone"
                    />
                  </div>

                  <div>
                    <textarea 
                      placeholder="Special requests or dietary preferences..."
                      rows={2}
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-stone-300 rounded-none text-stone-800 focus:outline-none focus:border-brand-teal resize-none"
                      id="inquiry-notes"
                    />
                  </div>
                </div>

                {/* Submit button (Inquiry is external placeholder booking) */}
                <button 
                  type="submit"
                  className="w-full py-3 bg-brand-dark hover:bg-brand-teal text-white font-bold rounded-none text-xs transition-colors duration-200 uppercase tracking-widest shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  id="btn-submit-inquiry"
                >
                  <span>Submit Booking Inquiry</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[10px] text-stone-400 text-center font-light leading-snug">
                  *This triggers an official booking proposal. A reservation executive from Tamarind Village Mombasa will contact you via email/phone within 2 hours to confirm availability and process final billing.
                </p>
              </form>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 text-center space-y-4"
                id="inquiry-success-screen"
              >
                <div className="w-12 h-12 bg-brand-teal/10 text-brand-teal rounded-none flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-serif text-xl text-brand-dark font-bold">Inquiry Successfully Sent!</h4>
                <div className="p-4 bg-brand-sand border border-stone-200 rounded-none text-xs text-left space-y-2 text-stone-600 font-light">
                  <p><strong>Apartment:</strong> {apartment.name}</p>
                  <p><strong>Package:</strong> {PACKAGES.find(p => p.id === selectedPackage)?.name}</p>
                  <p><strong>Inquirer:</strong> {inquiryName}</p>
                  <p><strong>E-mail:</strong> {inquiryEmail}</p>
                  {cost && <p className="text-brand-teal font-medium"><strong>Estimated Cost:</strong> ${cost.total} USD</p>}
                </div>
                <p className="text-stone-500 text-xs font-light leading-relaxed">
                  A reservation staff member has been alerted. We have logged your request and sent a summary copy to <span className="font-semibold">{inquiryEmail}</span>. Thank you for choosing Tamarind Village!
                </p>
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="px-6 py-2 border border-brand-dark text-brand-dark font-bold rounded-none text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-colors cursor-pointer"
                  id="btn-new-inquiry"
                >
                  Submit Another Inquiry
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Grid Layout: Amenities & Inclusions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 pt-8 border-t border-stone-200">
        {/* Amenities Column (8 cols) */}
        <div className="lg:col-span-8">
          <h3 className="text-2xl font-serif text-brand-dark mb-6">Fully Serviced Amenities</h3>
          <p className="text-stone-500 font-light text-xs sm:text-sm mb-6 max-w-xl leading-relaxed">
            Tamarind Village specializes in fully serviced residential hospitality. Every apartment includes professional staff services and full access to our harbor-side amenities.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4">
            {apartment.amenities.map((amenity, idx) => (
              <div key={idx} className="flex gap-3 items-center" id={`amenity-item-${idx}`}>
                <div className="p-2 bg-brand-teal/5 text-brand-teal rounded-none border border-brand-teal/15 flex-shrink-0">
                  {getAmenityIcon(amenity)}
                </div>
                <span className="text-stone-700 text-xs font-light leading-tight">{amenity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Swahili Architectural Heritage Banner (4 cols) */}
        <div className="lg:col-span-4 bg-brand-dark text-stone-100 rounded-none p-6 relative overflow-hidden flex flex-col justify-between shadow-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/5 rounded-full blur-2xl"></div>
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-brand-gold">Architectural Note</span>
            <h4 className="font-serif text-lg text-stone-200 mt-2 mb-3">Traditional Swahili Carvings</h4>
            <p className="text-xs text-stone-400 font-light leading-relaxed">
              Tamarind Village features authentic coastal styling designed to pay homage to Mombasa's Swahili-Arabic seafaring heritage. Your suite is furnished with real hand-carved mahogany furniture crafted locally in coastal workshops, blending deep-wood carvings with luxurious airy linen overlays.
            </p>
          </div>
          <div className="border-t border-stone-800 pt-4 mt-6 flex justify-between items-center text-xs text-brand-gold font-bold uppercase tracking-wider">
            <span>Fully Serviced Daily</span>
            <span>Est. 1994</span>
          </div>
        </div>
      </div>

      {/* Explore Alternative Apartment Suites */}
      <div className="pt-8 border-t border-stone-200">
        <h3 className="text-2xl font-serif text-brand-dark mb-6 text-center">Compare Alternative Suite Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {otherApartments.map((apt) => (
            <div 
              key={apt.id}
              onClick={() => handleRecommendClick(apt.id)}
              className="bg-white border border-stone-200 rounded-none overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row cursor-pointer group"
              id={`recommend-${apt.id}`}
            >
              <div className="sm:w-2/5 aspect-[4/3] sm:aspect-auto relative overflow-hidden bg-stone-100">
                <img 
                  src={apt.image} 
                  alt={apt.name} 
                  className="w-full h-full object-cover transform duration-500 group-hover:scale-102"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-6 sm:w-3/5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-serif text-lg text-brand-dark group-hover:text-brand-teal transition-colors">
                      {apt.name}
                    </h4>
                  </div>
                  <p className="text-stone-500 text-xs font-light line-clamp-2 mb-4 leading-relaxed">
                    {apt.description}
                  </p>
                  <div className="flex gap-4 text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Maximize2 className="w-3.5 h-3.5 text-brand-teal" /> {apt.size}</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-brand-teal" /> Max {apt.maxGuests}</span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-stone-100/80 flex items-center justify-between">
                  <div>
                    <span className="text-stone-400 text-[9px] uppercase font-bold tracking-widest block">Base Rate</span>
                    <span className="text-brand-dark font-serif font-bold text-sm">${apt.pricePerNight} / Night</span>
                  </div>
                  <span className="text-xs text-brand-teal font-bold flex items-center gap-1 group-hover:underline uppercase tracking-wider">
                    View Details <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
