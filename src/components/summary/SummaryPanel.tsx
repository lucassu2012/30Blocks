import { useState, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, addWeeks, addMonths, addYears, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useApp } from '../../store/AppContext';
import { getDateRange, getHoursFromBlocks } from '../../utils/time';
import type { SummaryPeriod, CategoryStat } from '../../types';

export default function SummaryPanel() {
  const { blocks, categories, currentDate, setShowSummary } = useApp();
  const [period, setPeriod] = useState<SummaryPeriod>('week');
  const [baseDate, setBaseDate] = useState(currentDate);

  const { start, end } = useMemo(() => getDateRange(baseDate, period), [baseDate, period]);

  const periodBlocks = useMemo(
    () => blocks.filter((b) => b.date >= start && b.date <= end && b.status !== 'empty'),
    [blocks, start, end]
  );

  const stats = useMemo(() => {
    const recorded = periodBlocks.filter((b) => b.status === 'recorded').length;
    const planned = periodBlocks.filter((b) => b.status === 'planned').length;
    const total = periodBlocks.length;

    const byL1: Record<string, { count: number; byL2: Record<string, number> }> = {};
    periodBlocks.forEach((b) => {
      if (!b.categoryL1Id) return;
      if (!byL1[b.categoryL1Id]) byL1[b.categoryL1Id] = { count: 0, byL2: {} };
      byL1[b.categoryL1Id].count++;
      if (b.categoryL2Id) {
        byL1[b.categoryL1Id].byL2[b.categoryL2Id] = (byL1[b.categoryL1Id].byL2[b.categoryL2Id] || 0) + 1;
      }
    });

    const breakdown: CategoryStat[] = categories
      .map((cat) => {
        const data = byL1[cat.id];
        if (!data) return null;
        return {
          categoryL1Id: cat.id,
          categoryL1Name: cat.name,
          color: cat.color,
          totalBlocks: data.count,
          percentage: total > 0 ? (data.count / total) * 100 : 0,
          subcategories: cat.children
            .filter((sub) => data.byL2[sub.id])
            .map((sub) => ({
              categoryL2Id: sub.id,
              categoryL2Name: sub.name,
              totalBlocks: data.byL2[sub.id],
              percentage: total > 0 ? (data.byL2[sub.id] / total) * 100 : 0,
            })),
        };
      })
      .filter(Boolean) as CategoryStat[];

    breakdown.sort((a, b) => b.totalBlocks - a.totalBlocks);

    return { total, recorded, planned, breakdown };
  }, [periodBlocks, categories]);

  const navigate = (dir: number) => {
    setBaseDate((prev) => {
      switch (period) {
        case 'day': return addDays(prev, dir);
        case 'week': return addWeeks(prev, dir);
        case 'month': return addMonths(prev, dir);
        case 'year': return addYears(prev, dir);
      }
    });
  };

  const periodLabel = () => {
    switch (period) {
      case 'day': return format(baseDate, 'yyyy年M月d日', { locale: zhCN });
      case 'week': return `${start} ~ ${end}`;
      case 'month': return format(baseDate, 'yyyy年M月', { locale: zhCN });
      case 'year': return format(baseDate, 'yyyy年', { locale: zhCN });
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setShowSummary(false)}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <div className="modal__title">时间总结</div>
          <button className="btn btn--ghost btn--icon" onClick={() => setShowSummary(false)}>
            <X size={16} />
          </button>
        </div>

        <div className="modal__body">
          <div className="summary-panel">
            {/* Period selector */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['day', 'week', 'month', 'year'] as SummaryPeriod[]).map((p) => (
                  <button
                    key={p}
                    className={`btn btn--sm ${period === p ? 'btn--active' : ''}`}
                    onClick={() => setPeriod(p)}
                  >
                    {{ day: '日', week: '周', month: '月', year: '年' }[p]}
                  </button>
                ))}
              </div>
              <div className="date-nav">
                <button className="btn btn--ghost btn--icon" onClick={() => navigate(-1)}><ChevronLeft size={16} /></button>
                <span className="date-nav__label" style={{ minWidth: 160, fontSize: 14 }}>{periodLabel()}</span>
                <button className="btn btn--ghost btn--icon" onClick={() => navigate(1)}><ChevronRight size={16} /></button>
              </div>
            </div>

            {/* Summary cards */}
            <div className="summary-cards">
              <div className="summary-card">
                <div className="summary-card__value">{stats.total}</div>
                <div className="summary-card__label">总时间块</div>
              </div>
              <div className="summary-card">
                <div className="summary-card__value" style={{ color: 'var(--color-success)' }}>{stats.recorded}</div>
                <div className="summary-card__label">已记录</div>
              </div>
              <div className="summary-card">
                <div className="summary-card__value" style={{ color: 'var(--color-primary)' }}>{stats.planned}</div>
                <div className="summary-card__label">已规划</div>
              </div>
              <div className="summary-card">
                <div className="summary-card__value">{getHoursFromBlocks(stats.total)}</div>
                <div className="summary-card__label">总时长</div>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="summary-chart">
              <div style={{ fontWeight: 600, marginBottom: 16 }}>活动分类分布</div>
              {stats.breakdown.length === 0 && (
                <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 20 }}>
                  该时段暂无记录数据
                </div>
              )}
              {stats.breakdown.map((cat) => (
                <div key={cat.categoryL1Id}>
                  <div className="summary-bar">
                    <div className="summary-bar__label">{cat.categoryL1Name}</div>
                    <div className="summary-bar__track">
                      <div
                        className="summary-bar__fill"
                        style={{ width: `${Math.max(cat.percentage, 3)}%`, background: cat.color }}
                      >
                        {cat.percentage >= 10 ? `${cat.percentage.toFixed(0)}%` : ''}
                      </div>
                    </div>
                    <div className="summary-bar__value">
                      {getHoursFromBlocks(cat.totalBlocks)} ({cat.percentage.toFixed(1)}%)
                    </div>
                  </div>
                  {cat.subcategories.map((sub) => (
                    <div className="summary-bar" key={sub.categoryL2Id} style={{ paddingLeft: 40 }}>
                      <div className="summary-bar__label" style={{ fontSize: 12, width: 60 }}>{sub.categoryL2Name}</div>
                      <div className="summary-bar__track" style={{ height: 16 }}>
                        <div
                          className="summary-bar__fill"
                          style={{ width: `${Math.max(sub.percentage, 2)}%`, background: cat.color, opacity: 0.6 }}
                        />
                      </div>
                      <div className="summary-bar__value" style={{ fontSize: 11 }}>
                        {getHoursFromBlocks(sub.totalBlocks)}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
