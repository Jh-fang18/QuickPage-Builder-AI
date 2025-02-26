<template>
  <a-layout>
    <a-layout-sider v-model="collapsed" :trigger="null" collapsible>
      <a-tree
        checkable
        :default-expand-all="true"
        :expanded-keys.sync="expandedKeys"
        :auto-expand-parent="autoExpandParent"
        :tree-data="treeData"
        v-model="checkedKeys"
        @expand="onExpand"
        @check="onCheck"
        @select="onSelect"
      />
    </a-layout-sider>
    <a-layout>
      <a-layout-header>
        <a-icon
          class="trigger"
          :type="collapsed ? 'menu-unfold' : 'menu-fold'"
          @click="() => (collapsed = !collapsed)"
        />
        <div class="toolbar" v-if="!isPreviewModel">
          <div class="setGridRow">
            <label for="page-height">高度</label>
            <a-input-number v-model="gridRow" id="page-height" />
            <label for="page-width">宽度</label>
            <a-input-number v-model="gridColumn" id="page-width"/>
          </div>
          <a-button v-if="terminalType === 0" @click="preview">{{
            $t(`${langPrefix}.preview`)
          }}</a-button>
          <!-- <a-button v-if="terminalType === '1'" @click="previewMobile">{{ $t(`${langPrefix}.preview`) }}</a-button> -->
          <a-button type="primary" @click="save">{{
            $t(`${langPrefix}.save`)
          }}</a-button>
        </div>
        <div class="toolbar" v-else>
          <a-button type="primary" v-if="terminalType === 0" @click="preview">{{
            $t(`${langPrefix}.preview`)
          }}</a-button>
          <a-button @click="cancel">{{ $t(`${langPrefix}.cancel`) }}</a-button>
        </div>
      </a-layout-header>

      <a-layout-content>
        <dnd-core
          :terminal-type="Number(terminalType)"
          :activated-components="activatedComponents"
          :grid-row="gridRow"
          :grid-column="gridColumn"
          v-if="!isPreviewModel"
        ></dnd-core>

        <dnd-preview
          :terminal-type="Number(terminalType)"
          :activated-components="activatedComponents"
          :grid-row="gridRow"
          :grid-column="gridColumn"
          :micro-parts="microParts"
          v-if="isPreviewModel"
        ></dnd-preview>
      </a-layout-content>
    </a-layout>

    <!-- 移动端 预览 -->
    <a-modal
      :mask-closable="false"
      :title="$t(`${langPrefix}.previewMobile`)"
      :footer="null"
      v-model="editPreviewMobileModalVisible"
      width="415px"
      destroy-on-close
    >
      <preview-modal />
    </a-modal>
  </a-layout>
</template>

<script>
//导入已有组件
import * as MicroCards from "../MicroParts";

const langPrefix = "management";

