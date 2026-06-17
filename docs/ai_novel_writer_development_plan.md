# AI 小说创作网站工具完整落地开发方案

> 适用场景：自用网站、移动端优先、DeepSeek 长上下文写作、网页端同步、修改历史、版本 Diff 对比、版本回滚。

---

## 1. 产品目标

做一个移动端优先的 AI 小说创作网站工具，核心能力包括：

- 小说项目管理
- 分卷与章节管理
- 移动端章节编辑器
- DeepSeek AI 续写、改写、润色
- 角色、世界观、大纲管理
- 本地草稿防丢失
- 网页端自动同步
- 修改历史
- 任意版本 Diff 对比
- 版本回滚
- TXT / Markdown 导出

第一版不做多人协作、不做实时协同、不做社区发布、不做复杂富文本。

---

## 2. MVP 定位

第一版目标：

> 一个手机上好用的自用 AI 小说编辑器，支持 DeepSeek 续写 / 改写 / 润色，自动保存，历史版本，Diff 对比和回滚。

MVP 必须包含：

1. 登录
2. 小说 CRUD
3. 章节 CRUD
4. 移动端章节编辑器
5. IndexedDB 本地草稿
6. 自动保存
7. 手动保存
8. 版本历史
9. Diff 对比
10. 版本回滚
11. DeepSeek 续写
12. DeepSeek 润色
13. DeepSeek 改写选中文本
14. 角色管理
15. 世界观管理

MVP 不做：

- 多人协作
- WebSocket 实时同步
- CRDT
- 复杂富文本
- 社区发布
- 支付系统
- App 原生端
- 实时全文 Diff
- 全书级实时分析

---

## 3. 技术栈总览

| 层级 | 技术 | 用途 |
|---|---|---|
| 前端框架 | Next.js App Router | 全栈 Web 框架 |
| 语言 | TypeScript | 前后端统一类型 |
| UI | Tailwind CSS | 移动端样式 |
| 组件库 | shadcn/ui | 快速搭 UI |
| 图标 | lucide-react | 图标库 |
| 状态管理 | Zustand | 编辑器状态、AI 面板状态 |
| 请求缓存 | TanStack Query | API 请求、缓存、刷新 |
| 表单 | React Hook Form | 表单状态 |
| 校验 | Zod | 入参、表单校验 |
| 编辑器 | textarea / Markdown | MVP 稳定方案 |
| 数据库 | PostgreSQL | 主数据库 |
| ORM | Prisma | 数据模型、迁移、类型生成 |
| 本地草稿 | IndexedDB | 防丢稿、离线暂存 |
| IndexedDB 封装 | idb | 简化 IndexedDB 操作 |
| AI 模型 | DeepSeek V4 Pro / Flash | 小说续写、改写、润色 |
| Diff | jsdiff | 文本差异对比 |
| 对象存储 | Cloudflare R2，可选 | 导出文件、备份文件 |
| 部署 | Vercel / VPS | 网站部署 |
| 鉴权 | NextAuth / 自定义登录 | 自用登录 |
| 包管理 | pnpm | 依赖管理 |

---

## 4. 推荐架构

```txt
Browser / Mobile Web / PWA
        ↓
Next.js App Router
        ↓
Route Handlers / Server Actions
        ↓
业务服务层
├── NovelService
├── ChapterService
├── VersionService
├── DiffService
├── AIService
├── ContextBuilder
└── ExportService
        ↓
PostgreSQL + Prisma
        ↓
DeepSeek API
```

核心原则：

1. `chapters` 表保存当前正文。
2. `chapter_versions` 表保存历史快照。
3. IndexedDB 保存本地草稿，防止刷新、断网、同步失败导致丢稿。
4. Diff 按需计算，不实时计算。
5. 网页端同步用 HTTP 自动保存，不做 WebSocket。
6. 不做多人实时协同，只做 `versionNo` 冲突检测。
7. AI 生成内容先进入预览，用户确认后才写入正文。
8. 版本保存完整正文，不只保存 diff。

