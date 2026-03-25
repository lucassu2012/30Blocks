import { AppProvider, useApp } from './store/AppContext';
import Header from './components/common/Header';
import DayView from './components/views/DayView';
import WeekView from './components/views/WeekView';
import MonthView from './components/views/MonthView';
import SummaryPanel from './components/summary/SummaryPanel';
import CategoryManager from './components/categories/CategoryManager';
import SettingsPanel from './components/common/SettingsPanel';

function AppContent() {
  const { viewMode, showSummary, showSettings, showCategoryManager } = useApp();

  return (
    <div className="app-layout">
      <Header />
      <main className="app-content">
        {viewMode === 'day' && <DayView />}
        {viewMode === 'week' && <WeekView />}
        {viewMode === 'month' && <MonthView />}
      </main>

      {showSummary && <SummaryPanel />}
      {showCategoryManager && <CategoryManager />}
      {showSettings && <SettingsPanel />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
