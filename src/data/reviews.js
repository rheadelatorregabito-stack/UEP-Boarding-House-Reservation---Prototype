/* Sample reviews. Sampaguita's come from Figma (B7/D8); the others are sample copy.
   `breakdown` = how many reviews gave 5, 4, 3, 2, 1 stars (sums to the listing's reviewCount). */

export const REVIEW_TAGS = ['Clean', 'Safe', 'Good value', 'Friendly owner', 'Fast WiFi', 'Near UEP'];

export const SEED_REVIEWS = {
  sampaguita: {
    breakdown: [18, 4, 1, 1, 0],
    reviews: [
      { id: 'r1', author: 'Maria Santos', color: '#1d4ed8', when: '2 weeks ago', rating: 5, text: 'Very clean and the owner is super approachable. Walking distance to UEP!' },
      { id: 'r2', author: 'Angel Mae Pascual', color: '#e5383b', when: '1 month ago', rating: 5, text: 'Safe and quiet, perfect for studying. Curfew is strict but fair.' },
      { id: 'r3', author: 'Kevin Lim', color: '#16a34a', when: '2 months ago', rating: 4, text: 'Spacious room and water is always available. Would love faster WiFi.' },
      { id: 'r4', author: 'John Paul Dela Cruz', color: '#0b1b4d', when: '3 months ago', rating: 4, text: 'Good value for the price. Friendly housemates.' },
    ],
  },
  'villa-marites': {
    breakdown: [12, 4, 1, 1, 0],
    reviews: [
      { id: 'r1', author: 'Carlo Mendoza', color: '#16a34a', when: '1 week ago', rating: 5, text: 'Right beside the main gate — I wake up 10 minutes before class.' },
      { id: 'r2', author: 'Rica Bautista', color: '#e5383b', when: '1 month ago', rating: 4, text: 'Private CR is a big plus. Kitchenette is small but enough.' },
    ],
  },
  'kuya-jun': {
    breakdown: [6, 3, 1, 1, 0],
    reviews: [
      { id: 'r1', author: 'Mark Anthony Ruiz', color: '#0b1b4d', when: '3 weeks ago', rating: 4, text: 'Cheapest near campus. Bunk beds are sturdy and the lockers are big.' },
    ],
  },
  'casa-ligaya': {
    breakdown: [29, 2, 1, 0, 0],
    reviews: [
      { id: 'r1', author: 'Princess Lopez', color: '#1d4ed8', when: '5 days ago', rating: 5, text: 'Very secure with the night guard. Mrs. Reyes is like a second mom.' },
      { id: 'r2', author: 'Joy Villanueva', color: '#f59e0b', when: '2 months ago', rating: 5, text: 'Quiet and clean. The furnished studio saved me a lot of money.' },
    ],
  },
  'bahay-ni-lola': {
    breakdown: [10, 3, 1, 1, 0],
    reviews: [
      { id: 'r1', author: 'Ella Marquez', color: '#16a34a', when: '2 weeks ago', rating: 5, text: 'Home-cooked meals are the best part. The garden is great for reviewing.' },
    ],
  },
  'palm-studio': {
    breakdown: [7, 1, 1, 0, 0],
    reviews: [
      { id: 'r1', author: 'Nathan Co', color: '#0b1b4d', when: '1 month ago', rating: 5, text: 'Aircon and mini-ref in the room — worth the price for the privacy.' },
    ],
  },
};

const EMPTY = { breakdown: [0, 0, 0, 0, 0], reviews: [] };

/* Merge seed data with reviews submitted during this session (newest first). */
export function reviewsFor(listingId, submitted = []) {
  const seed = SEED_REVIEWS[listingId] ?? EMPTY;
  const breakdown = [...seed.breakdown];
  submitted.forEach((r) => { breakdown[5 - r.rating] += 1; });
  const total = breakdown.reduce((a, b) => a + b, 0);
  const average = total ? breakdown.reduce((sum, count, i) => sum + count * (5 - i), 0) / total : 0;
  return { breakdown, total, average, reviews: [...submitted, ...seed.reviews] };
}
