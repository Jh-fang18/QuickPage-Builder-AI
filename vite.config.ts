import { defineConfig } from 'vite' // 导入 Vite 的配置函数
import vue from '@vitejs/plugin-vue' // 导入 Vue 插件
import Components from 'unplugin-vue-components/vite' // 导入自动导入组件插件
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers' // 导入 Ant Design Vue 解析器
import { resolve } from 'path' // 导入 path 模块的 resolve 函数

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(), // 启用 Vue 插件
    // 自动导入组件
    // 该插件会自动导入组件，无需手动引入
    Components({
      dts: 'src/types/components.d.ts', // 生成的类型声明文件路径
      resolvers: [
        AntDesignVueResolver({
          // 使用 Ant Design Vue 解析器
          importStyle: false // 禁用 CSS 导入，使用 JS 中的样式
        })
      ]
    })
  ],
  resolve: {
    alias: {
      '@': resolve('src'), // 源码根目录
      '@img': resolve('src/assets/img'), // 图片
      '@libs': resolve('src/libs'), // 本地库
      '@plugins': resolve('src/plugins'), // 本地插件
      '@cp': resolve('src/components'), // 公共组件
      '@views': resolve('src/views') // 路由组件
    }
  }
})
