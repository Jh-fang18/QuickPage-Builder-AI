import { Store } from 'vuex'
import type { AxiosInstance } from 'axios'
import type { MessageApi } from 'ant-design-vue/es/message'
import type { Confirm } from 'ant-design-vue/es/modal/confirm'

declare module '@vue/runtime-core' {
  // 定义全局属性类型
  export interface ComponentCustomProperties {
    $store: Store<State> // Vuex store
    $t: (key: string) => string // i18n
    $axios: AxiosInstance // Axios 实例
    $message: MessageApi // Ant Design Vue 消息提示
    $confirm: Confirm // Ant Design Vue 确认框
  }
}
