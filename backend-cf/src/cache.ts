import { Env } from "./types"
import { SearchResult } from "./types"

// ════════════════════════════════════════
// 长期缓存（管理员定义的关键词 → 扩展词）
// 存储在 KV，持久化
// ════════════════════════════════════════

export interface KeywordEntry {
  expansions: string[]
}

export type LongTermCache = Record<string, KeywordEntry>

const KV_KEY = "search_cache:long_term"

export async function getLongTermCache(env: Env): Promise<LongTermCache> {
  const data = await env.CONFIG_KV.get(KV_KEY, "json")
  return (data ?? {}) as LongTermCache
}

export async function setLongTermCache(env: Env, cache: LongTermCache): Promise<void> {
  await env.CONFIG_KV.put(KV_KEY, JSON.stringify(cache))
}

/** 查询搜索词中是否包含管理员预设的高频词，命中则合并返回这些词的扩展词（去重） */
export async function getKeywordExpansions(q: string, env: Env): Promise<string[] | null> {
  const cache = await getLongTermCache(env)
  // 大小写不敏感：统一转小写做"包含"匹配（而非要求整词完全相等）
  const lowerQ = q.toLowerCase()
  const matched: string[] = []
  for (const key of Object.keys(cache)) {
    const lowerKey = key.toLowerCase()
    if (!lowerKey) continue
    if (lowerQ.includes(lowerKey)) {
      for (const exp of cache[key].expansions) {
        if (!matched.includes(exp)) matched.push(exp)
      }
    }
  }
  return matched.length > 0 ? matched : null
}

// ════════════════════════════════════════
// 短期缓存（自动缓存搜索结果，内存）
// TTL: 5 分钟
// ════════════════════════════════════════

interface ShortTermEntry {
  results: SearchResult[]
  expandedQuery: string
  expiresAt: number
}

const SHORT_TTL_MS = 5 * 60 * 1000
const shortTermCache = new Map<string, ShortTermEntry>()

/** 清理过期条目（每次查找时惰性清理） */
function evictExpired(): void {
  const now = Date.now()
  for (const [key, entry] of shortTermCache) {
    if (now > entry.expiresAt) shortTermCache.delete(key)
  }
}

export function getShortTermCache(q: string): { results: SearchResult[]; expandedQuery: string } | null {
  evictExpired()
  const entry = shortTermCache.get(q)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    shortTermCache.delete(q)
    return null
  }
  return { results: entry.results, expandedQuery: entry.expandedQuery }
}

export function setShortTermCache(q: string, results: SearchResult[], expandedQuery: string): void {
  // 限制内存缓存条目数，防止泄漏
  if (shortTermCache.size > 500) {
    const firstKey = shortTermCache.keys().next().value
    if (firstKey) shortTermCache.delete(firstKey)
  }
  shortTermCache.set(q, {
    results,
    expandedQuery,
    expiresAt: Date.now() + SHORT_TTL_MS,
  })
}

/** 清除所有短期缓存（管理员手动刷新时用） */
export function clearShortTermCache(): void {
  shortTermCache.clear()
}
