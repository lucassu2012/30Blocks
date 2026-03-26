// Local storage layer for 30-Blocks
import { v4 as uuidv4 } from 'uuid';
import type {
  TimeBlock, CategoryLevel1, AppSettings,
} from '../types';

const KEYS = {
  blocks: '30blocks_timeblocks',
  categories: '30blocks_categories',
  settings: '30blocks_settings',
} as const;

// ===== Generic helpers =====

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ===== Time Blocks =====

export function loadBlocks(): TimeBlock[] {
  return loadJSON<TimeBlock[]>(KEYS.blocks, []);
}

export function saveBlocks(blocks: TimeBlock[]): void {
  saveJSON(KEYS.blocks, blocks);
}

export function getBlocksForDate(date: string): TimeBlock[] {
  const all = loadBlocks();
  return all.filter((b) => b.date === date);
}

export function getBlocksForRange(startDate: string, endDate: string): TimeBlock[] {
  const all = loadBlocks();
  return all.filter((b) => b.date >= startDate && b.date <= endDate);
}

export function upsertBlock(block: Partial<TimeBlock> & { date: string; slotIndex: number }): TimeBlock {
  const all = loadBlocks();
  const idx = all.findIndex((b) => b.date === block.date && b.slotIndex === block.slotIndex);

  if (idx >= 0) {
    all[idx] = { ...all[idx], ...block };
    saveBlocks(all);
    return all[idx];
  }

  const slotHour = Math.floor(block.slotIndex / 2);
  const slotMin = (block.slotIndex % 2) * 30;
  const endMin = slotMin + 30;
  const endHour = slotHour + Math.floor(endMin / 60);

  const newBlock: TimeBlock = {
    id: block.id || uuidv4(),
    date: block.date,
    slotIndex: block.slotIndex,
    startTime: `${String(slotHour).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`,
    endTime: `${String(endHour).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`,
    status: block.status || 'empty',
    source: block.source || 'manual',
    categoryL1Id: block.categoryL1Id,
    categoryL2Id: block.categoryL2Id,
    categoryL3Id: block.categoryL3Id,
    customNote: block.customNote,
    mergeGroupId: block.mergeGroupId,
  };

  all.push(newBlock);
  saveBlocks(all);
  return newBlock;
}

export function updateBlock(date: string, slotIndex: number, updates: Partial<TimeBlock>): void {
  const all = loadBlocks();
  const idx = all.findIndex((b) => b.date === date && b.slotIndex === slotIndex);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...updates };
    saveBlocks(all);
  }
}

export function deleteBlock(date: string, slotIndex: number): void {
  const all = loadBlocks();
  const filtered = all.filter((b) => !(b.date === date && b.slotIndex === slotIndex));
  saveBlocks(filtered);
}

export function batchUpsertBlocks(blocks: Array<Partial<TimeBlock> & { date: string; slotIndex: number }>): void {
  blocks.forEach((b) => upsertBlock(b));
}

// ===== Categories =====

export function loadCategories(): CategoryLevel1[] {
  return loadJSON<CategoryLevel1[]>(KEYS.categories, getDefaultCategories());
}

export function saveCategories(categories: CategoryLevel1[]): void {
  saveJSON(KEYS.categories, categories);
}

export function getDefaultCategories(): CategoryLevel1[] {
  return [
    {
      id: uuidv4(),
      name: '工作',
      color: '#3B82F6',
      children: [
        { id: uuidv4(), parentId: '', name: '内部会议', children: [{ id: uuidv4(), parentId: '', name: '例会' }] },
        { id: uuidv4(), parentId: '', name: '外出办公', children: [{ id: uuidv4(), parentId: '', name: '客户拜访' }] },
        { id: uuidv4(), parentId: '', name: '撰写文档', children: [{ id: uuidv4(), parentId: '', name: 'PPT制作' }] },
        { id: uuidv4(), parentId: '', name: '邮件处理', children: [] },
        { id: uuidv4(), parentId: '', name: '项目管理', children: [] },
      ],
    },
    {
      id: uuidv4(),
      name: '学习',
      color: '#10B981',
      children: [
        { id: uuidv4(), parentId: '', name: '在线课程', children: [{ id: uuidv4(), parentId: '', name: 'AI大模型学习' }] },
        { id: uuidv4(), parentId: '', name: '阅读', children: [{ id: uuidv4(), parentId: '', name: '技术书籍' }] },
        { id: uuidv4(), parentId: '', name: '培训', children: [] },
      ],
    },
    {
      id: uuidv4(),
      name: '生活',
      color: '#F59E0B',
      children: [
        { id: uuidv4(), parentId: '', name: '用餐', children: [] },
        { id: uuidv4(), parentId: '', name: '通勤', children: [] },
        { id: uuidv4(), parentId: '', name: '家务', children: [] },
      ],
    },
    {
      id: uuidv4(),
      name: '娱乐',
      color: '#EF4444',
      children: [
        { id: uuidv4(), parentId: '', name: '运动健身', children: [] },
        { id: uuidv4(), parentId: '', name: '社交', children: [] },
        { id: uuidv4(), parentId: '', name: '游戏', children: [] },
        { id: uuidv4(), parentId: '', name: '影视', children: [] },
      ],
    },
    {
      id: uuidv4(),
      name: '休息',
      color: '#8B5CF6',
      children: [
        { id: uuidv4(), parentId: '', name: '睡眠', children: [] },
        { id: uuidv4(), parentId: '', name: '午休', children: [] },
        { id: uuidv4(), parentId: '', name: '放松', children: [] },
      ],
    },
  ];
}

// ===== Settings =====

export function loadSettings(): AppSettings {
  return loadJSON<AppSettings>(KEYS.settings, {
    reminderEnabled: true,
    reminderSound: true,
    theme: 'light',
    outlookConnected: false,
    startHour: 6,
    endHour: 24,
  });
}

export function saveSettings(settings: AppSettings): void {
  saveJSON(KEYS.settings, settings);
}
