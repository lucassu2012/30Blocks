// ===== 30-Blocks Data Models =====

/** 3-level activity category system */
export interface CategoryLevel1 {
  id: string;
  name: string;       // e.g. "工作", "学习", "娱乐"
  color: string;       // hex color for visual coding
  icon?: string;
  children: CategoryLevel2[];
}

export interface CategoryLevel2 {
  id: string;
  parentId: string;
  name: string;       // e.g. "内部会议", "外出办公", "撰写PPT"
  children: CategoryLevel3[];
}

export interface CategoryLevel3 {
  id: string;
  parentId: string;
  name: string;       // e.g. "26年战略分析会", "AI大模型学习"
}

/** A single 30-minute time block */
export interface TimeBlock {
  id: string;
  date: string;           // YYYY-MM-DD
  startTime: string;      // HH:mm (e.g. "09:00")
  endTime: string;        // HH:mm (e.g. "09:30")
  slotIndex: number;      // 0-47 (48 slots per day)

  // Category assignment
  categoryL1Id?: string;
  categoryL2Id?: string;
  categoryL3Id?: string;
  customNote?: string;    // free-text note

  // Block state
  status: BlockStatus;
  source: BlockSource;

  // For merged display
  mergeGroupId?: string;
}

export type BlockStatus = 'empty' | 'planned' | 'recorded' | 'missed';
export type BlockSource = 'manual' | 'outlook' | 'planned';

/** View modes */
export type ViewMode = 'day' | 'week' | 'month';

/** Summary period */
export type SummaryPeriod = 'day' | 'week' | 'month' | 'year';

/** Outlook calendar event (imported) */
export interface OutlookEvent {
  id: string;
  subject: string;
  start: string;          // ISO datetime
  end: string;
  isAllDay: boolean;
  categoryL1Id?: string;
  categoryL2Id?: string;
}

/** Reminder state */
export interface ReminderState {
  enabled: boolean;
  lastPromptedSlot: number;
  lastPromptedDate: string;
}

/** App settings */
export interface AppSettings {
  reminderEnabled: boolean;
  reminderSound: boolean;
  theme: 'light' | 'dark';
  outlookConnected: boolean;
  startHour: number;      // default display start hour (e.g. 6)
  endHour: number;        // default display end hour (e.g. 23)
}

/** Time summary statistics */
export interface TimeSummary {
  period: SummaryPeriod;
  startDate: string;
  endDate: string;
  totalBlocks: number;
  recordedBlocks: number;
  plannedBlocks: number;
  missedBlocks: number;
  categoryBreakdown: CategoryStat[];
}

export interface CategoryStat {
  categoryL1Id: string;
  categoryL1Name: string;
  color: string;
  totalBlocks: number;
  percentage: number;
  subcategories: {
    categoryL2Id: string;
    categoryL2Name: string;
    totalBlocks: number;
    percentage: number;
  }[];
}
