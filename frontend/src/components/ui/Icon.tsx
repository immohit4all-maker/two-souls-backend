/**
 * Inline SVG icon set.
 *
 * Replaces the emoji the old UI leaned on (🛍️ ⚡ 🏪 📦 🔍 …), which rendered differently on
 * every platform and could not inherit colour or stroke weight. These are a single 24px grid
 * with a 1.75 stroke, drawn with `currentColor` so they take the surrounding text colour.
 */
export type IconName =
  | 'alert'
  | 'archive'
  | 'arrow-down-right'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up-right'
  | 'bag'
  | 'check'
  | 'check-circle'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'close'
  | 'dashboard'
  | 'edit'
  | 'external'
  | 'eye'
  | 'filter'
  | 'heart'
  | 'image'
  | 'info'
  | 'lock'
  | 'logout'
  | 'mail'
  | 'menu'
  | 'minus'
  | 'package'
  | 'phone'
  | 'pin'
  | 'plus'
  | 'receipt'
  | 'refresh'
  | 'search'
  | 'sort'
  | 'sparkle'
  | 'star'
  | 'store'
  | 'trash'
  | 'trending-down'
  | 'trending-up'
  | 'truck'
  | 'user';

const PATHS: Record<IconName, string> = {
  alert: 'M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  archive: 'M3 8h18M5 8V5h14v3M5 8v11h14V8M10 12h4',
  'arrow-down-right': 'M7 7l10 10M17 9v8H9',
  'arrow-left': 'M19 12H5m0 0 6-6m-6 6 6 6',
  'arrow-right': 'M5 12h14m0 0-6-6m6 6-6 6',
  'arrow-up-right': 'M7 17 17 7M9 7h8v8',
  bag: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6ZM3 6h18M16 10a4 4 0 0 1-8 0',
  check: 'm20 6-11 11-5-5',
  'check-circle': 'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14.01l-3-3',
  'chevron-down': 'm6 9 6 6 6-6',
  'chevron-left': 'm15 18-6-6 6-6',
  'chevron-right': 'm9 18 6-6-6-6',
  'chevron-up': 'm18 15-6-6-6 6',
  close: 'M18 6 6 18M6 6l12 12',
  dashboard: 'M3 3h8v8H3zM13 3h8v5h-8zM13 12h8v9h-8zM3 15h8v6H3z',
  edit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z',
  external: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  filter: 'M22 3H2l8 9.5V19l4 2v-8.5L22 3Z',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8Z',
  image: 'M3 3h18v18H3zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM21 15l-5-5L5 21',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 16v-4M12 8h.01',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 1 1 8 0v4',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  mail: 'M2 6h20v12H2zM2 7l10 7 10-7',
  menu: 'M3 12h18M3 6h18M3 18h18',
  minus: 'M5 12h14',
  package: 'm7.5 4.3 9 5.2M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16ZM3.3 7 12 12l8.7-5M12 22V12',
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z',
  pin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Zm-9 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  plus: 'M12 5v14M5 12h14',
  receipt: 'M5 2v20l2.5-2 2.5 2 2-2 2 2 2.5-2 2.5 2V2l-2.5 2L14 2l-2 2-2-2-2.5 2L5 2ZM9 8h6M9 12h6M9 16h4',
  refresh: 'M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3',
  sort: 'M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3',
  sparkle: 'M12 2.5 14.2 9l6.5 2.2-6.5 2.3L12 20l-2.2-6.5L3.3 11.2 9.8 9 12 2.5ZM19 3v3M20.5 4.5h-3',
  star: 'm12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5-5.9-3.1-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9 2.9-6Z',
  store: 'M3 9V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3M3 9h18M3 9l1 2a3 3 0 0 0 5.3.6A3 3 0 0 0 12 13a3 3 0 0 0 2.7-1.4A3 3 0 0 0 20 11l1-2M5 13v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7',
  trash: 'M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6M10 11v6M14 11v6',
  'trending-down': 'm22 17-8.5-8.5-5 5L2 7M16 17h6v-6',
  'trending-up': 'm22 7-8.5 8.5-5-5L2 17M16 7h6v6',
  truck: 'M1 3h15v13H1zM16 8h4l3 3v5h-7V8ZM5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
};

/** Icons that read better filled than stroked when marked active. */
const FILLABLE: ReadonlySet<IconName> = new Set<IconName>(['heart', 'star', 'sparkle']);

export interface IconProps {
  name: IconName;
  size?: number;
  /** Render solid instead of outline. Only meaningful for heart / star / sparkle. */
  filled?: boolean;
  className?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 20, filled = false, className, strokeWidth = 1.75 }: IconProps) {
  const solid = filled && FILLABLE.has(name);
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={solid ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
