<template>
  <div
    class="container"
    :style="{ height: this.gridRow * (gridScale + gridPadding) - 72 + 'px' }"
  >
    <div
      v-for="(item, index) of activatedComponents"
      class="block animated"
      :ref="'block' + index"
      :key="index"
      :style="{
        top:
          (Number(item.ccs.split('/')[0]) - 1) * (gridScale + gridPadding) +
          'px',
        left:
          (Number(item.ccs.split('/')[1]) - 1) * (gridScale + gridPadding) +
          'px',
      }"
    >
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
  data() {
    return {
      loading: false,
      gridColumn: 24, //网格宽度
      gridRow: 36, //网格长度
      gridScale: 30, //最小单位宽度
      gridPadding: 20, //网格间距
      activatedComponents: [], //激活组件列表
    };
  },
  props: {
    dndId: {
      type: Number,
      default: 0
    },
    dndIdUrl: {
      type: String,
      default: ''
    },
    microParts: {}, //已有组件
  },
  computed: {},
  methods: {
    getHomeSettingsList() {
      //获取当前配置
      if (this.dndId) {
        
        this.$axios
          .post(this.dndIdUrl, {
            tempId: this.dndId,
          })
          .then((res) => {
            let { dataList } = res;

            if (dataList) {
              this.activatedComponents = dataList || [];
            }

            console.log(this.activatedComponents);

            if (
              this.activatedComponents &&
              this.activatedComponents.length > 0
            ) {
              this.gridRow = this.activatedComponents[
                this.activatedComponents.length - 1
              ]["ccs"]
                .split("/")
                .map((item) => Number(item))[2];
            }

            console.log(this.gridRow);
          });
      } else {
        let workbenchData =
          JSON.parse(window.sessionStorage.getItem("activatedComponents")) ||
          false;
        //console.log(workbenchData);
        this.activatedComponents =
          workbenchData["tmp"].activatedComponents || [];

        if (this.activatedComponents && this.activatedComponents.length > 0) {
          this.gridRow = this.activatedComponents[
            this.activatedComponents.length - 1
          ]["ccs"]
            .split("/")
            .map((item) => Number(item))[2];
        }
      }
    },
  },
  created() {
    this.$options.components = { ...this.$options.components, ...this.microParts }
    this.getHomeSettingsList();
  },
  mounted() {},
  components: {
    ...MicroCards,
  },
};
</script>
<style lang="less" scoped>
.container {
  position: relative;
  width: 1200px;
  /*grid-template-areas: none;*/
  margin: 0 auto;
}

.block {
  position: absolute;
  // width: 100%;
  // height: 100%;
  display: flex;
  justify-content: center;
  justify-items: center;
  align-items: center;
  align-content: center;
  user-select: none;
  .title {
    position: absolute;
    top: 10px;
    left: 20px;
    color: #4285f4;
  }
}
.block:hover .delete {
  display: block;
}
</style>
