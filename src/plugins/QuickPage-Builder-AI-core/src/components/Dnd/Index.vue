<template>
  <a-layout>
    <a-layout-sider v-model="collapsed" :trigger="null" collapsible>
      <menu-unfold-outlined v-if="collapsed" class="trigger" @click="() => (collapsed = !collapsed)" />
      <menu-fold-outlined v-else class="trigger" @click="() => (collapsed = !collapsed)" />
      <a-tree checkable :default-expand-all="true" v-model:expandedKeys="expandedKeys"
        :auto-expand-parent="autoExpandParent" :tree-data="treeData" v-model:checkedKeys="checkedKeys"
        @expand="onExpand" @check="onCheck" @select="onSelect" />
    </a-layout-sider>
    <a-layout>
      <a-layout-header>
        <div class="toolbar" v-if="!isPreviewModel">
          <div class="setGridRow">
            <label for="page-height">高度</label>
            <a-input-number v-model="gridRow" id="page-height" />
            <label for="page-width">宽度</label>
            <a-input-number v-model="gridColumn" id="page-width" />
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
        <dnd-core :terminal-type="Number(terminalType)" :activated-components="activatedComponents" :grid-row="gridRow"
          :grid-column="gridColumn" v-if="!isPreviewModel"></dnd-core>

        <dnd-preview :terminal-type="Number(terminalType)" :activated-components="activatedComponents"
          :grid-row="gridRow" :grid-column="gridColumn" :micro-parts="microParts" v-if="isPreviewModel"></dnd-preview>
      </a-layout-content>
    </a-layout>
  </a-layout>

  <!-- 移动端 预览 -->
  <a-modal :mask-closable="false" :title="$t(`${langPrefix}.previewMobile`)" :footer="null"
    v-model="editPreviewMobileModalVisible" width="415px" destroy-on-close>
    <preview-mobile />
  </a-modal>
</template>

<script setup>
//导入已有组件
import { ref, reactive, computed, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons-vue'
import * as MicroCards from "../MicroParts/index.ts"
import DndCore from "./Core/Index.vue"

const langPrefix = "management"
const store = useStore()
const route = useRoute()
const { proxy } = getCurrentInstance() // 获取当前实例

// 响应式状态
const state = reactive({
  editPreviewMobileModalVisible: false,
  editNavSenuSettingsModalVisible: false,
  expandedKeys: ["0-0", "0-1"],
  treeData: [],
  components: [],
  autoExpandParent: true,
  gridColumn: 24,
  gridRow: 36,
  gridScale: 30,
  gridPadding: 20,
  activatedComponents: [],
  confirmLoading: false,
  collapsed: true,
  terminalType: 0,
  isPreviewModel: false,
  tempId: null,
  contentId: 0,
  oldContent: "[]",
  navigationId: 0,
  tabs: [],
  tabsActiveKey: 0
})

// 计算属性
const MicroCardsList = computed(() => {
  return (state.components[0] || []).map((item, index) => ({
    title: item.title,
    key: `0-0-${index}_${item.key}`
  })) 
})

const ContainersList = computed(() => {
  return (state.components[1] || []).map((item, index) => ({
    title: item.title,
    key: `0-1-${index}_${item.key}`
  }))
})

const checkedKeys = computed({
  get: () => store.state.dnd.checkedKeys,
  set: (val) => store.commit("dnd/PUSH_CHECKEDKEYS", val)
})

// 方法
const save = async () => {
  console.log(state.tempId);

  if (state.tempId) {
    let _content = JSON.stringify(state.activatedComponents);
    state.oldContent = _content || "[]";
    let _navigationId = Number(state.navigationId || 0);
    let _obj = {
      id: state.contentId || 0,
      tempId: state.tempId,
      content: _content,
    };
    return await proxy.$axios
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
        state.$message.success(state.$t(`${state.langPrefix}.addMessage`));
        let { id } = res;
        if (id) state.contentId = id;
      });
  }
}

/** start 获取页面输数据相关 **/
const getTempInfo = (data) => {
  proxy.$axios.post("/self/homePageInfo/getTempInfo", data).then((res) => {
    let { content, id } = res;

    if (content) state.activatedComponents = JSON.parse(content);
    else state.activatedComponents = [];

    //保留原始content用于判断是否有过修改
    state.oldContent = content || "[]";

    //设置画布高度
    if (state.activatedComponents && state.activatedComponents.length > 0) {
      let _gridRow = state.activatedComponents[
        state.activatedComponents.length - 1
      ]["ccs"]
        .split("/")
        .map((item) => Number(item))[2];
      state.gridRow = _gridRow < 36 ? 36 : _gridRow;
    }

    if (id) state.contentId = id;
    else state.contentId = 0;

    //console.log(state.activatedComponents);
    console.log(MicroCardsList);

    //临时记录选中模块 in store
    proxy.$store.commit("dnd/PUSH_CHECKEDKEYS", [
      ...(MicroCardsList.value || []).filter((item) =>
        (state.activatedComponents || []).find(
          (iitem) => iitem.key === item.key.split("-")[2].split("_")[1]
        )
      ).map((item) => item.key),
      ...(ContainersList.value || []).filter((item) =>
        (state.activatedComponents || []).find(
          (iitem) => iitem.key === item.key.split("-")[2].split("_")[1]
        )
      ).map((item) => item.key),
    ]);
  });
}