export default {
  name: "Edit",
  props: {
    microParts: {},
  },
  data() {
    return {
      langPrefix,
      editPreviewMobileModalVisible: false,
      editNavSenuSettingsModalVisible: false,
      expandedKeys: ["0-0", "0-1"], //默认展开树节点
      treeData: [], //树菜单
      components: [], //组件默认参数
      autoExpandParent: true,
      gridColumn: 24, //网格宽度
      gridRow: 36, //网格长度
      gridScale: 30, //最小单位宽度
      gridPadding: 20, //网格间距
      activatedComponents: [], //激活组件列表
      confirmLoading: false,
      collapsed: true,
      terminalType: 0, //终端类型 0 PC, 1 Mob
      isPreviewModel: false, //是否展示预览页面
    };
  },
  computed: {
    //格式化微卡树
    MicroCardsList() {
      return this.components[0].map((item, index) => {
        return { title: item.title, key: "0-0-" + index + "_" + item.key };
      });
    },
    ContainersList() {
      return this.components[1].map((item, index) => {
        return { title: item.title, key: "0-1-" + index + "_" + item.key };
      });
    },
    checkedKeys: {
      get() {
        return this.$store.state.dnd.checkedKeys;
      },
      set(val) {
        this.$store.commit("dnd/PUSH_CHECKEDKEYS", val);
      },
    },
  },
  methods: {
    async save() {
      console.log(this.tempId);

      if (this.tempId) {
        let _content = JSON.stringify(this.activatedComponents);
        this.oldContent = _content || "[]";
        let _navigationId = Number(this.navigationId || 0);
        let _obj = {
          id: this.contentId || 0,
          tempId: this.tempId,
          content: _content,
        };
        return await this.$axios
          .post(
            "/self/homePageInfo/saveTempInfo",
            _navigationId
              ? {
                  ..._obj,
                  navigationId: _navigationId,
                }
              : _obj
          )
          .then((res) => {
            this.$message.success(this.$t(`${this.langPrefix}.addMessage`));
            let { id } = res;
            if (id) this.contentId = id;
          });
      }
    },
    /** start 获取页面输数据相关 **/
    getTempInfo(data) {
      this.$axios.post("/self/homePageInfo/getTempInfo", data).then((res) => {
        let { content, id } = res;

        if (content) this.activatedComponents = JSON.parse(content);
        else this.activatedComponents = [];

        //保留原始content用于判断是否有过修改
        this.oldContent = content || "[]";

        //设置画布高度
        if (this.activatedComponents && this.activatedComponents.length > 0) {
          let _gridRow = this.activatedComponents[
            this.activatedComponents.length - 1
          ]["ccs"]
            .split("/")
            .map((item) => Number(item))[2];
          this.gridRow = _gridRow < 36 ? 36 : _gridRow;
        }

        if (id) this.contentId = id;
        else this.contentId = 0;

        // console.log(this.activatedComponents);
        // console.log(this.MicroCardsList);

        //临时记录选中模块 in store
        this.$store.commit("dnd/PUSH_CHECKEDKEYS", [
          ...this.MicroCardsList.filter((item) =>
            (this.activatedComponents || []).find(
              (iitem) => iitem.key === item.key.split("-")[2].split("_")[1]
            )
          ).map((item) => item.key),
          ...this.ContainersList.filter((item) =>
            (this.activatedComponents || []).find(
              (iitem) => iitem.key === item.key.split("-")[2].split("_")[1]
            )
          ).map((item) => item.key),
        ]);
      });
    },
    async getSelfServiceItemList(itemType, terminalType) {
      return await this.$axios.post("/self/item/getSelfServiceItemList", {
        data: { itemType: itemType, terminalType: Number(terminalType) }, //筛选条件
        page: { pageSize: 6600, currentPage: 1 }, //分页条件
      });
    },
    async updateSelfServiceItem(itemData) {
      return await this.$axios.post(
        "/self/item/updateSelfServiceItem",
        itemData
      );
    },
    async getNavigationList() {
      return await this.$axios.post("/self/homePageInfo/getNavigationList", {
        tempId: this.tempId,
      });
    },
    /** end **/
    onExpand(expandedKeys) {
      console.log("onExpand", expandedKeys);
      // if not set autoExpandParent to false, if children expanded, parent can not collapse.
      // or, you can remove all expanded children keys.
      this.expandedKeys = expandedKeys;
      this.autoExpandParent = false;
    },
    onCheck(checkedKeys, info) {
      console.log("checkedKeys", checkedKeys);
      console.log("info", info);
      //临时记录选中模块 in store
      this.$store.commit("dnd/PUSH_CHECKEDKEYS", checkedKeys);

      let _keys = info.node.eventKey.split("-");
      let _arr = _keys[2].split("_");
      let _index = _arr[0];
      let _key = _arr[1];
      if (!_key) return;
      //console.log(_keys);
      //if (!checkedKeys || checkedKeys.length == 0 || _key.length < 3) return;
      //console.log(this.activatedComponents);
      if (this.activatedComponents.find((item) => item.key === _key)) {
        this.showConfirm("list", _keys);
      } else {
        let _component = {
          ...this.components[_keys[1]][_index],
          treeKey: info.node.eventKey,
        };
        if (this.activatedComponents && this.activatedComponents.length > 0) {
          let { height, ccs } = this.activatedComponents[
            this.activatedComponents.length - 1
          ];
          let _ccs = ccs.split("/").map((item) => Number(item));
          //console.log(_ccs);
          if (
            _ccs[3] + this.components[_keys[1]][_index].width <=
              this.gridColumn + 1 &&
            height <= this.gridRow + 1
          ) {
            _component.ccs =
              _ccs[0] +
              "/" +
              _ccs[3] +
              "/" +
              (_ccs[0] + this.components[_keys[1]][_index].height) +
              "/" +
              (_ccs[3] + this.components[_keys[1]][_index].width);
          } else if (
            _ccs[3] + this.components[_keys[1]][_index].width >
              this.gridColumn + 1 &&
            _ccs[2] + this.components[_keys[1]][_index].height <=
              this.gridRow + 1
          ) {
            _component.ccs =
              _ccs[2] +
              "/1" +
              "/" +
              (_ccs[2] + this.components[_keys[1]][_index].height) +
              "/" +
              (this.components[_keys[1]][_index].width + 1);
          } else {
            this.$message.warning("已没有位置可以插入新组件！");
            this.checkedKeys = this.checkedKeys.filter(
              (item) => item !== info.node.eventKey
            );
            return;
          }
        } else
          _component.ccs =
            "1/1/" +
            (Number(this.components[_keys[1]][_index].height) + 1) +
            "/" +
            (Number(this.components[_keys[1]][_index].width) + 1);

        //console.log(_component);
        this.activatedComponents.push(_component);
      }

      //console.log(this.activatedComponents);
    },
    onSelect(selectedKeys, info) {
      console.log(selectedKeys, info);
    },
    preview() {
      let _workbenchData = {
        contentId: this.contentId,
        activatedComponents: this.activatedComponents,
        oldContent: this.oldContent,
        checkedKeys: this.checkedKeys,
      };

      let workbenchData =
        JSON.parse(window.sessionStorage.getItem("activatedComponents")) || {};

      if (this.tempId) {
        workbenchData[this.tempId] = _workbenchData;
      } else workbenchData["tmp"] = _workbenchData;

      window.sessionStorage.setItem(
        "activatedComponents",
        JSON.stringify(workbenchData)
      );

      this.isPreviewModel = true;
    },
    cancel() {
      this.isPreviewModel = false;
    },
    updateList() {
      this.editNavSenuSettingsModalVisible = false;
      this.getNavigationList().then((res) => {
        this.tabs = res || [];
        this.tabsActiveKey = 0;
        this.navigationId = this.tabs[0] ? this.tabs[0].id : 0;

        this.getTempInfo({
          tempId: Number(this.tempId),
          navigationId: Number(this.navigationId),
        });
      });
    },
    showConfirm(type, keys, actIndex) {
      this.$confirm({
        title: "提示",
        content: "是否确认删除此组件？",
        onOk: () => {
          this.removeComponent(type, keys, actIndex);
        },
        onCancel: () => {
          this.$store.commit("dnd/PUSH_CHECKEDKEYS", [keys.join("-")]);
        },
      });
    },
    removeComponent(type, keys, actIndex) {
      //console.log(actIndex);
      let _arr = keys[2].split("_");
      if (type === "list") {
        this.activatedComponents = this.activatedComponents.filter(
          (item) => item.key != _arr[1]
        );
      } else if (type === "component") {
        this.activatedComponents.splice(actIndex, 1);
      }

      this.$store.commit("dnd/DELETE_CHECKEDKEYS", [keys.join("-")]);
    },
  },
  created() {},
  mounted() {
    //根据窗口宽度获取当前gridColumn的值
    // if( document.body.clientWidth)
    //   this.gridColumn = parseInt(
    //      (document.body.clientWidth - 200) / (this.gridScale + this.gridPadding)
    //   );
    //获取当前配置
    let { tempId, terminalType } = this.$route.query;
    this.tempId = Number(tempId) || "tmp";
    this.terminalType = Number(terminalType) || 0;

    Promise.all([
      this.getSelfServiceItemList(0, this.terminalType),
      this.getSelfServiceItemList(1, this.terminalType),
    ])
      .then((res) => {
        if (!res) return;

        (res || []).map((item, index) => {
          let { dataList } = item;

          this.components[index] = (dataList || []).map((item) => {
            console.log({
              title: item.itemName,
              key: String(item.id),
              url: item.url,
            });
            return {
              title: item.itemName,
              key: String(item.id),
              url: item.url,
            };
          });

          //console.log(this.components);
          //console.log(1,MicroCards);
          //console.log(2,this.microParts);

          const _MicroCards = { ...MicroCards, ...this.microParts };
          //为元素赋值宽度长度, 并过滤没有对应组件的元素
          if (this.terminalType === 0)
            this.components[index] = this.components[index].filter(
              (item, index) => {
                if (_MicroCards[item.url]) {
                  let { minRowSpan, minColSpan } = _MicroCards[item.url].data();
                  item.minWidth = minRowSpan;
                  item.minHeight = minColSpan;
                  item.width = minRowSpan;
                  item.height = minColSpan;
                  item.editTitle = false;
                  item.positionX = 0;
                  item.positionY = 0;
                  item.selfServiceData = dataList[index];
                }

                return _MicroCards[item.url];
              }
            );
          else if (this.terminalType === 1)
            this.components[index] = this.components[index].map((item) => {
              item.minWidth = 10;
              item.minHeight = 3;
              item.width = 10;
              item.height = 3;
              item.positionX = 0;
              item.positionY = 0;
              return item;
            });
        });

        this.onExpand(this.expandedKeys);
        //console.log(this.components);

        //设置树列表
        this.treeData = [
          {
            title: "其他类",
            key: "0-0",
            disabled: true,
            children: this.MicroCardsList,
          },
          {
            title: "容器类",
            key: "0-1",
            disabled: true,
            children: this.ContainersList,
          },
        ];

        if (this.terminalType === 0) {
          let workbenchData =
            JSON.parse(window.sessionStorage.getItem("activatedComponents")) ||
            false;

          if (workbenchData[this.tempId]) {
            let {
              contentId,
              activatedComponents,
              oldContent,
              checkedKeys,
            } = workbenchData[this.tempId];
            this.contentId = contentId || 0;
            this.activatedComponents = activatedComponents;
            //checkedKeys in store
            this.$store.commit("dnd/PUSH_CHECKEDKEYS", checkedKeys);
            this.oldContent = oldContent;
          } else
            this.getTempInfo({
              tempId: this.tempId,
            });
        } else if (this.terminalType === 1) {
          this.getNavigationList().then((res) => {
            this.tabs = res || [];
            this.tabsActiveKey = 0;
            this.navigationId = this.tabs[0] ? this.tabs[0].id : 0;

            if (this.navigationId <= 0) {
              this.$axios
                .post(
                  "/self/homePageInfo/saveNavigation",
                  this.tabs.map((item) => {
                    return { ...item, tempId: Number(tempId) };
                  })
                )
                .then(() => {
                  this.getNavigationList().then((res) => {
                    this.tabs = res || [];
                    this.navigationId = this.tabs[0] ? this.tabs[0].id : -1;

                    if (this.tabs.length > 0)
                      this.getTempInfo({
                        tempId: Number(tempId),
                        navigationId: Number(this.navigationId),
                      });
                  });
                });
            } else {
              if (this.tabs.length > 0)
                this.getTempInfo({
                  tempId: Number(tempId),
                  navigationId: Number(this.navigationId),
                });
            }

            this.gridColumn = 10;
            this.gridScale = 30.3;
            this.gridPadding = 8;
          });
        }
      })
      .catch((err) => {
        console.log("err", err);
      });
  },
  destroyed() {
    this.$store.commit("dnd/DELETE_CHECKEDKEYS", []);
  },
  components: {
    DndCore: () => import("./Core/Index.vue"),
    DndPreview: () => import("./Preview.vue"),
  },
};
</script>
<style scoped>
.ant-layout,
.ant-layout-sider,
.ant-layout-header {
  background: #ffffff;
}
.ant-layout-header {
  text-align: left;
  padding: 0 20px;
  position: fixed;
  top: 0;
  right: 0;
  z-index: 9999;
  width: 1200px;
}
.ant-layout-content {
  overflow: auto;
  margin-top: 64px;
}
.ant-tree {
  position: fixed;
  top: 75px;
  li {
    overflow: hidden;
  }
}
.toolbar {
  float: right;
  .setGridRow {
    display: inline-block;
    .ant-input-number {
      margin-top: -2px;
      margin-left: 12px;
    }
    label {
      margin-left: 12px;
    }
  }
  .ant-btn {
    margin-left: 12px;
  }
}
</style>
