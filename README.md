# BusGo — Smart Full-Stack Bus Ticket Booking Platform

BusGo is a full-stack bus ticket booking website built with modern HTML, CSS, JavaScript, Node.js, Express.js, and MongoDB. It features a complete end-to-end booking workflow, international phone validation, promotional discount engine, role-based Bus Operator portal with fleet and booking management, digital BusGo Wallet, gift voucher generation and redemption, simulated multi-channel payment gateway, and professional A4-formatted printable E-Tickets with QR codes.

---

## 🚀 Technology Stack
- **Frontend:** Responsive Vanilla HTML5, CSS3, Modern JavaScript (ES6+), and **ReactJS 18** (Interactive Client-Side Validation Module)
- **Backend:** Node.js, Express.js REST API
- **Database:** MongoDB with Mongoose ODM
- **Authentication & Security:** JSON Web Tokens (JWT), bcrypt.js password hashing, Role-Based Access Control (RBAC), Helmet, Express Rate Limiting, CORS
- **Default Server Port:** `http://localhost:5000`
- **React Client-Side Validation Route:** `http://localhost:5000/react` (or directly open `react-validation.html`)

---

## 📋 Comprehensive Feature Overview

### 0. ReactJS Client-Side Validation & Interactive Module (`/react`)
- Dedicated ReactJS module demonstrating client-side form validation and interactive state management:
  - **Route & Date Validation:** Prevents matching departure/destination and past journey dates.
  - **Interactive Seat Matrix:** Visual 2+1 and 2+2 layout with real-time selection and maximum 4-seat limit validation.
  - **Passenger Details Form:** Real-time Full Name validation, RFC 5322 Email regex, and country-code telephone regex (+91, +1, +44, +971, +65).
  - **Promo & Payment Verification:** Promotional coupon validation rules (`FIRST20`, `WEEKEND100`), 16-digit card formatting with space injection, MM/YY expiry check, and UPI VPA validation.
  - **A4 Printable Boarding Pass:** Generates confirmed ticket with offline QR code and clean `@media print` styling.
  - Direct access via navbar button: **"⚛️ React Validation"** or route `http://localhost:5000/react`.

### 1. International Phone Number Validation
- Country selector supporting 10+ countries with country flags and dialing codes:
  - India (`+91` 🇮🇳 — Default)
  - USA & Canada (`+1` 🇺🇸)
  - United Kingdom (`+44` 🇬🇧)
  - United Arab Emirates (`+971` 🇦🇪)
  - Singapore (`+65` 🇸🇬)
  - Australia (`+61` 🇦🇺)
  - Germany (`+49` 🇩🇪)
  - Saudi Arabia (`+966` 🇸🇦)
  - Malaysia (`+60` 🇲🇾)
  - Qatar (`+974` 🇶🇦)
- Real-time country-specific regex pattern and length validation.
- Validates phone inputs across Customer Registration, Personal Information profile update, Passenger Details during seat booking, and Bus Operator Company registration.
- Prevents invalid or random numbers from submission and correctly saves country code and phone number into MongoDB.

### 2. Professional Print and Download Ticket Formatting
- E-Ticket boarding pass with BusGo branding, logo, PNR number (`PNR-XXXXXX`), and Booking Reference (`BG...`).
- Displays complete travel details: departure/arrival times, operator name, coach type, bus number, allocated seat numbers, boarding point, and dropping point.
- Fare breakdown: Base Fare, GST & Platform Insurance (5%), Promotional Discount, and Net Paid Amount.
- Integrated pure-vector SVG verification QR code (works 100% offline without external image services).
- **Print & PDF Formatting (`@media print`):**
  - Isolates and prints **only** the ticket card.
  - Automatically hides navigation bar, footer, buttons, background dimmers, and toast popups.
  - Configured for standard A4 portrait sizing (`@page { size: A4 portrait; margin: 10mm; }`) with `page-break-inside: avoid`.
  - Clean "Save as PDF" and "Print Ticket" options.

