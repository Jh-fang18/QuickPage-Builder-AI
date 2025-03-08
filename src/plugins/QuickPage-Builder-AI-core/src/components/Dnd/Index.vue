<template>
  <a-layout>
    <a-layout-sider v-model="collapsed" :trigger="null" collapsible>
      <menu-unfold-outlined v-if="collapsed" class="trigger" @click="() => (collapsed = !collapsed)" />
      <menu-fold-outlined v-else class="trigger" @click="() => (collapsed = !collapsed)" />
      <a-tree checkable :default-expand-all="true" v-model:expandedKeys="expandedKeys"
        :auto-expand-parent="autoExpandParent" :tree-data="state.treeData" v-model:checkedKeys="checkedKeys"
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
        <dnd-core :terminal-type="Number(terminalType)" :activated-components="state.activatedComponents"
          :grid-row="gridRow" :grid-column="gridColumn" v-if="!isPreviewModel"></dnd-core>

        <dnd-preview :terminal-type="Number(terminalType)" :activated-components="state.activatedComponents"
          :grid-row="gridRow" :grid-column="gridColumn" :micro-parts="microParts"
          v-if="isPreviewModel"></dnd-preview>
      </a-layout-content>
    </a-layout>
  </a-layout>

  <!-- 移动端 预览 -->
  <a-modal :mask-closable="false" :title="$t(`${langPrefix}.previewMobile`)" :footer="null"
    v-model="editPreviewMobileModalVisible" width="415px" destroy-on-close>
    <dnd-preview-mobile />
  </a-modal>
</template>

<script setup>
//导入已有组件
import { ref, reactive, computed, onMounted, onUnmounted, getCurrentInstance, defineAsyncComponent } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons-vue'
import * as MicroCards from "../MicroParts/index.ts"

//导入自定义组件
import DndCore from "./Core/Index.vue"
const DndPreview = defineAsyncComponent(() => import("./Preview.vue"))
const DndPreviewMobile = defineAsyncComponent(() => import("./PreviewMobile.vue"))

//数据
const langPrefix = "management"
const store = useStore()
const route = useRoute()
const { proxy } = getCurrentInstance() // 获取当前实例

//属性
defineProps({
  microParts: Object
});

// 响应式状态
const tempId = ref("")
const contentId = ref(0)
const navigationId = ref(0)
const terminalType = ref(0)
const isPreviewModel = ref(false)
const editPreviewMobileModalVisible = ref(false)
const editNavSenuSettingsModalVisible = ref(false)
const collapsed = ref(true)
const expandedKeys = ref(["0-0", "0-1"])
const autoExpandParent = ref(true)

const gridColumn = ref(24)
const gridRow = ref(36)
const gridScale = ref(30)
const gridPadding = ref(20)
const oldContent = ref("[]")
const tabsActiveKey = ref(0)


