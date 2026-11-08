import { useId, useRef, useState } from 'react';
import styles from './PostEditor.module.css';
import { Screen, cx, ui } from '../shared/ui';
import ListingPhoto from '../shared/ListingPhoto';
import {
  CheckIcon, CloseIcon, EditIcon, HomeIcon, MinusIcon, PinIcon, PlusIcon, ShieldIcon, UploadIcon,
} from '../BoarderHome/icons';
import { GENDER_LABELS, ROOM_LABELS } from '../BoarderHome/listings';

const BASE_AMENITIES = ['Free WiFi', 'Own CR', 'Cooking area', 'Aircon', 'Laundry', 'Parking'];
const MAX_PHOTOS = 10;
const DEFAULT_TOTAL_SLOTS = 12;
const DEFAULT_PALETTE = { sky: '#cfe3ff', body: '#ffffff', roof: '#e5383b' };

const GENDER_OPTIONS = [
  { value: 'boys', label: 'Boys only' },
  { value: 'girls', label: 'Girls only' },
  { value: 'mixed', label: 'Both' },
];
const ROOM_OPTIONS = [
  { value: 'studio', label: 'Studio' },
  { value: 'shared', label: 'Not studio' },
];
const ZONE_OPTIONS = [1, 2, 3].map((z) => ({ value: z, label: `ZONE ${z}` }));

const GENDER_TAG = { girls: styles.tagPink, boys: styles.tagBlue, mixed: styles.tagGreen };

const formFrom = (listing) => ({
  name: listing?.name ?? '',
  address: listing?.address ?? (listing?.area ? `${listing.area}, Catarman, Northern Samar` : ''),
  price: listing?.price ? String(listing.price) : '',
  totalSlots: listing?.totalSlots ?? DEFAULT_TOTAL_SLOTS,
  slotsLeft: listing?.slotsLeft ?? DEFAULT_TOTAL_SLOTS,
  gender: listing?.gender ?? 'girls',
  roomType: listing?.roomType ?? 'shared',
  zone: listing?.zone ?? 1,
  description: listing?.description ?? '',
  amenities: listing?.amenities ?? [],
  photos: listing?.photos ?? [],
});

const validate = (f) => {
  const price = Number(f.price.replace(/[^\d]/g, ''));
  return {
    name: f.name.trim() ? '' : 'Enter the boarding house name.',
    address: f.address.trim() ? '' : 'Enter the address.',
    price: !f.price.trim() ? 'Enter the monthly price.' : price < 300 || price > 50000 ? 'Enter a price between ₱300 and ₱50,000.' : '',
    description: f.description.trim().length >= 20 ? '' : 'Describe the place in at least 20 characters.',
  };
};

