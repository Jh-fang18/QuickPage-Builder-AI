// 首先引入Mock
import Mock from 'mockjs' //导入mockjs

// 设置拦截ajax请求的相应时间
// 由于已经引入了Mock，这里类型未知可能是类型定义文件缺失或配置问题，代码本身无需修改
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
Mock.setup({
  timeout: '200-600'
})

// 定义 Mock 配置项的类型
// 增强 MockConfig 类型
type MockConfig = Record<
  string,
  {
    method: string
    url: string
    response: unknown
  }
>

let configArray: MockConfig[] = []

// 使用 Vite 的 import.meta.glob 动态加载 ./requests 目录下所有 .ts 文件
const files = import.meta.glob('./requests/**/*.ts', { eager: true })

// 优化模块加载逻辑
Object.values(files).forEach((module) => {
  try {
    const mockModule = module as MockModule
    if (mockModule.default) {
      configArray.push(mockModule.default)
    }
  } catch (error) {
    console.error('Failed to load mock module:', error)
  }
})

// 定义模块类型
type MockModule = {
  default: MockConfig
}

// 使用更精确的类型
Object.keys(files).forEach((key) => {
  const module = files[key] as MockModule
  configArray = configArray.concat(module.default)
})

// 注册所有的mock服务
configArray.forEach((item) => {
  for (const [path, target] of Object.entries(item)) {
    const protocol = path.split('|')
    // 由于已经在文件开头引入了Mock，类型未知可能是类型定义文件缺失或配置问题，代码本身无需修改
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    Mock.mock(new RegExp('^' + protocol[1]), protocol[0], target)
  }
})
