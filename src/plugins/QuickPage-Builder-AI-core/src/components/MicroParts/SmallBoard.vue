<template>
  <div class="small-board" :style="rootStyle">
    <div class="small-board-inner">
      <div class="item" @click="gopage('/workflow/index')">
        <span>{{ todoNum }}</span>
        <p>我的待办</p>
      </div>
      <div class="item" @click="gopage('/person/MessageNotify')">
        <span>{{ messageNum }}</span>
        <p>消息通知</p>
      </div>
    </div>
  </div>
</template>

<script>
import BaseMixin from './base/mixin/baseMixin';

export default {
  name: 'SmallBoard',
  mixins: [BaseMixin],
  props: {},
  data() {
    return {
      minRowSpan: 6, // 最小宽占格
      minColSpan: 3, // 最小高占格
      messageNum: 0,
      todoNum: 0,
    };
  },
  methods: {
    /**
     * @method getNotifyPC 接口-获取该用户未读消息
     */
    getNotifyPC() {
      this.$axios
        .get('/platform/notify/getNotifyPC', {
          params: {
            isReadied: false,
          },
        })
        .then(res => {
          let all = res.response || [];
          let messageNum = 0;
          all.forEach(item => {
            messageNum += item.children.length;
          });
          this.messageNum = messageNum;
        });
    },
    /**
     * @method getCountProcessTaskDTOByEmpId 接口-获取我的待办条目
     */
    getCountProcessTaskDTOByEmpId() {
      this.$axios.get('/platform/workflow/process/getCountProcessTaskDTOByEmpId').then(res => {
        this.todoNum = res;
      });
    },
    gopage(url) {
      this.$router.push(url);
    },
  },
  mounted() {
    this.getNotifyPC();
    this.getCountProcessTaskDTOByEmpId();
  },
  computed: {},
};
</script>

<style scoped>
.small-board {
  flex-shrink: 0;
  position: relative;
  background-color: #f56c6c;

  &-inner {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    width: 100%;

    .item {
      display: inline-block;
      padding: 20px 16px 0;
      width: 120px;
      height: 120px;
      cursor: pointer;

      span {
        font-size: 30px;
        color: #f56c6c;
        letter-spacing: 0;
      }

      p {
        margin: 0;
        font-size: 14px;
        color: fade(#000, 65%);
        overflow: hidden;
      }

      &:hover {
        transform: translateY(-1px);
        opacity: 0.9;
      }
    }
  }
}
</style>
