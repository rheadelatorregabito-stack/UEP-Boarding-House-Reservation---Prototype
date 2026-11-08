import styles from './Profile.module.css';
import { Avatar, Screen, cx, ui } from '../shared/ui';
import ListingPhoto from '../shared/ListingPhoto';
import { CameraIcon, EditIcon, LinkIcon, MailIcon, PhoneIcon, PinIcon, PlusIcon, ShieldIcon } from '../BoarderHome/icons';
import { GENDER_LABELS, ROOM_LABELS, formatPrice } from '../BoarderHome/listings';

const RESERVATION_CHIP = {
  pending: { label: 'Waiting for owner', className: ui.chipYellow },
  confirmed: { label: 'Confirmed', className: ui.chipGreen },
};

const slotsChip = (n) =>
  n <= 0 ? { label: 'Full', className: ui.chipGray }
    : { label: `${n} slot${n === 1 ? '' : 's'} left`, className: n === 1 ? ui.chipRed : ui.chipGreen };

const listingMeta = (l) => `Zone ${l.zone} · ${l.gender === 'mixed' ? 'Both' : GENDER_LABELS[l.gender]} · ${ROOM_LABELS[l.roomType]}`;

function Section({ title, onEdit, editLabel, children, className }) {
  return (
    <section className={cx(ui.card, className)} aria-label={title}>
      <div className={ui.cardHeader}>
        <h2 className={ui.cardTitle}>{title}</h2>
        {onEdit && (
          <button type="button" className={ui.iconButton} onClick={onEdit} aria-label={editLabel ?? `Edit ${title}`}>
            <EditIcon size={18} />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function InfoRow({ icon: RowIcon, label, value, action }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoIcon} aria-hidden="true"><RowIcon size={18} /></span>
      <span className={styles.infoText}>
        <span className={styles.infoLabel}>{label}</span>
        <span className={styles.infoValue}>{value}</span>
      </span>
      {action}
    </div>
  );
}

function ListingRow({ listing, chip, action }) {
  return (
    <div className={styles.listingRow}>
      <ListingPhoto listing={listing} className={styles.listingPhoto} rounded={14} />
      <div className={styles.listingText}>
        <p className={styles.listingName}>{listing.name}</p>
        <p className={styles.listingMeta}>{listingMeta(listing)}</p>
        <p className={styles.listingPrice}>
          {formatPrice(listing.price)} / month
          {chip && <span className={cx(ui.chip, chip.className, styles.smallChip)}>{chip.label}</span>}
        </p>
      </div>
      {action}
    </div>
  );
}

function AvatarStack({ people, label }) {
  return (
    <div className={styles.stackRow}>
      <span className={styles.stack} aria-hidden="true">
        {people.slice(0, 5).map((p) => (
          <Avatar key={p.name} name={p.name} color={p.color} size={40} className={styles.stackAvatar} />
        ))}
      </span>
      <span className={styles.stackLabel}>{label}</span>
    </div>
  );
}

/* ---------- B11 · Boarder Profile (17:476) / D11 · Owner Profile (12:342) ---------- */

export default function Profile({
  session,
  nav,
  profile,
  // boarder
  reservation,            // { listing, status: 'pending' | 'confirmed' } | null
  myReviews = [],         // [{ listing, review }]
  ownersMessaged = [],    // [{ name, color }]
  onOpenListing,          // (listing)
  // owner
  ownerListings = [],
  currentBoarders = [],   // [{ name, color }]
  boarderCount = 0,
  rating,
  credentialsStatus = 'review',
  onEditListing,          // (listing)
  onAddListing,
  // both
  onEditProfile,
}) {
  const isOwner = session?.role === 'owner';
  const name = profile.name;

  const socials = [
    { key: 'facebook', label: 'Facebook' },
    { key: 'instagram', label: 'Instagram' },
    { key: 'messenger', label: 'Messenger' },
  ];

  return (
    <Screen session={session} nav={nav} active="profile">
      {/* ---------- Cover + head ---------- */}
      <div className={styles.coverAndHead}>
        <div className={styles.cover} aria-hidden="true">
          <span className={cx(styles.blob, styles.blobYellow)} />
          <span className={cx(styles.blob, styles.blobRed)} />
          <span className={cx(styles.blob, styles.blobBlue)} />
        </div>

        <div className={styles.head}>
          <div className={styles.avatarWrap}>
            <Avatar
              name={name}
              src={profile.photo}
              size={144}
              color={isOwner ? '#ffc72c' : '#e5383b'}
              textColor={isOwner ? '#0a0a0a' : undefined}
              className={styles.bigAvatar}
            />
            <button type="button" className={styles.changePhoto} onClick={onEditProfile} aria-label="Change profile photo">
              <CameraIcon size={18} />
            </button>
          </div>

          <div className={styles.headText}>
            <h1 className={styles.name}>{name}</h1>
            <div className={styles.chips}>
              <span className={cx(ui.chip, ui.chipBlue)}>{isOwner ? 'Boarding house owner' : 'UEP student'}</span>
              {isOwner ? (
                credentialsStatus === 'approved' ? (
                  <span className={cx(ui.chip, ui.chipGreen)}><ShieldIcon size={13} /> Verified owner</span>
                ) : (
                  <span className={cx(ui.chip, ui.chipYellow)}><ShieldIcon size={13} /> Credentials under review</span>
                )
              ) : (
                <span className={cx(ui.chip, ui.chipGreen)}>Boarder</span>
              )}
            </div>
          </div>

          <button type="button" className={cx(ui.btn, ui.btnSmall, ui.btnOutline, styles.editButton)} onClick={onEditProfile}>
            <EditIcon /> Edit profile &amp; name
          </button>
        </div>
      </div>

      {/* ---------- Columns ---------- */}
      <div className={styles.columns}>
        <div className={styles.mainColumn}>
          <Section title="Bio" onEdit={onEditProfile}>
            <p className={styles.bio}>{profile.bio || 'Add a short bio so others know a bit about you.'}</p>
          </Section>

          {isOwner ? (
            <Section title="My boarding houses">
              {ownerListings.length === 0 && <p className={styles.muted}>You haven't posted a boarding house yet.</p>}
              {ownerListings.map((listing) => (
                <ListingRow
                  key={listing.id}
                  listing={listing}
                  chip={slotsChip(listing.slotsLeft)}
                  action={(
                    <button
                      type="button"
                      className={cx(ui.iconButton, styles.rowEdit)}
                      onClick={() => onEditListing?.(listing)}
                      aria-label={`Edit ${listing.name}`}
                    >
                      <EditIcon size={18} />
                    </button>
                  )}
                />
              ))}
              {onAddListing && (
                <button type="button" className={cx(ui.btn, ui.btnSmall, ui.btnSoft, styles.addButton)} onClick={onAddListing}>
                  <PlusIcon size={18} /> Post another boarding house
                </button>
              )}
            </Section>
          ) : (
            <>
              <Section title="My reservation">
                {reservation ? (
                  <ListingRow
                    listing={reservation.listing}
                    chip={RESERVATION_CHIP[reservation.status]}
                    action={onOpenListing && (
                      <button
                        type="button"
                        className={cx(ui.btn, ui.btnSmall, ui.btnSoft)}
                        onClick={() => onOpenListing(reservation.listing)}
                      >
                        View post
                      </button>
                    )}
                  />
                ) : (
                  <p className={styles.muted}>No reservation yet. Open a boarding house post and tap Reserve.</p>
                )}
              </Section>

              <Section title="My reviews">
                {myReviews.length === 0 ? (
                  <p className={styles.muted}>
                    You have not left a review yet. Open a boarding house post and tap Review to ask the owner for permission.
                  </p>
                ) : (
                  myReviews.map(({ listing, review }) => (
                    <div key={`${listing.id}-${review.id}`} className={styles.myReview}>
                      <p className={styles.listingName}>{listing.name} · {'★'.repeat(review.rating)}</p>
                      <p className={styles.bio}>{review.text}</p>
                    </div>
                  ))
                )}
              </Section>
            </>
          )}
        </div>

        <div className={styles.sideColumn}>
          {isOwner && (
            <section className={cx(ui.card, styles.stats)} aria-label="Stats">
              <div className={styles.stat}><span className={styles.statValue}>{ownerListings.length}</span><span className={styles.statLabel}>Listings</span></div>
              <div className={styles.stat}><span className={styles.statValue}>{boarderCount}</span><span className={styles.statLabel}>Boarders</span></div>
              <div className={styles.stat}><span className={cx(styles.statValue, styles.statRed)}>{rating ? rating.toFixed(1) : '–'}</span><span className={styles.statLabel}>Rating</span></div>
            </section>
          )}

          <Section title="Details" onEdit={onEditProfile}>
            <InfoRow icon={MailIcon} label="Email" value={profile.email || '—'} />
            <InfoRow icon={PhoneIcon} label="Contact" value={profile.phone || '—'} />
            {isOwner
              ? <InfoRow icon={PinIcon} label="Address" value={profile.address || '—'} />
              : <InfoRow icon={PinIcon} label="School" value={profile.school || '—'} />}
          </Section>

          <Section title="Socials" onEdit={onEditProfile}>
            {socials.map(({ key, label }) => (
              <InfoRow
                key={key}
                icon={LinkIcon}
                label={label}
                value={profile[key] || `Add your ${label}${key === 'messenger' ? ' link' : ''}`}
                action={profile[key] ? (
                  <span className={cx(ui.chip, ui.chipSoftGreen, styles.smallChip)}>Connected</span>
                ) : (
                  <button type="button" className={cx(ui.chip, styles.addChip)} onClick={onEditProfile}>
                    Add<span className={ui.visuallyHidden}> {label}</span>
                  </button>
                )}
              />
            ))}
          </Section>

          {isOwner ? (
            <Section title="Current boarders">
              <AvatarStack people={currentBoarders} label={`${boarderCount} students staying`} />
            </Section>
          ) : (
            <Section title="Owners messaged">
              {ownersMessaged.length
                ? <AvatarStack people={ownersMessaged} label={`${ownersMessaged.length} owner${ownersMessaged.length === 1 ? '' : 's'}`} />
                : <p className={styles.muted}>No conversations yet.</p>}
            </Section>
          )}
        </div>
      </div>
    </Screen>
  );
}
