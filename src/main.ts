// Vue核心库
import { createApp } from 'vue'

// 本地资源
import App from './App.vue'
import './plugins/mock/index.ts'
import http from './plugins/axios/index.ts'

// 插件
import dnd from './plugins/QuickPage-Builder-AI-core/index.ts'

// 创建并挂载应用
const app = createApp(App)

// 挂载axios实例
app.config.globalProperties.$axios = http

app.use(dnd).mount('#app')