---

## 5. 项目目录结构

```txt
novel-ai-writer/
├── app/
│   ├── page.tsx
│   ├── login/
│   ├── novels/
│   │   ├── page.tsx
│   │   └── [novelId]/
│   │       ├── page.tsx
│   │       ├── chapters/
│   │       │   └── [chapterId]/
│   │       │       ├── page.tsx
│   │       │       ├── history/
│   │       │       └── diff/
│   │       ├── characters/
│   │       ├── world/
│   │       └── outline/
│   │
│   └── api/
│       ├── novels/
│       ├── chapters/
│       ├── versions/
│       ├── ai/
│       ├── diff/
│       └── export/
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── editor/
│   ├── ai/
│   ├── diff/
│   └── version/
│
├── features/
│   ├── novels/
│   ├── chapters/
│   ├── editor/
│   ├── ai/
│   ├── versions/
│   ├── diff/
│   ├── characters/
│   └── world/
│
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   ├── deepseek.ts
│   ├── diff.ts
│   ├── indexeddb.ts
│   ├── word-count.ts
│   └── utils.ts
│
├── server/
│   ├── services/
│   │   ├── novel.service.ts
│   │   ├── chapter.service.ts
│   │   ├── version.service.ts
│   │   ├── ai.service.ts
│   │   ├── context-builder.service.ts
│   │   └── diff.service.ts
│   └── prompts/
│       ├── continue.ts
│       ├── rewrite.ts
│       ├── polish.ts
│       ├── outline.ts
│       └── consistency.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── public/
├── .env
├── package.json
└── README.md
```

---

## 6. 核心页面设计

### 6.1 `/login`

自用网站可以简单实现：

- 邮箱 + 密码
- 或者管理员密码
- 或者 GitHub 登录

---

### 6.2 `/novels`

小说列表页。

展示：

- 小说标题
- 类型
- 总字数
- 最近编辑时间
- 最近章节
- 新建小说按钮

---

### 6.3 `/novels/[novelId]`

小说详情页。

Tab：

- 章节
- 大纲
- 角色
- 世界观
- 历史
- 设置

---

### 6.4 `/novels/[novelId]/chapters/[chapterId]`

章节编辑页。

移动端布局：

```txt
顶部：
- 返回
- 章节标题
- 保存状态
- 更多

中间：
- 正文编辑器

底部：
- 续写
- 润色
- 改写
- 历史
- 更多 AI
```

---

### 6.5 `/novels/[novelId]/chapters/[chapterId]/history`

版本历史页。

展示：

```txt
今天 15:31  AI 续写  +1200 字
今天 15:10  手动保存  3500 字
今天 14:55  自动保存  3400 字
```

操作：

- 查看
- 对比
- 回滚
- 复制

---

### 6.6 `/novels/[novelId]/chapters/[chapterId]/diff`

Diff 对比页。

功能：

- 选择版本 A
- 选择版本 B
- 查看差异
- 只看变化
- 回滚到指定版本
- 复制指定版本内容

移动端不要左右分栏，使用单栏合并视图。

---

## 7. 前端组件清单

```txt
components/editor/ChapterEditor.tsx
components/editor/EditorHeader.tsx
components/editor/EditorTextarea.tsx
components/editor/AIActionBar.tsx
components/editor/AIPreviewDrawer.tsx

components/version/VersionTimeline.tsx
components/version/VersionCard.tsx
components/version/RollbackButton.tsx

components/diff/DiffViewer.tsx
components/diff/DiffBlock.tsx
components/diff/VersionSelector.tsx

components/ai/AICommandSheet.tsx
components/ai/AIResultPreview.tsx
components/ai/AIModelSelector.tsx

components/novel/NovelCard.tsx
components/chapter/ChapterList.tsx
components/character/CharacterForm.tsx
components/world/WorldSettingForm.tsx
```

---

## 8. 数据库设计

### 8.1 Prisma Schema

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  password  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  novels    Novel[]
}

