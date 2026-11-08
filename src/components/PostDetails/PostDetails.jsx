import { useEffect, useId, useMemo, useRef, useState } from 'react';
import styles from './PostDetails.module.css';
import BoarderTopBar from '../BoarderTopBar/BoarderTopBar';
import { BackIcon, CheckIcon, KeyIcon, LockIcon, MessageIcon, StarIcon } from '../BoarderHome/icons';
import { GENDER_LABELS, LISTINGS, formatPrice } from '../BoarderHome/listings';

const ROOM_DETAIL = { shared: 'Shared room (not studio)', studio: 'Studio' };

const CHIP_TONES = ['blue', 'yellow', 'green', 'blue', 'red', 'yellow'];

const ownerInitial = (owner) => owner.replace(/^(Mr|Mrs|Ms|Dr)\.?\s+/i, '').charAt(0).toUpperCase();

const slotsChip = ({ slotsLeft, totalSlots }) => {
  const label = totalSlots ? `${slotsLeft} of ${totalSlots} slots open` : `${slotsLeft} slots open`;
  if (slotsLeft <= 0) return { label: totalSlots ? `Full · 0 of ${totalSlots} slots open` : 'Full', tone: styles.slotsFull };
  if (slotsLeft === 1) return { label, tone: styles.slotsLow };
  return { label, tone: '' };
};

/* Without real photos, the gallery shows the listing's illustration first, then the other
   listings' palettes as placeholders. */
const galleryFor = (listing) => {
  if (listing.photos?.length) return listing.photos.map((src) => ({ src }));
  const others = LISTINGS.filter((l) => l.id !== listing.id).slice(0, 4).map((l) => l.palette);
  return [listing.palette, ...others].map((palette) => ({ palette }));
};

function HouseScene({ palette, className }) {
  return (
    <div
      className={`${styles.scene} ${className ?? ''}`}
      style={{ '--sky': palette.sky, '--body': palette.body, '--roof': palette.roof }}
      aria-hidden="true"
    >
      <span className={styles.ground} />
      <span className={styles.sun} />
      <span className={styles.houseBody}>
        <span className={styles.door} />
        <span className={`${styles.window} ${styles.windowLeft}`} />
        <span className={`${styles.window} ${styles.windowRight}`} />
      </span>
      <span className={styles.roof} />
    </div>
  );
}

function Photo({ photo, alt, className }) {
  return photo.src
    ? <img className={`${styles.photoImg} ${className ?? ''}`} src={photo.src} alt={alt} />
    : <HouseScene palette={photo.palette} className={className} />;
}