const getSelfServiceItemList = async (itemType, terminalType) => {
  return await proxy.$axios.post("/self/item/getSelfServiceItemList", {
    data: { itemType: itemType, terminalType: Number(terminalType) }, //筛选条件
    page: { pageSize: 6600, currentPage: 1 }, //分页条件
  });
}

const updateSelfServiceItem = async (itemData) => {
  return await proxy.$axios.post(
    "/self/item/updateSelfServiceItem",
    itemData
  );
}

const getNavigationList = async () => {
  return await proxy.$axios.post("/self/homePageInfo/getNavigationList", {
    tempId: state.tempId,
  });
}
/** end **/

const onExpand = (expandedKeys) => {
  console.log("onExpand", expandedKeys);
  // if not set autoExpandParent to false, if children expanded, parent can not collapse.
  // or, you can remove all expanded children keys.
  state.expandedKeys = expandedKeys;
  state.autoExpandParent = false;
}

const onCheck = (checkedKeys, info) => {
  console.log("checkedKeys", checkedKeys);
  console.log("info", info);
  //临时记录选中模块 in store
  proxy.$store.commit("dnd/PUSH_CHECKEDKEYS", checkedKeys);

  let _keys = info.node.eventKey.split("-");
  let _arr = _keys[2].split("_");
  let _index = _arr[0];
  let _key = _arr[1];
  if (!_key) return;
  //console.log(_keys);
  //if (!checkedKeys || checkedKeys.length == 0 || _key.length < 3) return;
  //console.log(state.activatedComponents);
  if (state.activatedComponents.find((item) => item.key === _key)) {
    state.showConfirm("list", _keys);
  } else {
    let _component = {
      ...state.components[_keys[1]][_index],
      treeKey: info.node.eventKey,
    };
    if (state.activatedComponents && state.activatedComponents.length > 0) {
      let { height, ccs } = state.activatedComponents[
        state.activatedComponents.length - 1
      ];
      let _ccs = ccs.split("/").map((item) => Number(item));
      //console.log(_ccs);
      if (
        _ccs[3] + state.components[_keys[1]][_index].width <=
        state.gridColumn + 1 &&
        height <= state.gridRow + 1
      ) {
        _component.ccs =
          _ccs[0] +
          "/" +
          _ccs[3] +
          "/" +
          (_ccs[0] + state.components[_keys[1]][_index].height) +
          "/" +
          (_ccs[3] + state.components[_keys[1]][_index].width);
      } else if (
        _ccs[3] + state.components[_keys[1]][_index].width >
        state.gridColumn + 1 &&
        _ccs[2] + state.components[_keys[1]][_index].height <=
        state.gridRow + 1
      ) {
        _component.ccs =
          _ccs[2] +
          "/1" +
          "/" +
          (_ccs[2] + state.components[_keys[1]][_index].height) +
          "/" +
          (state.components[_keys[1]][_index].width + 1);
      } else {
        state.$message.warning("已没有位置可以插入新组件！");
        state.checkedKeys = state.checkedKeys.filter(
          (item) => item !== info.node.eventKey
        );
        return;
      }
    } else
      _component.ccs =
        "1/1/" +
        (Number(state.components[_keys[1]][_index].height) + 1) +
        "/" +
        (Number(state.components[_keys[1]][_index].width) + 1);

    //console.log(_component);
    state.activatedComponents.push(_component);
  }

  //console.log(state.activatedComponents);
}

const onSelect = (selectedKeys, info) => {
  console.log(selectedKeys, info);
}

const preview = () => {
  let _workbenchData = {
    contentId: state.contentId,
    activatedComponents: state.activatedComponents,
    oldContent: state.oldContent,
    checkedKeys: state.checkedKeys,
  };

  let workbenchData =
    JSON.parse(window.sessionStorage.getItem("activatedComponents")) || {};

  if (state.tempId) {
    workbenchData[state.tempId] = _workbenchData;
  } else workbenchData["tmp"] = _workbenchData;

  window.sessionStorage.setItem(
    "activatedComponents",
    JSON.stringify(workbenchData)
  );

  state.isPreviewModel = true;
}

const cancel = () => {
  state.isPreviewModel = false;
}

const updateList = () => {
  state.editNavSenuSettingsModalVisible = false;
  state.getNavigationList().then((res) => {
    state.tabs = res || [];
    state.tabsActiveKey = 0;
    state.navigationId = state.tabs[0] ? state.tabs[0].id : 0;

    state.getTempInfo({
      tempId: Number(state.tempId),
      navigationId: Number(state.navigationId),
    });
  });
}

