import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Check, Plus, Trash2, RotateCcw, Sliders, Hotel, Utensils, 
  Mail, FileText, Calendar, DollarSign, TrendingUp, Percent, 
  ShieldAlert, CheckCircle, Clock, ArrowRight, Search, Filter, 
  Edit3, Eye, CheckSquare, Sparkles, RefreshCw, Car, Heart, Image as ImageIcon
} from "lucide-react";
import { ApartmentType, DiningExperience } from "../types";
import { 
  TransferVehicle, 
  EventPackage, 
  loadTransferVehicles, 
  saveTransferVehicles, 
  loadEventPackages, 
  saveEventPackages 
} from "../utils/extrasStore";

const DEFAULT_BOARDING_PACKAGES = [
  {
    id: "self_catering",
    name: "Self Catering",
    slogan: "Prepare your own Swahili feasts using local Mombasa ingredients",
    rateUsd: 0,
    features: ["Fully Equipped Modern Kitchen", "Pre-stocked Pantry Option", "Grocery Delivery Available"]
  },
  {
    id: "bed_breakfast",
    name: "Bed & Breakfast",
    slogan: "Start each coastal morning with a delicious gourmet breakfast at the restaurant",
    rateUsd: 15,
    features: ["Full Tamarind Breakfast", "Fresh Kenyan Coffee & Juices", "Oceanfront Seating Included"]
  },
  {
    id: "half_board",
    name: "Half Board",
    slogan: "Indulge in both premium breakfast and your choice of lunch or sunset dinner daily",
    rateUsd: 45,
    features: ["Full Breakfast Included", "Multi-Course Seafood Dinner / Lunch", "Non-Alcoholic Dawa Cocktail"]
  },
  {
    id: "full_board",
    name: "Full Board (VVIP Culinary)",
    slogan: "Ultimate luxury dining package featuring breakfast, lunch, and spectacular seafood dinner daily",
    rateUsd: 75,
    features: ["All Daily Meals", "A La Carte Dining at Tamarind Restaurant", "Signature Tamarind Dhow Seafood Platter", "Priority Seating & Butler Assistance"]
  }
];

interface InquiryData {
  id: string;
  type: "general" | "apartment" | "dining";
  payload: {
    name: string;
    email: string;
    phone: string;
    apartmentName?: string;
    diningName?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    packageId?: string;
    requests?: string;
    totalCost?: number;
    message?: string;
    subject?: string;
  };
  status: "Pending" | "Reviewed" | "Contacted" | "Approved" | "Cancelled";
  createdAt: string;
}

interface PricingRules {
  markupMultiplier: number;
  taxRate: number;
  seasonalFactor: "regular" | "peak" | "low";
}

interface StaffDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApartmentsUpdated?: (apts: ApartmentType[]) => void;
  onDiningUpdated?: (dins: DiningExperience[]) => void;
  onPricingUpdated?: (pricing: PricingRules) => void;
  onVehiclesUpdated?: (vehicles: TransferVehicle[]) => void;
  heroImages: string[];
  onSaveHeroImages: (images: string[]) => void;
  onResetHeroImages: () => void;
}