model Novel {
  id             String   @id @default(uuid())
  userId         String
  title          String
  genre          String?
  style          String?
  synopsis       String?
  status         String   @default("draft")
  totalWordCount Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  volumes        Volume[]
  chapters       Chapter[]
  versions       ChapterVersion[]
  characters     Character[]
  worldSettings  WorldSetting[]
  outlines       Outline[]
  aiJobs         AIJob[]
}

model Volume {
  id          String   @id @default(uuid())
  novelId     String
  title       String
  description String?
  orderIndex  Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  novel        Novel    @relation(fields: [novelId], references: [id], onDelete: Cascade)
  chapters     Chapter[]
}

model Chapter {
  id          String   @id @default(uuid())
  novelId     String
  volumeId    String?
  title       String
  content     String   @default("")
  summary     String?
  wordCount   Int      @default(0)
  orderIndex  Int
  status      String   @default("draft")
  versionNo   Int      @default(1)
  contentHash String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  novel        Novel    @relation(fields: [novelId], references: [id], onDelete: Cascade)
  volume       Volume?  @relation(fields: [volumeId], references: [id], onDelete: SetNull)
  versions     ChapterVersion[]
  aiJobs       AIJob[]

  @@index([novelId, orderIndex])
}

model ChapterVersion {
  id              String   @id @default(uuid())
  novelId          String
  chapterId        String
  userId           String
  title            String?
  content          String
  wordCount        Int      @default(0)
  versionNo        Int
  source           String
  sourceLabel      String?
  aiModel          String?
  aiJobId          String?
  promptSnapshot   String?
  parentVersionId  String?
  contentHash      String?
  createdAt        DateTime @default(now())

  novel            Novel    @relation(fields: [novelId], references: [id], onDelete: Cascade)
  chapter          Chapter  @relation(fields: [chapterId], references: [id], onDelete: Cascade)

  @@index([chapterId, createdAt])
  @@index([novelId, createdAt])
}

model Character {
  id                String   @id @default(uuid())
  novelId            String
  name              String
  alias             String?
  role              String?
  gender            String?
  age               String?
  appearance        String?
  personality       String?
  background        String?
  motivation        String?
  speechStyle       String?
  relationshipNotes String?
  status            String   @default("active")
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  novel             Novel    @relation(fields: [novelId], references: [id], onDelete: Cascade)

  @@index([novelId, name])
}

model WorldSetting {
  id          String   @id @default(uuid())
  novelId     String
  category    String
  title       String
  content     String
  importance  Int      @default(3)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  novel        Novel    @relation(fields: [novelId], references: [id], onDelete: Cascade)

  @@index([novelId, category])
}

model Outline {
  id          String   @id @default(uuid())
  novelId     String
  volumeId    String?
  chapterId   String?
  type        String
  title       String?
  content     String
  orderIndex  Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  novel        Novel    @relation(fields: [novelId], references: [id], onDelete: Cascade)

  @@index([novelId, type])
}

