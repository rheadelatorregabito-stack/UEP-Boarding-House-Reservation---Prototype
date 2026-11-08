import styles from './Reviews.module.css';
import { Avatar, PageHeader, Screen, Stars, cx, ui } from '../shared/ui';
import { BellIcon, CheckIcon, ClockIcon, CloseIcon, EditIcon, LockIcon, StarIcon } from '../BoarderHome/icons';

/* What the dark "request" card shows for each review-request status (boarder only). */
const REQUEST_CARD = {
  none: {
    title: 'Stayed here? Leave a review',
    text: 'Tap the button and the owner will be notified. Once the owner accepts, you can write your review.',
    button: 'Request to review',
    icon: BellIcon,
  },
  pending: {
    title: 'Review request sent',
    text: 'The owner has been notified. You can write your review once they accept.',
    button: 'View status',
    icon: ClockIcon,
  },
  accepted: {
    title: 'The owner accepted your request',
    text: 'You can now write your review for this boarding house.',
    button: 'Write review',
    icon: EditIcon,
  },
  declined: {
    title: 'Your review request was declined',
    text: 'You can still read reviews and message the owner if you have questions.',
    button: null,
    icon: CloseIcon,
  },
  reviewed: {
    title: 'Thanks — you already reviewed this place',
    text: 'Your review is shown below with the others.',
    button: null,
    icon: CheckIcon,
  },
};

/* ---------- B7 · Reviews (Request to review) (17:2) / D8 · Reviews (Owner can read only) (7:924) ---------- */

export default function Reviews({
  session,
  nav,
  listing,
  summary,            // { breakdown, total, average, reviews } from data/reviews.js
  requestStatus = 'none',
  onBack,
  onRequestReview,    // boarder: status 'none'
  onViewRequest,      // boarder: status 'pending'
  onWriteReview,      // boarder: status 'accepted'
}) {
  const isOwner = session?.role === 'owner';
  const card = REQUEST_CARD[requestStatus] ?? REQUEST_CARD.none;
  const cardAction = { none: onRequestReview, pending: onViewRequest, accepted: onWriteReview }[requestStatus];
  const maxCount = Math.max(1, ...summary.breakdown);

  return (
    <Screen session={session} nav={nav} active={null}>
      <PageHeader title="Reviews" subtitle={listing.name} onBack={onBack} backLabel="Back to post" />

      <div className={styles.layout}>
        {/* ---------- Summary ---------- */}
        <section className={cx(ui.card, styles.summary)} aria-label="Rating summary">
          <p className={styles.average}>{summary.total ? summary.average.toFixed(1) : '–'}</p>
          <Stars value={summary.average} size={22} />
          <p className={styles.based}>
            Based on {summary.total} review{summary.total === 1 ? '' : 's'}
          </p>
          <ul className={styles.bars} aria-label="Ratings breakdown">
            {summary.breakdown.map((count, i) => (
              <li key={5 - i} className={styles.barRow}>
                <span className={styles.barStar}>{5 - i}</span>
                <span className={styles.barTrack} aria-hidden="true">
                  <span className={styles.barFill} style={{ width: `${(count / maxCount) * 100}%` }} />
                </span>
                <span className={styles.barCount}>{count}</span>
                <span className={ui.visuallyHidden}>{`${5 - i} stars: ${count}`}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- Request card / owner notice + list ---------- */}
        <div className={styles.list}>
          {isOwner ? (
            <p className={ui.notice}>
              <LockIcon size={22} />
              Owner view · you can read reviews, but only boarders can leave one.
            </p>
          ) : (
            <section className={styles.requestCard} aria-label="Leave a review">
              <span className={styles.requestIcon} aria-hidden="true"><StarIcon size={28} /></span>
              <div className={styles.requestText}>
                <p className={styles.requestTitle}>{card.title}</p>
                <p className={styles.requestBody}>{card.text}</p>
              </div>
              {card.button && (
                <button type="button" className={cx(ui.btn, ui.btnYellow)} onClick={cardAction}>
                  <card.icon /> {card.button}
                </button>
              )}
            </section>
          )}

          {summary.reviews.length === 0 ? (
            <p className={cx(ui.card, styles.empty)}>No reviews yet.</p>
          ) : (
            summary.reviews.map((review) => (
              <article key={review.id} className={styles.review}>
                <div className={styles.reviewHead}>
                  <Avatar name={review.author} color={review.color} />
                  <div className={styles.reviewWho}>
                    <p className={styles.reviewName}>{review.author}</p>
                    <p className={styles.reviewWhen}>{review.when}</p>
                  </div>
                  <Stars value={review.rating} />
                </div>
                <p className={styles.reviewText}>{review.text}</p>
                <span className={cx(ui.chip, ui.chipSoftGreen, styles.verified)}>
                  <CheckIcon size={13} /> Verified boarder
                </span>
              </article>
            ))
          )}
        </div>
      </div>
    </Screen>
  );
}
