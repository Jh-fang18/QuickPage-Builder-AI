import { createWebHistory, createRouter } from "vue-router";

import Basic from "./basic/index.ts";
import Preview from "./preview/index.ts";

const router = createRouter({
  history: createWebHistory(),
  routes: [Basic, Preview],
});

export default router;