model AIJob {
  id            String   @id @default(uuid())
  userId        String
  novelId       String
  chapterId     String?
  task          String
  status        String   @default("pending")
  model         String
  inputMessages Json?
  outputText    String?
  inputTokens   Int?
  outputTokens  Int?
  errorMessage  String?
  startedAt     DateTime?
  finishedAt    DateTime?
  createdAt     DateTime @default(now())

  novel         Novel    @relation(fields: [novelId], references: [id], onDelete: Cascade)
  chapter       Chapter? @relation(fields: [chapterId], references: [id], onDelete: SetNull)

  @@index([novelId, createdAt])
  @@index([chapterId, createdAt])
}
```

---

## 9. API 设计

### 9.1 小说接口

```txt
GET    /api/novels
POST   /api/novels
GET    /api/novels/:novelId
PATCH  /api/novels/:novelId
DELETE /api/novels/:novelId
```

---

### 9.2 章节接口

```txt
GET    /api/novels/:novelId/chapters
POST   /api/novels/:novelId/chapters
GET    /api/chapters/:chapterId
PATCH  /api/chapters/:chapterId
DELETE /api/chapters/:chapterId
POST   /api/chapters/:chapterId/reorder
```

`PATCH /api/chapters/:chapterId` 入参：

```ts
type UpdateChapterRequest = {
  title?: string;
  content?: string;
  baseVersionNo: number;
  createVersion?: boolean;
  versionSource?: "manual_save" | "auto_save" | "ai_continue" | "ai_rewrite" | "ai_polish";
};
```

后端逻辑：

```txt
1. 查询当前 chapter.versionNo
2. 如果 baseVersionNo 不等于当前 versionNo，返回冲突
3. 如果一致，更新 content
4. versionNo + 1
5. 根据 createVersion 决定是否写入 chapter_versions
```

---

### 9.3 版本接口

```txt
GET  /api/chapters/:chapterId/versions
POST /api/chapters/:chapterId/versions
GET  /api/versions/:versionId
POST /api/chapters/:chapterId/rollback
```

---

### 9.4 Diff 接口

```txt
GET /api/diff?fromVersionId=xxx&toVersionId=yyy
```

返回：

```ts
type DiffBlock = {
  type: "same" | "added" | "removed" | "changed";
  oldText?: string;
  newText?: string;
  paragraphIndex?: number;
};

type DiffResponse = {
  fromVersionId: string;
  toVersionId: string;
  blocks: DiffBlock[];
};
```

---

### 9.5 AI 接口

```txt
POST /api/ai/continue
POST /api/ai/rewrite
POST /api/ai/polish
POST /api/ai/expand
POST /api/ai/shorten
POST /api/ai/generate-title
POST /api/ai/generate-outline
POST /api/ai/check-consistency
```

统一入参：

```ts
type AIWriteRequest = {
  novelId: string;
  chapterId?: string;
  selectedText?: string;
  instruction?: string;
  targetWords?: number;
  modelMode?: "fast" | "pro";
};
```

统一返回：

```ts
type AIWriteResponse = {
  jobId: string;
  content: string;
  model: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
};
```

---

## 10. DeepSeek 服务封装

```ts
type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function callDeepSeek(params: {
  model: "deepseek-v4-pro" | "deepseek-v4-flash";
  messages: ChatMessage[];
  temperature?: number;
  stream?: boolean;
}) {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.8,
      stream: params.stream ?? false,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`DeepSeek API error: ${errorText}`);
  }

  return res.json();
}
```

模型分工建议：

```txt
deepseek-v4-flash：
- 润色
- 标题
- 摘要
- 短段落改写
- 检查错别字

deepseek-v4-pro：
- 长章节续写
- 多章节上下文续写
- 全书设定分析
- 人物一致性检查
- 复杂剧情规划
```

---

## 11. AI 上下文构建方案

不要每次把整本小说都塞进去。即使模型支持长上下文，也要控制成本、速度和噪音。

上下文组装顺序：

```txt
小说基础信息
↓
写作风格
↓
重要角色
↓
世界观设定
↓
当前大纲
↓
前文摘要
↓
最近 3-5 章正文
↓
当前章节正文
↓
用户选中文本
↓
用户指令
```

不同任务上下文：

| 任务 | 上下文 |
|---|---|
| 续写 | 小说信息、角色、世界观、大纲、前文摘要、最近章节、当前章节 |
| 润色 | 写作风格、选中文本、少量前后文 |
| 改写 | 选中文本、前后各 500-1000 字、用户要求 |
| 扩写 | 选中文本、当前章节、写作风格 |
| 缩写 | 选中文本 |
| 生成大纲 | 全书简介、当前进度、角色目标、最近剧情摘要 |
| 一致性检查 | 角色设定、世界观、当前章节、最近章节摘要 |

---

## 12. Prompt 模板

### 12.1 系统 Prompt

```txt
你是一名专业中文网络小说作者、编辑和剧情策划。

