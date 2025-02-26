<template>
  <a-carousel dots-class="slick-dots slick-thumb" :before-change="beforeChange">
    <div slot="customPaging" class="dot"></div>
    <slot />
  </a-carousel>
</template>

<script>
export default {
  methods: {
    beforeChange(from, to) {
      this.$emit('currentChange', to + 1);
    },
  },
};
</script>

<style scoped lang="less">
.ant-carousel {
  height: 100%;
  /deep/ .slick-slider {
    height: 100%;
    .slick-thumb {
      bottom: 0;
      li {
        margin: 0 8px;
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          cursor: pointer;
          background: #d8d8d8;
        }
      }
      li.slick-active .dot {
        background: @primary-color;
      }
    }
  }
}
</style>
