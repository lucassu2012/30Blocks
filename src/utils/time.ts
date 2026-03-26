import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addDays, eachDayOfInterval } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { TimeBlock, SummaryPeriod } from '../types';

export function slotToTime(slot: number): string {
  const h = Math.floor(slot / 2);
  const m = (slot % 2) * 30;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function slotToEndTime(slot: number): string {
  return slotToTime(slot + 1);
}

export function timeToSlot(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 2 + (m >= 30 ? 1 : 0);
}

export function getCurrentSlot(): number {
  const now = new Date();
  return now.getHours() * 2 + (now.getMinutes() >= 30 ? 1 : 0);
}

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatDateDisplay(date: Date): string {
  return format(date, 'yyyy年M月d日 EEEE', { locale: zhCN });
}

export function formatDateShort(date: Date): string {
  return format(date, 'M/d EEE', { locale: zhCN });
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end: addDays(start, 6) });
}

export function getDateRange(date: Date, period: SummaryPeriod): { start: string; end: string } {
  switch (period) {
    case 'day':
      return { start: formatDate(date), end: formatDate(date) };
    case 'week': {
      const ws = startOfWeek(date, { weekStartsOn: 1 });
      const we = endOfWeek(date, { weekStartsOn: 1 });
      return { start: formatDate(ws), end: formatDate(we) };
    }
    case 'month': {
      const ms = startOfMonth(date);
      const me = endOfMonth(date);
      return { start: formatDate(ms), end: formatDate(me) };
    }
    case 'year': {
      const ys = startOfYear(date);
      const ye = endOfYear(date);
      return { start: formatDate(ys), end: formatDate(ye) };
    }
  }
}

/** Group consecutive blocks with same category into merge groups */
export function mergeConsecutiveBlocks(blocks: TimeBlock[]): TimeBlock[][] {
  if (blocks.length === 0) return [];

  // Sort by slotIndex
  const sorted = [...blocks]
    .filter((b) => b.status !== 'empty')
    .sort((a, b) => a.slotIndex - b.slotIndex);

  if (sorted.length === 0) return [];

  const groups: TimeBlock[][] = [[sorted[0]]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const lastGroup = groups[groups.length - 1];

    // Merge if consecutive and same L1+L2 category
    if (
      curr.slotIndex === prev.slotIndex + 1 &&
      curr.categoryL1Id === prev.categoryL1Id &&
      curr.categoryL2Id === prev.categoryL2Id &&
      curr.date === prev.date
    ) {
      lastGroup.push(curr);
    } else {
      groups.push([curr]);
    }
  }

  return groups;
}

export function getHoursFromBlocks(count: number): string {
  const hours = Math.floor(count / 2);
  const mins = (count % 2) * 30;
  if (mins === 0) return `${hours}小时`;
  if (hours === 0) return `${mins}分钟`;
  return `${hours}小时${mins}分钟`;
}