你需要遵守以下规则：
1. 保持人物性格一致
2. 保持世界观设定一致
3. 保持剧情连续
4. 不要擅自推翻已有设定
5. 不要重复已有内容
6. 不要输出解释
7. 不要总结你的写作过程
8. 直接输出可用正文
9. 使用中文
```

---

### 12.2 续写 Prompt

```txt
【小说信息】
标题：{{novel.title}}
类型：{{novel.genre}}
风格：{{novel.style}}
简介：{{novel.synopsis}}

【重要角色】
{{characters}}

【世界观设定】
{{worldSettings}}

【当前大纲】
{{outline}}

【前文摘要】
{{previousSummary}}

【最近章节原文】
{{recentChapters}}

【当前章节】
标题：{{chapter.title}}
正文：
{{chapter.content}}

【任务】
请从当前章节结尾自然续写 {{targetWords}} 字。

【要求】
1. 不要重复当前章节已有内容
2. 保持人物语言和行为一致
3. 推动剧情向前发展
4. 保持小说原有文风
5. 结尾留下轻微悬念
6. 只输出正文
```

---

### 12.3 改写 Prompt

```txt
【写作风格】
{{novel.style}}

【前文】
{{beforeText}}

【需要改写的文本】
{{selectedText}}

【后文】
{{afterText}}

【用户要求】
{{instruction}}

【任务】
请改写“需要改写的文本”。

【要求】
1. 保持原意
2. 不破坏前后衔接
3. 不新增重大设定
4. 不改变人物关系
5. 只输出改写后的文本
```

---

### 12.4 润色 Prompt

```txt
【文本】
{{selectedText}}

【任务】
请润色这段小说文本。

【要求】
1. 保持原意
2. 提升画面感和节奏
3. 不改变人物关系
4. 不添加新剧情
5. 只输出润色后的文本
```

---

## 13. 同步方案

### 13.1 服务器与本地职责

```txt
PostgreSQL = 最终正文
IndexedDB = 本地临时草稿
```

### 13.2 编辑保存流程

```txt
用户输入
↓
立即写 IndexedDB
↓
停止输入 1.5 秒
↓
PATCH /api/chapters/:chapterId
↓
服务器保存 chapters.content
↓
返回新的 versionNo
↓
前端更新同步状态
```

### 13.3 版本创建流程

手动保存：

```txt
手动保存
↓
更新 chapters.content
↓
创建 chapter_versions 快照
```

AI 修改确认：

```txt
AI 修改确认
↓
更新 chapters.content
↓
创建 chapter_versions 快照
```

自动保存：

```txt
自动保存
↓
只更新 chapters.content
↓
满足时间和字数阈值时才创建 auto_save 版本
```

### 13.4 冲突检测

保存时带上：

```ts
{
  content: string;
  baseVersionNo: number;
}
```

后端判断：

```txt
如果 baseVersionNo == 当前 versionNo：
    正常保存
否则：
    返回 conflict
