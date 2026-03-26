import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { TimeBlock, CategoryLevel1, AppSettings, ViewMode } from '../types';
import {
  loadBlocks, saveBlocks,
  loadCategories, saveCategories,
  loadSettings, saveSettings,
  upsertBlock as storageUpsert,
} from './storage';
import { format } from 'date-fns';

interface AppContextType {
  // State
  blocks: TimeBlock[];
  categories: CategoryLevel1[];
  settings: AppSettings;
  currentDate: Date;
  viewMode: ViewMode;
  showSummary: boolean;
  showSettings: boolean;
  showCategoryManager: boolean;

  // Actions
  setCurrentDate: (d: Date | ((prev: Date) => Date)) => void;
  setViewMode: (m: ViewMode) => void;
  setShowSummary: (v: boolean) => void;
  setShowSettings: (v: boolean) => void;
  setShowCategoryManager: (v: boolean) => void;
  refreshBlocks: () => void;
  upsertBlock: (block: Partial<TimeBlock> & { date: string; slotIndex: number }) => void;
  deleteBlock: (date: string, slotIndex: number) => void;
  updateCategories: (cats: CategoryLevel1[]) => void;
  updateSettings: (s: Partial<AppSettings>) => void;
  getBlocksForDate: (date: string) => TimeBlock[];
  getBlocksForRange: (start: string, end: string) => TimeBlock[];
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [blocks, setBlocks] = useState<TimeBlock[]>(() => loadBlocks());
  const [categories, setCategories] = useState<CategoryLevel1[]>(() => loadCategories());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [showSummary, setShowSummary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // Keep a ref to blocks for helper functions to avoid stale closures
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  const refreshBlocks = useCallback(() => {
    const loaded = loadBlocks();
    setBlocks(loaded);
  }, []);

  const handleUpsertBlock = useCallback((block: Partial<TimeBlock> & { date: string; slotIndex: number }) => {
    storageUpsert(block);
    refreshBlocks();
  }, [refreshBlocks]);

  const handleDeleteBlock = useCallback((date: string, slotIndex: number) => {
    const all = blocksRef.current.filter((b) => !(b.date === date && b.slotIndex === slotIndex));
    saveBlocks(all);
    setBlocks(all);
  }, []);

  const updateCategories = useCallback((cats: CategoryLevel1[]) => {
    saveCategories(cats);
    setCategories(cats);
  }, []);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  const getBlocksForDateCtx = useCallback((date: string) => {
    return blocksRef.current.filter((b) => b.date === date);
  }, []);

  const getBlocksForRangeCtx = useCallback((start: string, end: string) => {
    return blocksRef.current.filter((b) => b.date >= start && b.date <= end);
  }, []);

  // Reminder timer
  useEffect(() => {
    if (!settings.reminderEnabled) return;

    const check = () => {
      const now = new Date();
      const mins = now.getMinutes();
      // Prompt at :00 and :30
      if (mins === 0 || mins === 30) {
        const currentSlot = now.getHours() * 2 + (mins >= 30 ? 1 : 0);
        const prevSlot = currentSlot > 0 ? currentSlot - 1 : 47;
        const dateStr = format(now, 'yyyy-MM-dd');
        const prevDateStr = prevSlot === 47
          ? format(new Date(now.getTime() - 86400000), 'yyyy-MM-dd')
          : dateStr;
        const existing = blocksRef.current.find(
          (b) => b.date === prevDateStr && b.slotIndex === prevSlot && b.status === 'recorded'
        );
        if (!existing) {
          // Show browser notification
          if (Notification.permission === 'granted') {
            new Notification('30-Blocks 时间记录提醒', {
              body: '上一个时间块尚未记录，请记录您的活动内容。',
              icon: '/vite.svg',
            });
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission();
          }
        }
      }
    };

    const interval = setInterval(check, 60000);
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    return () => clearInterval(interval);
  }, [settings.reminderEnabled]);

  const value: AppContextType = {
    blocks, categories, settings, currentDate, viewMode,
    showSummary, showSettings, showCategoryManager,
    setCurrentDate, setViewMode, setShowSummary, setShowSettings, setShowCategoryManager,
    refreshBlocks, upsertBlock: handleUpsertBlock, deleteBlock: handleDeleteBlock,
    updateCategories, updateSettings,
    getBlocksForDate: getBlocksForDateCtx, getBlocksForRange: getBlocksForRangeCtx,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
