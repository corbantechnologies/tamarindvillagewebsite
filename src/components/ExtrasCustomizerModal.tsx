import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, Plus, Trash2, RotateCcw, Car, Heart, Image as ImageIcon, CheckCircle2, Sparkles } from "lucide-react";
import { 
  TransferVehicle, 
  EventPackage, 
  loadTransferVehicles, 
  saveTransferVehicles, 
  DEFAULT_TRANSFER_VEHICLES,
  loadEventPackages, 
  saveEventPackages, 
  DEFAULT_EVENT_PACKAGES 
} from "../utils/extrasStore";

interface ExtrasCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  heroImages: string[];
  onSaveHeroImages: (images: string[]) => void;
  onResetHeroImages: () => void;
  onVehiclesUpdated?: (vehicles: TransferVehicle[]) => void;
  onEventsUpdated?: (events: EventPackage[]) => void;
}

export default function ExtrasCustomizerModal({
  isOpen,
  onClose,
  heroImages,
  onSaveHeroImages,
  onResetHeroImages,
  onVehiclesUpdated,
  onEventsUpdated
}: ExtrasCustomizerModalProps) {
  const [activeTab, setActiveTab] = useState<"transfers" | "events" | "hero">("transfers");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State for Transfer Vehicles
  const [vehicles, setVehicles] = useState<TransferVehicle[]>([]);
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);

  // Vehicle Form state
  const [vName, setVName] = useState("");
  const [vTagline, setVTagline] = useState("");
  const [vPassengers, setVPassengers] = useState(4);
  const [vLuggage, setVLuggage] = useState(3);
  const [vRateUsd, setVRateUsd] = useState(35);
  const [vRateKes, setVRateKes] = useState(4800);
  const [vImage, setVImage] = useState("");
  const [vFeaturesText, setVFeaturesText] = useState("");

  // State for Event Packages
  const [events, setEvents] = useState<EventPackage[]>([]);
  const [showAddEventForm, setShowAddEventForm] = useState(false);

  // Event Form state
  const [eTitle, setETitle] = useState("");
  const [eTag, setETag] = useState("");
  const [eImage, setEImage] = useState("");
  const [eDescription, setEDescription] = useState("");
  const [eFeaturesText, setEFeaturesText] = useState("");
  const [eCapacityText, setECapacityText] = useState("");
  const [eCateringText, setECateringText] = useState("");
  const [eHighlight, setEHighlight] = useState("");

  // Hero Image state
  const [pasteHeroInput, setPasteHeroInput] = useState("");

  useEffect(() => {
    if (isOpen) {
      setVehicles(loadTransferVehicles());
      setEvents(loadEventPackages());
      setPasteHeroInput(heroImages.join("\n"));
    }
  }, [isOpen, heroImages]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // --- VEHICLE ACTIONS ---
  const handleSaveVehicles = (updated: TransferVehicle[]) => {
    setVehicles(updated);
    saveTransferVehicles(updated);
    if (onVehiclesUpdated) onVehiclesUpdated(updated);
    showToast("Chauffeur & Transfer fleet updated!");
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName || !vImage) {
      alert("Please provide vehicle name and image URL.");
      return;
    }

    const features = vFeaturesText
      ? vFeaturesText.split(",").map((f) => f.trim()).filter(Boolean)
      : ["Air-conditioned", "Professional Chauffeur", "Free Bottled Water"];

    const newV: TransferVehicle = {
      id: `vehicle-${Date.now()}`,
      name: vName,
      tagline: vTagline || "Luxury chauffeured transfer",
      maxPassengers: Number(vPassengers) || 4,
      maxLuggage: Number(vLuggage) || 3,
      rateUsd: Number(vRateUsd) || 30,
      rateKes: Number(vRateKes) || 4000,
      image: vImage,
      features
    };

    const updated = [...vehicles, newV];
    handleSaveVehicles(updated);

    setVName("");
    setVTagline("");
    setVImage("");
    setVFeaturesText("");
    setShowAddVehicleForm(false);
  };

  const handleDeleteVehicle = (id: string) => {
    if (vehicles.length <= 1) {
      alert("You must keep at least one vehicle in your fleet.");
      return;
    }
    const updated = vehicles.filter((v) => v.id !== id);
    handleSaveVehicles(updated);
  };

  const handleResetVehicles = () => {
    handleSaveVehicles(DEFAULT_TRANSFER_VEHICLES);
  };

  // --- EVENT ACTIONS ---
  const handleSaveEvents = (updated: EventPackage[]) => {
    setEvents(updated);
    saveEventPackages(updated);
    if (onEventsUpdated) onEventsUpdated(updated);
    showToast("Weddings, Private Events & Charters updated!");
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eTitle || !eImage) {
      alert("Please provide event title and image URL.");
      return;
    }

    const features = eFeaturesText
      ? eFeaturesText.split(",").map((f) => f.trim()).filter(Boolean)
      : ["Dedicated event coordinator", "Bespoke setup", "Oceanfront venue"];

    const newE: EventPackage = {
      id: `event-${Date.now()}`,
      title: eTitle,
      tag: eTag || "Special Event",
      tagIcon: "sparkles",
      image: eImage,
      description: eDescription || "Unforgettable coastal celebration.",
      features,
      capacityText: eCapacityText || "Up to 100 Guests",
      cateringText: eCateringText || "Custom Tamarind Catering",
      extraHighlight: eHighlight || "Bespoke Event Setup",
      ctaText: "Inquire Event Dates"
    };

    const updated = [...events, newE];
    handleSaveEvents(updated);

    setETitle("");
    setETag("");
    setEImage("");
    setEDescription("");
    setEFeaturesText("");
    setShowAddEventForm(false);
  };

  const handleDeleteEvent = (id: string) => {
    if (events.length <= 1) {
      alert("You must keep at least one event package.");
      return;
    }
    const updated = events.filter((e) => e.id !== id);
    handleSaveEvents(updated);
  };

  const handleResetEvents = () => {
    handleSaveEvents(DEFAULT_EVENT_PACKAGES);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-brand-dark/85 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl bg-white text-brand-dark border border-stone-200 p-6 sm:p-8 max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col z-10 rounded-none"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-6 pb-4 border-b border-stone-200">
            <div>
              <div className="flex items-center gap-2 text-brand-teal text-xs font-mono font-bold uppercase tracking-widest mb-1">
                <Sparkles className="w-4 h-4 text-brand-gold" />
                <span>Resort Content Manager</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl text-brand-teal font-bold tracking-tight">
                Manage Extras, Fleet & Media
              </h3>
              <p className="text-stone-500 text-xs mt-1 font-light">
                Edit transfer vehicles, wedding & event offerings, and homepage hero slides.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {toastMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Manager Navigation Tabs */}
          <div className="flex border-b border-stone-200 mb-6 gap-2">
            <button
              onClick={() => setActiveTab("transfers")}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
                activeTab === "transfers"
                  ? "border-brand-teal text-brand-teal bg-brand-teal/5"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Chauffeurs & Transfers ({vehicles.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("events")}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
                activeTab === "events"
                  ? "border-brand-gold text-brand-gold bg-brand-gold/5"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Weddings & Charters ({events.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("hero")}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
                activeTab === "hero"
                  ? "border-stone-900 text-stone-900 bg-stone-100"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Hero Images ({heroImages.length})</span>
            </button>
          </div>

          {/* TAB 1: CHAUFFEURS & TRANSFERS */}
          {activeTab === "transfers" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-serif text-lg font-bold text-brand-dark">Airport & SGR Vehicle Fleet</h4>
                  <p className="text-xs text-stone-500">Edit rates, capacity, and luxury specs for transfer vehicles.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleResetVehicles}
                    className="px-3 py-1.5 border border-stone-300 text-stone-600 hover:border-brand-teal text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Defaults</span>
                  </button>
                  <button
                    onClick={() => setShowAddVehicleForm(!showAddVehicleForm)}
                    className="px-4 py-1.5 bg-brand-teal text-white font-bold text-xs uppercase tracking-wider hover:bg-brand-teal-dark transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Vehicle</span>
                  </button>
                </div>
              </div>

              {/* Add New Vehicle Form */}
              {showAddVehicleForm && (
                <form onSubmit={handleAddVehicle} className="bg-stone-50 border border-stone-200 p-4 sm:p-6 space-y-4">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-brand-teal">Add Vehicle to Transfer Fleet</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-stone-600 mb-1">Vehicle Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Executive Mercedes E-Class"
                        value={vName}
                        onChange={(e) => setVName(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-stone-300 focus:outline-none focus:border-brand-teal"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-stone-600 mb-1">Tagline / Short Desc</label>
                      <input
                        type="text"
                        placeholder="e.g. VIP Leather seats, climate control"
                        value={vTagline}
                        onChange={(e) => setVTagline(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-stone-300 focus:outline-none focus:border-brand-teal"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-stone-600 mb-1">Max Passengers</label>
                      <input
                        type="number"
                        min={1}
                        value={vPassengers}
                        onChange={(e) => setVPassengers(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 border border-stone-300 focus:outline-none focus:border-brand-teal"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-stone-600 mb-1">Max Luggage Bags</label>
                      <input
                        type="number"
                        min={0}
                        value={vLuggage}
                        onChange={(e) => setVLuggage(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 border border-stone-300 focus:outline-none focus:border-brand-teal"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-stone-600 mb-1">Rate (USD)</label>
                      <input
                        type="number"
                        value={vRateUsd}
                        onChange={(e) => setVRateUsd(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 border border-stone-300 focus:outline-none focus:border-brand-teal"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-stone-600 mb-1">Rate (KES)</label>
                      <input
                        type="number"
                        value={vRateKes}
                        onChange={(e) => setVRateKes(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 border border-stone-300 focus:outline-none focus:border-brand-teal"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-600 mb-1">Image URL *</label>
                    <input
                      type="text"
                      required
                      placeholder="https://images.unsplash.com/..."
                      value={vImage}
                      onChange={(e) => setVImage(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-stone-300 focus:outline-none focus:border-brand-teal"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-600 mb-1">Features (comma separated)</label>
                    <input
                      type="text"
                      placeholder="Free Wi-Fi, Cold Water, Chauffeur Meet & Greet"
                      value={vFeaturesText}
                      onChange={(e) => setVFeaturesText(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-stone-300 focus:outline-none focus:border-brand-teal"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddVehicleForm(false)}
                      className="px-4 py-2 text-xs font-bold text-stone-500 uppercase tracking-wider hover:text-stone-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-brand-teal text-white font-bold text-xs uppercase tracking-wider hover:bg-brand-teal-dark"
                    >
                      Save Vehicle
                    </button>
                  </div>
                </form>
              )}

              {/* Current Vehicles List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vehicles.map((v) => (
                  <div key={v.id} className="border border-stone-200 p-4 bg-white flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="aspect-video relative overflow-hidden bg-stone-100 mb-3">
                        <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
                        <span className="absolute top-2 right-2 bg-brand-dark/90 text-brand-gold text-[10px] font-bold px-2 py-0.5">
                          ${v.rateUsd} / KES {v.rateKes.toLocaleString()}
                        </span>
                      </div>
                      <h5 className="font-serif font-bold text-brand-dark text-base">{v.name}</h5>
                      <p className="text-xs text-stone-500 font-light mb-2">{v.tagline}</p>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-stone-600 mb-3">
                        <span>👥 {v.maxPassengers} Pass.</span>
                        <span>🧳 {v.maxLuggage} Bags</span>
                      </div>
                      <div className="space-y-1 mb-3">
                        {v.features.map((feat, idx) => (
                          <div key={idx} className="text-[10px] text-stone-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-brand-teal" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex justify-end">
                      <button
                        onClick={() => handleDeleteVehicle(v.id)}
                        className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: WEDDINGS & PRIVATE EVENTS */}
          {activeTab === "events" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-serif text-lg font-bold text-brand-dark">Weddings, Events & Dhow Charters</h4>
                  <p className="text-xs text-stone-500">Manage packages, descriptions, and imagery in the celebrations section.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleResetEvents}
                    className="px-3 py-1.5 border border-stone-300 text-stone-600 hover:border-brand-gold text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Defaults</span>
                  </button>
                  <button
                    onClick={() => setShowAddEventForm(!showAddEventForm)}
                    className="px-4 py-1.5 bg-brand-gold text-brand-dark font-bold text-xs uppercase tracking-wider hover:bg-amber-500 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Event Offering</span>
                  </button>
                </div>
              </div>

              {/* Add New Event Package Form */}
              {showAddEventForm && (
                <form onSubmit={handleAddEvent} className="bg-stone-50 border border-stone-200 p-4 sm:p-6 space-y-4">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-brand-gold">Add Event or Charter Offering</h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-stone-600 mb-1">Event Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sunset Dawa Terrace Cocktail Party"
                        value={eTitle}
                        onChange={(e) => setETitle(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-stone-300 focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-stone-600 mb-1">Tag Label</label>
                      <input
                        type="text"
                        placeholder="e.g. Bespoke Cocktail Hours"
                        value={eTag}
                        onChange={(e) => setETag(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-stone-300 focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-stone-600 mb-1">Capacity Text</label>
                      <input
                        type="text"
                        placeholder="e.g. 20 - 80 Guests"
                        value={eCapacityText}
                        onChange={(e) => setECapacityText(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-stone-300 focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-stone-600 mb-1">Catering Text</label>
                      <input
                        type="text"
                        placeholder="e.g. Dawa Open Bar & Seafood Tapas"
                        value={eCateringText}
                        onChange={(e) => setECateringText(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-stone-300 focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-stone-600 mb-1">Highlight Badge</label>
                      <input
                        type="text"
                        placeholder="e.g. Private Terrace Access"
                        value={eHighlight}
                        onChange={(e) => setEHighlight(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-stone-300 focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-600 mb-1">Image URL *</label>
                    <input
                      type="text"
                      required
                      placeholder="https://images.unsplash.com/..."
                      value={eImage}
                      onChange={(e) => setEImage(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-stone-300 focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-600 mb-1">Description</label>
                    <textarea
                      rows={2}
                      placeholder="Detailed description of the experience..."
                      value={eDescription}
                      onChange={(e) => setEDescription(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-stone-300 focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-600 mb-1">Included Inclusions (comma separated)</label>
                    <input
                      type="text"
                      placeholder="Live Taarab acoustic music, Welcome Dawa cocktail, Sunset photo session"
                      value={eFeaturesText}
                      onChange={(e) => setEFeaturesText(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-stone-300 focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddEventForm(false)}
                      className="px-4 py-2 text-xs font-bold text-stone-500 uppercase tracking-wider hover:text-stone-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-brand-gold text-brand-dark font-bold text-xs uppercase tracking-wider hover:bg-amber-500"
                    >
                      Save Event Package
                    </button>
                  </div>
                </form>
              )}

              {/* Current Event Offerings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map((e) => (
                  <div key={e.id} className="border border-stone-200 p-4 bg-white flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="aspect-video relative overflow-hidden bg-stone-100 mb-3">
                        <img src={e.image} alt={e.title} className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 bg-brand-dark/90 text-brand-gold text-[10px] font-bold px-2 py-0.5">
                          {e.tag}
                        </span>
                      </div>
                      <h5 className="font-serif font-bold text-brand-dark text-lg mb-1">{e.title}</h5>
                      <p className="text-xs text-stone-600 font-light leading-relaxed mb-3">{e.description}</p>

                      <div className="space-y-1 mb-3 bg-stone-50 p-2.5 border border-stone-200">
                        {e.features.map((feat, idx) => (
                          <div key={idx} className="text-[10px] text-stone-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-brand-gold flex-shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex justify-between items-center">
                      <span className="text-[10px] text-stone-500 font-mono">{e.capacityText}</span>
                      <button
                        onClick={() => handleDeleteEvent(e.id)}
                        className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: HERO IMAGES */}
          {activeTab === "hero" && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-2">
                  Paste Hero Image Links (One URL per line)
                </label>
                <textarea
                  value={pasteHeroInput}
                  onChange={(e) => setPasteHeroInput(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full h-32 px-3 py-2 text-xs border border-stone-300 rounded-none bg-stone-50 font-mono focus:outline-none focus:border-brand-teal leading-relaxed resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[10px] text-stone-500">
                    Total images: <strong className="font-semibold text-brand-teal">{heroImages.length}</strong>
                  </span>
                  <button
                    onClick={() => {
                      const lines = pasteHeroInput
                        .split("\n")
                        .map((l) => l.trim())
                        .filter((l) => l.startsWith("http://") || l.startsWith("https://"));
                      if (lines.length > 0) {
                        onSaveHeroImages(lines);
                        showToast("Hero images updated successfully!");
                      } else {
                        alert("Please provide at least one valid image URL starting with http:// or https://");
                      }
                    }}
                    className="px-4 py-1.5 bg-brand-teal hover:bg-brand-teal-dark text-white font-bold text-xs tracking-wider uppercase transition-all cursor-pointer"
                  >
                    Apply Hero List
                  </button>
                </div>
              </div>

              {/* Individual Image Previews */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-2.5">
                  Current Slides ({heroImages.length})
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[240px] overflow-y-auto pr-1">
                  {heroImages.map((img, index) => (
                    <div key={index} className="relative border border-stone-200 group aspect-video overflow-hidden">
                      <img src={img} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => {
                          const updated = heroImages.filter((_, i) => i !== index);
                          if (updated.length > 0) {
                            onSaveHeroImages(updated);
                          } else {
                            alert("You must keep at least one hero slide image.");
                          }
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors cursor-pointer"
                        title="Delete this image"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-start">
                <button
                  onClick={onResetHeroImages}
                  className="px-4 py-1.5 border border-stone-300 text-stone-600 hover:border-brand-teal text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Hero Defaults</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer Close Button */}
          <div className="pt-6 mt-6 border-t border-stone-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-8 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer"
            >
              Done & Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