```

冲突提示：

```txt
该章节已在其他设备更新。
你可以：
1. 使用服务器版本
2. 覆盖服务器版本
3. 保存本地内容为新版本
4. 查看差异
```

---

## 14. IndexedDB 本地草稿设计

### 14.1 存储结构

```ts
type LocalDraft = {
  chapterId: string;
  novelId: string;
  title: string;
  content: string;
  baseVersionNo: number;
  updatedAt: string;
  syncedAt?: string;
  syncStatus: "local" | "syncing" | "synced" | "conflict";
};
```

### 14.2 使用规则

```txt
1. 每次输入立即保存 IndexedDB
2. 服务端保存成功后更新 syncedAt
3. 打开章节时先检查本地草稿
4. 如果本地草稿比服务器更新，提示恢复
5. 如果服务器版本更新，则提示冲突或加载服务器版本
```

---

## 15. 版本历史设计

### 15.1 版本来源

```txt
manual_save      手动保存
auto_save        自动保存
ai_continue      AI 续写
ai_rewrite       AI 改写
ai_polish        AI 润色
rollback         回滚
import           导入
```

### 15.2 创建版本的时机

```txt
1. 用户手动保存
2. AI 续写确认插入
3. AI 改写确认替换
4. AI 润色确认替换
5. 用户回滚版本
6. 导入外部文本
7. 自动保存达到间隔阈值
```

### 15.3 自动版本规则

```txt
距离上一个自动版本超过 60 秒
并且字数变化超过 20 字
才创建 auto_save 版本
```

### 15.4 为什么版本存完整正文

建议每个版本保存完整正文，而不是只保存 diff。

原因：

1. 回滚简单。
2. 容灾简单。
3. 任意两个版本都能对比。
4. 不依赖固定 diff 算法。
5. 小说章节文本体积可控。

---

## 16. Diff 实现方案

### 16.1 核心原则

```txt
1. 不实时 Diff
2. 不整本 Diff
3. 不移动端左右分栏
4. 只在用户打开版本对比时按需计算
5. 默认做章节级 Diff
6. 默认按段落 Diff
```

### 16.2 后端 Diff 示例

```ts
import { diffLines, diffWords } from "diff";

export function createParagraphDiff(oldText: string, newText: string) {
  const oldParagraphs = oldText.split(/\n{2,}/);
  const newParagraphs = newText.split(/\n{2,}/);

  const oldJoined = oldParagraphs.join("\n\n");
  const newJoined = newParagraphs.join("\n\n");

  return diffLines(oldJoined, newJoined);
}
```

### 16.3 移动端展示方案

使用单栏合并视图：

```txt
绿色背景：新增
红色删除线：删除
黄色背景：修改
灰色折叠：未变化内容
```

不要默认做左右两栏，因为手机上可读性很差。

### 16.4 Diff 缓存，可选

第一版不需要缓存 Diff。

如果后续章节变长、对比频繁，可以加：

```prisma
model VersionDiff {
  id            String   @id @default(uuid())
  fromVersionId String
  toVersionId   String
  diffJson       Json
  createdAt      DateTime @default(now())

  @@unique([fromVersionId, toVersionId])
}
```

---

## 17. AI 结果落库策略

AI 结果不要直接覆盖正文。

正确流程：

```txt
用户点击 AI 续写
↓
后端创建 ai_job
↓
DeepSeek 返回结果
↓
结果存到 ai_jobs.outputText
↓
前端展示预览
↓
用户点击“插入”
↓
更新 chapters.content
↓
创建 chapter_versions
```

AI 预览按钮：

```txt
插入到光标处
替换选中文本
追加到章节末尾
重新生成
复制
放弃
```

---

## 18. 环境变量

```env
DATABASE_URL="postgresql://user:password@localhost:5432/novel_ai"
DEEPSEEK_API_KEY="sk-xxx"
NEXTAUTH_SECRET="xxx"
NEXTAUTH_URL="http://localhost:3000"

R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""
R2_PUBLIC_URL=""
```

---

## 19. 安装依赖

```bash
pnpm create next-app novel-ai-writer --ts --tailwind --eslint --app
cd novel-ai-writer

pnpm add @prisma/client
pnpm add -D prisma

