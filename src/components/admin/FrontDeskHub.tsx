import React, { useState } from "react";
import { 
  Users, Luggage, LogIn, LogOut, CheckCircle, Search, 
  Phone, Mail, Calendar, Plus, Clock, Hotel, Sparkles 
} from "lucide-react";
import { BookingRecord, ApartmentType } from "../../types";

interface FrontDeskHubProps {
  bookings: BookingRecord[];
  apartments: ApartmentType[];
  onUpdateBookingStatus: (id: string, newStatus: "confirmed" | "checked_in" | "checked_out" | "cancelled") => Promise<void>;
  onOpenNewBooking: () => void;
  canCheckIn: boolean;
}

export default function FrontDeskHub({
  bookings,
  apartments,
  onUpdateBookingStatus,
  onOpenNewBooking,
  canCheckIn
}: FrontDeskHubProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [subView, setSubView] = useState<"arrivals" | "departures" | "inhouse">("arrivals");

  const todayStr = new Date().toISOString().split("T")[0];

  const todayArrivals = bookings.filter(b => b.checkIn === todayStr);
  const todayDepartures = bookings.filter(b => b.checkOut === todayStr);
  const inHouseGuests = bookings.filter(b => b.bookingStatus === "checked_in");

  const filteredArrivals = todayArrivals.filter(b => 
    searchTerm === "" ||
    b.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.apartmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.bookingReference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDepartures = todayDepartures.filter(b => 
    searchTerm === "" ||
    b.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.apartmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.bookingReference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInHouse = inHouseGuests.filter(b => 
    searchTerm === "" ||
    b.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.apartmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.bookingReference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* FRONT DESK HEADER & METRICS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-brand-teal mb-1">
            <Hotel className="w-4 h-4 text-brand-gold" />
            <span>Front Desk &amp; Guest Operations</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
            Daily Operational Board
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Today: <span className="font-semibold text-stone-700">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
          </p>
        </div>

        <button
          onClick={onOpenNewBooking}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-teal text-white font-bold text-xs uppercase tracking-widest hover:bg-brand-teal-dark transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Walk-In / Direct Booking</span>
        </button>
      </div>

      {/* OPERATIONAL KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setSubView("arrivals")}
          className={`p-5 text-left border transition-all cursor-pointer ${
            subView === "arrivals" 
              ? "bg-white border-brand-teal ring-2 ring-brand-teal/20" 
              : "bg-white border-stone-200 hover:border-stone-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Expected Arrivals</span>
            <LogIn className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-serif text-3xl font-bold text-stone-900 mt-2">{todayArrivals.length}</div>
          <div className="text-[11px] text-stone-500 mt-1">Guests checking in today</div>
        </button>

        <button
          onClick={() => setSubView("departures")}
          className={`p-5 text-left border transition-all cursor-pointer ${
            subView === "departures" 
              ? "bg-white border-brand-teal ring-2 ring-brand-teal/20" 
              : "bg-white border-stone-200 hover:border-stone-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Expected Departures</span>
            <LogOut className="w-4 h-4 text-rose-600" />
          </div>
          <div className="font-serif text-3xl font-bold text-stone-900 mt-2">{todayDepartures.length}</div>
          <div className="text-[11px] text-stone-500 mt-1">Check-outs due today</div>
        </button>

        <button
          onClick={() => setSubView("inhouse")}
          className={`p-5 text-left border transition-all cursor-pointer ${
            subView === "inhouse" 
              ? "bg-white border-brand-teal ring-2 ring-brand-teal/20" 
              : "bg-white border-stone-200 hover:border-stone-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">In-House Residents</span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="font-serif text-3xl font-bold text-stone-900 mt-2">{inHouseGuests.length}</div>
          <div className="text-[11px] text-stone-500 mt-1">Currently staying in suites</div>
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
        <input
          type="text"
          placeholder="Search guest by name, room type, or booking reference..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs pl-10 pr-4 py-2.5 bg-white border border-stone-200 focus:outline-none focus:border-brand-teal text-stone-800"
        />
      </div>

      {/* SUBVIEW 1: TODAY'S ARRIVALS */}
      {subView === "arrivals" && (
        <div className="bg-white border border-stone-200">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">
              Arrivals Schedule for Today ({filteredArrivals.length})
            </h3>
            <span className="text-[10px] text-stone-500">Standard Check-in: 2:00 PM</span>
          </div>

          {filteredArrivals.length > 0 ? (
            <div className="divide-y divide-stone-100 overflow-x-auto">
              {filteredArrivals.map(b => (
                <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/60 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-stone-900">{b.guestName}</span>
                      <span className="font-mono text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 border border-stone-200">
                        {b.bookingReference}
                      </span>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 ${
                        b.bookingStatus === "checked_in" 
                          ? "bg-emerald-100 text-emerald-800" 
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {b.bookingStatus.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
                      <span className="flex items-center gap-1 font-semibold text-stone-700">
                        <Hotel className="w-3.5 h-3.5 text-brand-gold" />
                        {b.apartmentName}
                      </span>
                      <span>Guests: {b.adults} Adults{b.children > 0 ? `, ${b.children} Children` : ""}</span>
                      <span>Duration: {b.checkIn} &rarr; {b.checkOut}</span>
                      {b.guestPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-stone-400" />
                          {b.guestPhone}
                        </span>
                      )}
                    </div>

                    {b.specialRequests && (
                      <p className="text-[11px] text-brand-dark/80 bg-amber-50/60 p-2 border-l-2 border-brand-gold">
                        <strong>Guest Requests:</strong> {b.specialRequests}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {b.bookingStatus !== "checked_in" ? (
                      <button
                        onClick={() => onUpdateBookingStatus(b.id, "checked_in")}
                        disabled={!canCheckIn}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Check In Guest</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Checked In</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-stone-400">
              <LogIn className="w-8 h-8 mx-auto text-stone-300 mb-2" />
              <p className="text-xs font-bold uppercase tracking-wider text-stone-600">No arrivals scheduled for today</p>
              <p className="text-[11px] text-stone-400 mt-1">Walk-in guests can be registered using the button above.</p>
            </div>
          )}
        </div>
      )}

      {/* SUBVIEW 2: TODAY'S DEPARTURES */}
      {subView === "departures" && (
        <div className="bg-white border border-stone-200">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">
              Departures Schedule for Today ({filteredDepartures.length})
            </h3>
            <span className="text-[10px] text-stone-500">Standard Check-out: 10:00 AM</span>
          </div>

          {filteredDepartures.length > 0 ? (
            <div className="divide-y divide-stone-100 overflow-x-auto">
              {filteredDepartures.map(b => (
                <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/60 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-stone-900">{b.guestName}</span>
                      <span className="font-mono text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 border border-stone-200">
                        {b.bookingReference}
                      </span>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 ${
                        b.bookingStatus === "checked_out" 
                          ? "bg-stone-100 text-stone-700" 
                          : "bg-rose-100 text-rose-800"
                      }`}>
                        {b.bookingStatus.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
                      <span className="font-semibold text-stone-700">{b.apartmentName}</span>
                      <span>Total: ${b.totalAmount} ({b.paymentStatus.toUpperCase()})</span>
                      {b.guestPhone && <span>{b.guestPhone}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {b.bookingStatus !== "checked_out" ? (
                      <button
                        onClick={() => onUpdateBookingStatus(b.id, "checked_out")}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Check Out Guest</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-stone-500 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Departure Completed</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-stone-400">
              <LogOut className="w-8 h-8 mx-auto text-stone-300 mb-2" />
              <p className="text-xs font-bold uppercase tracking-wider text-stone-600">No departures due today</p>
            </div>
          )}
        </div>
      )}

      {/* SUBVIEW 3: IN-HOUSE GUESTS */}
      {subView === "inhouse" && (
        <div className="bg-white border border-stone-200">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">
              Active In-House Residents ({filteredInHouse.length})
            </h3>
            <span className="text-[10px] text-stone-500">Currently in residence</span>
          </div>

          {filteredInHouse.length > 0 ? (
            <div className="divide-y divide-stone-100 overflow-x-auto">
              {filteredInHouse.map(b => (
                <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/60 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-stone-900">{b.guestName}</span>
                      <span className="font-semibold text-xs text-brand-dark bg-brand-gold/15 px-2 py-0.5 border border-brand-gold/30">
                        {b.apartmentName}
                      </span>
                      <span className="font-mono text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 border border-stone-200">
                        {b.bookingReference}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
                      <span>Staying until: <strong className="text-stone-800">{b.checkOut}</strong></span>
                      <span>Guests: {b.adults} Adults{b.children > 0 ? `, ${b.children} Children` : ""}</span>
                      {b.guestPhone && <span>Tel: {b.guestPhone}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onUpdateBookingStatus(b.id, "checked_out")}
                      className="px-3.5 py-1.5 border border-stone-300 hover:border-stone-500 text-stone-700 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Check Out Early
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-stone-400">
              <Users className="w-8 h-8 mx-auto text-stone-300 mb-2" />
              <p className="text-xs font-bold uppercase tracking-wider text-stone-600">No guests currently marked in-house</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
