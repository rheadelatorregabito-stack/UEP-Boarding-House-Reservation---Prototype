import styles from './StatusScreen.module.css';
import { Screen, cx, ui } from '../shared/ui';
import { CheckIcon, ClockIcon, CloseIcon } from '../BoarderHome/icons';

const TONES = {
  success: { className: styles.success, Icon: CheckIcon },
  pending: { className: styles.pending, Icon: ClockIcon },
  declined: { className: styles.declined, Icon: CloseIcon },
};

const VARIANTS = {
  primary: ui.btnPrimary,
  yellow: ui.btnYellow,
  outline: ui.btnOutline,
  outlineGreen: ui.btnOutlineGreen,
  outlineDanger: ui.btnOutlineDanger,
};

/* Shared layout of the confirmation screens: icon circle → title → content card(s) → row of buttons. */
export default function StatusScreen({ session, nav, active = null, tone = 'success', title, children, actions = [] }) {
  const { className, Icon } = TONES[tone];

  return (
    <Screen session={session} nav={nav} active={active} white mainClassName={styles.body}>
      <span className={cx(styles.iconCircle, className)} aria-hidden="true">
        <Icon size={56} />
      </span>

      <h1 className={styles.title}>{title}</h1>

      {children}

      {actions.length > 0 && (
        <div className={styles.actions}>
          {actions.map(({ label, icon: ActionIcon, variant = 'primary', onClick }) => (
            <button key={label} type="button" className={cx(ui.btn, VARIANTS[variant])} onClick={onClick}>
              {ActionIcon && <ActionIcon />} {label}
            </button>
          ))}
        </div>
      )}
    </Screen>
  );
}

export function SummaryCard({ rows }) {
  return (
    <dl className={cx(styles.card, styles.summary)}>
      {rows.map(({ label, value, tone }) => (
        <div key={label} className={styles.summaryRow}>
          <dt>{label}</dt>
          <dd className={tone === 'alert' ? styles.alert : undefined}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function MessageCard({ tone = 'yellow', title, text }) {
  return (
    <div className={cx(styles.messageCard, tone === 'gray' ? styles.messageGray : styles.messageYellow)}>
      <p className={styles.messageTitle}>{title}</p>
      <p className={styles.messageText}>{text}</p>
    </div>
  );
}

export function ProgressSteps({ steps }) {
  return (
    <ol className={styles.steps}>
      {steps.map(({ title, detail, icon: StepIcon, tone }) => (
        <li key={title} className={styles.step}>
          <span className={cx(styles.stepIcon, styles[`step_${tone}`])} aria-hidden="true"><StepIcon size={20} /></span>
          <span>
            <span className={styles.stepTitle}>{title}</span>
            <span className={styles.stepDetail}>{detail}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export { styles as statusStyles };
