import StatusScreen, { MessageCard, ProgressSteps, SummaryCard, statusStyles as s } from './StatusScreen';
import ListingPhoto from '../shared/ListingPhoto';
import { Avatar, Stars, cx, ui } from '../shared/ui';
import {
  BackIcon, CheckIcon, ClockIcon, CloseIcon, EditIcon, HomeIcon, MessageIcon, ShieldIcon, StarIcon,
} from '../BoarderHome/icons';
import { GENDER_LABELS, ROOM_LABELS, formatPrice } from '../BoarderHome/listings';

const slotsLabel = (n) => (n <= 0 ? 'Full' : `${n} slot${n === 1 ? '' : 's'} left`);
const slotsTone = (n) => (n <= 0 ? ui.chipGray : n === 1 ? ui.chipRed : ui.chipGreen);
const GENDER_TAG = { girls: s.tagPink, boys: s.tagBlue, mixed: s.tagGreen };
const ROOM_TAG = { shared: s.tagGray, studio: s.tagYellow };

/* ---------- B6 · Reservation Request Sent (15:1046) ---------- */

export function ReservationSent({ session, nav, listing, onMessageOwner, onBackHome }) {
  return (
    <StatusScreen
      session={session}
      nav={nav}
      tone="success"
      title="Reservation request sent!"
      actions={[
        { label: 'Message owner', icon: MessageIcon, variant: 'yellow', onClick: () => onMessageOwner?.(listing) },
        { label: 'Back to Home', icon: HomeIcon, onClick: onBackHome },
      ]}
    >
      <SummaryCard
        rows={[
          { label: 'Boarding house', value: listing.name },
          { label: 'Room', value: `${ROOM_LABELS[listing.roomType]} · Zone ${listing.zone}` },
          { label: 'Monthly rent', value: formatPrice(listing.price) },
          { label: 'Status', value: 'Waiting for owner confirmation', tone: 'alert' },
        ]}
      />
      <p className={s.lead}>The owner will review your request. You will see their reply in Messages.</p>
    </StatusScreen>
  );
}

/* ---------- B8 · Review Request Sent (Waiting for owner) (17:190) ----------
   The two "(preview)" buttons come from the Figma frame: they simulate the owner's answer. */

export function ReviewRequestSent({ session, nav, listing, onBackToPost, onPreviewAccepted, onPreviewDeclined }) {
  return (
    <StatusScreen
      session={session}
      nav={nav}
      tone="pending"
      title="Review request sent"
      actions={[
        { label: 'Back to post', icon: BackIcon, onClick: onBackToPost },
        { label: 'Owner accepted (preview)', icon: CheckIcon, variant: 'outlineGreen', onClick: onPreviewAccepted },
        { label: 'Owner declined (preview)', icon: CloseIcon, variant: 'outlineDanger', onClick: onPreviewDeclined },
      ]}
    >
      <MessageCard
        title={`${listing.owner} has been notified.`}
        text="You can write your review as soon as the owner accepts your request."
      />
      <ProgressSteps
        steps={[
          { title: 'Request sent', detail: 'Just now', icon: CheckIcon, tone: 'done' },
          { title: 'Owner reviewing', detail: 'Waiting for reply', icon: ClockIcon, tone: 'current' },
          { title: 'Write review', detail: 'Unlocks after accept', icon: StarIcon, tone: 'pending' },
        ]}
      />
    </StatusScreen>
  );
}

/* ---------- B12 · Review Request Declined (22:357) ---------- */

export function ReviewRequestDeclined({ session, nav, listing, onBackToPost, onMessageOwner }) {
  return (
    <StatusScreen
      session={session}
      nav={nav}
      tone="declined"
      title="Review request declined"
      actions={[
        { label: 'Back to post', icon: BackIcon, onClick: onBackToPost },
        { label: 'Message owner', icon: MessageIcon, variant: 'yellow', onClick: () => onMessageOwner?.(listing) },
      ]}
    >
      <MessageCard
        tone="gray"
        title={`${listing.owner} can’t accept your review request right now.`}
        text="You can still read all reviews and message the owner if you have questions."
      />
    </StatusScreen>
  );
}

/* ---------- B13 · Review Submitted (22:408) ---------- */

export function ReviewSubmitted({ session, nav, listing, review, onSeeReviews, onBackHome }) {
  return (
    <StatusScreen
      session={session}
      nav={nav}
      tone="success"
      title="Thank you for your review!"
      actions={[
        { label: 'See all reviews', icon: StarIcon, onClick: onSeeReviews },
        { label: 'Back to Home', icon: HomeIcon, variant: 'outline', onClick: onBackHome },
      ]}
    >
      <article className={cx(s.card, s.reviewCard)}>
        <div className={s.reviewHead}>
          <Avatar name={review.author} color="#e5383b" />
          <div className={s.reviewWho}>
            <p className={s.reviewName}>{review.author}</p>
            <p className={s.reviewMeta}>{listing.name} · {review.when}</p>
          </div>
          <Stars value={review.rating} size={18} />
        </div>
        <p className={s.reviewText}>{review.text}</p>
        {review.tags?.length > 0 && (
          <div className={s.chipRow}>
            {review.tags.map((tag) => <span key={tag} className={cx(s.tag, s.tagBlue)}>{tag}</span>)}
          </div>
        )}
        <span className={cx(ui.chip, ui.chipSoftGreen)} style={{ alignSelf: 'flex-start' }}>
          <CheckIcon size={13} /> Verified boarder
        </span>
      </article>
    </StatusScreen>
  );
}

/* ---------- D15 · Post Saved (22:151) ---------- */

export function PostSaved({ session, nav, listing, onEditAgain, onViewHome }) {
  return (
    <StatusScreen
      session={session}
      nav={nav}
      active="post"
      tone="success"
      title="Your post has been saved!"
      actions={[
        { label: 'Edit again', icon: EditIcon, variant: 'outline', onClick: () => onEditAgain?.(listing) },
        { label: 'View on Home', icon: HomeIcon, onClick: onViewHome },
      ]}
    >
      <div className={cx(s.card, s.postCard)}>
        <div className={s.postRow}>
          <ListingPhoto listing={listing} className={s.postPhoto} rounded={16} />
          <div className={s.postInfo}>
            <p className={s.postName}>{listing.name}</p>
            <div className={s.chipRow}>
              <span className={cx(s.tag, s.tagBlue)}>Zone {listing.zone}</span>
              <span className={cx(s.tag, GENDER_TAG[listing.gender])}>{GENDER_LABELS[listing.gender]}</span>
              <span className={cx(s.tag, ROOM_TAG[listing.roomType])}>{ROOM_LABELS[listing.roomType]}</span>
            </div>
            <div className={s.chipRow}>
              <span className={s.postPrice}>{formatPrice(listing.price)} / month</span>
              <span className={cx(ui.chip, slotsTone(listing.slotsLeft))}>{slotsLabel(listing.slotsLeft)}</span>
            </div>
          </div>
        </div>
        <p className={cx(ui.notice, s.smallNotice)}>
          <ShieldIcon size={20} />
          Boarders can see this post on the Home feed once your credentials are approved.
        </p>
      </div>
    </StatusScreen>
  );
}
