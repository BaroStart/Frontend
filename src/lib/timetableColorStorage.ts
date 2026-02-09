import { STORAGE_KEYS } from '@/constants';

/** GLOBAL_PALETTES - 컬러 팔레트 구성 (Teal 기반 기본) */
export const GLOBAL_PALETTES = {
  default: { brand: '193 55% 45%', brandMedium: '193 45% 82%', brandLight: '193 40% 96%' },
  pastel: { brand: '199 45% 72%', brandMedium: '199 40% 88%', brandLight: '199 35% 96%' },
  story: { brand: '210 50% 75%', brandMedium: '210 40% 88%', brandLight: '210 35% 96%' },
  softMint: { brand: '160 40% 68%', brandMedium: '160 35% 85%', brandLight: '160 30% 95%' },
  mono: { brand: '215 15% 35%', brandMedium: '215 10% 80%', brandLight: '215 10% 96%' },
  vivid: { brand: '199 65% 55%', brandMedium: '199 55% 82%', brandLight: '199 45% 95%' },
  calm: { brand: '215 25% 40%', brandMedium: '215 20% 85%', brandLight: '215 15% 96%' },
} as const;

/** 로고 기본 컬러 (legacy) */
const LOGO_BRAND = '215 25% 35%';
const LOGO_BRAND_LIGHT = '215 20% 95%';
const LOGO_BRAND_MEDIUM = '215 20% 88%';

/** 기본 테마 컬러 - Teal 기반 */
const DEFAULT_BRAND = GLOBAL_PALETTES.default.brand;
const DEFAULT_BRAND_LIGHT = GLOBAL_PALETTES.default.brandLight;
const DEFAULT_BRAND_MEDIUM = GLOBAL_PALETTES.default.brandMedium;

export type TimetablePaletteId = 'logo' | 'instagram' | 'softMint' | 'mono' | 'default' | 'story' | 'pastel' | 'vivid' | 'calm' | 'custom';

