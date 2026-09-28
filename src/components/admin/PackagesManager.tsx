import React, { useState } from "react";
import { 
  Coffee, Utensils, Sparkles, Plus, Trash2, Edit3, 
  X, Check, DollarSign, Percent, Layers 
} from "lucide-react";
import { PackageType } from "../../types";

interface PackagesManagerProps {
  packages: PackageType[];
  onSavePackage: (pkg: PackageType) => Promise<void>;
  onDeletePackage: (id: string) => Promise<void>;
}

export default function PackagesManager({
  packages,
  onSavePackage,
  onDeletePackage
}: PackagesManagerProps) {
  const [editingPackage, setEditingPackage] = useState<PackageType | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formMarkup, setFormMarkup] = useState(0);
  const [formPerPersonDay, setFormPerPersonDay] = useState(0);
  const [formHighlightsText, setFormHighlightsText] = useState("");

  const openAddModal = () => {
    setFormId("pkg_" + Date.now());
    setFormName("");
    setFormDescription("");
    setFormMarkup(0);
    setFormPerPersonDay(0);
    setFormHighlightsText("Daily gourmet breakfast included\nFresh tropical juices & coffee");
    setIsAddOpen(true);
  };

  const openEditModal = (pkg: PackageType) => {
    setEditingPackage(pkg);
    setFormId(pkg.id);
    setFormName(pkg.name);
    setFormDescription(pkg.description);
    setFormMarkup(pkg.priceMarkupPercentage || 0);
    setFormPerPersonDay(pkg.pricePerPersonPerDay || 0);
    setFormHighlightsText((pkg.highlights || []).join("\n"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSubmitting(true);
    try {
      const highlights = formHighlightsText
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0);

      await onSavePackage({
        id: formId,
        name: formName.trim(),
        description: formDescription.trim(),
        priceMarkupPercentage: Number(formMarkup),
        pricePerPersonPerDay: Number(formPerPersonDay),
        highlights,
        isActive: true
      });

      setIsAddOpen(false);
      setEditingPackage(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-brand-teal mb-1">
            <Coffee className="w-4 h-4 text-brand-gold" />
            <span>Culinary &amp; Meal Plans</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
            Boarding Packages Management
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Configure Room Only, Bed &amp; Breakfast, Half Board, and Full Board rates and inclusions.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-teal text-white font-bold text-xs uppercase tracking-widest hover:bg-brand-teal-dark transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Boarding Plan</span>
        </button>
      </div>

      {/* PACKAGES CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div key={pkg.id} className="bg-white border border-stone-200 flex flex-col justify-between p-6 shadow-xs hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[9px] uppercase px-2 py-0.5 bg-stone-100 text-stone-600 border border-stone-200">
                    ID: {pkg.id}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-stone-900 mt-1">
                    {pkg.name}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-xl font-serif font-bold text-brand-teal">
                    {pkg.pricePerPersonPerDay > 0 ? `+$${pkg.pricePerPersonPerDay}` : "Free"}
                  </div>
                  <div className="text-[10px] text-stone-400">/ person / day</div>
                </div>
              </div>

              <p className="text-xs text-stone-600 font-light leading-relaxed">
                {pkg.description}
              </p>

              {pkg.priceMarkupPercentage > 0 && (
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-1 border border-amber-200">
                  <Percent className="w-3 h-3 text-amber-700" />
                  <span>+{pkg.priceMarkupPercentage}% Seasonal Room Markup</span>
                </div>
              )}

              {pkg.highlights && pkg.highlights.length > 0 && (
                <ul className="space-y-1.5 pt-3 border-t border-stone-100 text-xs text-stone-500">
                  {pkg.highlights.map((h, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                onClick={() => openEditModal(pkg)}
                className="px-3.5 py-1.5 text-xs font-bold text-stone-700 bg-white border border-stone-300 hover:border-stone-500 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-stone-500" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => onDeletePackage(pkg.id)}
                className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                title="Remove package"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ADD / EDIT MODAL */}
      {(isAddOpen || editingPackage) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg p-6 border border-stone-300 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                {editingPackage ? "Edit Boarding Package" : "Create Boarding Package"}
              </h3>
              <button onClick={() => { setIsAddOpen(false); setEditingPackage(null); }} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">Package Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bed &amp; Breakfast, Half Board"
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
                  placeholder="Describe meal inclusions, restaurants, and timing..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">Price / Person / Day ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formPerPersonDay}
                    onChange={(e) => setFormPerPersonDay(Number(e.target.value))}
                    className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">Room Markup (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formMarkup}
                    onChange={(e) => setFormMarkup(Number(e.target.value))}
                    className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">Inclusions &amp; Highlights (1 per line)</label>
                <textarea
                  rows={4}
                  placeholder="Daily gourmet breakfast&#10;Fresh squeezed Mombasa juices&#10;Served at poolside terrace"
                  value={formHighlightsText}
                  onChange={(e) => setFormHighlightsText(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => { setIsAddOpen(false); setEditingPackage(null); }}
                  className="px-4 py-2 font-bold uppercase tracking-wider text-stone-500 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-brand-teal text-white font-bold uppercase tracking-widest hover:bg-brand-teal-dark transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