function Segmented({ label, options, value, onChange }) {
  const labelId = useId();
  return (
    <div className={ui.field}>
      <span id={labelId} className={ui.label}>{label}</span>
      <div className={ui.options} role="radiogroup" aria-labelledby={labelId}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            className={cx(ui.option, value === o.value && ui.optionSelected)}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PostEditor({ session, nav, listing, ownerName, onDiscard, onSave }) {
  const id = useId();
  const fileRef = useRef(null);
  const [form, setForm] = useState(() => formFrom(listing));
  const [errors, setErrors] = useState({});
  const [photoError, setPhotoError] = useState('');
  const isEditing = Boolean(listing);

  const amenityOptions = [...new Set([...BASE_AMENITIES, ...form.amenities])];

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const setText = (key) => (e) => {
    update({ [key]: e.target.value });
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const addPhotos = (e) => {
    const files = [...(e.target.files ?? [])];
    e.target.value = '';
    const room = MAX_PHOTOS - form.photos.length;
    const valid = files.filter((f) => /^image\/(jpeg|png)$/.test(f.type));
    setPhotoError(
      valid.length < files.length ? 'Only JPG and PNG images can be added.'
        : files.length > room ? `You can upload up to ${MAX_PHOTOS} photos.` : '',
    );
    valid.slice(0, room).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setForm((prev) => ({ ...prev, photos: [...prev.photos, reader.result].slice(0, MAX_PHOTOS) }));
      reader.readAsDataURL(file);
    });
  };

  const onDrop = (e) => {
    e.preventDefault();
    addPhotos({ target: { files: e.dataTransfer.files, value: '' } });
  };

  const toggleAmenity = (a) =>
    update({ amenities: form.amenities.includes(a) ? form.amenities.filter((x) => x !== a) : [...form.amenities, a] });

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = validate(form);
    setErrors(next);
    const firstInvalid = Object.keys(next).find((k) => next[k]);
    if (firstInvalid) {
      document.getElementById(`${id}-${firstInvalid}`)?.focus();
      return;
    }
    onSave?.({
      ...(listing ?? {}),
      id: listing?.id ?? `post-${Date.now()}`,
      name: form.name.trim(),
      address: form.address.trim(),
      area: form.address.split(',')[0].trim(),
      price: Number(form.price.replace(/[^\d]/g, '')),
      totalSlots: form.totalSlots,
      slotsLeft: form.slotsLeft,
      gender: form.gender,
      roomType: form.roomType,
      zone: form.zone,
      description: form.description.trim(),
      amenities: form.amenities,
      photos: form.photos,
      owner: listing?.owner ?? ownerName,
      rating: listing?.rating ?? 0,
      reviewCount: listing?.reviewCount ?? 0,
      palette: listing?.palette ?? DEFAULT_PALETTE,
    });
  };

  const previewListing = { photos: form.photos, palette: listing?.palette ?? DEFAULT_PALETTE };
  const slotsLabel = form.slotsLeft <= 0 ? 'Full' : `${form.slotsLeft} slot${form.slotsLeft === 1 ? '' : 's'} left`;
  const slotsTone = form.slotsLeft <= 0 ? ui.chipGray : form.slotsLeft === 1 ? ui.chipRed : ui.chipGreen;

  return (
    <Screen session={session} nav={nav} active="post">
      <div>
        <h1 className={ui.pageTitle}>{isEditing ? 'Edit your boarding house' : 'Post your boarding house'}</h1>
        <p className={styles.subtitle}>Add details, edit slots &amp; price, set zone and room type, and upload photos.</p>
      </div>

      <div className={styles.layout}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <h2 className={styles.sectionTitle}>Photos</h2>
          <button
            type="button"
            className={styles.dropzone}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
          >
            <UploadIcon size={34} />
            <span className={styles.dropTitle}>Click to upload photos or drag them here</span>
            <span className={styles.dropHint}>JPG or PNG · up to {MAX_PHOTOS} photos</span>
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png" multiple hidden onChange={addPhotos} />
          {photoError && <p className={ui.fieldError} role="alert">{photoError}</p>}

          {form.photos.length > 0 && (
            <ul className={styles.uploaded} aria-label="Uploaded photos">
              {form.photos.map((src, i) => (
                <li key={`${i}-${src.slice(-12)}`} className={styles.uploadedItem}>
                  <img src={src} alt={`Upload ${i + 1} of ${form.photos.length}`} className={styles.uploadedImg} />
                  <button
                    type="button"
                    className={styles.removePhoto}
                    onClick={() => update({ photos: form.photos.filter((_, j) => j !== i) })}
                    aria-label={`Remove photo ${i + 1}`}
                  >
                    <CloseIcon size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {[
            { key: 'name', label: 'Boarding house name', icon: HomeIcon, placeholder: "e.g. Sampaguita Girls' Boarding House" },
            { key: 'address', label: 'Address', icon: PinIcon, placeholder: 'Brgy., Catarman, Northern Samar', autoComplete: 'street-address' },
          ].map(({ key, label, icon: FieldIcon, ...rest }) => (
            <div key={key} className={ui.field}>
              <label htmlFor={`${id}-${key}`} className={ui.label}>{label}</label>
              <div className={cx(ui.inputWrap, errors[key] && styles.invalid)}>
                <FieldIcon size={20} />
                <input id={`${id}-${key}`} className={ui.input} value={form[key]} onChange={setText(key)}
                  aria-invalid={Boolean(errors[key])} {...rest} />
              </div>
              {errors[key] && <p className={ui.fieldError}>{errors[key]}</p>}
            </div>
          ))}

          <div className={styles.twoCol}>
            <div className={ui.field}>
              <label htmlFor={`${id}-price`} className={ui.label}>Price per month (₱)</label>
              <div className={cx(ui.inputWrap, errors.price && styles.invalid)}>
                <EditIcon size={20} />
                <span className={styles.peso} aria-hidden="true">₱</span>
                <input id={`${id}-price`} className={ui.input} inputMode="numeric" value={form.price}
                  onChange={setText('price')} placeholder="1,800" aria-invalid={Boolean(errors.price)} />
              </div>
              {errors.price && <p className={ui.fieldError}>{errors.price}</p>}
            </div>

            <div className={ui.field}>
              <span className={ui.label} id={`${id}-slots`}>Available slots (of {form.totalSlots} total)</span>
              <div className={cx(ui.inputWrap, styles.stepper)} role="group" aria-labelledby={`${id}-slots`}>
                <button type="button" className={styles.stepMinus} aria-label="One fewer slot"
                  disabled={form.slotsLeft <= 0} onClick={() => update({ slotsLeft: form.slotsLeft - 1 })}>
                  <MinusIcon size={18} />
                </button>
                <output className={styles.stepValue} aria-live="polite">{form.slotsLeft}</output>
                <button type="button" className={styles.stepPlus} aria-label="One more slot"
                  disabled={form.slotsLeft >= form.totalSlots} onClick={() => update({ slotsLeft: form.slotsLeft + 1 })}>
                  <PlusIcon size={18} />
                </button>
              </div>
            </div>
          </div>

          <Segmented label="Gender allowed" options={GENDER_OPTIONS} value={form.gender} onChange={(gender) => update({ gender })} />
          <Segmented label="Room type" options={ROOM_OPTIONS} value={form.roomType} onChange={(roomType) => update({ roomType })} />
          <Segmented label="Location" options={ZONE_OPTIONS} value={form.zone} onChange={(zone) => update({ zone })} />

          <div className={ui.field}>
            <label htmlFor={`${id}-description`} className={ui.label}>Description</label>
            <div className={cx(ui.inputWrap, ui.textareaWrap, errors.description && styles.invalid)}>
              <textarea id={`${id}-description`} className={ui.textarea} value={form.description}
                onChange={setText('description')} maxLength={800}
                placeholder="Who is it for, what's in each room, how far from UEP…" />
            </div>
            {errors.description && <p className={ui.fieldError}>{errors.description}</p>}
          </div>

          <div className={ui.field}>
            <span className={ui.label}>Amenities</span>
            <div className={ui.toggleChips}>
              {amenityOptions.map((a) => {
                const on = form.amenities.includes(a);
                return (
                  <button key={a} type="button" aria-pressed={on} className={cx(ui.toggleChip, on && ui.toggleChipOn)}
                    onClick={() => toggleAmenity(a)}>
                    {on && <CheckIcon size={13} />} {a}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={cx(ui.btn, ui.btnOutlineDanger)} onClick={onDiscard}>Discard</button>
            <button type="submit" className={cx(ui.btn, ui.btnGreen, styles.save)}>
              <CheckIcon size={20} /> Save Post
            </button>
          </div>
        </form>

        <aside className={styles.preview} aria-label="Live preview">
          <p className={styles.previewLabel}>Live preview</p>
          <div className={styles.previewCard}>
            <ListingPhoto listing={previewListing} className={styles.previewPhoto} rounded={0} />
            <div className={styles.previewBody}>
              <p className={styles.previewName}>{form.name.trim() || 'Your boarding house name'}</p>
              <div className={styles.previewChips}>
                <span className={cx(styles.tag, GENDER_TAG[form.gender])}>{GENDER_LABELS[form.gender]}</span>
                <span className={cx(styles.tag, form.roomType === 'studio' ? styles.tagYellow : styles.tagGray)}>
                  {ROOM_LABELS[form.roomType]}
                </span>
                <span className={cx(ui.chip, slotsTone)}>{slotsLabel}</span>
              </div>
            </div>
          </div>
          <p className={cx(ui.notice, styles.previewNotice)}>
            <ShieldIcon size={20} />
            Your post appears on every user’s Home feed after your credentials are approved.
          </p>
        </aside>
      </div>
    </Screen>
  );
}