const state = reactive({
  treeData: [],
  components: [],
  activatedComponents: [],
  tabs: [],
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
  console.log(tempId.value);

  if (tempId.value) {
    let _content = JSON.stringify(state.activatedComponents);
    oldContent = _content || "[]";
    let _navigationId = Number(navigationId.value || 0);
    let _obj = {
      id: contentId.value || 0,
      tempId: tempId.value,
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
        proxy.$message.success(proxy.$t(`${state.langPrefix}.addMessage`));
        let { id } = res;
        if (id) contentId.value = id;
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
      gridRow.value = _gridRow < 36 ? 36 : _gridRow;
    }

    if (id) contentId.value = id;
    else contentId.value = 0;

    //console.log(state.activatedComponents);
    //console.log(MicroCardsList);

    //临时记录选中模块 in store
    store.commit("dnd/PUSH_CHECKEDKEYS", [
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
  }).catch((err) => {
    console.error('获取页面数据失败:', err)
    proxy.$message.error('数据加载失败') // 新增错误提示
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
    tempId: tempId.value,
  });
}
/** end **/

const onExpand = (expandedKeys) => {
  console.log("onExpand", expandedKeys);
  // if not set autoExpandParent to false, if children expanded, parent can not collapse.
  // or, you can remove all expanded children keys.
  expandedKeys.value = expandedKeys;
  autoExpandParent.value = false;
}

const onCheck = (checkedKeys, info) => {
  console.log("checkedKeys", checkedKeys);
  console.log("info", info);
  //临时记录选中模块 in store
  store.commit("dnd/PUSH_CHECKEDKEYS", checkedKeys);

  let _keys = info.node.eventKey.split("-");
  let _arr = _keys[2].split("_");
  let _index = _arr[0];
  let _key = _arr[1];
  if (!_key) return;
  //console.log(_keys);
  //if (!checkedKeys || checkedKeys.length == 0 || _key.length < 3) return;
  //console.log(state.activatedComponents);
  if (state.activatedComponents.find((item) => item.key === _key)) {
    showConfirm("list", _keys);
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
        gridColumn.value+ 1 &&
        height <= gridRow.value + 1
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
        gridColumn.value+ 1 &&
        _ccs[2] + state.components[_keys[1]][_index].height <=
        gridRow.value + 1
      ) {
        _component.ccs =
          _ccs[2] +
          "/1" +
          "/" +
          (_ccs[2] + state.components[_keys[1]][_index].height) +
          "/" +
          (state.components[_keys[1]][_index].width + 1);
      } else {
        proxy.$message.warning("已没有位置可以插入新组件！");
        this.checkedKeys = this.checkedKeys.filter(
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
    contentId: contentId.value,
    activatedComponents: state.activatedComponents,
    oldContent: state.oldContent,
    checkedKeys: state.checkedKeys,
  };

  let workbenchData =
    JSON.parse(window.sessionStorage.getItem("activatedComponents")) || {};

  if (tempId.value) {
    workbenchData[tempId.value] = _workbenchData;
  } else workbenchData["tmp"] = _workbenchData;

  window.sessionStorage.setItem(
    "activatedComponents",
    JSON.stringify(workbenchData)
  );

  isPreviewModel.value = true;
}

const cancel = () => {
  isPreviewModel.value = false;
}

const updateList = () => {
  editNavSenuSettingsModalVisible.value = false;
  getNavigationList().then((res) => {
    state.tabs = res || [];
    state.tabsActiveKey = 0;
    navigationId.value = state.tabs[0] ? state.tabs[0].id : 0;

    state.getTempInfo({
      tempId: Number(tempId.value),
      navigationId: Number(navigationId.value),
    });
  });
}

const showConfirm = (type, keys, actIndex) => {
  proxy.$confirm({
    title: "提示",
    content: "是否确认删除此组件？",
    onOk: () => {
      state.removeComponent(type, keys, actIndex);
    },
    onCancel: () => {
      store.commit("dnd/PUSH_CHECKEDKEYS", [keys.join("-")]);
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

  store.commit("dnd/DELETE_CHECKEDKEYS", [keys.join("-")]);
}

//生命周期
onMounted(() => {
  try {
    const { tempIdQuery, terminalTypeQuery } = route.query
    tempId.value = Number(tempIdQuery) || "tmp"
    terminalType.value = Number(terminalTypeQuery) || 0

    //获取组件列表
    Promise.all([
      getSelfServiceItemList(0, terminalType.value), //其他类
      getSelfServiceItemList(1, terminalType.value), //容器类
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
          if (terminalType.value === 0)
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
          else if (terminalType.value === 1)
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

        onExpand(expandedKeys.value);

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

        if (terminalType.value === 0) {
          let workbenchData = JSON.parse(window.sessionStorage.getItem("activatedComponents")) || [];
          if (workbenchData[tempId.value]) {
            let {
              contentId,
              activatedComponents,
              oldContent,
              checkedKeys,
            } = workbenchData[tempId.value];
            contentId.value = contentId || 0;
            state.activatedComponents = activatedComponents;
            //checkedKeys in store
            store.commit("dnd/PUSH_CHECKEDKEYS", checkedKeys);
            state.oldContent = oldContent;
          } else
            getTempInfo({
              tempId: tempId.value,
            });
        } else if (terminalType.value === 1) {
          getNavigationList().then((res) => {
            state.tabs = res || [];
            state.tabsActiveKey = 0;
            navigationId.value = state.tabs[0] ? state.tabs[0].id : 0;

            if (navigationId.value <= 0) {
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
                    navigationId.value = state.tabs[0] ? state.tabs[0].id : -1;

                    if (state.tabs.length > 0)
                      state.getTempInfo({
                        tempId: Number(tempId),
                        navigationId: Number(navigationId.value),
                      });
                  });
                });
            } else {
              if (state.tabs.length > 0)
                getTempInfo({
                  tempId: Number(tempId),
                  navigationId: Number(navigationId.value),
                });
            }

            gridColumn.value= 10;
            state.gridScale = 30.3;
            state.gridPadding = 8;
          });
        }
      })
      .catch((err) => {
        console.error('获取模板信息失败:', err)
        proxy.$message.error('数据加载失败') // 新增错误提示
      });
  } catch (err) {
    console.error('初始化失败:', err)
    proxy.$message.error('初始化失败，请刷新重试')
  }
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
  position: fixed !important;
  left: 0;
  z-index: 1000;
}

.ant-layout-header {
  text-align: left;
  padding: 0 20px;
  position: fixed;
  bottom: 0;
  right: 0;
  z-index: 1000;
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
