import { useEffect, useId, useRef, useState } from 'react';
import styles from './OwnerLogin.module.css';

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

const KeyIcon = () => (
  <Icon>
    <circle cx="7.5" cy="15.5" r="4.5" />
    <path d="m10.7 12.3 9.8-9.8M17 6l3 3M14.5 8.5l2 2" />
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;
const RECOVERY_STEPS = ['Email', 'Verify', 'New password'];

const validateEmail = (value) => {
  if (!value.trim()) return 'Enter your email address.';
  if (!EMAIL_PATTERN.test(value.trim())) return 'Enter a valid email address, like owner@email.com.';
  return '';
};

const validateNewPassword = (password, confirm) => {
  if (!password) return { password: 'Create a new password.' };
  if (password.length < 8) return { password: 'Use at least 8 characters.' };
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return { password: 'Include at least one letter and one number.' };
  if (password !== confirm) return { confirm: 'Passwords don’t match.' };
  return {};
};

const randomCode = () => {
  const value = window.crypto?.getRandomValues
    ? window.crypto.getRandomValues(new Uint32Array(1))[0]
    : Math.floor(Math.random() * 2 ** 32);
  return String(value % 1000000).padStart(6, '0');
};

/* Stands in for an email service: there is no backend, so the code is shown on screen in demo mode. */
const mockSendCode = () => new Promise((resolve) => setTimeout(resolve, 800));

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

function RecoverySteps({ current }) {
  return (
    <ol className={styles.steps} aria-label="Password recovery steps">
      {RECOVERY_STEPS.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : 'todo';
        return (
          <li
            key={label}
            className={`${styles.step} ${styles[`step_${state}`]}`}
            aria-current={state === 'active' ? 'step' : undefined}
          >
            <span className={styles.stepNumber}>{state === 'done' ? '✓' : i + 1}</span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}

export default function OwnerLogin({ onBack, onSubmit, onResetPassword, onCreateAccount, initialEmail = '', notice = '' }) {
  const id = useId();
  const headingRef = useRef(null);
  const isFirstRender = useRef(true);

  const [view, setView] = useState('login');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loginNotice, setLoginNotice] = useState(notice);

  const [step, setStep] = useState('email');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [code, setCode] = useState(null);
  const [codeInput, setCodeInput] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_CODE_ATTEMPTS);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [recoveryErrors, setRecoveryErrors] = useState({});
  const [busy, setBusy] = useState(false);

  // Move focus to the new heading when the view or step changes, so keyboard and screen-reader users follow along.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [view, step]);

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

  const openRecovery = () => {
    setRecoveryEmail(email);
    setRecoveryErrors({});
    setCodeInput('');
    setNewPassword('');
    setConfirmPassword('');
    setStep('email');
    setView('recover');
  };

  const backToLogin = () => {
    setView('login');
    setStep('email');
    setCode(null);
  };

  const sendCode = async () => {
    setBusy(true);
    await mockSendCode();
    setCode({ value: randomCode(), expiresAt: Date.now() + CODE_TTL_MS });
    setAttemptsLeft(MAX_CODE_ATTEMPTS);
    setCodeInput('');
    setBusy(false);
    setStep('code');
  };

  const handleEmailStep = async (e) => {
    e.preventDefault();
    if (busy) return;
    const emailError = validateEmail(recoveryEmail);
    setRecoveryErrors({ email: emailError });
    if (!emailError) await sendCode();
  };

  const handleCodeStep = (e) => {
    e.preventDefault();
    if (!code || Date.now() > code.expiresAt) {
      setRecoveryErrors({ code: 'This code has expired. Send a new one.' });
      return;
    }
    if (attemptsLeft <= 0) {
      setRecoveryErrors({ code: 'Too many wrong attempts. Send a new code.' });
      return;
    }
    if (codeInput.trim() !== code.value) {
      const left = attemptsLeft - 1;
      setAttemptsLeft(left);
      setRecoveryErrors({
        code: left > 0
          ? `That code isn’t right. ${left} ${left === 1 ? 'try' : 'tries'} left.`
          : 'Too many wrong attempts. Send a new code.',
      });
      return;
    }
    setRecoveryErrors({});
    setCode(null);
    setStep('password');
  };

  const handlePasswordStep = async (e) => {
    e.preventDefault();
    if (busy) return;
    const errors = validateNewPassword(newPassword, confirmPassword);
    setRecoveryErrors(errors);
    if (Object.keys(errors).length) return;

    setBusy(true);
    try {
      await onResetPassword?.({ email: recoveryEmail.trim(), password: newPassword });
      setStep('done');
    } catch (err) {
      setRecoveryErrors({ form: err?.message || 'We couldn’t update your password. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  const finishRecovery = () => {
    setEmail(recoveryEmail.trim());
    setPassword('');
    setError('');
    setLoginNotice('Your password has been updated. Log in with your new password.');
    backToLogin();
  };

  const clearError = (key) => () => setRecoveryErrors((prev) => ({ ...prev, [key]: '', form: '' }));
  const spinner = busy && <span className={styles.spinner} aria-hidden="true" />;

  const renderRecovery = () => {
    switch (step) {
      case 'code':
        return (
          <form className={styles.formContent} onSubmit={handleCodeStep} noValidate>
            <button type="button" className={styles.backButton} onClick={() => setStep('email')} aria-label="Change email">
              <BackIcon />
            </button>
            <span className={styles.chip}>OWNER ACCOUNT</span>
            <h2 ref={headingRef} tabIndex={-1} className={styles.title}>Enter the code</h2>
            <RecoverySteps current={1} />
            <p className={styles.subtitle}>
              We sent a 6-digit verification code to <strong>{recoveryEmail.trim()}</strong>. It expires in 10 minutes.
            </p>

            {code && (
              <div className={styles.demoCode} role="note">
                <span className={styles.demoLabel}>Demo mode · no email is sent</span>
                Your verification code is <strong className={styles.demoValue}>{code.value}</strong>
              </div>
            )}

            <Field
              id={`${id}-code`}
              label="Verification code"
              icon={<KeyIcon />}
              error={recoveryErrors.code}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              value={codeInput}
              onChange={(e) => { setCodeInput(e.target.value.replace(/\D/g, '')); clearError('code')(); }}
            />

            <button type="submit" className={styles.submit} disabled={codeInput.length !== 6}>Verify code</button>

            <button type="button" className={`${styles.link} ${styles.signup}`} onClick={sendCode} disabled={busy}>
              {busy ? 'Sending a new code…' : 'Didn’t get it? Send a new code'}
            </button>
          </form>
        );

      case 'password':
        return (
          <form className={styles.formContent} onSubmit={handlePasswordStep} noValidate>
            <span className={styles.chip}>OWNER ACCOUNT</span>
            <h2 ref={headingRef} tabIndex={-1} className={styles.title}>New password</h2>
            <RecoverySteps current={2} />
            <p className={styles.subtitle}>Use at least 8 characters with at least one letter and one number.</p>

            <Field
              id={`${id}-new-password`}
              label="New password"
              icon={<LockIcon />}
              error={recoveryErrors.password}
              type={showNewPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); clearError('password')(); }}
              trailing={
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowNewPassword((v) => !v)}
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  aria-pressed={showNewPassword}
                >
                  <EyeIcon off={showNewPassword} />
                </button>
              }
            />

            <Field
              id={`${id}-confirm-password`}
              label="Confirm new password"
              icon={<LockIcon />}
              error={recoveryErrors.confirm}
              type={showNewPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirm')(); }}
            />

            <button type="submit" className={styles.submit} disabled={busy} aria-busy={busy}>
              {spinner}
              {busy ? 'Saving…' : 'Save new password'}
            </button>

            {recoveryErrors.form && <p className={styles.formError} role="alert">{recoveryErrors.form}</p>}
          </form>
        );

      case 'done':
        return (
          <div className={styles.formContent}>
            <span className={styles.chip}>OWNER ACCOUNT</span>
            <h2 ref={headingRef} tabIndex={-1} className={styles.title}>Password updated</h2>
            <RecoverySteps current={RECOVERY_STEPS.length} />
            <div className={styles.notice} role="status">
              <span className={styles.noticeIcon}><ShieldIcon /></span>
              <p className={styles.noticeText}>
                Your owner account password has been changed. Use it the next time you log in.
              </p>
            </div>
            <button type="button" className={styles.submit} onClick={finishRecovery}>Back to log in</button>
          </div>
        );

      default:
        return (
          <form className={styles.formContent} onSubmit={handleEmailStep} noValidate>
            <button type="button" className={styles.backButton} onClick={backToLogin} aria-label="Back to log in">
              <BackIcon />
            </button>
            <span className={styles.chip}>OWNER ACCOUNT</span>
            <h2 ref={headingRef} tabIndex={-1} className={styles.title}>Forgot password?</h2>
            <RecoverySteps current={0} />
            <p className={styles.subtitle}>
              Enter the email you use for your owner account and we’ll send you a verification code.
            </p>

            <Field
              id={`${id}-recovery-email`}
              label="Email"
              icon={<MailIcon />}
              error={recoveryErrors.email}
              type="email"
              autoComplete="email"
              placeholder="owner@email.com"
              value={recoveryEmail}
              onChange={(e) => { setRecoveryEmail(e.target.value); clearError('email')(); }}
            />

            <button type="submit" className={styles.submit} disabled={busy} aria-busy={busy}>
              {spinner}
              {busy ? 'Sending code…' : 'Send verification code'}
            </button>

            <button type="button" className={`${styles.link} ${styles.signup}`} onClick={backToLogin}>
              Remembered it? Log in
            </button>
          </form>
        );
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
        {view === 'recover' ? renderRecovery() : (
          <form className={styles.formContent} onSubmit={handleSubmit} noValidate>
            <button type="button" className={styles.backButton} onClick={onBack} aria-label="Go back">
              <BackIcon />
            </button>

            <span className={styles.chip}>OWNER ACCOUNT</span>

            <h2 ref={headingRef} tabIndex={-1} className={styles.title}>Owner Log in</h2>

            {loginNotice && (
              <div className={styles.notice} role="status">
                <span className={styles.noticeIcon}><ShieldIcon /></span>
                <p className={styles.noticeText}>{loginNotice}</p>
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

            <button type="button" className={`${styles.link} ${styles.forgot}`} onClick={openRecovery}>
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
        )}
      </section>
    </main>
  );
}
