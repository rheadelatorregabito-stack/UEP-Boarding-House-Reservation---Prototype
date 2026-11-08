/* Sample listings and filter/sort helpers. Replace LISTINGS with API data of the same shape. */

export const PRICE_MIN = 500;
export const PRICE_MAX = 5000;
export const PRICE_STEP = 100;

export const ZONES = [1, 2, 3];

export const GENDER_LABELS = { boys: 'Boys only', girls: 'Girls only', mixed: 'Boys & Girls' };
export const ROOM_LABELS = { shared: 'Shared room', studio: 'Studio' };

export const SORT_OPTIONS = [
  { value: 'price-asc', label: 'Price low to high' },
  { value: 'price-desc', label: 'Price high to low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'slots', label: 'Most slots left' },
];

export const DEFAULT_FILTERS = {
  gender: 'any',
  minPrice: PRICE_MIN,
  maxPrice: PRICE_MAX,
  roomType: 'any',
  zones: [],
};

export const LISTINGS = [
  {
    id: 'sampaguita',
    name: "Sampaguita Girls' Boarding House",
    rating: 4.8,
    zone: 1,
    area: 'Brgy. Rawis',
    gender: 'girls',
    roomType: 'shared',
    owner: 'Mrs. Lourdes Cabal',
    price: 1800,
    slotsLeft: 3,
    totalSlots: 12,
    distance: '400 m from UEP',
    ownerSince: 2023,
    reviewCount: 24,
    description:
      'Clean, quiet and safe boarding house for female UEP students. Each room fits 4 boarders with study tables, lockers and fans. Walking distance to the main gate and the public market.',
    amenities: ['Free WiFi', 'Own CR', 'Cooking area', 'Water 24/7', 'Curfew 10 PM', 'Study tables'],
    palette: { sky: '#cfe3ff', body: '#ffffff', roof: '#e5383b' },
  },
  {
    id: 'villa-marites',
    name: 'Villa Marites Rooms',
    rating: 4.6,
    zone: 2,
    area: 'Near UEP Main Gate',
    gender: 'mixed',
    roomType: 'studio',
    owner: 'Mr. Ramon Abella',
    price: 2500,
    slotsLeft: 1,
    totalSlots: 8,
    distance: '150 m from UEP',
    ownerSince: 2021,
    reviewCount: 18,
    description:
      'Private studio units right beside the UEP main gate. Each unit has its own CR, a small kitchenette and a study corner, with separate floors for male and female boarders.',
    amenities: ['Free WiFi', 'Own CR', 'Kitchenette', 'Water 24/7', 'Curfew 11 PM', 'Aircon'],
    palette: { sky: '#fff1c2', body: '#ffe08a', roof: '#1d4ed8' },
  },
  {
    id: 'kuya-jun',
    name: "Kuya Jun's Bunkhouse",
    rating: 4.4,
    zone: 3,
    area: 'Brgy. Dalakit',
    gender: 'boys',
    roomType: 'shared',
    owner: 'Mr. Junrey Tan',
    price: 1200,
    slotsLeft: 6,
    totalSlots: 20,
    distance: '900 m from UEP',
    ownerSince: 2022,
    reviewCount: 11,
    description:
      'Budget-friendly bunkhouse for male students. Double-deck beds with personal lockers, a shared kitchen and a covered laundry area. Tricycles to UEP pass right outside.',
    amenities: ['Free WiFi', 'Shared CR', 'Cooking area', 'Laundry area', 'Curfew 10 PM', 'Lockers'],
    palette: { sky: '#d8f3e0', body: '#bfe8c9', roof: '#0b1b4d' },
  },
  {
    id: 'casa-ligaya',
    name: 'Casa Ligaya Dormitory',
    rating: 4.9,
    zone: 1,
    area: 'Brgy. Narra',
    gender: 'girls',
    roomType: 'studio',
    owner: 'Mrs. Ligaya Reyes',
    price: 3000,
    slotsLeft: 0,
    totalSlots: 10,
    distance: '600 m from UEP',
    ownerSince: 2020,
    reviewCount: 32,
    description:
      'Quiet dormitory-style studios for female students, with a guard on duty at night. Units come furnished with a bed, study table and cabinet.',
    amenities: ['Free WiFi', 'Own CR', 'Security guard', 'Water 24/7', 'Curfew 9 PM', 'Study tables'],
    palette: { sky: '#ffd9db', body: '#ffffff', roof: '#ffc72c' },
  },
  {
    id: 'bahay-ni-lola',
    name: 'Bahay ni Lola Rooms',
    rating: 4.5,
    zone: 2,
    area: 'Brgy. Cervantes',
    gender: 'mixed',
    roomType: 'shared',
    owner: 'Mrs. Lola Dizon',
    price: 1500,
    slotsLeft: 4,
    totalSlots: 14,
    distance: '1.2 km from UEP',
    ownerSince: 2019,
    reviewCount: 15,
    description:
      'Family-run house with shared rooms on separate floors for male and female boarders. Home-cooked meals are available on request, and there is a garden for studying outdoors.',
    amenities: ['Free WiFi', 'Shared CR', 'Meals available', 'Garden', 'Curfew 10 PM', 'Study tables'],
    palette: { sky: '#e4daff', body: '#fff6d6', roof: '#16a34a' },
  },
  {
    id: 'palm-studio',
    name: 'Palm Studio Apartments',
    rating: 4.7,
    zone: 3,
    area: 'Brgy. Poblacion',
    gender: 'mixed',
    roomType: 'studio',
    owner: 'Mr. Paolo Garcia',
    price: 3500,
    slotsLeft: 2,
    totalSlots: 6,
    distance: '1 km from UEP',
    ownerSince: 2024,
    reviewCount: 9,
    description:
      'Newly built studio apartments with a private CR, aircon and a mini-ref in every unit. Good for students who want more privacy.',
    amenities: ['Free WiFi', 'Own CR', 'Aircon', 'Mini-ref', 'No curfew', 'Parking'],
    palette: { sky: '#cff3f5', body: '#ffffff', roof: '#0b1b4d' },
  },
];

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
});