export const TIMETABLE_PALETTES: Record<Exclude<TimetablePaletteId, 'custom'>, { name: string; colors: string[] }> = {
  /** 로고 기본 컬러 - 파랑 계열로 통일 */
  logo: {
    name: '로고',
    colors: [
      `linear-gradient(135deg, hsl(${LOGO_BRAND}) 0%, hsl(215 30% 45%) 100%)`,
      `linear-gradient(135deg, hsl(215 35% 40%) 0%, hsl(215 40% 50%) 100%)`,
      `linear-gradient(135deg, hsl(215 30% 45%) 0%, hsl(215 35% 55%) 100%)`,
      `linear-gradient(135deg, hsl(210 40% 50%) 0%, hsl(210 45% 60%) 100%)`,
      `linear-gradient(135deg, hsl(220 35% 45%) 0%, hsl(220 40% 55%) 100%)`,
      `linear-gradient(135deg, hsl(205 45% 45%) 0%, hsl(205 50% 55%) 100%)`,
    ],
  },
  /** 인스타그램 스타일: 흑백+회색, 강조 시에만 제한적 컬러 */
  instagram: {
    name: '인스타',
    colors: [
      'linear-gradient(135deg, #374151 0%, #4B5563 100%)',
      'linear-gradient(135deg, #4B5563 0%, #6B7280 100%)',
      'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)',
      'linear-gradient(135deg, #111827 0%, #374151 100%)',
      'linear-gradient(135deg, #9CA3AF 0%, #D1D5DB 100%)',
      'linear-gradient(135deg, #6B7280 0%, #D1D5DB 100%)',
    ],
  },
  softMint: {
    name: '소프트 민트',
    colors: [
      'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
      'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
      'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)',
      'linear-gradient(135deg, #FCE4EC 0%, #F8BBD9 100%)',
      'linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)',
      'linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)',
    ],
  },
  mono: {
    name: '모노톤',
    colors: [
      'linear-gradient(135deg, #ECEFF1 0%, #CFD8DC 100%)',
      'linear-gradient(135deg, #E8EAF6 0%, #C5CAE9 100%)',
      'linear-gradient(135deg, #EFEBE9 0%, #D7CCC8 100%)',
      'linear-gradient(135deg, #E0E0E0 0%, #BDBDBD 100%)',
      'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
      'linear-gradient(135deg, #E1F5FE 0%, #B3E5FC 100%)',
    ],
  },
  default: {
    name: '기본',
    colors: [
      `linear-gradient(135deg, hsl(${DEFAULT_BRAND}) 0%, hsl(193 55% 55%) 100%)`,
      'linear-gradient(135deg, hsl(193 50% 50%) 0%, hsl(193 45% 60%) 100%)',
      'linear-gradient(135deg, hsl(190 55% 48%) 0%, hsl(190 50% 58%) 100%)',
      'linear-gradient(135deg, hsl(196 50% 52%) 0%, hsl(196 45% 62%) 100%)',
      'linear-gradient(135deg, hsl(188 55% 45%) 0%, hsl(188 50% 55%) 100%)',
      'linear-gradient(135deg, hsl(192 48% 50%) 0%, hsl(192 43% 60%) 100%)',
    ],
  },
  pastel: {
    name: '파스텔',
    colors: [
      'linear-gradient(135deg, #A8D8EA 0%, #7FB3D5 100%)',
      'linear-gradient(135deg, #F9B4C9 0%, #F08BA0 100%)',
      'linear-gradient(135deg, #B5EAD7 0%, #8DD9C2 100%)',
      'linear-gradient(135deg, #FFEAA7 0%, #FDCB6E 100%)',
      'linear-gradient(135deg, #DDA0DD 0%, #BA68C8 100%)',
      'linear-gradient(135deg, #87CEEB 0%, #74B9FF 100%)',
    ],
  },
  story: {
    name: '스토리',
    colors: [
      'linear-gradient(180deg, #A8C0FF 0%, #C2E9FB 100%)',
      'linear-gradient(180deg, #FFB6C1 0%, #FFE4E1 100%)',
      'linear-gradient(180deg, #98D8C8 0%, #D4E6B5 100%)',
      'linear-gradient(180deg, #F7DC6F 0%, #F8B739 100%)',
      'linear-gradient(180deg, #DDA0DD 0%, #E6E6FA 100%)',
      'linear-gradient(180deg, #87CEEB 0%, #B0E0E6 100%)',
    ],
  },
  vivid: {
    name: '비비드',
    colors: [
      'linear-gradient(135deg, #0984E3 0%, #74B9FF 100%)',
      'linear-gradient(135deg, #E17055 0%, #FF7675 100%)',
      'linear-gradient(135deg, #00B894 0%, #55EFC4 100%)',
      'linear-gradient(135deg, #FDCB6E 0%, #FFEAA7 100%)',
      'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
      'linear-gradient(135deg, #E84393 0%, #FD79A8 100%)',
    ],
  },
  calm: {
    name: '차분',
    colors: [
      'linear-gradient(135deg, #5C6B73 0%, #7D8A91 100%)',
      'linear-gradient(135deg, #6B7B82 0%, #8E9A9F 100%)',
      'linear-gradient(135deg, #7D8A91 0%, #95A5A6 100%)',
      'linear-gradient(135deg, #5D6D7E 0%, #85929E 100%)',
      'linear-gradient(135deg, #6C7A89 0%, #95A5A6 100%)',
      'linear-gradient(135deg, #55626B 0%, #7F8C8D 100%)',
    ],
  },
};

/** 팔레트 표시 순서 (기본이 맨 위) */
export const PALETTE_ORDER: Exclude<TimetablePaletteId, 'custom'>[] = [
  'default',
  'logo',
  'instagram',
  'softMint',
  'mono',
  'pastel',
  'story',
  'vivid',
  'calm',
];

export function getTimetablePaletteId(): TimetablePaletteId {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TIMETABLE_COLOR_PALETTE);
    if (!raw) return 'default';
    const id = raw as TimetablePaletteId;
    if (id === 'custom') return getCustomBrandForTimetable() ? 'custom' : 'default';
    return id in TIMETABLE_PALETTES ? id : 'default';
  } catch {
    return 'default';
  }
}

function getCustomBrandForTimetable(): { brand: string; brandLight: string; brandMedium: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_BRAND_COLOR);
    if (!raw) return null;
    return JSON.parse(raw) as { brand: string; brandLight: string; brandMedium: string };
  } catch {
    return null;
  }
}

