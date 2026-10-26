/**
 * Illustrated "product photography" used in sample sites — pure SVG so the
 * portfolio has no stock imagery and renders crisply at any scale.
 */

export function SerumBottle({ className = "", tint = "#d9b7a3" }: { className?: string; tint?: string }) {
  return (
    <svg viewBox="0 0 120 260" className={className} aria-hidden>
      <defs>
        <linearGradient id={`glass-${tint}`} x1="0" x2="1">
          <stop offset="0" stopColor={tint} stopOpacity="0.95" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.6" stopColor={tint} stopOpacity="0.85" />
          <stop offset="1" stopColor={tint} />
        </linearGradient>
        <linearGradient id="cap" x1="0" x2="1">
          <stop offset="0" stopColor="#2b2321" />
          <stop offset="0.5" stopColor="#5a4a44" />
          <stop offset="1" stopColor="#231c1a" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="252" rx="46" ry="6" fill="#000" opacity="0.12" />
      <rect x="44" y="20" width="32" height="56" rx="14" fill="url(#cap)" />
      <rect x="40" y="70" width="40" height="22" rx="3" fill="#2b2321" />
      <rect x="16" y="90" width="88" height="160" rx="18" fill={`url(#glass-${tint})`} />
      <rect x="30" y="140" width="60" height="52" rx="2" fill="#fff" opacity="0.6" />
      <rect x="40" y="154" width="40" height="3" fill="#3a2e2a" opacity="0.6" />
      <rect x="46" y="164" width="28" height="2" fill="#3a2e2a" opacity="0.35" />
      <rect x="22" y="98" width="8" height="140" rx="4" fill="#fff" opacity="0.35" />
    </svg>
  );
}

export function CreamJar({ className = "", tint = "#efe2d6" }: { className?: string; tint?: string }) {
  return (
    <svg viewBox="0 0 180 130" className={className} aria-hidden>
      <ellipse cx="90" cy="124" rx="80" ry="6" fill="#000" opacity="0.1" />
      <rect x="18" y="16" width="144" height="34" rx="10" fill="#c9a28c" />
      <rect x="18" y="16" width="144" height="10" rx="5" fill="#fff" opacity="0.25" />
      <rect x="10" y="46" width="160" height="78" rx="20" fill={tint} />
      <rect x="18" y="52" width="10" height="64" rx="5" fill="#fff" opacity="0.5" />
      <rect x="60" y="76" width="60" height="3" fill="#3a2e2a" opacity="0.55" />
      <rect x="70" y="86" width="40" height="2" fill="#3a2e2a" opacity="0.3" />
    </svg>
  );
}

export function Tube({ className = "", tint = "#e7d3c4" }: { className?: string; tint?: string }) {
  return (
    <svg viewBox="0 0 80 240" className={className} aria-hidden>
      <ellipse cx="40" cy="234" rx="30" ry="5" fill="#000" opacity="0.1" />
      <path d="M10 14h60l-6 180H16z" fill={tint} />
      <rect x="8" y="8" width="64" height="10" rx="2" fill={tint} />
      <rect x="20" y="194" width="40" height="40" rx="6" fill="#3a2e2a" />
      <rect x="16" y="20" width="6" height="160" fill="#fff" opacity="0.35" />
      <rect x="28" y="90" width="24" height="3" fill="#3a2e2a" opacity="0.5" />
    </svg>
  );
}

export function Plate({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden>
      <defs>
        <radialGradient id="plate" cx="0.45" cy="0.4">
          <stop offset="0" stopColor="#f4efe6" />
          <stop offset="0.7" stopColor="#e3dccf" />
          <stop offset="1" stopColor="#bfb6a6" />
        </radialGradient>
        <radialGradient id="sauce" cx="0.5" cy="0.5">
          <stop offset="0" stopColor="#7a2e1d" />
          <stop offset="1" stopColor="#4a1a10" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="210" r="190" fill="#000" opacity="0.35" />
      <circle cx="200" cy="200" r="185" fill="url(#plate)" />
      <circle cx="200" cy="200" r="130" fill="#efe9de" />
      <circle cx="200" cy="200" r="130" fill="none" stroke="#d8d0c2" strokeWidth="2" />
      <path d="M130 215c20-40 110-55 150-10 10 12-20 40-70 40s-90-10-80-30z" fill="url(#sauce)" />
      <ellipse cx="205" cy="198" rx="58" ry="38" fill="#c98a5a" />
      <ellipse cx="205" cy="192" rx="52" ry="30" fill="#dba273" />
      <path d="M170 186c20-8 50-8 70 0" stroke="#a5683e" strokeWidth="3" fill="none" />
      <path d="M176 198c18-6 44-6 60 0" stroke="#a5683e" strokeWidth="3" fill="none" />
      <g fill="#5f7a3d">
        <ellipse cx="248" cy="160" rx="16" ry="6" transform="rotate(-30 248 160)" />
        <ellipse cx="262" cy="172" rx="12" ry="5" transform="rotate(20 262 172)" />
        <ellipse cx="160" cy="234" rx="12" ry="4" transform="rotate(-12 160 234)" />
      </g>
      <g fill="#f2e6c9">
        <circle cx="150" cy="170" r="4" /><circle cx="270" cy="236" r="3" /><circle cx="250" cy="250" r="2.5" />
      </g>
    </svg>
  );
}

