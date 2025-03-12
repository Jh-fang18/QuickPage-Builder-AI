<template>
  <div class="wrapper">
    <template v-if="terminalType === 0">
      <container
        :activated-components="activatedComponents"
        :grid-row="gridRow"
        :grid-column="gridColumn"
      ></container>
    </template>
    <template v-if="terminalType === 1">
      <div class="tabsWrapper" ref="tabs">
        <a-tabs type="card" v-model="tabsActiveKey" @change="isSave">
          <a-tab-pane :tab="tab.name" v-for="(tab, i) in tabs" :key="i">
            <div
              class="container mobile"
              :style="{
                    gridTemplateColumns: getGridTemplateColumns,
                    gridTemplateRows: getGridTemplateRows,
                    gridTemplateAreas: getGridTemplateAreas,
                    }"
              v-if="tabsActiveKey === i"
            >
              <div
                v-for="(item, index) of activatedComponents"
                :key="index"
                class="block animated"
                :style="{ top: item.positionY, left: item.positionX, gridArea: item.ccs }"
                @mousedown="mousedown($event, item, index)"
                :ref="'block' + index"
              >
                <div class="title">{{ item.title }}</div>
                <div class="delete">
                  <a
                    href="javascript:void(0)"
                    @click="showConfirm('component', item.treeKey.split('-'), index)"
                  >
                    {{
                    $t(`${langPrefix}.delete`)
                    }}
                  </a>
                </div>
              </div>
            </div>
          </a-tab-pane>
        </a-tabs>
      </div>
    </template>

    <!-- 新增/修改 导航栏菜单 -->
    <a-modal
      :mask-closable="false"
      :title="$t(`${langPrefix}.navSenuSettings`)"
      :ok-text="$t(`${langPrefix}.save`)"
      :cancel-text="$t(`${langPrefix}.cancel`)"
      v-model="editNavSenuSettingsModalVisible"
      :confirm-loading="confirmLoading"
      width="800px"
      destroy-on-close
      @ok="saveEditHomeSettings"
    >
      <edit-nav-senu-settings-modal
        :save-loading.sync="confirmLoading"
        :temp-id="tempId"
        @needUpdateList="updateList"
        ref="editNavSenuSettingsModal"
      />
    </a-modal>

    <!-- 移动端 预览 -->
    <a-modal
      :mask-closable="false"
      :title="$t(`${langPrefix}.previewMobile`)"
      :footer="null"
      v-model="editPreviewMobileModalVisible"
      width="415px"
      destroy-on-close
    >
      <preview-mobile />
    </a-modal>
  </div>
</template>

<script>
import Container from "./Container.vue";
const langPrefix = "management";

export default {
  name: "DndCore",
  props: {
    terminalType: {
      type: Number,
      default: 0
    }, //终端类型
    activatedComponents: {
      type: Array,
      default: () => []
    }, //激活组件列表
    gridColumn: {
      type: Number,
      default: 24
    }, //网格宽度
    gridRow: {
      type: Number,
      default: 36
    }, //网格长度
    gridScale: {
      type: Number,
      default: 30
    }, //最小单位宽度
    gridPadding: {
      type: Number,
      default: 20
    } //网格间距
  },
  data() {
    return {
      langPrefix,
      editPreviewMobileModalVisible: false,
      editNavSenuSettingsModalVisible: false,
      tabsActiveKey: "",
      confirmLoading: false,
      oldContent: "[]", //原始内容
      navigationId: "", //移动端菜单id
      tabs: [], //tabs内容
      contentId: 0, //内容信息ID
      tempId: 0 //模板ID
    };
  },
  methods: {
    previewMobile() {
      this.editPreviewMobileModalVisible = true;
    },
    isSave(activeKey) {
      console.log(activeKey);
      if (this.oldContent !== JSON.stringify(this.activatedComponents)) {
        this.$confirm({
          title: "提示",
          content: "检测到未保存的内容，是否在离开前保存修改？",
          okText: "确认",
          cancelText: "取消",
          onOk: () => {
            if (activeKey === "black")
              this.save().then(() => {
                window.sessionStorage.removeItem("activatedComponents");
                this.$router.go(-1);
              });
            else this.save().then(() => this.changeTab(activeKey));
          },
          onCancel: () => {
            if (activeKey === "black") {
              window.sessionStorage.removeItem("activatedComponents");
              this.$router.go(-1);
            } else this.changeTab(activeKey);
          }
        });
      } else {
        if (activeKey === "black") {
          window.sessionStorage.removeItem("activatedComponents");
          this.$router.go(-1);
        } else this.changeTab(activeKey);
      }
    },
    changeTab(activeKey) {
      //console.log(activeKey);
      this.navigationId = this.tabs[activeKey] ? this.tabs[activeKey].id : "";
      this.getTempInfo({
        tempId: this.tempId,
        navigationId: Number(this.navigationId)
      });
    },
    saveEditHomeSettings() {
      this.$refs.editNavSenuSettingsModal.handleSubmit();
    },
    updateList() {
      this.editNavSenuSettingsModalVisible = false;
      this.getNavigationList().then(res => {
        this.tabs = res || [];
        this.tabsActiveKey = 0;
        this.navigationId = this.tabs[0] ? this.tabs[0].id : 0;

        this.getTempInfo({
          tempId: Number(this.tempId),
          navigationId: Number(this.navigationId)
        });
      });
    },
    editTab() {
      this.editNavSenuSettingsModalVisible = true;
    },
    saveTitle(component) {
      component.editTitle = false;
      let { title } = component;
      component["selfServiceData"]["itemName"] = title;
      this.updateSelfServiceItem(component["selfServiceData"]).then(() => {
        this.save();
        Promise.all([
          this.getSelfServiceItemList(0, this.terminalType),
          this.getSelfServiceItemList(1, this.terminalType)
        ]).then(res => {
          if (!res) return;

          (res || []).map((item, index) => {
            let { dataList } = item;

            (dataList || []).map((jtem, jndex) => {
              this.components[index][jndex]["title"] = jtem.itemName;
            });
          });

          this.components = [this.components[0], this.components[1]];

          //console.log(this.components);
          //console.log(this.MicroCardsList);

          //获取树列表
          this.treeData = [
            {
              title: "其他类",
              key: "0-0",
              disabled: true,
              children: this.MicroCardsList
            },
            {
              title: "容器类",
              key: "0-1",
              disabled: true,
              children: this.ContainersList
            }
          ];
        });
      });
    }
  },
  components: {
    EditNavSenuSettingsModal: () => import("./EditNavSenuSettingsModal.vue"),
    PreviewMobile: () => import("../PreviewMobile.vue"),
    Container,
  }
};
</script>

<style scoped>
.wrapper {
  margin: 0 auto;
}
</style>