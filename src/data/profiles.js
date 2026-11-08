
export const BOARDER_PROFILE = {
  name: 'Maria Santos',
  bio: 'Second-year UEP student looking for a quiet, clean place near campus. I like studying early and keeping a tidy room.',
  email: 'maria.santos@email.com',
  phone: '+63 905 555 1234',
  school: 'University of Eastern Philippines',
  facebook: 'facebook.com/maria.santos',
  instagram: '',
  messenger: '',
};

/* What a boarder who just logged in starts with: their own name/email/phone, nobody else's details. */
export const blankBoarderProfile = ({ name, email, phone = '' }) => ({
  name,
  bio: '',
  email,
  phone,
  school: BOARDER_PROFILE.school,
  facebook: '',
  instagram: '',
  messenger: '',
});

export const OWNER_PROFILE = {
  name: 'Lourdes Cabal',
  bio: 'Owner of Sampaguita Girls’ Boarding House since 2018. I treat every boarder like family and keep the house clean, safe and quiet for studying.',
  email: 'lourdes.cabal@email.com',
  phone: '+63 917 123 4567',
  address: 'Brgy. Rawis, Catarman, Northern Samar',
  facebook: 'facebook.com/lourdes.cabal',
  instagram: '',
  messenger: '',
  boarders: 14,
};

/* A different owner logging in keeps the boarding house details but none of the sample owner's personal info. */
export const blankOwnerProfile = ({ name, email, phone = '' }) => ({
  ...OWNER_PROFILE,
  name,
  bio: '',
  email,
  phone,
  facebook: '',
  instagram: '',
  messenger: '',
});

// The owner's own posts. Sampaguita is also in the public feed.
export const OWNER_LISTING_IDS = ['sampaguita'];

export const OWNER_EXTRA_LISTINGS = [
  {
    id: 'sampaguita-annex',
    name: 'Sampaguita Annex',
    rating: 0,
    zone: 2,
    area: 'Brgy. Rawis',
    gender: 'mixed',
    roomType: 'studio',
    owner: 'Mrs. Lourdes Cabal',
    price: 2200,
    slotsLeft: 2,
    totalSlots: 6,
    description: 'Newer studio units a few streets from the main house, open to both male and female boarders.',
    amenities: ['Free WiFi', 'Own CR', 'Cooking area'],
    palette: { sky: '#fff1c2', body: '#ffe08a', roof: '#1d4ed8' },
  },
];
