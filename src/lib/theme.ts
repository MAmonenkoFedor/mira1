type ThemePalette = {
  background: string;
  card: string;
  foreground: string;
  primary: string;
  accent: string;
  secondary: string;
  muted: string;
  mutedForeground: string;
  border: string;
  saleRed: string;
  heroBackground: string;
  heroGradientStart: string;
  heroGradientEnd: string;
  heroText: string;
  heroDecor: string;
};

type ThemeSettings = {
  enabled: boolean;
  preset?: string | null;
  palette: ThemePalette;
};

const normalizeHex = (value: string) => {
  const v = (value || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toUpperCase();
  if (/^[0-9a-fA-F]{6}$/.test(v)) return `#${v.toUpperCase()}`;
  return "#000000";
};

const hexToRgb = (hex: string) => {
  const v = normalizeHex(hex).slice(1);
  const r = Number.parseInt(v.slice(0, 2), 16);
  const g = Number.parseInt(v.slice(2, 4), 16);
  const b = Number.parseInt(v.slice(4, 6), 16);
  return { r, g, b };
};

const rgbToHsl = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  return {
    h,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

const hexToHslTriplet = (hex: string) => {
  const { h, s, l } = rgbToHsl(hexToRgb(hex));
  return `${h} ${s}% ${l}%`;
};

const srgbToLinear = (v: number) => {
  const x = v / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
};

const relativeLuminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const rl = srgbToLinear(r);
  const gl = srgbToLinear(g);
  const bl = srgbToLinear(b);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
};

const pickForeground = (bgHex: string) => (relativeLuminance(bgHex) > 0.6 ? "#111827" : "#FFFFFF");

const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

const mixHex = (a: string, b: string, t: number) => {
  const ar = hexToRgb(a);
  const br = hexToRgb(b);
  const r = lerp(ar.r, br.r, t);
  const g = lerp(ar.g, br.g, t);
  const b2 = lerp(ar.b, br.b, t);
  return `#${[r, g, b2].map((n) => n.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
};

export const buildCssVarsFromPalette = (palette: ThemePalette) => {
  const background = normalizeHex(palette.background);
  const card = normalizeHex(palette.card);
  const foreground = normalizeHex(palette.foreground);
  const primary = normalizeHex(palette.primary);
  const accent = normalizeHex(palette.accent);
  const secondary = normalizeHex(palette.secondary);
  const muted = normalizeHex(palette.muted);
  const mutedForeground = normalizeHex(palette.mutedForeground);
  const border = normalizeHex(palette.border);
  const saleRed = normalizeHex(palette.saleRed);
  const heroBackground = normalizeHex(palette.heroBackground);
  const heroGradientStart = normalizeHex(palette.heroGradientStart);
  const heroGradientEnd = normalizeHex(palette.heroGradientEnd);
  const heroText = normalizeHex(palette.heroText);
  const heroDecor = normalizeHex(palette.heroDecor);

  const primaryForeground = pickForeground(primary);
  const accentForeground = pickForeground(accent);
  const destructiveForeground = pickForeground(saleRed);

  const deepBlue = primary;
  const deepBlueLight = mixHex(primary, "#FFFFFF", 0.12);
  const gold = accent;
  const goldLight = mixHex(accent, "#FFFFFF", 0.15);
  const saleRedDark = mixHex(saleRed, "#000000", 0.12);
  const trustGreen = "#22C55E";

  const cssVars: Record<string, string> = {
    "--background": hexToHslTriplet(background),
    "--foreground": hexToHslTriplet(foreground),
    "--card": hexToHslTriplet(card),
    "--card-foreground": hexToHslTriplet(foreground),
    "--popover": hexToHslTriplet(card),
    "--popover-foreground": hexToHslTriplet(foreground),
    "--primary": hexToHslTriplet(primary),
    "--primary-foreground": hexToHslTriplet(primaryForeground),
    "--secondary": hexToHslTriplet(secondary),
    "--secondary-foreground": hexToHslTriplet(foreground),
    "--muted": hexToHslTriplet(muted),
    "--muted-foreground": hexToHslTriplet(mutedForeground),
    "--accent": hexToHslTriplet(accent),
    "--accent-foreground": hexToHslTriplet(accentForeground),
    "--destructive": hexToHslTriplet(saleRed),
    "--destructive-foreground": hexToHslTriplet(destructiveForeground),
    "--border": hexToHslTriplet(border),
    "--input": hexToHslTriplet(border),
    "--ring": hexToHslTriplet(primary),
    "--gold": hexToHslTriplet(gold),
    "--gold-light": hexToHslTriplet(goldLight),
    "--deep-blue": hexToHslTriplet(deepBlue),
    "--deep-blue-light": hexToHslTriplet(deepBlueLight),
    "--sale-red": hexToHslTriplet(saleRed),
    "--sale-red-dark": hexToHslTriplet(saleRedDark),
    "--trust-green": hexToHslTriplet(trustGreen),
    "--hero-background": hexToHslTriplet(heroBackground),
    "--hero-gradient-start": hexToHslTriplet(heroGradientStart),
    "--hero-gradient-end": hexToHslTriplet(heroGradientEnd),
    "--hero-text": hexToHslTriplet(heroText),
    "--hero-decor": hexToHslTriplet(heroDecor),
    "--gradient-gold": `linear-gradient(135deg, hsl(${hexToHslTriplet(gold)}), hsl(${hexToHslTriplet(goldLight)}))`,
    "--gradient-blue": `linear-gradient(135deg, hsl(${hexToHslTriplet(heroGradientStart)}), hsl(${hexToHslTriplet(heroGradientEnd)}))`,
    "--gradient-premium": `linear-gradient(135deg, hsl(${hexToHslTriplet(heroGradientStart)}), hsl(${hexToHslTriplet(heroGradientEnd)}), hsl(${hexToHslTriplet(gold)}))`,
  };

  return cssVars;
};

export const applyThemePalette = (palette: ThemePalette) => {
  const root = document.documentElement;
  const vars = buildCssVarsFromPalette(palette);
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
};

export type { ThemePalette, ThemeSettings };
