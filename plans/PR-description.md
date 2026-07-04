# PR: 搜索缓存系统 + 异步并行搜索 + 查询扩展阈值

## 变更概述

本 PR 包含三项性能优化和功能增强：

1. **搜索缓存系统** — 管理员预设高频词扩展（长期记忆）+ 搜索结果自动缓存（短期内存）
2. **异步并行搜索** — 原词搜索与 LLM 扩展搜索并行执行，互不阻塞
3. **查询扩展阈值** — 搜索词超过指定长度时跳过 LLM 调用，减少不必要的 token 消耗

---

## 1. 搜索缓存系统

### 长期缓存（管理员预设）

管理员可在管理后台预设高频关键词及其扩展词，命中后直接用扩展词联合检索，**完全跳过 LLM 调用**。

```
搜索 "HRT"
  → 命中长期缓存
  → 自动用 "HRT，激素治疗，激素替代疗法，性别肯定激素治疗" 检索
  → 不调 LLM，0 额外 token
```

### 短期缓存（自动）

每次搜索完成后，结果自动缓存 5 分钟（内存），相同关键词重复搜索直接从内存返回（~0.1ms）。

### 搜索流程

```
请求 → ①短期缓存(内存) → 命中？直接返回
      → ②长期缓存(KV)  → 命中？用预设扩展词搜索
      → ③缓存未命中     → Path A(原词embed) + Path B(LLM扩展) 并行
                           ↓
                        存入短期缓存 → rerank → 返回
```

## 2. 异步并行搜索

之前 `expandQuery()` 是 `await` 阻塞的，LLM 扩展完成才做 embedding。现在：

```
Path A: 原词 → embed + textToSparse → Qdrant 搜索（立即执行）
Path B: LLM 异步扩展 → embed + textToSparse → Qdrant 搜索（后台执行）
         ↓
    Promise.all() 等待两端 → 合并去重 → rerank
```

- Path A 不等待 LLM，直接搜索原词
- Path B 在后台异步执行，结果补充进候选池
- 两端结果按 article_id 去重合并后统一 rerank

## 3. 查询扩展阈值

新增环境变量 `QUERY_EXPAND_THRESHOLD`（默认 `15`），搜索词超过此字符数时**跳过 LLM 扩展**，直接使用原词搜索。

```
搜索 "HRT"           → 3字  ≤ 15 → 调 LLM 扩展
搜索 "如何开始激素治疗" → 7字  ≤ 15 → 调 LLM 扩展
搜索 "性别肯定激素治疗的副作用" → 12字 > 15 → 不调 LLM，直接搜索
```

## 新增配置

| 环境变量 | 默认值 | 说明 |
|----------|--------|------|
| `QUERY_EXPAND_THRESHOLD` | `15` | 查询扩展触发阈值（字符数），超过此长度不调 LLM |

## 新增 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/admin/cache/keywords` | GET | 获取全部高频词缓存 |
| `/admin/cache/keywords` | PUT | 添加/更新高频词缓存 `{keyword, expansions[]}` |
| `/admin/cache/keywords/:keyword` | DELETE | 删除指定高频词 |
| `/admin/cache/clear` | POST | 清除所有短期缓存 |

- 关键词查找**大小写不敏感**（`HRT` / `hrt` / `Hrt` 均匹配）
- CORS `allowMethods` 新增 `PUT` 方法

## 其他改进

- **rerankTopK 调整**：从 `topK * 2` 改为 `Math.ceil(topK * 1.5)`，减少冗余召回
- **CORS 修复**：`allowMethods` 增加 `PUT`，修复管理后台缓存操作被浏览器拦截的问题
- **搜索耗时显示**：3000 前端和 8080 前端搜索结果旁显示 `本次搜索 xxx ms`
- **移动端适配**：两个前端页面补充响应式样式（≤640px / ≤768px / ≤480px）
- **Nuxt 局域网访问**：`nuxt dev` 增加 `--host 0.0.0.0`
- **管理后台缓存管理 UI**：独立管理后台侧边栏新增「缓存管理」入口
- **Nuxt 配置页**：新增「扩展触发阈值」和「高频词缓存」管理面板
- **关于与致谢页面**：3000 前端新增 `/about` 页面，8080 前端 footer 新增弹窗（GPL-3.0 许可 + 技术致谢）
- **README 更新**：补充新特性说明和更新后的仓库结构

## 修改文件

### 后端 (backend-cf)

| 文件 | 变更 |
|------|------|
| [`src/cache.ts`](backend-cf/src/cache.ts) | **新增** — 缓存核心逻辑：长期缓存（KV 持久化）、短期缓存（内存 Map + 5min TTL） |
| [`src/index.ts`](backend-cf/src/index.ts) | 搜索流程重构：缓存检查 → 并行搜索 Path A/B；新增缓存管理 API 端点；CORS 增加 PUT；rerankTopK 改为 `ceil(topK*1.5)` |
| [`src/config.ts`](backend-cf/src/config.ts) | 新增 `query_expand_threshold` 配置项（默认 15） |
| [`src/embedding.ts`](backend-cf/src/embedding.ts) | `expandQuery()` 增加阈值判断：超长查询跳过 LLM |
| [`src/types.ts`](backend-cf/src/types.ts) | Env 和 ConfigUpdate 新增 `QUERY_EXPAND_THRESHOLD` / `query_expand_threshold` |

### 后端 (backend-python)

| 文件 | 变更 |
|------|------|
| [`main.py`](backend/main.py) | 新增 `query_expand_threshold` 配置和阈值判断逻辑 |

### 前端 (frontend — Nuxt, port 3000)

| 文件 | 变更 |
|------|------|
| [`pages/index.vue`](frontend/pages/index.vue) | 搜索耗时显示；移动端响应式样式 |
| [`pages/config.vue`](frontend/pages/config.vue) | 新增扩展触发阈值配置项；高频词缓存管理面板（添加/编辑/删除） |
| [`pages/about.vue`](frontend/pages/about.vue) | **新增** — 关于与致谢页面（GPL-3.0 许可 + 技术致谢 + 内容来源） |
| [`app.vue`](frontend/app.vue) | 导航栏新增「关于」链接 |
| [`composables/useApi.ts`](frontend/composables/useApi.ts) | 新增缓存管理 API 函数 |
| [`nuxt.config.ts`](frontend/nuxt.config.ts) | devProxy 目标改为 localhost:8787 |

### 前端 (frontend-old — 独立页面, port 8080)

| 文件 | 变更 |
|------|------|
| [`admin/index.html`](frontend-old/admin/index.html) | 侧边栏新增「缓存管理」页面；系统配置新增扩展阈值字段；API URL 持久化；CORS 修复 |
| [`uesr/index.html`](frontend-old/uesr/index.html) | 搜索耗时显示；移动端响应式增强（侧边栏、筛选横向滚动、字号适配）；footer 新增「关于与致谢」弹窗 |

### 文档

| 文件 | 变更 |
|------|------|
| [`README.md`](README.md) | 补充缓存系统、并行搜索、rerankTopK、技术栈、仓库结构 |
| [`backend-cf/.dev.vars.example`](backend-cf/.dev.vars.example) | 新增 `QUERY_EXPAND_THRESHOLD` 说明 |

## 部署注意事项

1. 合并前无需额外配置，新配置均有默认值
2. `query_expand_threshold` 可通过 `PATCH /config` 动态调整
3. 长期缓存存储在 KV（`CONFIG_KV`），管理员在管理后台配置
4. 短期缓存为 Worker 内存，重启后自动清空
