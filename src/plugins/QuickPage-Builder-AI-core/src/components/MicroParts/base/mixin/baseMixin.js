const defaultGridSize = 30 // 默认格子大小
const defaultGridSpace = 20 // 默认格子间距
const baseUrl = import.meta.env.VITE_BASE_URL

export default {
  inheritAttrs: false,
  props: {
    rowSpan: {
      type: Number,
      default: 0
    },
    colSpan: {
      type: Number,
      default: 0
    },
    gridSize: {
      type: Number,
      default: defaultGridSize
    },
    gridSpace: {
      type: Number,
      default: defaultGridSpace
    }
  },
  computed: {
    style() {
      let { minRowSpan, minColSpan } = this
      let rowSpan = this.rowSpan > minRowSpan ? this.rowSpan : minRowSpan
      let colSpan = this.colSpan > minColSpan ? this.colSpan : minColSpan
      let width = rowSpan * this.gridSize + (rowSpan - 1) * this.gridSpace
      let height = colSpan * this.gridSize + (colSpan - 1) * this.gridSpace
      return {
        width: Math.floor(width),
        height: Math.floor(height)
      }
    },
    rootStyle() {
      let { width, height } = this.style
      return {
        width: `${width}px`,
        height: `${height}px`
      }
    },
    donwnLoadUrl() {
      return `${baseUrl}/file.nolog?method=download&fileId=`
    }
  },
  methods: {
    goPage(url) {
      this.$router.push(url)
    }
  }
}
