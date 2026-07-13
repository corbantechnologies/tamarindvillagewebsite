import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ApartmentDetail from "./components/ApartmentDetail";
import DiningDetail from "./components/DiningDetail";
import BookingModal from "./components/BookingModal";
import { useLiveRates } from "./utils/profitroom";
import { APARTMENTS, PACKAGES, DINING, FACILITIES } from "./data";
import { 
  Waves, Users, Maximize2, Coffee, Utensils, Ship, 
  MapPin, Phone, Mail, Sparkles, ArrowRight, Clock, ChevronRight,
  ShieldCheck, HelpCircle, CheckCircle2, Star, Calendar, MessageSquare,
  ChevronLeft, Image as ImageIcon, Settings, Plus, Trash2, RotateCcw, Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const { getLivePrice } = useLiveRates();
  const [activeView, setActiveView] = useState<"home" | "detail" | "dining">("home");
  const [selectedApartmentId, setSelectedApartmentId] = useState<string>("1-bedroom");
  const [selectedDiningId, setSelectedDiningId] = useState<string>("tamarind-restaurant");
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [preSelectedPkg, setPreSelectedPkg] = useState<string>("ro");

  const defaultHeroImages = [
    "https://res.cloudinary.com/dhw8kulj3/image/upload/v1782898650/village2_w4ue4b.jpg", // Pool luxury overlooking sea
    "https://res.cloudinary.com/dhw8kulj3/image/upload/v1782898655/village3_kiqnc0.jpg", // Beautiful coastal resort
    "https://res.cloudinary.com/dhw8kulj3/image/upload/v1782898868/pool_mega5r.jpg", // Coastal rooms / suites
    "https://res.cloudinary.com/dhw8kulj3/image/upload/v1782898889/v5_albvc2.jpg"  // Stunning oceanside sunset deck
  ];

  const [heroImages, setHeroImages] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("tamarind_hero_images");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load hero images from localStorage:", e);
    }
    return defaultHeroImages;
  });

  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [newUrlInput, setNewUrlInput] = useState("");
  const [pasteListInput, setPasteListInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("admin") === "true") {
        setIsAdmin(true);
      }
    } catch (e) {
      console.error("Failed to parse URL search parameters:", e);
    }
  }, []);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroImages]);

  // When opening customizer modal, pre-fill the raw list paste textarea
  const openCustomizer = () => {
    setPasteListInput(heroImages.join("\n"));
    setUrlError("");
    setIsCustomizerOpen(true);
  };

  const handleSavePasteList = () => {
    const lines = pasteListInput
      .split(/[\n,]+/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      setUrlError("Please provide at least one valid image URL link.");
      return;
    }

    const invalidLines = lines.filter(line => !line.startsWith("http://") && !line.startsWith("https://") && !line.startsWith("/"));
    if (invalidLines.length > 0) {
      setUrlError("Some URLs seem invalid. Ensure they start with https:// or http://");
      return;
    }

    setHeroImages(lines);
    localStorage.setItem("tamarind_hero_images", JSON.stringify(lines));
    setCurrentHeroIndex(0);
    setUrlError("");
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleAddSingleUrl = () => {
    if (!newUrlInput.trim()) return;
    if (!newUrlInput.startsWith("http://") && !newUrlInput.startsWith("https://") && !newUrlInput.startsWith("/")) {
      setUrlError("Invalid URL format. Ensure it starts with https:// or http://");
      return;
    }

    const updated = [...heroImages, newUrlInput.trim()];
    setHeroImages(updated);
    localStorage.setItem("tamarind_hero_images", JSON.stringify(updated));
    setPasteListInput(updated.join("\n"));
    setNewUrlInput("");
    setUrlError("");
    setCurrentHeroIndex(updated.length - 1); // switch to newly added slide!
  };

  const handleDeleteUrl = (indexToDelete: number) => {
    if (heroImages.length <= 1) {
      setUrlError("You must keep at least one background image.");
      return;
    }
    const updated = heroImages.filter((_, idx) => idx !== indexToDelete);
    setHeroImages(updated);
    localStorage.setItem("tamarind_hero_images", JSON.stringify(updated));
    setPasteListInput(updated.join("\n"));
    if (currentHeroIndex >= updated.length) {
      setCurrentHeroIndex(0);
    }
    setUrlError("");
  };

  const handleResetDefaults = () => {
    setHeroImages(defaultHeroImages);
    localStorage.setItem("tamarind_hero_images", JSON.stringify(defaultHeroImages));
    setPasteListInput(defaultHeroImages.join("\n"));
    setCurrentHeroIndex(0);
    setUrlError("");
  };

  const handleSelectDining = (id: string) => {
    setSelectedDiningId(id);
    setActiveView("dining");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  
  // Custom contact submission form state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactDept, setContactDept] = useState("village");
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);
  const [contactSubmitError, setContactSubmitError] = useState("");
  const [isContactSubmitted, setIsContactSubmitted] = useState(false);

  // FAQ interactive state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Scroll target helper
  const navigateToSection = (sectionId: string) => {
    if (activeView !== "home") {
      setActiveView("home");
      // Give React time to render home view, then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleSelectApartment = (id: string) => {
    setSelectedApartmentId(id);
    setActiveView("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenBookingWithParams = (aptId: string = "1-bedroom", pkgId: string = "ro") => {
    setSelectedApartmentId(aptId);
    setPreSelectedPkg(pkgId);
    setIsBookingOpen(true);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) {
      alert("Please fill out all fields.");
      return;
    }
    
    setIsContactSubmitting(true);
    setContactSubmitError("");

    try {
      const response = await fetch("/api/inquire", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "general",
          payload: {
            name: contactName,
            email: contactEmail,
            message: contactMessage,
            department: contactDept,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit inquiry.");
      }

      setIsContactSubmitted(true);
    } catch (err: any) {
      console.error("Error submitting general inquiry:", err);
      setContactSubmitError(err.message || "Unable to send inquiry. Please try again later.");
    } finally {
      setIsContactSubmitting(false);
    }
  };

  const activeApartment = APARTMENTS.find(a => a.id === selectedApartmentId) || APARTMENTS[0];

  const faqs = [
    {
      q: "Is Tamarind Village Mombasa suitable for self-catering?",
      a: "Yes! Every 1, 2, and 3-bedroom apartment comes with a fully equipped granite-countertop kitchen featuring modern refrigerators, ovens, microwaves, cooktops, kettle utilities, and fine cutlery. If you prefer to be pampered, you can upgrade to our Bed & Breakfast or Half Board packages."
    },
    {
      q: "How does dining work with the adjacent Tamarind Restaurant?",
      a: "Tamarind Village is physically connected to the world-famous Tamarind Mombasa Restaurant. Residents can dine at the restaurant, enjoy sundowners at the creekside Dawa Terrace, or order direct room service to be delivered straight to their apartment veranda."
    },
    {
      q: "Can I book the Tamarind Dhow cruise directly through the hotel?",
      a: "Absolutely. We offer exclusive packages (such as our Half Board Premium) that include a sunset or lunch cruise on the Tamarind Dhow. Residents also receive priority reservations for individual bookings and private charters."
    },
    {
      q: "Is there secure parking and active security?",
      a: "Yes. Tamarind Village is a highly secure, private gated compound with 24-hour manned professional security, electronic surveillance, and secure, complimentary resident and guest parking on site."
    }
  ];

  return (
    <div className="min-h-screen bg-brand-sand font-sans text-brand-dark selection:bg-brand-teal selection:text-white flex flex-col">
      
      {/* Dynamic Sticky Header */}
      <Navbar 
        onNavigate={navigateToSection}
        onOpenBooking={() => setIsBookingOpen(true)}
        activeView={activeView}
        onGoHome={() => {
          setActiveView("home");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      {/* Primary Page Content Wrapper */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {activeView === "home" ? (
            <motion.div
              key="home-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              
              {/* 1. HERO SECTION */}
              <section className="relative min-h-[85vh] flex items-center justify-center bg-brand-dark overflow-hidden" id="hero-section">
                {/* Visual Backdrop (Curated Luxury resort / pool overlooking sea with smooth fade-in) */}
                <div className="absolute inset-0 z-0">
                  <AnimatePresence mode="popLayout">
                    <motion.img 
                      key={currentHeroIndex}
                      src={heroImages[currentHeroIndex]} 
                      alt={`Tamarind Village Coastal Backdrop ${currentHeroIndex + 1}`} 
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 0.45, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 1.2, ease: "easeInOut" }}
                      className="absolute inset-0 w-full h-full object-cover filter brightness-90"
                      referrerPolicy="no-referrer"
                    />
                  </AnimatePresence>
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/60 to-transparent pointer-events-none"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/85 via-transparent to-brand-dark/25 pointer-events-none"></div>
                </div>

                {/* Left Carousel Arrow */}
                {heroImages.length > 1 && (
                  <button 
                    onClick={() => setCurrentHeroIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-black/30 hover:bg-brand-teal border border-white/10 text-white transition-all cursor-pointer rounded-none group"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                )}

                {/* Right Carousel Arrow */}
                {heroImages.length > 1 && (
                  <button 
                    onClick={() => setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-black/30 hover:bg-brand-teal border border-white/10 text-white transition-all cursor-pointer rounded-none group"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                )}

                {/* Slide indicator dots */}
                {heroImages.length > 1 && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                    {heroImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentHeroIndex(idx)}
                        className={`h-1.5 transition-all duration-300 ${currentHeroIndex === idx ? "w-8 bg-brand-gold" : "w-2 bg-white/40 hover:bg-white/70"}`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Slides Customize Button (Bottom Left Overlay) */}
                {isAdmin && (
                  <div className="absolute bottom-6 left-6 z-20 hidden sm:block">
                    <button 
                      onClick={openCustomizer}
                      className="flex items-center gap-2 px-3 py-1.5 bg-black/50 hover:bg-brand-teal text-white border border-white/10 text-[11px] font-bold uppercase tracking-wider transition-all duration-300 backdrop-blur-md hover:border-brand-teal cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 text-brand-gold" />
                      <span>Manage Slides</span>
                    </button>
                  </div>
                )}

                {/* Content Overlay */}
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-12 w-full">
                  <div className="max-w-3xl space-y-6">
                    {/* Floating Luxury Hospitality Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-teal/15 border border-brand-teal/30 text-brand-teal text-xs font-bold uppercase tracking-widest">
                      <Sparkles className="w-3.5 h-3.5 text-brand-gold animate-pulse" />
                      <span>Luxury Coastal Serviced Residences</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-white leading-tight tracking-tight">
                      Swahili Elegance.<br />
                      <span className="text-brand-teal">Creekside Serenity.</span>
                    </h1>

                    <p className="text-stone-300 text-sm sm:text-base lg:text-lg font-light leading-relaxed max-w-xl">
                      Experience the ultimate coastal home at Tamarind Village Mombasa. Our spacious 1, 2, and 3-bedroom fully serviced apartments combine Swahili-Arabic architecture with spectacular harbor views of Tudor Creek.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 pt-4">
                      <button 
                        onClick={() => navigateToSection("apartments-section")}
                        className="w-full sm:w-auto px-8 py-3.5 bg-brand-teal hover:bg-brand-teal-dark text-white font-bold rounded-none text-xs uppercase tracking-widest shadow-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer hover:scale-103"
                        id="hero-btn-explore"
                      >
                        <span>Explore Our Apartments</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      
                      <button 
                        onClick={() => setIsBookingOpen(true)}
                        className="w-full sm:w-auto px-8 py-3.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold rounded-none text-xs uppercase tracking-widest transition-all duration-300 backdrop-blur-sm cursor-pointer"
                        id="hero-btn-book"
                      >
                        Check Availability
                      </button>
                    </div>
                  </div>

                  {/* Right side floating trust badge */}
                  <div className="hidden lg:block bg-brand-dark/80 backdrop-blur-md border border-stone-800 p-6 rounded-none w-80 space-y-4 shadow-xl">
                    <div className="flex items-center gap-1.5 text-brand-gold text-xs font-bold uppercase tracking-wider">
                      <Star className="w-4 h-4 fill-brand-gold" />
                      <Star className="w-4 h-4 fill-brand-gold" />
                      <Star className="w-4 h-4 fill-brand-gold" />
                      <Star className="w-4 h-4 fill-brand-gold" />
                      <Star className="w-4 h-4 fill-brand-gold" />
                      <span className="text-white ml-2">5-Star Luxury</span>
                    </div>
                    <p className="text-stone-300 text-xs leading-relaxed font-light">
                      "An exceptional oasis in Mombasa. Combining room-service convenience from Tamarind Restaurant with the vast spatial comfort of our own high-ceiling Swahili residence."
                    </p>
                    <div className="border-t border-stone-800 pt-3 flex justify-between text-[10px] text-stone-400 font-semibold uppercase">
                      <span>Nyali Coastline</span>
                      <span>Tudor Creek View</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. CORE STRATEGY: RESIDENCES PROMISE BANNER */}
              <section className="bg-brand-teal/5 py-12 border-y border-stone-200" id="strategy-intro">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-brand-teal block mb-2">Our Core Philosophy</span>
                    <h2 className="font-serif text-2xl sm:text-3xl text-brand-dark tracking-tight leading-snug">
                      Your Luxury Home on the Mombasa Coast
                    </h2>
                  </div>
                  <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="p-4 bg-white border border-stone-200 rounded-none shadow-xs">
                      <h4 className="font-serif text-base text-brand-dark font-bold mb-1">Unmatched Space</h4>
                      <p className="text-stone-500 text-xs font-light leading-relaxed">
                        Significantly larger than standard hotel rooms. Features full living rooms, dining halls, and multi-bedroom setups.
                      </p>
                    </div>
                    <div className="p-4 bg-white border border-stone-200 rounded-none shadow-xs">
                      <h4 className="font-serif text-base text-brand-dark font-bold mb-1">Fully Serviced</h4>
                      <p className="text-stone-500 text-xs font-light leading-relaxed">
                        Enjoy daily expert housekeeping, professional laundry services, room-service dining, and 24-hour resort assistance.
                      </p>
                    </div>
                    <div className="p-4 bg-white border border-stone-200 rounded-none shadow-xs">
                      <h4 className="font-serif text-base text-brand-dark font-bold mb-1">Self-Catering Freedom</h4>
                      <p className="text-stone-500 text-xs font-light leading-relaxed">
                        Equipped with high-end full kitchens. Prepare your own meals or enjoy elite adjacent restaurants effortlessly.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 3. APARTMENTS SHOWCASE */}
              <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-12" id="apartments-section">
                <div className="text-center max-w-3xl mx-auto mb-16">
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-brand-teal/10 border border-brand-teal/25 text-brand-teal text-xs font-bold uppercase tracking-widest mb-3">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-teal" />
                    <span>Exclusive Residences</span>
                  </div>
                  <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-brand-dark tracking-tight">
                    Luxury Serviced Residences
                  </h2>
                  <p className="text-stone-500 font-light mt-4 text-sm sm:text-base leading-relaxed">
                    Designed around spacious, light-filled rooms, high arches, and authentic coastal Swahili furniture, our apartments are perfectly suited for long-term residencies or luxurious family holidays.
                  </p>
                </div>

                {/* Apartments Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {APARTMENTS.map((apt) => {
                    const { price: livePrice, isLive } = getLivePrice(apt.id, apt.pricePerNight);
                    return (
                      <div 
                        key={apt.id} 
                        className="bg-white border border-stone-200 rounded-none overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
                        id={`card-${apt.id}`}
                      >
                        {/* Image Thumbnail Container */}
                        <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
                          <img 
                            src={apt.image} 
                            alt={apt.name} 
                            className="w-full h-full object-cover transform duration-500 group-hover:scale-103"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-4 right-4 bg-brand-dark/90 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-gold">
                            {apt.viewType.split(" ")[0]} View
                          </div>
                        </div>

                        {/* Specs and details */}
                        <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                          <div>
                            <div className="flex justify-between items-start gap-4 mb-3">
                              <h3 className="font-serif text-xl text-brand-dark group-hover:text-brand-teal transition-colors">
                                {apt.name}
                              </h3>
                            </div>
                            
                            <p className="text-stone-500 text-xs font-light leading-relaxed mb-4 line-clamp-3">
                              {apt.description}
                            </p>

                            {/* Quick Specs Icons Row */}
                            <div className="grid grid-cols-3 gap-2 py-3 border-y border-stone-200 text-stone-600 font-medium">
                              <div className="flex items-center gap-1.5 justify-center">
                                <Maximize2 className="w-4 h-4 text-brand-teal" />
                                <span className="text-[11px] font-mono">{apt.size}</span>
                              </div>
                              <div className="flex items-center gap-1.5 justify-center">
                                <Users className="w-4 h-4 text-brand-teal" />
                                <span className="text-[11px] font-mono">Max {apt.maxGuests}</span>
                              </div>
                              <div className="flex items-center gap-1.5 justify-center">
                                <span className="text-[11px] font-serif font-bold text-brand-teal">{apt.bedrooms} Bed</span>
                              </div>
                            </div>

                            {/* Inclusions List */}
                            <div className="mt-4 space-y-2">
                              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1">Key Highlights:</span>
                              {apt.highlights.slice(0, 2).map((hl, idx) => (
                                <div key={idx} className="flex gap-2 items-start text-[11px] text-stone-600">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-teal flex-shrink-0 mt-0.5" />
                                  <span className="font-light">{hl}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Cost & Action footer */}
                          <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">
                                  {isLive ? "Live Rate" : "Base Rate"}
                                </span>
                                {isLive && (
                                  <span className="inline-flex items-center gap-0.5 px-1 py-0.2 text-[8px] font-bold text-white bg-emerald-600 rounded-none uppercase tracking-wider">
                                    ● Live
                                  </span>
                                )}
                              </div>
                              <p className="text-xl font-serif text-brand-dark font-extrabold">
                                ${livePrice} <span className="text-xs font-sans text-stone-500 font-light">/ night</span>
                              </p>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                              <button 
                                onClick={() => handleSelectApartment(apt.id)}
                                className="px-5 py-2.5 border border-brand-dark text-brand-dark hover:bg-stone-50 rounded-none text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer text-center"
                                id={`btn-details-${apt.id}`}
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 4. BOARDING PACKAGES SECTION */}
              <section className="py-20 bg-brand-dark text-stone-100 scroll-mt-12" id="packages-section">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="text-xs font-bold uppercase tracking-widest text-brand-gold">Boarding & Dining Upgrades</span>
                    <h2 className="font-serif text-3xl sm:text-4xl text-white tracking-tight mt-2">
                      Tailored Boarding Packages
                    </h2>
                    <p className="text-stone-400 font-light mt-3 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
                      Upgrade your apartment self-catering stay with one of our specialized board packages, linking you to the culinary brilliance of the adjacent Tamarind Restaurant.
                    </p>
                  </div>

                  {/* Packages Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {PACKAGES.map((pkg) => (
                      <div 
                        key={pkg.id}
                        className="bg-[#2D2926] border border-stone-800 rounded-none p-8 flex flex-col justify-between hover:border-brand-teal/80 transition-all duration-300 shadow-md group relative"
                        id={`package-card-${pkg.id}`}
                      >
                        {pkg.id === "hbp" && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-teal text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-none border border-brand-teal/40 shadow-sm">
                            Highly Recommended
                          </div>
                        )}
                        
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-stone-800 rounded-none text-brand-teal">
                              {pkg.id === "bb" ? <Coffee className="w-5 h-5" /> : <Utensils className="w-5 h-5" />}
                            </div>
                            <h3 className="font-serif text-lg sm:text-xl font-bold text-white group-hover:text-brand-teal transition-colors">
                              {pkg.name}
                            </h3>
                          </div>

                          <p className="text-stone-400 text-xs font-light leading-relaxed mb-6">
                            {pkg.description}
                          </p>

                          <div className="space-y-3 mb-8">
                            <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">What's Included:</span>
                            {pkg.highlights.map((highlight, idx) => (
                              <div key={idx} className="flex gap-2.5 items-start text-xs text-stone-300">
                                <CheckCircle2 className="w-4 h-4 text-brand-teal flex-shrink-0 mt-0.5" />
                                <span className="font-light leading-snug">{highlight}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-6 border-t border-stone-800/80 flex items-center justify-between">
                          <div>
                            <span className="text-[9px] text-stone-500 uppercase font-bold block">Upgrade Cost</span>
                            <span className="text-lg font-serif font-bold text-white">${pkg.pricePerPersonPerDay}</span>
                            <span className="text-[10px] text-stone-400 font-light block">/ Adult / Day</span>
                          </div>
                          
                          <button 
                            onClick={() => handleOpenBookingWithParams("1-bedroom", pkg.id)}
                            className="px-5 py-2.5 bg-brand-teal hover:bg-brand-teal-dark text-white font-bold rounded-none text-xs uppercase tracking-widest transition-colors cursor-pointer"
                            id={`btn-pkg-select-${pkg.id}`}
                          >
                            Inquire Package
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* 5. DINING ALLIANCE SECTION */}
              <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-12" id="dining-section">
                <div className="text-center max-w-3xl mx-auto mb-16">
                  <span className="text-xs font-semibold uppercase tracking-widest text-brand-teal">The Tamarind Culinary Alliance</span>
                  <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-brand-dark tracking-tight mt-2">
                    Adjacent World-Class Gastronomy
                  </h2>
                  <p className="text-stone-500 font-light mt-4 text-sm sm:text-base leading-relaxed">
                    Tamarind Village is physically linked to East Africa’s legendary seafood dining institutions. Residents receive priority reservations, creekside seating placement, and direct-to-veranda room service billing privileges.
                  </p>
                </div>

                {/* Dining Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {DINING.map((dining) => (
                    <div 
                      key={dining.id}
                      className="bg-white border border-stone-200 rounded-none overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:border-brand-teal/40"
                      onClick={() => handleSelectDining(dining.id)}
                      id={`dining-${dining.id}`}
                    >
                      <div>
                        {/* Image */}
                        <div className="relative aspect-[16/10] bg-stone-100 overflow-hidden">
                          <img 
                            src={dining.image} 
                            alt={dining.name} 
                            className="w-full h-full object-cover transform duration-500 group-hover:scale-103"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute bottom-4 left-4 bg-brand-dark/90 backdrop-blur-md px-3 py-1 text-[10px] uppercase font-mono font-bold tracking-wider text-brand-gold">
                            {dining.hours.split(" | ")[0]}
                          </div>
                        </div>

                        {/* Specs */}
                        <div className="p-6">
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="font-serif text-lg sm:text-xl font-bold text-brand-dark group-hover:text-brand-teal transition-colors">
                              {dining.name}
                            </h3>
                          </div>
                          
                          <p className="text-stone-500 text-xs font-light leading-relaxed mb-6">
                            {dining.description}
                          </p>

                          <div className="space-y-2.5">
                            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1">Cuisine Highlights:</span>
                            {dining.highlights.map((hl, idx) => (
                              <div key={idx} className="flex gap-2 items-start text-[11px] text-stone-600 font-light">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-teal mt-1.5 flex-shrink-0"></span>
                                <span>{hl}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Footer reservation placeholder */}
                      <div className="p-6 pt-0">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectDining(dining.id);
                          }}
                          className="w-full py-3 bg-brand-dark hover:bg-brand-teal text-white font-bold rounded-none text-xs uppercase tracking-widest transition-colors text-center cursor-pointer block"
                          id={`btn-dining-inquire-${dining.id}`}
                        >
                          View Details & Inquire
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 6. RESORT FACILITIES & SERVICES */}
              <section className="py-20 bg-brand-sand border-y border-stone-200 scroll-mt-12" id="facilities-section">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="text-xs font-semibold uppercase tracking-widest text-brand-teal">Bespoke Guest Comforts</span>
                    <h2 className="font-serif text-3xl sm:text-4xl text-brand-dark tracking-tight mt-1">
                      Resort Facilities & Services
                    </h2>
                    <p className="text-stone-500 font-light mt-3 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
                      Beyond your spacious private apartment, Tamarind Village Mombasa offers complete resort facilities to make your stay perfectly productive and endlessly relaxing.
                    </p>
                  </div>

                  {/* Facilities Rows */}
                  <div className="space-y-12">
                    {FACILITIES.map((facility, index) => (
                      <div 
                        key={facility.id}
                        className={`flex flex-col lg:flex-row items-stretch gap-8 bg-white border border-stone-200 rounded-none overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                          index % 2 !== 0 ? "lg:flex-row-reverse" : ""
                        }`}
                        id={`facility-${facility.id}`}
                      >
                        {/* Image side */}
                        <div className="lg:w-1/2 aspect-[16/10] lg:aspect-auto relative overflow-hidden bg-stone-200">
                          <img 
                            src={facility.image} 
                            alt={facility.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Content side */}
                        <div className="lg:w-1/2 p-8 sm:p-12 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-brand-teal block mb-2">Resort Amenity</span>
                            <h3 className="font-serif text-2xl font-semibold text-brand-dark mb-4">{facility.name}</h3>
                            <p className="text-stone-500 text-xs sm:text-sm font-light leading-relaxed mb-6">{facility.description}</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {facility.details.map((detail, idx) => (
                                <div key={idx} className="flex gap-2.5 items-start" id={`fac-detail-${facility.id}-${idx}`}>
                                  <CheckCircle2 className="w-4 h-4 text-brand-teal flex-shrink-0 mt-0.5" />
                                  <span className="text-stone-600 text-xs font-light leading-tight">{detail}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-8 pt-6 border-t border-stone-200 flex items-center justify-between">
                            <span className="text-xs font-mono text-stone-400">Serviced Daily • Exclusive for Residents</span>
                            <button 
                              onClick={() => setIsBookingOpen(true)}
                              className="px-5 py-2.5 border border-brand-dark text-brand-dark hover:bg-stone-50 font-bold rounded-none text-xs uppercase tracking-widest transition-colors cursor-pointer"
                              id={`btn-facility-inquire-${facility.id}`}
                            >
                              Inquire Info
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* 7. CUSTOM GEOGRAPHIC MAP & CONTACT SECTION */}
              <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-12" id="contact-section">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
                  
                  {/* Left: Custom Vector-CSS Map representation of Mombasa & Coordinates (7 cols) */}
                  <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-widest text-brand-teal block mb-2">Prime Harbor-Frontage</span>
                      <h3 className="font-serif text-3xl text-brand-dark tracking-tight">Our Location on Tudor Creek</h3>
                      <p className="text-stone-500 font-light mt-2 text-xs sm:text-sm leading-relaxed">
                        Tamarind Village is situated on Cement Silos Road, Nyali, directly on the cliffside shores of Tudor Creek in Mombasa, Kenya. We face the historical Old Port, overlooking Mombasa Island and Old Town.
                      </p>
                    </div>

                    {/* Highly Creative CSS Stylized Local Map Container */}
                    <div className="relative aspect-[16/10] bg-brand-dark border border-stone-800 rounded-none p-6 overflow-hidden flex flex-col justify-between shadow-inner" id="vector-map-container">
                      {/* Stylized water / land backdrop */}
                      <div className="absolute inset-0 bg-brand-dark opacity-95"></div>
                      <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[70%] rounded-full bg-stone-800/40 border border-stone-700/30 transform rotate-12"></div> {/* Tudor Creek shoreline */}
                      <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[60%] rounded-full bg-brand-teal/5 blur-3xl"></div> {/* Nyali glow */}
                      
                      {/* Grid representation */}
                      <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-5 pointer-events-none">
                        {Array.from({ length: 144 }).map((_, i) => (
                          <div key={i} className="border-t border-l border-white"></div>
                        ))}
                      </div>

                      {/* Map Markers */}
                      <div className="relative z-10 h-full flex flex-col justify-between">
                        {/* Nyali side label */}
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400 font-bold bg-[#1a1a1a]/95 border border-stone-800 px-2 py-0.5 rounded-none">
                            Nyali Mainland (Residences)
                          </span>
                          <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400 font-bold bg-[#1a1a1a]/95 border border-stone-800 px-2 py-0.5 rounded-none">
                            Tudor Creek Inlet
                          </span>
                        </div>

                        {/* Core pin representer */}
                        <div className="absolute top-[40%] left-[45%] flex flex-col items-center">
                          <div className="relative flex h-4 w-4 items-center justify-center">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-teal opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-teal"></span>
                          </div>
                          <div className="bg-brand-dark border border-brand-teal/60 text-white p-3 rounded-none mt-2 shadow-lg text-left w-56 space-y-1">
                            <p className="text-[11px] font-bold text-brand-gold uppercase tracking-widest leading-none">Tamarind Village</p>
                            <p className="text-[10px] text-stone-300 font-light">Tamarind Restaurant & Dawa Terrace Adjacent</p>
                            <p className="text-[9px] text-stone-400 font-mono italic">Cement Silos Road, Nyali Coast</p>
                          </div>
                        </div>

                        {/* Fort Jesus Marker */}
                        <div className="absolute bottom-[20%] right-[15%] flex flex-col items-center opacity-70">
                          <span className="inline-block w-2 h-2 rounded-full bg-stone-400"></span>
                          <span className="text-[9px] text-stone-400 uppercase tracking-wider mt-1 font-semibold">Fort Jesus</span>
                        </div>

                        {/* Old Town Marker */}
                        <div className="absolute bottom-[35%] left-[10%] flex flex-col items-center opacity-70">
                          <span className="inline-block w-2 h-2 rounded-full bg-stone-400"></span>
                          <span className="text-[9px] text-stone-400 uppercase tracking-wider mt-1 font-semibold">Mombasa Old Town</span>
                        </div>

                        {/* Map Footer legend */}
                        <div className="flex flex-wrap gap-2 text-[9px] font-mono text-stone-400 bg-[#1a1a1a]/95 p-2.5 rounded-none border border-stone-800">
                          <span className="text-brand-gold font-bold">Transit distances:</span>
                          <span className="border-r border-stone-800 pr-2">Moi Airport: ~30 min</span>
                          <span className="border-r border-stone-800 pr-2">SGR Mombasa Terminus: ~25 min</span>
                          <span>Nyali Bridge: ~5 min</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Interactive Contact Inquiry Form (5 cols) */}
                  <div className="lg:col-span-5 bg-white border border-stone-200 rounded-none p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-teal/5 rounded-full blur-xl"></div>
                    
                    <div className="space-y-6">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-brand-teal block mb-1">Direct Communication</span>
                        <h4 className="font-serif text-2xl text-brand-dark">Location Desk & Contact Form</h4>
                        <p className="text-stone-500 text-xs font-light leading-relaxed mt-1">
                          Have any questions about custom residencies, executive conference packages, long-term rentals, or Dhow charters? Send us a direct message.
                        </p>
                      </div>

                      {!isContactSubmitted ? (
                        <form onSubmit={handleContactSubmit} className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">Your Full Name</label>
                            <input 
                              type="text" 
                              required
                              placeholder="e.g., Jane Doe"
                              value={contactName}
                              onChange={(e) => setContactName(e.target.value)}
                              className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-none text-stone-800 focus:outline-none focus:border-brand-teal bg-stone-50"
                              id="contact-name"
                              disabled={isContactSubmitting}
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">Email Address</label>
                              <input 
                                type="email" 
                                required
                                placeholder="e.g., janedoe@example.com"
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-none text-stone-800 focus:outline-none focus:border-brand-teal bg-stone-50"
                                id="contact-email"
                                disabled={isContactSubmitting}
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">Select Department</label>
                              <select 
                                value={contactDept}
                                onChange={(e) => setContactDept(e.target.value)}
                                className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-none text-stone-800 focus:outline-none focus:border-brand-teal bg-stone-50"
                                id="contact-dept"
                                disabled={isContactSubmitting}
                              >
                                <option value="village">Tamarind Village (Apartments)</option>
                                <option value="restaurant">Tamarind Mombasa Restaurant</option>
                                <option value="dhow">Tamarind Dhow Cruise</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">Message Inquiry</label>
                            <textarea 
                              required
                              placeholder="How can our accommodation concierge or dining team assist you today?"
                              rows={4}
                              value={contactMessage}
                              onChange={(e) => setContactMessage(e.target.value)}
                              className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-none text-stone-800 focus:outline-none focus:border-brand-teal resize-none bg-stone-50"
                              id="contact-message"
                              disabled={isContactSubmitting}
                            />
                          </div>

                          {contactSubmitError && (
                            <div className="p-3 bg-red-50 text-red-700 text-xs font-medium border-l-2 border-red-600">
                              {contactSubmitError}
                            </div>
                          )}

                          <button 
                            type="submit"
                            disabled={isContactSubmitting}
                            className={`w-full py-3 bg-brand-dark hover:bg-brand-teal text-white font-bold rounded-none text-xs uppercase tracking-widest shadow-xs transition-colors cursor-pointer ${isContactSubmitting ? "opacity-75 cursor-not-allowed" : ""}`}
                            id="btn-contact-submit"
                          >
                            {isContactSubmitting ? "Sending Inquiry..." : "Send General Inquiry"}
                          </button>
                        </form>
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="py-12 text-center space-y-4 bg-brand-teal/5 border border-brand-teal/15 rounded-none"
                          id="contact-success"
                        >
                          <div className="w-12 h-12 bg-brand-teal/10 text-brand-teal rounded-none flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-serif text-lg font-bold text-brand-dark">Message Received!</p>
                            <p className="text-xs text-stone-500 mt-1 font-light max-w-xs mx-auto">
                              Thank you, <span className="font-semibold">{contactName}</span>. A Tamarind Village representative has logged your inquiry and will respond within 12 hours.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Phone/Email cards */}
                    <div className="pt-6 border-t border-stone-200 grid grid-cols-2 gap-4 text-left text-[10px] text-stone-500">
                      <div>
                        <p className="font-bold text-brand-dark uppercase">Resort Reception</p>
                        <p>+254 725 959 552</p>
                      </div>
                      <div>
                        <p className="font-bold text-brand-dark uppercase">Direct Booking</p>
                        <p className="truncate" title="reservations.village@tamarind.co.ke">reservations.village@...</p>
                        <p>Mombasa, Kenya</p>
                      </div>
                    </div>

                  </div>
                </div>
              </section>

              {/* 8. FAQ INTERACTIVE SECTION */}
              <section className="py-20 bg-brand-sand border-t border-stone-200" id="faq-section">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                  <div className="text-center mb-12">
                    <span className="text-xs font-semibold uppercase tracking-widest text-brand-teal">Frequently Asked Questions</span>
                    <h3 className="font-serif text-3xl text-brand-dark tracking-tight mt-1">Accommodations & Resort Guide</h3>
                  </div>

                  <div className="space-y-4">
                    {faqs.map((faq, index) => (
                      <div 
                        key={index}
                        className="bg-white border border-stone-200 rounded-none overflow-hidden transition-shadow duration-300"
                        id={`faq-item-${index}`}
                      >
                        <button
                          onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                          className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none cursor-pointer"
                        >
                          <span className="font-serif text-sm sm:text-base font-semibold text-brand-dark pr-4">
                            {faq.q}
                          </span>
                          <span className="text-brand-teal font-bold text-lg flex-shrink-0">
                            {openFaqIndex === index ? "−" : "+"}
                          </span>
                        </button>
                        
                        <AnimatePresence>
                          {openFaqIndex === index && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="px-6 pb-5 text-xs sm:text-sm text-stone-600 font-light leading-relaxed border-t border-stone-100 pt-3"
                            >
                              {faq.a}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

            </motion.div>
          ) : activeView === "dining" ? (
            
            /* DYNAMIC ROUTE VIEW: DINING DETAIL PAGE */
            <div key={`dining-container-${selectedDiningId}`}>
              <DiningDetail 
                dining={DINING.find(d => d.id === selectedDiningId) || DINING[0]}
                onBack={() => {
                  setActiveView("home");
                  // Scroll back to dining section
                  setTimeout(() => {
                    const element = document.getElementById("dining-section");
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth" });
                    }
                  }, 100);
                }}
                onSelectDining={handleSelectDining}
                allDinings={DINING}
              />
            </div>
          ) : (
            
            /* DYNAMIC ROUTE VIEW: APARTMENT DETAIL PAGE */
            <div key={`detail-container-${selectedApartmentId}`}>
              <ApartmentDetail 
                apartment={activeApartment}
                onBack={() => {
                  setActiveView("home");
                  // Scroll back to apartments
                  setTimeout(() => {
                    const element = document.getElementById("apartments-section");
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth" });
                    }
                  }, 100);
                }}
                onSelectApartment={handleSelectApartment}
                allApartments={APARTMENTS}
                onBookNow={(aptId, pkgId) => {
                  setSelectedApartmentId(aptId);
                  setPreSelectedPkg(pkgId);
                  setIsBookingOpen(true);
                }}
              />
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Global Booking Inquiry Modal */}
      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)}
        initialApartmentId={selectedApartmentId}
        initialPackageId={preSelectedPkg}
      />

      {/* Carousel Customizer Modal (For pasting or managing list of hero image links) */}
      <AnimatePresence>
        {isCustomizerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCustomizerOpen(false)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-2xl bg-white text-brand-dark border border-stone-200 p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col z-10"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-serif text-2xl text-brand-teal font-semibold tracking-tight">
                    Manage Hero Images
                  </h3>
                  <p className="text-stone-500 text-xs mt-1 font-light">
                    Customize your homepage header with coastal imagery. Images rotate automatically every 6 seconds.
                  </p>
                </div>
                <button 
                  onClick={() => setIsCustomizerOpen(false)}
                  className="p-1 hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                >
                  <span className="text-2xl font-light">&times;</span>
                </button>
              </div>

              {urlError && (
                <div className="mb-4 p-3 bg-red-50 border-l-2 border-red-500 text-red-700 text-xs font-medium">
                  {urlError}
                </div>
              )}

              {showSuccessToast && (
                <div className="mb-4 p-3 bg-emerald-50 border-l-2 border-emerald-500 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Successfully updated background images and saved to local storage!</span>
                </div>
              )}

              <div className="space-y-6">
                {/* Paste Raw Links Textarea */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-2">
                    Paste Image Link List (one URL per line)
                  </label>
                  <textarea
                    value={pasteListInput}
                    onChange={(e) => setPasteListInput(e.target.value)}
                    placeholder="https://images.unsplash.com/...&#10;https://another-image-link.com/..."
                    className="w-full h-32 px-3 py-2 text-xs border border-stone-300 rounded-none bg-stone-50 font-mono focus:outline-none focus:border-brand-teal leading-relaxed resize-none"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] text-stone-500">
                      Total images: <strong className="font-semibold text-brand-teal">{heroImages.length}</strong>
                    </span>
                    <button
                      onClick={handleSavePasteList}
                      className="px-4 py-1.5 bg-brand-teal hover:bg-brand-teal-dark text-white font-bold text-xs tracking-wider uppercase transition-all cursor-pointer"
                    >
                      Apply & Save List
                    </button>
                  </div>
                </div>

                {/* Decorative Divider */}
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-stone-200"></div>
                  <span className="flex-shrink mx-4 text-stone-400 text-[10px] uppercase font-bold tracking-wider">Or manage individual slides</span>
                  <div className="flex-grow border-t border-stone-200"></div>
                </div>

                {/* Individual additions & preview list review */}
                <div className="space-y-4">
                  {/* Add single link input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a single image URL starting with https://"
                      value={newUrlInput}
                      onChange={(e) => setNewUrlInput(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded-none focus:outline-none focus:border-brand-teal bg-stone-50 text-stone-800"
                    />
                    <button
                      onClick={handleAddSingleUrl}
                      className="px-4 py-2 bg-stone-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-stone-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Previews Grid with individual removal options */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-2.5">
                      Current Slides Preview
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[220px] overflow-y-auto pr-1">
                      {heroImages.map((img, index) => (
                        <div 
                          key={index} 
                          className={`relative border group aspect-video overflow-hidden ${currentHeroIndex === index ? "border-brand-gold ring-1 ring-brand-gold" : "border-stone-200"}`}
                        >
                          <img
                            src={img}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover filter brightness-95"
                            onError={(e) => {
                              // Fallback placeholder image if URL is invalid or blocked
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=120&q=40";
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 pointer-events-none">
                            <span className="text-[10px] text-white font-bold bg-black/60 px-1.5 py-0.5 rounded-sm">Slide {index + 1}</span>
                          </div>
                          
                          {/* Active indicator badge */}
                          {currentHeroIndex === index && (
                            <span className="absolute top-1 left-1 bg-brand-gold text-white text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-widest shadow-sm">
                              Active
                            </span>
                          )}

                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteUrl(index)}
                            className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors cursor-pointer"
                            title="Delete this image"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions Bottom Bar */}
                <div className="pt-4 border-t border-stone-100 flex justify-between items-center">
                  <button
                    onClick={handleResetDefaults}
                    className="flex items-center gap-1.5 text-stone-500 hover:text-brand-teal text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Defaults</span>
                  </button>

                  <button
                    onClick={() => setIsCustomizerOpen(false)}
                    className="px-6 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Luxury Footer component */}
      <Footer 
        onNavigate={navigateToSection}
        onSelectApartment={handleSelectApartment}
        onSelectDining={handleSelectDining}
        onGoHome={() => {
          setActiveView("home");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      {/* Sticky Floating WhatsApp Button */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 group"
      >
        <span className="hidden sm:inline-block bg-white text-stone-800 text-[10px] font-bold px-3 py-1.5 shadow-md border border-stone-100 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none uppercase tracking-wider font-sans">
          Chat with Us
        </span>
        <a 
          href="https://wa.me/254725959552?text=Hello%20Tamarind%20Village%20Mombasa%2C%20I%20would%20like%20to%20inquire%20about%20booking%20an%20apartment."
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all duration-300 rounded-full relative cursor-pointer"
          aria-label="Chat on WhatsApp"
        >
          {/* Subtle ping pulse */}
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30"></span>
          <MessageSquare className="w-5 h-5 relative z-10 fill-white" />
        </a>
      </motion.div>

    </div>
  );
}
