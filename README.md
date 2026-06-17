# AI Novel Writer

移动端优先的 AI 小说写作工作台 MVP。

## 已实现

- 小说 CRUD、章节 CRUD、章节排序
- 移动端章节编辑器
- IndexedDB 本地草稿
- 1.5 秒自动保存、手动保存
- `versionNo` 冲突检测
- 历史版本、回滚、任意版本 Diff
- DeepSeek AI 续写 / 改写 / 润色 / 缩写预览
- AI 结果确认后写入正文并生成历史版本
- 角色、世界观、大纲管理
- TXT / Markdown / JSON 导出
- Prisma PostgreSQL schema

当前运行使用 `.data/db.json` 本地文件存储，方便无数据库启动。`prisma/schema.prisma` 已按 PostgreSQL 设计保留，后续可把服务层替换为 Prisma 实现。

## 开发

```bash
pnpm install
pnpm dev
```

访问 `http://localhost:3000`。

## AI 配置

复制 `.env.example` 为 `.env`，填入：

```env
DEEPSEEK_API_KEY="sk-xxx"
```

未配置 key 时，AI 接口会返回本地 mock 内容，便于完整测试预览和落库流程。

## 数据

本地开发数据写入 `.data/db.json`，该目录已加入 `.gitignore`。
