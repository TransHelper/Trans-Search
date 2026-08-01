export default defineNuxtPlugin(() => {
  const darkMode = useCookie<string>('dark-mode')

  useHead({
    htmlAttrs: computed(() => ({
      class: darkMode.value === 'dark' ? ['dark'] : [], 
    })),
  })
})
