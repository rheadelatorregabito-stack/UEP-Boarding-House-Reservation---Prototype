import { useState } from 'react';
import styles from './OwnerLogin.module.css';

/* ---------- Icons (from Figma: icon/home, icon/back, icon/mail, icon/lock, icon/eye, icon/shield) ---------- */

const Icon = ({ size = 20, strokeWidth = 1.67, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const HomeIcon = () => (
  <Icon size={30} strokeWidth={2}>
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
    <path d="M9 21v-9h6v9" />
  </Icon>
);

const BackIcon = () => (
  <Icon size={22} strokeWidth={2}>
    <path d="m15 18-6-6 6-6" />
  </Icon>
);

const MailIcon = () => (
  <Icon>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Icon>
);

const LockIcon = () => (
  <Icon>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Icon>
);

const EyeIcon = ({ off }) => (
  <Icon>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M3 3l18 18" />}
  </Icon>
);

const ShieldIcon = () => (
  <Icon size={28} strokeWidth={2}>
    <path d="M12 2.5 4.5 5.5v6c0 4.6 3.2 8.3 7.5 10 4.3-1.7 7.5-5.4 7.5-10v-6z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </Icon>
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

/* ---------- Screen: "D2 · Owner Log in" (node 6:54) ---------- */

export default function OwnerLogin({ onBack, onSubmit, onForgotPassword, onCreateAccount, initialEmail = '', notice = '' }) {
  const [email, setEmail] = useState(initialEmail); // pre-filled after registering
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setError('');
    try {
      await onSubmit?.({ email: email.trim(), password });
    } catch (err) {
      setError(err?.message || 'We couldn’t log you in. Please try again.');
    }
  };

  return (
    <main className={styles.screen}>
      <section className={styles.brandPanel}>
        <span className={`${styles.blob} ${styles.blobYellow}`} aria-hidden="true" />
        <span className={`${styles.blob} ${styles.blobRed}`} aria-hidden="true" />
        <span className={`${styles.blob} ${styles.blobGreen}`} aria-hidden="true" />
        <span className={`${styles.blob} ${styles.blobBlue}`} aria-hidden="true" />

        <div className={styles.logo}>
          <span className={styles.logoMark}>
            <HomeIcon />
          </span>
          <span className={styles.logoText}>
            <span className={styles.logoName}>BOARDEASE</span>
            <span className={styles.logoTagline}>Boarding House Reservation</span>
          </span>
        </div>

        <div className={styles.hero}>
          <HouseIllustration />
          <h1 className={styles.heroTitle}>Owner portal</h1>
          <p className={styles.heroText}>Post your boarding house, manage slots and prices, and reply to students.</p>
        </div>

        <p className={styles.footer}>
          University of Eastern Philippines · Catarman, Northern Samar
        </p>
      </section>

      <section className={styles.formPanel}>
        <form className={styles.formContent} onSubmit={handleSubmit} noValidate>
          <button type="button" className={styles.backButton} onClick={onBack} aria-label="Go back">
            <BackIcon />
          </button>

          <span className={styles.chip}>OWNER ACCOUNT</span>

          <h2 className={styles.title}>Owner Log in</h2>

          {notice && (
            <div className={styles.notice} role="status">
              <span className={styles.noticeIcon}><ShieldIcon /></span>
              <p className={styles.noticeText}>{notice}</p>
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="owner-email" className={styles.label}>Email</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}><MailIcon /></span>
              <input
                id="owner-email"
                type="email"
                className={styles.input}
                placeholder="owner@email.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="owner-password" className={styles.label}>Password</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}><LockIcon /></span>
              <input
                id="owner-password"
                type={showPassword ? 'text' : 'password'}
                className={styles.input}
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon off={showPassword} />
              </button>
            </div>
          </div>

          <button type="button" className={`${styles.link} ${styles.forgot}`} onClick={onForgotPassword}>
            Forgot password?
          </button>

          <button type="submit" className={styles.submit}>Log in</button>

          {error && <p className={styles.formError} role="alert">{error}</p>}

          <div className={styles.notice}>
            <span className={styles.noticeIcon}><ShieldIcon /></span>
            <p className={styles.noticeText}>
              After logging in, you will be asked to send your credentials as a boarding house owner using your camera.
            </p>
          </div>

          <button type="button" className={`${styles.link} ${styles.signup}`} onClick={onCreateAccount}>
            New owner?&nbsp; Create an account
          </button>
        </form>
      </section>
    </main>
  );
}
