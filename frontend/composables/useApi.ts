export function useApi() {
  const config = useRuntimeConfig()

  function baseURL(): string {
    return config.public.apiBase as string
  }

  async function request<T>(path: string, opts?: RequestInit & { params?: Record<string, string | number | undefined | null> }): Promise<T> {
    let url = `${baseURL()}${path}`
    if (opts?.params) {
      const qs = Object.entries(opts.params)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&")
      if (qs) url += `?${qs}`
    }

    const res = await fetch(url, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(opts?.headers as Record<string, string>),
      },
    })

    const data = await res.json()
    if (!res.ok) throw new Error((data as { detail?: string })?.detail ?? `HTTP ${res.status}`)
    return data as T
  }
  function setAdminKey(key: string) {
    if (process.client) {
      localStorage.setItem("admin_key", key)
    }
  }

  function getAdminKey(): string | null {
    if (process.client) {
      return localStorage.getItem("admin_key")
    }
    return null
  }

  function authHeaders(): Record<string, string> {
    const key = getAdminKey()
    return key ? { "X-Admin-Key": key } : {}
  }

  async function search(params: {
    q: string
    category?: string
    source_site?: string
    chapter?: string
    tags?: string
    top_k?: number
  }): Promise<{ results: any[]; expandedQuery: string | null }> {
    let url = `${baseURL()}/api/search`
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&")
    if (qs) url += `?${qs}`

    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
    })
    const data = await res.json()
    if (!res.ok) throw new Error((data as { detail?: string })?.detail ?? `HTTP ${res.status}`)

    const raw = res.headers.get("X-Expanded-Query")
    const expandedQuery = raw ? decodeURIComponent(raw) : null

    return { results: data as any[], expandedQuery }
  }

  async function getTree() {
    return request<any[]>("/api/tree")
  }

  async function getStats() {
    return request<any>("/api/stats")
  }

  async function getConfig() {
    return request<any>("/api/config", {
      headers: authHeaders(),
    })
  }

  async function updateConfig(data: Record<string, unknown>) {
    return request<any>("/api/config", {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(data),
    })
  }

  async function indexArticle(data: Record<string, unknown>) {
    return request<any>("/api/articles", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    })
  }

  async function deleteArticle(articleId: string) {
    return request<any>(`/api/articles/${articleId}`, {
      method: "DELETE",
      headers: authHeaders(),
    })
  }

  async function batchIndex(articles: Record<string, unknown>[]) {
    return request<any[]>("/api/articles/batch", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(articles),
    })
  }

  // ── 缓存管理 ──
  async function getCacheKeywords(): Promise<Record<string, { expansions: string[] }>> {
    return request<any>("/api/admin/cache/keywords", {
      headers: authHeaders(),
    })
  }

  async function putCacheKeyword(keyword: string, expansions: string[]) {
    return request<any>("/api/admin/cache/keywords", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ keyword, expansions }),
    })
  }

  async function deleteCacheKeyword(keyword: string) {
    return request<any>(`/api/admin/cache/keywords/${encodeURIComponent(keyword)}`, {
      method: "DELETE",
      headers: authHeaders(),
    })
  }

  async function clearShortCache() {
    return request<any>("/api/admin/cache/clear", {
      method: "POST",
      headers: authHeaders(),
    })
  }

  return {
    setAdminKey,
    getAdminKey,
    search,
    getTree,
    getStats,
    getConfig,
    updateConfig,
    indexArticle,
    deleteArticle,
    batchIndex,
    getCacheKeywords,
    putCacheKeyword,
    deleteCacheKeyword,
    clearShortCache,
  }
}