pnpm add zustand @tanstack/react-query
pnpm add react-hook-form zod @hookform/resolvers
pnpm add diff
pnpm add idb
pnpm add lucide-react
pnpm add date-fns
pnpm add clsx tailwind-merge
```

初始化 shadcn/ui：

```bash
pnpm dlx shadcn@latest init
```

初始化 Prisma：

```bash
pnpm prisma init
pnpm prisma migrate dev --name init
pnpm prisma generate
```

---

## 20. 开发里程碑

### 第 1 阶段：项目基础

目标：项目能跑起来。

任务：

- 初始化 Next.js
- 配置 Tailwind
- 配置 shadcn/ui
- 配置 Prisma
- 连接 PostgreSQL
- 创建基础表
- 完成登录

验收：

- 能登录
- 能访问后台页面
- 数据库迁移成功

---

### 第 2 阶段：小说和章节 CRUD

目标：能创建小说、章节。

任务：

- 小说列表
- 新建小说
- 小说详情
- 章节列表
- 新建章节
- 编辑章节标题
- 删除章节
- 章节排序

验收：

- 能创建一本小说
- 能创建多个章节
- 章节顺序正确

---

### 第 3 阶段：移动端编辑器

目标：手机上能写。

任务：

- 章节编辑页
- textarea 编辑器
- 字数统计
- 自动保存状态
- IndexedDB 本地草稿
- 服务端自动保存
- 手动保存
- versionNo 冲突检测

验收：

- 刷新不丢稿
- 网络失败有本地草稿
- 手动保存创建版本

---

### 第 4 阶段：版本历史

目标：每次关键修改都有记录。

任务：

- chapter_versions 表
- 版本时间线
- 版本详情
- 手动保存版本
- AI 修改版本
- 自动保存版本
- 回滚版本

验收：

- 可以查看历史版本
- 可以回滚到任意版本
- 回滚也会生成新版本

---

### 第 5 阶段：Diff 对比

目标：知道 AI 和自己改了哪里。

任务：

- Diff 接口
- 段落级 Diff
- 移动端单栏 Diff
- 版本 A/B 选择
- 只看变化内容
- 回滚按钮

验收：

- 任意两个版本可以对比
- 手机上可读
- 长章节不卡顿

---

### 第 6 阶段：DeepSeek AI 接入

目标：AI 能真实辅助写作。

任务：

- DeepSeek API 封装
- AIJob 记录
- Prompt 模板
- Context Builder
- 续写
- 润色
- 改写
- 扩写
- 缩写
- AI 结果预览
- 确认后写入正文和版本

验收：

- AI 结果不会直接污染正文
- 用户确认后才插入
- AI 插入后自动创建历史版本

---

### 第 7 阶段：角色、世界观、大纲

目标：长篇上下文更稳定。

任务：

- 角色管理
- 世界观管理
- 大纲管理
- 重要设定标记
- AI 调用时注入上下文
- 章节摘要
- 最近章节注入

验收：

- AI 续写能参考角色和世界观
- 不会轻易忘设定

---

### 第 8 阶段：导出和备份

目标：数据安全。

任务：

- 导出 TXT
- 导出 Markdown
- 备份整本小说 JSON
- 可选接入 R2

验收：

- 能导出整本小说
- 能导出全部设定和章节

---

## 21. 最终开发顺序建议

推荐按这个顺序开发：

```txt
1. Next.js + PostgreSQL + Prisma 基础项目
2. 登录
3. 小说 CRUD
4. 章节 CRUD
5. 移动端编辑器
6. IndexedDB 本地草稿
7. 自动保存 + versionNo 冲突检测
8. 手动保存 + 版本历史
9. Diff 对比
10. DeepSeek AI 续写
11. AI 改写 / 润色
12. AI 结果预览 + 确认落库
13. 角色管理
14. 世界观管理
15. Context Builder
16. 导出和备份
```

---

## 22. 最终技术结论

第一版技术栈：

```txt
Next.js App Router
TypeScript
Tailwind CSS
shadcn/ui
Zustand
TanStack Query
React Hook Form
Zod
PostgreSQL
Prisma
IndexedDB
DeepSeek V4 Pro / V4 Flash
jsdiff
Cloudflare R2，可选
Vercel / VPS 部署
```

核心工程取舍：

```txt
正文同步：HTTP 自动保存
防丢稿：IndexedDB
历史版本：完整快照
Diff：按需计算
AI 结果：先预览，确认后落库
长上下文：Context Builder 分层注入
移动端：textarea 优先，不急着上复杂富文本
```

第一版不要追求复杂架构，先把“写作体验 + AI 修改 + 历史版本 + Diff 回滚”这个闭环做好。
