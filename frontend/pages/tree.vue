<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold mb-2 dark:text-white">文章分类浏览</h1>
      <p class="text-gray-500 dark:text-gray-400 text-sm">按来源 → 分类 → 章节 组织，点击可展开子级；点击「限定搜索」可将该范围带入搜索页</p>
    </div>

    <div v-if="loading" class="text-center py-16 text-gray-400 dark:text-gray-500">加载中…</div>
    <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">{{ error }}</div>

    <div v-if="!loading && !error && tree.length === 0" class="text-center py-16 text-gray-400 dark:text-gray-500">
      暂无数据
    </div>

    <div v-if="!loading && tree.length > 0" class="space-y-4">
      <div v-for="site in tree" :key="site.name" class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <template v-for="row in rowsForSite(site)" :key="row.key">
          <!-- 文章叶子节点 -->
          <button
            v-if="row.isArticle"
            class="w-full flex items-center gap-2 py-1.5 text-left group border-b border-gray-50 dark:border-gray-800 last:border-0 transition-colors"
            :class="selectedKey === row.key ? 'bg-primary-100 dark:bg-primary-900/40' : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'"
            :style="{ paddingLeft: `${14 + row.depth * 14}px`, paddingRight: '14px' }"
            :title="row.node.title || row.node.name"
            @click="selectNode(row)"
          >
            <span
              v-for="f in row.node.flags || []"
              :key="f"
              class="w-1.5 h-1.5 rounded-full shrink-0"
              :class="flagDotClass(f)"
            ></span>
            <span class="text-sm truncate" :class="selectedKey === row.key ? 'text-primary-700 dark:text-primary-300 font-medium' : 'text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400'">{{ row.node.title || row.node.name }}</span>
            <span v-for="t in (row.node.tags || []).slice(0, 3)" :key="t" class="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 rounded shrink-0">{{ t }}</span>
            <a
              v-if="row.node.url"
              :href="row.node.url"
              target="_blank"
              class="ml-auto text-[10px] text-primary-600 dark:text-primary-400 hover:underline shrink-0"
              @click.stop
            >链接</a>
          </button>

          <!-- 站点 / 分类 / 章节 节点 -->
          <div
            v-else
            class="w-full flex items-center gap-2 py-2 cursor-pointer border-b border-gray-50 dark:border-gray-800 last:border-0 transition-colors"
            :class="selectedKey === row.key ? 'bg-primary-100 dark:bg-primary-900/40' : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'"
            :style="{ paddingLeft: `${14 + row.depth * 14}px`, paddingRight: '10px' }"
            @click="toggleExpanded(row.key); selectNode(row)"
          >
            <svg
              class="w-3 h-3 text-gray-400 dark:text-gray-500 shrink-0 transition-transform"
              :class="{ 'rotate-90': expandedKeys.has(row.key) }"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
            ><path stroke-linecap="round" stroke-linejoin="round" d="M9 18l6-6-6-6" /></svg>

            <svg class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path :d="iconPath(row.node.type)" />
            </svg>

            <span class="text-sm truncate" :class="row.depth === 0 ? 'font-semibold text-gray-800 dark:text-gray-200' : (selectedKey === row.key ? 'text-primary-700 dark:text-primary-300 font-medium' : 'text-gray-700 dark:text-gray-300')">{{ row.node.name }}</span>
            <span class="text-xs text-gray-400 dark:text-gray-500 shrink-0">{{ row.count }} 篇</span>

            <button
              class="ml-auto text-[11px] text-primary-600 dark:text-primary-400 hover:underline shrink-0"
              title="在此范围内搜索"
              @click.stop="restrictSearch(row)"
            >
              限定搜索
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getTree } = useApi()
const router = useRouter()

const tree = ref<any[]>([])
const loading = ref(true)
const error = ref("")
const selectedKey = ref<string | null>(null)

// 展开状态：以路径拼出的唯一 key 记录哪些分支已展开
const expandedKeys = reactive(new Set<string>())

function selectNode(row: Row) {
  selectedKey.value = row.key
  if (row.isArticle) {
    searchArticle(row.node)
  }
}

function toggleExpanded(key: string) {
  if (expandedKeys.has(key)) expandedKeys.delete(key)
  else expandedKeys.add(key)
}

// 正确统计文章数：只在叶子节点（type === 'article'）计数，任意深度递归求和
function countArticles(node: any): number {
  if (!node) return 0
  if (node.type === "article") return 1
  if (!node.children || node.children.length === 0) return 0
  return node.children.reduce((sum: number, c: any) => sum + countArticles(c), 0)
}

type Ctx = { site?: string; category?: string; chapterPath?: string }
type Row = {
  key: string
  node: any
  depth: number
  isArticle: boolean
  count: number
} & Ctx

// 把任意深度的树"拍平"成一份按展开状态过滤后的行列表（纯函数递归，非组件递归，避免打包环境下的循环分片问题）
function flatten(nodes: any[], depth: number, parentKey: string, ctx: Ctx): Row[] {
  const rows: Row[] = []
  for (const node of nodes || []) {
    const key = parentKey ? `${parentKey}/${node.name}` : node.name
    if (node.type === "article") {
      rows.push({ key, node, depth, isArticle: true, count: 1, ...ctx })
      continue
    }
    const newCtx: Ctx = { ...ctx }
    if (node.type === "site") newCtx.site = node.name
    if (node.type === "category") newCtx.category = node.name
    if (node.type === "chapter") newCtx.chapterPath = newCtx.chapterPath ? `${newCtx.chapterPath}/${node.name}` : node.name

    rows.push({ key, node, depth, isArticle: false, count: countArticles(node), ...newCtx })
    if (expandedKeys.has(key)) {
      rows.push(...flatten(node.children || [], depth + 1, key, newCtx))
    }
  }
  return rows
}

function rowsForSite(site: any): Row[] {
  return flatten([site], 0, "", {})
}

function flagDotClass(f: string): string {
  const map: Record<string, string> = {
    ai: "bg-purple-400",
    risk: "bg-red-400",
    reviewed: "bg-green-400",
    outdated: "bg-yellow-400",
  }
  return map[f] ?? "bg-gray-300"
}

const ICON_PATHS: Record<string, string> = {
  site: "M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20",
  category: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z",
  chapter: "M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z",
}
function iconPath(type: string): string {
  return ICON_PATHS[type] || ICON_PATHS.chapter
}

// 限定搜索范围：跳转到搜索页并带上该节点对应的筛选条件
function restrictSearch(row: Row) {
  router.push({
    path: "/",
    query: {
      ...(row.site ? { source_site: row.site } : {}),
      ...(row.category ? { category: row.category } : {}),
      ...(row.chapterPath ? { chapter: row.chapterPath } : {}),
    },
  })
}

// 点击文章：跳转到搜索页并直接以标题搜索该文章
function searchArticle(node: any) {
  router.push({
    path: "/",
    query: { q: node.title || node.name },
  })
}

onMounted(async () => {
  try {
    tree.value = await getTree()
    // 默认展开第一层（站点）
    for (const site of tree.value) expandedKeys.add(site.name)
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})
</script>
