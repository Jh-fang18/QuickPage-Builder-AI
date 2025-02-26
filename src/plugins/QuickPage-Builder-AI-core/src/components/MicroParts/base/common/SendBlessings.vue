<template>
  <div class="send-blessings">
    <div class="img-container">
      <img :src="card.url" alt="" width="400" height="248" />
    </div>
    <div class="desc">{{ card.desc }}</div>
    <div class="operation">
      <a-button icon="sync" type="link" @click="randomCard">换一个</a-button>
    </div>
    <div class="textarea-container">
      <a-textarea v-model="card.cueWords" placeholder="请输入祝福语" :rows="5" />
    </div>
    <div class="send-btn-container">
      <div class="send-btn" @click="send">赠送</div>
    </div>
  </div>
</template>

<script>
import BaseMixin from '../mixin/baseMixin';

export default {
  mixins: [BaseMixin],
  props: {
    data: {
      type: Object,
      default: () => ({}),
    },
    visible: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      cards: [],
      card: {},
    };
  },

  methods: {
    /**
     * @method getHomePageCardList 接口-查询送祝福卡片
     */
    getHomePageCardList() {
      let data = {
        wishType: this.data.isBirthday ? 1 : 2,
      };
      if (!this.data.isBirthday) {
        data.honorCatalogId = this.data.honorCatalogId;
      }
      this.$axios.post('/self/empCare/getHomePageCardList', data).then(res => {
        this.cards = res.map(item => {
          return {
            id: item.id,
            desc: item.name,
            picture: item.picture,
            url: `${this.donwnLoadUrl}${item.picture}`,
            cueWords: item.cueWords || '',
          };
        });
        this.randomCard();
      });
    },
    /**
     * @method addWidgetWish 接口-送祝福
     */
    addWidgetWish() {
      this.$axios
        .post('/self/empCare/addWidgetWish', {
          cardId: this.card.id,
          wishType: this.data.isBirthday ? 1 : 2,
          picture: this.card.picture,
          blessing: this.card.cueWords,
          empId: this.data.id,
          wishItemId: this.data.honorId,
          cardName: this.card.desc,
        })
        .then(() => {
          this.data.showSendBtn = false;
          this.$message.success('赠送成功！');
          this.$emit('update:visible', false);
        });
    },
    /**
     * @method 初始化
     */
    init() {
      this.getHomePageCardList();
    },
    /**
     * @method randomCard  随机卡片
     */
    randomCard() {
      let num = Math.floor(Math.random() * this.cards.length);
      let card = this.cards[num];
      if (card.id === this.card.id) {
        this.randomCard();
      } else {
        this.card = { ...card };
      }
    },
    /**
     * @method send 送祝福
     */
    send() {
      this.addWidgetWish();
    },
  },
  mounted() {
    this.init();
  },
};
</script>

<style scoped lang="less">
.send-blessings {
  padding: 0 35px;
  text-align: center;
  .img-container {
    // display: flex;
    // justify-content: center;
    // align-items: center;
    font-size: 0;
    height: 248px;
  }
  .desc {
    font-size: 20px;
    color: @text-color;
    letter-spacing: 0.36px;
  }
  .operation {
    margin-top: 10px;
    text-align: right;
  }
  .textarea-container {
    margin-top: 15px;
  }
  .send-btn-container {
    // display: flex;
    // justify-content: center;
    .send-btn {
      display: inline-block;
      border-radius: 48px;
      margin-top: 40px;
      width: 164px;
      height: 40px;
      line-height: 40px;
      font-size: 16px;
      cursor: pointer;
      color: #fff;
      background-color: @primary-color;
    }
  }
}
</style>
