import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../../store/AppContext';
import { slotToTime, getCurrentSlot, formatDate, mergeConsecutiveBlocks } from '../../utils/time';
import BlockEditModal from '../blocks/BlockEditModal';
import type { TimeBlock } from '../../types';

export default function DayView() {
  const { blocks, categories, currentDate, settings } = useApp();
  const [editSlot, setEditSlot] = useState<{ date: string; slot: number } | null>(null);
  const currentRowRef = useRef<HTMLDivElement>(null);

  const dateStr = formatDate(currentDate);
  const dayBlocks = useMemo(
    () => blocks.filter((b) => b.date === dateStr),
    [blocks, dateStr]
  );

  const currentSlot = getCurrentSlot();
  const isToday = dateStr === formatDate(new Date());

  // Build a map for quick lookup
  const blockMap = useMemo(() => {
    const map: Record<number, TimeBlock> = {};
    dayBlocks.forEach((b) => { map[b.slotIndex] = b; });
    return map;
  }, [dayBlocks]);

  // Merge groups for display
  const mergedGroups = useMemo(() => mergeConsecutiveBlocks(dayBlocks), [dayBlocks]);
  const mergeMap = useMemo(() => {
    const map: Record<number, { groupIdx: number; isFirst: boolean; isLast: boolean; groupSize: number }> = {};
    mergedGroups.forEach((group, gi) => {
      group.forEach((block, bi) => {
        map[block.slotIndex] = {
          groupIdx: gi,
          isFirst: bi === 0,
          isLast: bi === group.length - 1,
          groupSize: group.length,
        };
      });
    });
    return map;
  }, [mergedGroups]);

  // Scroll to current time on mount
  useEffect(() => {
    if (isToday && currentRowRef.current) {
      currentRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isToday]);

  const startSlot = settings.startHour * 2;
  const endSlot = Math.min(settings.endHour * 2, 48);

  const getCategoryInfo = (block: TimeBlock) => {
    const l1 = categories.find((c) => c.id === block.categoryL1Id);
    const l2 = l1?.children.find((c) => c.id === block.categoryL2Id);
    const l3 = l2?.children.find((c) => c.id === block.categoryL3Id);
    return { l1, l2, l3 };
  };

  const renderBlockContent = (slot: number) => {
    const block = blockMap[slot];
    const merge = mergeMap[slot];

    if (!block || block.status === 'empty') {
      return (
        <div className="time-row__block time-row__block--empty">
          点击记录
        </div>
      );
    }

    const { l1, l2, l3 } = getCategoryInfo(block);

    // If part of a merged group and not first, show minimized
    if (merge && !merge.isFirst && merge.groupSize > 1) {
      return null; // Will be covered by merged block
    }

    const statusClass = block.status === 'planned' ? 'time-row__block--planned' : 'time-row__block--recorded';

    return (
      <div
        className={`time-row__block ${statusClass}`}
        style={{ borderLeftColor: l1?.color || '#94A3B8' }}
      >
        <span className="time-row__category-dot" style={{ background: l1?.color || '#94A3B8' }} />
        <span className="time-row__block-text">
          {l1?.name}{l2 ? ` / ${l2.name}` : ''}{l3 ? ` / ${l3.name}` : ''}
        </span>
        {block.customNote && <span className="time-row__block-note">{block.customNote}</span>}
        <span className={`time-row__status time-row__status--${block.status}`}>
          {block.status === 'planned' ? '计划' : '已记录'}
        </span>
      </div>
    );
  };

  // Render merged rows
  const renderRows = () => {
    const rows: React.ReactNode[] = [];
    let skipUntil = -1;

    for (let slot = startSlot; slot < endSlot; slot++) {
      if (slot < skipUntil) continue;

      const merge = mergeMap[slot];
      const isCurrent = isToday && slot === currentSlot;
      const isHourBoundary = slot % 2 === 1;

      // Merged block: render once spanning multiple rows
      if (merge && merge.isFirst && merge.groupSize > 1) {
        const group = mergedGroups[merge.groupIdx];
        const firstBlock = group[0];
        const lastBlock = group[group.length - 1];
        const { l1, l2, l3 } = getCategoryInfo(firstBlock);
        skipUntil = firstBlock.slotIndex + merge.groupSize;

        rows.push(
          <div
            key={`merged-${slot}`}
            className={`time-row ${isCurrent ? 'time-row--current' : ''}`}
            ref={isCurrent ? currentRowRef : undefined}
            style={{ minHeight: `${merge.groupSize * 36}px` }}
          >
            <div className="time-row__label" style={{ flexDirection: 'column', lineHeight: 1.3 }}>
              <span>{slotToTime(firstBlock.slotIndex)}</span>
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                {slotToTime(lastBlock.slotIndex + 1)}
              </span>
            </div>
            <div
              className="time-row__content"
              onClick={() => setEditSlot({ date: dateStr, slot: firstBlock.slotIndex })}
            >
              <div
                className="merged-block"
                style={{
                  borderLeftColor: l1?.color || '#94A3B8',
                  background: l1 ? `${l1.color}10` : 'transparent',
                }}
              >
                <span className="time-row__category-dot" style={{ background: l1?.color || '#94A3B8' }} />
                <span className="time-row__block-text">
                  {l1?.name}{l2 ? ` / ${l2.name}` : ''}{l3 ? ` / ${l3.name}` : ''}
                </span>
                <span className="merged-block__time">{merge.groupSize * 30}分钟</span>
                {firstBlock.customNote && <span className="time-row__block-note">{firstBlock.customNote}</span>}
                <span className={`time-row__status time-row__status--${firstBlock.status}`}>
                  {firstBlock.status === 'planned' ? '计划' : '已记录'}
                </span>
              </div>
            </div>
          </div>
        );
        continue;
      }

      rows.push(
        <div
          key={slot}
          className={`time-row ${isCurrent ? 'time-row--current' : ''} ${isHourBoundary ? 'time-row--hour' : ''}`}
          ref={isCurrent ? currentRowRef : undefined}
        >
          <div className="time-row__label">{slotToTime(slot)}</div>
          <div className="time-row__content" onClick={() => setEditSlot({ date: dateStr, slot })}>
            {renderBlockContent(slot)}
          </div>
        </div>
      );
    }

    return rows;
  };

  return (
    <div className="day-view">
      <div className="time-grid">
        {renderRows()}
      </div>

      {editSlot && (
        <BlockEditModal
          date={editSlot.date}
          slotIndex={editSlot.slot}
          existingBlock={blockMap[editSlot.slot]}
          onClose={() => setEditSlot(null)}
        />
      )}
    </div>
  );
}