### 3. Fully Functional Promotional Offers Engine
- Promotional offers loaded dynamically from MongoDB (`/api/offers`).
- Real-time backend validation endpoint (`POST /api/offers/validate`).
- Enforces strict business conditions:
  - Minimum booking amount checks.
  - First-time user verification (queries MongoDB to ensure user has no prior confirmed bookings).
  - Weekend-only validation (checks if journey date is a Saturday or Sunday).
  - Discount caps (percentage with max discount limit or flat rupee deductions).
- Active Promo Codes:
  - `FIRST20`: 20% OFF up to ₹250 (Min booking ₹300, First booking only)
  - `WEEKEND100`: Flat ₹100 OFF (Min booking ₹400, Weekend travel only)
  - `STUDY10`: 10% OFF up to ₹150 for students (Min booking ₹250)
  - `FEST150`: Flat ₹150 OFF (Min booking ₹600)
  - `GETAWAY200`: Flat ₹200 OFF (Min booking ₹800, Weekend only)
  - `CAMPUS50`: Flat ₹50 OFF (Min booking ₹200)

### 4. Bus Owner / Operator Portal & Management Dashboard
- Dedicated portal for bus owners and fleet operators:
  - Operator Registration (Company name, owner name, email, verified phone, GST/Reg number, address, password).
  - Operator Login with strict role-based authorization (`role: 'operator'`).
- **Operator Dashboard:**
  - Real-time business analytics: Active Fleet Buses, Total Customer Bookings, Total Revenue (₹), Average Safety Rating.
  - Fleet Management: Add new bus routes, edit timings/fares/seats/amenities/boarding points, and delete buses.
  - Passenger Bookings: Inspect traveler bookings and seat allocations for operator-owned buses.
  - Verification mechanism: Newly registered operators show verification status (`VERIFIED` or `PENDING`). Includes a one-click demo verification toggle.
  - Strict security: Operators can only access, edit, and delete their own buses (`bus.operatorId == req.user._id`).

### 5. Popular Bus Operators Section
- Live operator partner cards retrieved dynamically from MongoDB (`/api/operators/popular`).
- Shows operator avatar, ratings (★), active fleet count, major routes served, and verified partner badge.

### 6. Personal Information Management
- Available in Account Slide Panel &rarr; Personal Information.
- Live data synchronization via `GET /api/auth/me` and `PUT /api/auth/me`.
- Customers can view and update full name, verified mobile number with country selector, date of birth, gender, city, and street address.
- Sensitive fields (passwords) are strictly excluded from API responses.

### 7. BusGo Wallet
- Digital wallet interface with card view displaying current balance.
- Simulated wallet top-up interface (+₹200, +₹500, +₹1,000, +₹2,000 presets or custom amount).
- Full audit log in MongoDB (`WalletTransaction` model) recording date, time, reference ID, amount, and description.
- Seamless one-tap payment option during checkout with automatic balance deduction.
- Instant 100% refund credited back into the wallet when a confirmed booking is cancelled.

### 8. Random Gift Card Voucher System
- Available in Account Slide Panel &rarr; Redeem Gift Card.
- **Generate Demo Voucher:** Generates a randomized unique voucher code (e.g., `GIFT-8A2F-2026`) with test credits (₹100, ₹250, ₹500) and 30-day validity.
- **Redeem Voucher:** Validates against MongoDB `GiftCard` collection, ensures the voucher has not been redeemed, checks expiration, credits funds into the BusGo Wallet, and prevents duplicate redemption.
- Pre-seeded test voucher codes ready for demonstration: `BUSGO100`, `BUSGO250`, `BUSGO500`, `FESTIVE300`, `STUDENT150`.

### 9. Simulated Multi-Channel Payment Gateway
- Comprehensive price breakdown before checkout:
  - Base Ticket Fare (Seats &times; Fare)
  - GST & Platform Insurance (5%)
  - Applied Promo Discount
  - Net Payable Amount
- Payment channels:
  - 1. UPI (GPay, PhonePe, Paytm, BHIM, UPI ID)
  - 2. Credit / Debit Card (demo interface with card formatting, expiry, CVV)
  - 3. Net Banking (HDFC, SBI, ICICI, Axis, Kotak)
  - 4. BusGo Wallet (instant one-tap deduction)
