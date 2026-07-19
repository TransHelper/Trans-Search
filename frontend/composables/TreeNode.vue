<template>
  <div v-if="node.type === 'article'" class="tree-leaf">
    <button
      class="w-full flex items-center gap-2 py-1.5 hover:bg-white text-left group"
      :style="{ paddingLeft: `${14 + depth * 14}px`, paddingRight: '14px' }"
      :title="node.title || node.name"
      @click="searchArticle"
    >
      <span
        v-for="f in node.flags || []"
        :key="f"
        class="w-1.5 h-1.5 rounded-full shrink-0"
        :class="flagDotClass(f)"
      ></span>
      <span class="text-sm text-gray-700 truncate group-hover:text-primary-600">{{ node.title || node.name }}</span>
      <span v-for="t in (node.tags || []).slice(0, 3)" :key="t" class="text-[10px] text-gray-400 bg-gray-100 px-1.5 rounded shrink-0">{{ t }}</span>
      <a
        v-if="node.url"
        :href="node.url"
        target="_blank"
        class="ml-auto text-[10px] text-primary-600 hover:underline shrink-0"
        @click.stop
      >链接</a>
    </button>
  </div>

  <div v-else class="tree-branch border-b border-gray-50 last:border-0">
    <div
      class="w-full flex items-center gap-2 py-2 hover:bg-gray-50 cursor-pointer"
      :style="{ paddingLeft: `${14 + depth * 14}px`, paddingRight: '10px' }"
      @click="expanded = !expanded"
    >
      <svg
        class="w-3 h-3 text-gray-400 shrink-0 transition-transform"
        :class="{ 'rotate-90': expanded }"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
      ><path stroke-linecap="round" stroke-linejoin="round" d="M9 18l6-6-6-6" /></svg>

      <svg class="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path :d="iconPath" />
      </svg>

      <span class="text-sm truncate" :class="depth === 0 ? 'font-semibold text-gray-800' : 'text-gray-700'">{{ node.name }}</span>
      <span class="text-xs text-gray-400 shrink-0">{{ articleCount }} 篇</span>

      <button
        class="ml-auto text-[11px] text-primary-600 hover:underline shrink-0"
        title="在此范围内搜索"
        @click.stop="restrictSearch"
      >
        限定搜索
      </button>
    </div>

    <div v-if="expanded" class="bg-gray-50/60">
      <TreeNode
        v-for="child in node.children"
        :key="child.article_id || child.name"
        :node="child"
        :depth="depth + 1"
        :site="ctx.site"
        :category="ctx.category"
        :chapter-path="ctx.chapterPath"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  node: any
  depth: number
  site?: string
  category?: string
  chapterPath?: string
}>()

const router = useRouter()
const expanded = ref(props.depth < 1)

// 当前节点向下传递的上下文（用于限定搜索范围）
const ctx = computed(() => {
  const c = { site: props.site, category: props.category, chapterPath: props.chapterPath }
  if (props.node.type === "site") c.site = props.node.name
  if (props.node.type === "category") c.category = props.node.name
  if (props.node.type === "chapter") c.chapterPath = c.chapterPath ? `${c.chapterPath}/${props.node.name}` : props.node.name
  return c
})

// 正确统计文章数：只在叶子节点（type === 'article'）计数，任意深度递归求和
function countArticles(node: any): number {
  if (!node) return 0
  if (node.type === "article") return 1
  if (!node.children || node.children.length === 0) return 0
  return node.children.reduce((sum: number, c: any) => sum + countArticles(c), 0)
}
const articleCount = computed(() => countArticles(props.node))

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
const iconPath = computed(() => ICON_PATHS[props.node.type] || ICON_PATHS.chapter)

// 限定搜索范围：跳转到搜索页并带上该节点对应的筛选条件
function restrictSearch() {
  const c = ctx.value
  router.push({
    path: "/",
    query: {
      ...(c.site ? { source_site: c.site } : {}),
      ...(c.category ? { category: c.category } : {}),
      ...(c.chapterPath ? { chapter: c.chapterPath } : {}),
    },
  })
}

// 点击文章：跳转到搜索页并直接以标题搜索该文章
function searchArticle() {
  router.push({
    path: "/",
    query: { q: props.node.title || props.node.name },
  })
}
</script>
