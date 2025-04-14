import { type App } from 'vue' // 导入Vue类型
import 'ant-design-vue/dist/reset.css' // 导入Ant Design样式重置
import { Layout, Tree, Row, InputNumber, Button, Modal } from 'ant-design-vue' // 导入Ant Design组件

import dnd from './src/views/Index.vue' // 导入主视图组件
import { store } from './src/store/index.ts' // 导入状态管理
import router from './src/router/index.ts' // 导入路由配置

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

    // 注册主视图组件
    app.component('dnd', dnd)
  }
}
