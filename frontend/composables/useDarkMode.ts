export function useDarkMode() {
  const colorMode = useCookie<string>('dark-mode', {
    default: () => '',
    watch: true,
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })

  const isDark = computed({
    get: () => colorMode.value === 'dark',
    set: (val: boolean) => {
      colorMode.value = val ? 'dark' : 'light'
    },
  })

  // Sync cookie <-> <html> class
  if (import.meta.client) {
    watch(isDark, (val) => {
      document.documentElement.classList.toggle('dark', val)
    }, { immediate: true })
  }

  function toggle() {
    isDark.value = !isDark.value
  }

  // If no cookie set yet, use system preference on client
  if (import.meta.client && !colorMode.value) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    isDark.value = prefersDark
  }

  return { isDark, toggle }
}
