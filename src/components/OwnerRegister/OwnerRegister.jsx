import { useId, useState } from 'react';
import styles from './OwnerRegister.module.css';

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

const UserIcon = () => (
  <Icon>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Icon>
);

const MailIcon = () => (
  <Icon>
    <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    <path d="M22 7l-10 7L2 7" />
  </Icon>
);

const PhoneIcon = () => (
  <Icon>
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <path d="M12 18h.01" />
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
const PH_MOBILE_PATTERN = /^(09|\+639)\d{9}$/;

const normalizePhone = (value) => value.replace(/[\s()-]/g, '');

const EMPTY_FORM = {
  fullName: '',
  email: '',
  contactNumber: '',
  password: '',
  confirmPassword: '',
};

const VALIDATORS = {
  fullName: (v) => {
    if (!v.trim()) return 'Enter your full name.';
    if (v.trim().length < 2) return 'Your name looks too short.';
    return '';
  },
  email: (v) => {
    if (!v.trim()) return 'Enter your email address.';
    if (!EMAIL_PATTERN.test(v.trim())) return 'Enter a valid email address, like owner@email.com.';
    return '';
  },
  contactNumber: (v) => {
    if (!v.trim()) return 'Enter your mobile number.';
    if (!PH_MOBILE_PATTERN.test(normalizePhone(v))) return 'Use a PH mobile number, like 0917 123 4567.';
    return '';
  },
  password: (v) => {
    if (!v) return 'Create a password.';
    if (v.length < 8) return 'Use at least 8 characters.';
    if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return 'Include at least one letter and one number.';
    return '';
  },
  confirmPassword: (v, form) => {
    if (!v) return 'Re-enter your password.';
    if (v !== form.password) return 'Passwords don’t match.';
    return '';
  },
};

const validateAll = (form) =>
  Object.fromEntries(Object.keys(VALIDATORS).map((key) => [key, VALIDATORS[key](form[key], form)]));

function Field({ id, label, icon, error, hint, trailing, ...inputProps }) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error && errorId, hint && !error && hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <div className={`${styles.inputWrap} ${error ? styles.inputWrapInvalid : ''}`}>
        <span className={styles.inputIcon}>{icon}</span>
        <input
          id={id}
          className={styles.input}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...inputProps}
        />
        {trailing}
      </div>
      {error ? (
        <p id={errorId} className={styles.fieldError}>{error}</p>
      ) : (
        hint && <p id={hintId} className={styles.fieldHint}>{hint}</p>
      )}
    </div>
  );
}

function VisibilityToggle({ visible, onToggle, label }) {
  return (
    <button
      type="button"
      className={styles.eyeButton}
      onClick={onToggle}
      aria-label={visible ? `Hide ${label}` : `Show ${label}`}
      aria-pressed={visible}
    >
      <EyeIcon off={visible} />
    </button>
  );
}

export default function OwnerRegister({ onRegister, onBack, onBackToLogin }) {
  const id = useId();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [attempted, setAttempted] = useState(false); // validate live only after the first submit
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submission, setSubmission] = useState({ status: 'idle', message: '' });

  const updateField = (key) => (e) => {
    const next = { ...form, [key]: e.target.value };
    setForm(next);
    if (attempted) {
      setErrors((prev) => ({
        ...prev,
        [key]: VALIDATORS[key](next[key], next),
        // Changing the password can fix or break the confirmation match.
        ...(key === 'password' && next.confirmPassword
          ? { confirmPassword: VALIDATORS.confirmPassword(next.confirmPassword, next) }
          : {}),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submission.status === 'loading') return;

    setAttempted(true);
    const nextErrors = validateAll(form);
    setErrors(nextErrors);

    const firstInvalid = Object.keys(nextErrors).find((key) => nextErrors[key]);
    if (firstInvalid) {
      document.getElementById(`${id}-${firstInvalid}`)?.focus();
      return;
    }

    setSubmission({ status: 'loading', message: '' });
    try {
      await onRegister?.({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        contactNumber: normalizePhone(form.contactNumber),
        password: form.password,
      });
      setSubmission({ status: 'idle', message: '' });
    } catch (error) {
      setSubmission({
        status: 'error',
        message: error?.message || 'We couldn’t create your account. Please try again.',
      });
    }
  };

  const isLoading = submission.status === 'loading';

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
          <h1 className={styles.heroTitle}>Join as an owner</h1>
          <p className={styles.heroText}>Create your account to post your boarding house, manage slots and reply to students.</p>
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

          <h2 className={styles.title}>Create account</h2>

          <Field
            id={`${id}-fullName`}
            label="Full Name"
            icon={<UserIcon />}
            error={errors.fullName}
            type="text"
            placeholder="Juan Dela Cruz"
            autoComplete="name"
            value={form.fullName}
            onChange={updateField('fullName')}
          />

          <Field
            id={`${id}-email`}
            label="Email"
            icon={<MailIcon />}
            error={errors.email}
            type="email"
            placeholder="owner@email.com"
            autoComplete="email"
            value={form.email}
            onChange={updateField('email')}
          />

          <Field
            id={`${id}-contactNumber`}
            label="Contact Number"
            icon={<PhoneIcon />}
            error={errors.contactNumber}
            type="tel"
            inputMode="tel"
            placeholder="0917 123 4567"
            autoComplete="tel"
            value={form.contactNumber}
            onChange={updateField('contactNumber')}
          />

          <Field
            id={`${id}-password`}
            label="Password"
            icon={<LockIcon />}
            error={errors.password}
            hint="At least 8 characters, with a letter and a number."
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="new-password"
            value={form.password}
            onChange={updateField('password')}
            trailing={
              <VisibilityToggle
                visible={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
                label="password"
              />
            }
          />

          <Field
            id={`${id}-confirmPassword`}
            label="Confirm Password"
            icon={<LockIcon />}
            error={errors.confirmPassword}
            type={showConfirm ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={updateField('confirmPassword')}
            trailing={
              <VisibilityToggle
                visible={showConfirm}
                onToggle={() => setShowConfirm((v) => !v)}
                label="confirm password"
              />
            }
          />

          <button type="submit" className={styles.submit} disabled={isLoading} aria-busy={isLoading}>
            {isLoading && <span className={styles.spinner} aria-hidden="true" />}
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>

          {submission.status === 'error' && (
            <p className={styles.formError} role="alert">{submission.message}</p>
          )}

          <p className={styles.switchText}>
            Already have an account?{' '}
            <button type="button" className={styles.link} onClick={onBackToLogin}>
              Log in
            </button>
          </p>
        </form>
      </section>
    </main>
  );
}
