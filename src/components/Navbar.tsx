import React, { useState, useEffect } from "react";
import { Menu, X, Waves, MapPin, Phone, Car } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NavbarProps {
  onNavigate: (sectionId: string) => void;
  onOpenBooking: () => void;
  onOpenTransferModal: () => void;
  activeView: string;
  onGoHome: () => void;
}

export default function Navbar({ onNavigate, onOpenBooking, onOpenTransferModal, activeView, onGoHome }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [logoSrc, setLogoSrc] = useState<string | null>(null);

  // Auto-detect logo files
  useEffect(() => {
    const paths = ["/assets/logo.png", "/assets/logo.svg", "/logo.png", "/logo.svg"];
    let currentIdx = 0;

    const checkNextPath = () => {
      if (currentIdx >= paths.length) {
        return;
      }
      const img = new Image();
      img.onload = () => {
        setLogoSrc(paths[currentIdx]);
      };
      img.onerror = () => {
        currentIdx++;
        checkNextPath();
      };
      img.src = paths[currentIdx];
    };

    checkNextPath();
  }, []);

  // Monitor scrolling to add background blur/shadow
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuItems = [
    { label: "Apartments", href: "apartments-section" },
    { label: "Packages", href: "packages-section" },
    { label: "Dining", href: "dining-section" },
    { label: "Facilities", href: "facilities-section" },
    { label: "Location", href: "contact-section" },
  ];

  const handleLinkClick = (href: string) => {
    setIsOpen(false);
    onNavigate(href);
  };

  return (
    <>
      {/* Top micro bar for high-end feel */}
      <div className="bg-brand-dark text-stone-300 text-[11px] font-light py-1.5 px-4 sm:px-6 lg:px-8 border-b border-stone-800 flex justify-between items-center z-50 relative overflow-hidden">
        <div className="flex items-center gap-4 min-w-0">
          <span className="hidden sm:flex items-center gap-1.5 truncate">
            <MapPin className="w-3 h-3 text-brand-gold flex-shrink-0" />
            <span className="truncate">Tudor Creek, Nyali, Mombasa, Kenya</span>
          </span>
          <span className="flex sm:hidden items-center gap-1.5 truncate">
            <MapPin className="w-3 h-3 text-brand-gold flex-shrink-0" />
            <span>Mombasa, Kenya</span>
          </span>
          <span className="hidden md:flex items-center gap-1.5 flex-shrink-0">
            <Phone className="w-3 h-3 text-brand-gold flex-shrink-0" />
            <span>+254 725 959 552</span>
          </span>
        </div>
        <div className="flex items-center gap-3 font-medium text-[11px] flex-shrink-0">
          <button 
            onClick={onOpenTransferModal}
            className="text-brand-gold hover:text-white transition-colors flex items-center gap-1 font-bold whitespace-nowrap cursor-pointer"
            id="navbar-top-btn-transfers"
          >
            <Car className="w-3 h-3 text-brand-gold flex-shrink-0" />
            <span>Airport & SGR Transfers</span>
          </button>
          <span className="hidden md:inline text-stone-600">|</span>
          <span className="hidden md:inline text-stone-300">Fully Serviced Apartments</span>
        </div>
      </div>

      <header 
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled 
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-stone-200 py-2.5" 
            : "bg-white border-b border-stone-200 py-3.5"
        }`}
        id="main-header"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div 
              onClick={onGoHome}
              className="flex items-center gap-2.5 cursor-pointer group flex-shrink-0 max-w-[260px] sm:max-w-none"
              id="brand-logo"
            >
              {logoSrc ? (
                <img 
                  src={logoSrc} 
                  alt="Tamarind Village Mombasa" 
                  className="h-8 sm:h-9 max-w-[42px] w-auto object-contain flex-shrink-0"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoSrc(null)}
                />
              ) : (
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-brand-dark text-white rounded-none flex items-center justify-center font-serif text-sm sm:text-base font-bold group-hover:bg-brand-teal transition-colors duration-300 flex-shrink-0">
                  TV
                </div>
              )}
              <div className="flex-shrink-0">
                <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#1A1A1A] block leading-none whitespace-nowrap">
                  TAMARIND <span className="text-brand-teal">VILLAGE</span>
                </span>
                <span className="text-[9px] sm:text-[10px] tracking-[0.18em] uppercase opacity-60 font-semibold block mt-0.5 whitespace-nowrap">
                  Mombasa Coastal Apartments
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-5 xl:gap-8 flex-nowrap" id="desktop-nav">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleLinkClick(item.href)}
                  className="text-[#2D2926] hover:text-brand-teal text-xs font-bold tracking-wider xl:tracking-widest uppercase transition-colors duration-200 cursor-pointer whitespace-nowrap px-1 py-1"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* CTAs */}
            <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
              <button
                onClick={onOpenBooking}
                className="bg-brand-dark text-white px-5 py-2.5 xl:px-6 xl:py-3 text-xs font-bold uppercase tracking-wider xl:tracking-widest hover:bg-brand-teal transition-all shadow-sm cursor-pointer whitespace-nowrap"
                id="navbar-btn-book"
              >
                Check Availability
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex lg:hidden flex-shrink-0">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-none text-[#2D2926] hover:text-brand-teal hover:bg-stone-50 focus:outline-none cursor-pointer"
                aria-expanded={isOpen}
                id="btn-mobile-menu"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden border-t border-stone-200 bg-white shadow-inner overflow-hidden"
              id="mobile-nav-panel"
            >
              <div className="px-4 pt-3 pb-6 space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleLinkClick(item.href)}
                    className="block w-full text-left px-3 py-2.5 text-[#2D2926] hover:text-brand-teal hover:bg-stone-50 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="pt-4 border-t border-stone-200 px-3 space-y-2">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onOpenTransferModal();
                    }}
                    className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Car className="w-3.5 h-3.5 text-brand-gold" />
                    <span>Airport & SGR Transfers</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onOpenBooking();
                    }}
                    className="w-full py-3 bg-brand-dark hover:bg-brand-teal text-white font-bold text-xs tracking-widest uppercase transition-all cursor-pointer shadow-sm"
                    id="mobile-btn-book"
                  >
                    Check Availability
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}