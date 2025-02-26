import { defineConfig } from 'vite'  // 导入 Vite 的配置函数
import vue from '@vitejs/plugin-vue'  // 导入 Vue 插件
import Components from 'unplugin-vue-components/vite';  // 导入自动导入组件插件
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';  // 导入 Ant Design Vue 解析器

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),  // 使用 Vue 插件
    Components({  // 配置自动导入组件插件
      resolvers: [
        AntDesignVueResolver({  // 使用 Ant Design Vue 解析器
          importStyle: false, // 禁用 CSS 导入，使用 JS 中的样式
        }),
      ],
    }),
  ],
})
