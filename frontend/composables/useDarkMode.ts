export function useDarkMode() {
  const colorMode = useCookie<string>("dark-mode", {
    default: () => "",
    watch: true,
    maxAge: 60 * 60 * 24 * 365,
  })


  const isDark = computed({
    get: () => {
      if (colorMode.value === "dark") {
        return true
      }

      if (colorMode.value === "light") {
        return false
      }

      // SSR 阶段读取不到系统偏好
      // 首屏状态已经由 nuxt.config.ts script 设置
      if (import.meta.client) {
        return document.documentElement
          .classList.contains("dark")
      }

      return false
    },

    set(value: boolean) {
      colorMode.value = value
        ? "dark"
        : "light"
    },
  })


  function applyTheme(value: boolean) {
    document.documentElement.classList.toggle(
      "dark",
      value
    )
  }


  if (import.meta.client) {

    watch(
      isDark,
      (value) => {
        applyTheme(value)
      },
      {
        immediate: true,
      }
    )


    const mediaQuery =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      )


    const handleSystemChange = (
      e: MediaQueryListEvent
    ) => {

      // 只有跟随系统时响应
      if (!colorMode.value) {
        applyTheme(e.matches)
      }
    }


    mediaQuery.addEventListener(
      "change",
      handleSystemChange
    )


    onUnmounted(() => {
      mediaQuery.removeEventListener(
        "change",
        handleSystemChange
      )
    })
  }


  function toggle() {
    isDark.value = !isDark.value
  }


  function clearPreference() {
    colorMode.value = ""
  }


  return {
    isDark,
    toggle,
    clearPreference,
  }
}