- Simulated payment authorization flow with animated gateway loading modal and 256-bit SSL encryption badge.
- Interactive "Simulate payment failure" test toggle to demonstrate gateway error handling and seat protection.
- Generates unique transaction references (`TXN-...`) and PNR codes upon confirmation.

### 10. General UI/UX Enhancements
- Modern toast notification system replacing browser `alert()` popups.
- Responsive design tailored for mobile screens, tablets, and desktop displays.
- Quick location swap (`Pune ⇄ Mumbai`), Today / Tomorrow departure date shortcuts.
- Interactive seat map with real-time taken/available/selected states.
- Clean empty states with action triggers when no bookings, fleet buses, or transactions exist.

---

## 🛠️ Installation & Execution Guide (VS Code on Windows)

### Prerequisites
1. **Node.js:** Ensure Node.js (v18 or higher) is installed. Verify with:
   ```powershell
   node -v
   ```
2. **MongoDB:** Ensure local MongoDB server is running on `mongodb://localhost:27017`. Verify with:
   ```powershell
   mongosh
   ```

### Step-by-Step Setup

1. **Open the project in VS Code:**
   Launch VS Code and open the `BusGo` folder:
   `c:\Users\Hp\Downloads\BusGo-full-project\BusGo`

2. **Navigate to the backend directory in the integrated terminal:**
   ```powershell
   cd backend
   ```

3. **Install npm dependencies:**
   ```powershell
   npm install
   ```

4. **Seed the database with sample data (Run Once):**
   ```powershell
   npm run seed
   ```
   *This seeds sample buses, verified operators, unverified operator, customer accounts with wallet balance, promo codes, and demo gift cards.*

5. **Start the backend server:**
   ```powershell
   npm run dev
   ```
   *(Alternatively: `npm start`)*
   You will see:
   ```
   🚀 Server running in development mode on port 5000
   ✅ MongoDB connected: 127.0.0.1
   ```

6. **Open the application in your browser:**
   Open:
   ```
   http://localhost:5000
   ```
   *(Note: Access through `http://localhost:5000` so both the frontend and REST APIs are served seamlessly from the same origin.)*

---

## 🔑 Pre-Configured Test Credentials for Demonstration

### Demo Customer Account
- **Email:** `rahul@busgo.com`
- **Password:** `Password123`
- **Initial Wallet Balance:** ₹750 test credits
- **Phone:** `+91 9876543210`

### Demo Bus Operator Account (Verified)
- **Company Name:** Shree Travels
- **Email:** `shree@travels.com`
- **Password:** `Password123`
- **Verification Status:** Verified (✓)
- **Fleet Buses:** Pre-configured on Pune &rarr; Mumbai and Delhi &rarr; Jaipur

### Demo Bus Operator Account (Pending Verification)
- **Company Name:** Apex Voyager
- **Email:** `apex@voyager.com`
- **Password:** `Password123`
- **Verification Status:** Pending Verification (⚠️) *(Useful for testing the unverified operator notice and approval flow)*

---

## 🏷️ Test Promo Codes & Gift Vouchers

### Promotional Promo Codes
- `FIRST20` — 20% OFF on first booking (Max ₹250, Min booking ₹300)
- `WEEKEND100` — Flat ₹100 OFF on Saturday & Sunday travel (Min booking ₹400)
- `STUDY10` — 10% OFF for students up to ₹150 (Min booking ₹250)
- `FEST150` — Flat ₹150 OFF (Min booking ₹600)
- `GETAWAY200` — Flat ₹200 OFF on weekend routes (Min booking ₹800)
- `CAMPUS50` — Flat ₹50 OFF (Min booking ₹200)

### Ready-to-Redeem Demo Gift Vouchers
- `BUSGO100` (₹100 test credits)
- `BUSGO250` (₹250 test credits)
- `BUSGO500` (₹500 test credits)
- `FESTIVE300` (₹300 test credits)
- `STUDENT150` (₹150 test credits)

---

## 🔍 Demonstration Integrity: Real vs. Simulated Features

