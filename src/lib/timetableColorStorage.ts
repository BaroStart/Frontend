import { STORAGE_KEYS } from '@/constants';

export type TimetablePaletteId = 'default' | 'story' | 'pastel' | 'vivid' | 'calm';

export const TIMETABLE_PALETTES: Record<TimetablePaletteId, { name: string; colors: string[] }> = {
  default: {
    name: '기본',
    colors: [
      'linear-gradient(135deg, hsl(193 87% 45%) 0%, hsl(193 70% 55%) 100%)',
      'linear-gradient(135deg, hsl(262 83% 55%) 0%, hsl(262 70% 65%) 100%)',
      'linear-gradient(135deg, hsl(142 71% 45%) 0%, hsl(142 60% 55%) 100%)',
      'linear-gradient(135deg, hsl(25 95% 53%) 0%, hsl(25 90% 63%) 100%)',
      'linear-gradient(135deg, hsl(330 81% 60%) 0%, hsl(330 70% 70%) 100%)',
      'linear-gradient(135deg, hsl(199 89% 48%) 0%, hsl(199 80% 58%) 100%)',
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
      'linear-gradient(135deg, #636E72 0%, #B2BEC3 100%)',
      'linear-gradient(135deg, #2D3436 0%, #636E72 100%)',
      'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
      'linear-gradient(135deg, #00B894 0%, #81ECEC 100%)',
      'linear-gradient(135deg, #D63031 0%, #FF7675 100%)',
      'linear-gradient(135deg, #F79F1F 0%, #FDCB6E 100%)',
    ],
  },
};

export function getTimetablePaletteId(): TimetablePaletteId {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TIMETABLE_COLOR_PALETTE);
    if (!raw) return 'story';
    const id = raw as TimetablePaletteId;
    return id in TIMETABLE_PALETTES ? id : 'story';
  } catch {
    return 'default';
  }
}

export function setTimetablePaletteId(id: TimetablePaletteId): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TIMETABLE_COLOR_PALETTE, id);
  } catch {
    // ignore
  }
}

export function getTimetableColors(): string[] {
  const id = getTimetablePaletteId();
  return TIMETABLE_PALETTES[id].colors;
}
