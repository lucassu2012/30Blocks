import React, { useState, useMemo } from 'react';
import { format, isToday } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useApp } from '../../store/AppContext';
import { getWeekDays, formatDate, slotToTime, getCurrentSlot } from '../../utils/time';
import BlockEditModal from '../blocks/BlockEditModal';
import type { TimeBlock } from '../../types';

export default function WeekView() {
  const { blocks, categories, currentDate, settings, setCurrentDate, setViewMode } = useApp();
  const [editSlot, setEditSlot] = useState<{ date: string; slot: number } | null>(null);

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const startSlot = settings.startHour * 2;
  const endSlot = Math.min(settings.endHour * 2, 48);
  const currentSlot = getCurrentSlot();
  const todayStr = formatDate(new Date());

  // Build block map keyed by "date-slot"
  const blockMap = useMemo(() => {
    const map: Record<string, TimeBlock> = {};
    const start = formatDate(weekDays[0]);
    const end = formatDate(weekDays[6]);
    blocks
      .filter((b) => b.date >= start && b.date <= end)
      .forEach((b) => { map[`${b.date}-${b.slotIndex}`] = b; });
    return map;
  }, [blocks, weekDays]);

  const getBlockForCell = (date: string, slot: number) => blockMap[`${date}-${slot}`];

  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    setViewMode('day');
  };

  return (
    <div className="week-view">
      <div className="week-grid" style={{ maxHeight: 'calc(100vh - 130px)', overflow: 'auto' }}>
        {/* Header row */}
        <div className="week-header">
          <div className="week-header__cell" style={{ borderBottom: '2px solid var(--color-border)' }}>时间</div>
          {weekDays.map((day) => {
            const today = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className={`week-header__cell ${today ? 'week-header__cell--today' : ''}`}
                onClick={() => handleDayClick(day)}
                style={{ cursor: 'pointer' }}
              >
                <div className="week-header__day">{format(day, 'EEE', { locale: zhCN })}</div>
                <div className="week-header__date">{format(day, 'd')}</div>
              </div>
            );
          })}
        </div>

        {/* Time rows */}
        {Array.from({ length: endSlot - startSlot }, (_, i) => startSlot + i).map((slot) => (
          <React.Fragment key={slot}>
            <div className="week-time-label">
              {slot % 2 === 0 ? slotToTime(slot) : ''}
            </div>
            {weekDays.map((day) => {
              const dateStr = formatDate(day);
              const block = getBlockForCell(dateStr, slot);
              const isCurrent = dateStr === todayStr && slot === currentSlot;
              const l1 = block ? categories.find((c) => c.id === block.categoryL1Id) : null;

              return (
                <div
                  key={`${dateStr}-${slot}`}
                  className={`week-cell ${isCurrent ? 'week-cell--current' : ''}`}
                  onClick={() => setEditSlot({ date: dateStr, slot })}
                  title={
                    block && block.status !== 'empty'
                      ? `${l1?.name || ''}${block.customNote ? ` - ${block.customNote}` : ''}`
                      : `${slotToTime(slot)}`
                  }
                >
                  {block && block.status !== 'empty' && l1 && (
                    <div
                      className="week-cell__bar"
                      style={{
                        background: l1.color,
                        opacity: block.status === 'planned' ? 0.4 : 0.7,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {editSlot && (
        <BlockEditModal
          date={editSlot.date}
          slotIndex={editSlot.slot}
          existingBlock={blockMap[`${editSlot.date}-${editSlot.slot}`]}
          onClose={() => setEditSlot(null)}
        />
      )}
    </div>
  );
}
