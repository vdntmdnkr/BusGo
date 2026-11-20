import React, { useState } from 'react';

const SEAT_LAYOUT = [
  ['A1', 'A2', '', 'A3', 'A4'],
  ['B1', 'B2', '', 'B3', 'B4'],
  ['C1', 'C2', '', 'C3', 'C4'],
  ['D1', 'D2', '', 'D3', 'D4'],
  ['E1', 'E2', '', 'E3', 'E4']
];

export default function SeatMatrix({ selectedBus, selectedSeats, onSeatsChange, onProceed, onBack }) {
  const [error, setError] = useState('');

  const toggleSeat = (seatId) => {
    if (selectedSeats.includes(seatId)) {
      onSeatsChange(selectedSeats.filter(s => s !== seatId));
      setError('');
    } else {
      if (selectedSeats.length >= 4) {
        setError('Seat Selection Limit: You cannot select more than 4 seats in a single booking.');
        return;
      }
      onSeatsChange([...selectedSeats, seatId]);
      setError('');
    }
  };

  const handleNext = () => {
    if (selectedSeats.length === 0) {
      setError('Please select at least 1 seat before proceeding.');
      return;
    }
    setError('');
    onProceed();
  };

  const subtotal = selectedSeats.length * selectedBus.fare;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-100">
        <span className="text-xl">💺</span>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Step 2: Interactive Seat Selection</h2>
          <p className="text-xs text-slate-500">
            Interactive state matrix with quota limit validation (Max 4 seats per booking).
          </p>
        </div>
      </div>

      {/* Bus Header */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs mb-6">
        <div>
          <span className="text-slate-500">Selected Coach: </span>
          <span className="font-bold text-slate-800">{selectedBus.name}</span>
        </div>
        <div>
          <span className="text-slate-500">Fare per seat: </span>
          <span className="font-bold text-indigo-700">₹{selectedBus.fare}</span>
        </div>
      </div>

      {/* Seat Grid Box */}
      <div className="max-w-md mx-auto bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-4 shadow-inner">
        <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-200 text-xs font-bold text-slate-400">
          <span>FRONT OF COACH</span>
          <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded">STEERING WHEEL 🚌</span>
        </div>

        <div className="space-y-2.5">
          {SEAT_LAYOUT.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-between items-center">
              {row.map((seat, cIdx) => {
                if (!seat) {
                  return (
                    <div key={cIdx} className="w-10 text-center text-xs text-slate-300 font-mono">
                      AISLE
                    </div>
                  );
                }
                const isSelected = selectedSeats.includes(seat);
                return (
                  <button
                    key={seat}
                    type="button"
                    onClick={() => toggleSeat(seat)}
                    className={`w-12 h-11 rounded-xl text-xs font-bold transition-all transform active:scale-95 flex items-center justify-center border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-200'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30'
                    }`}
                  >
                    {seat}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-slate-200 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-white border border-slate-300 rounded"></div>
            <span className="text-slate-500">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-indigo-600 rounded"></div>
            <span className="text-slate-800 font-bold">Selected</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl text-center mb-4">
          ⚠️ {error}
        </div>
      )}

      {/* Dynamic Summary Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs mb-6">
        <div>
          <span className="text-slate-500">Chosen Seats ({selectedSeats.length}): </span>
          <span className="font-bold text-indigo-800 text-sm">
            {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None selected'}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Live Subtotal: </span>
          <span className="font-black text-slate-900 text-base">₹{subtotal}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={onBack}
          className="text-slate-600 hover:text-slate-900 text-sm font-semibold px-4 py-2"
        >
          &larr; Back to Route
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition shadow-md shadow-indigo-200"
        >
          Enter Passenger Details &rarr;
        </button>
      </div>
    </div>
  );
}