export function setTimetablePaletteId(id: TimetablePaletteId): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TIMETABLE_COLOR_PALETTE, id);
    if (id === 'custom') return;
    // 프리셋 선택 시 커스텀 컬러 제거
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_BRAND_COLOR);
    applyPaletteAsBrand(id);
  } catch {
    // ignore
  }
}

/** 그라디언트 문자열에서 첫 색상 추출 (solid color용, swatch 표시 등) */
export function firstColorFromGradient(grad: string): string {
  const hslMatch = grad.match(/hsl\(([^)]+)\)/);
  if (hslMatch) return `hsl(${hslMatch[1]})`;
  const hexMatch = grad.match(/#[A-Fa-f0-9]{6}/);
  if (hexMatch) return hexMatch[0];
  return 'hsl(var(--brand))';
}

/** 팔레트 6색을 solid color로 반환 (할 일 색상바 등용) */
export function getTimetablePaletteAccentColors(): string[] {
  const colors = getTimetableColors();
  return colors.map(firstColorFromGradient);
}

export function getTimetableColors(): string[] {
  const id = getTimetablePaletteId();
  if (id === 'custom') {
    const custom = getCustomBrandForTimetable();
    if (!custom) return TIMETABLE_PALETTES.default.colors;
    const b = custom.brand;
    return [
      `linear-gradient(135deg, hsl(${b}) 0%, hsl(${b}) 100%)`,
      `linear-gradient(135deg, hsl(${b}) 0%, hsl(${b}) 100%)`,
      `linear-gradient(135deg, hsl(${b}) 0%, hsl(${b}) 100%)`,
      `linear-gradient(135deg, hsl(${b}) 0%, hsl(${b}) 100%)`,
      `linear-gradient(135deg, hsl(${b}) 0%, hsl(${b}) 100%)`,
      `linear-gradient(135deg, hsl(${b}) 0%, hsl(${b}) 100%)`,
    ];
  }
  return TIMETABLE_PALETTES[id].colors;
}

/** 팔레트별 --brand에 적용할 HSL (메인 1색 + 라이트/미디엄) */
export const PALETTE_TO_BRAND: Record<Exclude<TimetablePaletteId, 'custom'>, { brand: string; brandLight: string; brandMedium: string }> = {
  logo: { brand: LOGO_BRAND, brandLight: LOGO_BRAND_LIGHT, brandMedium: LOGO_BRAND_MEDIUM },
  instagram: { brand: '215 25% 35%', brandLight: '215 20% 95%', brandMedium: '215 20% 88%' },
  softMint: { ...GLOBAL_PALETTES.softMint },
  mono: { ...GLOBAL_PALETTES.mono },
  default: { ...GLOBAL_PALETTES.default },
  pastel: { ...GLOBAL_PALETTES.pastel },
  story: { ...GLOBAL_PALETTES.story },
  vivid: { ...GLOBAL_PALETTES.vivid },
  calm: { ...GLOBAL_PALETTES.calm },
};

export function applyPaletteAsBrand(id: TimetablePaletteId): void {
  if (id === 'custom') return;
  const v = PALETTE_TO_BRAND[id];
  const root = document.documentElement;
  root.style.setProperty('--brand', v.brand);
  root.style.setProperty('--brand-light', v.brandLight);
  root.style.setProperty('--brand-medium', v.brandMedium);
  // primary도 테마에 맞춰 적용 (파란 고정 제거)
  root.style.setProperty('--primary', v.brand);
  root.style.setProperty('--ring', v.brand);
}

export function getPaletteDisplayInfo(): { name: string; brand: string; brandLight: string; brandMedium: string } {
  const id = getTimetablePaletteId();
  if (id === 'custom') {
    const c = getCustomBrandForTimetable();
    return c ? { name: '직접 만들기', ...c } : { name: '기본', ...PALETTE_TO_BRAND.default };
  }
  const v = PALETTE_TO_BRAND[id];
  const name = TIMETABLE_PALETTES[id as Exclude<TimetablePaletteId, 'custom'>]?.name ?? '로고';
  return { name, ...v };
}
