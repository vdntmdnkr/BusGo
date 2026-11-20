/**
 * src/seed.js
 * Comprehensive seed script for BusGo:
 * - Verified Bus Operators & Unverified Operator
 * - Customers with initial BusGo Wallet balances
 * - Bus routes with boarding/dropping points linked to operators
 * - Promotional Offers with real constraints
 * - Demo Gift Cards for wallet redemption
 *
 * Run once: node src/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Bus = require('./models/Bus');
const Offer = require('./models/Offer');
const GiftCard = require('./models/GiftCard');
const WalletTransaction = require('./models/WalletTransaction');
const connectDB = require('./config/db');

const seed = async () => {
  try {
    await connectDB();
    console.log('🧹 Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Bus.deleteMany({}),
      Offer.deleteMany({}),
      GiftCard.deleteMany({}),
      WalletTransaction.deleteMany({}),
    ]);

    const hashedPassword = await bcrypt.hash('Password123', 10);

    // ──────────────────────────────────────────────────────────
    // 1. SEED OPERATORS
    // ──────────────────────────────────────────────────────────
    console.log('🏢 Seeding bus operators...');
    const operatorsData = [
      {
        name: 'Rajesh Sharma',
        email: 'shree@travels.com',
        phone: '9820011223',
        countryCode: '+91',
        city: 'Pune',
        role: 'operator',
        operatorProfile: {
          companyName: 'Shree Travels',
          ownerName: 'Rajesh Sharma',
          businessAddress: 'Plot 45, Swargate Transport Hub, Pune',
          registrationNumber: 'MH-GST-SHREE-01',
          isVerified: true,
          rating: 4.6,
          totalBuses: 4,
          routesServed: ['Pune - Mumbai', 'Delhi - Jaipur'],
          description: '1200+ services including Sleeper and Semi Sleeper buses with top on-time records.',
        },
      },
      {
        name: 'Vikas Deshmukh',
        email: 'citylink@travels.com',
        phone: '9819002233',
        countryCode: '+91',
        city: 'Mumbai',
        role: 'operator',
        operatorProfile: {
          companyName: 'City Link Travels',
          ownerName: 'Vikas Deshmukh',
          businessAddress: 'Sector 17, Vashi, Navi Mumbai',
          registrationNumber: 'MH-GST-CLINK-02',
          isVerified: true,
          rating: 4.2,
          totalBuses: 3,
          routesServed: ['Pune - Mumbai', 'Bangalore - Chennai'],
          description: '800+ services connecting major cities everyday with modern sanitized coaches.',
        },
      },
      {
        name: 'Anil Singhania',
        email: 'national@express.com',
        phone: '9811003344',
        countryCode: '+91',
        city: 'Delhi',
        role: 'operator',
        operatorProfile: {
          companyName: 'National Express',
          ownerName: 'Anil Singhania',
          businessAddress: 'ISBT Kashmiri Gate, New Delhi',
          registrationNumber: 'DL-GST-NATEX-03',
          isVerified: true,
          rating: 4.7,
          totalBuses: 3,
          routesServed: ['Pune - Mumbai', 'Bangalore - Chennai'],
          description: 'Premium Volvo and Scania coaches with onboard entertainment & charging ports.',
        },
      },
      {
        name: 'Karthik Raman',
        email: 'comfort@cruiser.com',
        phone: '9845004455',
        countryCode: '+91',
        city: 'Bangalore',
        role: 'operator',
        operatorProfile: {
          companyName: 'Comfort Cruiser',
          ownerName: 'Karthik Raman',
          businessAddress: 'Madiwala Main Road, Bangalore',
          registrationNumber: 'KA-GST-COMF-04',
          isVerified: true,
          rating: 4.8,
          totalBuses: 2,
          routesServed: ['Mumbai - Pune', 'Hyderabad - Bangalore'],
          description: 'Highly rated sleeper luxury coaches for peaceful overnight journeys.',
        },
      },
      {
        name: 'Deepak Verma',
        email: 'speedway@travels.com',
        phone: '9822005566',
        countryCode: '+91',
        city: 'Nagpur',
        role: 'operator',
        operatorProfile: {
          companyName: 'Speedway Travels',
          ownerName: 'Deepak Verma',
          businessAddress: 'Ganeshpeth Bus Station, Nagpur',
          registrationNumber: 'MH-GST-SPEED-05',
          isVerified: true,
          rating: 4.0,
          totalBuses: 2,
          routesServed: ['Mumbai - Pune', 'Nagpur - Pune'],
          description: 'Budget-friendly seater and sleeper services across western & central India.',
        },
      },
      {
        name: 'Harpreet Singh',
        email: 'royal@coach.com',
        phone: '9872006677',
        countryCode: '+91',
        city: 'Jaipur',
        role: 'operator',
        operatorProfile: {
          companyName: 'Royal Coach Lines',
          ownerName: 'Harpreet Singh',
          businessAddress: 'Sindhi Camp, Station Road, Jaipur',
          registrationNumber: 'RJ-GST-ROYAL-06',
          isVerified: true,
          rating: 4.5,
          totalBuses: 2,
          routesServed: ['Delhi - Jaipur', 'Nagpur - Pune'],
          description: 'Comfortable semi-sleeper and AC sleeper coaches with certified professional drivers.',
        },
      },
      // Unverified operator for demonstration of unverified operator notice / approval flow
      {
        name: 'Suresh Menon',
        email: 'apex@voyager.com',
        phone: '9847007788',
        countryCode: '+91',
        city: 'Kochi',
        role: 'operator',
        operatorProfile: {
          companyName: 'Apex Voyager',
          ownerName: 'Suresh Menon',
          businessAddress: 'MG Road, Ernakulam, Kochi',
          registrationNumber: 'KL-GST-APEX-07',
          isVerified: false, // PENDING VERIFICATION!
          rating: 4.1,
          totalBuses: 0,
          routesServed: [],
          description: 'Newly registered operator pending BusGo safety and documentation verification.',
        },
      },
    ];

    const operatorDocs = [];
    for (const op of operatorsData) {
      const doc = await User.create({
        ...op,
        password: hashedPassword,
        walletBalance: 0,
      });
      operatorDocs.push(doc);
    }

    const opMap = {};
    operatorDocs.forEach((d) => {
      opMap[d.operatorProfile.companyName] = d._id;
    });

    // ──────────────────────────────────────────────────────────
    // 2. SEED CUSTOMERS
    // ──────────────────────────────────────────────────────────
    console.log('👤 Seeding demo customers...');
    const customer = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul@busgo.com',
      password: hashedPassword,
      countryCode: '+91',
      phone: '9876543210',
      dateOfBirth: new Date('1998-05-15'),
      gender: 'male',
      address: 'Flat 402, Green Valley Apartments, Baner',
      city: 'Pune',
      role: 'user',
      walletBalance: 750, // Starts with ₹750 demo credits
    });

    await WalletTransaction.create({
      user: customer._id,
      type: 'credit',
      amount: 750,
      balanceAfter: 750,
      description: 'Account Welcome Bonus & Demonstration Credits',
      source: 'bonus',
    });

    const customer2 = await User.create({
      name: 'Priya Patel',
      email: 'priya@busgo.com',
      password: hashedPassword,
      countryCode: '+91',
      phone: '9123456780',
      dateOfBirth: new Date('2000-09-22'),
      gender: 'female',
      address: 'B-12, Sunrise Residency, Andheri West',
      city: 'Mumbai',
      role: 'user',
      walletBalance: 500,
    });

    await WalletTransaction.create({
      user: customer2._id,
      type: 'credit',
      amount: 500,
      balanceAfter: 500,
      description: 'Account Welcome Bonus Credits',
      source: 'bonus',
    });

    // ──────────────────────────────────────────────────────────
    // 3. SEED BUS ROUTES & SCHEDULES
    // ──────────────────────────────────────────────────────────
    console.log('🚌 Seeding bus routes...');
    const buses = [
      {
        operator: 'Shree Travels',
        operatorId: opMap['Shree Travels'],
        busNumber: 'MH-12-ST-101',
        busType: 'AC Sleeper',
        from: 'pune',
        to: 'mumbai',
        departureTime: '06:00',
        arrivalTime: '09:30',
        duration: '3h 30m',
        fare: 350,
        totalSeats: 40,
        availableSeats: 35,
        amenities: ['WiFi', 'Charging Point', 'Blanket', 'Reading Light', 'Emergency Exit'],
        boardingPoints: [
          { name: 'Swargate - Laxmi Road Corner', time: '06:00' },
          { name: 'Shivajinagar - Near Railway Stn', time: '06:20' },
          { name: 'Wakad - Hinjewadi Flyover', time: '06:45' },
        ],
        droppingPoints: [
          { name: 'Vashi - Highway Bridge', time: '08:45' },
          { name: 'Chembur - Amar Mahal', time: '09:05' },
          { name: 'Dadar East - Asiad Bus Stand', time: '09:30' },
        ],
        rating: 4.6,
      },
      {
        operator: 'City Link Travels',
        operatorId: opMap['City Link Travels'],
        busNumber: 'MH-04-CL-202',
        busType: 'Non-AC Seater',
        from: 'pune',
        to: 'mumbai',
        departureTime: '07:30',
        arrivalTime: '11:00',
        duration: '3h 30m',
        fare: 180,
        totalSeats: 45,
        availableSeats: 40,
        amenities: ['Charging Point', 'Water Bottle'],
        boardingPoints: [
          { name: 'Pune Station Bus Terminal', time: '07:30' },
          { name: 'Aundh - Parihar Chowk', time: '07:50' },
        ],
        droppingPoints: [
          { name: 'Panvel - Kalamboli Circle', time: '10:15' },
          { name: 'Borivali West - Gokul Hotel', time: '11:00' },
        ],
        rating: 4.1,
      },
      {
        operator: 'National Express',
        operatorId: opMap['National Express'],
        busNumber: 'MH-14-NE-303',
        busType: 'Volvo AC',
        from: 'pune',
        to: 'mumbai',
        departureTime: '09:00',
        arrivalTime: '12:30',
        duration: '3h 30m',
        fare: 500,
        totalSeats: 36,
        availableSeats: 22,
        amenities: ['WiFi', 'Charging Point', 'Air Conditioning', 'Blanket', 'Live Tracking', 'Water Bottle'],
        boardingPoints: [
          { name: 'Swargate Bus Stand', time: '09:00' },
          { name: 'Kothrud - Karve Statue', time: '09:20' },
          { name: 'Chandani Chowk', time: '09:35' },
        ],
        droppingPoints: [
          { name: 'Nerul - LP Factory', time: '11:50' },
          { name: 'Sion - Circle Highway', time: '12:15' },
          { name: 'Borivali - National Park Gate', time: '12:30' },
        ],
        rating: 4.8,
      },
      {
        operator: 'Comfort Cruiser',
        operatorId: opMap['Comfort Cruiser'],
        busNumber: 'MH-02-CC-404',
        busType: 'AC Sleeper',
        from: 'mumbai',
        to: 'pune',
        departureTime: '22:00',
        arrivalTime: '01:30',
        duration: '3h 30m',
        fare: 420,
        totalSeats: 40,
        availableSeats: 30,
        amenities: ['WiFi', 'Blanket', 'Pillow', 'AC', 'Reading Lamp'],
        boardingPoints: [
          { name: 'Borivali West - Indraprastha', time: '22:00' },
          { name: 'Andheri East - Bisleri Gate', time: '22:30' },
          { name: 'Dadar - Pritam Hotel', time: '23:00' },
        ],
        droppingPoints: [
          { name: 'Wakad Bridge', time: '00:50' },
          { name: 'Shivajinagar', time: '01:15' },
          { name: 'Swargate Bus Depot', time: '01:30' },
        ],
        rating: 4.7,
      },
      {
        operator: 'Speedway Travels',
        operatorId: opMap['Speedway Travels'],
        busNumber: 'MH-03-SW-505',
        busType: 'Non-AC Seater',
        from: 'mumbai',
        to: 'pune',
        departureTime: '08:00',
        arrivalTime: '11:30',
        duration: '3h 30m',
        fare: 150,
        totalSeats: 50,
        availableSeats: 45,
        amenities: ['Luggage Storage', 'Water Bottle'],
        boardingPoints: [
          { name: 'Thane West - Teen Hath Naka', time: '08:00' },
          { name: 'Vashi Highway', time: '08:30' },
        ],
        droppingPoints: [
          { name: 'Nigdi - Pavana Bridge', time: '10:45' },
          { name: 'Pune Railway Station', time: '11:30' },
        ],
        rating: 3.9,
      },
      {
        operator: 'Royal Coach Lines',
        operatorId: opMap['Royal Coach Lines'],
        busNumber: 'DL-01-RC-606',
        busType: 'Semi Sleeper',
        from: 'delhi',
        to: 'jaipur',
        departureTime: '06:30',
        arrivalTime: '11:00',
        duration: '4h 30m',
        fare: 400,
        totalSeats: 42,
        availableSeats: 38,
        amenities: ['WiFi', 'Charging Point', 'Reclining Seats'],
        boardingPoints: [
          { name: 'ISBT Kashmiri Gate, Platform 4', time: '06:30' },
          { name: 'Dhaula Kuan Metro Station', time: '07:05' },
          { name: 'Gurgaon - IFFCO Chowk', time: '07:35' },
        ],
        droppingPoints: [
          { name: 'Amer Fort Turn', time: '10:30' },
          { name: 'Sindhi Camp Central Bus Stand', time: '11:00' },
        ],
        rating: 4.3,
      },
      {
        operator: 'Shree Travels',
        operatorId: opMap['Shree Travels'],
        busNumber: 'DL-04-ST-707',
        busType: 'AC Seater',
        from: 'delhi',
        to: 'jaipur',
        departureTime: '08:00',
        arrivalTime: '12:30',
        duration: '4h 30m',
        fare: 320,
        totalSeats: 40,
        availableSeats: 25,
        amenities: ['WiFi', 'Air Conditioning', 'Charging Port'],
        boardingPoints: [
          { name: 'Sarai Kale Khan ISBT', time: '08:00' },
          { name: 'Mahipalpur Aerocity Bypass', time: '08:35' },
        ],
        droppingPoints: [
          { name: 'Transport Nagar, Jaipur', time: '12:00' },
          { name: 'Narayan Singh Circle', time: '12:30' },
        ],
        rating: 4.4,
      },
      {
        operator: 'National Express',
        operatorId: opMap['National Express'],
        busNumber: 'KA-01-NE-808',
        busType: 'Volvo AC',
        from: 'bangalore',
        to: 'chennai',
        departureTime: '07:00',
        arrivalTime: '13:00',
        duration: '6h 0m',
        fare: 600,
        totalSeats: 36,
        availableSeats: 18,
        amenities: ['WiFi', 'Charging Point', 'AC', 'Blanket', 'Snacks'],
        boardingPoints: [
          { name: 'Majestic Bus Stand, Bangalore', time: '07:00' },
          { name: 'Shantinagar Bus Station', time: '07:20' },
          { name: 'Electronic City Toll Gate', time: '07:55' },
        ],
        droppingPoints: [
          { name: 'Sriperumbudur Toll', time: '12:15' },
          { name: 'Koyambedu (CMBT), Chennai', time: '13:00' },
        ],
        rating: 4.7,
      },
      {
        operator: 'City Link Travels',
        operatorId: opMap['City Link Travels'],
        busNumber: 'KA-05-CL-909',
        busType: 'Non-AC Sleeper',
        from: 'bangalore',
        to: 'chennai',
        departureTime: '21:00',
        arrivalTime: '03:00',
        duration: '6h 0m',
        fare: 380,
        totalSeats: 40,
        availableSeats: 32,
        amenities: ['Blanket', 'Curtains', 'Luggage Compartment'],
        boardingPoints: [
          { name: 'Kalasipalyam Main Stop', time: '21:00' },
          { name: 'Madiwala Silk Board', time: '21:35' },
        ],
        droppingPoints: [
          { name: 'Guindy Metro Stop', time: '02:35' },
          { name: 'Koyambedu Omni Bus Stand', time: '03:00' },
        ],
        rating: 4.0,
      },
      {
        operator: 'Comfort Cruiser',
        operatorId: opMap['Comfort Cruiser'],
        busNumber: 'AP-09-CC-010',
        busType: 'AC Sleeper',
        from: 'hyderabad',
        to: 'bangalore',
        departureTime: '20:00',
        arrivalTime: '02:00',
        duration: '6h 0m',
        fare: 550,
        totalSeats: 40,
        availableSeats: 28,
        amenities: ['WiFi', 'AC', 'Blanket', 'Personal TV', 'Water Bottle'],
        boardingPoints: [
          { name: 'Miyapur Metro Station', time: '20:00' },
          { name: 'Ameerpet Big Bazaar', time: '20:30' },
          { name: 'Shamshabad Airport Junction', time: '21:15' },
        ],
        droppingPoints: [
          { name: 'Hebbal Flyover, Bangalore', time: '01:25' },
          { name: 'Majestic Bus Stand', time: '02:00' },
        ],
        rating: 4.6,
      },
      {
        operator: 'Speedway Travels',
        operatorId: opMap['Speedway Travels'],
        busNumber: 'MH-31-SW-111',
        busType: 'Non-AC Seater',
        from: 'nagpur',
        to: 'pune',
        departureTime: '05:30',
        arrivalTime: '12:30',
        duration: '7h 0m',
        fare: 250,
        totalSeats: 50,
        availableSeats: 42,
        amenities: ['Emergency First Aid', 'Reading Lamp'],
        boardingPoints: [
          { name: 'Ganeshpeth Central Stand, Nagpur', time: '05:30' },
          { name: 'Dharampeth Chowk', time: '05:50' },
        ],
        droppingPoints: [
          { name: 'Wagholi Highway', time: '11:55' },
          { name: 'Shivajinagar, Pune', time: '12:30' },
        ],
        rating: 3.8,
      },
      {
        operator: 'Royal Coach Lines',
        operatorId: opMap['Royal Coach Lines'],
        busNumber: 'MH-31-RC-212',
        busType: 'Semi Sleeper',
        from: 'nagpur',
        to: 'pune',
        departureTime: '22:30',
        arrivalTime: '05:30',
        duration: '7h 0m',
        fare: 380,
        totalSeats: 42,
        availableSeats: 36,
        amenities: ['Charging Point', 'Blanket', 'WiFi'],
        boardingPoints: [
          { name: 'Rahate Colony Square, Nagpur', time: '22:30' },
          { name: 'Wardha Road Toll Gate', time: '22:55' },
        ],
        droppingPoints: [
          { name: 'Hadapsar Flyover, Pune', time: '05:00' },
          { name: 'Swargate Bus Depot', time: '05:30' },
        ],
        rating: 4.2,
      },
    ];

    await Bus.insertMany(buses);
    console.log(`✅ Seeded ${buses.length} buses successfully!`);

    // ──────────────────────────────────────────────────────────
    // 4. SEED PROMOTIONAL OFFERS
    // ──────────────────────────────────────────────────────────
    console.log('🎁 Seeding promo offers...');
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const offers = [
      {
        code: 'FIRST20',
        title: 'First Booking Offer',
        desc: 'Get 20% OFF up to ₹250 on your very first bus booking.',
        category: 'first',
        discountType: 'percentage',
        discountValue: 20,
        maxDiscount: 250,
        minBookingAmount: 300,
        firstBookingOnly: true,
        validTill: futureDate,
        isActive: true,
      },
      {
        code: 'WEEKEND100',
        title: 'Weekend Discount',
        desc: 'Flat ₹100 OFF on weekend journeys (Saturdays and Sundays).',
        category: 'weekend',
        discountType: 'flat',
        discountValue: 100,
        maxDiscount: 100,
        minBookingAmount: 400,
        weekendOnly: true,
        validTill: futureDate,
        isActive: true,
      },
      {
        code: 'STUDY10',
        title: 'Student Discount',
        desc: 'Extra 10% OFF up to ₹150 for students on all routes.',
        category: 'student',
        discountType: 'percentage',
        discountValue: 10,
        maxDiscount: 150,
        minBookingAmount: 250,
        validTill: futureDate,
        isActive: true,
      },
      {
        code: 'FEST150',
        title: 'Festival Celebration Offer',
        desc: 'Flat ₹150 OFF this festive travel season on bookings above ₹600.',
        category: 'festival',
        discountType: 'flat',
        discountValue: 150,
        maxDiscount: 150,
        minBookingAmount: 600,
        validTill: futureDate,
        isActive: true,
      },
      {
        code: 'GETAWAY200',
        title: 'Weekend Getaway',
        desc: 'Flat ₹200 OFF on intercity weekend travel above ₹800.',
        category: 'weekend',
        discountType: 'flat',
        discountValue: 200,
        maxDiscount: 200,
        minBookingAmount: 800,
        weekendOnly: true,
        validTill: futureDate,
        isActive: true,
      },
      {
        code: 'CAMPUS50',
        title: 'Campus Special',
        desc: 'Instant ₹50 savings on any student trip ticket above ₹200.',
        category: 'student',
        discountType: 'flat',
        discountValue: 50,
        maxDiscount: 50,
        minBookingAmount: 200,
        validTill: futureDate,
        isActive: true,
      },
    ];

    await Offer.insertMany(offers);
    console.log(`✅ Seeded ${offers.length} promo offers successfully!`);

    // ──────────────────────────────────────────────────────────
    // 5. SEED DEMO GIFT CARDS
    // ──────────────────────────────────────────────────────────
    console.log('💳 Seeding demo gift cards...');
    const giftCards = [
      { code: 'BUSGO100', amount: 100, expiryDate: futureDate, isRedeemed: false, isDemo: true },
      { code: 'BUSGO250', amount: 250, expiryDate: futureDate, isRedeemed: false, isDemo: true },
      { code: 'BUSGO500', amount: 500, expiryDate: futureDate, isRedeemed: false, isDemo: true },
      { code: 'FESTIVE300', amount: 300, expiryDate: futureDate, isRedeemed: false, isDemo: true },
      { code: 'STUDENT150', amount: 150, expiryDate: futureDate, isRedeemed: false, isDemo: true },
      { code: 'BONUS200', amount: 200, expiryDate: futureDate, isRedeemed: false, isDemo: true },
    ];

    await GiftCard.insertMany(giftCards);
    console.log(`✅ Seeded ${giftCards.length} demo gift cards successfully!`);

    console.log('\n======================================================');
    console.log('🎉 BUSGO DATABASE SEED COMPLETED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('Test Customer Account: rahul@busgo.com / Password123 (Wallet: ₹750)');
    console.log('Test Operator Account: shree@travels.com / Password123 (Verified)');
    console.log('Unverified Operator:   apex@voyager.com / Password123 (Pending)');
    console.log('Demo Gift Cards:       BUSGO100, BUSGO250, BUSGO500, FESTIVE300');
    console.log('Promo Codes:           FIRST20, WEEKEND100, STUDY10, FEST150, GETAWAY200, CAMPUS50');
    console.log('======================================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seed();
