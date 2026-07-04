# Trans-Search

跨性别信息库 — 为跨性别群体提供语义化信息检索服务。

- 示例：[search.transhelper.org](https://search.transhelper.org)
- TransHelper 主页：[TransHelper](https://transhelper.org)

---

## 项目简介

Trans-Search 是一个开源语义搜索平台，专为跨性别相关信息的聚合与检索场景设计。

**核心特性：**

- **混合检索（Hybrid Search）**：BM25 稀疏向量 + 密集向量双路检索，通过 RRF（倒数排名融合）合并结果，兼顾关键字精确匹配与语义相关性。稀疏向量在 Worker 本地计算，无需额外 Python 服务。
- **查询扩展（Query Expansion）**：调用 LLM 对用户查询进行语义扩展，改善检索召回率。支持**阈值控制**（`QUERY_EXPAND_THRESHOLD`），超过指定字符数时跳过 LLM 调用。
- **异步并行搜索**：原词立即检索（Path A）+ LLM 扩展异步检索（Path B），两者并行执行互不阻塞，结果合并去重后统一重排序。
- **搜索缓存系统**：
  - **长期缓存**（KV 持久化）：管理员预设高频关键词及扩展词，命中后直接用扩展词联合检索，完全跳过 LLM。
  - **短期缓存**（内存 5 分钟 TTL）：搜索结果自动缓存，相同关键词重复搜索从内存返回（~0.1ms）。
- **知识树（Knowledge Tree）**：支持按来源站点、分类、章节的层级树状浏览。
- **Reranker 重排序**：召回候选结果后用 cross-encoder 模型重新打分排序，提升顶部结果相关性（`rerankTopK = ceil(topK × 1.5)`）。
- **无状态部署**：后端运行于 Cloudflare Workers（边缘节点），所有配置通过 KV 持久化，跨无状态 Worker 实例共享。
- **开源许可与致谢页面**：两个用户前端均提供「关于」页面/弹窗，展示 GPL-3.0 许可及技术致谢。

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端（Cloudflare 版，推荐） | TypeScript + [Hono](https://hono.dev/) on Cloudflare Workers |
| 后端（自托管版） | Python + FastAPI |
| 向量数据库 | [Qdrant](https://qdrant.tech) — 混合检索（稠密 + 稀疏） |
| Embedding 模型 | [Qwen/Qwen3-Embedding-0.6B](https://huggingface.co/Qwen)（1024 维）via [硅基流动](https://www.siliconflow.cn) |
| 查询扩展模型 | [Qwen/Qwen3-8B](https://huggingface.co/Qwen) via [硅基流动](https://www.siliconflow.cn) |
| 重排序模型 | [BAAI/bge-reranker-v2-m3](https://huggingface.co/BAAI/bge-reranker-v2-m3) |
| 配置持久化 | Cloudflare KV（CF 版）/ `.env`（自托管版） |
| 用户前端（新） | Nuxt 3 + Vue 3 + Tailwind CSS（port 3000） |
| 用户前端（旧） | 原生 HTML/CSS/JS（port 8080） |
| 独立管理后台 | 原生 HTML/CSS/JS SPA（port 8080/admin/） |

## 仓库结构

```
trans-search/
├── backend-cf/               # Cloudflare Workers 后端（TypeScript + Hono）
│   ├── src/
│   │   ├── index.ts          # 主入口，路由注册与业务逻辑
│   │   ├── cache.ts          # 缓存系统（长期 KV + 短期内存）
│   │   ├── config.ts         # 配置管理与动态更新
│   │   ├── embedding.ts      # Embedding / LLM 调用 + 查询扩展
│   │   ├── rerank.ts         # Reranker 重排序
│   │   ├── qdrant.ts         # Qdrant 向量数据库操作
│   │   ├── sparse.ts         # BM25 稀疏向量本地计算
│   │   ├── auth.ts           # Admin Key 鉴权
│   │   ├── rate-limit.ts     # 速率限制
│   │   ├── chunk.ts          # 文本分块与元数据处理
│   │   └── types.ts          # TypeScript 类型定义
│   ├── .dev.vars.example
│   ├── wrangler.jsonc
│   └── package.json
├── backend/                  # 自托管后端（Python + FastAPI）
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/                 # 用户前端（Nuxt 3, port 3000）
│   ├── pages/
│   │   ├── index.vue         # 搜索页
│   │   ├── tree.vue          # 知识树浏览
│   │   ├── stats.vue         # 统计
│   │   ├── config.vue        # 管理配置 + 缓存管理
│   │   └── about.vue         # 关于与致谢
│   ├── composables/
│   │   └── useApi.ts         # API 调用封装
│   └── nuxt.config.ts
├── frontend-old/             # 旧版前端（原生, port 8080）
│   ├── uesr/index.html       # 用户搜索页
│   └── admin/index.html      # 独立管理后台 SPA
├── docker-compose.yml        # 自托管一键启动（Qdrant + Python 后端）
├── wrangler.jsonc            # Cloudflare Workers 部署配置
├── LICENSE                   # GPL-3.0
└── README.md
```

## 选择部署方式

### Cloudflare Workers（推荐）

- 免费额度每天 10 万次请求，够用于中小规模项目
- 全球边缘节点，访问延迟相对较低
- 无需管理服务器，一条命令发布
- 需要 Qdrant Cloud（或公网可访问的自托管 Qdrant）

详见 [DEPLOY-CF.md](./doc/DEPLOY-CF.md)

### 自托管 Docker

- 数据完全私有，适合对数据主权有要求的场景
- Qdrant 与后端在同一台机器，内网通信
- 需要一台公网服务器

详见 [DEPLOY-DOCKER.md](./doc/DEPLOY-DOCKER.md)

## 配置说明

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `QUERY_EXPAND` | `true` | 是否启用 LLM 查询扩展 |
| `QUERY_EXPAND_THRESHOLD` | `15` | 查询扩展触发阈值（字符数），超过此长度不调 LLM |
| `HYBRID_SEARCH` | `true` | 是否启用混合检索（BM25 + 向量） |
| `RERANK_ENABLED` | `true` | 是否启用 Reranker 重排序 |
| `SCORE_THRESHOLD` | `0.25` | 向量搜索最低相关度阈值 |

所有配置均可通过 `PATCH /config` API 动态修改，无需重启。

### 缓存管理

- **长期缓存**：通过 `PUT /admin/cache/keywords` 或管理后台「缓存管理」页面配置
- **短期缓存**：自动缓存 5 分钟，可通过 `POST /admin/cache/clear` 清除

## 数据录入

内容通过 `indexer.py` 批量录入 Qdrant。该脚本从 GitHub 仓库拉取 Markdown 文件，切分段落后调用 embedding API 写入向量数据库，支持指定 `source_site`、`category`、`chapter` 等元数据字段。

详见 [INDEXER.md](./doc/INDEXER.md)

## API 文档

见 [API.md](./doc/API.md)

## License

[GPL-3.0](./LICENSE)
