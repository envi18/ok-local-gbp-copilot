// src/lib/mockGoogleBusinessData.ts
// Comprehensive mock data matching Google Business Profile API structure
// Use this for development and QA while waiting for Google API access

// Re-export types from service for convenience
export type {
  BusinessAccount,
  BusinessLocation,
  BusinessReview,
  LocationInsights
} from './googleBusinessProfileService';

import type {
  BusinessAccount,
  BusinessLocation,
  BusinessReview,
  LocationInsights
} from './googleBusinessProfileService';

/**
 * Mock Google Business Accounts
 * Represents different business ownership scenarios
 */
export const mockAccounts: BusinessAccount[] = [
  {
    name: "accounts/mock-account-001",
    accountName: "OK Local Demo Business",
    type: "PERSONAL",
    role: "OWNER",
    state: {
      status: "VERIFIED"
    }
  },
  {
    name: "accounts/mock-account-002",
    accountName: "Multi-Location Restaurant Group",
    type: "ORGANIZATION",
    role: "OWNER",
    state: {
      status: "VERIFIED"
    }
  },
  {
    name: "accounts/mock-account-003",
    accountName: "Managed Client Account",
    type: "ORGANIZATION",
    role: "MANAGER",
    state: {
      status: "VERIFIED"
    }
  }
];

/**
 * Mock Business Locations
 * Represents various business types with complete data
 */
