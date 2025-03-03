// Vue核心库
import { createApp } from 'vue'

// 第三方库
import { createI18n } from 'vue-i18n'

// 本地资源
import './style.css'
import App from './App.vue'
import './plugins/mock/index.ts'
import http from './plugins/axios/index.ts'

// 插件
import Test from './plugins/QuickPage-Builder-AI-core/index.ts'

// i18n配置
const i18n = createI18n({
  // something vue-i18n options here ...
})

// 创建并挂载应用
const app = createApp(App)

// 挂载axios实例
app.config.globalProperties.$axios = http

app.use(i18n)
  .use(Test)
  .mount('#app')