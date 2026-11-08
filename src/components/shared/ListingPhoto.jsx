import styles from './ListingPhoto.module.css';

/* House illustration tinted with the listing's palette; shows listing.photos[0] instead when a real photo exists. */
export default function ListingPhoto({ listing, className = '', rounded = 14 }) {
  const style = { borderRadius: rounded };

  if (listing.photos?.length) {
    return <img className={`${styles.photo} ${styles.img} ${className}`} style={style} src={listing.photos[0]} alt="" />;
  }

  const palette = listing.palette ?? { sky: '#cfe3ff', body: '#ffffff', roof: '#e5383b' };
  return (
    <div
      className={`${styles.photo} ${className}`}
      style={{ ...style, '--sky': palette.sky, '--body': palette.body, '--roof': palette.roof }}
      aria-hidden="true"
    >
      <span className={styles.ground} />
      <span className={styles.sun} />
      <span className={styles.houseBody}>
        <span className={styles.door} />
        <span className={`${styles.window} ${styles.windowLeft}`} />
        <span className={`${styles.window} ${styles.windowRight}`} />
      </span>
      <span className={styles.roof} />
    </div>
  );
}
