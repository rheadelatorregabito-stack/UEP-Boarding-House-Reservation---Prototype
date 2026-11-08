import ui from './ui.module.css';
import BoarderTopBar from '../BoarderTopBar/BoarderTopBar';
import { BackIcon, StarIcon } from '../BoarderHome/icons';

export { ui };

export const cx = (...classes) => classes.filter(Boolean).join(' ');

// Avatar colours used for people across the Figma frames (blue, red, green, navy, amber).
const AVATAR_COLORS = ['#1d4ed8', '#e5383b', '#16a34a', '#0b1b4d', '#f59e0b'];

export const initialOf = (name = '') =>
  name.replace(/^(Mr|Mrs|Ms|Dr)\.?\s+/i, '').trim().charAt(0).toUpperCase() || '?';

export function Avatar({ name, src, size = 46, color, textColor, className, style }) {
  const fallback = AVATAR_COLORS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % AVATAR_COLORS.length];
  if (src) {
    return (
      <img
        className={cx(ui.avatar, className)}
        style={{ width: size, height: size, objectFit: 'cover', ...style }}
        src={src}
        alt=""
      />
    );
  }
  return (
    <span
      className={cx(ui.avatar, className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4), background: color ?? fallback, color: textColor, ...style }}
      aria-hidden="true"
    >
      {initialOf(name)}
    </span>
  );
}

export function Stars({ value, size = 16, label = true }) {
  const rounded = Math.round(value);
  return (
    <span className={ui.stars} role={label ? 'img' : undefined} aria-label={label ? `${value} out of 5 stars` : undefined}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n > rounded ? ui.starOff : undefined} style={{ display: 'flex' }}>
          <StarIcon size={size} />
        </span>
      ))}
    </span>
  );
}

/* Top bar + page background used by every signed-in screen.
   `session` = { role, email, name } and `nav` = the top-bar handlers from App.js. */
export function Screen({ session, nav, active, white = false, children, mainClassName }) {
  return (
    <div className={cx(ui.screen, white && ui.screenWhite)}>
      <BoarderTopBar
        role={session?.role}
        email={session?.email}
        name={session?.name}
        active={active}
        {...nav}
      />
      <main className={mainClassName ?? ui.page}>{children}</main>
    </div>
  );
}

export function PageHeader({ title, subtitle, onBack, backLabel = 'Go back' }) {
  return (
    <div className={ui.pageHeader}>
      {onBack && (
        <button type="button" className={ui.backButton} onClick={onBack} aria-label={backLabel}>
          <BackIcon />
        </button>
      )}
      <div>
        <h1 className={ui.pageTitle}>{title}</h1>
        {subtitle && <p className={ui.pageSubtitle}>{subtitle}</p>}
      </div>
    </div>
  );
}
