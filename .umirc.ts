import { defineConfig } from "umi";

export default defineConfig({
  title: "Claude Apps",
  plugins: ["@umijs/plugins/dist/antd", "@umijs/plugins/dist/locale"],
  antd: {},
  locale: {
    default: "zh-CN",
    baseSeparator: "-",
    baseNavigator: true,
  },
  routes: [
    { path: "/", redirect: "/welcome" },
    { path: "/welcome", component: "welcome" },
  ],
  npmClient: "npm",
});
