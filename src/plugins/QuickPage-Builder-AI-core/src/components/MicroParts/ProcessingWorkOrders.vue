<template>
  <div class="processing-work-orders" :style="rootStyle">
    <div class="processing-work-orders-inner">
      <div class="title">本月处理工单</div>
      <div class="content">
        <span v-if="!more && !less" class="current-number"> {{ current }} </span>
        <span v-if="more && !less" class="current-number more"> {{ current }} <a-icon type="rise" /> </span>
        <span v-if="less" class="current-number less"> {{ current }} <a-icon type="fall" /> </span>
        <span v-if="more && !less">
          比上个月 <strong class="more">增加{{ more }}</strong>
        </span>
        <span v-if="less">
          比上个月 <strong class="less">减少{{ less }}</strong>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import BaseMixin from './base/mixin/baseMixin';

export default {
  name: 'ProcessingWorkOrders',
  mixins: [BaseMixin],
  props: {},
  data() {
    return {
      minRowSpan: 6, // 最小宽占格
      minColSpan: 3, // 最小高占格
      current: 0,
      more: 0,
      less: 0,
    };
  },
  methods: {
    /**
     * @method getEffected 接口-获取本月处理工单接口
     */
    getEffected() {
      this.$axios.get('/platform/billPool/list/getEffected').then(res => {
        if (Object.keys(res).length === 0) return;

        let { current, more, less } = res;
        this.current = current || 0;
        this.more = more >= 0 ? more : false;
        this.less = less >= 0 ? less : false;
      });
    },
    gopage(url) {
      this.$router.push(url);
    },
  },
  mounted() {
    this.getEffected();
  },
  computed: {},
};
</script>

<style scoped lang="less">
.processing-work-orders {
  // display: flex;
  // justify-content: center;
  // align-items: center;
  border-radius: 4px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.06);
  background: #fff;
  flex-shrink: 0;
  position: relative;

  &-inner {
    display: table;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    width: 100%;
  }
  .title {
    display: table-cell;
    font-size: 16px;
    font-weight: bold;
    width: 60%;
  }
  .content {
    display: table-cell;
    width: 40%;
    span {
      display: block;
      &.current-number {
        font-size: 24px;
        font-weight: bold;
      }
      &.more,
      strong.more {
        color: @success-color;
      }
      &.less,
      strong.less {
        color: @error-color;
      }
    }
  }
}
</style>
