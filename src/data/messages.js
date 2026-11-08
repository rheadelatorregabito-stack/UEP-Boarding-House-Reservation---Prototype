import { GENDER_LABELS, ROOM_LABELS, formatPrice, pluralize } from '../components/BoarderHome/listings';

/* Sample conversations. `from: 'me'` is the signed-in user, `from: 'bot'` is the BoardEase auto-reply helper,
   anything else is the other person.
   A sample `text` can be a function of the logged-in boarder ({ name }) so greetings use
   their real name; `personalizeThreads` turns those into plain strings for display. */

export const BOARDER_THREADS = [
  {
    id: 'sampaguita',
    listingId: 'sampaguita',
    contact: 'Mrs. Lourdes Cabal',
    color: '#1d4ed8',
    context: "Sampaguita Girls' BH",
    detail: "Owner · Sampaguita Girls' Boarding House",
    time: '2m',
    unread: 1,
    messages: [
      { id: 'm1', from: 'me', text: 'Hi po! Is there still a slot for next semester?', time: '9:41 AM' },
      { id: 'm2', from: 'them', text: ({ name }) => `Hello ${name}! Yes, we still have 3 slots in the girls’ room.`, time: '9:43 AM' },
      { id: 'm3', from: 'me', text: 'How much is the monthly rent and is WiFi included?', time: '9:45 AM' },
      { id: 'm4', from: 'them', text: '₱1,800 per month and WiFi is free. You can visit anytime this week.', time: '9:46 AM' },
    ],
  },
  {
    id: 'villa-marites',
    listingId: 'villa-marites',
    contact: 'Mr. Ramon Abella',
    color: '#16a34a',
    context: 'Villa Marites Rooms',
    detail: 'Owner · Villa Marites Rooms',
    time: '1h',
    unread: 0,
    messages: [
      { id: 'm1', from: 'me', text: 'Good day po! Is the studio still available?', time: '8:02 AM' },
      { id: 'm2', from: 'them', text: 'Yes, the studio is still available.', time: '8:30 AM' },
    ],
  },
  {
    id: 'casa-ligaya',
    listingId: 'casa-ligaya',
    contact: 'Mrs. Ligaya Reyes',
    color: '#e5383b',
    context: 'Casa Ligaya Dormitory',
    detail: 'Owner · Casa Ligaya Dormitory',
    time: 'Mon',
    unread: 0,
    messages: [
      { id: 'm1', from: 'me', text: 'Hi po, are there any slots opening next month?', time: 'Mon' },
      { id: 'm2', from: 'them', text: 'We will update you when a slot opens.', time: 'Mon' },
    ],
  },
  {
    id: 'palm-studio',
    listingId: 'palm-studio',
    contact: 'Mr. Paolo Garcia',
    color: '#f59e0b',
    context: 'Palm Studio Apartments',
    detail: 'Owner · Palm Studio Apartments',
    time: 'Sun',
    unread: 0,
    messages: [
      { id: 'm1', from: 'me', text: 'Can I see the unit before reserving?', time: 'Sun' },
      { id: 'm2', from: 'them', text: 'You can visit this Saturday.', time: 'Sun' },
    ],
  },
];

export const OWNER_THREADS = [
  {
    id: 'maria',
    listingId: 'sampaguita',
    contact: ({ name }) => name,
    color: '#1d4ed8',
    detail: "Student · Re: Sampaguita Girls' Boarding House",
    time: '2m',
    unread: 2,
    messages: [
      { id: 'm1', from: 'them', text: 'Hi po! Is there still a slot for next semester?', time: '9:41 AM' },
      { id: 'm2', from: 'me', text: ({ name }) => `Hello ${name}! Yes, we still have 3 slots in the girls’ room.`, time: '9:43 AM' },
      { id: 'm3', from: 'them', text: 'How much is the monthly rent and is WiFi included?', time: '9:45 AM' },
      { id: 'm4', from: 'me', text: '₱1,800 per month and WiFi is free. You can visit anytime this week.', time: '9:46 AM' },
    ],
  },
  {
    id: 'angel',
    listingId: 'sampaguita',
    contact: 'Angel Mae Pascual',
    color: '#e5383b',
    detail: "Student · Re: Sampaguita Girls' Boarding House",
    time: '1h',
    unread: 1,
    messages: [{ id: 'm1', from: 'them', text: 'Can I visit the room this Saturday?', time: '1h' }],
  },
  {
    id: 'kristine',
    listingId: 'sampaguita',
    contact: 'Kristine Joy Lim',
    color: '#16a34a',
    detail: "Student · Re: Sampaguita Girls' Boarding House",
    time: 'Yesterday',
    unread: 0,
    messages: [{ id: 'm1', from: 'them', text: 'Thank you po! I will send the deposit today.', time: 'Yesterday' }],
  },
  {
    id: 'jenny',
    listingId: 'sampaguita',
    contact: 'Jenny Rose Abad',
    color: '#0b1b4d',
    detail: "Student · Re: Sampaguita Girls' Boarding House",
    time: 'Mon',
    unread: 0,
    messages: [{ id: 'm1', from: 'them', text: 'Is WiFi included in the ₱1,800 monthly rent?', time: 'Mon' }],
  },
  {
    id: 'shaira',
    listingId: 'sampaguita',
    contact: 'Shaira Mae Cruz',
    color: '#f59e0b',
    detail: "Student · Re: Sampaguita Girls' Boarding House",
    time: 'Sun',
    unread: 0,
    messages: [{ id: 'm1', from: 'them', text: 'Do you allow cooking inside the room?', time: 'Sun' }],
  },
];

