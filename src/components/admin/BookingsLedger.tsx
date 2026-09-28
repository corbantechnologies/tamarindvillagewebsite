import React, { useState } from "react";
import { 
  Calendar, Search, Filter, Plus, Trash2, CheckCircle, 
  LogIn, LogOut, X, Hotel, Phone, Mail, DollarSign, 
  CreditCard, FileText, ArrowRight 
} from "lucide-react";
import { BookingRecord, ApartmentType } from "../../types";

interface BookingsLedgerProps {
  bookings: BookingRecord[];
  apartments: ApartmentType[];
  onUpdateStatus: (id: string, newStatus: "confirmed" | "checked_in" | "checked_out" | "cancelled") => Promise<void>;
  onDeleteBooking: (id: string) => Promise<void>;
  onCreateBooking: (bookingData: any) => Promise<void>;
  userRole: string;
}

export default function BookingsLedger({
  bookings,
  apartments,
  onUpdateStatus,
  onDeleteBooking,
  onCreateBooking,
  userRole
}: BookingsLedgerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New booking form state
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [selectedApartmentId, setSelectedApartmentId] = useState(apartments[0]?.id || "1-bedroom");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [totalAmount, setTotalAmount] = useState(160);
  const [currency, setCurrency] = useState("USD");
  const [paymentStatus, setPaymentStatus] = useState<"unpaid" | "deposit_paid" | "paid">("unpaid");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculations
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = searchTerm === "" ||
      b.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.bookingReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.apartmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.guestEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || b.bookingStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  const confirmedCount = bookings.filter(b => b.bookingStatus === "confirmed").length;
  const inHouseCount = bookings.filter(b => b.bookingStatus === "checked_in").length;

  const handleSubmitNewBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !checkIn || !checkOut) return;
    setIsSubmitting(true);
    try {
      const apt = apartments.find(a => a.id === selectedApartmentId);
      await onCreateBooking({
        guestName,
        guestEmail,
        guestPhone,
        apartmentId: selectedApartmentId,
        apartmentName: apt?.name || "Luxury Apartment Suite",
        checkIn,
        checkOut,
        adults: Number(adults),
        children: Number(children),
        totalAmount: Number(totalAmount),
        currency,
        paymentStatus,
        bookingStatus: "confirmed",
        specialRequests
      });

      // Reset
      setIsAddModalOpen(false);
      setGuestName("");
      setGuestEmail("");
      setGuestPhone("");
      setSpecialRequests("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER & METRICS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-brand-teal mb-1">
            <Calendar className="w-4 h-4 text-brand-gold" />
            <span>Reservations &amp; Stays Ledger</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
            Confirmed Bookings Management
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Full view of all reservation records, guest stays, and financial status.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-teal text-white font-bold text-xs uppercase tracking-widest hover:bg-brand-teal-dark transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Reservation</span>
        </button>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 border border-stone-200">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Total Bookings</div>
          <div className="text-2xl font-serif font-bold text-stone-900 mt-1">{bookings.length}</div>
        </div>
        <div className="bg-white p-4 border border-stone-200">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Confirmed &amp; Upcoming</div>
          <div className="text-2xl font-serif font-bold text-amber-800 mt-1">{confirmedCount}</div>
        </div>
        <div className="bg-white p-4 border border-stone-200">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">In-House Active</div>
          <div className="text-2xl font-serif font-bold text-emerald-800 mt-1">{inHouseCount}</div>
        </div>
        <div className="bg-white p-4 border border-stone-200">
          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-teal">Ledger Total ($)</div>
          <div className="text-2xl font-serif font-bold text-brand-teal mt-1">${totalRevenue.toLocaleString()}</div>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
          <input
            type="text"
            placeholder="Search by guest name, reference (TV-...), email, or apartment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 bg-white border border-stone-200 focus:outline-none focus:border-brand-teal text-stone-800"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto bg-white p-1 border border-stone-200">
          {["all", "confirmed", "checked_in", "checked_out", "cancelled"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? "bg-brand-teal text-white"
                  : "text-stone-500 hover:text-stone-900"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* BOOKINGS TABLE */}
      <div className="bg-white border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
                <th className="py-3 px-4">Ref #</th>
                <th className="py-3 px-4">Guest Information</th>
                <th className="py-3 px-4">Suite Assigned</th>
                <th className="py-3 px-4">Stay Dates</th>
                <th className="py-3 px-4">Amount / Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-stone-50/70 transition-colors">
                    {/* Ref */}
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                      {b.bookingReference}
                    </td>

                    {/* Guest */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900">{b.guestName}</div>
                      <div className="text-[11px] text-stone-500 flex flex-wrap items-center gap-2 mt-0.5">
                        {b.guestEmail && <span>{b.guestEmail}</span>}
                        {b.guestPhone && <span>&bull; {b.guestPhone}</span>}
                      </div>
                    </td>

                    {/* Suite */}
                    <td className="py-3.5 px-4 font-medium text-stone-800">
                      {b.apartmentName}
                      <div className="text-[10px] text-stone-400">
                        {b.adults} Adults{b.children > 0 ? `, ${b.children} Children` : ""}
                      </div>
                    </td>

                    {/* Dates */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-stone-800">{b.checkIn}</div>
                      <div className="text-[10px] text-stone-400">&rarr; {b.checkOut}</div>
                    </td>

                    {/* Amount & Payment */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900">
                        ${b.totalAmount} <span className="text-[10px] text-stone-400 font-normal">{b.currency}</span>
                      </div>
                      <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-none mt-0.5 ${
                        b.paymentStatus === "paid" 
                          ? "bg-emerald-100 text-emerald-800" 
                          : b.paymentStatus === "deposit_paid" 
                            ? "bg-sky-100 text-sky-800" 
                            : "bg-amber-100 text-amber-800"
                      }`}>
                        {b.paymentStatus.replace("_", " ")}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider border ${
                        b.bookingStatus === "checked_in"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : b.bookingStatus === "checked_out"
                            ? "bg-stone-100 text-stone-600 border-stone-300"
                            : b.bookingStatus === "cancelled"
                              ? "bg-rose-50 text-rose-700 border-rose-300"
                              : "bg-amber-50 text-amber-800 border-amber-300"
                      }`}>
                        {b.bookingStatus.replace("_", " ")}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.bookingStatus === "confirmed" && (
                          <button
                            onClick={() => onUpdateStatus(b.id, "checked_in")}
                            className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                            title="Check-in guest"
                          >
                            Check In
                          </button>
                        )}
                        {b.bookingStatus === "checked_in" && (
                          <button
                            onClick={() => onUpdateStatus(b.id, "checked_out")}
                            className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                            title="Check-out guest"
                          >
                            Check Out
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteBooking(b.id)}
                          className="p-1 hover:bg-stone-100 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Cancel/Delete booking"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <Calendar className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-600">No bookings match your filter</p>
                    <p className="text-[11px] text-stone-400 mt-1">Use the New Reservation button to add a booking.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE BOOKING MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg p-6 border border-stone-300 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-serif text-lg font-bold text-stone-900">New Direct Reservation</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewBooking} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">Guest Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="guest@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">Phone / WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="+254 7..."
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">Suite Category *</label>
                <select
                  value={selectedApartmentId}
                  onChange={(e) => setSelectedApartmentId(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal bg-white"
                >
                  {apartments.map(apt => (
                    <option key={apt.id} value={apt.id}>
                      {apt.name} — ${apt.pricePerNight}/night
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">Check-in Date *</label>
                  <input
                    type="date"
                    required
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">Check-out Date *</label>
                  <input
                    type="date"
                    required
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">Total ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(Number(e.target.value))}
                    className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal bg-white"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="deposit_paid">Deposit Paid</option>
                    <option value="paid">Fully Paid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">Special Requests</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Late checkout, ocean view preference, airport transfer requested"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-bold uppercase tracking-wider text-stone-500 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-brand-teal text-white font-bold uppercase tracking-widest hover:bg-brand-teal-dark transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Create Reservation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
