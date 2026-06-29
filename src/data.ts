import { ApartmentType, PackageType, DiningExperience, FacilityType } from "./types";

export const APARTMENTS: ApartmentType[] = [
  {
    id: "1-bedroom",
    name: "Luxury 1-Bedroom Ocean Suite",
    description: "Perfect for couples, executive business travelers, or solo adventurers looking for a serene coastal getaway. This spacious suite features an air-conditioned master bedroom with a handcrafted Swahili four-poster canopy bed, a deluxe en-suite bathroom, and an expansive living area.",
    size: "95 m²",
    maxGuests: 2,
    pricePerNight: 160,
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80"
    ],
    amenities: [
      "High-speed Wi-Fi",
      "Air conditioning",
      "Fully equipped granite-top kitchen",
      "Private sea-facing veranda",
      "Flat-screen TV with DSTV channels",
      "Electronic room safe",
      "Daily housekeeping & turndown",
      "Premium bath amenities & robes",
      "Coffee & tea making facilities"
    ],
    bedrooms: 1,
    bathrooms: 1,
    highlights: [
      "Handcrafted Swahili woodwork and arabesque detailing",
      "Sweeping views of Tudor Creek and Mombasa harbor",
      "Private veranda ideal for breakfast and evening sunsets",
      "Fully self-catering capable with modern premium appliances"
    ],
    bedConfig: "1 King-sized Swahili Canopy Bed",
    viewType: "Direct Tudor Creek & Sea View"
  },
  {
    id: "2-bedroom",
    name: "Premium 2-Bedroom Coastal Residence",
    description: "Ideal for families or friends traveling together, this exceptionally spacious residence seamlessly combines Swahili elegance with modern comfort. It features two fully air-conditioned bedrooms, a magnificent living room, a dining area, and an extra-large private balcony.",
    size: "145 m²",
    maxGuests: 4,
    pricePerNight: 240,
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80"
    ],
    amenities: [
      "High-speed Wi-Fi",
      "Individual climate control in both bedrooms",
      "Full modern kitchen with laundry facilities",
      "Double-width oceanfront veranda",
      "Multiple flat-screen TVs with premium DSTV",
      "Personal safety deposit box",
      "Daily housekeeping & room service",
      "Separate living and dining areas",
      "Luxury cotton bathrobes & slippers"
    ],
    bedrooms: 2,
    bathrooms: 2,
    highlights: [
      "Perfect for families; child-friendly, secure layout",
      "Direct views overlooking the sparkling resort pools and the creek",
      "Gourmet kitchen complete with full-sized refrigerator, oven, and washer",
      "Master en-suite bathroom with custom glass shower and Swahili vanity"
    ],
    bedConfig: "1 King Bed & 2 Twin Beds (can be merged)",
    viewType: "Resort Pool & Harbor View"
  },
  {
    id: "3-bedroom",
    name: "Grand 3-Bedroom Duplex Penthouse",
    description: "The ultimate expression of coastal luxury. Spanning two floors, this palatial duplex penthouse boasts double-height vaulted ceilings, three gorgeous en-suite bedrooms, multiple sun-drenched private balconies, and an elite Swahili-inspired rooftop dining lounge.",
    size: "220 m²",
    maxGuests: 6,
    pricePerNight: 350,
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
    ],
    amenities: [
      "High-speed Wi-Fi",
      "Full house air-conditioning with individual zones",
      "Ultra-modern kitchen with premium culinary wear",
      "Rooftop sun terrace & private dining area",
      "Smart TVs with premium DSTV & streaming capabilities",
      "In-suite laundry (washing machine & dryer)",
      "Dedicated concierge service",
      "Luxury bathtubs & rainfall showers",
      "Complimentary airport transfers"
    ],
    bedrooms: 3,
    bathrooms: 3.5,
    highlights: [
      "Spectacular 270-degree panoramic views of Mombasa Old Town and Tudor Creek",
      "Bespoke multilevel architecture featuring rich mahogany spiral stairs",
      "Exclusive private rooftop terrace with loungers and outdoor dining table",
      "Dedicated chef available upon request for private dining events"
    ],
    bedConfig: "2 King Beds & 2 Twin Beds",
    viewType: "360° Creek, Ocean & Old Town Panoramic View"
  }
];

export const PACKAGES: PackageType[] = [
  {
    id: "ro",
    name: "Room Only (Self-Catering)",
    description: "Enjoy full flexibility during your stay with our room-only self-catering option. Savor the independence of cooking in your granite-top kitchen or dining à la carte.",
    priceMarkupPercentage: 0,
    pricePerPersonPerDay: 0,
    highlights: [
      "Access to fully equipped kitchen with premium appliances in your suite",
      "Full flexibility to cook or dine à la carte at the resort's restaurants",
      "Daily housekeeping, turndown service, and pool/gym access included"
    ]
  },
  {
    id: "bb",
    name: "Bed & Breakfast",
    description: "Start each day of your stay with a fresh coastal breeze and a magnificent breakfast served poolside or right in the comfort of your apartment.",
    priceMarkupPercentage: 0,
    pricePerPersonPerDay: 18,
    highlights: [
      "Freshly squeezed Mombasa tropical juices & seasonal fruits",
      "Eggs cooked to order, Swahili 'mahri' pastries, and local pancakes",
      "Freshly brewed premium Kenyan coffee or famous spiced coastal tea",
      "Served at our poolside deck overlooking Tudor Creek"
    ]
  },
  {
    id: "hb",
    name: "Coastal Half Board",
    description: "Savor a remarkable culinary journey. This package includes our gourmet breakfast daily, plus your choice of a magnificent 3-course lunch OR dinner.",
    priceMarkupPercentage: 15,
    pricePerPersonPerDay: 50,
    highlights: [
      "Includes daily gourmet breakfast",
      "Choice of fine lunch or dinner from the à la carte menu at the Tamarind Restaurant",
      "Access to daily catch-of-the-day specials and legendary Swahili coconut curries",
      "Includes water, fresh juices, and soft drinks with meals"
    ]
  },
  {
    id: "hbp",
    name: "Half Board Premium & Dhow Cruise",
    description: "The absolute pinnacle of luxury and coastal romance. Includes daily breakfast, gourmet dinners, and an unforgettable evening cruising Tudor Creek aboard the Tamarind Dhow.",
    priceMarkupPercentage: 30,
    pricePerPersonPerDay: 95,
    highlights: [
      "Daily gourmet breakfast plus premium dinner at the Tamarind Restaurant",
      "One (1) complimentary Sunset Seafood Dinner Cruise on the legendary floating Tamarind Dhow",
      "A complimentary signature 'Dawa' cocktail at the Dawa Terrace every evening on arrival",
      "VIP dining reservations and premium creekside table placement"
    ]
  }
];

