import { useEffect, useId, useRef, useState } from 'react';
import styles from './BoarderLogin.module.css';
import PasswordRecovery from '../shared/PasswordRecovery';

const Icon = ({ size = 20, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const HomeIcon = () => (
  <Icon size={30}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <path d="M9 22V12h6v10" />
  </Icon>
);

const BackIcon = () => (
  <Icon size={22}>
    <path d="M15 18l-6-6 6-6" />
  </Icon>
);

const MailIcon = () => (
  <Icon>
    <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    <path d="M22 7l-10 7L2 7" />
  </Icon>
);

const LockIcon = () => (
  <Icon>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Icon>
);

const EyeIcon = ({ off }) => (
  <Icon>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M2 2l20 20" />}
  </Icon>
);

const CheckIcon = () => (
  <Icon size={28}>
    <path d="M20 6L9 17l-5-5" />
  </Icon>
);

const HouseIllustration = () => (
  <div className={styles.photo} aria-hidden="true">
    <span className={styles.ground} />
    <span className={styles.sun} />
    <span className={styles.houseBody}>
      <span className={`${styles.window} ${styles.windowLeft}`} />
      <span className={`${styles.window} ${styles.windowRight}`} />
      <span className={styles.door} />
    </span>
    <span className={styles.roof} />
  </div>
);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmail = (value) => {
  if (!value.trim()) return 'Enter your email address.';
  if (!EMAIL_PATTERN.test(value.trim())) return 'Enter a valid email address, like student@email.com.';
  return '';
};

const errorText = (error, fallback) => error?.message || fallback;

function Field({ id, label, icon, error, trailing, ...inputProps }) {
  const errorId = `${id}-error`;
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <div className={`${styles.inputWrap} ${error ? styles.inputWrapInvalid : ''}`}>
        <span className={styles.inputIcon}>{icon}</span>
        <input
          id={id}
          className={styles.input}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
        />
        {trailing}
      </div>
      {error && <p id={errorId} className={styles.fieldError}>{error}</p>}
    </div>
  );
}

export default function BoarderLogin({ onLogin, onBack, onResetPassword, onCreateAccount, initialEmail = '', notice = '' }) {
  const id = useId();
  const headingRef = useRef(null);
  const isFirstRender = useRef(true);

  const [view, setView] = useState('login');

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [login, setLogin] = useState({ status: 'idle', message: '' });
  const [loginNotice, setLoginNotice] = useState(notice);

  // Return focus to the log-in heading when coming back from password recovery.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (view === 'login') headingRef.current?.focus();
  }, [view]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (login.status === 'loading') return;

    const nextErrors = {
      email: validateEmail(email),
      password: password ? '' : 'Enter your password.',
    };
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    setLogin({ status: 'loading', message: '' });
    try {
      await onLogin?.({ email: email.trim(), password });
      setLogin({ status: 'idle', message: '' });
    } catch (error) {
      setLogin({ status: 'error', message: errorText(error, 'We couldn’t log you in. Please try again.') });
    }
  };

  const finishRecovery = (recoveredEmail) => {
    setEmail(recoveredEmail);
    setPassword('');
    setErrors({ email: '', password: '' });
    setLogin({ status: 'idle', message: '' });
    setLoginNotice('Your password has been updated. Log in with your new password.');
    setView('login');
  };

  const isLoggingIn = login.status === 'loading';

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
          <h1 className={styles.heroTitle}>Boarder portal</h1>
          <p className={styles.heroText}>Find a room, message owners and reserve your slot.</p>
        </div>

        <p className={styles.footer}>
          University of Eastern Philippines · Catarman, Northern Samar
        </p>
      </section>

      <section className={styles.formPanel}>
        {view === 'login' ? (
          <form className={styles.formContent} onSubmit={handleLogin} noValidate>
            <button type="button" className={styles.backButton} onClick={onBack} aria-label="Go back">
              <BackIcon />
            </button>

            <span className={styles.chip}>BOARDER ACCOUNT</span>

            <h2 ref={headingRef} tabIndex={-1} className={styles.title}>Boarder Log in</h2>

            {loginNotice && (
              <div className={styles.notice} role="status">
                <span className={styles.noticeIcon}><CheckIcon /></span>
                <p className={styles.noticeText}>{loginNotice}</p>
              </div>
            )}

            <Field
              id={`${id}-email`}
              label="Email"
              icon={<MailIcon />}
              error={errors.email}
              type="email"
              placeholder="student@email.com"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
            />

            <Field
              id={`${id}-password`}
              label="Password"
              icon={<LockIcon />}
              error={errors.password}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
              }}
              trailing={
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  <EyeIcon off={showPassword} />
                </button>
              }
            />

            <button type="button" className={`${styles.link} ${styles.forgot}`} onClick={() => setView('forgot')}>
              Forgot password?
            </button>

            <button type="submit" className={styles.submit} disabled={isLoggingIn} aria-busy={isLoggingIn}>
              {isLoggingIn && <span className={styles.spinner} aria-hidden="true" />}
              {isLoggingIn ? 'Logging in…' : 'Log in'}
            </button>

            {login.status === 'error' && (
              <p className={styles.formError} role="alert">{login.message}</p>
            )}

            <div className={styles.notice}>
              <span className={styles.noticeIcon}><CheckIcon /></span>
              <p className={styles.noticeText}>
                No credentials needed for boarders. Log in and start browsing right away.
              </p>
            </div>

            <button type="button" className={`${styles.link} ${styles.signup}`} onClick={onCreateAccount}>
              New student?&nbsp; Create an account
            </button>
          </form>
        ) : (
          <PasswordRecovery
            styles={styles}
            accountLabel="BOARDER ACCOUNT"
            emailPlaceholder="student@email.com"
            initialEmail={email}
            onResetPassword={onResetPassword}
            onCancel={() => setView('login')}
            onDone={finishRecovery}
          />
        )}
      </section>
    </main>
  );
}
