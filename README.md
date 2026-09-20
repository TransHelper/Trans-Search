# Trans-Search

跨性别信息库 —— 为跨性别群体提供语义化信息检索服务。

> **本仓库是早期实现，已由 [TransHelper Prism](https://github.com/daanser/Trans_Helper_Prism) 取代，本仓库不再维护。**
>
> 线上站点 **[search.transhelper.org](https://search.transhelper.org)**（备用域名 [search.chengxi.moe](https://search.chengxi.moe)）现由 Prism 提供服务。
> **架构、部署、API 与开发文档请直接看 → <https://github.com/daanser/Trans_Helper_Prism>**

---

## 线上站点

| 站点 | 地址 |
|------|------|
| 主站 | <https://search.chengxi.moe> |
| 备用域名 | <https://search.transhelper.org> |
| 使用说明与免责 | <https://search.chengxi.moe/about> |
| TransHelper 主页 | <https://transhelper.org> |

---

## TransHelper Prism 架构概览

Prism 把 **MtF Wiki / FtM Wiki / RLE Wiki / Mio MtF Wiki** 四部知识库聚合成一个搜索框：向量召回 + 二次重排直达原文，并可按需让模型**只依据命中片段**生成要点总结与多轮追问。全站跑在 Cloudflare（Workers + Pages + D1/KV）上，向量库用 Qdrant Cloud，模型走硅基流动。

```
                        ┌────────────────────────────┐
   浏览器 ──HTTPS─────▶ │ Nuxt3 前端 (Pages)          │  search.chengxi.moe
                        │  + Pages Function /api/* 反代│  search.transhelper.org
                        └──────────────┬─────────────┘
                                       │ 同源 /api/v1/...
                        ┌──────────────▼─────────────┐
                        │ Workers 后端 (Hono, TS)     │
                        │ 检索 / 重排 / 缓存 / 降级    │
                        │ 限流分档 / 配额 / 鉴权 / 管理 │
                        └───┬──────────┬─────────┬────┘
                            │          │         │
              embed/rerank/chat    向量检索    D1（账号·配额·限流计数·审计）
                            │          │         KV（缓存·禁用集·OAuth state）
                            ▼          ▼
                  ┌──────────────┐  ┌──────────────┐
                  │ 硅基流动 中国站 │  │ Qdrant Cloud │
                  │ bge-m3/rerank │  │ 4 collections│
                  │ Qwen3.5-4B    │  │ + text 索引   │
                  └──────────────┘  └──────▲───────┘
                        ┌──────────────────┴────────────────────┐
                        │ GitHub Actions                        │
                        │ ① ingest：每日 UTC 02:00 增量摄取       │
                        │ ② watchdog：每 30 分钟探活（6 项）      │
                        └───────────────────────────────────────┘
```

### 请求链路

1. 浏览器只访问自有域名，前端是 Nuxt 3 静态产物，托管在 Cloudflare Pages。
2. `/api/*` 由 Pages Function（`frontend/functions/api/[[path]].ts`）**同源反代**到 Worker，并签名客户端 IP / 国家 / ASN（`*.workers.dev` 在墙内被拦，仅用于服务端内部调用）。
3. Worker（Hono + TypeScript）负责检索编排、限流分档、配额、鉴权与全部管理端点。

### 检索流程

- **召回**：`BAAI/bge-m3`（1024 维）把查询与片段编码成向量，在 Qdrant 里跨库并行检索；单库失败不影响其它库。
- **重排**：`BAAI/bge-reranker-v2-m3` 对候选二次打分，取 `min(ceil(3×n), 64)` 条候选再截前 n 条（可关闭）。
- **缓存**：相同「查询词 + 库 + 条数」在 KV 里缓存 1 小时，命中即跳过 embedding 与向量检索。
- **降级**：上游超时或全部失败时自动回退到 Qdrant 全文索引（零 embedding），搜索本身不会不可用。
- **AI 伴读**：`Qwen/Qwen3.5-4B`（默认关闭思考链）以 SSE 流式作答，只依据命中片段并逐条标注 `[来源n]`，支持最多 10 轮追问。

### 数据管线

- **每日增量**：GitHub Actions 在 UTC 02:00 用 GitHub trees API 取全部 `.md` 的 blob sha，与 Qdrant payload 比对，只解析 / embed 变化文件，先按 point id 删旧点再 upsert。
- **为什么不跑在 Worker 里**：免费版 Worker 限制 CPU 10ms / 内存 128MB，在 Worker 内下载 tarball + gunzip + 全量 embed 必然超限，因此摄取放在 Actions，再把结果通过管理端点回报给 Worker 落 D1。
- **探活**：`watchdog.yml` 每 30 分钟做 6 项检查（含一次真实匿名检索），失败即给管理员发邮件。

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Nuxt 3 + Vue 3 + Tailwind CSS，部署于 Cloudflare Pages |
| 反代 | Pages Function（同源 `/api/*` → Worker） |
| 后端 | TypeScript + [Hono](https://hono.dev/) on Cloudflare Workers |
| 向量库 | [Qdrant](https://qdrant.tech) Cloud —— 4 个 collection + text 索引 |
| Embedding / Rerank | `BAAI/bge-m3` / `BAAI/bge-reranker-v2-m3`（硅基流动） |
| 对话模型 | `Qwen/Qwen3.5-4B`（开业酬宾期默认 DeepSeek V4.1 Flash） |
| 存储 | Cloudflare D1（账号 / 配额 / 限流计数 / 审计）、KV（缓存 / 禁用集 / OAuth state） |
| 账号 | X OAuth 2.0 + PKCE → 无状态 JWT（DB 只存 `sha256(x_id)`） |
| 调度 | GitHub Actions（摄取 + 探活） |

---

## License

[GPL-3.0](./LICENSE)。条目内容版权归各 wiki 原作者所有，本项目仅做检索索引；医疗指引请以执业医生诊断为准。
