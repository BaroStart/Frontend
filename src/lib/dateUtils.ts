/** 오늘 날짜 문자열 (YYYY-MM-DD) */
export const getTodayDateStr = () => new Date().toISOString().split('T')[0];

/** "2026.02.02 오전 10:45" → "2026-02-02" */
export const parseDateFromStr = (str: string): string | null => {
  const match = str.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
  if (!match) return null;
  const [, y, m, d] = match;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

/** 주간 범위 (오늘-1일부터 오늘-7일까지) */
export const getWeekRange = (dateStr: string) => {
  const base = new Date(dateStr);
  const yesterday = new Date(base);
  yesterday.setDate(base.getDate() - 1);
  const sevenDaysAgo = new Date(base);
  sevenDaysAgo.setDate(base.getDate() - 7);
  const fmt = (x: Date) => x.toISOString().split('T')[0];
  return { start: fmt(sevenDaysAgo), end: fmt(yesterday) };
};

/** 월간 범위 (1일~말일) */
export const getMonthRange = (dateStr: string) => {
  const [y, m] = dateStr.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return {
    start: `${y}-${String(m).padStart(2, '0')}-01`,
    end: `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  };
};

/** 날짜가 범위 내에 있는지 확인 */
export const isDateInRange = (dateStr: string | null, start: string, end: string) =>
  dateStr ? dateStr >= start && dateStr <= end : false;

/** 날짜를 "2026년 2월 5일 수요일" 형식으로 */
export const formatDisplayDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-');
  const date = new Date(+y, +m - 1, +d);
  const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  return `${y}년 ${+m}월 ${+d}일 ${weekdays[date.getDay()]}`;
};

export const formatDateDot = (dateStr: string) => dateStr.replace(/-/g, '.');

export const formatDateDash = (dateStr: string) => dateStr.replace(/\./g, '-');

/** 주간 보기 형식: "2월 1일 ~ 2월 7일" */
export const formatWeekRange = (start: string, end: string) => {
  const [, m1, d1] = start.split('-');
  const [, m2, d2] = end.split('-');
  return `${+m1}월 ${+d1}일 ~ ${+m2}월 ${+d2}일`;
};

/** 월간 보기 형식: "2026년 2월" */
export const formatMonthOnly = (dateStr: string) => {
  const [y, m] = dateStr.split('-');
  return `${y}년 ${+m}월`;
};
