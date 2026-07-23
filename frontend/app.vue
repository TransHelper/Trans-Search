<template>
  <div class="min-h-screen flex flex-col">
    <!-- 全局透明遮罩 -->
    <Transition name="fade">
      <div 
        v-if="mobileMenuOpen" 
        @click="mobileMenuOpen = false" 
        class="fixed inset-0 z-40 md:hidden"
      ></div>
    </Transition>

    <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        
        <!-- 1. 左侧区域：Logo -->
        <NuxtLink to="/" class="text-lg font-bold text-primary-600 hover:text-primary-700 shrink-0">
          Trans‑Search
        </NuxtLink>

        <!-- 2. 中央区域：桌面端导航 -->
        <nav class="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          <NuxtLink to="/" class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300" active-class="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium">
            <Icon name="mdi:magnify" class="w-4 h-4 shrink-0 -mt-px" />
            <span>搜索</span>
          </NuxtLink>
          <NuxtLink to="/tree" class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300" active-class="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium">
            <Icon name="mdi:file-tree" class="w-4 h-4 shrink-0 -mt-px" />
            <span>分类</span>
          </NuxtLink>
          <NuxtLink to="/stats" class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300" active-class="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium">
            <Icon name="mdi:chart-bar" class="w-4 h-4 shrink-0 -mt-px" />
            <span>统计</span>
          </NuxtLink>
          <NuxtLink to="/config" class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300" active-class="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium">
            <Icon name="mdi:cog" class="w-4 h-4 shrink-0 -mt-px" />
            <span>管理</span>
          </NuxtLink>
          <NuxtLink to="/about" class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300" active-class="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium">
            <Icon name="mdi:information-outline" class="w-4 h-4 shrink-0 -mt-px" />
            <span>关于</span>
          </NuxtLink>
        </nav>

        <!-- 3. 右侧区域：桌面端暗色切换 + 移动端按钮组 -->
        <div class="flex items-center gap-1 shrink-0">
          <!-- 桌面端暗色模式切换 -->
          <button
            class="hidden md:flex p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            aria-label="切换暗色模式"
            @click="toggleDark"
          >
            <Icon v-if="isDark" name="mdi:white-balance-sunny" class="w-4 h-4 shrink-0 -mt-px" />
            <Icon v-else name="mdi:moon-waning-crescent" class="w-4 h-4 shrink-0 -mt-px" />
          </button>

          <!-- 移动端：暗色切换 + 汉堡菜单 -->
          <button
            class="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            aria-label="切换暗色模式"
            @click="toggleDark"
          >
            <Icon v-if="isDark" name="mdi:white-balance-sunny" class="w-4 h-4 shrink-0" />
            <Icon v-else name="mdi:moon-waning-crescent" class="w-4 h-4 shrink-0" />
          </button>

          <button
            class="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
            aria-label="菜单"
            :aria-expanded="mobileMenuOpen"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <Icon v-if="!mobileMenuOpen" name="mdi:menu" class="w-5 h-5 shrink-0" />
            <Icon v-else name="mdi:close" class="w-5 h-5 shrink-0" />
          </button>
        </div>
      </div>

      <!-- 移动端 Dropdown 菜单 -->
      <Transition name="dropdown">
        <nav 
          v-if="mobileMenuOpen" 
          class="absolute top-full right-4 mt-2 w-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1 z-50 flex flex-col md:hidden"
        >
          <NuxtLink to="/" class="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300" active-class="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium" @click="mobileMenuOpen = false">
            <Icon name="mdi:magnify" class="w-4 h-4 shrink-0 -mt-px" />
            <span>搜索</span>
          </NuxtLink>
          <NuxtLink to="/tree" class="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300" active-class="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium" @click="mobileMenuOpen = false">
            <Icon name="mdi:file-tree" class="w-4 h-4 shrink-0 -mt-px" />
            <span>分类</span>
          </NuxtLink>
          <NuxtLink to="/stats" class="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300" active-class="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium" @click="mobileMenuOpen = false">
            <Icon name="mdi:chart-bar" class="w-4 h-4 shrink-0 -mt-px" />
            <span>统计</span>
          </NuxtLink>
          <NuxtLink to="/config" class="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300" active-class="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium" @click="mobileMenuOpen = false">
            <Icon name="mdi:cog" class="w-4 h-4 shrink-0 -mt-px" />
            <span>管理</span>
          </NuxtLink>
          <NuxtLink to="/about" class="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300" active-class="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium" @click="mobileMenuOpen = false">
            <Icon name="mdi:information-outline" class="w-4 h-4 shrink-0 -mt-px" />
            <span>关于</span>
          </NuxtLink>
        </nav>
      </Transition>
    </header>

    <main class="flex-1 bg-gray-50 dark:bg-gray-950">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
const mobileMenuOpen = ref(false)
const { isDark, toggle: toggleDark } = useDarkMode()

// 1. 菜单打开时锁定背景滚动
watch(mobileMenuOpen, (isOpen) => {
  if (import.meta.client) {
    document.body.style.overflow = isOpen ? 'hidden' : ''
  }
})

// 2. 路由切换时关闭菜单
const router = useRouter()
router.afterEach(() => {
  mobileMenuOpen.value = false
})

// 3. 按 Esc 键关闭菜单
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && mobileMenuOpen.value) {
    mobileMenuOpen.value = false
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<style>
/* Dropdown 弹出动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}
.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* 遮罩层淡入淡出 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>