import { useId, useState } from 'react';
import styles from './WriteReview.module.css';
import { Screen, cx, ui } from '../shared/ui';
import ListingPhoto from '../shared/ListingPhoto';
import { CheckIcon, SendIcon, StarIcon } from '../BoarderHome/icons';
import { REVIEW_TAGS } from '../../data/reviews';

const RATING_WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
const MIN_LENGTH = 10;

/* ---------- B9 · Write a Review (Owner accepted) (17:265) ---------- */

export default function WriteReview({ session, nav, listing, onCancel, onSubmit }) {
  const id = useId();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [tags, setTags] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const toggleTag = (tag) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rating) return setError('Choose a star rating.');
    if (text.trim().length < MIN_LENGTH) return setError(`Write at least ${MIN_LENGTH} characters about your stay.`);
    setError('');
    onSubmit?.({ rating, tags, text: text.trim() });
    return undefined;
  };

  const shown = hover || rating;

  return (
    <Screen session={session} nav={nav} active={null} mainClassName={styles.page}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <p className={styles.accepted}>
          <CheckIcon size={24} />
          {listing.owner} accepted your request. You can now leave a review.
        </p>

        <div className={styles.head}>
          <ListingPhoto listing={listing} className={styles.photo} rounded={16} />
          <div>
            <h1 className={styles.title}>Write your review</h1>
            <p className={styles.subtitle}>{listing.name}</p>
          </div>
        </div>

        <fieldset className={styles.group}>
          <legend className={styles.label}>Your rating</legend>
          <div className={styles.stars} role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n === 1 ? '' : 's'} – ${RATING_WORDS[n]}`}
                className={cx(styles.star, n <= shown && styles.starOn)}
                onClick={() => { setRating(n); setError(''); }}
                onMouseEnter={() => setHover(n)}
                onFocus={() => setHover(n)}
                onBlur={() => setHover(0)}
              >
                <StarIcon size={46} />
              </button>
            ))}
            <span className={styles.ratingWord} aria-live="polite">{RATING_WORDS[shown]}</span>
          </div>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.label}>What did you like?</legend>
          <div className={ui.toggleChips}>
            {REVIEW_TAGS.map((tag) => {
              const on = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={on}
                  className={cx(ui.toggleChip, on && ui.toggleChipOn)}
                  onClick={() => toggleTag(tag)}
                >
                  {on && <CheckIcon size={13} />} {tag}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className={styles.group}>
          <label htmlFor={`${id}-text`} className={styles.label}>Your review</label>
          <div className={cx(ui.inputWrap, ui.textareaWrap)}>
            <textarea
              id={`${id}-text`}
              className={cx(ui.textarea, styles.textarea)}
              placeholder="How was the room, the owner and the location?"
              value={text}
              maxLength={1000}
              onChange={(e) => { setText(e.target.value); if (error) setError(''); }}
            />
          </div>
          <p className={styles.counter}>{text.length} / 1000</p>
        </div>

        {error && <p className={ui.fieldError} role="alert">{error}</p>}

        <div className={styles.actions}>
          <button type="button" className={cx(ui.btn, ui.btnOutlineMuted)} onClick={onCancel}>Cancel</button>
          <button type="submit" className={cx(ui.btn, ui.btnGreen, styles.submit)}>
            <SendIcon /> Submit review
          </button>
        </div>
      </form>
    </Screen>
  );
}
