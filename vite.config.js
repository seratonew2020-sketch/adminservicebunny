import { fileURLToPath, URL } from "node:url";
import { dirname, resolve } from "node:path";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import VueRouter from "unplugin-vue-router/vite";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { Vuetify3Resolver } from "unplugin-vue-components/resolvers";
import { VueRouterAutoImports } from "unplugin-vue-router";
import autoprefixer from "autoprefixer";
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    VueRouter({}),
    vue(),
    VueI18nPlugin({
      include: resolve(
        dirname(fileURLToPath(import.meta.url)),
        "./src/locales/**",
      ),
    }),
    vueDevTools(),
    AutoImport({
      imports: ["vue", VueRouterAutoImports, "pinia"],
      vueTemplate: true,
    }),
    Components({
      resolvers: [Vuetify3Resolver()],
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  css: {
    postcss: {
      plugins: [autoprefixer()],
    },
  },
});
