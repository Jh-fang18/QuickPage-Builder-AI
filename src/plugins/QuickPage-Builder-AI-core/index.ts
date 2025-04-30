import { type App } from 'vue' // 导入Vue类型
// 第三方库
import { createI18n } from 'vue-i18n'

import 'ant-design-vue/dist/reset.css' // 导入Ant Design样式重置
import { Layout, Tree, Row, InputNumber, Button, Modal } from 'ant-design-vue' // 导入Ant Design组件

import dnd from './src/views/Index.vue' // 导入主视图组件
import { store } from './src/store/index.ts' // 导入状态管理
import router from './src/router/index.ts' // 导入路由配置

import http from './src/plugins/axios/index.ts'

// 准备翻译的语言环境信息
const messages = {
  en: {
    management: {
      preview: 'Preview',
      save: 'Save',
      treeTitle: 'Widget List',
      cancel: 'Cancel',
      previewMobile: 'Preview Mobile',
      navSenuSettings: 'Navigation Menu Settings'
    }
  },
  cn: {
    management: {
      preview: '预览',
      save: '保存',
      treeTitle: '微件列表',
      cancel: '取消',
      previewMobile: '预览手机端',
      navSenuSettings: '导航菜单设置'
    }
  }
}

// i18n配置
const i18n = createI18n({
  locale: 'cn', // 设置地区
  messages // 设置地区信息
})

export default {
  install: (app: App) => {
    // 使用路由和状态管理
    app.use(router)
    app.use(store)

    // 使用Ant Design组件
    app.use(Layout)
    app.use(Tree)
    app.use(Row)
    app.use(InputNumber)
    app.use(Button)
    app.use(Modal)
    app.use(i18n)

    // 挂载axios实例
    app.config.globalProperties.$axios = http

    // 注册主视图组件
    app.component('dnd', dnd)
  }
}
