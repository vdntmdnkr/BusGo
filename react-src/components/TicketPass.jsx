import React from 'react';

export default function TicketPass({ ticketData, onReset }) {
  if (!ticketData) return null;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold mb-2">
          ✓
        </div>
        <h2 className="text-xl font-black text-slate-900">Booking Confirmed & Validated!</h2>
        <p className="text-xs text-slate-500">
          All client-side validation rules passed. Below is your official A4 Printable E-Ticket.
        </p>
      </div>

      {/* Printable Boarding Pass Card */}
      <div
        id="printable-ticket"
        className="border-2 border-dashed border-indigo-300 rounded-2xl p-6 bg-indigo-50/20 max-w-2xl mx-auto mb-6 shadow-sm"
      >
        <div className="flex justify-between items-start border-b border-indigo-100 pb-4 mb-4">
          <div>
            <h3 className="text-2xl font-black text-indigo-700 tracking-tight">BusGo Express</h3>
            <p className="text-xs text-slate-500 font-medium">Smart Travel E-Ticket & Boarding Pass</p>
          </div>
          <div className="text-right">
            <span className="text-xs bg-indigo-600 text-white font-mono px-3 py-1 rounded-lg font-bold shadow-sm">
              {ticketData.pnr}
            </span>
            <p className="text-[10px] text-slate-400 mt-1">Booked: {ticketData.bookedOn}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs mb-5">
          <div>
            <span className="text-slate-400 font-medium block">Route:</span>
            <p className="font-bold text-slate-800 text-sm mt-0.5">
              {ticketData.search.from} &rarr; {ticketData.search.to}
            </p>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Travel Date:</span>
            <p className="font-bold text-slate-800 text-sm mt-0.5">{ticketData.search.date}</p>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Allocated Seats:</span>
            <p className="font-bold text-indigo-700 text-sm mt-0.5">{ticketData.seats.join(', ')}</p>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Coach Service:</span>
            <p className="font-bold text-slate-800 mt-0.5">{ticketData.bus.name}</p>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Primary Passenger:</span>
            <p className="font-bold text-slate-800 mt-0.5">
              {ticketData.passenger.fullName} ({ticketData.passenger.age}y, {ticketData.passenger.gender})
            </p>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Verified Phone:</span>
            <p className="font-mono text-slate-800 mt-0.5">
              {ticketData.passenger.countryCode} {ticketData.passenger.phone}
            </p>
          </div>
        </div>

        <div className="border-t border-indigo-100 pt-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white border border-indigo-200 rounded-lg flex items-center justify-center font-mono text-[9px] text-indigo-900 font-bold text-center leading-tight">
              [BUSGO<br/>QR-SEC]
            </div>
            <div className="text-[11px] text-slate-500">
              <span className="font-bold text-slate-700">Digital Verification Gate</span>
              <p>Scan boarding QR on coach arrival.</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Total Amount Paid</span>
            <span className="text-base font-black text-emerald-700">₹{ticketData.payment.netPaid}</span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition shadow-md shadow-indigo-200 flex items-center gap-2"
        >
          🖨️ Print / Download Ticket as PDF
        </button>
        <button
          type="button"
          onClick={onReset}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-6 rounded-xl text-sm transition"
        >
          Book Another Ticket
        </button>
      </div>
    </div>
  );
}
