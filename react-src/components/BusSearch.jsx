import React, { useState } from 'react';

export const BUS_LIST = [
  { id: 1, name: 'Zingbus Express AC Sleeper (2+1)', type: 'Premium Luxury Sleeper', dept: '21:00', arr: '06:30', duration: '9h 30m', fare: 850, rating: 4.8, seatsAvail: 18 },
  { id: 2, name: 'IntrCity SmartBus Volvo Multi-Axle', type: 'AC Semi-Sleeper (2+2)', dept: '22:15', arr: '07:45', duration: '9h 30m', fare: 1100, rating: 4.9, seatsAvail: 12 },
  { id: 3, name: 'Greenline Travels Bharat Benz AC', type: 'Luxury Sleeper with WiFi', dept: '23:30', arr: '08:45', duration: '9h 15m', fare: 950, rating: 4.6, seatsAvail: 24 }
];

export default function BusSearch({ onSearchComplete, initialSearch, selectedBus, onSelectBus }) {
  const [formData, setFormData] = useState(initialSearch || {
    from: 'Mumbai',
    to: 'Goa',
    date: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = (data = formData) => {
    const newErrors = {};
    const today = new Date().toISOString().split('T')[0];

    if (!data.from || !data.from.trim()) {
      newErrors.from = 'Departure city is required.';
    } else if (data.from.trim().length < 3) {
      newErrors.from = 'City name must have at least 3 characters.';
    }

    if (!data.to || !data.to.trim()) {
      newErrors.to = 'Destination city is required.';
    } else if (data.to.trim().length < 3) {
      newErrors.to = 'City name must have at least 3 characters.';
    }

    if (data.from && data.to && data.from.trim().toLowerCase() === data.to.trim().toLowerCase()) {
      newErrors.to = 'Source and Destination cities cannot be the same.';
    }

    if (!data.date) {
      newErrors.date = 'Journey date is required.';
    } else if (data.date < today) {
      newErrors.date = 'Travel date cannot be in the past.';
    }

    return newErrors;
  };

  const handleChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    if (touched[field]) {
      const errs = validate(updated);
      setErrors(prev => ({ ...prev, [field]: errs[field] }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const errs = validate();
    setErrors(prev => ({ ...prev, [field]: errs[field] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ from: true, to: true, date: true });
    const errs = validate();
    setErrors(errs);

    if (Object.keys(errs).length === 0) {
      onSearchComplete(formData);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <span className="text-xl">🔍</span>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Step 1: Search Route & Validate Journey</h2>
          <p className="text-xs text-slate-500">Client-side validation verifies departure, destination mismatch, and date integrity.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {/* FROM */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              From (Departure City) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.from}
              onChange={(e) => handleChange('from', e.target.value)}
              onBlur={() => handleBlur('from')}
              placeholder="e.g. Mumbai"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition outline-none ${
                touched.from && errors.from
                  ? 'border-rose-500 bg-rose-50/40 text-rose-900 focus:ring-2 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
              }`}
            />
            {touched.from && errors.from && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.from}</p>
            )}
          </div>

          {/* TO */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              To (Destination City) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.to}
              onChange={(e) => handleChange('to', e.target.value)}
              onBlur={() => handleBlur('to')}
              placeholder="e.g. Goa"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition outline-none ${
                touched.to && errors.to
                  ? 'border-rose-500 bg-rose-50/40 text-rose-900 focus:ring-2 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
              }`}
            />
            {touched.to && errors.to && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.to}</p>
            )}
          </div>

          {/* DATE */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Date of Journey <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              onBlur={() => handleBlur('date')}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition outline-none ${
                touched.date && errors.date
                  ? 'border-rose-500 bg-rose-50/40 text-rose-900 focus:ring-2 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
              }`}
            />
            {touched.date && errors.date && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.date}</p>
            )}
          </div>
        </div>

        {/* AVAILABLE BUSES LIST */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Select Your Bus Operator & Fleet
          </label>
          <div className="space-y-3">
            {BUS_LIST.map((bus) => {
              const isSelected = selectedBus && selectedBus.id === bus.id;
              return (
                <div
                  key={bus.id}
                  onClick={() => onSelectBus(bus)}
                  className={`p-4 rounded-xl border cursor-pointer transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-sm ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-indigo-300 bg-slate-50/30'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{bus.name}</h4>
                      <span className="text-[11px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                        ★ {bus.rating}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {bus.type} &bull; Departs {bus.dept} &rarr; Arrives {bus.arr} ({bus.duration})
                    </p>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto">
                    <span className="text-base font-black text-indigo-700">₹{bus.fare}</span>
                    <span className="text-xs text-slate-400 font-medium">{bus.seatsAvail} seats left</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition shadow-md shadow-indigo-200"
          >
            Confirm Route & Choose Seats &rarr;
          </button>
        </div>
      </form>
    </div>
  );
}