export default function StaffDashboardModal({
  isOpen,
  onClose,
  onApartmentsUpdated,
  onDiningUpdated,
  onPricingUpdated,
  onVehiclesUpdated,
  heroImages,
  onSaveHeroImages,
  onResetHeroImages
}: StaffDashboardModalProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"inquiries" | "apartments" | "pricing" | "dining" | "transfers" | "hero">("inquiries");
  
  // Data State loaded from APIs
  const [inquiries, setInquiries] = useState<InquiryData[]>([]);
  const [apartments, setApartments] = useState<ApartmentType[]>([]);
  const [dining, setDining] = useState<DiningExperience[]>([]);
  const [pricing, setPricing] = useState<PricingRules>({
    markupMultiplier: 1.0,
    taxRate: 8,
    seasonalFactor: "regular"
  });

  // Loading and feedback states
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [dbWarning, setDbWarning] = useState<string | null>(null);
  
  // Searching & Filtering inquiries
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryData | null>(null);

  // Editing forms state
  const [editingApartment, setEditingApartment] = useState<ApartmentType | null>(null);
  const [editingDining, setEditingDining] = useState<DiningExperience | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<TransferVehicle | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventPackage | null>(null);
  const [boardingPackages, setBoardingPackages] = useState<any[]>([]);
  const [editingBoarding, setEditingBoarding] = useState<any | null>(null);
  const [extrasSubTab, setExtrasSubTab] = useState<"transfers" | "events" | "boarding">("transfers");
  
  // Transfers/events customizer states (retained and fully integrated)
  const [vehicles, setVehicles] = useState<TransferVehicle[]>([]);
  const [events, setEvents] = useState<EventPackage[]>([]);
  const [pasteHeroInput, setPasteHeroInput] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch all staff dashboard content on open
  const loadAllDashboardData = async () => {
    setLoading(true);
    setDbWarning(null);
    console.log("🔍 [StaffDashboard] Opening staff dashboard, loading all live database data...");
    try {
      let activeDbError: string | null = null;

      // 1. Fetch Inquiries
      console.log("🔍 [StaffDashboard] Fetching inquiries from /api/inquiries...");
      const inquiriesRes = await fetch("/api/inquiries");
      console.log("🔍 [StaffDashboard] Inquiries response status:", inquiriesRes.status);
      if (inquiriesRes.ok) {
        const data = await inquiriesRes.json();
        console.log("🔍 [StaffDashboard] Parsed inquiries count:", data.inquiries?.length, data.inquiries);
        setInquiries(data.inquiries || []);
        if (data.database_error) {
          activeDbError = data.database_error;
        }
      } else {
        console.error("❌ [StaffDashboard] Failed to fetch inquiries, status:", inquiriesRes.status);
      }

      // 2. Fetch Apartments
      console.log("🔍 [StaffDashboard] Fetching apartments from /api/apartments...");
      const aptsRes = await fetch("/api/apartments");
      console.log("🔍 [StaffDashboard] Apartments response status:", aptsRes.status);
      if (aptsRes.ok) {
        const data = await aptsRes.json();
        console.log("🔍 [StaffDashboard] Parsed apartments count:", data.apartments?.length, data.apartments);
        setApartments(data.apartments || []);
        if (data.database_error) {
          activeDbError = data.database_error;
        }
      } else {
        console.error("❌ [StaffDashboard] Failed to fetch apartments, status:", aptsRes.status);
      }

      // 3. Fetch Dining Options
      console.log("🔍 [StaffDashboard] Fetching dining options from /api/dining...");
      const diningRes = await fetch("/api/dining");
      console.log("🔍 [StaffDashboard] Dining response status:", diningRes.status);
      if (diningRes.ok) {
        const data = await diningRes.json();
        console.log("🔍 [StaffDashboard] Parsed dining count:", data.dining?.length, data.dining);
        setDining(data.dining || []);
        if (data.database_error) {
          activeDbError = data.database_error;
        }
      } else {
        console.error("❌ [StaffDashboard] Failed to fetch dining options, status:", diningRes.status);
      }

      // 4. Fetch Pricing rules
      console.log("🔍 [StaffDashboard] Fetching pricing rules from /api/pricing...");
      const pricingRes = await fetch("/api/pricing");
      console.log("🔍 [StaffDashboard] Pricing response status:", pricingRes.status);
      if (pricingRes.ok) {
        const data = await pricingRes.json();
        console.log("🔍 [StaffDashboard] Parsed pricing rules:", data.pricing);
        setPricing(data.pricing || { markupMultiplier: 1.0, taxRate: 8, seasonalFactor: "regular" });
        if (data.database_error) {
          activeDbError = data.database_error;
        }
      } else {
        console.error("❌ [StaffDashboard] Failed to fetch pricing rules, status:", pricingRes.status);
      }

      if (activeDbError) {
        setDbWarning(activeDbError);
      }

      // 5. Fetch Global Settings
      console.log("🔍 [StaffDashboard] Fetching dynamic global settings from /api/settings...");
      try {
        const settingsRes = await fetch("/api/settings");
        if (settingsRes.ok) {
          const sData = await settingsRes.json();
          if (sData.transfer_vehicles) setVehicles(sData.transfer_vehicles);
          else setVehicles(loadTransferVehicles());

          if (sData.event_packages) setEvents(sData.event_packages);
          else setEvents(loadEventPackages());

          if (sData.boarding_packages) setBoardingPackages(sData.boarding_packages);
          else setBoardingPackages(DEFAULT_BOARDING_PACKAGES);
        } else {
          setVehicles(loadTransferVehicles());
          setEvents(loadEventPackages());
          setBoardingPackages(DEFAULT_BOARDING_PACKAGES);
        }
      } catch (settingsErr) {
        console.warn("Could not load dynamic settings from API, using local fallbacks:", settingsErr);
        setVehicles(loadTransferVehicles());
        setEvents(loadEventPackages());
        setBoardingPackages(DEFAULT_BOARDING_PACKAGES);
      }

      setPasteHeroInput(heroImages.join("\n"));
      console.log("🔍 [StaffDashboard] Local and cloud resources loaded successfully.");
    } catch (err) {
      console.error("❌ [StaffDashboard] Failed to load dashboard data:", err);
      showToast("Warning: Some dashboard features could not load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAllDashboardData();
    }
  }, [isOpen]);

  // --- INQUIRY ACTIONS ---
  const handleUpdateInquiryStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/inquiries/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        const data = await response.json();
        // Update local state
        setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status: data.inquiry.status } : inq));
        if (selectedInquiry && selectedInquiry.id === id) {
          setSelectedInquiry(prev => prev ? { ...prev, status: data.inquiry.status as any } : null);
        }
        showToast(`Inquiry marked as ${newStatus}`);
      } else {
        throw new Error("Failed to update status");
      }
    } catch (err) {
      alert("Could not update inquiry status. Try again.");
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inquiry permanently?")) return;
    try {
      const response = await fetch(`/api/inquiries/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setInquiries(prev => prev.filter(inq => inq.id !== id));
        if (selectedInquiry && selectedInquiry.id === id) {
          setSelectedInquiry(null);
        }
        showToast("Inquiry deleted from database");
      }
    } catch (err) {
      alert("Could not delete inquiry. Try again.");
    }
  };

  // --- APARTMENT ACTIONS ---
  const handleStartEditApartment = (apt: ApartmentType) => {
    setEditingApartment({ ...apt });
  };

  const handleSaveApartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApartment) return;

    setSubmitting(true);
    let updatedApts;
    if (apartments.some(a => a.id === editingApartment.id)) {
      updatedApts = apartments.map(a => a.id === editingApartment.id ? editingApartment : a);
    } else {
      updatedApts = [...apartments, editingApartment];
    }
    try {
      const response = await fetch("/api/apartments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apartments: updatedApts })
      });

      if (response.ok) {
        const data = await response.json();
        setApartments(data.apartments);
        if (onApartmentsUpdated) onApartmentsUpdated(data.apartments);
        setEditingApartment(null);
        showToast(`${editingApartment.name} saved successfully!`);
      } else {
        throw new Error("Server error saving apartments");
      }
    } catch (err) {
      alert("Could not save apartment details. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteApartment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this apartment suite permanently?")) return;
    try {
      const response = await fetch(`/api/apartments/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        const filtered = apartments.filter(a => a.id !== id);
        setApartments(filtered);
        if (onApartmentsUpdated) onApartmentsUpdated(filtered);
        showToast("Apartment suite deleted from database");
      } else {
        throw new Error("Failed to delete from database");
      }
    } catch (err) {
      alert("Could not delete apartment. Try again.");
    }
  };

  // --- PRICING ACTIONS ---
  const handleSavePricingRules = async (rules: Partial<PricingRules>) => {
    const updatedPricing = { ...pricing, ...rules };
    setSubmitting(true);
    try {
      const response = await fetch("/api/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pricing: updatedPricing })
      });

      if (response.ok) {
        const data = await response.json();
        setPricing(data.pricing);
        if (onPricingUpdated) onPricingUpdated(data.pricing);
        showToast("Pricing rules saved and applied!");
      }
    } catch (err) {
      alert("Could not update pricing guidelines. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- DINING EXPERIENCE ACTIONS ---
  const handleStartEditDining = (d: DiningExperience) => {
    setEditingDining({ ...d });
  };

  const handleSaveDining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDining) return;

    setSubmitting(true);
    let updatedDins;
    if (dining.some(d => d.id === editingDining.id)) {
      updatedDins = dining.map(d => d.id === editingDining.id ? editingDining : d);
    } else {
      updatedDins = [...dining, editingDining];
    }
    try {
      const response = await fetch("/api/dining", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dining: updatedDins })
      });

      if (response.ok) {
        const data = await response.json();
        setDining(data.dining);
        if (onDiningUpdated) onDiningUpdated(data.dining);
        setEditingDining(null);
        showToast(`${editingDining.name} saved successfully!`);
      } else {
        throw new Error("Server error saving dining options");
      }
    } catch (err) {
      alert("Could not save dining details. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDining = async (id: string) => {
    if (!confirm("Are you sure you want to delete this dining experience permanently?")) return;
    try {
      const response = await fetch(`/api/dining/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        const filtered = dining.filter(d => d.id !== id);
        setDining(filtered);
        if (onDiningUpdated) onDiningUpdated(filtered);
        showToast("Dining experience deleted from database");
      } else {
        throw new Error("Failed to delete from database");
      }
    } catch (err) {
      alert("Could not delete dining experience. Try again.");
    }
  };

  // --- VEHICLE ACTIONS ---
  const handleSaveVehiclesList = async (updated: TransferVehicle[]) => {
    setVehicles(updated);
    saveTransferVehicles(updated);
    if (onVehiclesUpdated) onVehiclesUpdated(updated);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "transfer_vehicles", value: updated })
      });
      showToast("Transfer fleet updated successfully!");
    } catch (err) {
      console.error("Failed to save transfers to database:", err);
      showToast("Transfer fleet updated locally.");
    }
  };

  // --- EVENTS ACTIONS ---
  const handleSaveEventsList = async (updated: EventPackage[]) => {
    setEvents(updated);
    saveEventPackages(updated);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "event_packages", value: updated })
      });
      showToast("Event packages updated successfully!");
    } catch (err) {
      console.error("Failed to save event packages to database:", err);
      showToast("Event packages updated locally.");
    }
  };

  // --- BOARDING PACKAGES ACTIONS ---
  const handleSaveBoardingList = async (updated: any[]) => {
    setBoardingPackages(updated);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "boarding_packages", value: updated })
      });
      showToast("Boarding packages updated successfully!");
    } catch (err) {
      console.error("Failed to save boarding packages to database:", err);
      showToast("Boarding packages updated locally.");
    }
  };

  // --- HERO SLIDESHOW ACTIONS ---
  const handleSaveHeroSlider = () => {
    const lines = pasteHeroInput
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.startsWith("http"));
    
    if (lines.length === 0) {
      alert("Please provide at least one valid image URL starting with http/https.");
      return;
    }
    onSaveHeroImages(lines);
    showToast("Hero slider slideshow updated!");
  };

  // Filter inquiries logic
  const filteredInquiries = inquiries.filter(inq => {
    const textMatch = searchQuery === "" || 
      inq.payload.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.payload.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.payload.phone.includes(searchQuery) ||
      (inq.payload.apartmentName && inq.payload.apartmentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inq.payload.diningName && inq.payload.diningName.toLowerCase().includes(searchQuery.toLowerCase()));

    const statusMatch = statusFilter === "all" || inq.status.toLowerCase() === statusFilter.toLowerCase();
    const typeMatch = typeFilter === "all" || inq.type.toLowerCase() === typeFilter.toLowerCase();

    return textMatch && statusMatch && typeMatch;
  });

  // Calculations for Inquiry Statistics
  const getInquiryStats = () => {
    const total = inquiries.length;
    const pending = inquiries.filter(i => i.status === "Pending").length;
    const contacted = inquiries.filter(i => i.status === "Contacted" || i.status === "Reviewed" || i.status === "Approved").length;
    
    // Calculate total pipeline value (USD estimates)
    let totalEstValue = 0;
    inquiries.forEach(inq => {
      if (inq.payload.totalCost) {
        totalEstValue += Number(inq.payload.totalCost);
      } else {
        totalEstValue += 160; // Default flat estimate for general or dining leads
      }
    });

    return {
      total,
      pending,
      contacted,
      contactRate: total > 0 ? Math.round((contacted / total) * 100) : 0,
      estValue: totalEstValue
    };
  };

  const stats = getInquiryStats();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/85 backdrop-blur-md p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 15 }}
          className="relative w-full max-w-7xl h-[90vh] bg-stone-50 border border-stone-200 shadow-2xl flex flex-col overflow-hidden rounded-none"
        >
          {/* TOAST NOTIFICATION */}
          {toast && (
            <div className="absolute top-4 right-4 z-50 bg-stone-900 text-brand-teal px-4 py-3 border-l-4 border-brand-teal flex items-center gap-2 shadow-lg">
              <CheckCircle className="w-5 h-5 text-brand-teal" />
              <span className="text-xs font-bold uppercase tracking-wider">{toast}</span>
            </div>
          )}

          {/* PORTAL HEADER */}
          <div className="bg-brand-dark text-white border-b border-brand-gold/20 px-8 py-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-gold/10 border border-brand-gold/30">
                <Sliders className="w-6 h-6 text-brand-gold" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold tracking-widest text-brand-gold uppercase">Tamarind Staff Management Portal</h2>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">Live Controller & Administrative Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {loading && <RefreshCw className="w-4 h-4 text-brand-teal animate-spin" />}
              <button
                onClick={loadAllDashboardData}
                className="text-xs text-stone-400 hover:text-white border border-stone-700 hover:border-stone-500 px-3 py-1.5 font-bold uppercase tracking-wider transition-colors cursor-pointer"
                title="Refresh Live Data"
              >
                Sync Data
              </button>
              <button
                onClick={onClose}
                className="p-1.5 border border-stone-800 hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* MAIN BODY GRID */}
          <div className="flex flex-1 overflow-hidden min-h-0">
            
            {/* PORTAL SIDEBAR */}
            <div className="w-64 bg-stone-900 text-stone-400 border-r border-stone-800 flex flex-col shrink-0 justify-between py-6">
              <nav className="space-y-1.5 px-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-600 px-3 mb-3">Core Modules</div>
                
                <button
                  onClick={() => { setActiveTab("inquiries"); setSelectedInquiry(null); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    activeTab === "inquiries"
                      ? "bg-brand-teal text-brand-dark font-black"
                      : "hover:bg-stone-800 hover:text-white"
                  }`}
                >
                  <Mail className="w-4.5 h-4.5" />
                  <span>Guest Inquiries</span>
                  {stats.pending > 0 && (
                    <span className="ml-auto bg-brand-gold text-brand-dark text-[9px] px-1.5 py-0.5 font-bold rounded-full">
                      {stats.pending}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("apartments")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    activeTab === "apartments"
                      ? "bg-brand-teal text-brand-dark font-black"
                      : "hover:bg-stone-800 hover:text-white"
                  }`}
                >
                  <Hotel className="w-4.5 h-4.5" />
                  <span>Apartment Editor</span>
                </button>

                <button
                  onClick={() => setActiveTab("pricing")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    activeTab === "pricing"
                      ? "bg-brand-teal text-brand-dark font-black"
                      : "hover:bg-stone-800 hover:text-white"
                  }`}
                >
                  <DollarSign className="w-4.5 h-4.5" />
                  <span>Pricing & Rates</span>
                </button>

                <button
                  onClick={() => setActiveTab("dining")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    activeTab === "dining"
                      ? "bg-brand-teal text-brand-dark font-black"
                      : "hover:bg-stone-800 hover:text-white"
                  }`}
                >
                  <Utensils className="w-4.5 h-4.5" />
                  <span>Dining experiences</span>
                </button>

                <div className="h-px bg-stone-800 my-4 mx-3" />
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-600 px-3 mb-2">Resort Extras</div>

                <button
                  onClick={() => setActiveTab("transfers")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    activeTab === "transfers"
                      ? "bg-brand-teal text-brand-dark font-black"
                      : "hover:bg-stone-800 hover:text-white"
                  }`}
                >
                  <Car className="w-4.5 h-4.5" />
                  <span>Transfer Fleet</span>
                </button>

                <button
                  onClick={() => setActiveTab("hero")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    activeTab === "hero"
                      ? "bg-brand-teal text-brand-dark font-black"
                      : "hover:bg-stone-800 hover:text-white"
                  }`}
                >
                  <ImageIcon className="w-4.5 h-4.5" />
                  <span>Hero Slideshow</span>
                </button>
              </nav>

              {/* SECURITY SIGNATURE */}
              <div className="px-6 text-[10px] text-stone-600 space-y-1">
                <div className="flex items-center gap-1.5 text-brand-gold/70 font-bold uppercase tracking-widest">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>SECURE CHANNEL</span>
                </div>
                <p>Tamarind Staff Gateways strictly logged & monitored.</p>
              </div>
            </div>

            {/* TAB CONTENT SPACE */}
            <div className="flex-1 flex flex-col overflow-y-auto p-8 bg-stone-50">
              
              {dbWarning && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3 rounded-none">
                  <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 font-serif">Offline Fallback Engaged</h4>
                    <p className="text-[11px] mt-1 text-stone-700 leading-relaxed font-bold uppercase tracking-wide">
                      Warning: A connection to the live database could not be established ({dbWarning}). 
                      The portal is currently operating in a secure, zero-overhead offline-first fallback mode. All details are preserved locally.
                    </p>
                  </div>
                </div>
              )}
              
              {/* --- TAB 1: GUEST INQUIRIES & BOOKINGS --- */}
              {activeTab === "inquiries" && (
                <div className="space-y-6 flex-1 flex flex-col">
                  
                  {/* INQUIRIES STATS COUNTER */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 border border-stone-200 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Pipeline Total Leads</p>
                        <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1">{stats.total}</h3>
                      </div>
                      <div className="p-3 bg-stone-100 text-stone-600 border border-stone-200">
                        <FileText className="w-5 h-5" />
                      </div>
                    </div>
                    
                    <div className="bg-white p-5 border border-stone-200 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-brand-teal">Pending Review</p>
                        <h3 className="font-serif text-2xl font-bold text-brand-teal mt-1">{stats.pending}</h3>
                      </div>
                      <div className="p-3 bg-brand-teal/10 text-brand-teal border border-brand-teal/20">
                        <Clock className="w-5 h-5 animate-pulse" />
                      </div>
                    </div>

                    <div className="bg-white p-5 border border-stone-200 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-brand-gold">Review Conversion</p>
                        <h3 className="font-serif text-2xl font-bold text-brand-gold mt-1">{stats.contactRate}%</h3>
                      </div>
                      <div className="p-3 bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="bg-white p-5 border border-stone-200 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Est. Pipeline Value</p>
                        <h3 className="font-serif text-2xl font-bold text-emerald-800 mt-1">${stats.estValue.toLocaleString()}</h3>
                      </div>
                      <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <DollarSign className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* FILTERS AND SEARCH SECTION */}
                  <div className="bg-white p-4 border border-stone-200 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex flex-1 min-w-[280px] items-center gap-2 bg-stone-50 border border-stone-300 px-3 py-2">
                      <Search className="w-4 h-4 text-stone-400" />
                      <input
                        type="text"
                        placeholder="Search by guest name, email, phone or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-xs text-stone-800 bg-transparent focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <div className="flex items-center gap-1 bg-stone-50 border border-stone-300 px-3 py-1.5 text-xs text-stone-600">
                        <Filter className="w-3.5 h-3.5 text-stone-400" />
                        <span className="font-bold uppercase tracking-wider text-[9px]">Type:</span>
                        <select
                          value={typeFilter}
                          onChange={(e) => setTypeFilter(e.target.value)}
                          className="bg-transparent font-medium focus:outline-none text-stone-800 ml-1 cursor-pointer"
                        >
                          <option value="all">All Types</option>
                          <option value="apartment">Stay Inquiries</option>
                          <option value="dining">Dining Bookings</option>
                          <option value="general">General Contact</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1 bg-stone-50 border border-stone-300 px-3 py-1.5 text-xs text-stone-600">
                        <CheckSquare className="w-3.5 h-3.5 text-stone-400" />
                        <span className="font-bold uppercase tracking-wider text-[9px]">Status:</span>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="bg-transparent font-medium focus:outline-none text-stone-800 ml-1 cursor-pointer"
                        >
                          <option value="all">All Statuses</option>
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="contacted">Contacted</option>
                          <option value="approved">Approved</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* MASTER-DETAIL INQUIRIES INTERFACE */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start flex-1 min-h-0">
                    
                    {/* INQUIRIES LIST TABLE */}
                    <div className="lg:col-span-2 bg-white border border-stone-200 overflow-x-auto max-h-[500px]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-stone-100 border-b border-stone-200 font-bold uppercase tracking-wider text-stone-600">
                            <th className="p-3.5">Guest & Source</th>
                            <th className="p-3.5">Inquiry Target</th>
                            <th className="p-3.5 text-right">Value Estimate</th>
                            <th className="p-3.5 text-center">Status</th>
                            <th className="p-3.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {filteredInquiries.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-stone-400 font-medium">
                                No guest inquiries match your selection filters.
                              </td>
                            </tr>
                          ) : (
                            filteredInquiries.map(inq => {
                              const getStatusStyles = (status: string) => {
                                switch (status.toLowerCase()) {
                                  case "pending":
                                    return "bg-amber-100 text-amber-800 border-amber-200";
                                  case "reviewed":
                                    return "bg-blue-100 text-blue-800 border-blue-200";
                                  case "contacted":
                                    return "bg-indigo-100 text-indigo-800 border-indigo-200";
                                  case "approved":
                                    return "bg-emerald-100 text-emerald-800 border-emerald-200";
                                  default:
                                    return "bg-stone-100 text-stone-800 border-stone-200";
                                }
                              };

                              return (
                                <tr 
                                  key={inq.id}
                                  onClick={() => setSelectedInquiry(inq)}
                                  className={`hover:bg-stone-50 cursor-pointer transition-colors ${
                                    selectedInquiry?.id === inq.id ? "bg-brand-teal/5 border-l-4 border-l-brand-teal" : ""
                                  }`}
                                >
                                  <td className="p-3.5">
                                    <p className="font-bold text-stone-900">{inq.payload.name}</p>
                                    <p className="text-[10px] text-stone-500">{inq.payload.email} • {inq.payload.phone}</p>
                                  </td>
                                  <td className="p-3.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-[8px] px-1.5 py-0.5 font-bold uppercase border ${
                                        inq.type === "apartment" ? "bg-brand-teal/10 text-brand-teal border-brand-teal/20" :
                                        inq.type === "dining" ? "bg-brand-gold/10 text-brand-gold border-brand-gold/20" :
                                        "bg-stone-100 text-stone-700 border-stone-300"
                                      }`}>
                                        {inq.type}
                                      </span>
                                      <span className="font-medium text-stone-700">
                                        {inq.payload.apartmentName || inq.payload.diningName || "General Contact"}
                                      </span>
                                    </div>
                                    <p className="text-[9px] text-stone-400 mt-0.5">{new Date(inq.createdAt).toLocaleString()}</p>
                                  </td>
                                  <td className="p-3.5 text-right font-semibold text-stone-800">
                                    ${inq.payload.totalCost ? Number(inq.payload.totalCost).toLocaleString() : "160"}
                                  </td>
                                  <td className="p-3.5 text-center">
                                    <span className={`text-[9px] px-2 py-0.5 font-bold uppercase rounded-full border ${getStatusStyles(inq.status)}`}>
                                      {inq.status}
                                    </span>
                                  </td>
                                  <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button 
                                        onClick={() => handleUpdateInquiryStatus(inq.id, "Contacted")}
                                        className="p-1 text-stone-500 hover:text-brand-teal hover:bg-stone-100 transition-all cursor-pointer"
                                        title="Mark as Contacted"
                                      >
                                        <CheckSquare className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteInquiry(inq.id)}
                                        className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                                        title="Delete Inquiry"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* DETAILED INQUIRY PANEL VIEW */}
                    <div className="bg-white border border-stone-200 p-6 space-y-5">
                      <h4 className="font-serif text-sm font-bold text-stone-900 border-b border-stone-100 pb-3 uppercase tracking-wider">
                        Inquiry Details Console
                      </h4>
                      
                      {selectedInquiry ? (
                        <div className="space-y-4 text-xs">
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Guest Contact Info</span>
                            <p className="font-serif text-sm font-bold text-stone-900">{selectedInquiry.payload.name}</p>
                            <p className="text-stone-700">{selectedInquiry.payload.email}</p>
                            <p className="text-stone-700">{selectedInquiry.payload.phone}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-3.5 bg-stone-50 p-3 border border-stone-150">
                            <div>
                              <span className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Stay Check-In</span>
                              <p className="font-bold text-stone-800 mt-0.5">{selectedInquiry.payload.checkIn || "Flexible"}</p>
                            </div>
                            <div>
                              <span className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Stay Check-Out</span>
                              <p className="font-bold text-stone-800 mt-0.5">{selectedInquiry.payload.checkOut || "Flexible"}</p>
                            </div>
                            <div>
                              <span className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Total Guests</span>
                              <p className="font-bold text-stone-800 mt-0.5">{selectedInquiry.payload.guests || "—"}</p>
                            </div>
                            <div>
                              <span className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Estimated Value</span>
                              <p className="font-bold text-brand-teal mt-0.5">
                                ${selectedInquiry.payload.totalCost ? Number(selectedInquiry.payload.totalCost).toLocaleString() : "160.00"}
                              </p>
                            </div>
                          </div>

                          {selectedInquiry.payload.requests && (
                            <div className="space-y-1">
                              <span className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Special requests / Message</span>
                              <div className="bg-stone-50 p-2.5 border border-stone-200 text-stone-700 max-h-[110px] overflow-y-auto leading-relaxed italic">
                                "{selectedInquiry.payload.requests}"
                              </div>
                            </div>
                          )}

                          {selectedInquiry.payload.message && (
                            <div className="space-y-1">
                              <span className="text-[8px] font-bold uppercase tracking-widest text-stone-400">General Message</span>
                              <div className="bg-stone-50 p-2.5 border border-stone-200 text-stone-700 max-h-[110px] overflow-y-auto leading-relaxed">
                                "{selectedInquiry.payload.message}"
                              </div>
                            </div>
                          )}

                          <div className="space-y-2 border-t border-stone-100 pt-3">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-stone-400 block mb-1">Set Operations Status</span>
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                onClick={() => handleUpdateInquiryStatus(selectedInquiry.id, "Reviewed")}
                                className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold uppercase tracking-wider text-[9px] py-1.5 transition-colors cursor-pointer"
                              >
                                Reviewed
                              </button>
                              <button
                                onClick={() => handleUpdateInquiryStatus(selectedInquiry.id, "Contacted")}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 font-bold uppercase tracking-wider text-[9px] py-1.5 transition-colors cursor-pointer"
                              >
                                Contacted
                              </button>
                              <button
                                onClick={() => handleUpdateInquiryStatus(selectedInquiry.id, "Approved")}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 font-bold uppercase tracking-wider text-[9px] py-1.5 transition-colors cursor-pointer"
                              >
                                Approve stay
                              </button>
                              <button
                                onClick={() => handleUpdateInquiryStatus(selectedInquiry.id, "Cancelled")}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 font-bold uppercase tracking-wider text-[9px] py-1.5 transition-colors cursor-pointer"
                              >
                                Cancel stay
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-[250px] flex items-center justify-center border border-dashed border-stone-200 text-stone-400 font-medium text-center p-4">
                          Select any guest inquiry row from the table to inspect requests and trigger workflow actions.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* --- TAB 2: APARTMENTS EDITOR --- */}
              {activeTab === "apartments" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-stone-900 uppercase tracking-wider">Apartments & Suites Editor</h3>
                      <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mt-0.5">Customize texts, capacities, base pricing, and presentation images</p>
                    </div>
                    {!editingApartment && (
                      <button
                        onClick={() => {
                          setEditingApartment({
                            id: "apt_" + Date.now(),
                            name: "",
                            description: "",
                            size: "85 m²",
                            maxGuests: 4,
                            pricePerNight: 200,
                            image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
                            gallery: [],
                            amenities: ["Air Conditioning", "WiFi", "Minibar", "Ocean View", "En-suite Bathroom"],
                            bedrooms: 2,
                            bathrooms: 2,
                            highlights: ["Direct Ocean Access", "Private Terrace"],
                            bedConfig: "1 King Bed, 2 Single Beds",
                            viewType: "Ocean & Horizon View",
                          });
                        }}
                        className="px-4 py-2 bg-brand-teal hover:bg-brand-teal/80 text-brand-dark font-black uppercase tracking-wider text-[10px] flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add New Suite</span>
                      </button>
                    )}
                  </div>

                  {editingApartment ? (
                    <form onSubmit={handleSaveApartment} className="bg-white p-6 border border-stone-200 space-y-4 max-w-3xl">
                      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                        <span className="font-bold text-stone-700 uppercase tracking-widest text-[10px] flex items-center gap-1">
                          <Edit3 className="w-4 h-4 text-brand-teal" /> Editing {editingApartment.name || "New Suite"}
                        </span>
                        <button 
                          type="button" 
                          onClick={() => setEditingApartment(null)}
                          className="text-stone-400 hover:text-stone-700 font-bold text-xs uppercase cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Apartment Category Name</label>
                          <input
                            type="text"
                            required
                            value={editingApartment.name}
                            onChange={(e) => setEditingApartment({ ...editingApartment, name: e.target.value })}
                            className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                          />
                        </div>

                        <div>
                          <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Base Price Per Night ($ USD)</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={editingApartment.pricePerNight}
                            onChange={(e) => setEditingApartment({ ...editingApartment, pricePerNight: Number(e.target.value) })}
                            className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Description</label>
                          <textarea
                            required
                            rows={3}
                            value={editingApartment.description}
                            onChange={(e) => setEditingApartment({ ...editingApartment, description: e.target.value })}
                            className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal leading-relaxed"
                          />
                        </div>

                        <div>
                          <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Suite Size (e.g. 95 m²)</label>
                          <input
                            type="text"
                            required
                            value={editingApartment.size}
                            onChange={(e) => setEditingApartment({ ...editingApartment, size: e.target.value })}
                            className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                          />
                        </div>

                        <div>
                          <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Maximum Guest Capacity</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={editingApartment.maxGuests}
                            onChange={(e) => setEditingApartment({ ...editingApartment, maxGuests: Number(e.target.value) })}
                            className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                          />
                        </div>

                        <div>
                          <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Bedrooms</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={editingApartment.bedrooms ?? 1}
                            onChange={(e) => setEditingApartment({ ...editingApartment, bedrooms: Number(e.target.value) })}
                            className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                          />
                        </div>

                        <div>
                          <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Bathrooms</label>
                          <input
                            type="number"
                            required
                            min="1"
                            step="0.5"
                            value={editingApartment.bathrooms ?? 1}
                            onChange={(e) => setEditingApartment({ ...editingApartment, bathrooms: Number(e.target.value) })}
                            className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                          />
                        </div>

                        <div>
                          <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Bed Configuration</label>
                          <input
                            type="text"
                            required
                            value={editingApartment.bedConfig}
                            onChange={(e) => setEditingApartment({ ...editingApartment, bedConfig: e.target.value })}
                            className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                          />
                        </div>

                        <div>
                          <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">View Type</label>
                          <input
                            type="text"
                            required
                            value={editingApartment.viewType}
                            onChange={(e) => setEditingApartment({ ...editingApartment, viewType: e.target.value })}
                            className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Featured Photo Link</label>
                          <input
                            type="url"
                            required
                            value={editingApartment.image}
                            onChange={(e) => setEditingApartment({ ...editingApartment, image: e.target.value })}
                            className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Amenities (Comma-separated)</label>
                          <input
                            type="text"
                            value={(editingApartment.amenities || []).join(", ")}
                            onChange={(e) => setEditingApartment({ 
                              ...editingApartment, 
                              amenities: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                            })}
                            className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                            placeholder="WiFi, Air Conditioning, Private Jacuzzi, etc."
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Highlights (Comma-separated)</label>
                          <input
                            type="text"
                            value={(editingApartment.highlights || []).join(", ")}
                            onChange={(e) => setEditingApartment({ 
                              ...editingApartment, 
                              highlights: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                            })}
                            className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                            placeholder="Direct Ocean Access, Dedicated Butler, etc."
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={() => setEditingApartment(null)}
                          className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold uppercase tracking-wider text-[10px] cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-5 py-2 bg-brand-teal text-brand-dark font-black uppercase tracking-wider text-[10px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {submitting ? "Saving..." : "Save Suite Details"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {apartments.map(apt => (
                        <div key={apt.id} className="bg-white border border-stone-200 overflow-hidden flex flex-col shadow-sm">
                          <img 
                            src={apt.image} 
                            alt={apt.name} 
                            className="w-full h-48 object-cover border-b border-stone-150"
                            referrerPolicy="no-referrer"
                          />
                          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                            <div>
                              <div className="flex items-start justify-between gap-1">
                                <h4 className="font-serif text-sm font-bold text-stone-900 leading-tight uppercase tracking-wide">
                                  {apt.name}
                                </h4>
                                <span className="font-serif text-sm font-bold text-brand-teal shrink-0">
                                  ${apt.pricePerNight}/N
                                </span>
                              </div>
                              <p className="text-stone-500 text-xs mt-2 line-clamp-3 leading-relaxed">
                                {apt.description}
                              </p>
                              <div className="grid grid-cols-2 gap-1.5 pt-3.5 border-t border-stone-100 mt-3 text-[10px] text-stone-600 font-semibold uppercase">
                                <div>Size: {apt.size}</div>
                                <div>Max Guests: {apt.maxGuests}</div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleStartEditApartment(apt)}
                                className="flex-1 py-2 bg-stone-900 hover:bg-brand-teal hover:text-brand-dark text-white font-bold uppercase tracking-widest text-[9px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit Details</span>
                              </button>
                              <button
                                onClick={() => handleDeleteApartment(apt.id)}
                                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 font-bold uppercase transition-all cursor-pointer flex items-center justify-center"
                                title="Delete Suite"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* --- TAB 3: DYNAMIC PRICING CONTROLLER --- */}
              {activeTab === "pricing" && (
                <div className="space-y-6 max-w-3xl">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900 uppercase tracking-wider">Dynamic Rates & Pricing Controller</h3>
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mt-0.5">Control live profit margins, localized resort taxes, and seasonal rate overrides</p>
                  </div>

                  <div className="bg-white p-6 border border-stone-200 space-y-6">
                    {/* MARKUP MULTIPLIER SLIDER */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-brand-teal" />
                          <span>Global Markup Multiplier</span>
                        </label>
                        <span className="font-mono text-xs font-black bg-stone-100 border border-stone-200 px-2.5 py-1 text-stone-800">
                          x{pricing.markupMultiplier.toFixed(2)} ({Math.round((pricing.markupMultiplier - 1.0) * 100) > 0 ? `+${Math.round((pricing.markupMultiplier - 1.0) * 100)}% Markup` : Math.round((pricing.markupMultiplier - 1.0) * 100) < 0 ? `${Math.round((pricing.markupMultiplier - 1.0) * 100)}% Discount` : "Standard Rates"})
                        </span>
                      </div>
                      <p className="text-stone-500 text-xs leading-relaxed">
                        Adjust this multiplier to scale the pricing of all suites and local packages across the website dynamically in real-time. Use 1.0 for standard pricing, 1.15 for high season, or 0.90 for promotional discounts.
                      </p>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.05"
                        value={pricing.markupMultiplier}
                        onChange={(e) => handleSavePricingRules({ markupMultiplier: Number(e.target.value) })}
                        className="w-full accent-brand-teal cursor-pointer h-2 bg-stone-100"
                      />
                      <div className="flex justify-between text-[10px] text-stone-400 font-bold uppercase tracking-wider mt-1">
                        <span>0.50x Discount</span>
                        <span>1.0x (Base standard)</span>
                        <span>1.50x High markup</span>
                        <span>2.0x Peak season</span>
                      </div>
                    </div>

                    <div className="h-px bg-stone-100" />

                    {/* SECTOR LOCAL RESORT TAX */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                      <div className="space-y-2">
                        <label className="block font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                          <Percent className="w-4 h-4 text-brand-teal" />
                          <span>Resort & Service Tax (%)</span>
                        </label>
                        <p className="text-stone-500 text-xs leading-relaxed">
                          The local government hotel and services levy, computed directly into the checkout total.
                        </p>
                        <div className="flex">
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={pricing.taxRate}
                            onChange={(e) => handleSavePricingRules({ taxRate: Number(e.target.value) })}
                            className="p-2.5 border border-stone-300 bg-stone-50 text-stone-800 font-bold text-center w-24 focus:outline-none focus:border-brand-teal"
                          />
                          <span className="bg-stone-200 border-y border-r border-stone-300 px-3.5 flex items-center text-stone-600 font-bold">
                            %
                          </span>
                        </div>
                      </div>

                      {/* SEASONAL TYPE OVERRIDE */}
                      <div className="space-y-2">
                        <label className="block font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-brand-teal" />
                          <span>Seasonal Override Mode</span>
                        </label>
                        <p className="text-stone-500 text-xs leading-relaxed">
                          Selecting an active override alters the display labels across suite lists to notify customers.
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: "regular", label: "Regular" },
                            { value: "peak", label: "Peak (+20%)" },
                            { value: "low", label: "Low (-15%)" }
                          ].map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                let targetMultiplier = pricing.markupMultiplier;
                                if (opt.value === "peak") targetMultiplier = 1.20;
                                else if (opt.value === "low") targetMultiplier = 0.85;
                                else targetMultiplier = 1.0;

                                handleSavePricingRules({ 
                                  seasonalFactor: opt.value as any,
                                  markupMultiplier: targetMultiplier
                                });
                              }}
                              className={`p-2 border text-center font-bold uppercase text-[10px] tracking-wider transition-colors cursor-pointer ${
                                pricing.seasonalFactor === opt.value
                                  ? "bg-stone-900 border-stone-900 text-brand-teal font-black"
                                  : "bg-stone-50 border-stone-300 text-stone-600 hover:text-stone-950 hover:bg-stone-100"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-stone-100 flex items-center gap-2 text-[10px] font-semibold text-stone-500 uppercase leading-relaxed">
                      <Sparkles className="w-4 h-4 text-brand-gold animate-bounce shrink-0" />
                      <span>Note: Changes saved here affect checkout calculations and display rates for every visitor on the platform instantly.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* --- TAB 4: DINING OPTIONS MANAGER --- */}
              {activeTab === "dining" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-stone-900 uppercase tracking-wider">Dining & Experiences Manager</h3>
                      <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mt-0.5">Edit operational hours, titles, and highlight descriptors of restaurants</p>
                    </div>
                    {!editingDining && (
                      <button
                        onClick={() => {
                          setEditingDining({
                            id: "dining_" + Date.now(),
                            name: "",
                            description: "",
                            highlights: ["Fine Dining", "Oceanside Views"],
                            hours: "7:00 AM - 11:00 PM",
                            image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
                            reservationLinkText: "Inquire Table",
                          });
                        }}
                        className="px-4 py-2 bg-brand-teal hover:bg-brand-teal/80 text-brand-dark font-black uppercase tracking-wider text-[10px] flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add New Venue</span>
                      </button>
                    )}
                  </div>

                  {editingDining ? (
                    <form onSubmit={handleSaveDining} className="bg-white p-6 border border-stone-200 space-y-4 max-w-3xl">
                      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                        <span className="font-bold text-stone-700 uppercase tracking-widest text-[10px] flex items-center gap-1">
                          <Edit3 className="w-4 h-4 text-brand-teal" /> Editing {editingDining.name || "New Venue"}
                        </span>
                        <button 
                          type="button" 
                          onClick={() => setEditingDining(null)}
                          className="text-stone-400 hover:text-stone-700 font-bold text-xs uppercase cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 text-xs">
                        <div>
                          <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Restaurant/Experience Title</label>
                          <input
                            type="text"
                            required
                            value={editingDining.name}
                            onChange={(e) => setEditingDining({ ...editingDining, name: e.target.value })}
                            className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                          />
                        </div>

                        <div>
                          <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Operational Timing hours</label>
                          <input
                            type="text"
                            required
                            value={editingDining.hours}
                            onChange={(e) => setEditingDining({ ...editingDining, hours: e.target.value })}
                            className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                          />
                        </div>

                        <div>
                          <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Long Description Text</label>
                          <textarea
                            required
                            rows={4}
                            value={editingDining.description}
                            onChange={(e) => setEditingDining({ ...editingDining, description: e.target.value })}
                            className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal leading-relaxed"
                          />
                        </div>

                        <div>
                          <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Presentation Image Link</label>
                          <input
                            type="url"
                            required
                            value={editingDining.image}
                            onChange={(e) => setEditingDining({ ...editingDining, image: e.target.value })}
                            className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                          />
                        </div>

                        <div>
                          <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Reservation Link Button Text</label>
                          <input
                            type="text"
                            required
                            value={editingDining.reservationLinkText || "Inquire Table"}
                            onChange={(e) => setEditingDining({ ...editingDining, reservationLinkText: e.target.value })}
                            className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                          />
                        </div>

                        <div>
                          <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Highlights (Comma-separated)</label>
                          <input
                            type="text"
                            value={(editingDining.highlights || []).join(", ")}
                            onChange={(e) => setEditingDining({ 
                              ...editingDining, 
                              highlights: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                            })}
                            className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                            placeholder="Fine Dining, Oceanfront Deck, Private Sommelier, etc."
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={() => setEditingDining(null)}
                          className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold uppercase tracking-wider text-[10px] cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-5 py-2 bg-brand-teal text-brand-dark font-black uppercase tracking-wider text-[10px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {submitting ? "Saving..." : "Save Restaurant Details"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {dining.map(d => (
                        <div key={d.id} className="bg-white border border-stone-200 overflow-hidden flex flex-col shadow-sm">
                          <img 
                            src={d.image} 
                            alt={d.name} 
                            className="w-full h-48 object-cover border-b border-stone-150"
                            referrerPolicy="no-referrer"
                          />
                          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                            <div>
                              <h4 className="font-serif text-sm font-bold text-stone-900 uppercase tracking-wide">
                                  {d.name}
                              </h4>
                              <p className="text-stone-500 text-xs mt-2 line-clamp-3 leading-relaxed">
                                {d.description}
                              </p>
                              <div className="text-[10px] text-stone-600 font-bold uppercase mt-3.5 pt-3.5 border-t border-stone-100">
                                Timing: {d.hours}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleStartEditDining(d)}
                                className="flex-1 py-2 bg-stone-900 hover:bg-brand-teal hover:text-brand-dark text-white font-bold uppercase tracking-widest text-[9px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit Details</span>
                              </button>
                              <button
                                onClick={() => handleDeleteDining(d.id)}
                                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 font-bold uppercase transition-all cursor-pointer flex items-center justify-center"
                                title="Delete Venue"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* --- TAB 5: EXTRAS & PACKAGES MANAGER --- */}
              {activeTab === "transfers" && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-stone-200 pb-4 gap-4">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-stone-900 uppercase tracking-wider">Extras & Packages Manager</h3>
                      <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mt-0.5">Edit transfers chauffeur fleet, private events, and boarding plans in real-time</p>
                    </div>

                    {/* SUB TABS NAVIGATION */}
                    <div className="flex border border-stone-200 bg-stone-50 p-1 text-[10px] font-bold uppercase tracking-wider">
                      {(["transfers", "events", "boarding"] as const).map(sub => (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => {
                            setExtrasSubTab(sub);
                            setEditingVehicle(null);
                            setEditingEvent(null);
                            setEditingBoarding(null);
                          }}
                          className={`px-3 py-1.5 transition-colors cursor-pointer ${
                            extrasSubTab === sub
                              ? "bg-stone-900 text-brand-teal font-black"
                              : "text-stone-500 hover:text-stone-900"
                          }`}
                        >
                          {sub === "transfers" ? "Airport Fleet" : sub === "events" ? "Private Events" : "Boarding Plans"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* === SUB TAB 1: AIRPORT CHAUFFEUR FLEET === */}
                  {extrasSubTab === "transfers" && (
                    <div className="space-y-6">
                      {editingVehicle ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!editingVehicle) return;
                            let updatedList;
                            if (vehicles.some(v => v.id === editingVehicle.id)) {
                              updatedList = vehicles.map(v => v.id === editingVehicle.id ? editingVehicle : v);
                            } else {
                              updatedList = [...vehicles, editingVehicle];
                            }
                            handleSaveVehiclesList(updatedList);
                            setEditingVehicle(null);
                          }}
                          className="bg-white p-6 border border-stone-200 space-y-4 max-w-3xl"
                        >
                          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                            <span className="font-bold text-stone-700 uppercase tracking-widest text-[10px] flex items-center gap-1">
                              <Car className="w-4 h-4 text-brand-teal" /> {vehicles.some(v => v.id === editingVehicle.id) ? "Editing" : "Adding"} Vehicle
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingVehicle(null)}
                              className="text-stone-400 hover:text-stone-700 font-bold text-xs uppercase cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                              <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Vehicle Brand / Model</label>
                              <input
                                type="text"
                                required
                                value={editingVehicle.name}
                                onChange={(e) => setEditingVehicle({ ...editingVehicle, name: e.target.value })}
                                className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                                placeholder="VIP Alphard / Vellfire"
                              />
                            </div>

                            <div>
                              <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Vehicle Image Link</label>
                              <input
                                type="url"
                                required
                                value={editingVehicle.image}
                                onChange={(e) => setEditingVehicle({ ...editingVehicle, image: e.target.value })}
                                className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                                placeholder="https://images.unsplash.com/photo-..."
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Tagline / Short Descriptor</label>
                              <input
                                type="text"
                                required
                                value={editingVehicle.tagline}
                                onChange={(e) => setEditingVehicle({ ...editingVehicle, tagline: e.target.value })}
                                className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                                placeholder="First-class executive seating with extra legroom & luxury finish"
                              />
                            </div>

                            <div>
                              <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Max Passengers</label>
                              <input
                                type="number"
                                required
                                min="1"
                                value={editingVehicle.maxPassengers}
                                onChange={(e) => setEditingVehicle({ ...editingVehicle, maxPassengers: Number(e.target.value) })}
                                className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                              />
                            </div>

                            <div>
                              <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Max Luggage Bags</label>
                              <input
                                type="number"
                                required
                                min="0"
                                value={editingVehicle.maxLuggage}
                                onChange={(e) => setEditingVehicle({ ...editingVehicle, maxLuggage: Number(e.target.value) })}
                                className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                              />
                            </div>

                            <div>
                              <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">One-Way Tariff (USD)</label>
                              <input
                                type="number"
                                required
                                min="0"
                                value={editingVehicle.rateUsd}
                                onChange={(e) => setEditingVehicle({ 
                                  ...editingVehicle, 
                                  rateUsd: Number(e.target.value),
                                  rateKes: Number(e.target.value) * 140 
                                })}
                                className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                              />
                            </div>

                            <div>
                              <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Onboard Features (Comma-separated)</label>
                              <input
                                type="text"
                                value={(editingVehicle.features || []).join(", ")}
                                onChange={(e) => setEditingVehicle({ 
                                  ...editingVehicle, 
                                  features: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                                })}
                                className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                                placeholder="Air-Conditioned, Complimentary Water, Free Wi-Fi"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                            <button
                              type="button"
                              onClick={() => setEditingVehicle(null)}
                              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold uppercase tracking-wider text-[10px] cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2 bg-brand-teal text-brand-dark font-black uppercase tracking-wider text-[10px] flex items-center gap-1.5 cursor-pointer"
                            >
                              Save Vehicle Details
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center bg-stone-50 p-4 border border-stone-200">
                            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Dynamic transfer fleet: {vehicles.length} Active Vehicles</span>
                            <button
                              onClick={() => setEditingVehicle({
                                id: "vehicle_" + Date.now(),
                                name: "",
                                tagline: "",
                                maxPassengers: 4,
                                maxLuggage: 3,
                                rateUsd: 35,
                                rateKes: 4900,
                                image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
                                features: ["Air-Conditioned", "Complimentary Water"]
                              })}
                              className="px-3 py-1.5 bg-stone-900 text-brand-teal font-bold uppercase text-[9px] tracking-widest flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add New Vehicle</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {vehicles.map((v, idx) => (
                              <div key={v.id || idx} className="flex gap-4 p-4 bg-white border border-stone-200 text-xs shadow-sm">
                                <img src={v.image} alt={v.name} className="w-20 h-20 object-cover border border-stone-100 shrink-0" referrerPolicy="no-referrer" />
                                <div className="flex-1 space-y-1 min-w-0">
                                  <p className="font-bold text-stone-900 uppercase truncate">{v.name}</p>
                                  <p className="text-[10px] text-stone-500 leading-tight line-clamp-2">{v.tagline}</p>
                                  <div className="text-[10px] font-semibold text-stone-600 pt-1">
                                    Cap: {v.maxPassengers} Pax • {v.maxLuggage} Bags • Rate: ${v.rateUsd}/trip
                                  </div>
                                  <div className="flex gap-3 pt-2 text-[9px] font-bold uppercase">
                                    <button
                                      onClick={() => setEditingVehicle({ ...v })}
                                      className="text-stone-700 hover:text-brand-teal transition-colors"
                                    >
                                      Edit Details
                                    </button>
                                    <span className="text-stone-200">|</span>
                                    <button
                                      onClick={() => {
                                        if (confirm("Are you sure you want to remove this vehicle?")) {
                                          const list = vehicles.filter((_, i) => i !== idx);
                                          handleSaveVehiclesList(list);
                                        }
                                      }}
                                      className="text-rose-600 hover:text-rose-800 transition-colors"
                                    >
                                      Remove Vehicle
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* === SUB TAB 2: PRIVATE EVENTS & CHARTERS === */}
                  {extrasSubTab === "events" && (
                    <div className="space-y-6">
                      {editingEvent ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!editingEvent) return;
                            let updatedList;
                            if (events.some(ev => ev.id === editingEvent.id)) {
                              updatedList = events.map(ev => ev.id === editingEvent.id ? editingEvent : ev);
                            } else {
                              updatedList = [...events, editingEvent];
                            }
                            handleSaveEventsList(updatedList);
                            setEditingEvent(null);
                          }}
                          className="bg-white p-6 border border-stone-200 space-y-4 max-w-3xl"
                        >
                          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                            <span className="font-bold text-stone-700 uppercase tracking-widest text-[10px] flex items-center gap-1">
                              <Heart className="w-4 h-4 text-brand-teal" /> {events.some(ev => ev.id === editingEvent.id) ? "Editing" : "Adding"} Event Package
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingEvent(null)}
                              className="text-stone-400 hover:text-stone-700 font-bold text-xs uppercase cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                              <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Event Package Title</label>
                              <input
                                type="text"
                                required
                                value={editingEvent.title}
                                onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                                className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                                placeholder="Cliffside Weddings & Vows"
                              />
                            </div>

                            <div>
                              <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Presentation Image Link</label>
                              <input
                                type="url"
                                required
                                value={editingEvent.image}
                                onChange={(e) => setEditingEvent({ ...editingEvent, image: e.target.value })}
                                className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                                placeholder="https://images.unsplash.com/photo-..."
                              />
                            </div>

                            <div>
                              <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Subheading Tag (e.g., Oceanfront Ceremonies)</label>
                              <input
                                type="text"
                                required
                                value={editingEvent.tag}
                                onChange={(e) => setEditingEvent({ ...editingEvent, tag: e.target.value })}
                                className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                                placeholder="Oceanfront Ceremonies"
                              />
                            </div>

                            <div>
                              <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Tag Icon Style</label>
                              <select
                                value={editingEvent.tagIcon}
                                onChange={(e) => setEditingEvent({ ...editingEvent, tagIcon: e.target.value as any })}
                                className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                              >
                                <option value="heart">Heart / Romantic</option>
                                <option value="ship">Ship / Marine Charter</option>
                                <option value="briefcase">Briefcase / Corporate</option>
                                <option value="sparkles">Sparkles / Celebration</option>
                              </select>
                            </div>

                            <div className="md:col-span-2">
                              <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Package Description</label>
                              <textarea
                                required
                                rows={3}
                                value={editingEvent.description}
                                onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                                className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal leading-relaxed"
                                placeholder="Exchange vows overlooking Tudor Creek on our cliffside garden lawn..."
                              />
                            </div>

                            <div>
                              <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Guest Capacity (e.g. Up to 200 Guests)</label>
                              <input
                                type="text"
                                required
                                value={editingEvent.capacityText}
                                onChange={(e) => setEditingEvent({ ...editingEvent, capacityText: e.target.value })}
                                className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                                placeholder="Up to 200 Guests"
                              />
                            </div>

                            <div>
                              <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Catering Text (e.g. Seafood Buffet)</label>
                              <input
                                type="text"
                                required
                                value={editingEvent.cateringText}
                                onChange={(e) => setEditingEvent({ ...editingEvent, cateringText: e.target.value })}
                                className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                                placeholder="Custom Seafood & Swahili Buffet"
                              />
                            </div>

                            <div>
                              <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Main Highlight Perk (e.g. Honeymoon upgrade)</label>
                              <input
                                type="text"
                                required
                                value={editingEvent.extraHighlight}
                                onChange={(e) => setEditingEvent({ ...editingEvent, extraHighlight: e.target.value })}
                                className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                                placeholder="Includes Honeymoon Penthouse Upgrade"
                              />
                            </div>

                            <div>
                              <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">CTA Button Text (e.g. Book Wedding)</label>
                              <input
                                type="text"
                                required
                                value={editingEvent.ctaText || "Inquire Dates"}
                                onChange={(e) => setEditingEvent({ ...editingEvent, ctaText: e.target.value })}
                                className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Features list (Comma-separated)</label>
                              <input
                                type="text"
                                value={(editingEvent.features || []).join(", ")}
                                onChange={(e) => setEditingEvent({ 
                                  ...editingEvent, 
                                  features: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                                })}
                                className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                                placeholder="Lawn capacity 200 guests, Plated seafood, Penthouse accommodation"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                            <button
                              type="button"
                              onClick={() => setEditingEvent(null)}
                              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold uppercase tracking-wider text-[10px] cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2 bg-brand-teal text-brand-dark font-black uppercase tracking-wider text-[10px] flex items-center gap-1.5 cursor-pointer"
                            >
                              Save Event Package
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center bg-stone-50 p-4 border border-stone-200">
                            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Dynamic Event Offers: {events.length} Packages</span>
                            <button
                              onClick={() => setEditingEvent({
                                id: "event_" + Date.now(),
                                title: "",
                                tag: "",
                                tagIcon: "sparkles",
                                description: "",
                                capacityText: "Up to 100 Guests",
                                cateringText: "Custom Catering",
                                extraHighlight: "Dedicated Events Coordinator",
                                ctaText: "Inquire Event",
                                image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
                                features: ["Dedicated event venue", "Bespoke Swahili decoration"]
                              })}
                              className="px-3 py-1.5 bg-stone-900 text-brand-teal font-bold uppercase text-[9px] tracking-widest flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add New Package</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {events.map((ev, idx) => (
                              <div key={ev.id || idx} className="bg-white border border-stone-200 flex flex-col shadow-sm">
                                <img src={ev.image} alt={ev.title} className="w-full h-40 object-cover border-b border-stone-150" referrerPolicy="no-referrer" />
                                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 min-w-0">
                                  <div>
                                    <div className="flex justify-between items-start gap-1">
                                      <p className="font-bold text-stone-900 uppercase truncate leading-snug">{ev.title}</p>
                                      <span className="text-[9px] px-1.5 py-0.5 bg-stone-100 text-stone-600 font-bold uppercase tracking-wider shrink-0">{ev.tag}</span>
                                    </div>
                                    <p className="text-[10px] text-stone-500 leading-normal line-clamp-3 mt-1.5">{ev.description}</p>
                                  </div>
                                  <div className="flex gap-3 text-[9px] font-bold uppercase border-t border-stone-100 pt-2.5">
                                    <button
                                      onClick={() => setEditingEvent({ ...ev })}
                                      className="text-stone-700 hover:text-brand-teal transition-colors"
                                    >
                                      Edit Details
                                    </button>
                                    <span className="text-stone-200">|</span>
                                    <button
                                      onClick={() => {
                                        if (confirm("Are you sure you want to delete this event package?")) {
                                          const list = events.filter((_, i) => i !== idx);
                                          handleSaveEventsList(list);
                                        }
                                      }}
                                      className="text-rose-600 hover:text-rose-800 transition-colors"
                                    >
                                      Delete Package
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* === SUB TAB 3: BOARDING UPGRADES === */}
                  {extrasSubTab === "boarding" && (
                    <div className="space-y-6">
                      {editingBoarding ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!editingBoarding) return;
                            let updatedList;
                            if (boardingPackages.some(bp => bp.id === editingBoarding.id)) {
                              updatedList = boardingPackages.map(bp => bp.id === editingBoarding.id ? editingBoarding : bp);
                            } else {
                              updatedList = [...boardingPackages, editingBoarding];
                            }
                            handleSaveBoardingList(updatedList);
                            setEditingBoarding(null);
                          }}
                          className="bg-white p-6 border border-stone-200 space-y-4 max-w-3xl"
                        >
                          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                            <span className="font-bold text-stone-700 uppercase tracking-widest text-[10px] flex items-center gap-1">
                              <Utensils className="w-4 h-4 text-brand-teal" /> {boardingPackages.some(bp => bp.id === editingBoarding.id) ? "Editing" : "Adding"} Boarding Plan
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingBoarding(null)}
                              className="text-stone-400 hover:text-stone-700 font-bold text-xs uppercase cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                              <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Board Plan Name</label>
                              <input
                                type="text"
                                required
                                value={editingBoarding.name}
                                onChange={(e) => setEditingBoarding({ ...editingBoarding, name: e.target.value })}
                                className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                                placeholder="Gourmet Half Board"
                              />
                            </div>

                            <div>
                              <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Daily Tariff Per Adult (USD)</label>
                              <input
                                type="number"
                                required
                                min="0"
                                value={editingBoarding.rateUsd}
                                onChange={(e) => setEditingBoarding({ ...editingBoarding, rateUsd: Number(e.target.value) })}
                                className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Slogan / Short Descriptor</label>
                              <input
                                type="text"
                                required
                                value={editingBoarding.slogan}
                                onChange={(e) => setEditingBoarding({ ...editingBoarding, slogan: e.target.value })}
                                className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                                placeholder="Indulge in both premium breakfast and your choice of sunset dinners daily"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block font-bold uppercase text-[9px] text-stone-600 mb-1">Included perks & benefits (Comma-separated)</label>
                              <input
                                type="text"
                                value={(editingBoarding.features || []).join(", ")}
                                onChange={(e) => setEditingBoarding({ 
                                  ...editingBoarding, 
                                  features: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                                })}
                                className="w-full p-2.5 border border-stone-300 rounded-none bg-stone-50 font-medium text-stone-800 focus:outline-none focus:border-brand-teal"
                                placeholder="Full Breakfast, Seafood dinner daily, Signature Dawa cocktail"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                            <button
                              type="button"
                              onClick={() => setEditingBoarding(null)}
                              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold uppercase tracking-wider text-[10px] cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2 bg-brand-teal text-brand-dark font-black uppercase tracking-wider text-[10px] flex items-center gap-1.5 cursor-pointer"
                            >
                              Save Boarding Plan
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center bg-stone-50 p-4 border border-stone-200">
                            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Dynamic Boarding Options: {boardingPackages.length} Plans</span>
                            <button
                              onClick={() => setEditingBoarding({
                                id: "board_" + Date.now(),
                                name: "",
                                slogan: "",
                                rateUsd: 25,
                                features: ["Gourmet Meals", "Beverages included"]
                              })}
                              className="px-3 py-1.5 bg-stone-900 text-brand-teal font-bold uppercase text-[9px] tracking-widest flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Board Plan</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {boardingPackages.map((bp, idx) => (
                              <div key={bp.id || idx} className="bg-white border border-stone-200 p-4 flex flex-col justify-between shadow-sm text-xs space-y-3">
                                <div>
                                  <div className="flex justify-between items-start gap-1">
                                    <p className="font-bold text-stone-900 uppercase truncate">{bp.name}</p>
                                    <span className="font-serif text-xs font-bold text-brand-teal shrink-0">
                                      {bp.rateUsd === 0 ? "Free Supplement" : `${bp.rateUsd}/Day`}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-stone-500 leading-normal mt-1">{bp.slogan}</p>
                                  <div className="flex flex-wrap gap-1 mt-2.5">
                                    {(bp.features || []).map((f: string, i: number) => (
                                      <span key={i} className="bg-stone-50 border border-stone-150 px-2 py-0.5 text-[9px] text-stone-600 font-semibold rounded-none">
                                        ✓ {f}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex gap-3 text-[9px] font-bold uppercase border-t border-stone-100 pt-2.5">
                                  <button
                                    onClick={() => setEditingBoarding({ ...bp })}
                                    className="text-stone-700 hover:text-brand-teal transition-colors"
                                  >
                                    Edit Plan
                                  </button>
                                  {bp.id !== "self_catering" && (
                                    <>
                                      <span className="text-stone-200">|</span>
                                      <button
                                        onClick={() => {
                                          if (confirm("Are you sure you want to remove this boarding option?")) {
                                            const list = boardingPackages.filter((_, i) => i !== idx);
                                            handleSaveBoardingList(list);
                                          }
                                        }}
                                        className="text-rose-600 hover:text-rose-800 transition-colors"
                                      >
                                        Delete Plan
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* --- TAB 6: HERO SLIDESHOW IMAGES --- */}
              {activeTab === "hero" && (
                <div className="space-y-6 max-w-3xl">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900 uppercase tracking-wider">Homepage Slider Slideshow Editor</h3>
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mt-0.5">Control the high-resolution background imagery rotated on the resort landing screen</p>
                  </div>

                  <div className="bg-white p-6 border border-stone-200 space-y-4">
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Insert high-resolution background image URLs (one per line) below. Standard aspect ratio recommended: 16:9 or wider (1920x1080).
                    </p>

                    <textarea
                      rows={8}
                      value={pasteHeroInput}
                      onChange={(e) => setPasteHeroInput(e.target.value)}
                      className="w-full p-3 font-mono text-xs border border-stone-300 rounded-none bg-stone-50 text-stone-800 focus:outline-none focus:border-brand-teal leading-relaxed"
                      placeholder="https://images.unsplash.com/photo-..."
                    />

                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveHeroSlider}
                        className="px-5 py-2.5 bg-brand-teal text-brand-dark font-black uppercase tracking-wider text-[10px] cursor-pointer"
                      >
                        Update Hero Slideshow
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Reset landing imagery to standard fallback Tamarind visuals?")) {
                            onResetHeroImages();
                            showToast("Hero slider reset successfully");
                          }
                        }}
                        className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Defaults</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}