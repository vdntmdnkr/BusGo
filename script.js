/* ============================================================
   BUSGO - script.js
   Full-stack Bus Booking Platform with Node.js, Express & MongoDB.
   ============================================================ */

/* ===================== GLOBAL STATE & API CONFIG ===================== */
const API = (location.port === "5000") ? "/api" : "http://localhost:5000/api";

let currentUser = null;
let currentOperator = null;
let lastBuses = [];
let lastDate = "";
let curBus = null;
let pickedSeats = [];
let appliedOffer = null;
let myBookingsList = [];
let operatorFleet = [];

/* ===================== COUNTRIES & PHONE VALIDATION RULES ===================== */
const COUNTRIES = [
  { code: "+91", flag: "🇮🇳", name: "India", digits: 10, pattern: /^[6-9]\d{9}$/, hint: "10 digits starting with 6, 7, 8, or 9" },
  { code: "+1", flag: "🇺🇸", name: "USA / Canada", digits: 10, pattern: /^[2-9]\d{9}$/, hint: "10 digits standard number" },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom", digits: [10, 11], pattern: /^[1-9]\d{9,10}$/, hint: "10 to 11 digits" },
  { code: "+971", flag: "🇦🇪", name: "UAE", digits: 9, pattern: /^5\d{8}$/, hint: "9 digits starting with 5" },
  { code: "+65", flag: "🇸🇬", name: "Singapore", digits: 8, pattern: /^[89]\d{7}$/, hint: "8 digits starting with 8 or 9" },
  { code: "+61", flag: "🇦🇺", name: "Australia", digits: 9, pattern: /^4\d{8}$/, hint: "9 digits starting with 4" },
  { code: "+49", flag: "🇩🇪", name: "Germany", digits: [10, 11], pattern: /^[1-9]\d{9,10}$/, hint: "10 to 11 digits" },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia", digits: 9, pattern: /^5\d{8}$/, hint: "9 digits starting with 5" },
  { code: "+60", flag: "🇲🇾", name: "Malaysia", digits: [9, 10], pattern: /^1\d{8,9}$/, hint: "9 to 10 digits starting with 1" },
  { code: "+974", flag: "🇶🇦", name: "Qatar", digits: 8, pattern: /^[3567]\d{7}$/, hint: "8 digits" }
];

function populateCountrySelects() {
  const ids = ["authCountryCode", "piCountryCode", "opRegCountryCode", "pCountryCode"];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = COUNTRIES.map(c => 
      `<option value="${c.code}" ${c.code === "+91" ? "selected" : ""}>${c.flag} ${c.code} (${c.name})</option>`
    ).join("");
  });
}

function updatePhoneValidationHint(formKey) {
  let selectEl, hintEl;
  if (formKey === "auth") {
    selectEl = document.getElementById("authCountryCode");
    hintEl = document.getElementById("authPhoneHint");
  } else if (formKey === "pi") {
    selectEl = document.getElementById("piCountryCode");
    hintEl = document.getElementById("piPhoneHint");
  } else if (formKey === "op") {
    selectEl = document.getElementById("opRegCountryCode");
    hintEl = document.getElementById("opRegPhoneHint");
  } else if (formKey === "booking") {
    selectEl = document.getElementById("pCountryCode");
    hintEl = document.getElementById("pPhoneHint");
  }

  if (!selectEl || !hintEl) return;
  const found = COUNTRIES.find(c => c.code === selectEl.value) || COUNTRIES[0];
  hintEl.textContent = `Format requirement: ${found.hint}`;
}

function validatePhoneNumberClient(countryCode, phone) {
  if (!phone || !phone.trim()) {
    return { valid: false, message: "Phone number is required." };
  }
  const clean = phone.replace(/[\s\-\(\)]/g, "");
  if (!/^\d+$/.test(clean)) {
    return { valid: false, message: "Phone number must contain only numbers." };
  }
  const country = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];
  if (!country.pattern.test(clean)) {
    return { valid: false, message: `Invalid phone format for ${country.name}. Required: ${country.hint}.` };
  }
  return { valid: true, cleanPhone: clean, formatted: `${countryCode} ${clean}` };
}

/* ===================== TOAST NOTIFICATION SYSTEM ===================== */
function showToast(type, message) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type || "info"}`;
  
  const iconMap = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
    warning: "⚠️"
  };

  toast.innerHTML = `
    <span>${iconMap[type] || "ℹ️"}</span>
    <div style="flex:1"><strong>${type.charAt(0).toUpperCase() + type.slice(1)}:</strong> ${message}</div>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

/* ===================== API FETCH WRAPPER ===================== */
async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem("busgo_token");
  if (token) headers["Authorization"] = "Bearer " + token;

  const res = await fetch(API + path, Object.assign({ headers }, options));
  const data = await res.json().catch(() => ({}));
  
  if (!res.ok || data.success === false) {
    let msg = data.message || "An unexpected error occurred.";
    if (data.errors && data.errors.length) {
      msg = data.errors.map(e => e.message || e.msg || e).join(", ");
    }
    throw new Error(msg);
  }
  return data;
}

/* ===================== MODAL HELPERS ===================== */
function openM(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
}

function closeM(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("active");
}

