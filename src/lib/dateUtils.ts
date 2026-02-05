/** 오늘 날짜 문자열 (YYYY-MM-DD) */
export const getTodayDateStr = () => new Date().toISOString().split('T')[0];

/** "2026.02.02 오전 10:45" → "2026-02-02" */
export const parseDateFromStr = (str: string): string | null => {
  const match = str.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
  if (!match) return null;
  const [, y, m, d] = match;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

/** 주간 범위 (월~일) */
export const getWeekRange = (dateStr: string) => {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (x: Date) => x.toISOString().split('T')[0];
  return { start: fmt(mon), end: fmt(sun) };
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