export const mockLocations: BusinessLocation[] = [
  // Coffee Shop
  {
    name: "accounts/mock-account-001/locations/location-001",
    languageCode: "en",
    storeCode: "OKLOCAL-COFFEE-01",
    locationName: "OK Local Coffee House",
    primaryPhone: "+12065551234",
    additionalPhones: ["+12065551235"],
    address: {
      regionCode: "US",
      languageCode: "en",
      postalCode: "98101",
      administrativeArea: "WA",
      locality: "Seattle",
      addressLines: ["123 Pike Street", "Suite 100"]
    },
    primaryCategory: {
      categoryId: "gcid:coffee_shop",
      displayName: "Coffee Shop"
    },
    additionalCategories: [
      {
        categoryId: "gcid:cafe",
        displayName: "Cafe"
      },
      {
        categoryId: "gcid:breakfast_restaurant",
        displayName: "Breakfast Restaurant"
      }
    ],
    websiteUri: "https://oklocalcoffee.com",
    regularHours: {
      periods: [
        { openDay: "MONDAY", openTime: "07:00", closeDay: "MONDAY", closeTime: "19:00" },
        { openDay: "TUESDAY", openTime: "07:00", closeDay: "TUESDAY", closeTime: "19:00" },
        { openDay: "WEDNESDAY", openTime: "07:00", closeDay: "WEDNESDAY", closeTime: "19:00" },
        { openDay: "THURSDAY", openTime: "07:00", closeDay: "THURSDAY", closeTime: "19:00" },
        { openDay: "FRIDAY", openTime: "07:00", closeDay: "FRIDAY", closeTime: "20:00" },
        { openDay: "SATURDAY", openTime: "08:00", closeDay: "SATURDAY", closeTime: "20:00" },
        { openDay: "SUNDAY", openTime: "08:00", closeDay: "SUNDAY", closeTime: "18:00" }
      ]
    },
    specialHours: {
      specialHourPeriods: [
        {
          specialDate: { year: 2025, month: 12, day: 25 },
          openTime: "00:00",
          closeTime: "00:00",
          closed: true
        }
      ]
    },
    serviceArea: {
      businessType: "CUSTOMER_LOCATION_ONLY",
      places: {
        placeInfos: [
          { name: "Seattle, WA", placeId: "ChIJVTPokywQkFQRmtVEaUZlJRA" }
        ]
      }
    },
    labels: ["Organic Coffee", "Free WiFi", "Pet Friendly"],
    adWordsLocationExtensions: {
      adPhone: "+12065551234"
    },
    latlng: {
      latitude: 47.6097,
      longitude: -122.3331
    },
    openInfo: {
      status: "OPEN",
      canReopen: false,
      openingDate: { year: 2020, month: 3, day: 15 }
    },
    locationKey: {
      placeId: "ChIJMock123Coffee456",
      plusPageId: "",
      explicitNoPlaceId: false
    },
    profile: {
      description: "Your neighborhood artisan coffee shop serving locally roasted organic coffee, fresh pastries, and light breakfast options. Free WiFi, cozy atmosphere perfect for work or relaxation. We pride ourselves on sustainable practices and supporting local farmers."
    },
    relationshipData: {
      parentChain: []
    },
    moreHours: []
  },
  
  // Italian Restaurant
  {
    name: "accounts/mock-account-002/locations/location-002",
    languageCode: "en",
    storeCode: "BELLA-SEATTLE-01",
    locationName: "Bella Vista Italian Restaurant",
    primaryPhone: "+12065552345",
    additionalPhones: [],
    address: {
      regionCode: "US",
      languageCode: "en",
      postalCode: "98104",
      administrativeArea: "WA",
      locality: "Seattle",
      addressLines: ["456 First Avenue"]
    },
    primaryCategory: {
      categoryId: "gcid:italian_restaurant",
      displayName: "Italian Restaurant"
    },
    additionalCategories: [
      {
        categoryId: "gcid:fine_dining_restaurant",
        displayName: "Fine Dining Restaurant"
      },
      {
        categoryId: "gcid:wine_bar",
        displayName: "Wine Bar"
      }
    ],
    websiteUri: "https://bellavistaseattle.com",
    regularHours: {
      periods: [
        { openDay: "TUESDAY", openTime: "17:00", closeDay: "TUESDAY", closeTime: "22:00" },
        { openDay: "WEDNESDAY", openTime: "17:00", closeDay: "WEDNESDAY", closeTime: "22:00" },
        { openDay: "THURSDAY", openTime: "17:00", closeDay: "THURSDAY", closeTime: "22:00" },
        { openDay: "FRIDAY", openTime: "17:00", closeDay: "FRIDAY", closeTime: "23:00" },
        { openDay: "SATURDAY", openTime: "17:00", closeDay: "SATURDAY", closeTime: "23:00" },
        { openDay: "SUNDAY", openTime: "16:00", closeDay: "SUNDAY", closeTime: "21:00" }
      ]
    },
    specialHours: {
      specialHourPeriods: []
    },
    serviceArea: {
      businessType: "CUSTOMER_AND_BUSINESS_LOCATION",
      places: {
        placeInfos: [
          { name: "Seattle, WA", placeId: "ChIJVTPokywQkFQRmtVEaUZlJRA" },
          { name: "Bellevue, WA", placeId: "ChIJteZnS8lBkFQRZ8w0Si5gMoM" }
        ]
      }
    },
    labels: ["Authentic Italian", "Wine Selection", "Romantic Dining", "Reservations Recommended"],
    adWordsLocationExtensions: {
      adPhone: "+12065552345"
    },
    latlng: {
      latitude: 47.6038,
      longitude: -122.3301
    },
    openInfo: {
      status: "OPEN",
      canReopen: false,
      openingDate: { year: 2018, month: 6, day: 1 }
    },
    locationKey: {
      placeId: "ChIJMock456Restaurant789",
      plusPageId: "",
      explicitNoPlaceId: false
    },
    profile: {
      description: "Authentic Northern Italian cuisine featuring handmade pasta, fresh seafood, and an extensive wine selection. Our chefs bring generations of family recipes from Tuscany and Lombardy. Perfect for romantic dinners, special occasions, or business dining."
    },
    relationshipData: {
      parentChain: [
        {
          chainId: "chain-001",
          chainName: "Bella Vista Restaurant Group"
        }
      ]
    },
    moreHours: []
  },
  
  // Hair Salon
  {
    name: "accounts/mock-account-003/locations/location-003",
    languageCode: "en",
    storeCode: "SALON-CAP-01",
    locationName: "Capitol Hill Hair Studio",
    primaryPhone: "+12065553456",
    additionalPhones: [],
    address: {
      regionCode: "US",
      languageCode: "en",
      postalCode: "98102",
      administrativeArea: "WA",
      locality: "Seattle",
      addressLines: ["789 Broadway East"]
    },
    primaryCategory: {
      categoryId: "gcid:hair_salon",
      displayName: "Hair Salon"
    },
    additionalCategories: [
      {
        categoryId: "gcid:beauty_salon",
        displayName: "Beauty Salon"
      },
      {
        categoryId: "gcid:hair_care",
        displayName: "Hair Care"
      }
    ],
    websiteUri: "https://capitolhillhairstudio.com",
    regularHours: {
      periods: [
        { openDay: "TUESDAY", openTime: "10:00", closeDay: "TUESDAY", closeTime: "19:00" },
        { openDay: "WEDNESDAY", openTime: "10:00", closeDay: "WEDNESDAY", closeTime: "19:00" },
        { openDay: "THURSDAY", openTime: "10:00", closeDay: "THURSDAY", closeTime: "20:00" },
        { openDay: "FRIDAY", openTime: "10:00", closeDay: "FRIDAY", closeTime: "20:00" },
        { openDay: "SATURDAY", openTime: "09:00", closeDay: "SATURDAY", closeTime: "18:00" },
        { openDay: "SUNDAY", openTime: "10:00", closeDay: "SUNDAY", closeTime: "17:00" }
      ]
    },
    specialHours: {
      specialHourPeriods: []
    },
    serviceArea: {
      businessType: "CUSTOMER_LOCATION_ONLY",
      places: {
        placeInfos: [
          { name: "Seattle, WA", placeId: "ChIJVTPokywQkFQRmtVEaUZlJRA" }
        ]
      }
    },
    labels: ["Walk-ins Welcome", "Color Specialist", "Balayage Expert"],
    adWordsLocationExtensions: {
      adPhone: "+12065553456"
    },
    latlng: {
      latitude: 47.6205,
      longitude: -122.3212
    },
    openInfo: {
      status: "OPEN",
      canReopen: false,
      openingDate: { year: 2019, month: 9, day: 10 }
    },
    locationKey: {
      placeId: "ChIJMock789Salon012",
      plusPageId: "",
      explicitNoPlaceId: false
    },
    profile: {
      description: "Modern hair salon specializing in cutting-edge color techniques, precision cuts, and styling. Our talented stylists stay current with the latest trends and techniques. We use only premium, sustainable hair care products. Book online or walk-ins welcome!"
    },
    relationshipData: {
      parentChain: []
    },
    moreHours: []
  },
  
  // Dental Office
  {
    name: "accounts/mock-account-001/locations/location-004",
    languageCode: "en",
    storeCode: "SMILE-DENTAL-01",
    locationName: "Bright Smile Family Dentistry",
    primaryPhone: "+12065554567",
    additionalPhones: ["+12065554568"],
    address: {
      regionCode: "US",
      languageCode: "en",
      postalCode: "98103",
      administrativeArea: "WA",
      locality: "Seattle",
      addressLines: ["321 Fremont Avenue North", "Floor 2"]
    },
    primaryCategory: {
      categoryId: "gcid:dentist",
      displayName: "Dentist"
    },
    additionalCategories: [
      {
        categoryId: "gcid:dental_clinic",
        displayName: "Dental Clinic"
      },
      {
        categoryId: "gcid:cosmetic_dentist",
        displayName: "Cosmetic Dentist"
      }
    ],
    websiteUri: "https://brightsmileseattle.com",
    regularHours: {
      periods: [
        { openDay: "MONDAY", openTime: "08:00", closeDay: "MONDAY", closeTime: "17:00" },
        { openDay: "TUESDAY", openTime: "08:00", closeDay: "TUESDAY", closeTime: "17:00" },
        { openDay: "WEDNESDAY", openTime: "08:00", closeDay: "WEDNESDAY", closeTime: "17:00" },
        { openDay: "THURSDAY", openTime: "08:00", closeDay: "THURSDAY", closeTime: "17:00" },
        { openDay: "FRIDAY", openTime: "08:00", closeDay: "FRIDAY", closeTime: "15:00" }
      ]
    },
    specialHours: {
      specialHourPeriods: []
    },
    serviceArea: {
      businessType: "CUSTOMER_LOCATION_ONLY",
      places: {
        placeInfos: [
          { name: "Seattle, WA", placeId: "ChIJVTPokywQkFQRmtVEaUZlJRA" },
          { name: "Shoreline, WA", placeId: "ChIJ-ZeDslENkFQREZHq5prafL0" }
        ]
      }
    },
    labels: ["Family Friendly", "Emergency Services", "New Patients Welcome", "Insurance Accepted"],
    adWordsLocationExtensions: {
      adPhone: "+12065554567"
    },
    latlng: {
      latitude: 47.6505,
      longitude: -122.3493
    },
    openInfo: {
      status: "OPEN",
      canReopen: false,
      openingDate: { year: 2015, month: 1, day: 5 }
    },
    locationKey: {
      placeId: "ChIJMock012Dental345",
      plusPageId: "",
      explicitNoPlaceId: false
    },
    profile: {
      description: "Comprehensive family dentistry offering preventive care, cosmetic dentistry, and emergency services. Our experienced team provides gentle, compassionate care for all ages. State-of-the-art facility with digital X-rays and same-day appointments available."
    },
    relationshipData: {
      parentChain: []
    },
    moreHours: []
  },
  
  // Fitness Center
  {
    name: "accounts/mock-account-002/locations/location-005",
    languageCode: "en",
    storeCode: "FIT-BALLARD-01",
    locationName: "Peak Performance Fitness",
    primaryPhone: "+12065555678",
    additionalPhones: [],
    address: {
      regionCode: "US",
      languageCode: "en",
      postalCode: "98107",
      administrativeArea: "WA",
      locality: "Seattle",
      addressLines: ["1500 NW Market Street"]
    },
    primaryCategory: {
      categoryId: "gcid:gym",
      displayName: "Gym"
    },
    additionalCategories: [
      {
        categoryId: "gcid:fitness_center",
        displayName: "Fitness Center"
      },
      {
        categoryId: "gcid:personal_trainer",
        displayName: "Personal Trainer"
      }
    ],
    websiteUri: "https://peakperformancefitness.com",
    regularHours: {
      periods: [
        { openDay: "MONDAY", openTime: "05:00", closeDay: "MONDAY", closeTime: "22:00" },
        { openDay: "TUESDAY", openTime: "05:00", closeDay: "TUESDAY", closeTime: "22:00" },
        { openDay: "WEDNESDAY", openTime: "05:00", closeDay: "WEDNESDAY", closeTime: "22:00" },
        { openDay: "THURSDAY", openTime: "05:00", closeDay: "THURSDAY", closeTime: "22:00" },
        { openDay: "FRIDAY", openTime: "05:00", closeDay: "FRIDAY", closeTime: "21:00" },
        { openDay: "SATURDAY", openTime: "07:00", closeDay: "SATURDAY", closeTime: "20:00" },
        { openDay: "SUNDAY", openTime: "07:00", closeDay: "SUNDAY", closeTime: "19:00" }
      ]
    },
    specialHours: {
      specialHourPeriods: []
    },
    serviceArea: {
      businessType: "CUSTOMER_LOCATION_ONLY",
      places: {
        placeInfos: [
          { name: "Seattle, WA", placeId: "ChIJVTPokywQkFQRmtVEaUZlJRA" }
        ]
      }
    },
    labels: ["Personal Training", "Group Classes", "24/7 Access", "Free Trial"],
    adWordsLocationExtensions: {
      adPhone: "+12065555678"
    },
    latlng: {
      latitude: 47.6684,
      longitude: -122.3859
    },
    openInfo: {
      status: "OPEN",
      canReopen: false,
      openingDate: { year: 2021, month: 4, day: 1 }
    },
    locationKey: {
      placeId: "ChIJMock345Fitness678",
      plusPageId: "",
      explicitNoPlaceId: false
    },
    profile: {
      description: "State-of-the-art fitness center featuring top-quality equipment, certified personal trainers, and diverse group classes. From HIIT to yoga, we offer programs for all fitness levels. Premium membership includes 24/7 access, towel service, and nutrition coaching."
    },
    relationshipData: {
      parentChain: [
        {
          chainId: "chain-002",
          chainName: "Peak Performance Fitness Group"
        }
      ]
    },
    moreHours: []
  }
];

