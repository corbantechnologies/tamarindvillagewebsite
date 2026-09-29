import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar, Plus, Trash2, Settings, RefreshCw, CheckCircle,
  XCircle, AlertTriangle, Layers, Edit3, Save, X
} from "lucide-react";
import toast from "react-hot-toast";

interface InventoryItem {
  id: string;
  totalUnits: number;
  notes?: string;
  updatedAt?: string;
}

interface AvailabilityBlock {
  id: string;
  apartmentId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  blockedBy?: string;
  createdAt?: string;
}

interface Apartment {
  id: string;
  name: string;
}

interface Props {
  apartments: Apartment[];
  currentUserName: string;
}

const REASONS = [
  "Maintenance / Refurbishment",
  "Reserved — Opera Booking",
  "Staff Use",
  "Property Closed",
  "Custom"
];

export default function AvailabilityManager({ apartments, currentUserName }: Props) {
  const [activeTab, setActiveTab] = useState<"inventory" | "blocks">("inventory");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(false);

  // Inventory edit
  const [editingInv, setEditingInv] = useState<Record<string, number>>({});

  // New block form
  const [blockApartmentId, setBlockApartmentId] = useState("all");
  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [blockReason, setBlockReason] = useState(REASONS[0]);
  const [blockCustomReason, setBlockCustomReason] = useState("");
  const [addingBlock, setAddingBlock] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, blockRes] = await Promise.all([
        fetch("/api/inventory"),
        fetch("/api/availability/blocks")
      ]);
      const invData = await invRes.json();
      const blockData = await blockRes.json();
      if (invData.success) setInventory(invData.inventory || []);
      if (blockData.success) setBlocks(blockData.blocks || []);
    } catch (e) {
      toast.error("Failed to load availability data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Initialize edit state from loaded inventory
  useEffect(() => {
    const map: Record<string, number> = {};
    apartments.forEach(apt => {
      const inv = inventory.find(i => i.id === apt.id);
      map[apt.id] = inv?.totalUnits ?? 1;
    });
    setEditingInv(map);
  }, [inventory, apartments]);

  const handleSaveInventory = async (aptId: string) => {
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartmentId: aptId,
          totalUnits: editingInv[aptId] ?? 1,
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Inventory updated.");
      fetchData();
    } catch (e: any) {
      toast.error("Failed to save inventory: " + e.message);
    }
  };

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockStart || !blockEnd) { toast.error("Please select start and end dates."); return; }
    if (blockStart >= blockEnd) { toast.error("End date must be after start date."); return; }
    setAddingBlock(true);
    try {
      const reasonText = blockReason === "Custom" ? blockCustomReason : blockReason;
      const res = await fetch("/api/availability/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartmentId: blockApartmentId,
          startDate: blockStart,
          endDate: blockEnd,
          reason: reasonText,
          blockedBy: currentUserName
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Dates blocked successfully.");
      setShowBlockForm(false);
      setBlockStart(""); setBlockEnd(""); setBlockReason(REASONS[0]);
      fetchData();
    } catch (e: any) {
      toast.error("Failed to block dates: " + e.message);
    } finally {
      setAddingBlock(false);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    if (!window.confirm("Remove this date block?")) return;
    try {
      const res = await fetch(`/api/availability/blocks/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Block removed.");
      fetchData();
    } catch (e: any) {
      toast.error("Failed to remove block: " + e.message);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const activeBlocks = useMemo(
    () => blocks.filter(b => b.endDate >= todayStr),
    [blocks, todayStr]
  );
  const pastBlocks = useMemo(
    () => blocks.filter(b => b.endDate < todayStr),
    [blocks, todayStr]
  );

  const getAptName = (id: string) =>
    id === "all" ? "All Apartments" : apartments.find(a => a.id === id)?.name || id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-brand-teal mb-1">
            <Calendar className="w-4 h-4 text-brand-gold" />
            <span>Availability & Unit Management</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
            Room Inventory & Date Blocks
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Set how many units of each type you have, and block out dates for maintenance or Opera reservations.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-stone-300 text-xs font-bold uppercase tracking-widest hover:bg-stone-50 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 bg-white">
        {(["inventory", "blocks"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors cursor-pointer ${
              activeTab === tab
                ? "border-brand-teal text-brand-teal bg-teal-50"
                : "border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50"
            }`}
          >
            {tab === "inventory" ? "Unit Inventory" : "Date Blocks"}
          </button>
        ))}
      </div>

      {/* INVENTORY TAB */}
      {activeTab === "inventory" && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 flex gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>How this works:</strong> Set the total number of physical units you have for each apartment type.
              When bookings are confirmed through the website, the system automatically tracks occupancy and shows guests
              whether units are available for their dates.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {apartments.map(apt => {
              const inv = inventory.find(i => i.id === apt.id);
              const total = editingInv[apt.id] ?? inv?.totalUnits ?? 1;
              return (
                <div key={apt.id} className="bg-white border border-stone-200 p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-teal mb-1">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Unit Type</span>
                      </div>
                      <h3 className="font-serif font-bold text-stone-900 text-sm leading-tight">{apt.name}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-stone-900">{total}</div>
                      <div className="text-[10px] text-stone-500">total unit{total !== 1 ? "s" : ""}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-600 shrink-0">
                      Units Available
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={editingInv[apt.id] ?? 1}
                      onChange={e => setEditingInv(prev => ({ ...prev, [apt.id]: Number(e.target.value) }))}
                      className="flex-1 text-center text-sm px-2 py-1.5 border border-stone-300 focus:outline-none focus:border-brand-teal font-bold"
                    />
                    <button
                      onClick={() => handleSaveInventory(apt.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-brand-teal text-white text-[10px] font-bold uppercase tracking-widest hover:bg-teal-700 transition-colors cursor-pointer"
                    >
                      <Save className="w-3 h-3" />
                      Save
                    </button>
                  </div>

                  {inv?.updatedAt && (
                    <p className="text-[10px] text-stone-400">
                      Last updated: {new Date(inv.updatedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BLOCKS TAB */}
      {activeTab === "blocks" && (
        <div className="space-y-4">
          {/* Add Block Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowBlockForm(v => !v)}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-teal text-white text-xs font-bold uppercase tracking-widest hover:bg-teal-700 transition-colors cursor-pointer"
            >
              {showBlockForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showBlockForm ? "Cancel" : "Block Dates"}
            </button>
          </div>

          {/* Add Block Form */}
          {showBlockForm && (
            <div className="bg-white border border-stone-200 p-6">
              <h3 className="text-sm font-bold text-stone-900 mb-4">Block Out Dates</h3>
              <form onSubmit={handleAddBlock} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Suite / Property
                  </label>
                  <select
                    value={blockApartmentId}
                    onChange={e => setBlockApartmentId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-stone-300 bg-stone-50 focus:outline-none focus:border-brand-teal"
                  >
                    <option value="all">All Apartments (Property Closed)</option>
                    {apartments.map(apt => (
                      <option key={apt.id} value={apt.id}>{apt.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Reason
                  </label>
                  <select
                    value={blockReason}
                    onChange={e => setBlockReason(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-stone-300 bg-stone-50 focus:outline-none focus:border-brand-teal"
                  >
                    {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {blockReason === "Custom" && (
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Describe the reason..."
                      value={blockCustomReason}
                      onChange={e => setBlockCustomReason(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-stone-300 bg-stone-50 focus:outline-none focus:border-brand-teal"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={blockStart}
                    min={todayStr}
                    onChange={e => setBlockStart(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 border border-stone-300 bg-stone-50 focus:outline-none focus:border-brand-teal"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={blockEnd}
                    min={blockStart || todayStr}
                    onChange={e => setBlockEnd(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 border border-stone-300 bg-stone-50 focus:outline-none focus:border-brand-teal"
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowBlockForm(false)}
                    className="px-4 py-2 border border-stone-300 text-xs font-bold uppercase tracking-widest text-stone-600 hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingBlock}
                    className="flex items-center gap-2 px-5 py-2 bg-red-700 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-800 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {addingBlock ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                    Confirm Block
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Active Blocks */}
          <div className="bg-white border border-stone-200">
            <div className="px-5 py-3 border-b border-stone-100 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-700">
                Active Blocks ({activeBlocks.length})
              </h3>
            </div>
            {activeBlocks.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                No dates are currently blocked. All units are open for inquiries.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {activeBlocks.map(block => (
                  <div key={block.id} className="flex items-center justify-between px-5 py-3 hover:bg-stone-50">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-900">{getAptName(block.apartmentId)}</span>
                        {block.apartmentId === "all" && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] font-bold uppercase">PROPERTY-WIDE</span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {block.startDate} → {block.endDate}
                        {block.reason && <span className="ml-2 text-stone-400">· {block.reason}</span>}
                      </div>
                      {block.blockedBy && (
                        <div className="text-[10px] text-stone-400">Blocked by: {block.blockedBy}</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="p-1.5 hover:bg-red-50 hover:text-red-600 text-stone-400 transition-colors cursor-pointer rounded"
                      title="Remove block"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Blocks */}
          {pastBlocks.length > 0 && (
            <div className="bg-white border border-stone-200 opacity-70">
              <div className="px-5 py-3 border-b border-stone-100">
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">
                  Past Blocks ({pastBlocks.length})
                </h3>
              </div>
              <div className="divide-y divide-stone-100">
                {pastBlocks.slice(0, 5).map(block => (
                  <div key={block.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <span className="text-xs text-stone-500 line-through">{getAptName(block.apartmentId)}</span>
                      <div className="text-[11px] text-stone-400">{block.startDate} → {block.endDate}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="p-1.5 hover:bg-red-50 hover:text-red-500 text-stone-300 cursor-pointer rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
