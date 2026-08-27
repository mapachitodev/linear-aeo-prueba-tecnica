interface SearchBrandMarkProps {
  className?: string;
}

// SearchBrand's "SB" mark, recreated as SVG (gradient rounded square, per the
// reference image) so it scales cleanly instead of shipping a raster asset.
export function SearchBrandMark({ className }: SearchBrandMarkProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="SearchBrand">
      <defs>
        <linearGradient id="sb-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4338ca" />
          <stop offset="55%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#2dd4bf" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22" fill="url(#sb-gradient)" />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        fontSize="38"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
      >
        SB
      </text>
    </svg>
  );
}
