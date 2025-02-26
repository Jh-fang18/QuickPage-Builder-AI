<template>
  <div
    class="container pc"
    :style="{
          width: (this.gridScale + this.gridPadding) * this.gridColumn + 'px',
          gridTemplateColumns: this.getGridTemplateColumns,
          gridTemplateRows: this.getGridTemplateRows,
          gridTemplateAreas: this.getGridTemplateAreas,
        }"
  >
    <div
      v-for="(item, index) of activatedComponents"
      :key="index"
      class="block animated"
      :style="{ top: item.positionY, left: item.positionX, gridArea: item.ccs }"
      :ref="'block' + index"
    >
      <!-- <div class="title">{{ item.title }}</div> -->
      <component
        :is="item.url"
        :row-span="item.width"
        :col-span="item.height"
        :id="item.key"
        :title="item.title"
      ></component>
    </div>
  </div>
</template>
<script>
import * as MicroCards from "../MicroParts";

export default {
  name: "DndPreview",
  props: {
    terminalType: {
      type: Number,
      default: 0,
    }, //终端类型
    activatedComponents: {
      type: Array,
      default: () => [],
    }, //激活组件列表
    gridColumn: {
      type: Number,
      default: 24,
    }, //网格宽度
    gridRow: {
      type: Number,
      default: 36,
    }, //网格长度
    gridScale: {
      type: Number,
      default: 30,
    }, //最小单位宽度
    gridPadding: {
      type: Number,
      default: 20,
    }, //网格间距
    microParts: {}, //已有组件
  },
  data() {
    return {};
  },
  computed: {
    getGridTemplateColumns() {
      let _str = "";
      for (let i = 0; i < this.gridColumn; i++)
        _str = _str + this.gridScale + "px" + " ";
      return _str;
    },
    getGridTemplateRows() {
      let _str = "";
      for (let i = 0; i < this.gridRow; i++)
        _str = _str + this.gridScale + "px" + " ";
      return _str;
    },
    getGridTemplateAreas() {
      let _str = "";
      for (let i = 0; i < this.gridRow; i++) {
        _str = _str + "'";
        for (let j = 0; j < this.gridColumn; j++) {
          _str = _str + "g" + (i + 1) + "x" + (j + 1) + " ";
        }
        _str = _str + "' ";
      }
      return _str;
    },
  },
  methods: {},
  created() {
    this.$options.components = { ...this.$options.components, ...this.microParts }
  },
  mounted() {},
  components: {
    ...MicroCards,
  },
};
</script>
<style scoped>
.container {
  position: relative;
  display: grid;
  /*grid-template-areas: none;*/
  margin: 0 auto 40px auto;
  background-color: #ffffff;
}
.container.mobile {
  width: 383px;
  grid-row-gap: 8px;
  grid-column-gap: 8px;
  /* 网格 */
  background-image: -webkit-linear-gradient(white 8px, transparent 0),
    -webkit-linear-gradient(90deg, white 8px, transparent 0);
  background-image: -moz-linear-gradient(white 8px, transparent 0),
    -moz-linear-gradient(90deg, white 8px, transparent 0);
  background-image: -o-linear-gradient(white 8px, transparent 0),
    -o-linear-gradient(90deg, white 8px, transparent 0);
  background-image: linear-gradient(white 8px, transparent 0),
    linear-gradient(90deg, white 8px, transparent 0);
  background-size: 38.3px 38.3px;
  background-position: -8px -8px;
}
.container.pc {
  grid-row-gap: 20px;
  grid-column-gap: 20px;
}
</style>