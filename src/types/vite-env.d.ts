/// <reference types="vite/client" />  // 引用 Vite 提供的客户端类型定义

interface ImportMetaEnv {
  readonly VITE_NODE_ENV: string // 定义环境变量：当前环境（开发/生产）
  readonly VUE_APP_TITLE: string // 定义环境变量：应用标题
  readonly VITE_API_BASE_URL: string // 定义环境变量：API 基础 URL
}

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  // 声明 Vue 单文件组件模块类型
  const component: DefineComponent<object, object, unknown>
  // 导出 Vue 组件类型
  export default component
}

declare module 'vuex' {
  // 导出 Vuex 核心模块的类型定义
  export * from 'vuex/types/index.d.ts'
  // 导出 Vuex 辅助函数的类型定义
  export * from 'vuex/types/helpers.d.ts'
  // 导出 Vuex 日志插件的类型定义
  export * from 'vuex/types/logger.d.ts'
  // 导出 Vuex 与 Vue 集成的类型定义
  export * from 'vuex/types/vue.d.ts'
}

declare module 'mockjs' {
  const Mock: unknown
  export default Mock
}
