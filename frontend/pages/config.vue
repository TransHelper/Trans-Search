<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6 dark:text-white">管理后台</h1>

    <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-6">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Key</label>
      <input
        v-model="adminKey"
        type="password"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 dark:text-gray-100"
        placeholder="输入 Admin Key 以解锁管理功能"
      />
    </div>

    <div v-if="!authenticated" class="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
      请输入上方 Admin Key 以查看和修改配置
    </div>

    <template v-if="authenticated">
      <!-- Tab bar -->
      <div class="flex flex-wrap gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="px-4 py-2 text-sm rounded-t-lg -mb-px border-b-2"
          :class="activeTab === tab.key ? 'border-primary-600 text-primary-700 dark:text-primary-400 font-medium' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'"
          @click="switchTab(tab.key)"
        >{{ tab.label }}</button>
      </div>

      <div v-if="globalStatus" class="mb-4 px-4 py-2 rounded-lg text-sm" :class="globalStatusOk ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'">
        {{ globalStatus }}
      </div>

      <!-- ══════════════ 概览 ══════════════ -->
      <div v-if="activeTab === 'overview'">
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <p class="text-2xl font-bold text-primary-600 dark:text-primary-400">{{ overviewStats?.total_chunks ?? "—" }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">向量块总数</p>
          </div>
          <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <p class="text-2xl font-bold text-primary-600 dark:text-primary-400">{{ totalArticlesCount }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">已入库文章</p>
          </div>
          <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <p class="text-2xl font-bold text-primary-600 dark:text-primary-400">{{ overviewStats?.searches_today ?? "—" }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">今日搜索次数</p>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold dark:text-gray-200">知识树概览</h2>
            <button class="text-xs text-primary-600 dark:text-primary-400 hover:underline" @click="loadTree">刷新</button>
          </div>
          <div v-if="treeLoading" class="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">加载中…</div>
          <div v-else-if="treeData.length === 0" class="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">暂无数据</div>
          <div v-else class="text-sm space-y-1 max-h-72 overflow-y-auto">
            <div v-for="row in overviewRows" :key="row.key" :style="{ paddingLeft: `${row.depth * 14}px` }" class="text-gray-600 dark:text-gray-400">
              <template v-if="row.isArticle">📄 {{ row.node.title || row.node.name }}</template>
              <template v-else><span class="font-medium text-gray-800 dark:text-gray-200">{{ nodeIcon(row.node.type) }} {{ row.node.name }}</span> <span class="text-xs text-gray-400 dark:text-gray-500">({{ row.count }})</span></template>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════ 知识树管理 ══════════════ -->
      <div v-if="activeTab === 'tree'" class="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 items-start">
        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 flex-wrap">
            <button class="px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 dark:text-gray-300 rounded disabled:opacity-40" :disabled="!selectedNode" @click="teRename">重命名</button>
            <button class="px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 dark:text-gray-300 rounded disabled:opacity-40" :disabled="!selectedNode || selectedNode.type === 'article'" @click="teAddChild">新建子节点</button>
            <button class="px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 dark:text-gray-300 rounded disabled:opacity-40" :disabled="!selectedNode" @click="teMove(-1)" title="上移（仅本地展示，不持久化）">↑</button>
            <button class="px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 dark:text-gray-300 rounded disabled:opacity-40" :disabled="!selectedNode" @click="teMove(1)" title="下移（仅本地展示，不持久化）">↓</button>
            <button class="ml-auto px-2 py-1 text-xs border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded disabled:opacity-40" :disabled="!selectedNode" @click="teDelete">删除</button>
          </div>
          <div class="max-h-[560px] overflow-y-auto">
            <div v-if="treeLoading" class="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">加载中…</div>
            <div v-else-if="treeData.length === 0" class="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">暂无数据</div>
            <template v-for="site in treeData" :key="site.name">
              <template v-for="row in rowsForNode(site)" :key="row.key">
                <div
                  class="flex items-center gap-2 py-1.5 px-2 text-sm cursor-pointer border-l-2"
                  :class="selectedKey === row.key ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300'"
                  :style="{ paddingLeft: `${8 + row.depth * 14}px` }"
                  @click="selectRow(row)"
                >
                  <svg v-if="!row.isArticle" class="w-3 h-3 text-gray-400 dark:text-gray-500 shrink-0 transition-transform" :class="{ 'rotate-90': expandedKeys.has(row.key) }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" @click.stop="toggleExpanded(row.key)"><path stroke-linecap="round" stroke-linejoin="round" d="M9 18l6-6-6-6" /></svg>
                  <span v-else class="w-3 shrink-0"></span>
                  <span class="truncate dark:text-gray-300">{{ row.isArticle ? '📄 ' + (row.node.title || row.node.name) : nodeIcon(row.node.type) + ' ' + row.node.name }}</span>
                  <span v-if="!row.isArticle" class="text-xs text-gray-400 dark:text-gray-500 shrink-0 ml-auto">{{ row.count }}项</span>
                </div>
              </template>
            </template>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 flex-wrap">
            <span class="text-sm font-medium dark:text-gray-200">{{ selectedNode ? `「${selectedNode.name || selectedNode.title}」的文章` : '从左侧选择节点以查看文章' }}</span>
            <span class="text-xs text-gray-400 dark:text-gray-500">{{ panelArticles.length ? panelArticles.length + ' 篇' : '' }}</span>
            <input v-if="panelArticles.length" v-model="panelSearch" placeholder="标题搜索…" class="ml-auto px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-gray-200" />
            <button v-if="panelChecked.size" class="px-2 py-1 text-xs border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded" @click="batchDeleteChecked">批量删除（{{ panelChecked.size }}）</button>
          </div>
          <div v-if="!selectedNode" class="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">请选择左侧节点</div>
          <div v-else-if="filteredPanelArticles.length === 0" class="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">暂无文章</div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                  <th class="p-2 w-8"><input type="checkbox" :checked="allChecked" @change="toggleAllChecked($event)" /></th>
                  <th class="p-2 text-left">标题</th>
                  <th class="p-2 text-left">来源 / 章节</th>
                  <th class="p-2 text-left">标记</th>
                  <th class="p-2 text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="a in filteredPanelArticles" :key="a.article_id" class="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td class="p-2"><input type="checkbox" :checked="panelChecked.has(a.article_id)" @change="toggleChecked(a.article_id)" /></td>
                  <td class="p-2 max-w-[200px] truncate dark:text-gray-200" :title="a.title">{{ a.title }}</td>
                  <td class="p-2 text-xs text-gray-500 dark:text-gray-400 max-w-[160px] truncate">{{ a.source_site || '—' }} / {{ a.chapter || '—' }}</td>
                  <td class="p-2 text-xs">
                    <span v-for="f in a.flags || []" :key="f" class="inline-block px-1.5 py-0.5 mr-1 rounded text-[10px]" :class="flagBadgeClass(f)">{{ flagLabel(f) }}</span>
                  </td>
                  <td class="p-2">
                    <div class="flex gap-2 items-center">
                      <a v-if="a.url" :href="a.url" target="_blank" class="text-xs text-primary-600 dark:text-primary-400 hover:underline">原文</a>
                      <button class="text-xs text-gray-500 dark:text-gray-400 hover:underline" @click="openEditModal(a)">编辑</button>
                      <button class="text-xs text-red-500 dark:text-red-400 hover:underline" @click="singleDeleteArticle(a.article_id)">删除</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ══════════════ 录入单篇 ══════════════ -->
      <div v-if="activeTab === 'single'" class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 space-y-3 max-w-2xl">
        <div><label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">文章标题 *</label><input v-model="singleForm.title" class="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100" /></div>
        <div><label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">原文 URL</label><input v-model="singleForm.url" class="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">来源站点</label><input v-model="singleForm.source_site" class="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100" /></div>
          <div><label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">顶层分类</label><input v-model="singleForm.category" class="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100" /></div>
        </div>
        <div><label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">章节路径（斜杠分隔）</label><input v-model="singleForm.chapter" placeholder="如：药物/HRT/雌激素药物" class="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500" /></div>
        <div><label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">标签（逗号分隔）</label><input v-model="singleForm.tags" class="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100" /></div>
        <div>
          <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">内容标记</label>
          <div class="flex gap-2 flex-wrap">
            <label v-for="f in FLAGS" :key="f" class="flex items-center gap-1 text-xs px-2 py-1 border rounded-full cursor-pointer" :class="singleForm.flags.includes(f) ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'">
              <input type="checkbox" class="hidden" :checked="singleForm.flags.includes(f)" @change="toggleArrItem(singleForm.flags, f)" />{{ flagLabel(f) }}
            </label>
          </div>
        </div>
        <div><label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">正文内容（Markdown）*</label><textarea v-model="singleForm.content" rows="10" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-mono bg-white dark:bg-gray-800 dark:text-gray-100"></textarea></div>
        <div class="flex items-center gap-3">
          <button class="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50" :disabled="singleSubmitting" @click="submitSingle">{{ singleSubmitting ? '提交中…' : '提交入库' }}</button>
          <span v-if="singleResult" class="text-sm" :class="singleOk ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">{{ singleResult }}</span>
        </div>
      </div>

      <!-- ══════════════ 批量上传 ══════════════ -->
      <div v-if="activeTab === 'batch'" class="space-y-4 max-w-3xl">
        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h2 class="text-sm font-semibold mb-3 dark:text-gray-200">默认元数据（文件无 frontmatter / 非文件夹上传时使用）</h2>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div><label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">来源站点</label><input v-model="batchDefaults.source_site" class="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100" /></div>
            <div><label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">顶层分类</label><input v-model="batchDefaults.category" class="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100" /></div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">默认内容标记</label>
            <div class="flex gap-2 flex-wrap">
              <label v-for="f in FLAGS" :key="f" class="flex items-center gap-1 text-xs px-2 py-1 border rounded-full cursor-pointer" :class="batchDefaults.flags.includes(f) ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'">
                <input type="checkbox" class="hidden" :checked="batchDefaults.flags.includes(f)" @change="toggleArrItem(batchDefaults.flags, f)" />{{ flagLabel(f) }}
              </label>
            </div>
          </div>
          <p class="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 mt-3">
            文件夹上传时，目录层级自动映射为知识树：<code class="text-[11px]">来源站点/分类/章节/文章.md</code> → source_site / category / chapter。文件内 frontmatter（--- 包裹的 YAML）优先于以上默认值和目录推断。
          </p>
        </div>

        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div class="grid grid-cols-2 gap-3 mb-3">
            <label class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/40 dark:hover:bg-primary-900/20 text-sm text-gray-500 dark:text-gray-400">
              选择 .md 文件（支持多选）
              <input type="file" multiple accept=".md" class="hidden" @change="onFileSelect" />
            </label>
            <label class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/40 dark:hover:bg-primary-900/20 text-sm text-gray-500 dark:text-gray-400">
              选择文件夹（自动扫描 .md）
              <input type="file" webkitdirectory multiple class="hidden" @change="onFolderSelect" />
            </label>
          </div>

          <div v-if="batchFiles.length" class="space-y-1.5 mb-3 max-h-72 overflow-y-auto">
            <div v-for="f in batchFiles" :key="f.relPath" class="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-1.5 text-xs">
              <span class="flex-1 truncate font-medium dark:text-gray-200">{{ f.file.name }}</span>
              <span class="text-gray-400 truncate max-w-[220px]">{{ f.relPath }}</span>
              <span class="px-2 py-0.5 rounded shrink-0" :class="fstatusClass(f.status)">{{ fstatusLabel(f.status) }}</span>
            </div>
          </div>

          <div v-if="batchFiles.length" class="flex items-center gap-2">
            <button class="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50" :disabled="batchRunning" @click="startBatch">{{ batchRunning ? '入库中…' : '开始入库' }}</button>
            <button class="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:underline" @click="clearFiles">清空列表</button>
            <span class="text-xs text-gray-400 dark:text-gray-500">{{ batchProgress }}</span>
          </div>

          <div v-if="batchLog.length" class="bg-gray-900 rounded-lg p-3 mt-3 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto">
            <div v-for="(l, i) in batchLog" :key="i" :class="logColor(l.type)">{{ l.msg }}</div>
          </div>
        </div>
      </div>

      <!-- ══════════════ 缓存管理 ══════════════ -->
      <div v-if="activeTab === 'cache'">
        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold dark:text-gray-200">高频词缓存（长期记忆）</h2>
            <button class="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800" @click="loadKeywords">刷新</button>
          </div>
          <div class="flex flex-wrap items-center gap-2 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <input v-model="newKeyword" placeholder="关键词（如 HRT）" class="flex-1 min-w-[120px] px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500" />
            <input v-model="newExpansionsInput" placeholder="扩展词（逗号分隔）" class="flex-[2] min-w-[200px] px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500" />
            <button class="px-4 py-1.5 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 disabled:opacity-50" :disabled="!newKeyword.trim() || !newExpansionsInput.trim()" @click="addKeyword">{{ editingKeyword ? "更新" : "添加" }}</button>
            <button v-if="editingKeyword" class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800" @click="cancelEdit">取消</button>
          </div>
          <div v-if="keywordsLoading" class="text-center py-4 text-gray-400 dark:text-gray-500 text-sm">加载中…</div>
          <div v-else-if="Object.keys(keywords).length === 0" class="text-center py-4 text-gray-400 dark:text-gray-500 text-sm">暂无高频词缓存，添加后搜索将优先使用预设扩展词</div>
          <div v-else class="space-y-2">
            <div v-for="(entry, key) in keywords" :key="key" class="flex items-start gap-2 p-3 border border-gray-100 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
              <div class="flex-1 min-w-0">
                <span class="font-mono text-sm font-medium text-gray-800 dark:text-gray-200">{{ key }}</span>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">↳ {{ entry.expansions.join("、") }}</div>
              </div>
              <div class="flex gap-1 shrink-0">
                <button class="px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" @click="editKeyword(key as string, entry.expansions)">编辑</button>
                <button class="px-2 py-1 text-xs border border-red-200 dark:border-red-800 rounded text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" @click="removeKeyword(key as string)">删除</button>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold dark:text-gray-200">短期缓存（内存）</h2>
            <button class="px-3 py-1 text-xs border border-red-200 dark:border-red-800 rounded-md text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" @click="clearCache">清除全部</button>
          </div>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">搜索结果自动缓存 5 分钟，重复搜索直接从内存返回</p>
        </div>
      </div>

      <!-- ══════════════ 系统配置 ══════════════ -->
      <div v-if="activeTab === 'settings'">
        <div v-if="loading" class="text-center py-8 text-gray-400 dark:text-gray-500">加载配置…</div>
        <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm mb-4">{{ error }}</div>

        <div v-if="config" class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-6">
          <h2 class="text-lg font-semibold mb-4 dark:text-gray-200">运行时配置</h2>
          <div class="space-y-4">
            <div v-for="(val, key) in config" :key="key" class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">{{ labelMap[key as string] ?? key }}</span>
              <span v-if="typeof val === 'boolean'" class="text-sm"><span :class="val ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'">{{ val ? "开启" : "关闭" }}</span></span>
              <span v-else class="text-sm font-mono text-gray-800 dark:text-gray-200">{{ val }}</span>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-6">
          <h2 class="text-lg font-semibold mb-4 dark:text-gray-200">修改配置</h2>
          <div class="space-y-3">
            <div v-for="field in editableFields" :key="field.key" class="flex items-center gap-3">
              <label class="text-sm text-gray-600 dark:text-gray-400 w-28 shrink-0">{{ field.label }}</label>
              <input v-if="field.type === 'text'" v-model="editForm[field.key]" class="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-400 bg-white dark:bg-gray-800 dark:text-gray-100" />
              <input v-else-if="field.type === 'number'" v-model.number="editForm[field.key]" type="number" class="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-400 w-24 bg-white dark:bg-gray-800 dark:text-gray-100" />
              <select v-else-if="field.type === 'boolean'" v-model="editForm[field.key]" class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-400">
                <option :value="true">开启</option>
                <option :value="false">关闭</option>
              </select>
            </div>
            <div class="pt-2">
              <button class="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50" :disabled="saving" @click="saveConfig">{{ saving ? "保存中…" : "保存配置" }}</button>
              <span v-if="saved" class="text-green-600 dark:text-green-400 text-sm ml-3">已保存</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 编辑文章 Modal -->
    <div v-if="editModal.open" class="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4" @click.self="editModal.open = false">
      <div class="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-bold mb-4 dark:text-gray-200">编辑文章</h3>
        <div class="space-y-3">
          <div><label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">标题</label><input v-model="editModal.title" class="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100" /></div>
          <div><label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">原文 URL</label><input v-model="editModal.url" class="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100" /></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">来源站点</label><input v-model="editModal.source_site" class="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100" /></div>
            <div><label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">分类</label><input v-model="editModal.category" class="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100" /></div>
          </div>
          <div><label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">章节路径</label><input v-model="editModal.chapter" class="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100" /></div>
          <div><label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">标签（逗号分隔）</label><input v-model="editModal.tags" class="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100" /></div>
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">内容标记</label>
            <div class="flex gap-2 flex-wrap">
              <label v-for="f in FLAGS" :key="f" class="flex items-center gap-1 text-xs px-2 py-1 border rounded-full cursor-pointer" :class="editModal.flags.includes(f) ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'">
                <input type="checkbox" class="hidden" :checked="editModal.flags.includes(f)" @change="toggleArrItem(editModal.flags, f)" />{{ flagLabel(f) }}
              </label>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-5">
          <button class="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400" @click="editModal.open = false">取消</button>
          <button class="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700" @click="saveEditModal">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const {
  setAdminKey, getAdminKey,
  getConfig, updateConfig,
  getCacheKeywords, putCacheKeyword, deleteCacheKeyword, clearShortCache,
  getTree, getStats,
  indexArticle, deleteArticle, updateArticleMeta,
} = useApi()

const adminKey = ref(getAdminKey() ?? "")
const authenticated = ref(!!getAdminKey())

const tabs = [
  { key: "overview", label: "概览" },
  { key: "tree", label: "知识树管理" },
  { key: "single", label: "录入单篇" },
  { key: "batch", label: "批量上传" },
  { key: "cache", label: "缓存管理" },
  { key: "settings", label: "系统配置" },
]
const activeTab = ref("overview")
const globalStatus = ref("")
const globalStatusOk = ref(true)
function flash(msg: string, ok = true) {
  globalStatus.value = msg
  globalStatusOk.value = ok
  setTimeout(() => { if (globalStatus.value === msg) globalStatus.value = "" }, 4000)
}

const FLAGS = ["ai", "risk", "reviewed", "outdated"]
const FLAG_LABELS: Record<string, string> = { ai: "AI 参与生成", risk: "风险内容", reviewed: "专业审核", outdated: "可能过时" }
const FLAG_BADGE: Record<string, string> = {
  ai: "bg-blue-100 text-blue-700", risk: "bg-amber-100 text-amber-700",
  reviewed: "bg-green-100 text-green-700", outdated: "bg-purple-100 text-purple-700",
}
function flagLabel(f: string) { return FLAG_LABELS[f] ?? f }
function flagBadgeClass(f: string) { return FLAG_BADGE[f] ?? "bg-gray-100 text-gray-600" }
function toggleArrItem(arr: string[], val: string) {
  const i = arr.indexOf(val)
  if (i === -1) arr.push(val); else arr.splice(i, 1)
}
function nodeIcon(type: string) {
  return type === "site" ? "🌐" : type === "category" ? "📁" : "📂"
}

watch(adminKey, (val) => {
  setAdminKey(val)
  authenticated.value = !!val
  if (val) {
    loadTree()
    loadOverviewStats()
    loadKeywords()
    loadConfig()
  }
})

function switchTab(key: string) {
  activeTab.value = key
  if (key === "overview") loadOverviewStats()
  if (key === "tree" && treeData.value.length === 0) loadTree()
  if (key === "cache") loadKeywords()
  if (key === "settings") loadConfig()
}

// ═══════════════════════════ 概览 ═══════════════════════════
const overviewStats = ref<any>(null)
async function loadOverviewStats() {
  try { overviewStats.value = await getStats() } catch { /* ignore */ }
}

// ═══════════════════════════ 知识树（共享：概览预览 + 管理） ═══════════════════════════
const treeData = ref<any[]>([])
const treeLoading = ref(false)
const expandedKeys = reactive(new Set<string>())
const selectedNode = ref<any>(null)
const selectedKey = ref<string | null>(null)

type Ctx = { source_site?: string; category?: string; chapter?: string }
type Row = { key: string; node: any; depth: number; isArticle: boolean; count: number } & Ctx

function countArticles(node: any): number {
  if (!node) return 0
  if (node.type === "article") return 1
  if (!node.children || node.children.length === 0) return 0
  return node.children.reduce((s: number, c: any) => s + countArticles(c), 0)
}

function flattenNode(nodes: any[], depth: number, parentKey: string, ctx: Ctx, onlyExpanded: boolean): Row[] {
  const rows: Row[] = []
  for (const node of nodes || []) {
    const key = parentKey ? `${parentKey}/${node.name}` : node.name
    if (node.type === "article") {
      rows.push({ key, node, depth, isArticle: true, count: 1, ...ctx })
      continue
    }
    const newCtx: Ctx = { ...ctx }
    if (node.type === "site") newCtx.source_site = node.name
    if (node.type === "category") newCtx.category = node.name
    if (node.type === "chapter") newCtx.chapter = newCtx.chapter ? `${newCtx.chapter}/${node.name}` : node.name
    rows.push({ key, node, depth, isArticle: false, count: countArticles(node), ...newCtx })
    if (!onlyExpanded || expandedKeys.has(key)) {
      rows.push(...flattenNode(node.children || [], depth + 1, key, newCtx, onlyExpanded))
    }
  }
  return rows
}
function rowsForNode(node: any): Row[] { return flattenNode([node], 0, "", {}, true) }
const overviewRows = computed(() => treeData.value.flatMap((site) => flattenNode([site], 0, "", {}, false)))
const totalArticlesCount = computed(() => treeData.value.reduce((s, site) => s + countArticles(site), 0))

async function loadTree() {
  treeLoading.value = true
  try {
    treeData.value = await getTree()
    for (const site of treeData.value) expandedKeys.add(site.name)
  } catch (e: any) {
    flash("知识树加载失败：" + e.message, false)
  } finally {
    treeLoading.value = false
  }
}
function toggleExpanded(key: string) {
  if (expandedKeys.has(key)) expandedKeys.delete(key); else expandedKeys.add(key)
}

function selectRow(row: Row) {
  selectedNode.value = row.node
  selectedKey.value = row.key
  if (!row.isArticle) expandedKeys.add(row.key)
  panelChecked.clear()
  panelSearch.value = ""
}

// 在树中定位某节点的父数组与下标（引用比较，任意深度）
function locateInTree(target: any): { arr: any[]; idx: number } | null {
  function search(list: any[]): { arr: any[]; idx: number } | null {
    for (let i = 0; i < list.length; i++) {
      if (list[i] === target) return { arr: list, idx: i }
      if (list[i].children) {
        const r = search(list[i].children)
        if (r) return r
      }
    }
    return null
  }
  return search(treeData.value)
}

// 收集某节点下所有文章，并附带该节点位置对应的最新 source_site/category/chapter
function collectArticlesWithCtx(target: any): any[] {
  function gather(n: any, ctx: Ctx): any[] {
    if (n.type === "article") return [{ ...n, ...ctx }]
    return (n.children || []).flatMap((c: any) => gather(c, ctx))
  }
  function walk(list: any[], ctx: Ctx): any[] | null {
    for (const n of list) {
      const newCtx: Ctx = { ...ctx }
      if (n.type === "site") newCtx.source_site = n.name
      if (n.type === "category") newCtx.category = n.name
      if (n.type === "chapter") newCtx.chapter = newCtx.chapter ? `${newCtx.chapter}/${n.name}` : n.name
      if (n === target) return gather(n, newCtx)
      if (n.children) {
        const found = walk(n.children, newCtx)
        if (found) return found
      }
    }
    return null
  }
  return walk(treeData.value, {}) ?? []
}

async function teRename() {
  const node = selectedNode.value
  if (!node) return
  const oldVal = node.name || node.title
  const val = window.prompt("新名称：", oldVal)
  if (!val || !val.trim() || val.trim() === oldVal) return
  if (node.type === "article") { node.title = val.trim(); node.name = val.trim() }
  else node.name = val.trim()

  if (node.type !== "article") {
    const field = node.type === "site" ? "source_site" : node.type === "category" ? "category" : "chapter"
    const arts = collectArticlesWithCtx(node)
    flash(`正在同步重命名到 ${arts.length} 篇文章…`)
    let ok = 0
    for (const a of arts) {
      try { await updateArticleMeta(a.article_id, { [field]: (a as any)[field] }); ok++ } catch { /* continue */ }
    }
    flash(`重命名完成，已同步 ${ok}/${arts.length} 篇文章`)
    await loadTree()
    selectedNode.value = null
    selectedKey.value = null
  }
}

function teAddChild() {
  const node = selectedNode.value
  if (!node || node.type === "article") return
  const name = window.prompt("新节点名称：")
  if (!name || !name.trim()) return
  if (!node.children) node.children = []
  const nextType = node.type === "site" ? "category" : "chapter"
  node.children.push({ name: name.trim(), type: nextType, children: [] })
  expandedKeys.add(selectedKey.value!)
  flash("已在本地添加节点（未持久化，需通过录入/批量上传实际写入文章后才会永久出现）")
}

function teMove(dir: -1 | 1) {
  const node = selectedNode.value
  if (!node) return
  const loc = locateInTree(node)
  if (!loc) return
  const { arr, idx } = loc
  const j = idx + dir
  if (j < 0 || j >= arr.length) return
  ;[arr[idx], arr[j]] = [arr[j], arr[idx]]
}

async function teDelete() {
  const node = selectedNode.value
  if (!node) return
  const label = node.name || node.title || "此节点"
  const extra = node.type !== "article" ? "\n注意：节点下的文章数据不会从数据库中删除，仅移除树形展示（刷新知识树后会重新出现，除非文章本身被删除）。" : ""
  if (!window.confirm(`确认删除「${label}」？${extra}`)) return
  if (node.type === "article") {
    try {
      await deleteArticle(node.article_id)
    } catch (e: any) {
      flash("删除失败：" + e.message, false)
      return
    }
  }
  const loc = locateInTree(node)
  if (loc) loc.arr.splice(loc.idx, 1)
  selectedNode.value = null
  selectedKey.value = null
  flash("已删除")
  loadOverviewStats()
}

// ── 右侧文章面板 ──
const panelSearch = ref("")
const panelChecked = reactive(new Set<string>())
const panelArticles = computed(() => (selectedNode.value ? collectArticlesWithCtx(selectedNode.value) : []))
const filteredPanelArticles = computed(() => {
  const q = panelSearch.value.trim().toLowerCase()
  if (!q) return panelArticles.value
  return panelArticles.value.filter((a) => (a.title || "").toLowerCase().includes(q))
})
const allChecked = computed(() => filteredPanelArticles.value.length > 0 && filteredPanelArticles.value.every((a) => panelChecked.has(a.article_id)))
function toggleChecked(id: string) {
  if (panelChecked.has(id)) panelChecked.delete(id); else panelChecked.add(id)
}
function toggleAllChecked(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  for (const a of filteredPanelArticles.value) {
    if (checked) panelChecked.add(a.article_id); else panelChecked.delete(a.article_id)
  }
}

async function singleDeleteArticle(id: string) {
  if (!window.confirm("确认删除这篇文章的所有向量数据？")) return
  try {
    await deleteArticle(id)
    flash("已删除")
    await loadTree()
    // 尝试保持在同一节点（按 key 重新查找）
    selectedNode.value = null
    selectedKey.value = null
    loadOverviewStats()
  } catch (e: any) {
    flash("删除失败：" + e.message, false)
  }
}

async function batchDeleteChecked() {
  const ids = [...panelChecked]
  if (!ids.length) return
  if (!window.confirm(`确认删除选中的 ${ids.length} 篇文章？此操作不可撤销。`)) return
  let ok = 0, fail = 0
  for (const id of ids) {
    try { await deleteArticle(id); ok++ } catch { fail++ }
  }
  panelChecked.clear()
  flash(`完成：删除 ${ok} 篇${fail ? "，失败 " + fail + " 篇" : ""}`)
  await loadTree()
  selectedNode.value = null
  selectedKey.value = null
  loadOverviewStats()
}

// ── 编辑文章 Modal ──
const editModal = reactive({
  open: false, id: "", title: "", url: "", source_site: "", category: "", chapter: "", tags: "", flags: [] as string[],
})
function openEditModal(a: any) {
  editModal.open = true
  editModal.id = a.article_id
  editModal.title = a.title || ""
  editModal.url = a.url || ""
  editModal.source_site = a.source_site || ""
  editModal.category = a.category || ""
  editModal.chapter = a.chapter || ""
  editModal.tags = (a.tags || []).join(", ")
  editModal.flags = [...(a.flags || [])]
}
async function saveEditModal() {
  try {
    await updateArticleMeta(editModal.id, {
      title: editModal.title,
      url: editModal.url,
      source_site: editModal.source_site,
      category: editModal.category,
      chapter: editModal.chapter,
      tags: editModal.tags.split(",").map((s) => s.trim()).filter(Boolean),
      flags: editModal.flags,
    })
    editModal.open = false
    flash("已保存")
    await loadTree()
    selectedNode.value = null
    selectedKey.value = null
  } catch (e: any) {
    flash("保存失败：" + e.message, false)
  }
}

// ═══════════════════════════ 录入单篇 ═══════════════════════════
const singleForm = reactive({ title: "", url: "", source_site: "", category: "", chapter: "", tags: "", flags: [] as string[], content: "" })
const singleSubmitting = ref(false)
const singleResult = ref("")
const singleOk = ref(true)
async function submitSingle() {
  if (!singleForm.title.trim() || !singleForm.content.trim()) {
    singleResult.value = "标题和正文不能为空"; singleOk.value = false
    return
  }
  singleSubmitting.value = true
  singleResult.value = "提交中…"
  try {
    await indexArticle({
      title: singleForm.title.trim(),
      content: singleForm.content,
      url: singleForm.url || undefined,
      source_site: singleForm.source_site || undefined,
      category: singleForm.category || undefined,
      chapter: singleForm.chapter || undefined,
      tags: singleForm.tags.split(",").map((s) => s.trim()).filter(Boolean),
      flags: singleForm.flags,
    })
    singleResult.value = "✓ 已提交入库"
    singleOk.value = true
    singleForm.title = ""; singleForm.url = ""; singleForm.chapter = ""; singleForm.tags = ""; singleForm.content = ""; singleForm.flags = []
    if (treeData.value.length) loadTree()
  } catch (e: any) {
    singleResult.value = "✗ " + e.message
    singleOk.value = false
  } finally {
    singleSubmitting.value = false
  }
}

// ═══════════════════════════ 批量上传 ═══════════════════════════
const batchDefaults = reactive({ source_site: "", category: "", flags: [] as string[] })
interface BatchFile { file: File; relPath: string; status: "pending" | "loading" | "success" | "error"; message?: string }
const batchFiles = ref<BatchFile[]>([])
const batchRunning = ref(false)
const batchLog = ref<{ msg: string; type: string }[]>([])
const batchProgress = ref("")

function log(msg: string, type = "info") { batchLog.value.push({ msg, type }) }
function logColor(type: string) {
  return { ok: "text-green-400", err: "text-red-400", info: "text-blue-300", warn: "text-yellow-300" }[type] ?? "text-blue-300"
}
function fstatusLabel(s: string) { return { pending: "待处理", loading: "入库中", success: "成功", error: "失败" }[s] ?? s }
function fstatusClass(s: string) {
  return {
    pending: "bg-gray-100 text-gray-500", loading: "bg-amber-100 text-amber-700",
    success: "bg-green-100 text-green-700", error: "bg-red-100 text-red-700",
  }[s] ?? "bg-gray-100 text-gray-500"
}

function onFileSelect(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files || [])
  for (const file of files) {
    if (!file.name.endsWith(".md")) continue
    batchFiles.value.push({ file, relPath: file.name, status: "pending" })
  }
}
function onFolderSelect(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files || [])
  for (const file of files) {
    if (!file.name.endsWith(".md")) continue
    const rel = (file as any).webkitRelativePath || file.name
    batchFiles.value.push({ file, relPath: rel, status: "pending" })
  }
}
function clearFiles() { batchFiles.value = []; batchLog.value = []; batchProgress.value = "" }

function parseFrontmatter(text: string): { meta: Record<string, any>; body: string } {
  const m = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!m) return { meta: {}, body: text }
  const meta: Record<string, any> = {}
  for (const line of m[1].split("\n")) {
    const idx = line.indexOf(":")
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let val = line.slice(idx + 1).trim()
    if (!key) continue
    if (val.startsWith("[") && val.endsWith("]")) {
      meta[key] = val.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean)
    } else {
      meta[key] = val.replace(/^["']|["']$/g, "")
    }
  }
  return { meta, body: m[2] }
}

// 文件夹上传：relPath 形如 "选中的根目录/来源站点/分类/章节.../文章.md"
// 去掉根目录与文件名后，剩余段依次映射为 source_site / category / chapter
function pathMeta(relPath: string): { source_site?: string; category?: string; chapter?: string } {
  const parts = relPath.split("/")
  if (parts.length <= 2) return {} // 非文件夹上传（无中间目录）
  const mid = parts.slice(1, -1) // 去掉根目录与文件名
  return {
    source_site: mid[0],
    category: mid[1],
    chapter: mid.slice(2).join("/") || undefined,
  }
}

async function startBatch() {
  batchRunning.value = true
  batchLog.value = []
  let done = 0
  const total = batchFiles.value.length
  for (const f of batchFiles.value) {
    f.status = "loading"
    batchProgress.value = `${done}/${total}`
    try {
      const text = await f.file.text()
      const { meta, body } = parseFrontmatter(text)
      const pm = pathMeta(f.relPath)
      const title = meta.title || f.file.name.replace(/\.md$/, "")
      const tags = Array.isArray(meta.tags) ? meta.tags : (typeof meta.tags === "string" ? meta.tags.split(",").map((s: string) => s.trim()).filter(Boolean) : [])
      const flags = Array.isArray(meta.flags) ? meta.flags : batchDefaults.flags
      await indexArticle({
        title,
        content: body.trim() || text,
        url: meta.url || undefined,
        source_site: meta.source_site || pm.source_site || batchDefaults.source_site || undefined,
        category: meta.category || pm.category || batchDefaults.category || undefined,
        chapter: meta.chapter || pm.chapter || undefined,
        tags,
        flags,
      })
      f.status = "success"
      log(`✓ ${f.relPath}`, "ok")
    } catch (e: any) {
      f.status = "error"
      f.message = e.message
      log(`✗ ${f.relPath}: ${e.message}`, "err")
    }
    done++
    batchProgress.value = `${done}/${total}`
  }
  batchRunning.value = false
  log(`完成：共 ${total} 个文件`, "info")
  loadTree()
  loadOverviewStats()
}

// ═══════════════════════════ 缓存管理 ═══════════════════════════
const keywords = ref<Record<string, { expansions: string[] }>>({})
const keywordsLoading = ref(false)
const newKeyword = ref("")
const newExpansionsInput = ref("")
const editingKeyword = ref<string | null>(null)

async function loadKeywords() {
  keywordsLoading.value = true
  try { keywords.value = await getCacheKeywords() } catch (e: any) { flash(e.message, false) } finally { keywordsLoading.value = false }
}
function editKeyword(key: string, expansions: string[]) {
  editingKeyword.value = key
  newKeyword.value = key
  newExpansionsInput.value = expansions.join("，")
}
function cancelEdit() {
  editingKeyword.value = null
  newKeyword.value = ""
  newExpansionsInput.value = ""
}
async function addKeyword() {
  const keyword = newKeyword.value.trim()
  const raw = newExpansionsInput.value.trim()
  if (!keyword || !raw) return
  const expansions = raw.split(/[，,、]/).map((s) => s.trim()).filter(Boolean)
  if (expansions.length === 0) return
  try {
    await putCacheKeyword(keyword, expansions)
    if (editingKeyword.value && editingKeyword.value !== keyword) {
      await deleteCacheKeyword(editingKeyword.value).catch(() => {})
    }
    await loadKeywords()
    cancelEdit()
  } catch (e: any) { flash(e.message, false) }
}
async function removeKeyword(keyword: string) {
  if (!window.confirm(`删除「${keyword}」的缓存规则？`)) return
  try { await deleteCacheKeyword(keyword); await loadKeywords() } catch (e: any) { flash(e.message, false) }
}
async function clearCache() {
  if (!window.confirm("清除所有短期缓存？")) return
  try { await clearShortCache(); flash("短期缓存已清除") } catch (e: any) { flash(e.message, false) }
}

// ═══════════════════════════ 系统配置 ═══════════════════════════
const config = ref<any>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref("")
const saved = ref(false)

const labelMap: Record<string, string> = {
  embed_model: "Embedding 模型", chat_model: "对话模型", chunk_size: "分块大小",
  chunk_overlap: "分块重叠", score_threshold: "分数阈值", query_expand: "查询扩展",
  query_expand_threshold: "扩展触发阈值(字符)", hybrid_search: "混合搜索",
}
const editableFields = [
  { key: "embed_model", label: "Embedding 模型", type: "text" },
  { key: "chat_model", label: "对话模型", type: "text" },
  { key: "chunk_size", label: "分块大小", type: "number" },
  { key: "chunk_overlap", label: "分块重叠", type: "number" },
  { key: "score_threshold", label: "分数阈值", type: "number" },
  { key: "query_expand", label: "查询扩展", type: "boolean" },
  { key: "query_expand_threshold", label: "扩展触发阈值(字符)", type: "number" },
  { key: "hybrid_search", label: "混合搜索", type: "boolean" },
]
const editForm = reactive<Record<string, any>>({})

async function loadConfig() {
  loading.value = true
  error.value = ""
  try {
    config.value = await getConfig()
    for (const field of editableFields) editForm[field.key] = config.value[field.key]
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
async function saveConfig() {
  saving.value = true
  saved.value = false
  error.value = ""
  try {
    const changed: Record<string, any> = {}
    for (const field of editableFields) {
      if (editForm[field.key] !== config.value[field.key]) changed[field.key] = editForm[field.key]
    }
    if (Object.keys(changed).length > 0) {
      await updateConfig(changed)
      config.value = await getConfig()
    }
    saved.value = true
  } catch (e: any) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}
</script>
