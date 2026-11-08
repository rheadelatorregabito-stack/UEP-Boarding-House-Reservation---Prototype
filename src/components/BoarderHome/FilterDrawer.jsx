import { useEffect, useId, useRef, useState } from 'react';
import styles from './FilterDrawer.module.css';
import { CheckIcon, CloseIcon } from './icons';
import {
  DEFAULT_FILTERS,
  PRICE_MAX,
  PRICE_MIN,
  PRICE_STEP,
  ZONES,
  formatPrice,
  pluralize,
} from './listings';

const GENDER_OPTIONS = [
  { value: 'boys', label: 'Boys only' },
  { value: 'girls', label: 'Girls only' },
  { value: 'mixed', label: 'Both' },
];

const ROOM_OPTIONS = [
  { value: 'studio', label: 'Studio' },
  { value: 'notStudio', label: 'Not studio' },
  { value: 'any', label: 'Any' },
];

const clampPrice = (value) =>
  Math.min(PRICE_MAX, Math.max(PRICE_MIN, Math.round(value / PRICE_STEP) * PRICE_STEP));

const percent = (value) => ((value - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;

function OptionGroup({ label, options, value, onChange, allowNone }) {
  const labelId = useId();
  return (
    <fieldset className={styles.section}>
      <legend id={labelId} className={styles.sectionTitle}>{label}</legend>
      <div className={styles.options} role="radiogroup" aria-labelledby={labelId}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`${styles.option} ${selected ? styles.optionSelected : ''}`}
              onClick={() => onChange(selected && allowNone ? 'any' : option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function FilterDrawer({ open, filters, zoneCounts, countResults, onApply, onClose }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const [draft, setDraft] = useState(filters);

  // Native <dialog> gives us the backdrop, focus trapping and Escape-to-close for free.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) {
      setDraft(filters);
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, filters]);

  const update = (patch) => setDraft((prev) => ({ ...prev, ...patch }));

  const setMinPrice = (value) => update({ minPrice: Math.min(clampPrice(value), draft.maxPrice - PRICE_STEP) });
  const setMaxPrice = (value) => update({ maxPrice: Math.max(clampPrice(value), draft.minPrice + PRICE_STEP) });

  const toggleZone = (zone) =>
    update({
      zones: draft.zones.includes(zone)
        ? draft.zones.filter((z) => z !== zone)
        : [...draft.zones, zone].sort(),
    });

  const resultCount = countResults(draft);

  return (
    <dialog
      ref={dialogRef}
      className={styles.drawer}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose(); // click on the dimmed backdrop
      }}
    >
      <form
        className={styles.panel}
        onSubmit={(e) => {
          e.preventDefault();
          onApply(draft);
        }}
      >
        <header className={styles.header}>
          <div>
            <h2 id={titleId} className={styles.title}>Filters</h2>
            <p className={styles.subtitle}>Narrow down boarding houses</p>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close filters">
            <CloseIcon />
          </button>
        </header>

        <div className={styles.content}>
          <OptionGroup
            label="Gender"
            options={GENDER_OPTIONS}
            value={draft.gender}
            onChange={(gender) => update({ gender })}
            allowNone
          />

          <fieldset className={styles.section}>
            <legend className={styles.sectionTitle}>Price range (per month)</legend>

            <p className={styles.priceSummary}>
              <span className={styles.priceRange}>
                {formatPrice(draft.minPrice)} – {formatPrice(draft.maxPrice)}
              </span>
              <span className={styles.priceUnit}>/ month</span>
            </p>

            <div
              className={styles.slider}
              style={{ '--from': `${percent(draft.minPrice)}%`, '--to': `${percent(draft.maxPrice)}%` }}
            >
              <span className={styles.sliderTrack} aria-hidden="true" />
              <input
                type="range"
                className={styles.sliderInput}
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={PRICE_STEP}
                value={draft.minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                aria-label="Minimum price"
                aria-valuetext={formatPrice(draft.minPrice)}
              />
              <input
                type="range"
                className={styles.sliderInput}
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={PRICE_STEP}
                value={draft.maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                aria-label="Maximum price"
                aria-valuetext={formatPrice(draft.maxPrice)}
              />
            </div>

            <div className={styles.priceInputs}>
              {[
                { key: 'min', label: 'Min', value: draft.minPrice, set: setMinPrice },
                { key: 'max', label: 'Max', value: draft.maxPrice, set: setMaxPrice },
              ].map(({ key, label, value, set }) => (
                <label key={key} className={styles.priceBox}>
                  <span className={styles.priceBoxLabel}>{label}</span>
                  <span className={styles.priceBoxValue}>
                    ₱
                    <input
                      // Remount on value change so the box always reflects the slider.
                      key={value}
                      type="number"
                      inputMode="numeric"
                      className={styles.priceBoxInput}
                      min={PRICE_MIN}
                      max={PRICE_MAX}
                      step={PRICE_STEP}
                      defaultValue={value}
                      onBlur={(e) => e.target.value && set(Number(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.currentTarget.blur();
                        }
                      }}
                    />
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <OptionGroup
            label="Room type"
            options={ROOM_OPTIONS}
            value={draft.roomType}
            onChange={(roomType) => update({ roomType })}
          />

          <fieldset className={styles.section}>
            <legend className={styles.sectionTitle}>Location</legend>
            {ZONES.map((zone) => {
              const checked = draft.zones.includes(zone);
              return (
                <label key={zone} className={`${styles.zone} ${checked ? styles.zoneChecked : ''}`}>
                  <input
                    type="checkbox"
                    className={styles.zoneInput}
                    checked={checked}
                    onChange={() => toggleZone(zone)}
                  />
                  <span className={styles.zoneBox} aria-hidden="true">
                    {checked && <CheckIcon />}
                  </span>
                  <span className={styles.zoneText}>
                    <span className={styles.zoneName}>ZONE {zone}</span>
                    <span className={styles.zoneCount}>{pluralize(zoneCounts[zone] ?? 0, 'listing')}</span>
                  </span>
                </label>
              );
            })}
          </fieldset>
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.resetButton} onClick={() => setDraft(DEFAULT_FILTERS)}>
            Reset all
          </button>
          <button type="submit" className={styles.applyButton}>
            {resultCount === 0 ? 'No results' : `Show ${pluralize(resultCount, 'result')}`}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