| Feature | Operational Nature | Technical Implementation |
| :--- | :--- | :--- |
| **User & Operator Auth** | **Fully Functional** | Real JWT token signing, bcrypt salt hashing, and role checks in MongoDB. |
| **Bus Search & Filter** | **Fully Functional** | Real MongoDB `$regex` search, seat availability query, and sorting. |
| **Seat Booking & Conflict** | **Fully Functional** | Real MongoDB seat validation and atomic seat deduction to prevent double-booking. |
| **Promo Code Validation** | **Fully Functional** | Real backend validation verifying expiry, user booking history, and travel date. |
| **BusGo Wallet** | **Fully Functional (Demo Credits)** | Real atomic increments/decrements in MongoDB with complete `WalletTransaction` audit trail. |
| **Gift Card Redemption** | **Fully Functional** | Real code verification, expiry check, single-use status change, and wallet crediting. |
| **Payment Gateway** | **Simulated** | Simulates multi-channel payment authorization (UPI, Cards, NetBanking, Wallet) for academic demonstration without storing real banking data. |
| **Ticket Printing & PDF** | **Fully Functional** | Real `@media print` A4 layout with dynamic vector SVG QR code generation. |

---

## 📁 File Structure & Modifications Summary

### Modified Files:
- `index.html` — Updated structure with modern navigation, wallet badge pill, modal dialogs for personal info, wallet, gift cards, operator portal, operator dashboard, and checkout.
- `style.css` — Complete responsive stylesheet with country phone inputs, digital wallet styling, gift voucher design, operator dashboard components, toast alerts, and `@media print` A4 ticket rules.
- `script.js` — Client-side controller for international phone validation, API integration, seat selection, promo validation, simulated payment gateway, operator fleet management, and SVG QR code rendering.
- `backend/package.json` — Added `"seed": "node src/seed.js"` script and updated package metadata.
- `backend/src/app.js` — Registered all modular routes (`/api/operators`, `/api/offers`, `/api/wallet`, `/api/giftcards`).
- `backend/src/seed.js` — Upgraded seed script with verified/unverified operators, customer test accounts, fleet buses with boarding points, promo offers, and gift cards.
- `backend/src/models/User.js` — Added phone, countryCode, DOB, gender, address, city, role (`user`, `operator`, `admin`), walletBalance, and operatorProfile schema.
- `backend/src/models/Bus.js` — Added operatorId, boardingPoints, droppingPoints, and cancellationPolicy.
- `backend/src/models/Booking.js` — Added PNR, transactionRef, paymentMethod, paymentStatus, baseFare, taxAmount, walletDeduction, and boarding/dropping points.
- `backend/src/controllers/authController.js` — Added phone validation, welcome bonus wallet transaction, and personal info updates.
- `backend/src/controllers/busController.js` — Enhanced bus route search and filter handling.
- `backend/src/controllers/bookingController.js` — Added country phone validation, promo verification, wallet payment deductions, cancellation refunds, and simulated gateway failure test handling.

### Newly Created Files:
- `backend/src/models/Offer.js` — Mongoose schema for promotional offers with business constraints.
- `backend/src/models/GiftCard.js` — Mongoose schema for gift vouchers.
- `backend/src/models/WalletTransaction.js` — Mongoose schema for wallet audit history.
- `backend/src/controllers/operatorController.js` — Controller for operator registration, login, dashboard stats, fleet CRUD, and bookings.
- `backend/src/controllers/offerController.js` — Controller for listing and backend validation of promotional promo codes.
- `backend/src/controllers/walletController.js` — Controller for wallet balance, simulated top-up, and transaction logs.
- `backend/src/controllers/giftCardController.js` — Controller for demo voucher generation and redemption.
- `backend/src/routes/operatorRoutes.js` — Express routes for operator management.
- `backend/src/routes/offerRoutes.js` — Express routes for offers and promo validation.
- `backend/src/routes/walletRoutes.js` — Express routes for wallet operations.
- `backend/src/routes/giftCardRoutes.js` — Express routes for gift vouchers.
- `backend/src/utils/phoneValidator.js` — Utility module for country-specific dialing codes and regex rules.
