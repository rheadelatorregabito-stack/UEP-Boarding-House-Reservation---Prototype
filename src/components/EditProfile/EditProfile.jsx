import { useId, useRef, useState } from 'react';
import styles from './EditProfile.module.css';
import { Avatar, PageHeader, Screen, cx, ui } from '../shared/ui';
import { CameraIcon, CheckIcon, LinkIcon, MailIcon, PhoneIcon, PinIcon, UserIcon } from '../BoarderHome/icons';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^(\+?63|0)9\d{9}$/;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const validate = (form) => ({
  name: form.name.trim() ? '' : 'Enter your full name.',
  email: !form.email.trim() ? 'Enter your email.' : EMAIL_PATTERN.test(form.email.trim()) ? '' : 'Enter a valid email address.',
  phone: !form.phone.trim() || PHONE_PATTERN.test(form.phone.replace(/[\s()-]/g, '')) ? '' : 'Use a PH mobile number, like +63 917 123 4567.',
});

function Field({ id, label, icon: FieldIcon, error, multiline, className, ...inputProps }) {
  return (
    <div className={cx(ui.field, className)}>
      <label htmlFor={id} className={ui.label}>{label}</label>
      <div className={cx(ui.inputWrap, multiline && ui.textareaWrap, error && styles.invalid)}>
        {FieldIcon && <FieldIcon size={20} />}
        {multiline
          ? <textarea id={id} className={ui.textarea} {...inputProps} />
          : <input id={id} className={ui.input} aria-invalid={Boolean(error)} {...inputProps} />}
      </div>
      {error && <p className={ui.fieldError}>{error}</p>}
    </div>
  );
}

/* ---------- B14 · Boarder Edit Profile (22:480) / D16 · Owner Edit Profile (22:234) ---------- */

export default function EditProfile({ session, nav, profile, onCancel, onSave }) {
  const id = useId();
  const isOwner = session?.role === 'owner';
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    name: '', bio: '', email: '', phone: '', school: '', address: '',
    facebook: '', instagram: '', messenger: '', photo: null,
    ...profile,
  });
  const [errors, setErrors] = useState({});
  const [photoError, setPhotoError] = useState('');

  const set = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const pickPhoto = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\/(jpeg|png)$/.test(file.type)) return setPhotoError('Choose a JPG or PNG image.');
    if (file.size > MAX_PHOTO_BYTES) return setPhotoError('That image is over 5 MB.');
    setPhotoError('');
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, photo: reader.result }));
    reader.readAsDataURL(file);
    return undefined;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = validate(form);
    setErrors(next);
    const firstInvalid = Object.keys(next).find((k) => next[k]);
    if (firstInvalid) {
      document.getElementById(`${id}-${firstInvalid}`)?.focus();
      return;
    }
    onSave?.({ ...form, name: form.name.trim(), email: form.email.trim() });
  };

  return (
    <Screen session={session} nav={nav} active="profile" mainClassName={styles.page}>
      <div className={styles.column}>
        <PageHeader
          title="Edit profile"
          subtitle="Update your name, picture, bio and social links."
          onBack={onCancel}
          backLabel="Back to profile"
        />

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.photoRow}>
            <Avatar
              name={form.name || '?'}
              src={form.photo}
              size={96}
              color={isOwner ? '#ffc72c' : '#e5383b'}
              textColor={isOwner ? '#0a0a0a' : undefined}
            />
            <div className={styles.photoText}>
              <p className={styles.photoTitle}>Profile picture</p>
              <p className={styles.photoHint}>JPG or PNG, up to 5 MB</p>
              <div className={styles.photoActions}>
                <button type="button" className={cx(ui.btn, ui.btnSmall, ui.btnSoft)} onClick={() => fileRef.current?.click()}>
                  <CameraIcon size={20} /> Upload new photo
                </button>
                {form.photo && (
                  <button
                    type="button"
                    className={cx(ui.btn, ui.btnSmall, ui.btnOutlineDanger)}
                    onClick={() => setForm((prev) => ({ ...prev, photo: null }))}
                  >
                    Remove
                  </button>
                )}
              </div>
              {photoError && <p className={ui.fieldError} role="alert">{photoError}</p>}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png" hidden onChange={pickPhoto} />
            </div>
          </div>

          <Field id={`${id}-name`} label="Full name" icon={UserIcon} error={errors.name}
            value={form.name} onChange={set('name')} autoComplete="name" />

          <Field id={`${id}-bio`} label="Bio" multiline value={form.bio} onChange={set('bio')} maxLength={400}
            placeholder={isOwner ? 'Tell boarders about you and your boarding house.' : 'Tell owners a bit about yourself.'} />

          <div className={styles.twoCol}>
            <Field id={`${id}-email`} label="Email" icon={MailIcon} error={errors.email} type="email"
              value={form.email} onChange={set('email')} autoComplete="email" />
            <Field id={`${id}-phone`} label="Contact number" icon={PhoneIcon} error={errors.phone} type="tel"
              value={form.phone} onChange={set('phone')} autoComplete="tel" placeholder="+63 917 123 4567" />
          </div>

          {isOwner ? (
            <Field id={`${id}-address`} label="Address" icon={PinIcon} value={form.address} onChange={set('address')}
              autoComplete="street-address" />
          ) : (
            <Field id={`${id}-school`} label="School" icon={PinIcon} value={form.school} onChange={set('school')} />
          )}

          <h2 className={styles.sectionTitle}>Social links</h2>
          <Field id={`${id}-facebook`} label="Facebook" icon={LinkIcon} value={form.facebook} onChange={set('facebook')}
            placeholder="facebook.com/your.name" />
          <Field id={`${id}-instagram`} label="Instagram" icon={LinkIcon} value={form.instagram} onChange={set('instagram')}
            placeholder="instagram.com/your.handle" />
          <Field id={`${id}-messenger`} label="Messenger" icon={LinkIcon} value={form.messenger} onChange={set('messenger')}
            placeholder="m.me/your.name" />

          <div className={styles.actions}>
            <button type="button" className={cx(ui.btn, ui.btnOutlineMuted)} onClick={onCancel}>Cancel</button>
            <button type="submit" className={cx(ui.btn, ui.btnGreen, styles.save)}>
              <CheckIcon size={20} /> Save changes
            </button>
          </div>
        </form>
      </div>
    </Screen>
  );
}
