# Trans-Search

跨性别信息库 — 为跨性别群体提供语义化信息检索服务。

- 示例：[search.transhelper.org](https://search.transhelper.org)
- TransHelper 主页：[TransHelper](https://transhelper.org)

---

## 项目简介

Trans-Search 是一个开源语义搜索平台，专为跨性别相关信息的聚合与检索场景设计。

**核心特性：**

- **混合检索（Hybrid Search）**：BM25 稀疏向量 + 密集向量双路检索，通过 RRF（倒数排名融合）合并结果，兼顾关键字精确匹配与语义相关性。稀疏向量在 Worker 本地计算，无需额外 Python 服务。
- **查询扩展（Query Expansion）**：调用 LLM 对用户查询进行语义扩展，改善检索召回率，扩展后的查询通过 `X-Expanded-Query` 响应头透传到前端。
- **知识树（Knowledge Tree）**：支持按来源站点、分类、章节的层级树状浏览。
- **无状态部署**：后端运行于 Cloudflare Workers（边缘节点），混合搜索开关、查询扩展开关等配置通过 Cloudflare KV 持久化，跨无状态 Worker 实例共享。

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端（Cloudflare 版，推荐） | TypeScript + [Hono](https://hono.dev/) on Cloudflare Workers |
| 后端（自托管版） | Python + FastAPI |
| 向量数据库 | [Qdrant Cloud](https://cloud.qdrant.io/) 或自托管 Qdrant |
| Embedding 模型 | 智谱 AI `embedding-3`（2048 维） |
| 查询扩展模型 | 智谱 AI `glm-4.7-flash` |
| 配置持久化 | Cloudflare KV（CF 版）/ `.env`（自托管版） |
| 用户前端 | 原生 HTML/CSS/JS |
| 管理后台 | Vue |

## 仓库结构

```
trans-search/
├── backend-cf/               # Cloudflare Workers 后端（TypeScript + Hono）
│   ├── src/
│   │   ├── index.ts          # 主入口，路由注册与业务逻辑
│   │   └── sparse.ts         # BM25 稀疏向量本地计算
│   └── package.json
├── backend/                  # 自托管后端（Python + FastAPI）
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/                 # 用户搜索页
│   └── index.html
├── admin-frontend/           # 管理后台（Vue）
├── docker-compose.yml        # 自托管一键启动（Qdrant + Python 后端）
├── wrangler.jsonc            # Cloudflare Workers 部署配置
├── README.md
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

## 数据录入

内容通过 `indexer.py` 批量录入 Qdrant。该脚本从 GitHub 仓库拉取 Markdown 文件，切分段落后调用 embedding API 写入向量数据库，支持指定 `source_site`、`category`、`chapter` 等元数据字段。

详见 [INDEXER.md](./doc/INDEXER.md)

## API 文档

见 [API.md](./doc/API.md)

## License

[GPL-3.0](./LICENSE)