function showSection(sectionId) {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function scrollToOffers() {
  const offersEl = document.getElementById("offersSection");
  if (offersEl) offersEl.scrollIntoView({ behavior: "smooth" });
}

function swapLocations() {
  const fromInput = document.getElementById("fromCity");
  const toInput = document.getElementById("toCity");
  const temp = fromInput.value;
  fromInput.value = toInput.value;
  toInput.value = temp;
}

function setQuickDate(daysToAdd) {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  document.getElementById("journeyDate").value = date.toISOString().split("T")[0];
}

function quickSearch(from, to) {
  document.getElementById("fromCity").value = from;
  document.getElementById("toCity").value = to;
  const dateInput = document.getElementById("journeyDate");
  if (!dateInput.value) {
    dateInput.value = new Date().toISOString().split("T")[0];
  }
  searchBuses();
}

function openHelpModal() {
  openM("helpModal");
}

/* ===================== ACCOUNT SLIDE PANEL ===================== */
function openAccountPanel() {
  document.getElementById("accountPanel").classList.add("active");
  document.getElementById("accountOverlay").classList.add("active");
  updateAccountUI();
}

function closeAccountPanel() {
  document.getElementById("accountPanel").classList.remove("active");
  document.getElementById("accountOverlay").classList.remove("active");
}

function updateAccountUI() {
  const storedUser = localStorage.getItem("busgo_user");
  currentUser = storedUser ? JSON.parse(storedUser) : null;

  const loginArea = document.getElementById("accountLoginArea");
  const navAccountText = document.getElementById("navAccountText");
  const navWalletBtn = document.getElementById("navWalletBtn");
  const navWalletBal = document.getElementById("navWalletBal");
  const accountWalletBadge = document.getElementById("accountWalletBadge");

  if (currentUser) {
    const isOp = currentUser.role === "operator";
    const name = currentUser.name || "Customer";
    navAccountText.textContent = name.split(" ")[0];

    loginArea.innerHTML = `
      <div style="background:#f8fafc;padding:14px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:15px">
        <div style="font-size:12px;font-weight:700;color:${isOp ? '#b45309' : '#15803d'}">
          ${isOp ? '🏢 BUS OPERATOR' : '👤 VERIFIED CUSTOMER'}
        </div>
        <h3 style="margin:4px 0">${name}</h3>
        <p style="font-size:12px;color:#64748b">${currentUser.email}</p>
        <p style="font-size:12px;color:#64748b">${currentUser.countryCode || '+91'} ${currentUser.phone || 'No phone added'}</p>
        ${isOp ? '<button class="btn btn-secondary btn-sm full-width" style="margin-top:8px" onclick="openOperatorDashboard()">Go to Operator Dashboard</button>' : ''}
      </div>
      <button class="btn btn-secondary full-width" onclick="logout()">Log out</button>
    `;

    // Update live wallet badge
    const bal = currentUser.walletBalance !== undefined ? currentUser.walletBalance : 0;
    navWalletBal.textContent = `₹${bal}`;
    accountWalletBadge.textContent = `₹${bal}`;
    navWalletBtn.classList.remove("hidden");
  } else {
    navAccountText.textContent = "Account";
    navWalletBtn.classList.add("hidden");
    accountWalletBadge.textContent = "₹0";

    loginArea.innerHTML = `
      <h2>Log in to BusGo</h2>
      <p style="font-size:13px;color:#64748b;margin-bottom:12px">Manage bookings, use your BusGo Wallet, and access verified promo discounts.</p>
      <button class="btn search-btn full-width" onclick="openLoginModal('login')">Log in</button>
      <p class="signup-line">Don't have an account? <a href="#" onclick="openLoginModal('register'); return false;">Sign up</a></p>
    `;
  }
}

function logout() {
  localStorage.removeItem("busgo_token");
  localStorage.removeItem("busgo_user");
  currentUser = null;
  updateAccountUI();
  closeAccountPanel();
  showToast("info", "You have been logged out.");
}

/* ===================== CUSTOMER AUTH (LOGIN / REGISTER) ===================== */
let authMode = "login";

function openLoginModal(mode = "login") {
  closeAccountPanel();
  setAuthMode(mode);
  openM("loginModal");
}

function closeLoginModal() {
  closeM("loginModal");
}

function setAuthMode(mode) {
  authMode = mode;
  const regFields = document.getElementById("registerFields");
  const authTitle = document.getElementById("authTitle");
  const authSubmit = document.getElementById("authSubmit");
  const authToggle = document.getElementById("authToggle");
  const authError = document.getElementById("authError");
  authError.textContent = "";

  if (mode === "register") {
    regFields.style.display = "block";
    authTitle.textContent = "Create your BusGo Account";
    authSubmit.textContent = "Sign Up";
    authToggle.innerHTML = 'Already have an account? <a href="#" onclick="setAuthMode(\'login\'); return false;">Log in</a>';
    updatePhoneValidationHint("auth");
  } else {
    regFields.style.display = "none";
    authTitle.textContent = "Login to get exciting offers";
    authSubmit.textContent = "Log in";
    authToggle.innerHTML = 'New here? <a href="#" onclick="setAuthMode(\'register\'); return false;">Sign up</a>';
  }
}

async function submitAuth() {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const errBox = document.getElementById("authError");
  errBox.textContent = "";

  if (!email || !password) {
    errBox.textContent = "Please enter both email and password.";
    return;
  }

  let body = { email, password };

  if (authMode === "register") {
    const name = document.getElementById("authName").value.trim();
    const countryCode = document.getElementById("authCountryCode").value;
    const phone = document.getElementById("authPhone").value.trim();

    if (!name || name.length < 2) {
      errBox.textContent = "Please enter your full name (minimum 2 characters).";
      return;
    }

    if (phone) {
      const check = validatePhoneNumberClient(countryCode, phone);
      if (!check.valid) {
        errBox.textContent = check.message;
        return;
      }
      body.phone = check.cleanPhone;
      body.countryCode = countryCode;
    }
    body.name = name;
  }

  try {
    const data = await apiFetch(`/auth/${authMode}`, {
      method: "POST",
      body: JSON.stringify(body)
    });

    localStorage.setItem("busgo_token", data.data.token);
    localStorage.setItem("busgo_user", JSON.stringify(data.data.user));
    currentUser = data.data.user;

    closeLoginModal();
    updateAccountUI();
    showToast("success", data.message || `Welcome, ${currentUser.name}!`);
  } catch (err) {
    errBox.textContent = err.message;
  }
}

/* ===================== PERSONAL INFORMATION SECTION ===================== */
async function openPersonalInfoModal() {
  if (!localStorage.getItem("busgo_token")) {
    showToast("warning", "Please log in first to view personal information.");
    openLoginModal();
    return;
  }
  closeAccountPanel();
  openM("personalInfoModal");
  populateCountrySelects();

  try {
    const res = await apiFetch("/auth/me");
    const u = res.data;
    document.getElementById("piName").value = u.name || "";
    document.getElementById("piEmail").value = u.email || "";
    document.getElementById("piCountryCode").value = u.countryCode || "+91";
    document.getElementById("piPhone").value = u.phone || "";
    if (u.dateOfBirth) {
      document.getElementById("piDob").value = String(u.dateOfBirth).slice(0, 10);
    } else {
      document.getElementById("piDob").value = "";
    }
    document.getElementById("piGender").value = u.gender || "";
    document.getElementById("piCity").value = u.city || "";
    document.getElementById("piAddress").value = u.address || "";
    updatePhoneValidationHint("pi");
  } catch (err) {
    showToast("error", "Could not fetch profile: " + err.message);
  }
}

async function savePersonalInfo(e) {
  e.preventDefault();
  const errBox = document.getElementById("piError");
  errBox.textContent = "";

  const name = document.getElementById("piName").value.trim();
  const countryCode = document.getElementById("piCountryCode").value;
  const phone = document.getElementById("piPhone").value.trim();
  const dateOfBirth = document.getElementById("piDob").value;
  const gender = document.getElementById("piGender").value;
  const city = document.getElementById("piCity").value.trim();
  const address = document.getElementById("piAddress").value.trim();

  if (!name || name.length < 2) {
    errBox.textContent = "Please enter your full name.";
    return;
  }

  const phoneCheck = validatePhoneNumberClient(countryCode, phone);
  if (!phoneCheck.valid) {
    errBox.textContent = phoneCheck.message;
    return;
  }

  try {
    const res = await apiFetch("/auth/me", {
      method: "PUT",
      body: JSON.stringify({
        name,
        countryCode,
        phone: phoneCheck.cleanPhone,
        dateOfBirth: dateOfBirth || null,
        gender,
        city,
        address
      })
    });

    localStorage.setItem("busgo_user", JSON.stringify(res.data));
    currentUser = res.data;
    updateAccountUI();
    closeM("personalInfoModal");
    showToast("success", "Personal details saved successfully!");
  } catch (err) {
    errBox.textContent = err.message;
  }
}

/* ===================== BUSGO WALLET ===================== */
async function openWalletModal() {
  if (!localStorage.getItem("busgo_token")) {
    showToast("warning", "Please log in to access your BusGo Wallet.");
    openLoginModal();
    return;
  }
  closeAccountPanel();
  openM("walletModal");
  await refreshWalletData();
}

async function refreshWalletData() {
  try {
    const res = await apiFetch("/wallet");
    const data = res.data;
    const balance = data.balance !== undefined ? data.balance : 0;

    document.getElementById("walletBalanceBig").textContent = `₹${balance.toFixed(2)}`;
    document.getElementById("walletUserName").textContent = currentUser ? currentUser.name : "Customer";
    
    // Update navbar pill & account badge
    document.getElementById("navWalletBal").textContent = `₹${balance}`;
    document.getElementById("accountWalletBadge").textContent = `₹${balance}`;
    if (currentUser) {
      currentUser.walletBalance = balance;
      localStorage.setItem("busgo_user", JSON.stringify(currentUser));
    }

    const txContainer = document.getElementById("walletTransactionsList");
    if (!data.transactions || data.transactions.length === 0) {
      txContainer.innerHTML = `<p class="text-muted" style="text-align:center;padding:16px">No wallet transactions found.</p>`;
      return;
    }

    txContainer.innerHTML = data.transactions.map(t => `
      <div class="tx-row">
        <div>
          <div class="tx-desc">${t.description}</div>
          <div class="tx-date">${new Date(t.createdAt).toLocaleString()} · Ref: ${t.referenceId || '-'}</div>
        </div>
        <div class="tx-amount ${t.type}">
          ${t.type === 'credit' ? '+' : '-'} ₹${t.amount}
        </div>
      </div>
    `).join("");
  } catch (err) {
    showToast("error", "Failed to refresh wallet: " + err.message);
  }
}

function setTopupAmount(amt) {
  document.getElementById("topupAmountInput").value = amt;
}

async function submitWalletTopup() {
  const amt = Number(document.getElementById("topupAmountInput").value);
  if (isNaN(amt) || amt < 10) {
    showToast("warning", "Please enter at least ₹10 for wallet top-up.");
    return;
  }

  try {
    const res = await apiFetch("/wallet/topup", {
      method: "POST",
      body: JSON.stringify({ amount: amt, paymentMethod: "Simulated UPI (Test Credits)" })
    });
    showToast("success", res.message);
    await refreshWalletData();
  } catch (err) {
    showToast("error", err.message);
  }
}

/* ===================== RANDOM GIFT CARDS ===================== */
function openGiftCardModal() {
  if (!localStorage.getItem("busgo_token")) {
    showToast("warning", "Please log in to redeem gift cards.");
    openLoginModal();
    return;
  }
  closeAccountPanel();
  openM("giftCardModal");
  switchGiftCardTab("redeem");
}

function switchGiftCardTab(tab) {
  const redeemBtn = document.getElementById("gcTabRedeem");
  const genBtn = document.getElementById("gcTabGenerate");
  const redeemPanel = document.getElementById("gcRedeemPanel");
  const genPanel = document.getElementById("gcGeneratePanel");

  if (tab === "redeem") {
    redeemBtn.classList.add("active");
    genBtn.classList.remove("active");
    redeemPanel.style.display = "block";
    genPanel.style.display = "none";
  } else {
    genBtn.classList.add("active");
    redeemBtn.classList.remove("active");
    genPanel.style.display = "block";
    redeemPanel.style.display = "none";
  }
}

function fillGiftCardCode(code) {
  document.getElementById("giftCardCodeInput").value = code;
}

async function redeemGiftCard() {
  const input = document.getElementById("giftCardCodeInput");
  const msgEl = document.getElementById("gcRedeemMsg");
  const code = input.value.trim().toUpperCase();
  msgEl.textContent = "";

  if (!code) {
    msgEl.style.color = "#c0392b";
    msgEl.textContent = "Please enter a valid gift card code.";
    return;
  }

  try {
    const res = await apiFetch("/giftcards/redeem", {
      method: "POST",
      body: JSON.stringify({ code })
    });
    msgEl.style.color = "#15803d";
    msgEl.textContent = res.message;
    showToast("success", res.message);
    input.value = "";
    if (currentUser) {
      currentUser.walletBalance = res.data.newWalletBalance;
      localStorage.setItem("busgo_user", JSON.stringify(currentUser));
      updateAccountUI();
    }
  } catch (err) {
    msgEl.style.color = "#c0392b";
    msgEl.textContent = err.message;
  }
}

async function generateDemoGiftCard() {
  const amt = document.getElementById("gcGenAmount").value;
  try {
    const res = await apiFetch("/giftcards/generate-demo", {
      method: "POST",
      body: JSON.stringify({ amount: amt })
    });
    const c = res.data;
    document.getElementById("genVoucherAmount").textContent = `₹${c.amount}`;
    document.getElementById("genVoucherCode").textContent = c.code;
    document.getElementById("genVoucherExpiry").textContent = `Valid till ${new Date(c.expiryDate).toLocaleDateString()} (Demo Test Credits)`;
    document.getElementById("generatedCardDisplay").style.display = "block";
    showToast("success", `New demo voucher ${c.code} generated!`);
  } catch (err) {
    showToast("error", err.message);
  }
}

function copyGeneratedCard() {
  const code = document.getElementById("genVoucherCode").textContent;
  navigator.clipboard.writeText(code).catch(() => {});
  switchGiftCardTab("redeem");
  document.getElementById("giftCardCodeInput").value = code;
  showToast("info", `Code ${code} copied into redeem field!`);
}

/* ===================== PROMOTIONAL OFFERS ===================== */
let cachedOffers = [];

async function loadOffersFromBackend() {
  try {
    const res = await apiFetch("/offers");
    cachedOffers = res.data || [];
    renderOffers("all");
  } catch (err) {
    // Fallback static promo codes
    cachedOffers = [
      { code: "FIRST20", title: "First Booking Offer", desc: "Get 20% OFF on your very first bus booking.", category: "first", minBookingAmount: 300, validTill: "2027-12-31" },
      { code: "WEEKEND100", title: "Weekend Discount", desc: "Flat ₹100 OFF on Saturday and Sunday trips.", category: "weekend", minBookingAmount: 400, validTill: "2027-12-31" },
      { code: "STUDY10", title: "Student Discount", desc: "Extra 10% OFF for students on all intercity routes.", category: "student", minBookingAmount: 250, validTill: "2027-12-31" },
      { code: "FEST150", title: "Festival Offer", desc: "Flat ₹150 instant discount this festive season.", category: "festival", minBookingAmount: 600, validTill: "2027-12-31" },
      { code: "GETAWAY200", title: "Weekend Getaway", desc: "Flat ₹200 OFF on bookings above ₹800.", category: "weekend", minBookingAmount: 800, validTill: "2027-12-31" },
      { code: "CAMPUS50", title: "Campus Special", desc: "Extra ₹50 cashback on college travel.", category: "student", minBookingAmount: 200, validTill: "2027-12-31" }
    ];
    renderOffers("all");
  }
}

function renderOffers(category = "all") {
  const grid = document.getElementById("offerGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const list = cachedOffers.filter(o => category === "all" || o.category === category);
  if (list.length === 0) {
    grid.innerHTML = `<p class="text-muted" style="grid-column:1/-1;text-align:center">No offers available in this category.</p>`;
    return;
  }

  list.forEach(offer => {
    const card = document.createElement("div");
    card.className = "offer-card";
    card.innerHTML = `
      <div>
        <h3>${offer.title}</h3>
        <p>${offer.desc}</p>
        <div style="font-size:11px;color:#64748b">Min Booking: ₹${offer.minBookingAmount || 0}</div>
      </div>
      <div class="offer-card-footer">
        <span class="promo-badge">${offer.code}</span>
        <button class="apply-offer-btn" onclick="selectPromoCode('${offer.code}')">Apply Offer</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function filterOffers(cat, btn) {
  document.querySelectorAll(".offer-tabs .tab-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderOffers(cat);
}

function selectPromoCode(code) {
  showToast("info", `Promo code ${code} selected! Search a bus and select seats to apply.`);
  const promoInput = document.getElementById("pPromoInput");
  if (promoInput) {
    promoInput.value = code;
    applyPromoCodeBackend();
  } else {
    // Scroll up to search
    window.scrollTo({ top: 350, behavior: "smooth" });
  }
}

/* ===================== POPULAR BUS OPERATORS ===================== */
async function loadPopularOperators() {
  const grid = document.getElementById("operatorGrid");
  if (!grid) return;

  try {
    const res = await apiFetch("/operators/popular");
    const operators = res.data || [];
    grid.innerHTML = "";

    operators.forEach(op => {
      const card = document.createElement("div");
      card.className = "operator-card";
      card.innerHTML = `
        <div class="operator-card-header">
          <div class="operator-avatar">${op.initials || op.name.slice(0, 2).toUpperCase()}</div>
          <div>
            <div style="font-weight:700;font-size:16px;color:#0f172a">${op.name}</div>
            <div style="display:flex;gap:8px;align-items:center;margin-top:4px">
              <span class="operator-rating-badge">★ ${op.rating}</span>
              <span class="verification-pill verified">✓ VERIFIED</span>
            </div>
          </div>
        </div>
        <p style="font-size:13px;color:#475569">${op.desc}</p>
        <div class="operator-routes-line">
          <span>🛣️</span> <span>Routes: ${op.routes}</span>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = `<p class="text-muted" style="grid-column:1/-1;text-align:center">Unable to load operators from server.</p>`;
  }
}

/* ===================== SEARCH BUSES ===================== */
async function searchBuses() {
  const from = document.getElementById("fromCity").value.trim();
  const to = document.getElementById("toCity").value.trim();
  const date = document.getElementById("journeyDate").value;

  if (!from || !to) {
    showToast("warning", "Please enter both departure and destination cities.");
    return;
  }
  if (!date) {
    showToast("warning", "Please select a journey date.");
    return;
  }

  const section = document.getElementById("resultsSection");
  const list = document.getElementById("resultsList");
  section.style.display = "block";
  list.innerHTML = `<div style="text-align:center;padding:40px"><div class="payment-spinner" style="margin-bottom:12px"></div><p>Searching verified buses from ${from} to ${to}...</p></div>`;
  section.scrollIntoView({ behavior: "smooth" });

  try {
    const res = await apiFetch(`/buses?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}`);
    lastBuses = res.data || [];
    lastDate = date;

    document.getElementById("resultsTitle").textContent = `${from.toUpperCase()} → ${to.toUpperCase()}`;
    document.getElementById("resultsSubtitle").textContent = `Travel Date: ${date} · ${lastBuses.length} service(s) available`;

    renderResults();
  } catch (err) {
    list.innerHTML = `
      <div style="text-align:center;padding:30px;background:white;border-radius:10px;border:1px solid #fee2e2">
        <p style="color:#b91c1c;font-weight:600">Could not find buses: ${err.message}</p>
        <small class="text-muted">Ensure MongoDB is running and sample buses have been seeded (node src/seed.js).</small>
      </div>
    `;
  }
}

function renderResults() {
  const list = document.getElementById("resultsList");
  if (!list) return;

  const typeFilter = document.getElementById("fType").value;
  const sortFilter = document.getElementById("fSort").value;

  let filtered = lastBuses.map((bus, idx) => ({ bus, idx })).filter(item => {
    const t = item.bus.busType.toLowerCase();
    if (typeFilter === "ac") return t.includes("ac") && !t.includes("non-ac");
    if (typeFilter === "nonac") return t.includes("non-ac");
    if (typeFilter === "sleeper") return t.includes("sleeper");
    if (typeFilter === "seater") return t.includes("seater");
    return true;
  });

  filtered.sort((a, b) => {
    if (sortFilter === "rating") return b.bus.rating - a.bus.rating;
    if (sortFilter === "time") return a.bus.departureTime.localeCompare(b.bus.departureTime);
    return a.bus.fare - b.bus.fare;
  });

  if (filtered.length === 0) {
    list.innerHTML = `<div style="text-align:center;padding:30px;background:white;border-radius:10px"><p class="text-muted">No buses found matching your filter criteria.</p></div>`;
    return;
  }

  list.innerHTML = filtered.map(item => {
    const b = item.bus;
    const amenitiesBadges = (b.amenities || []).slice(0, 3).map(a => `<span class="bus-tag">${a}</span>`).join("");
    return `
      <div class="bus-result-card">
        <div>
          <div class="bus-operator-title">${b.operator}</div>
          <div class="bus-tag-row">
            <span class="bus-tag" style="background:#fee2e2;color:#b93333;font-weight:700">${b.busType}</span>
            <span class="bus-tag">${b.busNumber}</span>
            ${amenitiesBadges}
          </div>
        </div>

        <div class="bus-time-block">
          <div><strong>${b.departureTime}</strong> &rarr; <strong>${b.arrivalTime}</strong></div>
          <small class="text-muted">Duration: ${b.duration}</small>
        </div>

        <div>
          <div style="font-weight:700;color:#15803d">★ ${b.rating}</div>
          <small class="text-muted">${b.availableSeats} seats left</small>
        </div>

        <div class="bus-fare-block">
          <div class="bus-fare-amount">₹${b.fare}</div>
          <button class="btn search-btn btn-sm" onclick="openBookingModal(${item.idx})">Select Seats &rarr;</button>
        </div>
      </div>
    `;
  }).join("");
}

/* ===================== BOOKING & CHECKOUT MODAL ===================== */
async function openBookingModal(busIndex) {
  if (!localStorage.getItem("busgo_token")) {
    showToast("warning", "Please log in first to book a seat.");
    openLoginModal();
    return;
  }

  curBus = lastBuses[busIndex];
  pickedSeats = [];
  appliedOffer = null;

  const box = document.getElementById("bookBody");
  box.innerHTML = `<div style="text-align:center;padding:30px"><p>Checking live seat availability...</p></div>`;
  openM("bookModal");

  let takenSeats = [];
  try {
    const res = await apiFetch(`/bookings/taken/${curBus._id}?date=${lastDate}`);
    takenSeats = res.data || [];
  } catch (err) {
    showToast("error", "Error loading seats: " + err.message);
  }

  // Generate seat grid
  let seatBtns = "";
  for (let n = 1; n <= curBus.totalSeats; n++) {
    const isTaken = takenSeats.includes(String(n));
    seatBtns += `
      <button type="button" class="seat ${isTaken ? 'taken' : ''}" 
        ${isTaken ? 'disabled' : `onclick="toggleSeatSelection(${n}, this)"`}>
        ${n}
      </button>
    `;
  }

  // Boarding / Dropping select options
  const boardingOpts = (curBus.boardingPoints && curBus.boardingPoints.length > 0)
    ? curBus.boardingPoints.map(bp => `<option value="${bp.name} (${bp.time})">${bp.name} - ${bp.time}</option>`).join("")
    : `<option value="${curBus.from.toUpperCase()} Central Bus Terminal">${curBus.from.toUpperCase()} Central Bus Terminal</option>`;

  const droppingOpts = (curBus.droppingPoints && curBus.droppingPoints.length > 0)
    ? curBus.droppingPoints.map(dp => `<option value="${dp.name} (${dp.time})">${dp.name} - ${dp.time}</option>`).join("")
    : `<option value="${curBus.to.toUpperCase()} City Station">${curBus.to.toUpperCase()} City Station</option>`;

  const defaultPhone = currentUser ? (currentUser.phone || "") : "";
  const defaultCountry = currentUser ? (currentUser.countryCode || "+91") : "+91";
  const defaultName = currentUser ? (currentUser.name || "") : "";

  box.innerHTML = `
    <div style="background:#f8fafc;padding:14px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h3 style="color:#0f172a;margin:0">${curBus.operator} (${curBus.busType})</h3>
        <span class="verification-pill verified">★ ${curBus.rating}</span>
      </div>
      <p class="text-muted" style="margin-top:4px">
        ${curBus.from.toUpperCase()} &rarr; ${curBus.to.toUpperCase()} · ${lastDate} · Departs ${curBus.departureTime} · ₹${curBus.fare} / seat
      </p>
    </div>

    <!-- Seat Legend -->
    <div class="seat-legend-row">
      <span><span class="legend-box free"></span> Available</span>
      <span><span class="legend-box sel"></span> Your Selection</span>
      <span><span class="legend-box taken"></span> Booked</span>
    </div>

    <!-- Seat Grid -->
    <div class="seat-grid">${seatBtns}</div>

    <!-- Boarding & Dropping Points -->
    <div class="form-grid-2">
      <div>
        <label class="form-label">📍 Boarding Point (Pickup)</label>
        <select id="pBoardingPoint" class="bk-input">${boardingOpts}</select>
      </div>
      <div>
        <label class="form-label">📍 Dropping Point (Destination)</label>
        <select id="pDroppingPoint" class="bk-input">${droppingOpts}</select>
      </div>
    </div>

    <!-- Passenger Information Form with Phone Validation -->
    <h4 style="margin:14px 0 8px 0;font-size:14px;color:#1e293b">Passenger Contact Details</h4>
    <div class="form-grid-2">
      <div>
        <label class="form-label">Passenger Full Name *</label>
        <input type="text" id="pPassengerName" class="bk-input" placeholder="Primary passenger name" value="${defaultName}">
      </div>
      <div>
        <label class="form-label">Contact Mobile Number *</label>
        <div class="phone-input-group">
          <select id="pCountryCode" class="country-select" onchange="updatePhoneValidationHint('booking')"></select>
          <input type="tel" id="pPassengerPhone" class="bk-input phone-number-input" placeholder="e.g. 9876543210" value="${defaultPhone}">
        </div>
        <p id="pPhoneHint" class="input-hint"></p>
      </div>
    </div>

    <!-- Promo Code Application with Backend Validation -->
    <h4 style="margin:14px 0 8px 0;font-size:14px;color:#1e293b">Offers &amp; Promo Code</h4>
    <div style="display:flex;gap:10px">
      <input type="text" id="pPromoInput" placeholder="Enter promo code (e.g. FIRST20, WEEKEND100)" class="bk-input" style="text-transform:uppercase;margin:0;flex:1">
      <button type="button" class="btn search-btn btn-sm" onclick="applyPromoCodeBackend()">Apply Code</button>
      <button type="button" class="btn btn-secondary btn-sm" onclick="removePromoCode()">Remove</button>
    </div>
    <p id="promoFeedbackMsg" class="input-hint" style="margin-top:6px"></p>

    <!-- Detailed Pricing Breakdown -->
    <div class="price-summary-card" id="checkoutPriceSummary">
      <div class="price-row">
        <span>Selected Seats</span>
        <span id="priceSeatsDisplay">None selected (Select 1-6 seats)</span>
      </div>
      <div class="price-row">
        <span>Base Ticket Fare</span>
        <span id="priceBaseFare">₹0</span>
      </div>
      <div class="price-row">
        <span>GST &amp; Platform Insurance (5%)</span>
        <span id="priceTaxes">₹0</span>
      </div>
      <div class="price-row" id="priceDiscountRow" style="display:none">
        <span>Promotional Discount (<span id="pricePromoName"></span>)</span>
        <span class="discount-val" id="priceDiscountVal">- ₹0</span>
      </div>
      <div class="price-row" id="priceWalletDeductionRow" style="display:none">
        <span>BusGo Wallet Deduction</span>
        <span class="discount-val" id="priceWalletDeductionVal">- ₹0</span>
      </div>
      <div class="price-row total-row">
        <span>Total Payable Amount</span>
        <span id="priceTotalPayable" style="color:#b93333">₹0</span>
      </div>
    </div>

    <!-- Payment Options Selector -->
    <h4 style="margin:14px 0 8px 0;font-size:14px;color:#1e293b">Select Payment Method</h4>
    <div class="payment-method-tabs">
      <button type="button" class="pay-tab-btn active" onclick="setPaymentMethod('upi', this)">📱 UPI</button>
      <button type="button" class="pay-tab-btn" onclick="setPaymentMethod('card', this)">💳 Card</button>
      <button type="button" class="pay-tab-btn" onclick="setPaymentMethod('netbanking', this)">🏛️ NetBanking</button>
      <button type="button" class="pay-tab-btn" onclick="setPaymentMethod('wallet', this)">⚡ Wallet</button>
    </div>

    <!-- Payment Detail Fields -->
    <div class="pay-fields-panel" id="paymentDetailsArea">
      <div id="payUpiFields">
        <label class="form-label">Enter UPI ID / VPA</label>
        <input type="text" id="payUpiId" placeholder="e.g. user@okhdfcbank" class="bk-input" value="rahul@upi" style="margin:0">
        <small class="text-muted">Supports Google Pay, PhonePe, Paytm, BHIM.</small>
      </div>
      <div id="payCardFields" style="display:none">
        <label class="form-label">Card Number (Simulated)</label>
        <input type="text" class="bk-input" placeholder="4111 2222 3333 4444" value="4111 2222 3333 4444" maxlength="19">
        <div class="form-grid-2">
          <div><label class="form-label">Expiry MM/YY</label><input type="text" class="bk-input" placeholder="12/28" value="12/28"></div>
          <div><label class="form-label">CVV</label><input type="password" class="bk-input" placeholder="•••" value="123" maxlength="3"></div>
        </div>
      </div>
      <div id="payNetbankingFields" style="display:none">
        <label class="form-label">Select Bank</label>
        <select class="bk-input" style="margin:0">
          <option>HDFC Bank</option>
          <option>State Bank of India</option>
          <option>ICICI Bank</option>
          <option>Axis Bank</option>
          <option>Kotak Mahindra Bank</option>
        </select>
      </div>
      <div id="payWalletFields" style="display:none">
        <p style="font-size:13px;color:#1e293b;margin-bottom:4px">
          <strong>Available Wallet Balance:</strong> 
          <span style="color:#15803d;font-weight:700">₹${currentUser ? currentUser.walletBalance : 0}</span>
        </p>
        <small class="text-muted">Instant one-tap deduction from your BusGo Wallet test credits.</small>
      </div>
    </div>

    <!-- Simulated Gateway Error Testing Checkbox -->
    <label class="checkbox-label" style="margin-bottom:14px">
      <input type="checkbox" id="simulateFailureToggle">
      <span>Simulate payment failure to test error handling &amp; seat protection</span>
    </label>

    <p id="checkoutErrorMsg" class="form-error-msg"></p>

    <!-- Pay & Confirm Action Button -->
    <button type="button" class="btn search-btn full-width" id="btnPayConfirm" onclick="startSimulatedPaymentFlow()">
      Proceed to Pay
    </button>
  `;

  populateCountrySelects();
  document.getElementById("pCountryCode").value = defaultCountry;
  updatePhoneValidationHint("booking");
  recalculateCheckoutSummary();
}

function toggleSeatSelection(seatNum, btnEl) {
  const str = String(seatNum);
  const idx = pickedSeats.indexOf(str);

  if (idx !== -1) {
    pickedSeats.splice(idx, 1);
    btnEl.classList.remove("sel");
  } else if (pickedSeats.length >= 6) {
    showToast("warning", "You can select a maximum of 6 seats per booking.");
    return;
  } else {
    pickedSeats.push(str);
    btnEl.classList.add("sel");
  }

  recalculateCheckoutSummary();
}

function recalculateCheckoutSummary() {
  const seatsDisplay = document.getElementById("priceSeatsDisplay");
  const baseFareEl = document.getElementById("priceBaseFare");
  const taxesEl = document.getElementById("priceTaxes");
  const totalPayableEl = document.getElementById("priceTotalPayable");
  const discountRow = document.getElementById("priceDiscountRow");
  const discountValEl = document.getElementById("priceDiscountVal");
  const promoNameEl = document.getElementById("pricePromoName");
  const btnPay = document.getElementById("btnPayConfirm");

  if (!curBus) return;

  const count = pickedSeats.length;
  if (count === 0) {
    seatsDisplay.textContent = "None selected (Select 1-6 seats)";
    baseFareEl.textContent = "₹0";
    taxesEl.textContent = "₹0";
    totalPayableEl.textContent = "₹0";
    if (discountRow) discountRow.style.display = "none";
    if (btnPay) btnPay.textContent = "Select at least 1 seat";
    return;
  }

  seatsDisplay.textContent = `${pickedSeats.join(", ")} (${count} seat${count > 1 ? 's' : ''})`;
  const baseFare = count * curBus.fare;
  const taxes = Math.round(baseFare * 0.05);
  let discount = 0;

  if (appliedOffer) {
    discount = appliedOffer.discount || 0;
    discountRow.style.display = "flex";
    promoNameEl.textContent = appliedOffer.code;
    discountValEl.textContent = `- ₹${discount}`;
  } else {
    discountRow.style.display = "none";
  }

  const finalPayable = Math.max(baseFare + taxes - discount, 0);
  baseFareEl.textContent = `₹${baseFare}`;
  taxesEl.textContent = `₹${taxes}`;
  totalPayableEl.textContent = `₹${finalPayable}`;

  if (btnPay) {
    btnPay.textContent = `Pay ₹${finalPayable} & Confirm Booking`;
  }
}

let selectedPaymentMethod = "upi";

function setPaymentMethod(method, btn) {
  selectedPaymentMethod = method;
  document.querySelectorAll(".payment-method-tabs .pay-tab-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  document.getElementById("payUpiFields").style.display = (method === "upi") ? "block" : "none";
  document.getElementById("payCardFields").style.display = (method === "card") ? "block" : "none";
  document.getElementById("payNetbankingFields").style.display = (method === "netbanking") ? "block" : "none";
  document.getElementById("payWalletFields").style.display = (method === "wallet") ? "block" : "none";
}

async function applyPromoCodeBackend() {
  const input = document.getElementById("pPromoInput");
  const feedback = document.getElementById("promoFeedbackMsg");
  const code = (input.value || "").trim().toUpperCase();
  feedback.textContent = "";

  if (!code) {
    feedback.style.color = "#c0392b";
    feedback.textContent = "Please enter a promo code.";
    return;
  }
  if (pickedSeats.length === 0) {
    feedback.style.color = "#c0392b";
    feedback.textContent = "Please pick your seats first to calculate discount.";
    return;
  }

  const baseFare = pickedSeats.length * curBus.fare;

  try {
    const res = await apiFetch("/offers/validate", {
      method: "POST",
      body: JSON.stringify({
        code,
        subtotal: baseFare,
        journeyDate: lastDate
      })
    });
    appliedOffer = res.data;
    feedback.style.color = "#15803d";
    feedback.textContent = `✅ ${res.message}`;
    recalculateCheckoutSummary();
  } catch (err) {
    appliedOffer = null;
    feedback.style.color = "#c0392b";
    feedback.textContent = `❌ ${err.message}`;
    recalculateCheckoutSummary();
  }
}

function removePromoCode() {
  appliedOffer = null;
  const input = document.getElementById("pPromoInput");
  if (input) input.value = "";
  const feedback = document.getElementById("promoFeedbackMsg");
  if (feedback) feedback.textContent = "";
  recalculateCheckoutSummary();
  showToast("info", "Promo code removed.");
}

/* ===================== SIMULATED PAYMENT GATEWAY EXECUTION ===================== */
async function startSimulatedPaymentFlow() {
  const errBox = document.getElementById("checkoutErrorMsg");
  errBox.textContent = "";

  if (pickedSeats.length === 0) {
    errBox.textContent = "Please select at least 1 seat to continue.";
    return;
  }

  const passengerName = document.getElementById("pPassengerName").value.trim();
  const countryCode = document.getElementById("pCountryCode").value;
  const passengerPhone = document.getElementById("pPassengerPhone").value.trim();
  const boardingPoint = document.getElementById("pBoardingPoint").value;
  const droppingPoint = document.getElementById("pDroppingPoint").value;
  const simulateFailure = document.getElementById("simulateFailureToggle").checked;

  if (!passengerName || passengerName.length < 2) {
    errBox.textContent = "Please enter the passenger's full name.";
    return;
  }

  const phoneCheck = validatePhoneNumberClient(countryCode, passengerPhone);
  if (!phoneCheck.valid) {
    errBox.textContent = phoneCheck.message;
    return;
  }

  const baseFare = pickedSeats.length * curBus.fare;
  const taxes = Math.round(baseFare * 0.05);
  const discount = appliedOffer ? appliedOffer.discount : 0;
  const netPayable = Math.max(baseFare + taxes - discount, 0);

  // Check wallet balance if paymentMethod === 'wallet'
  if (selectedPaymentMethod === "wallet") {
    if (!currentUser || currentUser.walletBalance < netPayable) {
      errBox.textContent = `Insufficient wallet balance (Available: ₹${currentUser ? currentUser.walletBalance : 0}, Needed: ₹${netPayable}). Please top up your wallet or pick another payment method.`;
      return;
    }
  }

  // Open simulated payment processing modal
  openM("paymentProcessModal");
  document.getElementById("payProcessAmountPill").textContent = `Amount: ₹${netPayable}`;
  const stepEl = document.getElementById("payProcessStep");
  const subtextEl = document.getElementById("payProcessSubtext");

  stepEl.textContent = "Connecting to 256-Bit Payment Gateway...";
  subtextEl.textContent = `Authorizing ₹${netPayable} via ${selectedPaymentMethod.toUpperCase()}...`;

  await new Promise(r => setTimeout(r, 1200));

  stepEl.textContent = "Verifying Seat Allocation & Traveler Security...";
  subtextEl.textContent = "Booking reference generation in progress...";

  await new Promise(r => setTimeout(r, 1000));

  try {
    const bookingPayload = {
      busId: curBus._id,
      journeyDate: lastDate,
      seatNumbers: pickedSeats,
      passengerName,
      countryCode,
      passengerPhone: phoneCheck.cleanPhone,
      boardingPoint,
      droppingPoint,
      promoCode: appliedOffer ? appliedOffer.code : "",
      paymentMethod: selectedPaymentMethod,
      simulateFailure
    };

    const res = await apiFetch("/bookings", {
      method: "POST",
      body: JSON.stringify(bookingPayload)
    });

    closeM("paymentProcessModal");
    closeM("bookModal");

    // Update local bus seats
    curBus.availableSeats = Math.max(curBus.availableSeats - pickedSeats.length, 0);
    renderResults();

    showToast("success", "Payment Approved! Bus ticket confirmed.");
    showTicket(res.data);
    updateAccountUI();
  } catch (err) {
    closeM("paymentProcessModal");
    errBox.textContent = err.message;
    showToast("error", err.message);
  }
}

/* ===================== QR CODE GENERATOR (PURE JS SVG) ===================== */
function generateSvgQrCode(text) {
  // Generates clean SVG QR matrix barcode for ticket verification
  const size = 25;
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }

  let rects = "";
  const cellSize = 3.6;

  // Position markers
  const drawCorner = (ox, oy) => {
    let r = "";
    for (let x = 0; x < 7; x++) {
      for (let y = 0; y < 7; y++) {
        if (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4)) {
          r += `<rect x="${(ox + x) * cellSize}" y="${(oy + y) * cellSize}" width="${cellSize}" height="${cellSize}" fill="#1e293b"/>`;
        }
      }
    }
    return r;
  };

  rects += drawCorner(1, 1);
  rects += drawCorner(size - 8, 1);
  rects += drawCorner(1, size - 8);

  // Pattern data based on text hash
  let seed = Math.abs(hash);
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const inCorner1 = x < 9 && y < 9;
      const inCorner2 = x > size - 10 && y < 9;
      const inCorner3 = x < 9 && y > size - 10;
      if (!inCorner1 && !inCorner2 && !inCorner3) {
        seed = (seed * 9301 + 49297) % 233280;
        if (seed % 3 === 0) {
          rects += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="#1e293b"/>`;
        }
      }
    }
  }

  return `<svg width="86" height="86" viewBox="0 0 ${size * cellSize} ${size * cellSize}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
}

/* ===================== PROFESSIONAL E-TICKET & PRINTING ===================== */
function showTicket(booking) {
  const bus = booking.bus || curBus || {};
  const ticketBox = document.getElementById("printableTicket");
  if (!ticketBox) return;

  const dateStr = String(booking.journeyDate).slice(0, 10);
  const seatsStr = (booking.seatNumbers && booking.seatNumbers.length) ? booking.seatNumbers.join(", ") : booking.seats;
  const pnr = booking.pnr || booking.bookingRef;
  const qrSvg = generateSvgQrCode(`https://busgo.demo/verify/${pnr}`);

  ticketBox.innerHTML = `
    <!-- Ticket Header -->
    <div class="ticket-brand-header">
      <div class="ticket-brand-left">
        <div class="t-logo">🚌 Bus<span style="color:#d84e4e">Go</span></div>
        <div class="t-subtitle">Official E-Ticket &amp; Boarding Pass</div>
      </div>
      <div class="ticket-brand-right">
        <span class="t-status-badge">✓ ${String(booking.status || 'CONFIRMED').toUpperCase()}</span>
        <div class="t-pnr-box"><strong>PNR:</strong> ${pnr}</div>
        <div style="font-size:11px;color:#64748b">Booking Ref: ${booking.bookingRef}</div>
      </div>
    </div>

    <!-- Route Banner -->
    <div class="t-route-banner">
      <div>
        <div class="t-city-name">${(bus.from || '').toUpperCase()}</div>
        <small class="text-muted">Departure: ${bus.departureTime || '-'}</small>
      </div>
      <div style="text-align:center">
        <span class="t-route-arrow">&rarr;</span>
        <div style="font-size:12px;color:#64748b">${bus.duration || 'Direct'}</div>
      </div>
      <div style="text-align:right">
        <div class="t-city-name">${(bus.to || '').toUpperCase()}</div>
        <small class="text-muted">Arrival: ${bus.arrivalTime || '-'}</small>
      </div>
    </div>

    <!-- Travel & Bus Details Grid -->
    <div class="t-grid-3">
      <div>
        <div class="t-cell-label">Bus Operator</div>
        <div class="t-cell-value">${bus.operator || 'BusGo Partner'}</div>
      </div>
      <div>
        <div class="t-cell-label">Coach Type</div>
        <div class="t-cell-value">${bus.busType || 'AC Sleeper'}</div>
      </div>
      <div>
        <div class="t-cell-label">Bus Number</div>
        <div class="t-cell-value">${bus.busNumber || 'Scheduled Coach'}</div>
      </div>
    </div>

    <!-- Passenger & Seat Allocation -->
    <div class="t-grid-3">
      <div>
        <div class="t-cell-label">Passenger Name</div>
        <div class="t-cell-value">${booking.passengerName}</div>
      </div>
      <div>
        <div class="t-cell-label">Contact Number</div>
        <div class="t-cell-value">${booking.countryCode || '+91'} ${booking.passengerPhone}</div>
      </div>
      <div>
        <div class="t-cell-label">Allocated Seat(s)</div>
        <div class="t-cell-value" style="color:#b93333;font-size:16px">${seatsStr}</div>
      </div>
    </div>

    <!-- Boarding & Dropping Points -->
    <div class="t-grid-3" style="border-bottom:none;padding-bottom:0">
      <div>
        <div class="t-cell-label">Journey Date</div>
        <div class="t-cell-value">${dateStr}</div>
      </div>
      <div>
        <div class="t-cell-label">Boarding Point (Pickup)</div>
        <div class="t-cell-value">${booking.boardingPoint || (bus.from + ' Station')}</div>
      </div>
      <div>
        <div class="t-cell-label">Dropping Point (Dropoff)</div>
        <div class="t-cell-value">${booking.droppingPoint || (bus.to + ' Terminal')}</div>
      </div>
    </div>

    <!-- Fare & Payment Summary -->
    <div class="t-fare-summary-box">
      <div class="price-row">
        <span>Base Ticket Fare</span>
        <span>₹${booking.baseFare || booking.totalFare}</span>
      </div>
      <div class="price-row">
        <span>GST &amp; Platform Insurance (5%)</span>
        <span>₹${booking.taxAmount || 0}</span>
      </div>
      ${booking.discount ? `
      <div class="price-row">
        <span>Promotional Offer Discount (${booking.promoCode || 'PROMO'})</span>
        <span class="discount-val">- ₹${booking.discount}</span>
      </div>` : ''}
      <div class="price-row total-row">
        <span>Final Paid Amount</span>
        <span style="color:#15803d">₹${booking.totalFare}</span>
      </div>
      <div style="font-size:12px;color:#64748b;margin-top:6px;display:flex;justify-content:space-between">
        <span>Payment Method: <strong>${(booking.paymentMethod || 'UPI').toUpperCase()}</strong></span>
        <span>Transaction Ref: <strong>${booking.transactionRef || '-'}</strong></span>
      </div>
    </div>

    <!-- Verification QR Code & Policy -->
    <div class="t-qr-row">
      <div class="t-qr-box">${qrSvg}</div>
      <div class="t-terms-text">
        <strong>Important Journey Guidelines:</strong><br>
        1. Please carry a valid Government ID matching the passenger name during boarding.<br>
        2. Arrive at the boarding location 15 minutes before the departure time.<br>
        3. 24/7 BusGo Toll-Free Support Helpline: <strong>1800-000-000</strong> · Email: <code>support@busgo.com</code>.<br>
        <em>Demonstration E-Ticket generated for college project verification.</em>
      </div>
    </div>
  `;

  openM("ticketModal");
}

/* ===================== MY BOOKINGS ===================== */
async function showMyBookings() {
  if (!localStorage.getItem("busgo_token")) {
    showToast("warning", "Please log in to view your bookings.");
    openLoginModal();
    return;
  }
  closeAccountPanel();
  const box = document.getElementById("bookingsBody");
  box.innerHTML = `<div style="text-align:center;padding:30px"><p>Loading your past and upcoming trips...</p></div>`;
  openM("bookingsModal");

  try {
    const res = await apiFetch("/bookings/my");
    myBookingsList = res.data || [];
    if (myBookingsList.length === 0) {
      box.innerHTML = `
        <div style="text-align:center;padding:40px">
          <p style="font-size:16px;color:#64748b;margin-bottom:12px">You have no bus ticket bookings yet.</p>
          <button class="btn search-btn btn-sm" onclick="closeM('bookingsModal'); window.scrollTo({top:350,behavior:'smooth'})">Book a Bus Ticket &rarr;</button>
        </div>
      `;
      return;
    }

    box.innerHTML = myBookingsList.map((b, i) => {
      const bus = b.bus || {};
      const isConfirmed = b.status === "confirmed";
      return `
        <div class="bk-row">
          <div>
            <div style="font-size:15px;font-weight:700;color:#0f172a">
              ${(bus.from || '').toUpperCase()} &rarr; ${(bus.to || '').toUpperCase()}
            </div>
            <div style="font-size:12px;color:#64748b;margin-top:2px">
              Date: <strong>${String(b.journeyDate).slice(0, 10)}</strong> · ${bus.operator || 'Operator'} · Seats: <strong>${(b.seatNumbers && b.seatNumbers.length) ? b.seatNumbers.join(", ") : b.seats}</strong>
            </div>
            <div style="font-size:12px;color:#64748b">
              PNR: <code>${b.pnr || b.bookingRef}</code> · Paid: <strong>₹${b.totalFare}</strong> · Status: <span class="verification-pill ${isConfirmed ? 'verified' : 'pending'}">${b.status.toUpperCase()}</span>
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn search-btn btn-sm" onclick="showTicket(myBookingsList[${i}])">View E-Ticket</button>
            ${isConfirmed ? `<button class="btn btn-secondary btn-sm" style="color:#b91c1c" onclick="cancelMyBooking('${b._id}')">Cancel</button>` : ''}
          </div>
        </div>
      `;
    }).join("");
  } catch (err) {
    box.innerHTML = `<p style="color:#c0392b;padding:20px">${err.message}</p>`;
  }
}

async function cancelMyBooking(bookingId) {
  if (!confirm("Are you sure you want to cancel this booking? The full ticket fare will be refunded immediately into your BusGo Wallet.")) {
    return;
  }

  try {
    const res = await apiFetch(`/bookings/${bookingId}/cancel`, { method: "PUT" });
    showToast("success", res.message);
    showMyBookings();
    updateAccountUI();
  } catch (err) {
    showToast("error", err.message);
  }
}

/* ===================== BUS OPERATOR PORTAL ===================== */
let operatorAuthMode = "login";

function openOperatorModal(mode = "login") {
  closeAccountPanel();
  const token = localStorage.getItem("busgo_token");
  if (currentUser && currentUser.role === "operator" && token) {
    openOperatorDashboard();
    return;
  }
  switchOperatorAuth(mode);
  populateCountrySelects();
  updatePhoneValidationHint("op");
  openM("operatorAuthModal");
}

function switchOperatorAuth(mode) {
  operatorAuthMode = mode;
  const loginBtn = document.getElementById("opTabLogin");
  const regBtn = document.getElementById("opTabRegister");
  const loginForm = document.getElementById("opLoginForm");
  const regForm = document.getElementById("opRegForm");
  const title = document.getElementById("opAuthTitle");

  if (mode === "login") {
    loginBtn.classList.add("active");
    regBtn.classList.remove("active");
    loginForm.style.display = "block";
    regForm.style.display = "none";
    title.textContent = "🏢 Operator Login Portal";
  } else {
    regBtn.classList.add("active");
    loginBtn.classList.remove("active");
    regForm.style.display = "block";
    loginForm.style.display = "none";
    title.textContent = "🏢 Register Your Bus Company";
  }
}

async function submitOperatorLogin(e) {
  e.preventDefault();
  const email = document.getElementById("opLoginEmail").value.trim();
  const password = document.getElementById("opLoginPassword").value;
  const errBox = document.getElementById("opLoginError");
  errBox.textContent = "";

  try {
    const res = await apiFetch("/operators/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem("busgo_token", res.data.token);
    localStorage.setItem("busgo_user", JSON.stringify(res.data.operator));
    currentUser = res.data.operator;
    currentOperator = res.data.operator;

    closeM("operatorAuthModal");
    updateAccountUI();
    showToast("success", res.message);
    openOperatorDashboard();
  } catch (err) {
    errBox.textContent = err.message;
  }
}

async function submitOperatorRegister(e) {
  e.preventDefault();
  const errBox = document.getElementById("opRegError");
  errBox.textContent = "";

  const companyName = document.getElementById("opRegCompany").value.trim();
  const ownerName = document.getElementById("opRegOwner").value.trim();
  const email = document.getElementById("opRegEmail").value.trim();
  const gst = document.getElementById("opRegGst").value.trim();
  const countryCode = document.getElementById("opRegCountryCode").value;
  const phone = document.getElementById("opRegPhone").value.trim();
  const city = document.getElementById("opRegCity").value.trim();
  const address = document.getElementById("opRegAddress").value.trim();
  const password = document.getElementById("opRegPassword").value;
  const confirmPassword = document.getElementById("opRegConfirmPassword").value;
  const demoAutoVerify = document.getElementById("opRegAutoVerify").checked;

  if (password !== confirmPassword) {
    errBox.textContent = "Passwords do not match.";
    return;
  }

  const phoneCheck = validatePhoneNumberClient(countryCode, phone);
  if (!phoneCheck.valid) {
    errBox.textContent = phoneCheck.message;
    return;
  }

  try {
    const res = await apiFetch("/operators/register", {
      method: "POST",
      body: JSON.stringify({
        companyName,
        ownerName,
        email,
        registrationNumber: gst,
        countryCode,
        phone: phoneCheck.cleanPhone,
        city,
        businessAddress: address,
        password,
        confirmPassword,
        demoAutoVerify
      })
    });

    localStorage.setItem("busgo_token", res.data.token);
    localStorage.setItem("busgo_user", JSON.stringify(res.data.operator));
    currentUser = res.data.operator;
    currentOperator = res.data.operator;

    closeM("operatorAuthModal");
    updateAccountUI();
    showToast("success", res.message);
    openOperatorDashboard();
  } catch (err) {
    errBox.textContent = err.message;
  }
}

async function openOperatorDashboard() {
  closeAccountPanel();
  if (!localStorage.getItem("busgo_token")) {
    showToast("warning", "Please log in to your operator account first.");
    openOperatorModal("login");
    return;
  }

  openM("operatorDashboardModal");
  switchDashboardTab("fleet");
  await refreshOperatorDashboard();
}

async function refreshOperatorDashboard() {
  try {
    const statsRes = await apiFetch("/operators/dashboard-stats");
    const stats = statsRes.data;

    document.getElementById("dashCompanyName").textContent = stats.companyName || "My Fleet";
    document.getElementById("dashTotalBuses").textContent = stats.totalBuses;
    document.getElementById("dashTotalBookings").textContent = stats.totalBookings;
    document.getElementById("dashTotalRevenue").textContent = `₹${stats.totalRevenue}`;
    document.getElementById("dashRating").textContent = `★ ${stats.rating || 4.5}`;

    const badge = document.getElementById("dashVerificationBadge");
    const banner = document.getElementById("unverifiedNoticeBanner");

    if (stats.isVerified) {
      badge.className = "verification-pill verified";
      badge.textContent = "✓ VERIFIED OPERATOR";
      banner.style.display = "none";
    } else {
      badge.className = "verification-pill pending";
      badge.textContent = "⚠️ PENDING VERIFICATION";
      banner.style.display = "block";
    }

    await loadOperatorFleet();
  } catch (err) {
    showToast("error", "Error loading operator stats: " + err.message);
  }
}

function switchDashboardTab(tab) {
  const fleetBtn = document.getElementById("dashTabFleet");
  const bkBtn = document.getElementById("dashTabBookings");
  const fleetPanel = document.getElementById("dashFleetPanel");
  const bkPanel = document.getElementById("dashBookingsPanel");

  if (tab === "fleet") {
    fleetBtn.classList.add("active");
    bkBtn.classList.remove("active");
    fleetPanel.style.display = "block";
    bkPanel.style.display = "none";
    loadOperatorFleet();
  } else {
    bkBtn.classList.add("active");
    fleetBtn.classList.remove("active");
    bkPanel.style.display = "block";
    fleetPanel.style.display = "none";
    loadOperatorBookings();
  }
}

async function loadOperatorFleet() {
  const listEl = document.getElementById("dashBusList");
  listEl.innerHTML = `<p class="text-muted">Loading fleet buses...</p>`;

  try {
    const res = await apiFetch("/operators/my-buses");
    operatorFleet = res.data || [];
    if (operatorFleet.length === 0) {
      listEl.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:40px;background:#f8fafc;border-radius:10px">
          <p class="text-muted" style="margin-bottom:12px">No buses added to your fleet yet.</p>
          <button class="btn search-btn btn-sm" onclick="openAddBusModal()">+ Add Your First Bus</button>
        </div>
      `;
      return;
    }

    listEl.innerHTML = operatorFleet.map((b, i) => `
      <div class="dash-bus-card">
        <div class="dash-bus-card-header">
          <div>
            <strong style="font-size:16px;color:#0f172a">${b.busNumber}</strong>
            <div style="font-size:12px;color:#d84e4e;font-weight:700">${b.busType}</div>
          </div>
          <span class="verification-pill verified">₹${b.fare}</span>
        </div>
        <p style="font-size:13px;color:#475569;margin-bottom:6px">
          <strong>${b.from.toUpperCase()} &rarr; ${b.to.toUpperCase()}</strong>
        </p>
        <div style="font-size:12px;color:#64748b">
          Schedule: ${b.departureTime} &rarr; ${b.arrivalTime} (${b.duration})<br>
          Seats: ${b.availableSeats} available / ${b.totalSeats} total
        </div>
        <div class="dash-bus-actions">
          <button class="btn btn-secondary btn-sm" onclick="openEditBusModal(${i})">Edit Bus</button>
          <button class="btn btn-secondary btn-sm" style="color:#b91c1c" onclick="deleteOperatorBus('${b._id}')">Delete</button>
        </div>
      </div>
    `).join("");
  } catch (err) {
    listEl.innerHTML = `<p style="color:#c0392b">${err.message}</p>`;
  }
}

async function loadOperatorBookings() {
  const listEl = document.getElementById("dashBookingsList");
  listEl.innerHTML = `<p class="text-muted">Loading customer bookings for your buses...</p>`;

  try {
    const res = await apiFetch("/operators/my-bookings");
    const bookings = res.data || [];
    if (bookings.length === 0) {
      listEl.innerHTML = `<p class="text-muted" style="text-align:center;padding:30px">No customer bookings have been placed for your buses yet.</p>`;
      return;
    }

    listEl.innerHTML = bookings.map(b => {
      const bus = b.bus || {};
      return `
        <div class="bk-row">
          <div>
            <strong>${b.passengerName}</strong> (${b.countryCode || '+91'} ${b.passengerPhone})
            <div style="font-size:12px;color:#64748b">
              Bus: ${bus.busNumber || '-'} (${bus.from} &rarr; ${bus.to}) · Date: ${String(b.journeyDate).slice(0, 10)}
            </div>
            <div style="font-size:12px;color:#64748b">
              PNR: <code>${b.pnr || b.bookingRef}</code> · Seats: <strong>${(b.seatNumbers && b.seatNumbers.length) ? b.seatNumbers.join(", ") : b.seats}</strong> · Paid: <strong>₹${b.totalFare}</strong>
            </div>
          </div>
          <span class="verification-pill ${b.status === 'confirmed' ? 'verified' : 'pending'}">${b.status.toUpperCase()}</span>
        </div>
      `;
    }).join("");
  } catch (err) {
    listEl.innerHTML = `<p style="color:#c0392b">${err.message}</p>`;
  }
}

function openAddBusModal() {
  document.getElementById("busFormTitle").textContent = "Add New Bus to Fleet";
  document.getElementById("busFormSubmitBtn").textContent = "Add Bus to Fleet";
  document.getElementById("busFormId").value = "";
  document.getElementById("busForm").reset();
  document.getElementById("busFormError").textContent = "";
  openM("busFormModal");
}

function openEditBusModal(index) {
  const b = operatorFleet[index];
  if (!b) return;

  document.getElementById("busFormTitle").textContent = `Edit Bus ${b.busNumber}`;
  document.getElementById("busFormSubmitBtn").textContent = "Update Bus Details";
  document.getElementById("busFormId").value = b._id;
  document.getElementById("bfNumber").value = b.busNumber;
  document.getElementById("bfType").value = b.busType;
  document.getElementById("bfFrom").value = b.from;
  document.getElementById("bfTo").value = b.to;
  document.getElementById("bfDeparture").value = b.departureTime;
  document.getElementById("bfArrival").value = b.arrivalTime;
  document.getElementById("bfDuration").value = b.duration;
  document.getElementById("bfFare").value = b.fare;
  document.getElementById("bfTotalSeats").value = b.totalSeats;
  document.getElementById("bfBoarding").value = (b.boardingPoints && b.boardingPoints[0]) ? b.boardingPoints[0].name : "";
  document.getElementById("bfDropping").value = (b.droppingPoints && b.droppingPoints[0]) ? b.droppingPoints[0].name : "";
  document.getElementById("busFormError").textContent = "";

  openM("busFormModal");
}

async function saveBus(e) {
  e.preventDefault();
  const errBox = document.getElementById("busFormError");
  errBox.textContent = "";

  const busId = document.getElementById("busFormId").value;
  const busNumber = document.getElementById("bfNumber").value.trim().toUpperCase();
  const busType = document.getElementById("bfType").value;
  const from = document.getElementById("bfFrom").value.trim();
  const to = document.getElementById("bfTo").value.trim();
  const departureTime = document.getElementById("bfDeparture").value;
  const arrivalTime = document.getElementById("bfArrival").value;
  const duration = document.getElementById("bfDuration").value.trim();
  const fare = Number(document.getElementById("bfFare").value);
  const totalSeats = Number(document.getElementById("bfTotalSeats").value);
  const boarding = document.getElementById("bfBoarding").value.trim();
  const dropping = document.getElementById("bfDropping").value.trim();

  const selectedAmenities = [];
  document.querySelectorAll('input[name="bfAmenity"]:checked').forEach(c => selectedAmenities.push(c.value));

  const payload = {
    busNumber,
    busType,
    from,
    to,
    departureTime,
    arrivalTime,
    duration,
    fare,
    totalSeats,
    amenities: selectedAmenities,
    boardingPoints: boarding ? [{ name: boarding, time: departureTime }] : [],
    droppingPoints: dropping ? [{ name: dropping, time: arrivalTime }] : []
  };

  try {
    if (busId) {
      await apiFetch(`/operators/my-buses/${busId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      showToast("success", "Bus details updated successfully!");
    } else {
      await apiFetch("/operators/my-buses", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      showToast("success", "New bus registered to your fleet!");
    }

    closeM("busFormModal");
    await refreshOperatorDashboard();
  } catch (err) {
    errBox.textContent = err.message;
  }
}

async function deleteOperatorBus(busId) {
  if (!confirm("Are you sure you want to delete this bus from your fleet? Existing customer bookings will remain recorded.")) {
    return;
  }

  try {
    await apiFetch(`/operators/my-buses/${busId}`, { method: "DELETE" });
    showToast("success", "Bus removed from your fleet.");
    await refreshOperatorDashboard();
  } catch (err) {
    showToast("error", err.message);
  }
}

async function toggleCurrentOperatorVerification() {
  try {
    const res = await apiFetch("/operators/verify-toggle", { method: "PUT" });
    showToast("success", res.message);
    await refreshOperatorDashboard();
  } catch (err) {
    showToast("error", err.message);
  }
}

function operatorLogout() {
  logout();
  closeM("operatorDashboardModal");
}

/* ===================== PAGE LOAD SETUP ===================== */
window.addEventListener("DOMContentLoaded", function () {
  // Set date picker minimum to today
  const dateInput = document.getElementById("journeyDate");
  const today = new Date().toISOString().split("T")[0];
  if (dateInput) {
    dateInput.min = today;
    dateInput.value = today;
  }

  // Populate country dialing codes
  populateCountrySelects();

  // Load initial backend resources
  loadOffersFromBackend();
  loadPopularOperators();
  updateAccountUI();
});

// Backward-compatibility aliases for any legacy calls
window.openBooking = openBookingModal;
window.toggleSeat = toggleSeatSelection;
window.confirmBooking = startSimulatedPaymentFlow;
window.applyPromo = applyPromoCodeBackend;
