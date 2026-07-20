export default defineNuxtPlugin(() => {
  const darkMode = useCookie<string>('dark-mode')

  // On server: set html class from cookie before rendering
  useHead({
    htmlAttrs: computed(() => ({
      class: darkMode.value === 'dark' ? 'dark' : '',
    })),
  })
})
