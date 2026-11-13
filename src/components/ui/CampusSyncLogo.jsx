import React from 'react';

/**
 * CampusSync — Official Infinity Learning Identity Logo (Option 2)
 *
 * Symbol: Continuous Infinity Ribbon (Teal to Lavender) + Floating 3D Graduation Cap.
 * Wordmark: "Campus" (Navy/White) + "Sync" (Turquoise Gradient)
 * Tagline: "CONNECT • LEARN • GROW"
 *
 * Variants:
 *  - 'horizontal' : Full brand logo with symbol, hairline divider, wordmark, and tagline
 *  - 'compact'    : Streamlined single-line layout (Symbol + CampusSync) ideal for Navbars & Headers
 *  - 'icon'       : Symbol mark only (Infinity + Graduation Cap)
 *  - 'stacked'    : Centered symbol above wordmark and tagline (Modals & Hero displays)
 */
export default function CampusSyncLogo({
  variant = 'horizontal',
  theme = 'dark',
  size = 'md',
  showTagline = true,
  showDivider = true,
  className = '',
  ariaLabel = 'CampusSync Logo',
  onClick,
}) {
  // Sizing map for convenient responsive usage
  const heightMap = {
    xs: variant === 'icon' ? 24 : 28,
    sm: variant === 'icon' ? 32 : 36,
    md: variant === 'icon' ? 44 : 48,
    lg: variant === 'icon' ? 56 : 60,
    xl: variant === 'icon' ? 72 : 76,
  };

  const currentHeight = typeof size === 'number' ? size : (heightMap[size] || 48);

  const isLight = theme === 'light';
  const campusTextColor = isLight ? '#04132a' : '#FFFFFF';
  const maskBg = isLight ? '#ffffff' : '#04132a';
  const taglineColor = isLight ? '#475569' : '#bac3ff';
  const bulletColor = isLight ? '#0d9488' : '#71d8c8';

  // Common Gradients Definition
  const Gradients = () => (
    <defs>
      <linearGradient id="csInfinityGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#00f2fe" />
        <stop offset="25%" stopColor="#00c9cc" />
        <stop offset="50%" stopColor="#4facfe" />
        <stop offset="75%" stopColor="#818cf8" />
        <stop offset="100%" stopColor="#c4b5fd" />
      </linearGradient>

      <linearGradient id="csCapFacetLeft" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#67e8f9" />
        <stop offset="50%" stopColor="#a5f3fc" />
        <stop offset="100%" stopColor="#c4b5fd" />
      </linearGradient>

      <linearGradient id="csCapFacetRight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c4b5fd" />
        <stop offset="50%" stopColor="#a5b4fc" />
        <stop offset="100%" stopColor="#818cf8" />
      </linearGradient>

      <linearGradient id="csCapSkull" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#1e1b4b" />
      </linearGradient>

      <linearGradient id="csSyncText" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={isLight ? '#00a89d' : '#00f0d4'} />
        <stop offset="100%" stopColor={isLight ? '#0d9488' : '#71d8c8'} />
      </linearGradient>

      <linearGradient id="csDivider" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={isLight ? '#04132a' : '#00f0d4'} stopOpacity="0.05" />
        <stop offset="50%" stopColor={isLight ? '#04132a' : '#71d8c8'} stopOpacity={isLight ? 0.25 : 0.55} />
        <stop offset="100%" stopColor={isLight ? '#04132a' : '#bac3ff'} stopOpacity="0.05" />
      </linearGradient>
    </defs>
  );

  // Symbol Graphic (Option 2: Continuous Infinity Ribbon + Graduation Cap)
  const SymbolMark = () => (
    <g>
      {/* Base Infinity Ribbon (44px loop height, smooth cubic curves) */}
      <path
        d="M 52,50 C 60,39 70,32 80,32 C 91,32 98,40 98,50 C 98,60 91,68 80,68 C 70,68 60,61 52,50 C 44,39 34,32 24,32 C 13,32 6,40 6,50 C 6,60 13,68 24,68 C 34,68 44,61 52,50 Z"
        fill="none"
        stroke="url(#csInfinityGrad)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 3D Overlap Mask at Center Cross */}
      <path
        d="M 40,62 C 45,57 49,53 52,50 C 55,47 59,43 64,38"
        fill="none"
        stroke={maskBg}
        strokeWidth="15"
        strokeLinecap="round"
      />

      {/* Foreground Crossing Ribbon Loop */}
      <path
        d="M 39,63 C 44,58 48,54 52,50 C 56,46 60,42 65,37"
        fill="none"
        stroke="url(#csInfinityGrad)"
        strokeWidth="12"
        strokeLinecap="round"
      />

      {/* Graduation Cap Skull */}
      <path d="M 38,24 C 38,32 44,37 52,37 C 60,37 66,32 66,24 Z" fill="url(#csCapSkull)" />
      <path
        d="M 38,24 C 38,32 44,37 52,37 C 60,37 66,32 66,24 Z"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="0.8"
      />

      {/* Graduation Cap Diamond Rhombus (Mortarboard Top) */}
      <path d="M 52,7 L 18,20 L 52,33 Z" fill="url(#csCapFacetLeft)" />
      <path d="M 52,7 L 86,20 L 52,33 Z" fill="url(#csCapFacetRight)" />

      {/* 3D Mortarboard Bevel Rim */}
      <path
        d="M 18,20 L 52,33 L 86,20 L 86,22.2 L 52,35.2 L 18,22.2 Z"
        fill="#4338ca"
        opacity="0.75"
      />

      {/* Top Center Apex Knot */}
      <ellipse cx="52" cy="19.5" rx="2" ry="1.6" fill="#f8fafc" />

      {/* Tassel String */}
      <path
        d="M 52,19.5 C 64,19.5 73,21.5 75,25 L 76.5,35"
        fill="none"
        stroke="#f1f5f9"
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      {/* Tassel Knot & Fringe */}
      <circle cx="76.5" cy="35.5" r="1.4" fill="#e6c277" />
      <path d="M 75,36.5 L 78,36.5 L 77.5,43 L 75.5,43 Z" fill="#e6c277" />
    </g>
  );

  // 1. ICON ONLY
  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 104 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ height: currentHeight, width: 'auto' }}
        className={`inline-block select-none ${className}`}
        role="img"
        aria-label={ariaLabel}
        onClick={onClick}
      >
        <Gradients />
        <SymbolMark />
      </svg>
    );
  }

  // 2. COMPACT (Single Line: Icon + CampusSync, ideal for Navbars & Mobile headers)
  if (variant === 'compact') {
    return (
      <svg
        viewBox="0 0 240 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ height: currentHeight, width: 'auto' }}
        className={`inline-block select-none ${className}`}
        role="img"
        aria-label={ariaLabel}
        onClick={onClick}
      >
        <Gradients />
        <g transform="translate(2, 4) scale(0.6)">
          <SymbolMark />
        </g>
        <g transform="translate(74, 0)">
          <text
            x="0"
            y="37"
            fontFamily="'Plus Jakarta Sans', 'Manrope', system-ui, -apple-system, sans-serif"
            fontSize="26"
            fontWeight="700"
            letterSpacing="-0.025em"
          >
            <tspan fill={campusTextColor}>Campus</tspan>
            <tspan fill="url(#csSyncText)">Sync</tspan>
          </text>
        </g>
      </svg>
    );
  }

  // 3. STACKED (Centered Icon above Text, ideal for Modal headers & Hero)
  if (variant === 'stacked') {
    return (
      <svg
        viewBox="0 0 220 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ height: currentHeight, width: 'auto' }}
        className={`inline-block select-none ${className}`}
        role="img"
        aria-label={ariaLabel}
        onClick={onClick}
      >
        <Gradients />
        <g transform="translate(58, 4) scale(0.95)">
          <SymbolMark />
        </g>
        <g transform="translate(110, 0)">
          <text
            x="0"
            y="108"
            textAnchor="middle"
            fontFamily="'Plus Jakarta Sans', 'Manrope', system-ui, -apple-system, sans-serif"
            fontSize="27"
            fontWeight="700"
            letterSpacing="-0.025em"
          >
            <tspan fill={campusTextColor}>Campus</tspan>
            <tspan fill="url(#csSyncText)">Sync</tspan>
          </text>
          {showTagline && (
            <text
              x="0"
              y="126"
              textAnchor="middle"
              fontFamily="'Plus Jakarta Sans', 'Manrope', system-ui, -apple-system, sans-serif"
              fontSize="11"
              fontWeight="500"
              letterSpacing="0.1em"
              fill={taglineColor}
              opacity="0.92"
            >
              Connect <tspan fill={bulletColor} fontSize="9" dy="-1">•</tspan><tspan dy="1"> </tspan>Learn <tspan fill={bulletColor} fontSize="9" dy="-1">•</tspan><tspan dy="1"> </tspan>Grow
            </text>
          )}
        </g>
      </svg>
    );
  }

  // 4. HORIZONTAL (Primary Full Logo with Divider & Tagline)
  return (
    <svg
      viewBox="0 0 360 84"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ height: currentHeight, width: 'auto' }}
      className={`inline-block select-none ${className}`}
      role="img"
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <Gradients />
      <g transform="translate(10, 5)">
        <SymbolMark />
      </g>
      {showDivider && (
        <line x1="120" y1="18" x2="120" y2="70" stroke="url(#csDivider)" strokeWidth="1.5" />
      )}
      <g transform="translate(136, 0)">
        <text
          x="0"
          y="46"
          fontFamily="'Plus Jakarta Sans', 'Manrope', system-ui, -apple-system, sans-serif"
          fontSize="30"
          fontWeight="700"
          letterSpacing="-0.025em"
        >
          <tspan fill={campusTextColor}>Campus</tspan>
          <tspan fill="url(#csSyncText)">Sync</tspan>
        </text>
        {showTagline && (
          <text
            x="1"
            y="66"
            fontFamily="'Plus Jakarta Sans', 'Manrope', system-ui, -apple-system, sans-serif"
            fontSize="12"
            fontWeight="500"
            letterSpacing="0.1em"
            fill={taglineColor}
            opacity="0.92"
          >
            Connect <tspan fill={bulletColor} fontSize="9" dy="-1">•</tspan><tspan dy="1"> </tspan>Learn <tspan fill={bulletColor} fontSize="9" dy="-1">•</tspan><tspan dy="1"> </tspan>Grow
          </text>
        )}
      </g>
    </svg>
  );
}
