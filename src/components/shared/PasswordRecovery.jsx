import { useEffect, useId, useRef, useState } from 'react';
import recovery from './PasswordRecovery.module.css';

/* Three-step password recovery shared by the boarder and owner log-in screens:
   email → 6-digit verification code → new password. `styles` is the parent screen's CSS module,
   so the form matches that screen; the step row and demo code box come from this component's own module. */

const Icon = ({ size = 20, strokeWidth = 1.67, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;
const STEP_LABELS = ['Email', 'Verify', 'New password'];
const STEP_INDEX = { email: 0, code: 1, password: 2, done: 3 };

const validateEmail = (value) => {
  if (!value.trim()) return 'Enter your email address.';
  if (!EMAIL_PATTERN.test(value.trim())) return 'Enter a valid email address.';
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

function Field({ styles, id, label, icon, error, trailing, ...inputProps }) {
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

function StepRow({ current }) {
  return (
    <ol className={recovery.steps} aria-label="Password recovery steps">
      {STEP_LABELS.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : 'todo';
        return (
          <li
            key={label}
            className={`${recovery.step} ${recovery[`step_${state}`]}`}
            aria-current={state === 'active' ? 'step' : undefined}
          >
            <span className={recovery.stepNumber}>{state === 'done' ? '✓' : i + 1}</span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}

export default function PasswordRecovery({
  styles,
  accountLabel,
  emailPlaceholder,
  initialEmail = '',
  onResetPassword,
  onCancel,
  onDone,
}) {
  const id = useId();
  const headingRef = useRef(null);

  const [step, setStep] = useState('email');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(null);
  const [codeInput, setCodeInput] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_CODE_ATTEMPTS);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  // Move focus to each step's heading so keyboard and screen-reader users follow along.
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const clearError = (key) => setErrors((prev) => ({ ...prev, [key]: '', form: '' }));

  const sendCode = async () => {
    setBusy(true);
    await mockSendCode();
    setCode({ value: randomCode(), expiresAt: Date.now() + CODE_TTL_MS });
    setAttemptsLeft(MAX_CODE_ATTEMPTS);
    setCodeInput('');
    setErrors({});
    setBusy(false);
    setStep('code');
  };

  const submitEmail = async (e) => {
    e.preventDefault();
    if (busy) return;
    const emailError = validateEmail(email);
    setErrors({ email: emailError });
    if (!emailError) await sendCode();
  };

  const submitCode = (e) => {
    e.preventDefault();
    if (!code || Date.now() > code.expiresAt) {
      setErrors({ code: 'This code has expired. Send a new one.' });
      return;
    }
    if (attemptsLeft <= 0) {
      setErrors({ code: 'Too many wrong attempts. Send a new code.' });
      return;
    }
    if (codeInput.trim() !== code.value) {
      const left = attemptsLeft - 1;
      setAttemptsLeft(left);
      setErrors({
        code: left > 0
          ? `That code isn’t right. ${left} ${left === 1 ? 'try' : 'tries'} left.`
          : 'Too many wrong attempts. Send a new code.',
      });
      return;
    }
    setErrors({});
    setCode(null);
    setStep('password');
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    if (busy) return;
    const nextErrors = validateNewPassword(newPassword, confirmPassword);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setBusy(true);
    try {
      await onResetPassword?.({ email: email.trim(), password: newPassword });
      setStep('done');
    } catch (err) {
      setErrors({ form: err?.message || 'We couldn’t update your password. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  const spinner = busy && <span className={styles.spinner} aria-hidden="true" />;

  const header = (title) => (
    <>
      <span className={styles.chip}>{accountLabel}</span>
      <h2 ref={headingRef} tabIndex={-1} className={styles.title}>{title}</h2>
      <StepRow current={STEP_INDEX[step]} />
    </>
  );

  if (step === 'code') {
    return (
      <form className={styles.formContent} onSubmit={submitCode} noValidate>
        <button type="button" className={styles.backButton} onClick={() => setStep('email')} aria-label="Change email">
          <BackIcon />
        </button>
        {header('Enter the code')}
        <p className={styles.subtitle}>
          We sent a 6-digit verification code to <strong className={recovery.strong}>{email.trim()}</strong>.
          It expires in 10 minutes.
        </p>

        {code && (
          <div className={recovery.demoCode} role="note">
            <span className={recovery.demoLabel}>Demo mode · no email is sent</span>
            Your verification code is <strong className={recovery.demoValue}>{code.value}</strong>
          </div>
        )}

        <Field
          styles={styles}
          id={`${id}-code`}
          label="Verification code"
          icon={<KeyIcon />}
          error={errors.code}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          value={codeInput}
          onChange={(e) => { setCodeInput(e.target.value.replace(/\D/g, '')); clearError('code'); }}
        />

        <button type="submit" className={styles.submit} disabled={codeInput.length !== 6}>Verify code</button>

        <button
          type="button"
          className={`${styles.link} ${styles.signup} ${recovery.resend}`}
          onClick={sendCode}
          disabled={busy}
        >
          {busy ? 'Sending a new code…' : 'Didn’t get it? Send a new code'}
        </button>
      </form>
    );
  }

  if (step === 'password') {
    return (
      <form className={styles.formContent} onSubmit={submitPassword} noValidate>
        {header('New password')}
        <p className={styles.subtitle}>Use at least 8 characters with at least one letter and one number.</p>

        <Field
          styles={styles}
          id={`${id}-new-password`}
          label="New password"
          icon={<LockIcon />}
          error={errors.password}
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="••••••••"
          value={newPassword}
          onChange={(e) => { setNewPassword(e.target.value); clearError('password'); }}
          trailing={
            <button
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide new password' : 'Show new password'}
              aria-pressed={showPassword}
            >
              <EyeIcon off={showPassword} />
            </button>
          }
        />

        <Field
          styles={styles}
          id={`${id}-confirm-password`}
          label="Confirm new password"
          icon={<LockIcon />}
          error={errors.confirm}
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirm'); }}
        />

        <button type="submit" className={styles.submit} disabled={busy} aria-busy={busy}>
          {spinner}
          {busy ? 'Saving…' : 'Save new password'}
        </button>

        {errors.form && <p className={styles.formError} role="alert">{errors.form}</p>}
      </form>
    );
  }

  if (step === 'done') {
    return (
      <div className={styles.formContent}>
        {header('Password updated')}
        <div className={styles.notice} role="status">
          <span className={styles.noticeIcon}><ShieldIcon /></span>
          <p className={styles.noticeText}>Your password has been changed. Use it the next time you log in.</p>
        </div>
        <button type="button" className={styles.submit} onClick={() => onDone?.(email.trim())}>Back to log in</button>
      </div>
    );
  }

  return (
    <form className={styles.formContent} onSubmit={submitEmail} noValidate>
      <button type="button" className={styles.backButton} onClick={onCancel} aria-label="Back to log in">
        <BackIcon />
      </button>
      {header('Forgot password?')}
      <p className={styles.subtitle}>
        Enter the email you use for your account and we’ll send you a verification code.
      </p>

      <Field
        styles={styles}
        id={`${id}-email`}
        label="Email"
        icon={<MailIcon />}
        error={errors.email}
        type="email"
        autoComplete="email"
        placeholder={emailPlaceholder}
        value={email}
        onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
      />

      <button type="submit" className={styles.submit} disabled={busy} aria-busy={busy}>
        {spinner}
        {busy ? 'Sending code…' : 'Send verification code'}
      </button>

      <button type="button" className={`${styles.link} ${styles.signup}`} onClick={onCancel}>
        Remembered it? Log in
      </button>
    </form>
  );
}
