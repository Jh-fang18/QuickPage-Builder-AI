import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createI18n } from 'vue-i18n'
import './mock/index.ts'

const i18n = createI18n({
  // something vue-i18n options here ...
})

import Test from './plugins/QuickPage-Builder-AI-core/index.ts'

createApp(App).use(i18n).use(Test).mount('#app')