export default function PostDetails({
  listing,
  session,
  reviewStats,
  reserved = false,
  onBack,
  onMessageOwner,
  onReserve,
  onOpenReviews,
  onOpenMessages,
  onOpenProfile,
  onLogout,
  onPost,
}) {
  const { role = 'boarder', email, name } = session ?? {};
  const isOwner = role === 'owner';
  const titleId = useId();
  const gallery = useMemo(() => galleryFor(listing), [listing]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const thumbRefs = useRef([]);

  // Coming from a scrolled-down grid: start at the top, on the first photo.
  useEffect(() => {
    window.scrollTo(0, 0);
    setPhotoIndex(0);
  }, [listing.id]);

  const selectPhoto = (index, { focus = false } = {}) => {
    const next = (index + gallery.length) % gallery.length;
    setPhotoIndex(next);
    if (focus) thumbRefs.current[next]?.focus();
  };

  const handleThumbKeys = (e) => {
    if (e.key === 'ArrowRight') selectPhoto(photoIndex + 1, { focus: true });
    else if (e.key === 'ArrowLeft') selectPhoto(photoIndex - 1, { focus: true });
    else return;
    e.preventDefault();
  };

  const {
    name: title, price, zone, area, gender, roomType, distance, owner, ownerSince,
    rating, reviewCount, description, amenities = [], slotsLeft,
  } = listing;
  const slots = slotsChip(listing);
  const isFull = slotsLeft <= 0;
  const score = reviewStats?.total ? reviewStats.average : rating;
  const count = reviewStats?.total ?? reviewCount;

  return (
    <div className={styles.screen}>
      <BoarderTopBar
        role={role}
        email={email}
        name={name}
        active="home"
        onHome={onBack}
        onOpenMessages={onOpenMessages}
        onOpenProfile={onOpenProfile}
        onPost={onPost}
        onLogout={onLogout}
      />

      <main className={styles.page}>
        <div className={styles.crumbRow}>
          <button type="button" className={styles.backButton} onClick={onBack} aria-label="Back to listings">
            <BackIcon />
          </button>
          <nav aria-label="Breadcrumb">
            <ol className={styles.breadcrumb}>
              <li>
                <button type="button" className={styles.crumbLink} onClick={onBack}>Home</button>
              </li>
              <li aria-current="page">{title}</li>
            </ol>
          </nav>
        </div>

        <div className={styles.layout}>
          <div className={styles.mainColumn}>
            <section className={styles.gallery} aria-label="Photos">
              <div className={styles.mainPhoto}>
                <Photo
                  photo={gallery[photoIndex]}
                  alt={`${title} — photo ${photoIndex + 1} of ${gallery.length}`}
                  className={styles.fill}
                />
                <span className={styles.counter} aria-live="polite">
                  {photoIndex + 1} / {gallery.length}
                </span>
              </div>

              <div className={styles.thumbs} role="tablist" aria-label="Choose photo" onKeyDown={handleThumbKeys}>
                {gallery.map((photo, i) => (
                  <button
                    key={i}
                    ref={(el) => { thumbRefs.current[i] = el; }}
                    type="button"
                    role="tab"
                    aria-selected={i === photoIndex}
                    aria-label={`Photo ${i + 1} of ${gallery.length}`}
                    tabIndex={i === photoIndex ? 0 : -1}
                    className={`${styles.thumb} ${i === photoIndex ? styles.thumbActive : ''}`}
                    onClick={() => selectPhoto(i)}
                  >
                    <Photo photo={photo} alt="" className={styles.fill} />
                  </button>
                ))}
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>About this place</h2>
              {description && <p className={styles.description}>{description}</p>}
              {amenities.length > 0 && (
                <ul className={styles.amenities} aria-label="Amenities and house rules">
                  {amenities.map((item, i) => (
                    <li key={item} className={`${styles.amenity} ${styles[CHIP_TONES[i % CHIP_TONES.length]]}`}>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={`${styles.card} ${styles.host}`} aria-label="Owner">
              <span className={styles.hostAvatar} aria-hidden="true">{ownerInitial(owner)}</span>
              <div className={styles.hostText}>
                <p className={styles.hostName}>{owner}</p>
                <p className={styles.hostMeta}>
                  Property owner{ownerSince ? ` · Joined ${ownerSince}` : ''}
                </p>
              </div>
              {!isOwner && (
                <button
                  type="button"
                  className={styles.hostMessage}
                  onClick={() => onMessageOwner?.(listing)}
                  aria-label={`Message ${owner}`}
                >
                  <MessageIcon /> Message
                </button>
              )}
            </section>
          </div>

          <aside className={styles.bookingColumn}>
            <section className={styles.bookingCard} aria-labelledby={titleId}>
              <h1 id={titleId} className={styles.title}>{title}</h1>

              <p className={styles.price}>
                <span className={styles.priceValue}>{formatPrice(price)}</span>
                <span className={styles.priceUnit}>/ month</span>
              </p>

              <span className={`${styles.slots} ${slots.tone}`}>{slots.label}</span>

              <dl className={styles.specs}>
                <div className={styles.spec}>
                  <dt>Zone</dt>
                  <dd>Zone {zone} · {area}</dd>
                </div>
                <div className={styles.spec}>
                  <dt>Gender</dt>
                  <dd>{GENDER_LABELS[gender]}</dd>
                </div>
                <div className={styles.spec}>
                  <dt>Room type</dt>
                  <dd>{ROOM_DETAIL[roomType]}</dd>
                </div>
                {distance && (
                  <div className={styles.spec}>
                    <dt>Distance</dt>
                    <dd>{distance}</dd>
                  </div>
                )}
              </dl>

              {isOwner ? (
                <>
                  <button type="button" className={`${styles.reserveButton} ${styles.locked}`} disabled>
                    <LockIcon /> Reserve
                  </button>
                  <button type="button" className={`${styles.messageButton} ${styles.locked}`} disabled>
                    <MessageIcon /> Message owner
                  </button>
                  <p className={styles.ownerNote}>
                    <LockIcon size={13} /> Owner mode · reserving &amp; messaging are for boarders
                  </p>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className={styles.reserveButton}
                    onClick={() => onReserve?.(listing)}
                    disabled={isFull || reserved}
                  >
                    {reserved ? <CheckIcon /> : <KeyIcon />}
                    {reserved ? 'Reservation requested' : isFull ? 'Fully booked' : 'Reserve'}
                  </button>

                  <button
                    type="button"
                    className={styles.messageButton}
                    onClick={() => onMessageOwner?.(listing)}
                  >
                    <MessageIcon /> Message owner
                  </button>
                </>
              )}
            </section>

            <section className={styles.reviews} aria-label="Reviews">
              <div className={styles.reviewsSummary}>
                <span className={styles.reviewsStar}><StarIcon size={34} /></span>
                <div>
                  <p className={styles.reviewsScore}>
                    {score ? score.toFixed(1) : 'No ratings'}{count ? ` · ${count} review${count === 1 ? '' : 's'}` : ''}
                  </p>
                  <p className={styles.reviewsHint}>
                    {isOwner ? 'See what boarders say' : 'Read reviews or ask to leave one'}
                  </p>
                </div>
              </div>
              <button type="button" className={styles.reviewButton} onClick={() => onOpenReviews?.(listing)}>
                <StarIcon size={20} outline /> {isOwner ? 'See Reviews' : 'Review'}
              </button>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
