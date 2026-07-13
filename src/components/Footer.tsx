import React, { useState, useEffect } from "react";
import { MapPin, Phone, Mail, Clock, Ship, Compass, Award, MessageSquare } from "lucide-react";

interface FooterProps {
  onNavigate: (sectionId: string) => void;
  onSelectApartment: (id: string) => void;
  onGoHome: () => void;
  onSelectDining?: (id: string) => void;
}

export default function Footer({ onNavigate, onSelectApartment, onGoHome, onSelectDining }: FooterProps) {
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

  const handleSuiteClick = (id: string) => {
    onSelectApartment(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDiningClick = (id: string) => {
    if (onSelectDining) {
      onSelectDining(id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      onNavigate("dining-section");
    }
  };

  return (
    <footer className="bg-brand-dark text-stone-300 border-t border-stone-800" id="main-footer">
      {/* Upper Footer section: highlights */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-stone-800/50 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-stone-900 rounded-none text-brand-gold flex-shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-serif text-lg text-white mb-1">Prime Oceanfront Location</h4>
            <p className="text-stone-400 text-xs font-light leading-relaxed">
              Nestled right on Tudor Creek’s edge, facing Mombasa's historic Old Town. Pristine harbor and pool views.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-stone-900 rounded-none text-brand-gold flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-serif text-lg text-white mb-1">Elite Hospitality Trust</h4>
            <p className="text-stone-400 text-xs font-light leading-relaxed">
              Providing standard-setting serviced accommodation, personalized guest relations, and world-class culinary excellence.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-stone-900 rounded-none text-brand-gold flex-shrink-0">
            <Ship className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-serif text-lg text-white mb-1">Tamarind Culinary Alliance</h4>
            <p className="text-stone-400 text-xs font-light leading-relaxed">
              Direct room-service and dining accounts linked with the world-famous Tamarind Restaurant and the romantic Tamarind Dhow.
            </p>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        {/* Brand details */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onGoHome}>
            {logoSrc ? (
              <img 
                src={logoSrc} 
                alt="Tamarind Village Mombasa" 
                className="h-9 object-contain max-w-[110px]"
                referrerPolicy="no-referrer"
                onError={() => setLogoSrc(null)}
              />
            ) : (
              <div className="w-9 h-9 bg-brand-teal text-white rounded-none flex items-center justify-center font-serif text-base font-bold">
                TV
              </div>
            )}
            <div>
              <span className="font-serif text-base font-bold text-white tracking-tight block leading-none">
                TAMARIND <span className="text-brand-teal">VILLAGE</span>
              </span>
              <span className="text-[9px] text-brand-gold tracking-widest font-semibold uppercase block mt-1">
                Mombasa Coastal Apartments
              </span>
            </div>
          </div>
          
          <p className="text-stone-400 text-xs font-light leading-relaxed">
            Tamarind Village provides premium fully serviced apartments, offering luxurious coastal living with the service level of a high-end boutique resort. Designed around Swahili coastal charm.
          </p>

          <div className="pt-2">
            <span className="text-xs font-semibold text-white block uppercase tracking-wider mb-2">Our Signature:</span>
            <span className="inline-block bg-brand-teal/15 text-brand-teal border border-brand-teal/30 px-3 py-1 rounded-none text-xs font-bold uppercase tracking-wider">
              Serviced Accommodations & Apartments
            </span>
          </div>
        </div>

        {/* Accommodations focus (suites detail list) */}
        <div>
          <h5 className="text-white text-xs font-bold uppercase tracking-widest mb-6 pb-2 border-b border-stone-800">
            Residences & Apartments
          </h5>
          <ul className="space-y-3.5 text-xs font-light text-stone-400">
            <li>
              <button 
                onClick={() => handleSuiteClick("1-bedroom")}
                className="hover:text-brand-teal transition-colors cursor-pointer text-left"
              >
                1 Bedroom - Luxury Ocean Suite
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleSuiteClick("2-bedroom")}
                className="hover:text-brand-teal transition-colors cursor-pointer text-left"
              >
                2 Bedroom - Premium Coastal Residence
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleSuiteClick("3-bedroom")}
                className="hover:text-brand-teal transition-colors cursor-pointer text-left"
              >
                3 Bedroom - Duplex Penthouse
              </button>
            </li>
            <li className="pt-2">
              <span className="text-[10px] uppercase font-bold text-brand-gold block">Boarding upgrades</span>
            </li>
            <li>
              <button onClick={() => onNavigate("packages-section")} className="hover:text-brand-teal transition-colors cursor-pointer">
                Bed & Breakfast (B&B)
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate("packages-section")} className="hover:text-brand-teal transition-colors cursor-pointer">
                Coastal Half Board & Premium
              </button>
            </li>
          </ul>
        </div>

        {/* Gastronomy & Amenities links */}
        <div>
          <h5 className="text-white text-xs font-bold uppercase tracking-widest mb-6 pb-2 border-b border-stone-800">
            Tamarind Gastronomy
          </h5>
          <ul className="space-y-3.5 text-xs font-light text-stone-400">
            <li>
              <button onClick={() => handleDiningClick("tamarind-restaurant")} className="hover:text-brand-teal transition-colors cursor-pointer text-left">
                Tamarind Mombasa Restaurant
              </button>
            </li>
            <li>
              <button onClick={() => handleDiningClick("dawa-terrace")} className="hover:text-brand-teal transition-colors cursor-pointer text-left">
                The Dawa Terrace Cocktail Lounge
              </button>
            </li>
            <li>
              <button onClick={() => handleDiningClick("tamarind-dhow")} className="hover:text-brand-teal transition-colors cursor-pointer text-left">
                The Tamarind Dhow Dinner Cruise
              </button>
            </li>
            <li className="pt-2">
              <span className="text-[10px] uppercase font-bold text-brand-gold block">Resort Services</span>
            </li>
            <li>
              <button onClick={() => onNavigate("facilities-section")} className="hover:text-brand-teal transition-colors cursor-pointer text-left">
                Infinity Swimming Pools
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate("facilities-section")} className="hover:text-brand-teal transition-colors cursor-pointer text-left">
                Executive Conferences & Banquets
              </button>
            </li>
          </ul>
        </div>

        {/* Location & Contact info */}
        <div>
          <h5 className="text-white text-xs font-bold uppercase tracking-widest mb-6 pb-2 border-b border-stone-800">
            Connect & Contact
          </h5>
          <ul className="space-y-4 text-xs font-light text-stone-400">
            <li className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-brand-gold mt-0.5 flex-shrink-0" />
              <span>
                Tamarind Village, along Cement Silos Road,<br />
                P.O. Box 95805-80106,<br />
                Mombasa, Kenya
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-brand-gold flex-shrink-0" />
              <span>+254 725 959 552</span>
            </li>
            <li className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-emerald-500 flex-shrink-0 fill-emerald-500/10" />
              <a 
                href="https://wa.me/254725959552?text=Hello%20Tamarind%20Village%20Mombasa%2C%20I%20would%20like%20to%20inquire%20about%20booking%20an%20apartment."
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-teal text-emerald-500 hover:underline transition-colors font-medium flex items-center gap-1.5"
              >
                <span>WhatsApp: +254 725 959 552</span>
                <span className="text-[9px] font-sans font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 px-1.5 py-0.5 animate-pulse">Chat Live</span>
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-brand-gold mt-1 flex-shrink-0" />
              <div className="space-y-1.5 text-xs text-stone-400">
                <p><span className="text-stone-300 font-semibold block sm:inline">Tamarind Village:</span> <a href="mailto:reservations.village@tamarind.co.ke" className="hover:underline hover:text-brand-teal">reservations.village@tamarind.co.ke</a></p>
                <p><span className="text-stone-300 font-semibold block sm:inline">Tamarind Restaurant:</span> <a href="mailto:reservations.mombasa@tamarind.co.ke" className="hover:underline hover:text-brand-teal">reservations.mombasa@tamarind.co.ke</a></p>
                <p><span className="text-stone-300 font-semibold block sm:inline">Tamarind Dhow:</span> <a href="mailto:reservations.dhow@tamarind.co.ke" className="hover:underline hover:text-brand-teal">reservations.dhow@tamarind.co.ke</a></p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-brand-gold mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-stone-300">Front Desk Hours:</p>
                <p>24 Hours / 7 Days Active Service</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Lower Copyright & Booking Disclaimer */}
      <div className="bg-[#111111] border-t border-stone-800/40 py-8 text-stone-500 text-xs font-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p>© {new Date().getFullYear()} Tamarind Village Mombasa. All rights reserved.</p>
            <p className="text-[10px] text-stone-600 mt-1">
              Primary Focus: Accommodation and serviced apartments of Tamarind Group.
            </p>
          </div>
          <div className="text-center md:text-right space-y-1">
            <p>Booking engine operated on secure affiliate services.</p>
            <p className="text-[10px] text-stone-600">
              Swahili architecture & design. Built in accordance with Tamarind hospitality guidelines.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
