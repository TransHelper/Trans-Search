export default defineNuxtConfig({
  compatibilityDate: "2026-07-14",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "@nuxt/icon"],
  icon: {
    serverBundle: {
      collections: ["mdi"],
    },
  },
  tailwindcss: {
    config: {
      darkMode: "class",
    },
  },
  nitro: {
    preset: "cloudflare_module",
    devProxy: {
      "/api": {
        target: process.env.API_BASE_URL || "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
  app: {
    head: {
      title: "Trans-Search",
      meta: [{ name: "description", content: "跨性别信息聚合搜索" }],

      // 防止 SSR 首屏深色闪烁
      script: [
        {
          children: `
(function () {
  try {
    var cookie = document.cookie.match(
      /(?:^|; )dark-mode=([^;]*)/
    );

    var preference = cookie
      ? decodeURIComponent(cookie[1])
      : "";

    var dark = false;

    if (preference === "dark") {
      dark = true;
    } else if (preference === "light") {
      dark = false;
    } else {
      dark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
    }

    document.documentElement.classList.toggle(
      "dark",
      dark
    );
  } catch (_) {}
})();
          `,
          type: "text/javascript",
        },
      ],
    },
  },

  css: ["~/assets/css/main.css"],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "https://search-api.transhelper.org",
    },
  },
})