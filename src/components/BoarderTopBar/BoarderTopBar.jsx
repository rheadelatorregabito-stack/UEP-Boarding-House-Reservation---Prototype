import styles from './BoarderTopBar.module.css';
import { HomeIcon, MessageIcon, PlusSquareIcon, UserIcon } from '../BoarderHome/icons';

const FALLBACK_NAMES = { boarder: 'Boarder', owner: 'Owner' };
const SUBTITLES = { boarder: 'UEP student', owner: 'Boarding house owner' };

// "juan.delacruz@uep.edu.ph" → "Juan Delacruz"
export const nameFromEmail = (email = '') =>
  email
    .split('@')[0]
    .split(/[._\-+]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

export const displayNameFor = ({ name, email, role = 'boarder' } = {}) =>
  name?.trim() || nameFromEmail(email) || FALLBACK_NAMES[role];

const NAV_ITEMS = {
  boarder: [
    { key: 'home', label: 'Home', icon: HomeIcon },
    { key: 'messages', label: 'Messages', icon: MessageIcon },
    { key: 'profile', label: 'Profile', icon: UserIcon },
  ],
  owner: [
    { key: 'home', label: 'Home', icon: HomeIcon },
    { key: 'post', label: 'Post', icon: PlusSquareIcon },
    { key: 'messages', label: 'Messages', icon: MessageIcon },
    { key: 'profile', label: 'Profile', icon: UserIcon },
  ],
};

export default function BoarderTopBar({
  role = 'boarder',
  email,
  name,
  subtitle = SUBTITLES[role],
  active = 'home',
  onHome,
  onPost,
  onOpenMessages,
  onOpenProfile,
  onLogout,
}) {
  const displayName = displayNameFor({ name, email, role });
  const handlers = { home: onHome, post: onPost, messages: onOpenMessages, profile: onOpenProfile };
  const isOwner = role === 'owner';

  return (
    <header className={styles.topBar}>
      <div className={styles.brand}>
        <span className={styles.brandMark}><HomeIcon size={24} /></span>
        <span className={styles.brandText}>
          <span className={styles.brandName}>UEP Boarding House</span>
          <span className={styles.brandTagline}>Reservation</span>
        </span>
      </div>

      <nav className={styles.nav} aria-label="Main">
        {NAV_ITEMS[role].map(({ key, label, icon: NavIcon }) => {
          const isActive = key === active;
          return (
            <button
              key={key}
              type="button"
              className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => handlers[key]?.()}
            >
              <NavIcon /> {label}
            </button>
          );
        })}
      </nav>

      <div className={styles.account}>
        <button type="button" className={`${styles.logout} ${isOwner ? styles.logoutOwner : ''}`} onClick={onLogout}>
          LOG OUT
        </button>
        <span className={`${styles.avatar} ${isOwner ? styles.avatarOwner : ''}`} aria-hidden="true">
          {displayName.charAt(0).toUpperCase()}
        </span>
        <span className={styles.accountText}>
          <span className={styles.accountName}>{displayName}</span>
          <span className={styles.accountRole}>{subtitle}</span>
        </span>
      </div>
    </header>
  );
}
