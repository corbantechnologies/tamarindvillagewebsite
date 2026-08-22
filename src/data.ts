/**
 * TAMARIND VILLAGE DATASET FILE
 * 
 * You can easily add, edit, or remove data here!
 * - To add a new Apartment/Suite, append to the `APARTMENTS` array.
 * - To edit Boarding Packages, edit the `PACKAGES` array.
 * - To add/edit Restaurants or dining options, edit the `DINING` array.
 * - To modify general Resort Facilities, edit the `FACILITIES` array.
 * 
 * No database required—changes made here will instantly reflect across the entire application!
 */

import { ApartmentType, PackageType, DiningExperience, FacilityType } from "./types";

export const APARTMENTS: ApartmentType[] = [
  {
    id: "1-bedroom",
    name: "Luxury 1-Bedroom Apartment",
    description: "Perfect for couples, executive business travelers, or solo adventurers looking for a serene coastal getaway. This spacious suite features an air-conditioned master bedroom with a handcrafted Swahili four-poster canopy bed, a deluxe en-suite bathroom, and an expansive living area.",
    size: "95 m²",
    maxGuests: 2,
    pricePerNight: 160,
    image: "https://res.cloudinary.com/dhw8kulj3/image/upload/v1783677149/5_mhngcs.jpg",
    gallery: [
      "https://res.cloudinary.com/dhw8kulj3/image/upload/v1783677149/5_mhngcs.jpg",
      "https://res.cloudinary.com/dhw8kulj3/image/upload/v1783677148/4_j84vps.jpg",
      "https://res.cloudinary.com/dhw8kulj3/image/upload/v1783677147/2_jkcobb.jpg"
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
    name: "2-Bedroom Apartment",
    description: "Ideal for families or friends traveling together, this exceptionally spacious residence seamlessly combines Swahili elegance with modern comfort. It features two fully air-conditioned bedrooms, a magnificent living room, a dining area, and an extra-large private balcony.",
    size: "145 m²",
    maxGuests: 4,
    pricePerNight: 240,
    image: "https://res.cloudinary.com/dhw8kulj3/image/upload/v1783683956/3_y4yy1f.jpg",
    gallery: [
      "https://res.cloudinary.com/dhw8kulj3/image/upload/v1785399444/IMG-20260728-WA0067_zddl3j.jpg",
      "https://res.cloudinary.com/dhw8kulj3/image/upload/v1785399619/IMG-20260728-WA0082_sgufrn.jpg",
      "https://res.cloudinary.com/dhw8kulj3/image/upload/v1785399453/IMG-20260728-WA0072_dyahqk.jpg"
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
    name: "3-Bedroom Apartment",
    description: "The ultimate expression of coastal luxury. This palatial apartment boasts double-height vaulted ceilings, three gorgeous bedrooms, multiple sun-drenched private balconies, and an elite dining lounge.",
    size: "220 m²",
    maxGuests: 6,
    pricePerNight: 350,
    image: "https://res.cloudinary.com/dhw8kulj3/image/upload/v1783685440/11_te7vun.jpg",
    gallery: [
      "https://res.cloudinary.com/dhw8kulj3/image/upload/v1785399398/IMG-20260728-WA0056_npidaf.jpg",
      "https://res.cloudinary.com/dhw8kulj3/image/upload/v1785399397/IMG-20260728-WA0054_yiazz1.jpg",
      "https://res.cloudinary.com/dhw8kulj3/image/upload/v1785399396/IMG-20260728-WA0053_vplcb1.jpg"
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
    pricePerPersonPerDay: 21,
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
  // {
  //   id: "hbp",
  //   name: "Seafood Half Board Premium",
  //   description: "The absolute pinnacle of luxury and coastal romance. Includes daily breakfast, and an unforgettable seafood dinner experience at the Tamarind Restaurant.",
  //   priceMarkupPercentage: 30,
  //   pricePerPersonPerDay: 95,
  //   highlights: [
  //     "Daily gourmet breakfast plus premium dinner at the Tamarind Restaurant",
  //     "A complimentary signature 'Dawa' cocktail at the Dawa Terrace every evening on arrival",
  //     "VIP dining reservations and premium creekside table placement"
  //   ]
  // }
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
    image: "https://res.cloudinary.com/dhw8kulj3/image/upload/v1785399230/PXL_20260721_145415867_zlb785.jpg",
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
    image: "https://res.cloudinary.com/dhw8kulj3/image/upload/v1785844619/PXL_20260731_125648811_cnkxww.jpg",
    reservationLinkText: "Inquire for Dawa Terrace Table"
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
    image: "https://res.cloudinary.com/dhw8kulj3/image/upload/v1782898889/v5_albvc2.jpg",
    reservationLinkText: "Inquire for Dhow Charter & Cruise"
  }
];

export const FACILITIES: FacilityType[] = [
  {
    id: "pools",
    name: "Resident Swimming Pools (Staying Guests Only)",
    description: "Exclusive to staying residents of Tamarind Village. Our harbor-front swimming pools offer a tranquil coastal sanctuary overlooking Tudor Creek, surrounded by coconut palms, tropical greenery, and comfortable loungers.",
    iconName: "Waves",
    image: "https://res.cloudinary.com/dhw8kulj3/image/upload/v1782898868/pool_mega5r.jpg",
    details: [
      "Strictly reserved for staying Tamarind Village residents & registered apartment guests",
      "Stunning oceanfront infinity-edge pool looking out towards Tudor Creek",
      "Separate shallow swimming area safely designed for children and families",
      "Complimentary sun loungers, beach towels, and poolside service for in-house residents"
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
