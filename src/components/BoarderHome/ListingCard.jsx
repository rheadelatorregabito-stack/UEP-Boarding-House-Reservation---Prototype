import { useId } from 'react';
import styles from './ListingCard.module.css';
import { LockIcon, MessageIcon, PinIcon, StarIcon } from './icons';
import { GENDER_LABELS, ROOM_LABELS, formatPrice } from './listings';

const slotsChip = (slotsLeft) => {
  if (slotsLeft <= 0) return { label: 'Full', tone: styles.slotsFull };
  if (slotsLeft === 1) return { label: '1 slot left', tone: styles.slotsLow };
  return { label: `${slotsLeft} slots left`, tone: '' };
};

const ownerInitial = (owner) => owner.replace(/^(Mr|Mrs|Ms|Dr)\.?\s+/i, '').charAt(0).toUpperCase();

export default function ListingCard({ listing, onMessage, onView, viewOnly = false }) {
  const titleId = useId();
  const { name, rating, zone, area, gender, roomType, owner, price, slotsLeft, palette } = listing;
  const slots = slotsChip(slotsLeft);

  return (
    <article className={styles.card} aria-labelledby={titleId}>
      <div className={styles.media}>
        <div
          className={styles.photo}
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

        <span className={`${styles.chip} ${styles.zoneChip}`}>
          <span className={styles.zonePin}><PinIcon size={13} /></span>
          Zone {zone}
        </span>
        <span className={`${styles.chip} ${styles.slotsChip} ${slots.tone}`}>{slots.label}</span>
      </div>

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <h3 id={titleId} className={styles.title}>{name}</h3>
          <span className={`${styles.chip} ${styles.rating}`} aria-label={`Rated ${rating} out of 5`}>
            <span className={styles.star}><StarIcon /></span>
            {rating.toFixed(1)}
          </span>
        </div>

        <p className={styles.location}>
          <PinIcon />
          Zone {zone} · {area}
        </p>

        <div className={styles.tags}>
          <span className={`${styles.chip} ${styles[`gender_${gender}`]}`}>{GENDER_LABELS[gender]}</span>
          <span className={`${styles.chip} ${styles[`room_${roomType}`]}`}>{ROOM_LABELS[roomType]}</span>
        </div>

        <p className={styles.owner}>
          <span className={styles.ownerAvatar} aria-hidden="true">{ownerInitial(owner)}</span>
          Owner · {owner}
        </p>

        <div className={styles.footer}>
          <p className={styles.price}>
            <span className={styles.priceValue}>{formatPrice(price)}</span>
            <span className={styles.priceUnit}>{viewOnly ? '/ month' : '/ mo'}</span>
          </p>

          <div className={styles.actions}>
            {!viewOnly && (
              <button
                type="button"
                className={styles.messageButton}
                onClick={() => onMessage?.(listing)}
                aria-label={`Message ${owner} about ${name}`}
              >
                <MessageIcon />
              </button>
            )}
            <button
              type="button"
              className={`${styles.viewButton} ${viewOnly ? styles.viewButtonCompact : ''}`}
              onClick={() => onView?.(listing)}
              aria-label={`View Post: ${name}`}
            >
              View Post
            </button>
          </div>
        </div>

        {viewOnly && (
          <p className={styles.ownerNote}>
            <LockIcon size={13} />
            Owner: {owner} · Reserve &amp; message are for boarders
          </p>
        )}
      </div>
    </article>
  );
}