export const DINING: DiningExperience[] = [
  {
    id: "tamarind-restaurant",
    name: "Tamarind Mombasa Restaurant",
    description: "Widely acclaimed as the finest seafood restaurant in East Africa. Built in elegant Moorish style overlooking the picturesque Tudor Creek, the restaurant features high-arched windows, high ceilings, and a massive copper-domed bar. We serve fresh, marine catches brought in daily by local fishermen, prepared with traditional Swahili seasonings and classic French culinary mastery.",
    highlights: [
      "Famous Jumbo Seafood Platter (lobster, crab, prawns, oysters, and local fish)",
      "Traditional Swahili Fish in rich coconut sauce (Samaki wa Kupaka)",
      "Live piano accompaniment and ambient coastal acoustics",
      "Premium selection of international wines curated by our resident sommelier"
    ],
    hours: "12:00 PM – 11:00 PM Daily",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    reservationLinkText: "Inquire for Restaurant Table"
  },
  {
    id: "dawa-terrace",
    name: "The Dawa Terrace",
    description: "Named after Kenya's legendary 'Dawa' (meaning 'medicine') cocktail muddled with fresh lime and honey. This stylish open-air terrace bar extends right over the gentle waters of the creek. It features plush comfortable seating, soft ambient lighting, and is the premier sunset cocktail lounge on Mombasa's coast.",
    highlights: [
      "The Original 'Dawa' cocktail made with local vodka, fresh lime, and organic honey",
      "Delicious tapas, coastal snacks, and wood-fired flatbreads",
      "Laid-back deep house and coastal chill music played by live DJs on weekends",
      "Breathtaking night views of the lit-up old town of Mombasa across the bay"
    ],
    hours: "4:00 PM – Midnight Daily",
    image: "https://images.unsplash.com/photo-1574096079513-d8259312b785?auto=format&fit=crop&w=800&q=80",
    reservationLinkText: "Inquire for Dawa Lounge Table"
  },
  {
    id: "tamarind-dhow",
    name: "The Tamarind Dhow Cruise",
    description: "An unforgettable, magical dining voyage. Climb aboard the 'Nawalikoni' or 'Babulkher'—two majestic, traditionally hand-crafted wooden Swahili sailing dhows, beautifully converted into luxurious floating restaurants. Under the sails, you will cruise past Mombasa's historical Fort Jesus and Mombasa Old Harbor while enjoying a freshly grilled multi-course seafood meal prepared on traditional charcoal grills.",
    highlights: [
      "4-Course candlelit seafood feast cooked fresh on board over charcoal braziers",
      "Romantic cruise on Tudor Creek, Mombasa Harbor, and around Fort Jesus",
      "Live Swahili, Afro-fusion, and jazz band playing dance-worthy tunes on board",
      "The perfect setting for anniversaries, proposals, or unforgettable group celebrations"
    ],
    hours: "Lunch Cruise: 1:00 PM – 3:00 PM | Dinner Cruise: 6:30 PM – 10:30 PM",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80",
    reservationLinkText: "Inquire for Dhow Charter & Cruise"
  }
];

export const FACILITIES: FacilityType[] = [
  {
    id: "pools",
    name: "Creekside Infinity & Leisure Pools",
    description: "Our harbor-front swimming pools offer a spectacular sanctuary from the tropical warmth of Mombasa. Perfectly positioned on the cliff edge of Tudor Creek, these fresh-water pools are surrounded by tall coconut palms, tropical greenery, and comfortable loungers.",
    iconName: "Waves",
    image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80",
    details: [
      "Stunning oceanfront infinity-edge pool looking out towards the creek and boat channels",
      "Separate shallow swimming area safely designed for children and families",
      "Poolside snack and cocktail service available throughout the day",
      "Complimentary sun loungers, beach towels, and cozy sun shades for all residents"
    ]
  },
  {
    id: "conferences",
    name: "Coastal Executive Conferences & Banquets",
    description: "Combine productivity with coastal tranquility. Tamarind Village offers an air-conditioned conference venue tailored for executive retreats, boardroom meetings, team building, and social celebrations. Supported by state-of-the-art tech and world-class food.",
    iconName: "Users",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
    details: [
      "Versatile meeting space accommodating up to 80 guests in multiple layout formats",
      "Professional audio-visual systems, including high-lumens projector and sound layout",
      "Gourmet coffee break menus and full luncheon options from Tamarind Restaurant",
      "High-speed fiber-optic wireless internet connectivity",
      "Dedicated events manager to oversee every technical and service detail"
    ]
  }
];
