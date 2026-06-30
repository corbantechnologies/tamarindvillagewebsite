/**
 * Profitroom (UpperBooking) Real-time XML Data Fetcher & Parser
 * 
 * Fetches rooms and offers XML from the live Tamarind Village Profitroom system:
 * - Rooms XML: https://wis.upperbooking.com/tamarindvillage/Rooms.xml?locale=en
 * - Offers XML: https://wis.upperbooking.com/tamarindvillage/Offers.xml?locale=en
 * 
 * Includes an automatic CORS proxy fallback to ensure smooth operation in the
 * AI Studio preview environment and direct production deployments.
 */

import { useState, useEffect } from "react";

export interface LiveRoomData {
  id: string;
  name: string;
  minPrice: number;
  currency: string;
  description?: string;
}

export interface LiveOfferData {
  id: string;
  name: string;
  minPrice?: number;
  description?: string;
}

const PROFITROOM_HOTEL_ID = "tamarindvillage";

// Highly reliable free public CORS proxies to ensure client-side fetch works in the sandboxed preview iframe
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`
];

/**
 * Helper to fetch content, trying direct call first, then falling back to CORS proxies
 */
async function fetchXmlContent(url: string): Promise<string> {
  try {
    // Try direct fetch first with a short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) {
      return await response.text();
    }
    throw new Error(`Direct fetch failed with status ${response.status}`);
  } catch (directError) {
    console.warn(`Direct fetch to ${url} failed due to CORS/network. Trying CORS proxies...`, directError);
    
    // Try proxies sequentially
    for (const proxyFn of CORS_PROXIES) {
      try {
        const proxiedUrl = proxyFn(url);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(proxiedUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (response.ok) {
          const text = await response.text();
          if (text && text.trim().startsWith("<")) {
            return text;
          }
        }
      } catch (proxyError) {
        console.error("CORS proxy fetch failed:", proxyError);
      }
    }
    throw new Error("All attempts to fetch XML failed.");
  }
}

/**
 * Fetches live prices and room details from Profitroom Rooms XML
 */
export async function fetchLiveRooms(): Promise<LiveRoomData[]> {
  const url = `https://wis.upperbooking.com/${PROFITROOM_HOTEL_ID}/Rooms.xml?locale=en`;
  try {
    const xmlText = await fetchXmlContent(url);
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      throw new Error("XML parsing error");
    }
    
    const roomElements = xmlDoc.getElementsByTagName("room");
    const rooms: LiveRoomData[] = [];
    
    for (let i = 0; i < roomElements.length; i++) {
      const roomEl = roomElements[i];
      const id = roomEl.getAttribute("id") || "";
      
      const name = roomEl.querySelector("name")?.textContent || roomEl.getAttribute("name") || "Tamarind Suite";
      
      const priceText = 
        roomEl.querySelector("min_price")?.textContent || 
        roomEl.querySelector("min-price")?.textContent || 
        roomEl.querySelector("price")?.textContent || 
        roomEl.getAttribute("min_price") || 
        "0";
        
      const currency = 
        roomEl.querySelector("currency")?.textContent || 
        roomEl.getAttribute("currency") || 
        "USD";
        
      const description = roomEl.querySelector("description")?.textContent || "";
      const minPrice = parseFloat(priceText) || 0;
      
      if (id) {
        rooms.push({
          id,
          name,
          minPrice,
          currency,
          description: description || undefined
        });
      }
    }
    
    return rooms;
  } catch (error) {
    console.error("Failed to fetch or parse live rooms from Profitroom:", error);
    return [];
  }
}

/**
 * Fetches live active campaigns/offers from Profitroom Offers XML
 */
export async function fetchLiveOffers(): Promise<LiveOfferData[]> {
  const url = `https://wis.upperbooking.com/${PROFITROOM_HOTEL_ID}/Offers.xml?locale=en`;
  try {
    const xmlText = await fetchXmlContent(url);
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      throw new Error("XML parsing error");
    }
    
    const offerElements = xmlDoc.getElementsByTagName("offer");
    const offers: LiveOfferData[] = [];
    
    for (let i = 0; i < offerElements.length; i++) {
      const offerEl = offerElements[i];
      const id = offerEl.getAttribute("id") || "";
      const name = offerEl.querySelector("name")?.textContent || offerEl.getAttribute("name") || "Special Offer";
      
      const priceText = 
        offerEl.querySelector("min_price")?.textContent || 
        offerEl.querySelector("price")?.textContent || 
        offerEl.getAttribute("min_price");
        
      const description = offerEl.querySelector("description")?.textContent || "";
      const minPrice = priceText ? parseFloat(priceText) : undefined;
      
      if (id) {
        offers.push({
          id,
          name,
          minPrice,
          description: description || undefined
        });
      }
    }
    
    return offers;
  } catch (error) {
    console.error("Failed to fetch or parse live offers from Profitroom:", error);
    return [];
  }
}

// Global caching for rooms to prevent multiple triggers in different components
let cachedRooms: LiveRoomData[] | null = null;

export async function getLiveRoomsCached(): Promise<LiveRoomData[]> {
  if (cachedRooms && cachedRooms.length > 0) {
    return cachedRooms;
  }
  
  try {
    const saved = sessionStorage.getItem("profitroom_rooms_cache");
    if (saved) {
      cachedRooms = JSON.parse(saved);
      if (cachedRooms && cachedRooms.length > 0) {
        return cachedRooms;
      }
    }
  } catch (e) {
    console.error("Cache read error:", e);
  }

  const rooms = await fetchLiveRooms();
  if (rooms && rooms.length > 0) {
    cachedRooms = rooms;
    try {
      sessionStorage.setItem("profitroom_rooms_cache", JSON.stringify(rooms));
    } catch (e) {
      console.error("Cache write error:", e);
    }
  }
  return rooms || [];
}

/**
 * Custom React hook to connect any component to Profitroom's live rates.
 */
export function useLiveRates() {
  const [liveRooms, setLiveRooms] = useState<LiveRoomData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLiveRoomsCached()
      .then(rooms => {
        if (rooms && rooms.length > 0) {
          setLiveRooms(rooms);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getLivePrice = (apartmentId: string, defaultPrice: number): { price: number; isLive: boolean } => {
    if (!liveRooms || liveRooms.length === 0) {
      return { price: defaultPrice, isLive: false };
    }
    
    // Map local IDs to XML names/IDs
    const cleanId = apartmentId.toLowerCase();
    const keyword = cleanId.includes("1") || cleanId.includes("one") ? "1" : 
                    cleanId.includes("2") || cleanId.includes("two") ? "2" : "3";
                    
    const matchingRoom = liveRooms.find(r => 
      r.id.toLowerCase() === cleanId || 
      r.name.toLowerCase().includes(`${keyword} bedroom`) || 
      r.name.toLowerCase().includes(`${keyword}-bedroom`) ||
      r.name.toLowerCase().includes(`suite ${keyword}`) ||
      r.name.toLowerCase().includes(cleanId)
    );

    if (matchingRoom && matchingRoom.minPrice > 0) {
      return { price: matchingRoom.minPrice, isLive: true };
    }
    
    return { price: defaultPrice, isLive: false };
  };

  return { liveRooms, loading, getLivePrice };
}
