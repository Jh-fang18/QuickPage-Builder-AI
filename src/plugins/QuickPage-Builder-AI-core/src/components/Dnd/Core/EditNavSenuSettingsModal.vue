<template>
  <hr-table-base ref="tableStandard" :title="false" :loading="loading" :data-source="data" :selection="false">
    <hr-table-column :title="$t(`${langPrefix}.name`)" data-index="name">
      <template slot-scope="val, record">
        <a-input :value="val" @change="$set(record, 'name', $event.target.value)" />
      </template>
    </hr-table-column>
    <hr-table-column :title="$t(`${langPrefix}.icon`)" data-index="picture">
      <template slot-scope="val, record">
        <icon-select :value="val ? String(val) : ''" @change="$set(record, 'picture', $event)" />
      </template>
    </hr-table-column>
    <hr-table-column :title="$t(`${langPrefix}.sort`)" data-index="orderNum">
      <template slot-scope="val, record">
        <a-input :value="val" @change="$set(record, 'orderNum', $event.target.value)" />
      </template>
    </hr-table-column>
    <hr-table-column :title="$t(`${langPrefix}.showBackground`)" data-index="displayBackground" width="80px">
      <template slot-scope="val, record">
        <a-checkbox :checked="val ? true : false" @change="$set(record, 'displayBackground', $event.target.checked)" />
      </template>
    </hr-table-column>
    <hr-table-column :title="$t(`${langPrefix}.showTitle`)" data-index="displayTitle" width="80px">
      <template slot-scope="val, record">
        <a-checkbox :checked="val ? true : false" @change="$set(record, 'displayTitle', $event.target.checked)" />
      </template>
    </hr-table-column>
    <hr-table-column :title="$t(`${langPrefix}.action`)" width="70px">
      <hr-button-list slot-scope="val, record, index" :count="4">
        <hr-button icon="plus-circle" @click="add(index)"></hr-button>
        <hr-button v-if="record.isBuiltIn !== 1" icon="minus-circle" @click="del(index)"></hr-button>
      </hr-button-list>
    </hr-table-column>
  </hr-table-base>
</template>

<script>
const langPrefix = 'navSenuSettings';

export default {
  name: 'NavSenuSettings',
  props: {
    saveLoading: {
      type: Boolean,
      default: false,
    },
    tempId: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      langPrefix,
      loading: false,
      searchDataBackup: {},
      data: [],
      totalPages: 0,
    };
  },
  methods: {
    add(index) {
      if (this.data.length < 4)
        this.data.splice(index + 1, 0, { id: '$' + (this.data.length - index), name: '', picture: '', orderNum: '' });
      else {
        this.$message.warning(this.$t(`${langPrefix}.reachedMax`));
      }
    },
    del(index) {
      this.data.splice(index, 1);
    },
    handleSubmit() {
      let _data = [];

      _data = this.data.map(item => {
        if (String(item.id).indexOf('$') === 0) {
          item.id = '';
        }

        item.displayBackground = item.displayBackground ? 1 : 0;
        item.displayTitle = item.displayTitle ? 1 : 0;
        item.tempId = Number(this.tempId);
        return item;
      });

      this.$axios
        .post('/self/homePageInfo/saveNavigation', _data)
        .then(() => {
          this.$message.success(this.$t(`${this.langPrefix}.editMessage`));
          this.$emit('needUpdateList');
          this.$emit('update:saveLoading', false);
        })
        .catch(() => {
          this.$emit('update:saveLoading', false);
        });
    },
    getNavigationList() {
      this.loading = true;
      this.$axios.post('/self/homePageInfo/getNavigationList', { tempId: this.tempId }).then(res => {
        this.loading = false;
        if (res && res.length > 0) this.data = res || [];

        this.data.map(item => {
          if (!item.picture) item.picture = '';
        });
      });
    },
  },
  created() {
    this.getNavigationList();
  },
  components: {
  },
};
</script>

<style lang="less" scoped>
/deep/ .ant-table .ant-table-body {
  overflow: inherit !important;
}
</style>
