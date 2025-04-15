<template>
  <div class="launch-ticket" :style="rootStyle">
    <div class="launch-ticket-header">
      <span class="title">{{ title }}</span>
      <!-- <div class="tools">
        <hr-button style="margin-left: 10px;" @click="goPage('workflow/processTask/listMyPersonApplicationStandard')">
          更多
        </hr-button>
      </div> -->
    </div>
    <div class="launch-ticket-content">
      <template v-if="data.length > 0">
        <div
          v-for="(item, index) in data"
          :key="index"
          class="launch-ticket-item"
          :class="{ 'ant-col-8': rowSpan >= 17, 'ant-col-12': rowSpan >= 12 && rowSpan < 17, auto: rowSpan <= 8 }"
        >
          <div class="title">
            <div class="item-inner-icon" :style="{ backgroundImage: item.color }">
              <a-icon :type="item.icon" :style="{ fontSize: '32px', color: '#fff' }"></a-icon>
            </div>
            <div class="item-inner-name">{{ item.showName }}</div>
          </div>
          <div class="content">{{ item.explain }}</div>
        </div>
      </template>
      <data-empty v-else />
    </div>
  </div>
</template>

<script>
import BaseMixin from './base/mixin/baseMixin';
import DataEmpty from './base/common/DataEmpty';
const colors = [
  'linear-gradient(-180deg, #4EE9A3 0%, #33C181 100%)',
  'linear-gradient(-180deg, #FFAF99 0%, #FF8163 100%)',
  'linear-gradient(-180deg, rgba(161,198,253,0.99) 0%, #6EA7FC 100%)',
  'linear-gradient(-180deg, #B5AFFF 0%, #8A82FD 100%)',
  'linear-gradient(-180deg, #F8B9EF 0%, #F28DE3 100%)',
  'linear-gradient(-180deg, #ACE8FC 0%, #5CD4FC 100%)',
];

export default {
  name: 'LaunchTicket',
  mixins: [BaseMixin],
  props: {
    title: {
      type: String,
      default: '发起工单',
    },
    id: {
      type: [Number, String],
      required: true,
    },
  },
  data() {
    return {
      minRowSpan: 8, // 最小宽占格
      minColSpan: 6, // 最小高占格
      data: [],
    };
  },
  computed: {},
  methods: {
    getSelfServiceContainerPageList() {
      this.$axios
        .post(`/self/item/getSelfServiceContainerPageList`, {
          data: {
            itemId: this.id || '310565286',
          },
          page: { pageSize: 9999, currentPage: 1 },
        })
        .then(res => {
          if (!res) return;

          let _data = res.dataList || false;
          let index = 0;
          if (_data) {
            for (let i = 0; i < (this.rowSpan >= 17 ? 6 : 4); i++) {
              if (!_data[i]) break;

              if (!colors[index]) {
                index = 0;
              }

              _data[i] = {
                ..._data[i],
                color: colors[index++],
              };
              this.data.push(_data[i]);
            }
          }
        });
    },
  },
  mounted() {
    this.getSelfServiceContainerPageList();
  },
  components: {
    DataEmpty,
  },
};
</script>

<style scoped lang="less">
.launch-ticket {
  // display: flex;
  position: relative;
  border-radius: 4px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.06);
  background: #fff;
  padding: 16px 24px;
  overflow: hidden;
  &-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    height: 38px;
    font-weight: bold;
    font-size: 16px;
    color: @text-darken-color;
    border-bottom: 1px solid #e1e1e1;
    .status {
      position: absolute;
      width: 100%;
      text-align: center;
      font-size: 14px;
      font-weight: normal;
      span {
        padding: 0 16px;
        &:before {
          display: inline-block;
          content: '';
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background-color: #ebebeb;
          margin-right: 6px;
        }
        &.assigned:before {
          background-color: #8db2f0;
        }
      }
    }
    .tools {
      display: flex;
      border-bottom: none;
      .btn-more {
        margin-left: 10px;
      }
    }
  }
  &-content {
    display: table;
    width: 100%;
    height: calc(100% - 38px);
    overflow: hidden;
  }
  &-item {
    float: left;
    height: 50%;
    padding: 16px 0 0 16px;
    overflow: hidden;
    &.auto {
      width: 100%;
    }
    .title {
      display: flex;
      font-size: 16px;
      color: rgba(0, 0, 0, 0.85);
      margin-bottom: 12px;
      .item-inner-icon {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 40px;
        height: 40px;
      }
      .item-inner-name {
        margin-left: 16px;
        margin-top: 16px;
      }
    }
    .content {
      line-height: 20px;
      color: rgba(0, 0, 0, 0.45);
    }
  }
}
</style>
