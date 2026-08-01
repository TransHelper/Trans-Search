<template>
  <div class="search-page">
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold mb-2 dark:text-white">跨性别信息聚合搜索</h1>
      <p class="text-gray-500 dark:text-gray-400 text-sm">语义搜索引擎 — 支持关键词扩展与多维度筛选</p>
    </div>

    <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div class="flex gap-2 mb-3">
        <div class="flex-1 relative">
          <input
            ref="searchInput"
            v-model="query"
            type="text"
            placeholder="输入搜索关键词或自然语言问题…"
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm pr-9 bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
            @keydown.enter="doSearch"
            @focus="showHistory = true"
            @blur="hideHistoryDelayed"
          />
          <button
            v-if="query"
            class="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-xs"
            aria-label="清空搜索词"
            @mousedown.prevent="query = ''; nextTick(() => searchInput?.focus())"
          >✕</button>

          <!-- Search history dropdown -->
          <div
            v-if="showHistory && searchHistory.length > 0 && !query"
            class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 overflow-hidden"
          >
            <div class="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700">
              <span class="text-xs text-gray-400 dark:text-gray-500">最近搜索</span>
              <button class="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400" @mousedown.prevent="clearHistory">清空</button>
            </div>
            <button
              v-for="(h, i) in searchHistory"
              :key="i"
              class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              @mousedown.prevent="applyHistory(h)"
            >
              <Icon name="mdi:clock-outline" class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0 -mt-px" />
              <span class="truncate">{{ h }}</span>
            </button>
          </div>
        </div>
        <button
          class="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium shrink-0"
          :disabled="loading || !query.trim()"
          @click="doSearch"
        >
          {{ loading ? "搜索中…" : "搜索" }}
        </button>
      </div>

      <div class="flex flex-wrap gap-2">
        <input
          v-model="filters.category"
          placeholder="分类（如 医疗）"
          class="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-md text-xs w-28 focus:outline-none focus:ring-1 focus:ring-primary-400 bg-white dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
        />
        <input
          v-model="filters.source_site"
          placeholder="来源网站"
          class="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-md text-xs w-32 focus:outline-none focus:ring-1 focus:ring-primary-400 bg-white dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
        />
        <input
          v-model="filters.chapter"
          placeholder="章节"
          class="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-md text-xs w-28 focus:outline-none focus:ring-1 focus:ring-primary-400 bg-white dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
        />
        <input
          v-model="filters.tags"
          placeholder="标签（逗号分隔）"
          class="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-md text-xs w-40 focus:outline-none focus:ring-1 focus:ring-primary-400 bg-white dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
        />
        <select
          v-model.number="filters.top_k"
          class="px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-md text-xs bg-white dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary-400"
        >
          <option :value="5">5 条</option>
          <option :value="8">8 条</option>
          <option :value="12">12 条</option>
          <option :value="20">20 条</option>
        </select>
      </div>
    </div>

    <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 mb-4 text-sm">
      {{ error }}
    </div>

    <div v-if="scopeLabel" class="mb-4 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-700 dark:text-blue-400 flex items-center justify-between">
      <span>当前范围：<span class="font-medium">{{ scopeLabel }}</span>（来自知识树）</span>
      <button class="text-blue-500 hover:underline shrink-0 ml-3" @click="clearScope">清除</button>
    </div>

    <div v-if="expandedQuery && expandedQuery !== query" class="mb-4 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-400">
      扩展搜索词：<span class="font-medium">{{ expandedQuery }}</span>
    </div>

    <div v-if="results.length > 0" class="space-y-4">
      <p class="text-sm text-gray-400 dark:text-gray-500 mb-2">共 {{ results.length }} 条结果
        <span class="ml-2 text-xs text-gray-300 dark:text-gray-600">本次搜索 {{ searchTimeText }}</span>
      </p>
      <div
        v-for="r in results"
        :key="r.article_id"
        class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between gap-3 mb-1">
          <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 leading-snug">{{ r.title }}</h3>
          <span class="shrink-0 text-xs font-mono text-gray-400 dark:text-gray-500">{{ (r.score * 100).toFixed(1) }}%</span>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-2">{{ r.excerpt }}</p>
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <span v-if="r.category" class="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">{{ r.category }}</span>
          <span v-if="r.source_site" class="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded">{{ r.source_site }}</span>
          <span v-if="r.chapter" class="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded">{{ r.chapter }}</span>
          <span v-for="t in r.tags" :key="t" class="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded">{{ t }}</span>
          <span v-if="r.url" class="ml-auto">
            <a :href="r.url" target="_blank" class="text-primary-600 dark:text-primary-400 hover:underline">打开原文</a>
          </span>
        </div>
      </div>
    </div>

    <div v-if="hasSearched && !loading && results.length === 0 && !error" class="text-center py-16 text-gray-400 dark:text-gray-500">
      没有找到相关结果
    </div>

    <!-- Scroll-to-top FAB -->
    <Transition name="fab-fade">
      <button
        v-if="showScrollTop"
        class="fixed bottom-6 right-6 w-10 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-colors"
        aria-label="回到顶部"
        @click="scrollToTop"
      >
        <Icon name="mdi:chevron-up" class="w-5 h-5" />
      </button>
    </Transition>
  </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick } from "vue"
