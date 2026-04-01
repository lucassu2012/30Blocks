# 30-Blocks 时间管理工具

一款基于 30 分钟时间块的高效时间管理应用。将每天划分为 48 个时间块，帮助你精确记录、规划和分析时间使用情况。

## 在线体验

[https://lucassu2012.github.io/30Blocks/](https://lucassu2012.github.io/30Blocks/)

## 功能特性

### 核心功能
- **48 时间块系统** — 每天 24 小时 × 每小时 2 个块 = 48 个 30 分钟时间块
- **三种视图模式** — 日视图、周视图、月视图，灵活切换
- **三级活动分类** — 支持自定义的三级分类体系（如：工作 → 内部会议 → 例会）
- **时间块编辑** — 点击任意时间块进行分类标记和备注

### 数据分析
- **时间总结** — 按日/周/月/年统计时间分配
- **分类统计** — 可视化展示各分类占比和时间分布
- **连续块合并** — 自动合并相邻同类时间块，简化展示

### 集成与提醒
- **Outlook 日历导入** — 支持 ICS 文件导入，自动映射到时间块
- **浏览器通知提醒** — 定时提醒记录当前时间块
- **数据导入/导出** — JSON 格式，方便备份和迁移

### 桌面应用
- **Windows 桌面版** — 基于 Electron 打包，支持便携版和安装版

## 默认分类

| 一级分类 | 二级分类示例 | 颜色 |
|---------|------------|------|
| 工作 | 内部会议、外出办公、撰写文档、邮件处理、项目管理 | 蓝色 |
| 学习 | 在线课程、阅读、培训 | 绿色 |
| 生活 | 用餐、通勤、家务 | 黄色 |
| 娱乐 | 运动健身、社交、游戏、影视 | 红色 |
| 休息 | 睡眠、午休、放松 | 紫色 |

所有分类均可在"分类管理"中自定义修改。

## 技术栈

| 技术 | 用途 |
|-----|------|
| React 19 | UI 框架 |
| TypeScript | 类型安全 |
| Vite 8 | 构建工具 |
| date-fns | 日期处理 |
| lucide-react | 图标库 |
| Electron 41 | 桌面应用打包 |
| electron-builder | Windows 安装包构建 |
| LocalStorage | 数据持久化 |

## 快速开始

### 环境要求
- Node.js 20+
- npm 10+

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/lucassu2012/30Blocks.git
cd 30Blocks

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

浏览器访问 `http://localhost:5173` 即可使用。

### 构建生产版本

```bash
# 构建 Web 版本
npm run build

# 预览构建结果
npm run preview
```

### 构建 Windows 桌面版

```bash
# 构建 Windows 安装包（需要 Windows 环境）
npm run electron:build

# 构建便携版
npm run electron:build:portable
```

构建产物位于 `release/` 目录。

## 项目结构

```
30Blocks/
├── src/
│   ├── components/
│   │   ├── blocks/          # 时间块编辑组件
│   │   │   └── BlockEditModal.tsx
│   │   ├── categories/      # 分类管理组件
│   │   │   └── CategoryManager.tsx
│   │   ├── common/          # 通用组件
│   │   │   ├── Header.tsx
│   │   │   └── SettingsPanel.tsx
│   │   ├── outlook/         # Outlook 集成
│   │   │   └── OutlookPanel.tsx
│   │   ├── summary/         # 时间总结
│   │   │   └── SummaryPanel.tsx
│   │   └── views/           # 视图组件
│   │       ├── DayView.tsx
│   │       ├── WeekView.tsx
│   │       └── MonthView.tsx
│   ├── store/
│   │   ├── AppContext.tsx    # 全局状态管理 (React Context)
│   │   └── storage.ts       # LocalStorage 持久化层
│   ├── types/
│   │   └── index.ts         # TypeScript 类型定义
│   ├── utils/
│   │   └── time.ts          # 时间工具函数
│   ├── App.tsx              # 根组件
│   ├── main.tsx             # 入口文件
│   └── index.css            # 全局样式
├── electron/
│   └── main.cjs             # Electron 主进程
├── .github/workflows/
│   ├── build-windows.yml    # Windows EXE 构建 CI
│   └── deploy-pages.yml     # GitHub Pages 部署 CI
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## CI/CD

本项目配置了两个 GitHub Actions 工作流：

- **Deploy to GitHub Pages** — 每次推送到 `main` 分支自动部署 Web 版本
- **Build Windows EXE** — 推送 `v*` 标签时自动构建 Windows 安装包并创建 Release

## 数据存储

所有数据存储在浏览器的 LocalStorage 中：

| Key | 内容 |
|-----|------|
| `30blocks_timeblocks` | 时间块数据 |
| `30blocks_categories` | 分类配置 |
| `30blocks_settings` | 应用设置 |

支持通过设置面板导出为 JSON 文件备份，也可从 JSON 文件导入恢复。

## License

MIT
