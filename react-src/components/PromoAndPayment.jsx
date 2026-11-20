import React, { useState } from 'react';

export default function PromoAndPayment({
  selectedBus,
  selectedSeats,
  passengerData,
  onPaymentSuccess,
  onBack
}) {
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoFeedback, setPromoFeedback] = useState({ message: '', type: '' });

  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'upi'
  const [paymentData, setPaymentData] = useState({
    cardNumber: '4532 8976 1234 5678',
    cardHolder: 'VEDANT SHARMA',
    expiry: '12/28',
    cvv: '891',
    upiId: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const baseFare = selectedBus.fare * selectedSeats.length;
  const gst = Math.round(baseFare * 0.05);
  const netPayable = Math.max(0, baseFare + gst - discount);

  // Promo Code Client Validation
  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setPromoFeedback({ message: 'Please enter a coupon code first.', type: 'error' });
      return;
    }

    if (code === 'FIRST20') {
      if (baseFare < 300) {
        setPromoFeedback({ message: 'FIRST20 requires a minimum booking amount of ₹300.', type: 'error' });
        return;
      }
      const calcDiscount = Math.min(250, Math.round(baseFare * 0.20));
      setDiscount(calcDiscount);
      setPromoFeedback({ message: `Success! Code FIRST20 applied: ₹${calcDiscount} saved.`, type: 'success' });
    } else if (code === 'WEEKEND100') {
      setDiscount(100);
      setPromoFeedback({ message: 'Success! Code WEEKEND100 applied: Flat ₹100 discount.', type: 'success' });
    } else {
      setDiscount(0);
      setPromoFeedback({ message: 'Invalid or expired promo code. Try FIRST20 or WEEKEND100.', type: 'error' });
    }
  };

  // Payment Validation Logic
  const validatePayment = () => {
    const newErrors = {};

    if (paymentMethod === 'card') {
      const cleanCard = paymentData.cardNumber.replace(/\s+/g, '');
      if (!cleanCard) {
        newErrors.cardNumber = 'Card number is required.';
      } else if (!/^\d{16}$/.test(cleanCard)) {
        newErrors.cardNumber = 'Card number must be exactly 16 numeric digits.';
      }

      if (!paymentData.cardHolder || !paymentData.cardHolder.trim()) {
        newErrors.cardHolder = 'Cardholder name is required.';
      } else if (!/^[A-Za-z\s]{3,30}$/.test(paymentData.cardHolder.trim())) {
        newErrors.cardHolder = 'Enter valid name as printed on the card.';
      }

      if (!paymentData.expiry || !paymentData.expiry.trim()) {
        newErrors.expiry = 'Expiry date is required (MM/YY).';
      } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentData.expiry.trim())) {
        newErrors.expiry = 'Use valid MM/YY format (e.g. 11/27).';
      } else {
        const [m, y] = paymentData.expiry.split('/').map(Number);
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;
        if (y < currentYear || (y === currentYear && m < currentMonth)) {
          newErrors.expiry = 'Card is already expired.';
        }
      }

      if (!paymentData.cvv || !paymentData.cvv.trim()) {
        newErrors.cvv = 'CVV is required.';
      } else if (!/^\d{3,4}$/.test(paymentData.cvv.trim())) {
        newErrors.cvv = 'CVV must be 3 or 4 digits.';
      }
    } else if (paymentMethod === 'upi') {
      if (!paymentData.upiId || !paymentData.upiId.trim()) {
        newErrors.upiId = 'UPI Virtual Payment Address (VPA) is required.';
      } else if (!/^[\w.-]+@[\w.-]+$/.test(paymentData.upiId.trim())) {
        newErrors.upiId = 'Invalid UPI ID format (e.g. username@okhdfcbank).';
      }
    }

    return newErrors;
  };

  const handleCardNumberInput = (e) => {
    let raw = e.target.value.replace(/\D/g, '').substring(0, 16);
    let formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setPaymentData({ ...paymentData, cardNumber: formatted });
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    setTouched({ cardNumber: true, cardHolder: true, expiry: true, cvv: true, upiId: true });
    const errs = validatePayment();
    setErrors(errs);

    if (Object.keys(errs).length === 0) {
      onPaymentSuccess({
        netPaid: netPayable,
        discountApplied: discount,
        method: paymentMethod
      });
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-100">
        <span className="text-xl">💳</span>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Step 4: Promo Code & Payment Validation</h2>
          <p className="text-xs text-slate-500">
            Interactive coupon calculation & client-side payment input verification with auto-masking.
          </p>
        </div>
      </div>

      {/* Fare Breakdown Card */}
      <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mb-6 text-xs space-y-2">
        <div className="flex justify-between text-slate-600">
          <span>Base Ticket Fare ({selectedSeats.length} seats &times; ₹{selectedBus.fare}):</span>
          <span className="font-semibold text-slate-800">₹{baseFare}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>GST & Passenger Safety Insurance (5%):</span>
          <span className="font-semibold text-slate-800">₹{gst}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-emerald-700 font-bold">
            <span>Promotional Discount:</span>
            <span>- ₹{discount}</span>
          </div>
        )}
        <div className="border-t border-indigo-200 pt-2 flex justify-between text-sm font-black text-indigo-950">
          <span>Net Amount Payable:</span>
          <span className="text-base text-indigo-700">₹{netPayable}</span>
        </div>
      </div>

      {/* Promo Code Box */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6">
        <label className="block text-xs font-bold text-slate-700 mb-1.5">Apply Promo Code</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="e.g. FIRST20, WEEKEND100"
            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase outline-none focus:border-indigo-600"
          />
          <button
            type="button"
            onClick={handleApplyPromo}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
          >
            Apply Code
          </button>
        </div>
        {promoFeedback.message && (
          <p className={`text-xs mt-2 font-medium ${
            promoFeedback.type === 'success' ? 'text-emerald-600' : 'text-rose-500'
          }`}>
            {promoFeedback.type === 'success' ? '✓ ' : '⚠️ '}{promoFeedback.message}
          </p>
        )}
      </div>

      {/* Payment Selection Tabs */}
      <div className="mb-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Select Payment Method
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
              paymentMethod === 'card'
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            💳 Credit / Debit Card
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('upi')}
            className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
              paymentMethod === 'upi'
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            📱 UPI / Virtual ID
          </button>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleFinalSubmit} className="space-y-4">
        {paymentMethod === 'card' ? (
          <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Card Number (16 Digits) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={paymentData.cardNumber}
                onChange={handleCardNumberInput}
                placeholder="4532 8976 1234 5678"
                maxLength="19"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono transition outline-none ${
                  touched.cardNumber && errors.cardNumber
                    ? 'border-rose-500 bg-rose-50/40 text-rose-900'
                    : 'border-slate-300 focus:border-indigo-600'
                }`}
              />
              {touched.cardNumber && errors.cardNumber && (
                <p className="text-xs text-rose-500 mt-1 font-medium">⚠️ {errors.cardNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Cardholder Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={paymentData.cardHolder}
                onChange={(e) => setPaymentData({ ...paymentData, cardHolder: e.target.value.toUpperCase() })}
                placeholder="NAME ON CARD"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm uppercase transition outline-none ${
                  touched.cardHolder && errors.cardHolder
                    ? 'border-rose-500 bg-rose-50/40 text-rose-900'
                    : 'border-slate-300 focus:border-indigo-600'
                }`}
              />
              {touched.cardHolder && errors.cardHolder && (
                <p className="text-xs text-rose-500 mt-1 font-medium">⚠️ {errors.cardHolder}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Expiry (MM/YY) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={paymentData.expiry}
                  onChange={(e) => setPaymentData({ ...paymentData, expiry: e.target.value })}
                  placeholder="12/28"
                  maxLength="5"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono transition outline-none ${
                    touched.expiry && errors.expiry
                      ? 'border-rose-500 bg-rose-50/40 text-rose-900'
                      : 'border-slate-300 focus:border-indigo-600'
                  }`}
                />
                {touched.expiry && errors.expiry && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">⚠️ {errors.expiry}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  CVV / CVC <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={paymentData.cvv}
                  onChange={(e) => setPaymentData({ ...paymentData, cvv: e.target.value.replace(/\D/g, '').substring(0, 4) })}
                  placeholder="***"
                  maxLength="4"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono transition outline-none ${
                    touched.cvv && errors.cvv
                      ? 'border-rose-500 bg-rose-50/40 text-rose-900'
                      : 'border-slate-300 focus:border-indigo-600'
                  }`}
                />
                {touched.cvv && errors.cvv && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">⚠️ {errors.cvv}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Virtual Payment Address (UPI ID) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={paymentData.upiId}
              onChange={(e) => setPaymentData({ ...paymentData, upiId: e.target.value })}
              placeholder="e.g. mobile@upi, name@okaxis"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition outline-none ${
                touched.upiId && errors.upiId
                  ? 'border-rose-500 bg-rose-50/40 text-rose-900'
                  : 'border-slate-300 focus:border-indigo-600'
              }`}
            />
            {touched.upiId && errors.upiId && (
              <p className="text-xs text-rose-500 mt-1 font-medium">⚠️ {errors.upiId}</p>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onBack}
            className="text-slate-600 hover:text-slate-900 text-sm font-semibold px-4 py-2"
          >
            &larr; Back to Passenger
          </button>
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition shadow-md shadow-emerald-200"
          >
            Confirm & Pay ₹{netPayable} &rarr;
          </button>
        </div>
      </form>
    </div>
  );
}
