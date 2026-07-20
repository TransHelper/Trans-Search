<template>
  <div class="min-h-screen flex flex-col">
    <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <NuxtLink to="/" class="text-lg font-bold text-primary-600 hover:text-primary-700 shrink-0">
          Trans‑Search
        </NuxtLink>

        <!-- Desktop nav + dark toggle -->
        <nav class="hidden md:flex items-center gap-1">
          <NuxtLink to="/" class="px-3 py-1.5 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300" active-class="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium">
            搜索
          </NuxtLink>
          <NuxtLink to="/tree" class="px-3 py-1.5 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300" active-class="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium">
            分类
          </NuxtLink>
          <NuxtLink to="/stats" class="px-3 py-1.5 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300" active-class="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium">
            统计
          </NuxtLink>
          <NuxtLink to="/config" class="px-3 py-1.5 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300" active-class="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium">
            管理
          </NuxtLink>
          <NuxtLink to="/about" class="px-3 py-1.5 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300" active-class="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium">
            关于
          </NuxtLink>

          <!-- Dark mode toggle (desktop: inside nav) -->
          <button
            class="ml-1 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            aria-label="切换暗色模式"
            @click="toggleDark"
          >
            <svg v-if="isDark" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
        </nav>

        <!-- Mobile: dark toggle + hamburger (only) -->
        <div class="flex md:hidden items-center gap-1">
          <button
            class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            aria-label="切换暗色模式"
            @click="toggleDark"
          >
            <svg v-if="isDark" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>

          <button
            class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
            aria-label="菜单"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <svg v-if="!mobileMenuOpen" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile slide-down menu -->
      <Transition name="slide-down">
        <nav v-if="mobileMenuOpen" class="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 flex flex-col gap-0.5">
          <NuxtLink to="/" class="px-3 py-2.5 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300" active-class="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium" @click="mobileMenuOpen = false">
            搜索
          </NuxtLink>
          <NuxtLink to="/tree" class="px-3 py-2.5 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300" active-class="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium" @click="mobileMenuOpen = false">
            分类
          </NuxtLink>
          <NuxtLink to="/stats" class="px-3 py-2.5 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300" active-class="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium" @click="mobileMenuOpen = false">
            统计
          </NuxtLink>
          <NuxtLink to="/config" class="px-3 py-2.5 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300" active-class="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium" @click="mobileMenuOpen = false">
            管理
          </NuxtLink>
          <NuxtLink to="/about" class="px-3 py-2.5 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300" active-class="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium" @click="mobileMenuOpen = false">
            关于
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

// Close menu on route change
const router = useRouter()
router.afterEach(() => {
  mobileMenuOpen.value = false
})
</script>

<style>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
}
.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 300px;
}
</style>