export const formatPrice = (value) => pesoFormatter.format(value);

export const pluralize = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

/* Every word in the query must match. Words that read as a price ("2000", "₱2,500") keep listings at or
   below that price; anything else is matched against name, zone, area, owner and tags. */

const asPrice = (word) => {
  const digits = word.replace(/[₱,]/g, '');
  if (!/^\d+$/.test(digits)) return null;
  const value = Number(digits);
  return value >= 100 ? value : null; // small numbers are zone numbers, not prices
};

const matchesQuery = (listing, query) => {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;

  const haystack = [
    listing.name,
    `zone ${listing.zone}`,
    listing.area,
    listing.owner,
    GENDER_LABELS[listing.gender],
    ROOM_LABELS[listing.roomType],
  ].join(' ').toLowerCase();

  return words.every((word) => {
    const price = asPrice(word);
    return price !== null ? listing.price <= price : haystack.includes(word);
  });
};

export function filterListings(listings, filters, query = '') {
  return listings.filter((listing) => {
    if (filters.gender !== 'any' && listing.gender !== filters.gender) return false;
    if (listing.price < filters.minPrice || listing.price > filters.maxPrice) return false;
    if (filters.roomType === 'studio' && listing.roomType !== 'studio') return false;
    if (filters.roomType === 'notStudio' && listing.roomType === 'studio') return false;
    if (filters.zones.length > 0 && !filters.zones.includes(listing.zone)) return false;
    return matchesQuery(listing, query);
  });
}

const SORTERS = {
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating,
  slots: (a, b) => b.slotsLeft - a.slotsLeft,
};

export const sortListings = (listings, sort) => [...listings].sort(SORTERS[sort] ?? SORTERS['price-asc']);

export function countActiveFilters(filters) {
  return [
    filters.gender !== 'any',
    filters.minPrice !== PRICE_MIN || filters.maxPrice !== PRICE_MAX,
    filters.roomType !== 'any',
    filters.zones.length > 0,
  ].filter(Boolean).length;
}