export function Glass({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 220" className={className} aria-hidden>
      <path d="M18 10h64c0 50-12 80-32 86-20-6-32-36-32-86z" fill="#ffffff" opacity="0.08" stroke="#e8dfcf" strokeOpacity="0.4" />
      <path d="M22 42h56c-3 30-14 48-28 52-14-4-25-22-28-52z" fill="#6b1a24" opacity="0.9" />
      <rect x="48" y="96" width="4" height="96" fill="#e8dfcf" opacity="0.4" />
      <ellipse cx="50" cy="196" rx="28" ry="5" fill="#e8dfcf" opacity="0.35" />
    </svg>
  );
}

/** Architectural interior: arched window, light fall and a lounge chair. */
export function ArchRoom({
  className = "",
  wall = "#d9d0c3",
  floor = "#b8a993",
  accent = "#b4693f",
  variant = 0,
}: {
  className?: string;
  wall?: string;
  floor?: string;
  accent?: string;
  variant?: number;
}) {
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <rect width="400" height="500" fill={wall} />
      <rect y="360" width="400" height="140" fill={floor} />
      {variant !== 2 && (
        <>
          <path d="M120 360V170a80 80 0 01160 0v190z" fill="#f3eee6" />
          <path d="M120 360V170a80 80 0 01160 0v190z" fill="none" stroke="#000" strokeOpacity="0.06" strokeWidth="6" />
          <path d="M150 360l40-190 70 0-30 190z" fill="#fff" opacity="0.35" />
          <path d="M140 500l60-140h120l40 140z" fill="#fff" opacity="0.18" />
        </>
      )}
      {variant === 2 && (
        <>
          <rect x="60" y="120" width="120" height="160" fill="#efe8dc" />
          <rect x="220" y="120" width="120" height="160" fill="#efe8dc" />
          <rect x="60" y="300" width="280" height="20" fill="#8f7f6a" />
          <circle cx="300" cy="260" r="26" fill={accent} opacity="0.85" />
          <rect x="296" y="286" width="8" height="14" fill="#5a4a3a" />
        </>
      )}
      {variant === 0 && (
        <g>
          <path d="M40 400c0-40 20-58 60-58h30c22 0 30 20 30 40v38H40z" fill={accent} />
          <rect x="44" y="420" width="6" height="40" fill="#3a2e22" />
          <rect x="150" y="420" width="6" height="40" fill="#3a2e22" />
          <ellipse cx="320" cy="440" rx="40" ry="10" fill="#000" opacity="0.1" />
          <path d="M300 440c-4-40 4-80 20-90 16 10 24 50 20 90z" fill="#6f7a5c" />
          <rect x="304" y="430" width="32" height="30" rx="4" fill="#e9e1d4" />
        </g>
      )}
      {variant === 1 && (
        <g>
          <rect x="230" y="380" width="140" height="16" rx="4" fill="#3a2e22" />
          <rect x="240" y="396" width="6" height="60" fill="#3a2e22" />
          <rect x="354" y="396" width="6" height="60" fill="#3a2e22" />
          <ellipse cx="300" cy="372" rx="18" ry="8" fill={accent} />
          <path d="M60 470V390a40 40 0 0180 0v80z" fill="#e9e1d4" />
        </g>
      )}
    </svg>
  );
}

/** Soft organic forms for wellness imagery. */
export function Ripples({ className = "", tone = "#6e7b63" }: { className?: string; tone?: string }) {
  return (
    <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <radialGradient id={`sun-${tone}`} cx="0.5" cy="0.45">
          <stop offset="0" stopColor="#f6efe1" />
          <stop offset="1" stopColor="#dfe3d6" />
        </radialGradient>
      </defs>
      <rect width="400" height="400" fill={`url(#sun-${tone})`} />
      {[150, 120, 90, 60, 32].map((r, i) => (
        <circle key={r} cx="200" cy="230" r={r} fill="none" stroke={tone} strokeOpacity={0.12 + i * 0.06} />
      ))}
      <ellipse cx="200" cy="300" rx="120" ry="18" fill={tone} opacity="0.12" />
      <ellipse cx="170" cy="280" rx="34" ry="22" fill="#b9b2a2" />
      <ellipse cx="226" cy="284" rx="26" ry="18" fill="#cfc8b8" />
      <ellipse cx="200" cy="258" rx="20" ry="14" fill="#a39b89" />
      <path d="M200 244c-4-30 10-60 34-74-4 30-14 56-34 74z" fill={tone} />
      <path d="M200 244c-10-24-30-40-56-44 12 24 30 40 56 44z" fill={tone} opacity="0.7" />
    </svg>
  );
}

/** Clean architectural elevation for a professional firm. */
export function Facade({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dfe5df" />
          <stop offset="1" stopColor="#f3f1ea" />
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill="url(#sky)" />
      <rect x="70" y="80" width="260" height="420" fill="#e8e4da" />
      <rect x="70" y="80" width="260" height="14" fill="#cfc9bb" />
      {Array.from({ length: 6 }).map((_, row) =>
        Array.from({ length: 4 }).map((_, col) => (
          <rect
            key={`${row}-${col}`}
            x={92 + col * 58}
            y={112 + row * 58}
            width="38"
            height="42"
            fill={(row + col) % 3 === 0 ? "#2f4a3f" : "#3d5a4e"}
            opacity={(row * 4 + col) % 5 === 0 ? 0.55 : 0.85}
          />
        )),
      )}
      <rect x="170" y="440" width="60" height="60" fill="#14211c" />
      <rect x="0" y="490" width="400" height="10" fill="#cfc9bb" />
      <rect x="20" y="300" width="40" height="200" fill="#c9c3b4" opacity="0.6" />
      <rect x="340" y="260" width="50" height="240" fill="#c9c3b4" opacity="0.5" />
    </svg>
  );
}
