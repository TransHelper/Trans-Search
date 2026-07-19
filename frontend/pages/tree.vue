<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold mb-2">文章分类浏览</h1>
      <p class="text-gray-500 text-sm">按来源 → 分类 → 章节 组织，点击可展开子级；点击「限定搜索」可将该范围带入搜索页</p>
    </div>

    <div v-if="loading" class="text-center py-16 text-gray-400">加载中…</div>
    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{{ error }}</div>

    <div v-if="!loading && !error && tree.length === 0" class="text-center py-16 text-gray-400">
      暂无数据
    </div>

    <div v-if="!loading && tree.length > 0" class="space-y-4">
      <div v-for="site in tree" :key="site.name" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <TreeNode :node="site" :depth="0" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getTree } = useApi()
const tree = ref<any[]>([])
const loading = ref(true)
const error = ref("")

onMounted(async () => {
  try {
    tree.value = await getTree()
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})
</script>
