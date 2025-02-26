<template>
  <div class="bottom-filing" :style="rootStyle">
    {{ title }}
  </div>
</template>

<script>
import BaseMixin from './base/mixin/baseMixin';

export default {
  name: 'TicketPool',
  mixins: [BaseMixin],
  props: {
    title: {
      type: String,
      default: '版权所有©万达集团，2020 v3.0',
    },
  },
  data() {
    return {
      minRowSpan: 24, // 最小宽占格
      minColSpan: 2, // 最小高占格
      options: {},
    };
  },
  computed: {},
  methods: {},
  mounted() {},
  components: {},
};
</script>

<style scoped>
.bottom-filing {
  display: table-cell;
  text-align: center;
  vertical-align: middle;
  font-size: 12px;
  color: #000000;
}
</style>
