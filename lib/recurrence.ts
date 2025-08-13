export type RepeatRule = 'none' | 'daily' | 'weekly' | 'monthly';

export function toLocalISODate(d: Date): string {
  const tzOffset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tzOffset * 60000);
  return local.toISOString().slice(0, 10);
}

export function parseISODate(date?: string | null): Date | null {
  if (!date) return null;
  const parts = date.split('-');
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  const dt = new Date(y, m - 1, d);
  if (isNaN(dt.getTime())) return null;
  return dt;
}

export function addMonthly(date: Date): Date {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const nextMonth = new Date(y, m + 1, 1);
  const lastDayNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
  const day = Math.min(d, lastDayNextMonth);
  return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), day);
}

export function nextDueFrom(due: string | null | undefined, rule: RepeatRule, today: string): string | null {
  if (!rule || rule === 'none') return due ?? null;
  const dueDate = parseISODate(due) ?? parseISODate(today)!;
  switch(rule){
    case 'daily': {
      const nd = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate() + 1);
      return toLocalISODate(nd);
    }
    case 'weekly': {
      const nd = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate() + 7);
      return toLocalISODate(nd);
    }
    case 'monthly': {
      const nd = addMonthly(dueDate);
      return toLocalISODate(nd);
    }
    default: return due ?? null;
  }
}

export function isOnOrBefore(dateA: string, dateB: string): boolean {
  return (parseISODate(dateA)!.getTime() <= parseISODate(dateB)!.getTime());
}

export function shouldIncrementStreak(completeDay: string, due: string | null | undefined): boolean {
  if (!due) return true;
  return isOnOrBefore(completeDay, due);
}
