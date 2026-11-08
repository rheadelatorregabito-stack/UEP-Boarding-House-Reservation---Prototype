/* Icons — paths exported from Figma frames B3/B4/B5 (icon/home, msg, user, search, filter, chev, pin, star,
   back, key, x, check), redrawn on a shared 24-unit grid with a 2-unit stroke. Colour comes from `currentColor`.
   Shared by BoarderHome, BoarderTopBar and PostDetails. */

const Icon = ({ size = 20, fill = 'none', children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const HomeIcon = ({ size }) => (
  <Icon size={size}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <path d="M9 22V12h6v10" />
  </Icon>
);

export const MessageIcon = ({ size }) => (
  <Icon size={size}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Icon>
);

export const UserIcon = ({ size }) => (
  <Icon size={size}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Icon>
);

export const SearchIcon = ({ size = 22 }) => (
  <Icon size={size}>
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </Icon>
);

export const FilterIcon = ({ size }) => (
  <Icon size={size}>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </Icon>
);

export const ChevronDownIcon = ({ size = 16 }) => (
  <Icon size={size}>
    <path d="M6 9l6 6 6-6" />
  </Icon>
);

export const PinIcon = ({ size = 16 }) => (
  <Icon size={size}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </Icon>
);

export const StarIcon = ({ size = 13, outline = false }) => (
  <Icon size={size} fill={outline ? 'none' : 'currentColor'}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
  </Icon>
);

export const BackIcon = ({ size = 22 }) => (
  <Icon size={size}>
    <path d="M15 18l-6-6 6-6" />
  </Icon>
);

export const KeyIcon = ({ size }) => (
  <Icon size={size}>
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </Icon>
);

export const BellIcon = ({ size }) => (
  <Icon size={size}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Icon>
);

export const SendIcon = ({ size }) => (
  <Icon size={size}>
    <path d="M22 2L15 22l-4-9-9-4z" />
    <path d="M22 2L11 13" />
  </Icon>
);

export const EditIcon = ({ size }) => (
  <Icon size={size}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" />
  </Icon>
);

export const CameraIcon = ({ size }) => (
  <Icon size={size}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </Icon>
);

export const LinkIcon = ({ size }) => (
  <Icon size={size}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </Icon>
);

export const PhoneIcon = ({ size }) => (
  <Icon size={size}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </Icon>
);

export const MailIcon = ({ size }) => (
  <Icon size={size}>
    <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    <path d="M22 7l-10 7L2 7" />
  </Icon>
);

export const LockIcon = ({ size }) => (
  <Icon size={size}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Icon>
);

export const ShieldIcon = ({ size }) => (
  <Icon size={size}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </Icon>
);

export const UploadIcon = ({ size }) => (
  <Icon size={size}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M17 8l-5-5-5 5" />
    <path d="M12 3v12" />
  </Icon>
);

export const MinusIcon = ({ size }) => (
  <Icon size={size}>
    <path d="M5 12h14" />
  </Icon>
);

export const PlusIcon = ({ size }) => (
  <Icon size={size}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const PlusSquareIcon = ({ size }) => (
  <Icon size={size}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M12 8v8M8 12h8" />
  </Icon>
);

export const ClockIcon = ({ size }) => (
  <Icon size={size}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </Icon>
);

export const CloseIcon = ({ size }) => (
  <Icon size={size}>
    <path d="M18 6L6 18M6 6l12 12" />
  </Icon>
);

export const CheckIcon = ({ size = 14 }) => (
  <Icon size={size}>
    <path d="M20 6L9 17l-5-5" />
  </Icon>
);
