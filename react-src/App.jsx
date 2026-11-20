import React, { useState } from 'react';
import BusSearch, { BUS_LIST } from './components/BusSearch.jsx';
import SeatMatrix from './components/SeatMatrix.jsx';
import PassengerValidationForm from './components/PassengerValidationForm.jsx';
import PromoAndPayment from './components/PromoAndPayment.jsx';
import TicketPass from './components/TicketPass.jsx';

export default function App() {
  const [currentStep, setCurrentStep] = useState(1); // 1 to 5

  // Booking Flow State
  const [searchData, setSearchData] = useState({
    from: 'Mumbai',
    to: 'Goa',
    date: new Date().toISOString().split('T')[0]
  });

  const [selectedBus, setSelectedBus] = useState(BUS_LIST[0]);
  const [selectedSeats, setSelectedSeats] = useState(['A1', 'A2']);

  const [passengerData, setPassengerData] = useState({
    fullName: 'Vedant Sharma',
    email: 'vedant@example.com',
    countryCode: '+91',
    phone: '9876543210',
    age: '21',
    gender: 'Male',
    termsAccepted: true
  });

  const [finalTicket, setFinalTicket] = useState(null);

  const steps = [
    { num: 1, label: '1. Route & Bus' },
    { num: 2, label: '2. Seat Matrix' },
    { num: 3, label: '3. Passenger Info' },
    { num: 4, label: '4. Promo & Payment' },
    { num: 5, label: '5. Boarding Pass' }
  ];

  const handlePaymentSuccess = (paymentResult) => {
    setFinalTicket({
      pnr: 'PNR-' + Math.floor(100000 + Math.random() * 900000),
      search: searchData,
      bus: selectedBus,
      seats: selectedSeats,
      passenger: passengerData,
      payment: paymentResult,
      bookedOn: new Date().toLocaleString()
    });
    setCurrentStep(5);
  };

  const handleReset = () => {
    setSelectedSeats(['A1']);
    setFinalTicket(null);
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* App Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-slate-200 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-md shadow-indigo-100">
              🚌
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">BusGo</h1>
                <span className="text-[11px] bg-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  ReactJS Lab
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Smart Bus Ticket Booking with Client-Side Validation Architecture
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right bg-white p-2.5 px-3.5 rounded-xl border border-slate-200 text-xs shadow-sm">
            <span className="text-slate-400 font-semibold block">Assignment Requirement</span>
            <span className="font-bold text-slate-700">Client-Side Validation in ReactJS</span>
          </div>
        </header>

        {/* Stepper Navigation */}
        <div className="grid grid-cols-5 gap-2 text-center text-xs font-semibold mb-8">
          {steps.map((st) => {
            const isActive = currentStep === st.num;
            const isCompleted = currentStep > st.num;
            return (
              <div
                key={st.num}
                className={`py-2.5 px-2 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold'
                    : 'bg-white text-slate-400 border-slate-200'
                }`}
              >
                {isCompleted ? '✓ ' : ''}{st.label}
              </div>
            );
          })}
        </div>

        {/* Dynamic Step View */}
        <main>
          {currentStep === 1 && (
            <BusSearch
              initialSearch={searchData}
              selectedBus={selectedBus}
              onSelectBus={setSelectedBus}
              onSearchComplete={(data) => {
                setSearchData(data);
                setCurrentStep(2);
              }}
            />
          )}

          {currentStep === 2 && (
            <SeatMatrix
              selectedBus={selectedBus}
              selectedSeats={selectedSeats}
              onSeatsChange={setSelectedSeats}
              onBack={() => setCurrentStep(1)}
              onProceed={() => setCurrentStep(3)}
            />
          )}

          {currentStep === 3 && (
            <PassengerValidationForm
              passengerData={passengerData}
              onUpdate={setPassengerData}
              onBack={() => setCurrentStep(2)}
              onProceed={() => setCurrentStep(4)}
            />
          )}

          {currentStep === 4 && (
            <PromoAndPayment
              selectedBus={selectedBus}
              selectedSeats={selectedSeats}
              passengerData={passengerData}
              onBack={() => setCurrentStep(3)}
              onPaymentSuccess={handlePaymentSuccess}
            />
          )}

          {currentStep === 5 && (
            <TicketPass ticketData={finalTicket} onReset={handleReset} />
          )}
        </main>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-600">BusGo Client-Side Validation Application (ReactJS)</p>
          <p>Controlled Form Components &bull; Dynamic RegEx Matchers &bull; Instant State Feedback &bull; Zero Server Latency</p>
        </footer>
      </div>
    </div>
  );
}
