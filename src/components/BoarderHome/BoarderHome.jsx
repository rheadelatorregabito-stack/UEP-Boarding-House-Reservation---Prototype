import { useCallback, useId, useMemo, useRef, useState } from 'react';
import styles from './BoarderHome.module.css';
import ListingCard from './ListingCard';
import FilterDrawer from './FilterDrawer';
import BoarderTopBar from '../BoarderTopBar/BoarderTopBar';
import { ChevronDownIcon, FilterIcon, LockIcon, SearchIcon } from './icons';
import {
  DEFAULT_FILTERS,
  LISTINGS,
  SORT_OPTIONS,
  ZONES,
  countActiveFilters,
  filterListings,
  pluralize,
  sortListings,
} from './listings';

/* ---------- Screen: "B3 · Boarder Home (Browse & message owners)" (node 15:115) ----------
   With role="owner" it becomes "D5 · Owner Home (Browse boarding houses)" (7:2): view-only banner,
   cards without messaging, and the owner top bar (with Post). */

export default function BoarderHome({
  role = 'boarder',
  email,              // logged-in email; the top-bar name is derived from it
  name,               // optional explicit name (e.g. from sign-up); wins over the email
  subtitle,           // top-bar subtitle; defaults per role
  listings = LISTINGS,
  onLogout,
  onOpenMessages,     // nav "Messages" → onOpenMessages(); card message button → onOpenMessages(listing)
  onOpenProfile,
  onPost,             // owner: top-bar "Post"
  onViewPost,         // onViewPost(listing)
}) {
  const isOwner = role === 'owner';
  const searchId = useId();
  const sortId = useId();
  const resultsHeadingRef = useRef(null);

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(SORT_OPTIONS[0].value);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const visibleListings = useMemo(
    () => sortListings(filterListings(listings, filters, query), sort),
    [listings, filters, query, sort],
  );

  const zoneCounts = useMemo(
    () => Object.fromEntries(ZONES.map((zone) => [zone, listings.filter((l) => l.zone === zone).length])),
    [listings],
  );

  const countResults = useCallback(
    (draftFilters) => filterListings(listings, draftFilters, query).length,
    [listings, query],
  );

  const activeFilterCount = countActiveFilters(filters);

  const handleSearch = (e) => {
    e.preventDefault();
    // Results already update as you type; Search jumps to them (useful on small screens).
    resultsHeadingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    resultsHeadingRef.current?.focus({ preventScroll: true });
  };

  const clearAll = () => {
    setQuery('');
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <div className={styles.screen}>
      <BoarderTopBar
        role={role}
        email={email}
        name={name}
        subtitle={subtitle}
        active="home"
        onOpenMessages={onOpenMessages}
        onOpenProfile={onOpenProfile}
        onPost={onPost}
        onLogout={onLogout}
      />

      <main className={styles.page}>
        {/* ---------- Hero + search ---------- */}
        <section className={styles.hero} aria-labelledby={`${searchId}-title`}>
          <span className={`${styles.blob} ${styles.blobYellow}`} aria-hidden="true" />
          <span className={`${styles.blob} ${styles.blobRed}`} aria-hidden="true" />
          <span className={`${styles.blob} ${styles.blobBlue}`} aria-hidden="true" />

          <h1 id={`${searchId}-title`} className={styles.heroTitle}>
            {isOwner ? 'Find a boarding house near UEP' : 'Find your next boarding house'}
          </h1>
          <p className={styles.heroText}>
            {isOwner
              ? 'Scroll through listings, compare prices, and check each post. Use filters to narrow by gender, price, room type and zone.'
              : 'Scroll through listings, compare prices, message owners and reserve your slot. Filter by gender, price, room type and zone.'}
          </p>

          <form className={styles.searchRow} role="search" onSubmit={handleSearch}>
            <label htmlFor={searchId} className={styles.searchBox}>
              <span className={styles.searchIcon}><SearchIcon /></span>
              <span className={styles.visuallyHidden}>Search boarding houses</span>
              <input
                id={searchId}
                type="search"
                className={styles.searchInput}
                placeholder="Search by name, price or location"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
            </label>

            <button
              type="button"
              className={styles.filtersButton}
              onClick={() => setFiltersOpen(true)}
              aria-haspopup="dialog"
              aria-label={activeFilterCount ? `Filters, ${activeFilterCount} active` : 'Filters'}
            >
              <FilterIcon /> Filters
              {activeFilterCount > 0 && (
                <span className={styles.filtersBadge} aria-hidden="true">{activeFilterCount}</span>
              )}
            </button>

            <button type="submit" className={styles.searchButton}>Search</button>
          </form>
        </section>

        {isOwner && (
          <p className={styles.viewOnlyBanner}>
            <LockIcon size={22} />
            View-only mode: as an owner you can check other owners’ posts, but you cannot reserve or message them.
          </p>
        )}

        {/* ---------- Results: header + grid ---------- */}
        <section className={styles.results} aria-labelledby={`${sortId}-results`}>
          <div className={styles.resultsHeader}>
            <h2 id={`${sortId}-results`} ref={resultsHeadingRef} tabIndex={-1} className={styles.resultsTitle}>
              Boarding houses for you
            </h2>

            <div className={styles.resultsMeta}>
              <span className={styles.resultsCount} aria-live="polite">
                {pluralize(visibleListings.length, 'listing')}
              </span>

              <label htmlFor={sortId} className={styles.sort}>
                <span>Sort:</span>
                <select
                  id={sortId}
                  className={styles.sortSelect}
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <span className={styles.sortChevron}><ChevronDownIcon /></span>
              </label>
            </div>
          </div>

          {/* ---------- Grid ---------- */}
          {visibleListings.length > 0 ? (
            <ul className={styles.grid}>
              {visibleListings.map((listing) => (
                <li key={listing.id} className={styles.gridItem}>
                  <ListingCard listing={listing} onMessage={onOpenMessages} onView={onViewPost} viewOnly={isOwner} />
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>No boarding houses match your search</p>
              <p className={styles.emptyText}>Try a different name or price, or loosen your filters.</p>
              <button type="button" className={styles.emptyButton} onClick={clearAll}>
                Clear search and filters
              </button>
            </div>
          )}
        </section>
      </main>

      <footer className={styles.footer}>
        © UEP Boarding House Reservation · Catarman, Northern Samar
      </footer>

      <FilterDrawer
        open={filtersOpen}
        filters={filters}
        zoneCounts={zoneCounts}
        countResults={countResults}
        onApply={(next) => {
          setFilters(next);
          setFiltersOpen(false);
        }}
        onClose={() => setFiltersOpen(false)}
      />
    </div>
  );
}
