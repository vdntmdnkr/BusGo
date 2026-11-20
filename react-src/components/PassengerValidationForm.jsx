import React, { useState } from 'react';

export const COUNTRY_DATA = [
  { code: '+91', name: 'India', flag: '🇮🇳', len: 10, pattern: /^[6-9]\d{9}$/, placeholder: '9876543210', hint: '10 digits starting with 6, 7, 8, or 9' },
  { code: '+1', name: 'USA / Canada', flag: '🇺🇸', len: 10, pattern: /^\d{10}$/, placeholder: '2025550143', hint: '10 numeric digits' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧', len: 10, pattern: /^[1-9]\d{9}$/, placeholder: '7911123456', hint: '10 digits starting with non-zero' },
  { code: '+971', name: 'United Arab Emirates', flag: '🇦🇪', len: 9, pattern: /^[5]\d{8}$/, placeholder: '501234567', hint: '9 digits starting with 5' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬', len: 8, pattern: /^[89]\d{7}$/, placeholder: '81234567', hint: '8 digits starting with 8 or 9' }
];

export default function PassengerValidationForm({ passengerData, onUpdate, onProceed, onBack }) {
  const [formData, setFormData] = useState(passengerData || {
    fullName: 'Vedant Sharma',
    email: 'vedant@example.com',
    countryCode: '+91',
    phone: '9876543210',
    age: '21',
    gender: 'Male',
    termsAccepted: true
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Individual Field Validator
  const validateField = (field, value, state = formData) => {
    let err = '';

    if (field === 'fullName') {
      if (!value || !value.trim()) {
        err = 'Full Name is required.';
      } else if (!/^[A-Za-z\s]{3,40}$/.test(value.trim())) {
        err = 'Must contain only letters and spaces (3-40 characters).';
      }
    }

    if (field === 'email') {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!value || !value.trim()) {
        err = 'Email address is required.';
      } else if (!emailRegex.test(value.trim())) {
        err = 'Please enter a valid email format (e.g. name@domain.com).';
      }
    }

    if (field === 'phone') {
      const country = COUNTRY_DATA.find(c => c.code === state.countryCode) || COUNTRY_DATA[0];
      const cleanPhone = (value || '').replace(/\D/g, '');
      if (!cleanPhone) {
        err = 'Mobile phone number is required.';
      } else if (!country.pattern.test(cleanPhone)) {
        err = `Invalid format for ${country.name}. Format: ${country.hint}.`;
      }
    }

    if (field === 'age') {
      const num = parseInt(value, 10);
      if (!value) {
        err = 'Passenger age is required.';
      } else if (isNaN(num) || num < 5 || num > 100) {
        err = 'Age must be between 5 and 100 years.';
      }
    }

    if (field === 'gender') {
      if (!value) err = 'Gender selection is required.';
    }

    if (field === 'termsAccepted') {
      if (!value) err = 'You must accept the terms and conditions.';
    }

    return err;
  };

  const validateAll = () => {
    const fields = ['fullName', 'email', 'phone', 'age', 'gender', 'termsAccepted'];
    const newErrors = {};
    fields.forEach(f => {
      const e = validateField(f, formData[f], formData);
      if (e) newErrors[f] = e;
    });
    setErrors(newErrors);
    setTouched(fields.reduce((acc, k) => ({ ...acc, [k]: true }), {}));
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onUpdate(updated);

    if (touched[field]) {
      setErrors(prev => ({ ...prev, [field]: validateField(field, value, updated) }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validateField(field, formData[field], formData) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateAll()) {
      onProceed();
    }
  };

  const activeCountry = COUNTRY_DATA.find(c => c.code === formData.countryCode) || COUNTRY_DATA[0];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-100">
        <span className="text-xl">👤</span>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Step 3: Passenger Information & Live Validation</h2>
          <p className="text-xs text-slate-500">
            Real-time regex checking for Full Name, Email RFC 5322, and International Phone Numbers.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">
            Primary Passenger Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            onBlur={() => handleBlur('fullName')}
            placeholder="Legal name as per Government ID"
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition outline-none ${
              touched.fullName && errors.fullName
                ? 'border-rose-500 bg-rose-50/40 text-rose-900 focus:ring-2 focus:ring-rose-200'
                : touched.fullName && !errors.fullName
                ? 'border-emerald-500 bg-emerald-50/20 text-slate-900 focus:ring-2 focus:ring-emerald-200'
                : 'border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
            }`}
          />
          {touched.fullName && errors.fullName && (
            <p className="text-xs text-rose-500 mt-1 font-medium">⚠️ {errors.fullName}</p>
          )}
          {touched.fullName && !errors.fullName && (
            <p className="text-xs text-emerald-600 mt-1 font-medium">✓ Valid Name</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">
            Email Address for E-Ticket Delivery <span className="text-rose-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            placeholder="passenger@domain.com"
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition outline-none ${
              touched.email && errors.email
                ? 'border-rose-500 bg-rose-50/40 text-rose-900 focus:ring-2 focus:ring-rose-200'
                : touched.email && !errors.email
                ? 'border-emerald-500 bg-emerald-50/20 text-slate-900 focus:ring-2 focus:ring-emerald-200'
                : 'border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
            }`}
          />
          {touched.email && errors.email && (
            <p className="text-xs text-rose-500 mt-1 font-medium">⚠️ {errors.email}</p>
          )}
          {touched.email && !errors.email && (
            <p className="text-xs text-emerald-600 mt-1 font-medium">✓ Valid Email Address</p>
          )}
        </div>

        {/* International Phone Number */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">
            Mobile Number (International RegEx Validation) <span className="text-rose-500">*</span>
          </label>
          <div className="flex gap-2">
            <select
              value={formData.countryCode}
              onChange={(e) => {
                const code = e.target.value;
                const updated = { ...formData, countryCode: code };
                setFormData(updated);
                onUpdate(updated);
                if (touched.phone) {
                  setErrors(prev => ({ ...prev, phone: validateField('phone', formData.phone, updated) }));
                }
              }}
              className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none focus:border-indigo-600"
            >
              {COUNTRY_DATA.map(c => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code} ({c.name})
                </option>
              ))}
            </select>

            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, ''))}
              onBlur={() => handleBlur('phone')}
              placeholder={activeCountry.placeholder}
              className={`flex-1 px-3.5 py-2.5 rounded-xl border text-sm transition outline-none ${
                touched.phone && errors.phone
                  ? 'border-rose-500 bg-rose-50/40 text-rose-900 focus:ring-2 focus:ring-rose-200'
                : touched.phone && !errors.phone
                ? 'border-emerald-500 bg-emerald-50/20 text-slate-900 focus:ring-2 focus:ring-emerald-200'
                : 'border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
              }`}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Requirement for {activeCountry.name}: <span className="font-semibold text-slate-600">{activeCountry.hint}</span>
          </p>
          {touched.phone && errors.phone && (
            <p className="text-xs text-rose-500 mt-1 font-medium">⚠️ {errors.phone}</p>
          )}
          {touched.phone && !errors.phone && (
            <p className="text-xs text-emerald-600 mt-1 font-medium">✓ Valid Phone Number</p>
          )}
        </div>

        {/* Age & Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Age (Years) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="5"
              max="100"
              value={formData.age}
              onChange={(e) => handleChange('age', e.target.value)}
              onBlur={() => handleBlur('age')}
              placeholder="e.g. 24"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition outline-none ${
                touched.age && errors.age
                  ? 'border-rose-500 bg-rose-50/40 text-rose-900'
                  : 'border-slate-300 focus:border-indigo-600'
              }`}
            />
            {touched.age && errors.age && (
              <p className="text-xs text-rose-500 mt-1 font-medium">⚠️ {errors.age}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Gender <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white outline-none focus:border-indigo-600"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Terms Checkbox */}
        <div className="pt-2">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.termsAccepted}
              onChange={(e) => handleChange('termsAccepted', e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
            />
            <span className="text-xs text-slate-700">
              I certify that all passenger details provided above are accurate and match Government ID.
            </span>
          </label>
          {touched.termsAccepted && errors.termsAccepted && (
            <p className="text-xs text-rose-500 mt-1 font-medium">⚠️ {errors.termsAccepted}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onBack}
            className="text-slate-600 hover:text-slate-900 text-sm font-semibold px-4 py-2"
          >
            &larr; Back to Seats
          </button>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition shadow-md shadow-indigo-200"
          >
            Proceed to Payment & Review &rarr;
          </button>
        </div>
      </form>
    </div>
  );
}