/* Resolve template `contact` / message `text` values for the given boarder. */
export function personalizeThreads(threads, boarderName) {
  const who = { name: boarderName, firstName: boarderName.trim().split(/\s+/)[0] || boarderName };
  const resolve = (value) => (typeof value === 'function' ? value(who) : value);
  return threads.map((t) => ({
    ...t,
    contact: resolve(t.contact),
    messages: t.messages.map((m) => (typeof m.text === 'function' ? { ...m, text: resolve(m.text) } : m)),
  }));
}

/* Threads loaded from localStorage lose their template functions (JSON drops them);
   copy those back from the sample threads by thread id and message id. */
export function reviveThreads(stored, seeds) {
  if (!Array.isArray(stored)) return seeds;
  const seedById = Object.fromEntries(seeds.map((t) => [t.id, t]));
  return stored.map((thread) => {
    const seed = seedById[thread.id];
    if (!seed) return thread;
    const seedMessages = Object.fromEntries(seed.messages.map((m) => [m.id, m]));
    return {
      ...thread,
      contact: thread.contact ?? seed.contact,
      messages: thread.messages.map((m) => (m.text === undefined && seedMessages[m.id]
        ? { ...m, text: seedMessages[m.id].text }
        : m)),
    };
  });
}

export const nowLabel = () =>
  new Date().toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });

let messageSeq = 0;
/* Unique even when two messages are created in the same millisecond (question + auto-reply). */
export const nextMessageId = () => `m-${Date.now()}-${(messageSeq += 1)}`;

/* Boarder quick replies. `topic` marks questions the helper can answer straight from the listing data. */
export const QUICK_REPLIES = [
  { id: 'slots', text: 'Is there a vacant slot?', topic: 'slots' },
  { id: 'rent', text: 'How much is the monthly rent?', topic: 'price' },
  { id: 'payment', text: 'What are the payment terms?', topic: 'payment' },
  { id: 'visit', text: 'Can I schedule a visit?', topic: 'visit' },
];

/* Keywords that let the helper answer typed messages too. */
const TOPIC_KEYWORDS = [
  ['slots', /\b(slots?|vacant|vacancy|available|availability|bakante)\b/i],
  ['price', /\b(rent|price|how much|magkano|cost|monthly)\b|₱/i],
  ['payment', /\b(payments?|pay|deposit|advance|due dates?|downpayment)\b/i],
  ['visit', /\b(visit|schedule|tour|see the (room|place|unit|house))\b/i],
  ['amenities', /\b(wi-?fi|internet|amenities|cr|bathroom|kitchen|cook|cooking|water|aircon|laundry)\b/i],
];

/* Every topic a typed message asks about. The payment answer already states the rent, so it replaces the price one. */
export function topicsFor(text = '') {
  const topics = TOPIC_KEYWORDS.filter(([, pattern]) => pattern.test(text)).map(([topic]) => topic);
  return topics.includes('payment') ? topics.filter((t) => t !== 'price') : topics;
}

/* Mock auto-reply built from the listing the conversation is about. Returns null when the
   question isn't one the helper handles, or the listing isn't known. */
export function helperReplyFor(topic, listing) {
  if (!topic || !listing) return null;
  const room = [ROOM_LABELS[listing.roomType], GENDER_LABELS[listing.gender]]
    .filter(Boolean).join(', ').toLowerCase();
  const rent = `${formatPrice(listing.price)} per month`;

  switch (topic) {
    case 'slots':
      if (listing.slotsLeft <= 0) {
        return `${listing.name} is fully booked right now (0 of ${listing.totalSlots ?? '?'} slots). `
          + `${listing.owner} can tell you when a slot opens.`;
      }
      return `${listing.name} has ${pluralize(listing.slotsLeft, 'slot')} left`
        + `${listing.totalSlots ? ` out of ${listing.totalSlots}` : ''} (${room}). `
        + 'You can reserve one from the post page.';
    case 'price': {
      const perks = listing.amenities?.length ? ` Includes: ${listing.amenities.slice(0, 4).join(', ')}.` : '';
      return `Rent at ${listing.name} is ${rent} for a ${room}.${perks}`;
    }
    case 'payment':
      return `Listed rent is ${rent}. Deposit, advance and due dates are set by ${listing.owner}, `
        + 'who will confirm them in this chat.';
    case 'visit':
      return `${listing.name} is in Zone ${listing.zone}, ${listing.area}${listing.distance ? ` (${listing.distance})` : ''}. `
        + `${listing.owner} will reply here to confirm a day and time for your visit.`;
    case 'amenities':
      return listing.amenities?.length
        ? `${listing.name} offers: ${listing.amenities.join(', ')}. Ask ${listing.owner} here about anything not listed.`
        : `${listing.owner} will reply here with the amenities at ${listing.name}.`;
    default:
      return null;
  }
}
