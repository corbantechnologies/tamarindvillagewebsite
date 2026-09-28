import React, { useState } from "react";
import { 
  Waves, Users, Coffee, Sparkles, Utensils, Heart, 
  Plus, Trash2, Edit3, X, Check, Eye, ShieldAlert 
} from "lucide-react";
import { FacilityType } from "../../types";

interface FacilitiesManagerProps {
  facilities: FacilityType[];
  onSaveFacility: (facility: FacilityType) => Promise<void>;
  onDeleteFacility: (id: string) => Promise<void>;
}

export default function FacilitiesManager({
  facilities,
  onSaveFacility,
  onDeleteFacility
}: FacilitiesManagerProps) {
  const [editingFacility, setEditingFacility] = useState<FacilityType | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIconName, setFormIconName] = useState("Waves");
  const [formImage, setFormImage] = useState("");
  const [formDetailsText, setFormDetailsText] = useState("");
  const [formIsResidentOnly, setFormIsResidentOnly] = useState(false);
  const [formOperatingHours, setFormOperatingHours] = useState("6:00 AM – 7:00 PM Daily");
  const [formCapacity, setFormCapacity] = useState(50);

  const openAddModal = () => {
    setFormId("fac_" + Date.now());
    setFormName("");
    setFormDescription("");
    setFormIconName("Waves");
    setFormImage("https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--11.jpg");
    setFormDetailsText("Open daily for staying residents\nComplimentary pool towels and lounger service\nBeachside Tudor Creek views");
    setFormIsResidentOnly(false);
    setFormOperatingHours("6:00 AM – 7:00 PM Daily");
    setFormCapacity(50);
    setIsAddOpen(true);
  };

  const openEditModal = (fac: FacilityType) => {
    setEditingFacility(fac);
    setFormId(fac.id);
    setFormName(fac.name);
    setFormDescription(fac.description);
    setFormIconName(fac.iconName || "Waves");
    setFormImage(fac.image);
    setFormDetailsText((fac.details || []).join("\n"));
    setFormIsResidentOnly(Boolean(fac.isResidentOnly));
    setFormOperatingHours(fac.operatingHours || "6:00 AM – 7:00 PM Daily");
    setFormCapacity(fac.capacity || 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSubmitting(true);
    try {
      const details = formDetailsText
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0);

      await onSaveFacility({
        id: formId,
        name: formName.trim(),
        description: formDescription.trim(),
        iconName: formIconName,
        image: formImage.trim(),
        details,
        isResidentOnly: formIsResidentOnly,
        operatingHours: formOperatingHours.trim(),
        capacity: Number(formCapacity),
        isActive: true
      });

      setIsAddOpen(false);
      setEditingFacility(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderIcon = (name: string) => {
    switch (name) {
      case "Waves": return <Waves className="w-5 h-5 text-brand-teal" />;
      case "Users": return <Users className="w-5 h-5 text-brand-gold" />;
      case "Coffee": return <Coffee className="w-5 h-5 text-amber-600" />;
      case "Utensils": return <Utensils className="w-5 h-5 text-rose-600" />;
      case "Heart": return <Heart className="w-5 h-5 text-red-500" />;
      default: return <Sparkles className="w-5 h-5 text-brand-gold" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-brand-teal mb-1">
            <Waves className="w-4 h-4 text-brand-gold" />
            <span>Resort Amenities &amp; Venues</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
            Resort Facilities Manager
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage public amenities, resident swimming pools, conference venues, and guest features.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-teal text-white font-bold text-xs uppercase tracking-widest hover:bg-brand-teal-dark transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Facility</span>
        </button>
      </div>

      {/* FACILITIES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {facilities.map((fac) => (
          <div key={fac.id} className="bg-white border border-stone-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md transition-shadow">
            <div>
              <div className="relative h-48 w-full overflow-hidden bg-stone-100">
                <img 
                  src={fac.image} 
                  alt={fac.name} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--11.jpg";
                  }}
                />
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  {fac.isResidentOnly && (
                    <span className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest bg-brand-dark/90 text-brand-gold border border-brand-gold/40 shadow-xs">
                      Residents Only
                    </span>
                  )}
                  {fac.capacity && (
                    <span className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-white/90 text-stone-800 shadow-xs">
                      Max {fac.capacity} Guests
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-stone-50 border border-stone-200 shrink-0 mt-0.5">
                    {renderIcon(fac.iconName)}
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900 leading-tight">
                      {fac.name}
                    </h3>
                    {fac.operatingHours && (
                      <p className="text-[11px] text-brand-teal font-semibold mt-0.5">
                        Hours: {fac.operatingHours}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-stone-600 font-light leading-relaxed">
                  {fac.description}
                </p>

                {fac.details && fac.details.length > 0 && (
                  <ul className="space-y-1.5 pt-2 border-t border-stone-100 text-xs text-stone-500">
                    {fac.details.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
              <span className="text-[10px] font-mono text-stone-400">ID: {fac.id}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(fac)}
                  className="px-3 py-1.5 text-xs font-bold text-stone-700 bg-white border border-stone-300 hover:border-stone-500 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-stone-500" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => onDeleteFacility(fac.id)}
                  className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Remove facility"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD / EDIT MODAL */}
      {(isAddOpen || editingFacility) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg p-6 border border-stone-300 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                {editingFacility ? "Edit Facility Details" : "Add Resort Facility"}
              </h3>
              <button onClick={() => { setIsAddOpen(false); setEditingFacility(null); }} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">Facility Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Resident Oceanfront Infinity Pools"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Overview of the facility and guest experience..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">Icon Style</label>
                  <select
                    value={formIconName}
                    onChange={(e) => setFormIconName(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal bg-white"
                  >
                    <option value="Waves">Waves / Pool</option>
                    <option value="Users">Users / Conference</option>
                    <option value="Coffee">Coffee / Lounge</option>
                    <option value="Utensils">Utensils / Dining</option>
                    <option value="Sparkles">Sparkles / VIP</option>
                    <option value="Heart">Heart / Romance</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">Capacity (Guests)</label>
                  <input
                    type="number"
                    min="1"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                    className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">Operating Hours</label>
                  <input
                    type="text"
                    placeholder="e.g. 6:00 AM – 7:00 PM Daily"
                    value={formOperatingHours}
                    onChange={(e) => setFormOperatingHours(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold uppercase tracking-wider text-stone-700">
                    <input
                      type="checkbox"
                      checked={formIsResidentOnly}
                      onChange={(e) => setFormIsResidentOnly(e.target.checked)}
                      className="w-4 h-4 text-brand-teal rounded-none border-stone-300"
                    />
                    <span>Resident Guests Only</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">Feature Bullet Points (1 per line)</label>
                <textarea
                  rows={4}
                  placeholder="Overlooking Tudor Creek&#10;Complimentary sun loungers&#10;Child-friendly shallow end"
                  value={formDetailsText}
                  onChange={(e) => setFormDetailsText(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => { setIsAddOpen(false); setEditingFacility(null); }}
                  className="px-4 py-2 font-bold uppercase tracking-wider text-stone-500 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-brand-teal text-white font-bold uppercase tracking-widest hover:bg-brand-teal-dark transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Facility"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
