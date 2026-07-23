// composables/useDarkMode.ts
export function useDarkMode() {
  // 1. 核心状态：Cookie 为空字符串代表“跟随系统”
  const colorMode = useCookie<string>('dark-mode', {
    default: () => '', 
    watch: true,
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })

  // 2. 计算属性：有 Cookie 用 Cookie，没 Cookie 读系统偏好
  const isDark = computed({
    get: () => {
      if (colorMode.value === 'dark') return true
      if (colorMode.value === 'light') return false
      
      // SSR 阶段默认返回 false，客户端读取系统偏好
      if (import.meta.client) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
      }
      return false 
    },
    set: (val: boolean) => {
      // 只有手动设置时，才往 Cookie 写入明确的值
      colorMode.value = val ? 'dark' : 'light'
    },
  })

  // 3. 客户端专属逻辑：同步 class 与监听系统变化
  if (import.meta.client) {
    // 监听 isDark 变化，同步到 <html> 标签
    watch(isDark, (val) => {
      document.documentElement.classList.toggle('dark', val)
    }, { immediate: true }) // immediate: true 确保首次加载时也能同步

    // 【新增】监听系统主题变化（仅在“跟随系统”模式下生效）
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemChange = (e: MediaQueryListEvent) => {
      // 只有当 Cookie 为空（即用户没有手动设置过偏好）时，才响应系统变化
      if (!colorMode.value) {
        document.documentElement.classList.toggle('dark', e.matches)
      }
    }
    mediaQuery.addEventListener('change', handleSystemChange)
    
    // 组件卸载时清理监听器
    onUnmounted(() => mediaQuery.removeEventListener('change', handleSystemChange))
  }

  // 4. 手动切换
  function toggle() {
    isDark.value = !isDark.value
  }

  // 5. 【新增】恢复跟随系统（清空 Cookie）
  function clearPreference() {
    colorMode.value = '' 
  }

  return { isDark, toggle, clearPreference }
}