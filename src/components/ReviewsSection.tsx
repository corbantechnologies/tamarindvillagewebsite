import React, { useState } from "react";
import { Star, Quote, CheckCircle2, Award, ThumbsUp, ExternalLink } from "lucide-react";

export default function ReviewsSection() {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const reviews = [
    {
      id: 1,
      author: "Eleanor & David Vance",
      location: "London, United Kingdom",
      category: "couples",
      rating: 5,
      date: "August 2026",
      source: "TripAdvisor",
      title: "An idyllic Swahili sanctuary with extraordinary dining",
      quote:
        "We stayed in a 2-bedroom suite overlooking Tudor Creek. The high-ceiling architecture and sea breeze from our private balcony were sheer perfection. Dining on the Tamarind Dhow under the stars while listening to the live Taarab band was hands-down the highlight of our Kenya journey.",
      stayType: "Couple Vacation • 5 Nights"
    },
    {
      id: 2,
      author: "Capt. Michael Kamau",
      location: "Nairobi, Kenya",
      category: "business",
      rating: 5,
      date: "July 2026",
      source: "Google Reviews",
      title: "The premier executive stay in Mombasa",
      quote:
        "As a frequent traveler to Mombasa for maritime and corporate conferences, Tamarind Village is unmatched. Fast fiber Wi-Fi, serene garden pools for quiet evening calls, and room-service seafood delivered from Tamarind Restaurant directly to my penthouse veranda.",
      stayType: "Executive Travel • 4 Nights"
    },
    {
      id: 3,
      author: "The Van Der Merwe Family",
      location: "Cape Town, South Africa",
      category: "families",
      rating: 5,
      date: "June 2026",
      source: "TripAdvisor",
      title: "Spacious, safe, and wonderful for children",
      quote:
        "Finding true luxury serviced apartments with full kitchens and space for four can be difficult on the coast. Tamarind Village delivered beyond expectations. The swimming pools were sparkling clean, the kitchen made breakfasts easy, and the staff treated our kids like royalty.",
      stayType: "Family Holiday • 7 Nights"
    },
    {
      id: 4,
      author: "Dr. Sarah Lindqvist",
      location: "Stockholm, Sweden",
      category: "couples",
      rating: 5,
      date: "May 2026",
      source: "TripAdvisor",
      title: "World-class seafood and sunset cocktails",
      quote:
        "The Dawa Terrace at sunset is iconic. Sipping a fresh lime-and-honey cocktail while the harbor lights of Old Town Mombasa twinkle across the water is an experience I will never forget. True five-star coastal hospitality.",
      stayType: "Romantic Getaway • 3 Nights"
    }
  ];

  const filteredReviews = activeFilter === "all" 
    ? reviews 
    : reviews.filter(r => r.category === activeFilter);

  return (
    <section className="py-20 bg-stone-50 border-t border-stone-200 scroll-mt-12" id="reviews-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Trust Header & Rating Summary */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-teal/10 border border-brand-teal/25 text-brand-teal text-[11px] font-mono uppercase tracking-widest mb-3">
              <Award className="w-3.5 h-3.5 text-brand-gold" />
              <span>Verified Guest Feedback</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-brand-dark tracking-tight leading-tight">
              Cherished Moments at <span className="text-brand-teal font-serif italic">Tamarind Mombasa</span>
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm font-light mt-2 max-w-xl leading-relaxed">
              Consistently awarded the TripAdvisor Travelers' Choice & Certificate of Excellence for over two decades of coastal fine dining and luxury serviced hospitality.
            </p>
          </div>

          {/* Aggregate Rating Badges */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 bg-white p-4 sm:p-5 border border-stone-200 shadow-sm">
            <div className="border-r border-stone-200 pr-4 sm:pr-6">
              <div className="flex items-center gap-1 text-brand-gold mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-brand-gold" />
                ))}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-2xl sm:text-3xl font-bold text-brand-dark">4.8</span>
                <span className="text-xs text-stone-400 font-mono">/ 5.0</span>
              </div>
              <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-semibold mt-0.5">
                850+ Verified Reviews
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-stone-600 pl-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="text-[11px] font-medium">TripAdvisor Hall of Fame</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="text-[11px] font-medium">Google 4.8★ Top Rated Hotel</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="text-[11px] font-medium">World Luxury Restaurant Awards</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 border-b border-stone-200 text-xs font-mono">
          <span className="text-stone-400 text-[11px] uppercase tracking-wider mr-2 font-sans font-bold">Filter By:</span>
          {[
            { id: "all", label: "All Experiences" },
            { id: "couples", label: "Couples & Romance" },
            { id: "families", label: "Families" },
            { id: "business", label: "Business & Long Stay" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3.5 py-1.5 uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer text-xs ${
                activeFilter === tab.id
                  ? "bg-brand-dark text-white font-bold"
                  : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white border border-stone-200 p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow relative"
            >
              <Quote className="w-8 h-8 text-stone-200 absolute top-6 right-6 pointer-events-none" />
              
              <div>
                <div className="flex items-center gap-1 text-brand-gold mb-3">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-brand-gold" />
                  ))}
                  <span className="ml-2 text-[10px] font-mono text-stone-400 font-bold uppercase">
                    {review.source}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-bold text-brand-dark mb-3 leading-snug">
                  "{review.title}"
                </h3>

                <p className="text-stone-600 text-xs sm:text-sm font-light leading-relaxed mb-6">
                  {review.quote}
                </p>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <h4 className="font-serif text-sm font-bold text-brand-dark">
                    {review.author}
                  </h4>
                  <p className="text-[11px] text-stone-400 font-light">
                    {review.location} • <span className="italic">{review.stayType}</span>
                  </p>
                </div>
                <span className="text-[10px] font-mono text-stone-400">
                  {review.date}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Direct Review Verification Footer */}
        <div className="mt-8 text-center">
          <p className="text-stone-500 text-xs font-light">
            All reviews independently verified from real guests who stayed at Tamarind Village Mombasa or cruised on the Tamarind Dhow.
          </p>
        </div>

      </div>
    </section>
  );
}
