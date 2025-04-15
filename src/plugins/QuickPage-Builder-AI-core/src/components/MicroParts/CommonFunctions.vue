<template>
  <div class="common-functions">
    <part-shell :title="itemName">
      <div class="micro-parts-left" ref="listContainer">
        <micro-parts-carousel v-if="data.length > 0">
          <div class="functions-group" v-for="item in pagination.pageNum" :key="item">
            <div
              class="item"
              v-for="o in data.slice(item - 1 ? (item - 1) * pagination.pageSize : 0, item * pagination.pageSize)"
              :key="o.id"
              @click="goPage(o.entryUrl)"
            >
              <div class="item-inner">
                <div class="item-inner-icon" :style="{ backgroundImage: o.color, backgroundColor: o.colorForIE9 }">
                  <a-icon :type="o.icon" :style="{ fontSize: '32px', color: '#fff' }"></a-icon>
                </div>
                <div class="item-inner-desc">{{ o.showName }}</div>
              </div>
            </div>
          </div>
        </micro-parts-carousel>
        <data-empty v-else />
      </div>
    </part-shell>
  </div>
</template>

<script>
import MicroPartsCarousel from './base/common/MicroPartsCarousel';
import DataEmpty from './base/common/DataEmpty';
import BaseMixin from './base/mixin/baseMixin';
import PartShell from './base/common/PartShell';
const colors = [
  'linear-gradient(-180deg, #4EE9A3 0%, #33C181 100%)',
  'linear-gradient(-180deg, #FFAF99 0%, #FF8163 100%)',
  'linear-gradient(-180deg, rgba(161,198,253,0.99) 0%, #6EA7FC 100%)',
  'linear-gradient(-180deg, #B5AFFF 0%, #8A82FD 100%)',
  'linear-gradient(-180deg, #F8B9EF 0%, #F28DE3 100%)',
  'linear-gradient(-180deg, #ACE8FC 0%, #5CD4FC 100%)',
];
const colorsForIE9 = ['#33C181', '#FF8163', '#6EA7FC', '#8A82FD', '#F28DE3', '#5CD4FC'];

export default {
  name: 'CommonFunctions',
  mixins: [BaseMixin],
  props: {
    itemName: {
      type: String,
      default: '常用功能',
    },
    id: {
      type: [Number, String],
      required: true,
    },
  },
  data() {
    return {
      minRowSpan: 12, // 最小宽占格
      minColSpan: 8, // 最小高占格
      // 每个功能占据宽高
      itemStyle: {
        width: 132,
        height: 150,
      },
      listContainer: null,
      data: [],
    };
  },
  computed: {
    pagination() {
      let el = this.listContainer;
      if (!el) return { pageNum: 0 };
      let { offsetWidth, offsetHeight } = el;
      // x方向可放个数
      let xNum = Math.floor(offsetWidth / this.itemStyle.width);
      // y方向行数
      let yNum = Math.floor(offsetHeight / this.itemStyle.height);
      // 每页个数
      let pageSize = xNum * yNum;
      // 总页数
      let pageNum = Math.ceil(this.data.length / pageSize);
      return {
        pageSize,
        pageNum,
      };
    },
  },
  methods: {
    getSelfServiceContainerPageList() {
      this.$axios
        .post('/self/item/getSelfServiceContainerPageList', {
          data: {
            itemId: this.id,
          },
          page: { pageSize: 9999, currentPage: 1 },
        })
        .then(res => {
          let index = 0;
          this.data = res.dataList.map(item => {
            if (!colors[index]) {
              index = 0;
            }
            let indexTem = index;
            index++;
            return {
              ...item,
              color: colors[indexTem],
              colorForIE9: colorsForIE9[indexTem],
            };
          });
        });
    },
    init() {
      this.listContainer = this.$refs.listContainer;
      this.getSelfServiceContainerPageList();
    },
  },
  mounted() {
    this.init();
  },
  components: {
    MicroPartsCarousel,
    DataEmpty,
    PartShell,
  },
};
</script>

<style scoped lang="less">
.common-functions {
  .micro-parts-left {
    &-group {
      &-item {
        width: 132px;
        height: 150px;
      }
    }
  }
}

.functions-group {
  // display: flex !important;
  // justify-content: flex-start;
  // flex-wrap: wrap;
  .item {
    position: relative;
    overflow: hidden;
    display: inline-block;
    // display: flex;
    // justify-content: center;
    // align-items: center;
    cursor: pointer;
    width: 132px;
    height: 150px;
    text-align: center;
    &-inner {
      width: 100%;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      &-icon {
        // display: flex;
        // justify-content: center;
        // align-items: center;
        width: 66px;
        height: 66px;
        border-radius: 50%;
        margin: 0 auto;
        .anticon {
          position: relative;
          top: 50%;
          transform: translateY(-50%);
        }
      }
      &-desc {
        margin-top: 16px;
      }
      &:hover {
        // transform: translateY(calc(-50% - 1px));
        margin-top: -1px;
        opacity: 0.9;
      }
    }
  }
}
</style>
