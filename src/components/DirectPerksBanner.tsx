import React from "react";
import { ShieldCheck, GlassWater, CalendarCheck2, Clock, Sparkles } from "lucide-react";

interface DirectPerksBannerProps {
  onOpenBooking: () => void;
  onOpenTracking?: () => void;
}

export default function DirectPerksBanner({ onOpenBooking, onOpenTracking }: DirectPerksBannerProps) {
  const perks = [
    {
      icon: ShieldCheck,
      title: "Guaranteed Best Rate",
      description: "Always obtain the most favorable direct rates, seasonal promotions, and personalized quotes without third-party commissions.",
      badge: "Best Value"
    },
    {
      icon: GlassWater,
      title: "Signature Welcome Dawa",
      description: "Complimentary handcrafted Tamarind Dawa cocktail (vodka or mocktail, fresh lime, and pure honey) on arrival at Dawa Terrace.",
      badge: "Complimentary"
    },
    {
      icon: CalendarCheck2,
      title: "Flexible Direct Policy",
      description: "Need to adjust your plans? Enjoy direct, hassle-free date modifications and transparent cancellation terms up to 48 hours before check-in.",
      badge: "Peace of Mind"
    },
    {
      icon: Clock,
      title: "Priority Check-In & Late Departure",
      description: "Direct bookers receive priority room allocation with the best views of Tudor Creek, plus complimentary early check-in or late checkout upon availability.",
      badge: "VIP Privilege"
    }
  ];

  return (
    <section className="bg-gradient-to-b from-[#181514] via-[#211c1b] to-[#181514] text-white py-12 px-4 sm:px-6 lg:px-8 border-y border-stone-800 relative overflow-hidden" id="direct-perks-section">
      {/* Subtle ambient lighting */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-stone-800/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-gold/15 border border-brand-gold/30 text-brand-gold text-[11px] font-mono uppercase tracking-widest mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Book Direct Advantages</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-white font-normal tracking-tight">
              Why Reserve Directly With <span className="text-brand-gold font-serif italic">Tamarind Mombasa</span>
            </h2>
          </div>
          <p className="text-stone-400 text-xs sm:text-sm font-light max-w-md leading-relaxed">
            Booking directly ensures personalized coastal concierge attention, transparent pricing with no hidden OTA fees, and exclusive resort privileges.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {perks.map((perk, index) => {
            const Icon = perk.icon;
            return (
              <div
                key={index}
                className="bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-brand-gold/50 p-5 rounded-none transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center text-brand-gold group-hover:scale-110 group-hover:bg-brand-gold group-hover:text-brand-dark transition-all duration-300">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-brand-gold bg-brand-gold/10 px-2 py-0.5 border border-brand-gold/20">
                      {perk.badge}
                    </span>
                  </div>
                  <h3 className="font-serif text-base sm:text-lg text-white font-medium mb-2">
                    {perk.title}
                  </h3>
                  <p className="text-stone-300 text-xs font-light leading-relaxed">
                    {perk.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action bar */}
        <div className="mt-8 pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-stone-400 text-[11px]">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Instant booking confirmation & customized proposal turnaround within 2-4 hours.</span>
          </div>
          <div className="flex items-center gap-3">
            {onOpenTracking && (
              <button
                onClick={onOpenTracking}
                className="text-stone-300 hover:text-brand-gold underline underline-offset-4 text-xs font-mono transition-colors cursor-pointer"
              >
                Already have a reservation? Track status
              </button>
            )}
            <button
              onClick={onOpenBooking}
              className="px-6 py-2.5 bg-brand-gold hover:bg-amber-500 text-brand-dark font-bold uppercase tracking-widest text-xs transition-all shadow-md cursor-pointer"
            >
              Check Availability
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
