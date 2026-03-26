import { ChevronLeft, ChevronRight, BarChart3, Settings, Tag, Clock } from 'lucide-react';
import { addDays, addWeeks, addMonths } from 'date-fns';
import { useApp } from '../../store/AppContext';
import { formatDateDisplay } from '../../utils/time';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { ViewMode } from '../../types';

export default function Header() {
  const {
    currentDate, setCurrentDate, viewMode, setViewMode,
    setShowSummary, setShowSettings, setShowCategoryManager,
  } = useApp();

  const navigate = (dir: number) => {
    setCurrentDate((prev: Date) => {
      switch (viewMode) {
        case 'day': return addDays(prev, dir);
        case 'week': return addWeeks(prev, dir);
        case 'month': return addMonths(prev, dir);
      }
    });
  };

  const goToday = () => setCurrentDate(new Date());

  const dateLabel = () => {
    switch (viewMode) {
      case 'day': return formatDateDisplay(currentDate);
      case 'week': return format(currentDate, 'yyyy年 第w周', { locale: zhCN });
      case 'month': return format(currentDate, 'yyyy年M月', { locale: zhCN });
    }
  };

  return (
    <header className="app-header">
      <div className="app-header__logo">
        <Clock size={24} />
        <span>30-Blocks</span>
      </div>

      <div className="app-header__nav">
        <button className="btn btn--sm" onClick={goToday}>今天</button>
        <div className="date-nav">
          <button className="btn btn--ghost btn--icon" onClick={() => navigate(-1)}><ChevronLeft size={16} /></button>
          <span className="date-nav__label">{dateLabel()}</span>
          <button className="btn btn--ghost btn--icon" onClick={() => navigate(1)}><ChevronRight size={16} /></button>
        </div>
        <div style={{ display: 'flex', gap: 2, marginLeft: 8 }}>
          {(['day', 'week', 'month'] as ViewMode[]).map((m) => (
            <button
              key={m}
              className={`btn btn--sm ${viewMode === m ? 'btn--active' : ''}`}
              onClick={() => setViewMode(m)}
            >
              {{ day: '日', week: '周', month: '月' }[m]}
            </button>
          ))}
        </div>
      </div>

      <div className="app-header__actions">
        <button className="btn btn--ghost btn--sm" onClick={() => setShowSummary(true)} title="时间总结">
          <BarChart3 size={16} /> 总结
        </button>
        <button className="btn btn--ghost btn--sm" onClick={() => setShowCategoryManager(true)} title="分类管理">
          <Tag size={16} /> 分类
        </button>
        <button className="btn btn--ghost btn--sm" onClick={() => setShowSettings(true)} title="设置">
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
