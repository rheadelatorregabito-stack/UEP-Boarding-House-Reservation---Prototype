import styles from './WelcomeRoleSelect.module.css';

/* ---------- Icons (from Figma: icon/home, icon/user, icon/arrow) ---------- */

const HomeIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
    <path d="M9 21v-9h6v9" />
  </svg>
);

const UserIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-3.3 3.6-6 8-6s8 2.7 8 6" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/* ---------- Illustration (Figma "Photo" frame) ---------- */

const HouseIllustration = () => (
  <div className={styles.photo} aria-hidden="true">
    <span className={styles.sun} />
    <span className={styles.roof} />
    <span className={styles.houseBody}>
      <span className={`${styles.window} ${styles.windowLeft}`} />
      <span className={`${styles.window} ${styles.windowRight}`} />
      <span className={styles.door} />
    </span>
    <span className={styles.ground} />
  </div>
);

/* ---------- Role button ---------- */

const RoleButton = ({ variant, icon, title, subtitle, onClick }) => (
  <button type="button" className={`${styles.roleButton} ${styles[variant]}`} onClick={onClick}>
    <span className={styles.roleIcon}>{icon}</span>
    <span className={styles.roleText}>
      <span className={styles.roleTitle}>{title}</span>
      <span className={styles.roleSubtitle}>{subtitle}</span>
    </span>
    <span className={styles.roleArrow}>
      <ArrowIcon />
    </span>
  </button>
);

/* ---------- Screen ---------- */

export default function WelcomeRoleSelect({ onSelectBoarder, onSelectOwner }) {
  return (
    <main className={styles.screen}>
      <section className={styles.brandPanel}>
        <span className={`${styles.blob} ${styles.blobYellow}`} aria-hidden="true" />
        <span className={`${styles.blob} ${styles.blobRed}`} aria-hidden="true" />
        <span className={`${styles.blob} ${styles.blobGreen}`} aria-hidden="true" />
        <span className={`${styles.blob} ${styles.blobBlue}`} aria-hidden="true" />

        <div className={styles.logo}>
          <span className={styles.logoMark}>
            <HomeIcon size={30} />
          </span>
          <span className={styles.logoText}>
            <span className={styles.logoName}>BOARDEASE</span>
            <span className={styles.logoTagline}>Boarding House Reservation</span>
          </span>
        </div>

        <div className={styles.hero}>
          <HouseIllustration />
          <h1 className={styles.heroTitle}>Find your home away from home</h1>
          <p className={styles.heroText}>
            Browse boarding houses near UEP, compare prices and reserve a room in a few clicks.
          </p>
        </div>

        <p className={styles.footer}>
          University of Eastern Philippines · Catarman, Northern Samar
        </p>
      </section>

      <section className={styles.loginPanel}>
        <div className={styles.loginContent}>
          <h2 className={styles.welcome}>Welcome!</h2>
          <p className={styles.lead}>
            Choose how you want to log in to the UEP Boarding House Reservation website.
          </p>

          <RoleButton
            variant="boarder"
            icon={<UserIcon />}
            title="Log in as Boarder"
            subtitle="Browse, message owners and reserve a room"
            onClick={onSelectBoarder}
          />
          <RoleButton
            variant="owner"
            icon={<HomeIcon />}
            title="Log in as Owner"
            subtitle="Post and manage your boarding houses"
            onClick={onSelectOwner}
          />
        </div>
      </section>
    </main>
  );
}
