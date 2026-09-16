import React from "react";
import { Calendar, ShieldCheck } from "lucide-react";

interface MobileBookingBarProps {
  onOpenBooking: () => void;
  startingPrice?: number;
}

export default function MobileBookingBar({ onOpenBooking, startingPrice = 160 }: MobileBookingBarProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-300 px-4 py-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-700 font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3 h-3" />
          <span>Direct Guarantee</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-[11px] text-stone-500 font-light">From</span>
          <span className="font-serif text-lg font-bold text-brand-dark">${startingPrice}</span>
          <span className="text-[10px] text-stone-400 font-mono">/ night</span>
        </div>
      </div>

      <button
        onClick={onOpenBooking}
        className="flex-1 max-w-[200px] py-2.5 px-4 bg-brand-teal hover:bg-brand-teal-dark active:scale-98 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        id="mobile-sticky-booking-btn"
      >
        <Calendar className="w-3.5 h-3.5" />
        <span>Check Rates</span>
      </button>
    </div>
  );
}