/**
 * Mock Business Reviews
 * Realistic review distribution across locations
 */
export const mockReviews: BusinessReview[] = [
  // Coffee Shop Reviews
  {
    name: "accounts/mock-account-001/locations/location-001/reviews/review-001",
    reviewId: "review-coffee-001",
    reviewer: {
      profilePhotoUrl: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=667eea&color=fff",
      displayName: "Sarah Johnson",
      isAnonymous: false
    },
    starRating: 5,
    comment: "Best coffee in Seattle! The baristas are knowledgeable and friendly. Love the cozy atmosphere and free WiFi. Perfect spot for remote work.",
    createTime: "2025-10-10T14:30:00Z",
    updateTime: "2025-10-10T14:30:00Z",
    reviewReply: {
      comment: "Thank you so much, Sarah! We're thrilled to be your go-to spot for coffee and work. See you soon! ☕",
      updateTime: "2025-10-11T09:15:00Z"
    }
  },
  {
    name: "accounts/mock-account-001/locations/location-001/reviews/review-002",
    reviewId: "review-coffee-002",
    reviewer: {
      profilePhotoUrl: "https://ui-avatars.com/api/?name=Michael+Chen&background=11998e&color=fff",
      displayName: "Michael Chen",
      isAnonymous: false
    },
    starRating: 5,
    comment: "Fantastic organic coffee and the pastries are always fresh. The staff remembers my order! Highly recommend the maple oat latte.",
    createTime: "2025-10-08T08:45:00Z",
    updateTime: "2025-10-08T08:45:00Z",
    reviewReply: {
      comment: "Thanks Michael! We love seeing you every morning. That maple oat latte is a favorite! 🍁",
      updateTime: "2025-10-08T16:20:00Z"
    }
  },
  {
    name: "accounts/mock-account-001/locations/location-001/reviews/review-003",
    reviewId: "review-coffee-003",
    reviewer: {
      profilePhotoUrl: "https://ui-avatars.com/api/?name=Emily+Rodriguez&background=f093fb&color=fff",
      displayName: "Emily Rodriguez",
      isAnonymous: false
    },
    starRating: 4,
    comment: "Great coffee and nice ambiance. Sometimes gets crowded during lunch rush, but worth the wait. The avocado toast is delicious!",
    createTime: "2025-10-05T12:20:00Z",
    updateTime: "2025-10-05T12:20:00Z"
  },
  {
    name: "accounts/mock-account-001/locations/location-001/reviews/review-004",
    reviewId: "review-coffee-004",
    reviewer: {
      profilePhotoUrl: "https://ui-avatars.com/api/?name=David+Kim&background=764ba2&color=fff",
      displayName: "David Kim",
      isAnonymous: false
    },
    starRating: 5,
    comment: "Love supporting local businesses! The coffee is ethically sourced and tastes amazing. Pet-friendly patio is a huge plus!",
    createTime: "2025-10-01T16:30:00Z",
    updateTime: "2025-10-01T16:30:00Z",
    reviewReply: {
      comment: "Thank you David! We're proud to source from sustainable farms and love seeing your pup on our patio! 🐕",
      updateTime: "2025-10-02T10:00:00Z"
    }
  },
  {
    name: "accounts/mock-account-001/locations/location-001/reviews/review-005",
    reviewId: "review-coffee-005",
    reviewer: {
      profilePhotoUrl: "https://ui-avatars.com/api/?name=Jessica+Brown&background=f45a4e&color=fff",
      displayName: "Jessica Brown",
      isAnonymous: false
    },
    starRating: 3,
    comment: "Coffee is good but prices are a bit high. Service can be slow when busy. Still come back for the quality though.",
    createTime: "2025-09-28T11:15:00Z",
    updateTime: "2025-09-28T11:15:00Z"
  },
  
  // Restaurant Reviews
  {
    name: "accounts/mock-account-002/locations/location-002/reviews/review-006",
    reviewId: "review-restaurant-001",
    reviewer: {
      profilePhotoUrl: "https://ui-avatars.com/api/?name=Robert+Williams&background=667eea&color=fff",
      displayName: "Robert Williams",
      isAnonymous: false
    },
    starRating: 5,
    comment: "Absolutely incredible dining experience! The handmade pasta was perfection and the wine pairing was spot on. Service was impeccable. Worth every penny for a special occasion.",
    createTime: "2025-10-12T20:30:00Z",
    updateTime: "2025-10-12T20:30:00Z",
    reviewReply: {
      comment: "Grazie mille, Robert! We're honored to have been part of your special evening. Chef Antonio will be delighted to hear your praise for the pasta. 🍝",
      updateTime: "2025-10-13T11:00:00Z"
    }
  },
  {
    name: "accounts/mock-account-002/locations/location-002/reviews/review-007",
    reviewId: "review-restaurant-002",
    reviewer: {
      profilePhotoUrl: "https://ui-avatars.com/api/?name=Amanda+Garcia&background=11998e&color=fff",
      displayName: "Amanda Garcia",
      isAnonymous: false
    },
    starRating: 5,
    comment: "Best Italian food outside of Italy! The osso buco melted in my mouth. Romantic atmosphere perfect for date night. Make reservations - it's popular!",
    createTime: "2025-10-09T19:45:00Z",
    updateTime: "2025-10-09T19:45:00Z"
  },
  {
    name: "accounts/mock-account-002/locations/location-002/reviews/review-008",
    reviewId: "review-restaurant-003",
    reviewer: {
      profilePhotoUrl: "https://ui-avatars.com/api/?name=Christopher+Lee&background=f093fb&color=fff",
      displayName: "Christopher Lee",
      isAnonymous: false
    },
    starRating: 4,
    comment: "Excellent food and extensive wine list. Service was friendly but a bit slow during dinner rush. Still highly recommend for special occasions.",
    createTime: "2025-10-06T21:00:00Z",
    updateTime: "2025-10-06T21:00:00Z",
    reviewReply: {
      comment: "Thank you Christopher! We apologize for the slower service - we were particularly busy that evening. We're working on improving our timing during peak hours. We'd love to welcome you back!",
      updateTime: "2025-10-07T10:30:00Z"
    }
  },
  
  // Salon Reviews
  {
    name: "accounts/mock-account-003/locations/location-003/reviews/review-009",
    reviewId: "review-salon-001",
    reviewer: {
      profilePhotoUrl: "https://ui-avatars.com/api/?name=Jennifer+Taylor&background=764ba2&color=fff",
      displayName: "Jennifer Taylor",
      isAnonymous: false
    },
    starRating: 5,
    comment: "Ashley is a color genius! Best balayage I've ever had. She really listened to what I wanted and the results are stunning. Already booked my next appointment!",
    createTime: "2025-10-11T15:30:00Z",
    updateTime: "2025-10-11T15:30:00Z",
    reviewReply: {
      comment: "Thank you Jennifer! Ashley is thrilled you love your color. We can't wait to see you again! 💇‍♀️✨",
      updateTime: "2025-10-11T17:00:00Z"
    }
  },
  {
    name: "accounts/mock-account-003/locations/location-003/reviews/review-010",
    reviewId: "review-salon-002",
    reviewer: {
      profilePhotoUrl: "https://ui-avatars.com/api/?name=Nicole+Martinez&background=f45a4e&color=fff",
      displayName: "Nicole Martinez",
      isAnonymous: false
    },
    starRating: 5,
    comment: "Great atmosphere and talented stylists. I've been coming here for 2 years and always leave happy. Prices are reasonable for the quality you get.",
    createTime: "2025-10-07T14:00:00Z",
    updateTime: "2025-10-07T14:00:00Z"
  },
  
  // Dental Reviews
  {
    name: "accounts/mock-account-001/locations/location-004/reviews/review-011",
    reviewId: "review-dental-001",
    reviewer: {
      profilePhotoUrl: "https://ui-avatars.com/api/?name=Thomas+Anderson&background=667eea&color=fff",
      displayName: "Thomas Anderson",
      isAnonymous: false
    },
    starRating: 5,
    comment: "Dr. Peterson and her team are wonderful! They made my daughter feel comfortable for her first visit. Very thorough and gentle. We found our family dentist!",
    createTime: "2025-10-10T16:00:00Z",
    updateTime: "2025-10-10T16:00:00Z",
    reviewReply: {
      comment: "We're so happy your daughter had a positive first experience! Building trust with our young patients is so important to us. Thank you for choosing Bright Smile! 😁",
      updateTime: "2025-10-11T09:00:00Z"
    }
  },
  {
    name: "accounts/mock-account-001/locations/location-004/reviews/review-012",
    reviewId: "review-dental-002",
    reviewer: {
      profilePhotoUrl: "https://ui-avatars.com/api/?name=Linda+White&background=11998e&color=fff",
      displayName: "Linda White",
      isAnonymous: false
    },
    starRating: 5,
    comment: "Modern facility with latest technology. Staff is professional and caring. They work with my insurance and pricing is transparent. Highly recommend!",
    createTime: "2025-10-04T11:30:00Z",
    updateTime: "2025-10-04T11:30:00Z"
  },
  
  // Gym Reviews
  {
    name: "accounts/mock-account-002/locations/location-005/reviews/review-013",
    reviewId: "review-gym-001",
    reviewer: {
      profilePhotoUrl: "https://ui-avatars.com/api/?name=Marcus+Johnson&background=f093fb&color=fff",
      displayName: "Marcus Johnson",
      isAnonymous: false
    },
    starRating: 5,
    comment: "Best gym in Ballard! Equipment is top-notch and always clean. The trainers are knowledgeable and motivating. Group classes are challenging and fun!",
    createTime: "2025-10-09T18:00:00Z",
    updateTime: "2025-10-09T18:00:00Z",
    reviewReply: {
      comment: "Thanks Marcus! We love your energy in the morning HIIT classes. Keep crushing those goals! 💪",
      updateTime: "2025-10-10T08:00:00Z"
    }
  },
  {
    name: "accounts/mock-account-002/locations/location-005/reviews/review-014",
    reviewId: "review-gym-002",
    reviewer: {
      profilePhotoUrl: "https://ui-avatars.com/api/?name=Rachel+Davis&background=764ba2&color=fff",
      displayName: "Rachel Davis",
      isAnonymous: false
    },
    starRating: 4,
    comment: "Great facility with good variety of equipment. Can get crowded during peak hours. Staff is friendly and helpful. Worth the membership!",
    createTime: "2025-10-03T19:30:00Z",
    updateTime: "2025-10-03T19:30:00Z"
  },
  {
    name: "accounts/mock-account-002/locations/location-005/reviews/review-015",
    reviewId: "review-gym-003",
    reviewer: {
      profilePhotoUrl: "https://ui-avatars.com/api/?name=Kevin+Thompson&background=f45a4e&color=fff",
      displayName: "Kevin Thompson",
      isAnonymous: false
    },
    starRating: 5,
    comment: "Personal training with Jake has been life-changing. Down 25 pounds in 3 months! The nutrition coaching is incredibly helpful. Couldn't recommend this gym more!",
    createTime: "2025-09-30T17:00:00Z",
    updateTime: "2025-09-30T17:00:00Z",
    reviewReply: {
      comment: "Kevin, we're so proud of your progress! Jake is an amazing trainer and your dedication shows. Keep up the fantastic work! 🎯",
      updateTime: "2025-10-01T09:00:00Z"
    }
  }
];