const { search } = useApi()
const query = ref("")
const loading = ref(false)
const hasSearched = ref(false)
const results = ref<any[]>([])
const error = ref("")
const expandedQuery = ref<string | null>(null)
const searchTime = ref(0)
const searchInput = ref<HTMLInputElement | null>(null)
const showHistory = ref(false)
const showScrollTop = ref(false)
let hideHistoryTimer: ReturnType<typeof setTimeout> | null = null

// Search history (last 5, from localStorage)
const HISTORY_KEY = "trans-search-history"
const searchHistory = ref<string[]>([])

function loadHistory() {
if (import.meta.server) return
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // 数值只保留字符串
      if (Array.isArray(parsed)) {
        searchHistory.value = parsed.filter((item): item is string => typeof item === 'string')
      }
    }
  } catch { /* ignore */ }
}

function saveHistory(q: string) {
  if (import.meta.server) return
  const trimmed = q.trim()
  if (!trimmed) return
  searchHistory.value = [trimmed, ...searchHistory.value.filter(h => h !== trimmed)].slice(0, 5)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(searchHistory.value))
}

function applyHistory(h: string) {
  query.value = h
  showHistory.value = false
  doSearch()
}

function clearHistory() {
  searchHistory.value = []
  localStorage.removeItem(HISTORY_KEY)
  showHistory.value = false
}

function hideHistoryDelayed() {
  if (hideHistoryTimer) {
    clearTimeout(hideHistoryTimer)
  }
  hideHistoryTimer = setTimeout(() => { 
    showHistory.value = false 
  }, 200)
}

onBeforeUnmount(() => {
  if (hideHistoryTimer) {
    clearTimeout(hideHistoryTimer)
    hideHistoryTimer = null
  }
})

// Scroll-to-top
function onScroll() {
  showScrollTop.value = window.scrollY > 400
}
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" })
}

onMounted(() => {
  loadHistory()
  window.addEventListener("scroll", onScroll, { passive: true })
})
onUnmounted(() => {
  window.removeEventListener("scroll", onScroll)
})

const searchTimeText = computed(() => {
  const ms = searchTime.value
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(2)} s`
})

const filters = reactive({
  category: "",
  source_site: "",
  chapter: "",
  tags: "",
  top_k: 8,
})

const route = useRoute()
const router = useRouter()

const scopeLabel = computed(() => {
  const parts = [filters.source_site, filters.category, filters.chapter].filter(Boolean)
  return parts.join(" › ")
})

function clearScope() {
  filters.source_site = ""
  filters.category = ""
  filters.chapter = ""
  router.replace({ path: "/", query: query.value ? { q: query.value } : {} })
  if (query.value) doSearch()
}

// 从知识树跳转过来时，带上范围筛选（source_site/category/chapter）与可选的查询词（q）
onMounted(() => {
  const q = route.query
  if (typeof q.source_site === "string") filters.source_site = q.source_site
  if (typeof q.category === "string") filters.category = q.category
  if (typeof q.chapter === "string") filters.chapter = q.chapter
  if (typeof q.q === "string" && q.q) {
    query.value = q.q
    doSearch()
  }
})

async function doSearch() {
  const q = query.value.trim()
  if (!q) return
  hasSearched.value = true
  loading.value = true
  error.value = ""
  expandedQuery.value = null
  searchTime.value = 0
  showHistory.value = false
  saveHistory(q)
  const start = performance.now()
  try {
    const res = await search({
      q,
      category: filters.category || undefined,
      source_site: filters.source_site || undefined,
      chapter: filters.chapter || undefined,
      tags: filters.tags || undefined,
      top_k: filters.top_k,
    })
    results.value = res.results
    expandedQuery.value = res.expandedQuery
  } catch (e: any) {
    error.value = e.message
  } finally {
    searchTime.value = Math.round(performance.now() - start)
    loading.value = false
  }
}
</script>

<style scoped>
@media (max-width: 640px) {
  .search-page :deep(.px-4) { padding-left: 12px; padding-right: 12px; }
  .search-page :deep(.py-8) { padding-top: 16px; padding-bottom: 16px; }
  .search-page :deep(.text-2xl) { font-size: 1.25rem; }
  .search-page :deep(.p-4) { padding: 12px; }
  .search-page :deep(.py-2\\.5) { padding-top: 10px; padding-bottom: 10px; }
  .search-page :deep(.px-6) { padding-left: 14px; padding-right: 14px; }
  .search-page :deep(.flex-wrap.gap-2) input,
  .search-page :deep(.flex-wrap.gap-2) select {
    flex: 1 1 calc(50% - 4px);
    min-width: 0;
    width: auto;
  }
  .search-page :deep(.w-28),
  .search-page :deep(.w-32),
  .search-page :deep(.w-40) { width: auto; }
  .search-page :deep(.p-5) { padding: 14px; }
}

/* Scroll-to-top FAB animation */
.fab-fade-enter-active,
.fab-fade-leave-active {
  transition: all 0.2s ease;
}
.fab-fade-enter-from,
.fab-fade-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
