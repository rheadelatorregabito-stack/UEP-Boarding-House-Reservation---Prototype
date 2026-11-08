import { useEffect, useId, useRef, useState } from 'react';
import styles from './BoarderLogin.module.css';

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

// Used when no onForgotPassword handler is passed, so the flow still works without a backend.
const mockSendResetLink = () => new Promise((resolve) => setTimeout(resolve, 1000));

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

export default function BoarderLogin({ onLogin, onBack, onForgotPassword, onCreateAccount, initialEmail = '', notice = '' }) {
  const id = useId();
  const headingRef = useRef(null);
  const isFirstRender = useRef(true);

  const [view, setView] = useState('login');

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [login, setLogin] = useState({ status: 'idle', message: '' });

  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [reset, setReset] = useState({ status: 'idle', message: '' });

  // Move focus to the new heading when switching views, so keyboard and screen-reader users follow along.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    headingRef.current?.focus();
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

  const openForgotPassword = () => {
    setResetEmail(email);
    setResetError('');
    setReset({ status: 'idle', message: '' });
    setView('forgot');
  };

  const handleSendResetLink = async (e) => {
    e.preventDefault();
    if (reset.status === 'sending') return;

    const error = validateEmail(resetEmail);
    setResetError(error);
    if (error) return;

    setReset({ status: 'sending', message: '' });
    try {
      await (onForgotPassword ?? mockSendResetLink)({ email: resetEmail.trim() });
      setReset({ status: 'sent', message: '' });
    } catch (err) {
      setReset({ status: 'error', message: errorText(err, 'We couldn’t send the reset link. Please try again.') });
    }
  };

  const backToLogin = () => {
    if (reset.status === 'sent') setEmail(resetEmail.trim());
    setView('login');
  };

  const isLoggingIn = login.status === 'loading';
  const isSendingReset = reset.status === 'sending';

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

            {notice && (
              <div className={styles.notice} role="status">
                <span className={styles.noticeIcon}><CheckIcon /></span>
                <p className={styles.noticeText}>{notice}</p>
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

            <button type="button" className={`${styles.link} ${styles.forgot}`} onClick={openForgotPassword}>
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
          <form className={styles.formContent} onSubmit={handleSendResetLink} noValidate>
            <button type="button" className={styles.backButton} onClick={backToLogin} aria-label="Back to log in">
              <BackIcon />
            </button>

            <span className={styles.chip}>BOARDER ACCOUNT</span>

            <h2 ref={headingRef} tabIndex={-1} className={styles.title}>Reset password</h2>

            {reset.status === 'sent' ? (
              <>
                <div className={styles.notice} role="status">
                  <span className={styles.noticeIcon}><CheckIcon /></span>
                  <p className={styles.noticeText}>
                    If an account exists for <strong>{resetEmail.trim()}</strong>, we’ve sent a link to
                    reset your password. Check your inbox and spam folder.
                  </p>
                </div>

                <button type="button" className={styles.submit} onClick={backToLogin}>
                  Back to log in
                </button>

                <button
                  type="button"
                  className={`${styles.link} ${styles.signup}`}
                  onClick={() => setReset({ status: 'idle', message: '' })}
                >
                  Didn’t get it? Send again
                </button>
              </>
            ) : (
              <>
                <p className={styles.subtitle}>
                  Enter the email you use for BoardEase and we’ll send you a link to reset your password.
                </p>

                <Field
                  id={`${id}-reset-email`}
                  label="Email"
                  icon={<MailIcon />}
                  error={resetError}
                  type="email"
                  placeholder="student@email.com"
                  autoComplete="email"
                  value={resetEmail}
                  onChange={(e) => {
                    setResetEmail(e.target.value);
                    if (resetError) setResetError('');
                  }}
                />

                <button type="submit" className={styles.submit} disabled={isSendingReset} aria-busy={isSendingReset}>
                  {isSendingReset && <span className={styles.spinner} aria-hidden="true" />}
                  {isSendingReset ? 'Sending…' : 'Send reset link'}
                </button>

                {reset.status === 'error' && (
                  <p className={styles.formError} role="alert">{reset.message}</p>
                )}

                <button type="button" className={`${styles.link} ${styles.signup}`} onClick={backToLogin}>
                  Remembered it? Log in
                </button>
              </>
            )}
          </form>
        )}
      </section>
    </main>
  );
}
