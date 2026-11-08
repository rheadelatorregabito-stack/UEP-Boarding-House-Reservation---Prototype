import styles from './CredentialsUnderReview.module.css';

/* ---------- Icons — paths exported from Figma (icon/clock, check, shield, home), on a 24-unit grid ---------- */

const Icon = ({ size = 20, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const ClockIcon = ({ size }) => (
  <Icon size={size}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </Icon>
);

const CheckIcon = () => (
  <Icon>
    <path d="M20 6L9 17l-5-5" />
  </Icon>
);

const ShieldIcon = () => (
  <Icon>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </Icon>
);

const HomeIcon = () => (
  <Icon>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <path d="M9 22V12h6v10" />
  </Icon>
);

/* ---------- Review progress ---------- */

const STEPS = [
  { status: 'done',    icon: <CheckIcon />,  title: 'Credentials submitted', detail: 'Received today' },
  { status: 'current', icon: <ClockIcon />,  title: 'Under review',          detail: 'Usually 1–3 working days' },
  { status: 'pending', icon: <ShieldIcon />, title: 'Approved',              detail: 'Start posting' },
];

/* ---------- Screen: "D4 · Credentials Under Review" (node 6:155) ---------- */

export default function CredentialsUnderReview({ onContinue }) {
  return (
    <main className={styles.screen}>
      <div className={styles.illustration} aria-hidden="true">
        <span className={styles.halo} />
        <span className={styles.disc}>
          <ClockIcon size={84} />
        </span>
        <span className={`${styles.dot} ${styles.dotRed}`} />
        <span className={`${styles.dot} ${styles.dotGreen}`} />
        <span className={`${styles.dot} ${styles.dotBlue}`} />
      </div>

      <h1 className={styles.title}>Credentials sent!</h1>

      <section className={styles.notice}>
        <h2 className={styles.noticeTitle}>This may take a while reviewing your credentials.</h2>
        <p className={styles.noticeText}>
          Our team is checking your documents. We will notify you as soon as your owner account
          is approved.
        </p>
      </section>

      <ol className={styles.steps} aria-label="Review progress">
        {STEPS.map(({ status, icon, title, detail }) => (
          <li
            key={title}
            className={styles.step}
            aria-current={status === 'current' ? 'step' : undefined}
          >
            <span className={`${styles.stepIcon} ${styles[status]}`}>{icon}</span>
            <span className={styles.stepText}>
              <span className={styles.stepTitle}>{title}</span>
              <span className={styles.stepDetail}>{detail}</span>
            </span>
          </li>
        ))}
      </ol>

      <button type="button" className={styles.continueButton} onClick={onContinue}>
        <HomeIcon />
        Continue to Home
      </button>
    </main>
  );
}