/**
 * Mock Location Insights
 * Performance data for the past 30 days
 */
export const mockInsights: LocationInsights = {
  locationMetrics: [
    {
      locationName: "accounts/mock-account-001/locations/location-001",
      timeZone: "America/Los_Angeles",
      metricValues: [
        {
          metric: "QUERIES_DIRECT",
          dimensionalValues: generateLast30Days().map((date, index) => ({
            dimension: "DATE",
            value: date,
            metricValues: [
              { metric: "QUERIES_DIRECT", value: String(35 + Math.floor(Math.random() * 20)) }
            ]
          }))
        },
        {
          metric: "QUERIES_INDIRECT",
          dimensionalValues: generateLast30Days().map((date, index) => ({
            dimension: "DATE",
            value: date,
            metricValues: [
              { metric: "QUERIES_INDIRECT", value: String(120 + Math.floor(Math.random() * 40)) }
            ]
          }))
        },
        {
          metric: "VIEWS_MAPS",
          dimensionalValues: generateLast30Days().map((date, index) => ({
            dimension: "DATE",
            value: date,
            metricValues: [
              { metric: "VIEWS_MAPS", value: String(85 + Math.floor(Math.random() * 30)) }
            ]
          }))
        },
        {
          metric: "VIEWS_SEARCH",
          dimensionalValues: generateLast30Days().map((date, index) => ({
            dimension: "DATE",
            value: date,
            metricValues: [
              { metric: "VIEWS_SEARCH", value: String(195 + Math.floor(Math.random() * 50)) }
            ]
          }))
        },
        {
          metric: "ACTIONS_WEBSITE",
          dimensionalValues: generateLast30Days().map((date, index) => ({
            dimension: "DATE",
            value: date,
            metricValues: [
              { metric: "ACTIONS_WEBSITE", value: String(12 + Math.floor(Math.random() * 8)) }
            ]
          }))
        },
        {
          metric: "ACTIONS_PHONE",
          dimensionalValues: generateLast30Days().map((date, index) => ({
            dimension: "DATE",
            value: date,
            metricValues: [
              { metric: "ACTIONS_PHONE", value: String(8 + Math.floor(Math.random() * 6)) }
            ]
          }))
        },
        {
          metric: "ACTIONS_DRIVING_DIRECTIONS",
          dimensionalValues: generateLast30Days().map((date, index) => ({
            dimension: "DATE",
            value: date,
            metricValues: [
              { metric: "ACTIONS_DRIVING_DIRECTIONS", value: String(15 + Math.floor(Math.random() * 10)) }
            ]
          }))
        }
      ]
    }
  ]
};

/**
 * Helper function to generate last 30 days
 */
function generateLast30Days(): string[] {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

/**
 * Helper function to get locations by account
 */
export function getLocationsByAccount(accountName: string): BusinessLocation[] {
  return mockLocations.filter(location => 
    location.name.startsWith(accountName)
  );
}

/**
 * Helper function to get reviews by location
 */
export function getReviewsByLocation(locationName: string): BusinessReview[] {
  return mockReviews.filter(review => 
    review.name.startsWith(locationName)
  );
}

/**
 * Helper function to calculate average rating
 */
export function calculateAverageRating(reviews: BusinessReview[]): number {
  if (reviews.length === 0) return 0;
  
  const totalRating = reviews.reduce((sum, review) => 
    sum + (review.starRating || 0), 0
  );
  
  return Number((totalRating / reviews.length).toFixed(1));
}

/**
 * Export all mock data as a single object
 */
export const mockGoogleBusinessData = {
  accounts: mockAccounts,
  locations: mockLocations,
  reviews: mockReviews,
  insights: mockInsights
};