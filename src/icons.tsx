/**
 * Inline SVG icons. Deliberately not `lucide-react` — the package has zero
 * runtime dependencies, and an icon library is the easiest one to avoid.
 *
 * All of them inherit `currentColor` and size from `--ft-icon-size`, so they
 * restyle with the rest of the tree.
 */
type IconProps = { className?: string };

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.25,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false as const,
};

export const ChevronRightIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export const ChevronDownIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const EyeIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const EyeOffIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M9.9 4.7A10.9 10.9 0 0 1 12 4.5c6.4 0 10 7 10 7a18.5 18.5 0 0 1-3.2 4.2M6.6 6.6A18.6 18.6 0 0 0 2 11.5s3.6 7 10 7a10.7 10.7 0 0 0 4.9-1.1" />
    <path d="M10.4 10.4a2.5 2.5 0 0 0 3.4 3.4" />
    <path d="M3 3l18 18" />
  </svg>
);

export const LockIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="4" y="10.5" width="16" height="10" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </svg>
);

export const UnlockIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="4" y="10.5" width="16" height="10" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 7.6-1.7" />
  </svg>
);

export const TrashIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3.5 6.5h17M9 6.5V4.8A1.3 1.3 0 0 1 10.3 3.5h3.4A1.3 1.3 0 0 1 15 4.8v1.7" />
    <path d="M5.8 6.5l.9 12.3A1.7 1.7 0 0 0 8.4 20.5h7.2a1.7 1.7 0 0 0 1.7-1.7l.9-12.3" />
  </svg>
);

export const GripIcon = (p: IconProps) => (
  <svg {...base} {...p} strokeWidth={2}>
    <circle cx="9" cy="5.5" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="9" cy="18.5" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="15" cy="5.5" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="15" cy="18.5" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

export const SearchIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.6-3.6" />
  </svg>
);

export const CloseIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

/** Default icon for a node with children, when the consumer supplies none. */
export const FolderIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3 7.2a1.7 1.7 0 0 1 1.7-1.7h4l2 2.5h7.6A1.7 1.7 0 0 1 20 9.7v7.6a1.7 1.7 0 0 1-1.7 1.7H4.7A1.7 1.7 0 0 1 3 17.3z" />
  </svg>
);

/** Default icon for a leaf, when the consumer supplies none. */
export const FileIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M13.5 3.5H7a1.7 1.7 0 0 0-1.7 1.7v13.6A1.7 1.7 0 0 0 7 20.5h10a1.7 1.7 0 0 0 1.7-1.7V8.7z" />
    <path d="M13.5 3.5v5.2h5.2" />
  </svg>
);

export type { IconProps };
