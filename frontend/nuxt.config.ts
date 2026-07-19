export default defineNuxtConfig({
  compatibilityDate: "2026-07-14",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss"],
  nitro: {
    preset: "cloudflare_module",
    devProxy: {
      "/api": {
        target: process.env.API_BASE_URL || "https://search-api.transhelper.org",
        changeOrigin: true,
      },
    },
  },
  app: {
    head: {
      title: "Trans-Search",
      meta: [{ name: "description", content: "跨性别信息聚合搜索" }],
    },
  },
  css: ["~/assets/css/main.css"],
  runtimeConfig: {
    public: {
      apiBase: "",
    },
  },
})