import { useMemo } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, format,
} from 'date-fns';
import { useApp } from '../../store/AppContext';
import { formatDate } from '../../utils/time';

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

export default function MonthView() {
  const { blocks, categories, currentDate, setCurrentDate, setViewMode } = useApp();

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  // Build per-day stats
  const dayStats = useMemo(() => {
    const stats: Record<string, { total: number; byL1: Record<string, number> }> = {};
    const start = formatDate(calendarDays[0]);
    const end = formatDate(calendarDays[calendarDays.length - 1]);

    blocks
      .filter((b) => b.date >= start && b.date <= end && b.status !== 'empty')
      .forEach((b) => {
        if (!stats[b.date]) stats[b.date] = { total: 0, byL1: {} };
        stats[b.date].total++;
        if (b.categoryL1Id) {
          stats[b.date].byL1[b.categoryL1Id] = (stats[b.date].byL1[b.categoryL1Id] || 0) + 1;
        }
      });

    return stats;
  }, [blocks, calendarDays]);

  const handleDayClick = (day: Date) => {
    setCurrentDate(day);
    setViewMode('day');
  };

  return (
    <div className="month-view">
      <div className="month-grid">
        {WEEKDAYS.map((d) => (
          <div key={d} className="month-header__cell">{d}</div>
        ))}
        {calendarDays.map((day) => {
          const dateStr = formatDate(day);
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          const stat = dayStats[dateStr];

          return (
            <div
              key={dateStr}
              className={`month-day ${!inMonth ? 'month-day--other' : ''} ${today ? 'month-day--today' : ''}`}
              onClick={() => handleDayClick(day)}
            >
              <div className="month-day__number">{format(day, 'd')}</div>
              {stat && (
                <>
                  <div className="month-day__bars">
                    {Object.entries(stat.byL1)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 4)
                      .map(([l1Id, count]) => {
                        const cat = categories.find((c) => c.id === l1Id);
                        const pct = Math.max((count / 48) * 100, 8);
                        return (
                          <div
                            key={l1Id}
                            className="month-day__bar"
                            style={{ background: cat?.color || '#94A3B8', width: `${pct}%` }}
                          />
                        );
                      })}
                  </div>
                  <div className="month-day__summary">
                    {stat.total}块 / {Math.floor(stat.total / 2)}h
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
