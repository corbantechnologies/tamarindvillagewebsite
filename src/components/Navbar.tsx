import React, { useState, useEffect } from "react";
import { Menu, X, Waves, MapPin, Phone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NavbarProps {
  onNavigate: (sectionId: string) => void;
  onOpenBooking: () => void;
  activeView: string;
  onGoHome: () => void;
}

export default function Navbar({ onNavigate, onOpenBooking, activeView, onGoHome }: NavbarProps) {
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
      <div className="bg-brand-dark text-stone-300 text-[11px] font-light py-2 px-4 sm:px-6 lg:px-8 border-b border-stone-800 flex justify-between items-center z-50 relative">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-brand-gold" />
            Tudor Creek, Nyali, Mombasa, Kenya
          </span>
          <span className="hidden sm:flex items-center gap-1">
            <Phone className="w-3 h-3 text-brand-gold" />
            +254 725 959 552
          </span>
        </div>
        <div className="flex items-center gap-3 font-medium">
          <span className="text-brand-gold">Exclusive:</span>
          <span className="text-stone-100">Fully Serviced Apartments</span>
        </div>
      </div>

      <header 
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled 
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-stone-200 py-3" 
            : "bg-white border-b border-stone-200 py-4"
        }`}
        id="main-header"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div 
              onClick={onGoHome}
              className="flex items-center gap-3 cursor-pointer group"
              id="brand-logo"
            >
              {logoSrc ? (
                <img 
                  src={logoSrc} 
                  alt="Tamarind Village Mombasa" 
                  className="h-10 object-contain max-w-[120px]"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoSrc(null)}
                />
              ) : (
                <div className="w-10 h-10 bg-brand-dark text-white rounded-none flex items-center justify-center font-serif text-lg font-bold group-hover:bg-brand-teal transition-colors duration-300">
                  TV
                </div>
              )}
              <div>
                <span className="font-serif text-xl font-bold tracking-tight text-[#1A1A1A] block leading-none">
                  TAMARIND <span className="text-brand-teal">VILLAGE</span>
                </span>
                <span className="text-[10px] tracking-[0.2em] uppercase opacity-60 font-semibold block mt-1">
                  Mombasa Coastal Apartments
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8" id="desktop-nav">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleLinkClick(item.href)}
                  className="text-[#2D2926] hover:text-brand-teal text-xs font-bold tracking-widest uppercase transition-colors duration-200 cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* CTAs */}
            <div className="hidden lg:flex items-center gap-4">
              <button
                onClick={onOpenBooking}
                className="bg-brand-dark text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-brand-teal transition-all shadow-sm cursor-pointer duration-250"
                id="navbar-btn-book"
              >
                Check Availability
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex lg:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-none text-[#2D2926] hover:text-brand-teal hover:bg-stone-50 focus:outline-none cursor-pointer"
                aria-expanded="false"
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
              <div className="px-4 pt-2 pb-6 space-y-3">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleLinkClick(item.href)}
                    className="block w-full text-left px-3 py-2 text-[#2D2926] hover:text-brand-teal hover:bg-stone-50 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="pt-4 border-t border-stone-200 px-3">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onOpenBooking();
                    }}
                    className="w-full py-3 bg-brand-dark hover:bg-brand-teal text-white font-bold text-xs tracking-widest uppercase transition-all cursor-pointer"
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