const showConfirm = (type, keys, actIndex) => {
  state.$confirm({
    title: "提示",
    content: "是否确认删除此组件？",
    onOk: () => {
      state.removeComponent(type, keys, actIndex);
    },
    onCancel: () => {
      proxy.$store.commit("dnd/PUSH_CHECKEDKEYS", [keys.join("-")]);
    },
  });
}

const removeComponent = (type, keys, actIndex) => {
  //console.log(actIndex);
  let _arr = keys[2].split("_");
  if (type === "list") {
    state.activatedComponents = state.activatedComponents.filter(
      (item) => item.key != _arr[1]
    );
  } else if (type === "component") {
    state.activatedComponents.splice(actIndex, 1);
  }

  proxy.$store.commit("dnd/DELETE_CHECKEDKEYS", [keys.join("-")]);
}

onMounted(() => {
  const { tempId, terminalType } = route.query
  state.tempId = Number(tempId) || "tmp"
  state.terminalType = Number(terminalType) || 0

  Promise.all([
    getSelfServiceItemList(0, state.terminalType), //其他类
    getSelfServiceItemList(1, state.terminalType), //容器类
  ])
    .then((res) => {
      if (!res) return;

      (res || []).map((item, index) => {
        let { dataList } = item;
        //console.log(dataList);
        state.components[index] = (dataList || []).map((item) => {
          return {
            title: item.itemName,
            key: String(item.id),
            url: item.url,
          };
        });

        //console.log(state.components);
        //console.log(1,MicroCards);
        //console.log(2,state.microParts);

        const _MicroCards = { ...MicroCards, ...state.microParts };

        //为元素赋值宽度长度, 并过滤没有对应组件的元素
        if (state.terminalType === 0)
          state.components[index] = state.components[index].filter(
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
        else if (state.terminalType === 1)
          state.components[index] = state.components[index].map((item) => {
            item.minWidth = 10;
            item.minHeight = 3;
            item.width = 10;
            item.height = 3;
            item.positionX = 0;
            item.positionY = 0;
            return item;
          });
      });

      onExpand(state.expandedKeys);

      //设置树列表
      state.treeData = [
        {
          title: "其他类",
          key: "0-0",
          disabled: true,
          children: MicroCardsList,
        },
        {
          title: "容器类",
          key: "0-1",
          disabled: true,
          children: ContainersList,
        },
      ];

      if (state.terminalType === 0) {
        let workbenchData = JSON.parse(window.sessionStorage.getItem("activatedComponents")) || [];
        if (workbenchData[state.tempId]) {
          let {
            contentId,
            activatedComponents,
            oldContent,
            checkedKeys,
          } = workbenchData[state.tempId];
          state.contentId = contentId || 0;
          state.activatedComponents = activatedComponents;
          //checkedKeys in store
          proxy.$store.commit("dnd/PUSH_CHECKEDKEYS", checkedKeys);
          state.oldContent = oldContent;
        } else
          getTempInfo({
            tempId: state.tempId,
          });
      } else if (state.terminalType === 1) {
        getNavigationList().then((res) => {
          state.tabs = res || [];
          state.tabsActiveKey = 0;
          state.navigationId = state.tabs[0] ? state.tabs[0].id : 0;

          if (state.navigationId <= 0) {
            proxy.$axios
              .post(
                "/self/homePageInfo/saveNavigation",
                state.tabs.map((item) => {
                  return { ...item, tempId: Number(tempId) };
                })
              )
              .then(() => {
                getNavigationList().then((res) => {
                  state.tabs = res || [];
                  state.navigationId = state.tabs[0] ? state.tabs[0].id : -1;

                  if (state.tabs.length > 0)
                    state.getTempInfo({
                      tempId: Number(tempId),
                      navigationId: Number(state.navigationId),
                    });
                });
              });
          } else {
            if (state.tabs.length > 0)
              getTempInfo({
                tempId: Number(tempId),
                navigationId: Number(state.navigationId),
              });
          }

          state.gridColumn = 10;
          state.gridScale = 30.3;
          state.gridPadding = 8;
        });
      }
    })
    .catch((err) => {
      console.log("err", err);
    });
})

onUnmounted(() => {
  store.commit("dnd/DELETE_CHECKEDKEYS", [])
})
</script>

<style scoped>
.ant-layout,
.ant-layout-sider {
  background: #ffffff;
}

.ant-layout {
  width: 100%;
}

.ant-layout-sider {
  overflow: auto;
  height: 100vh;
  padding: 10px;
}

.ant-layout-header {
  text-align: left;
  padding: 0 20px;
  position: fixed;
  bottom: 0;
  right: 0;
  z-index: 9999;
  background-color: transparent;
}

.ant-layout-content {
  margin-top: 25px;
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
