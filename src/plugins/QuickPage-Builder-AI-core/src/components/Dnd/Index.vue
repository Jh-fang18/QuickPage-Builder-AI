<template>
  <a-layout>
    <a-spin :spinning="loading">
      <a-layout :style="layoutStyle">
        <a-layout-sider :class="siderClass">
          <div class="title">
            <span>微件列表</span>
          </div>
          <a-tree checkable :default-expand-all="true" v-model:expandedKeys="expandedKeys"
            :auto-expand-parent="autoExpandParent" :tree-data="state.treeData" v-model:checkedKeys="checkedKeys"
            @expand="onExpand" @check="onCheck" @select="onSelect" />
        </a-layout-sider>
        <a-layout-content>
          <component :is="currentComponent" :terminal-type="Number(terminalType)"
            :activated-components="state.activatedComponents" :grid-row="gridRow" :grid-column="gridColumn"
            :micro-parts="microParts" />
        </a-layout-content>
      </a-layout>

      <a-layout-footer>
        <a-form :style="layoutStyle" :model="formState" name="save" layout="inline" autocomplete="off" @finish="save"
          @finishFailed="onFinishFailed" v-if="!isPreviewModel">
          <a-form-item label="高度" name="gridRow" :rules="[{ type: 'number', min: 1 }]">
            <a-input-number v-model:value="formState.gridRow">
            </a-input-number>
          </a-form-item>

          <a-form-item label="宽度" name="gridColumn" :rules="[{ type: 'number', min: 1 }]">
            <a-input-number v-model:value="formState.gridColumn">
            </a-input-number>
          </a-form-item>

          <a-form-item>
            <a-button v-if="terminalType === 0" @click.prevent="preview">
              {{ proxy?.$t(`${langPrefix}.preview`) }}</a-button>
          </a-form-item>

          <!-- <a-form-item>
            <a-button v-if="terminalType === '1'" @click="previewMobile">{{ $t(`${langPrefix}.preview`) }}</a-button> 
          </a-form-item>-->

          <a-form-item>
            <a-button :disabled="disabled" type="primary" html-type="submit">
              {{ proxy?.$t(`${langPrefix}.save`) }}</a-button>
          </a-form-item>
        </a-form>

        <a-form :style="layoutStyle" name="preview" layout="inline" autocomplete="off" @finish="preview"
          @finishFailed="onFinishFailed" v-else>
          <a-form-item>
            <a-button type="primary" v-if="terminalType === 0" html-type="submit">
              {{ proxy?.$t(`${langPrefix}.preview`) }}</a-button>
          </a-form-item>
          <a-form-item>
            <a-button @click="cancel">{{ proxy?.$t(`${langPrefix}.cancel`) }}</a-button>
          </a-form-item>
        </a-form>
      </a-layout-footer>
    </a-spin>
  </a-layout>

  <!-- 移动端 预览 -->
  <a-modal :mask-closable="false" :title="proxy?.$t(`${langPrefix}.previewMobile`)" :footer="null"
    v-model="editPreviewMobileModalVisible" width="415px" destroy-on-close>
    <dnd-preview-mobile />
  </a-modal>
</template>

<script lang="ts" setup>
// 导入已有组件
import { ref, reactive, computed, onMounted, onUnmounted, getCurrentInstance, defineAsyncComponent } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { useWindowSize } from '@vueuse/core'
import * as MicroCards from "../MicroParts/index.ts"

// 导入自定义组件
import DndCore from "./Core/Index.vue"
const DndPreview = defineAsyncComponent(() => import("./Preview.vue"))
const DndPreviewMobile = defineAsyncComponent(() => import("./PreviewMobile.vue"))

// 导入类型
import type { TreeProps, TabsProps } from 'ant-design-vue';
import type {
  ComponentItem,
  SelfServiceData,
  SelfServiceDataItem,
  CardData,
  FormState,
  TempInfoData
} from '../../types/dnd'

// 页面基础数据获取
const langPrefix = "management"
const store = useStore()
const route = useRoute()
const instance = getCurrentInstance();
const proxy = instance ? instance.proxy : null; // 获取当前实例的代理对象

// 使用 useWindowSize 获取窗口宽度
const { width: windowWidth } = useWindowSize()

// props 接收数据
const { microParts } = defineProps({
  microParts: Object
});

// 合并微件
const _MicroCards: Record<string, any> = {
  ...MicroCards,
  ...microParts
};

// 响应式状态
const loading = ref(false)
const tempId = ref("")
const contentId = ref(0)
const navigationId = ref(0)
const terminalType = ref(0) // 0: PC, 1: Mobile
const isPreviewModel = ref(false)
const editPreviewMobileModalVisible = ref(false)
const editNavSenuSettingsModalVisible = ref(false)
const expandedKeys = ref([""])
const autoExpandParent = ref(true)
const gridColumn = ref(24)
const gridRow = ref(36)
const gridScale = ref(30)
const gridPadding = ref(20)
const oldContent = ref("[]")
const tabsActiveKey = ref(0)

/** start 计算属性 */
// 表单提交按钮是否禁用
const disabled = computed(() => {
  return !(formState.gridRow && formState.gridColumn);
});

// 微件列表
const MicroCardsList = computed(() => {
  return (state.components[0] || []).map((item, index) => ({
    title: item.title,
    key: `0-0-${index}_${item.key}`
  }))
})

// 容器列表
const ContainersList = computed(() => {
  return (state.components[1] || []).map((item, index) => ({
    title: item.title,
    key: `0-1-${index}_${item.key}`
  }))
})

// 计算布局宽度
const layoutWidth = computed(() => {
  const baseWidth = (gridScale.value + gridPadding.value) * gridColumn.value - 20
  return windowWidth.value < 1580 ? null : baseWidth
})

// 动态计算布局宽度
const layoutStyle = computed(() => ({
  width: layoutWidth.value ? `${layoutWidth.value}px` : null,
  margin: layoutWidth.value ? '0 auto' : null
}))

// 根据宽度判断是否添加left距离
const siderClass = computed(() => ({
  fixedToLeft: !!layoutWidth.value
}))

// 动态计算当前组件
const currentComponent = computed(() => isPreviewModel.value ? DndPreview : DndCore)

// 动态获取当前被选组件
const checkedKeys = computed({
  get: () => store.state.dnd.checkedKeys,
  set: (val) => store.commit("dnd/PUSH_CHECKEDKEYS", val)
})
/** end */

/** start 响应式状态 */
const state = reactive({
  treeData: [] as TreeProps['treeData'],
  components: [] as ComponentItem[][],
  activatedComponents: [] as ComponentItem[],
  tabs: [] as TabsProps[],
})

const formState = reactive<FormState>({
  gridRow: gridRow.value,
  gridColumn: gridColumn.value,
});
/** end */


/* ====================== 核心方法 ====================== */
/**
 * 封装API请求处理
 * @param apiCall API调用函数
 * @param errorMessage 系统错误提示信息 
 * @returns Promise包装的响应数据或null
 */
const handleApiRequest = async <T>(apiCall: () => Promise<T>, errorMessage: string = "操作失败"): Promise<T | null> => {
  if (!proxy) {
    console.error('Proxy is null');
    return null;
  }

  try {
    return await apiCall();
  } catch (error: unknown) {
    console.error(`${errorMessage}:`, error);
    proxy.$message.error(errorMessage);
    return null;
  }
}

// 表单提交失败回调
const onFinishFailed = (errorInfo: any) => {
  console.log('Failed:', errorInfo);
};

/** start 保存相关操作 */
// save时获取基本数据
const createPayload = () => ({
  id: contentId.value || 0,
  tempId: tempId.value,
  content: JSON.stringify(state.activatedComponents) || "[]",
  navigationId: Number(navigationId.value) || 0,
});

// save时更新响应数据, contentId, oldContent
const updateContentResponseData = (_contentId: number, _oldContent: string): void => {
  contentId.value = _contentId;
  oldContent.value = _oldContent || "[]";
}

// 保存
const save = async () => {
  //console.log(tempId.value);
  if (!tempId.value) {
    proxy?.$message.warning("请先选择模板！");
    return;
  } else return handleApiRequest(async () => {
    const _obj = createPayload(); // 获取基本数据

    const res = await proxy!.$axios
      .post(
        "/self/homePageInfo/saveTempInfo",
        _obj.navigationId
          ? {
            ..._obj,
            navigationId: _obj.navigationId,
          }
          : _obj
      )

    if (res?.data.id) {
      proxy!.$message.success(proxy!.$t(`${langPrefix}.addMessage`));
      updateContentResponseData(res?.data.id, _obj.content || "[]");
    }

    return res;

  }, '保存操作失败');

}
/** end **/

/** start 获取页面输数据相关 */
const getTempInfo = (data: { tempId: string | number; navigationId?: number }) => {
  return handleApiRequest(async () => {
    const res: TempInfoData = await proxy!.$axios.post("/self/homePageInfo/getTempInfo", data);

    // res内容判断，如果没有数据或者提示错误，直接返回
    if (!res?.tempId && !res?.dataList) {
      proxy?.$message.error('没有TempId数据加载失败')
      return res
    }

    let { content, id } = res?.dataList || {};

    if (content) state.activatedComponents = JSON.parse(content);
    else state.activatedComponents = [];

    //保留原始content用于判断是否有过修改
    oldContent.value = content || "[]";

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

    return res;

  }, '获取页面数据失败');
}

const getSelfServiceItemList = async (itemType: number, terminalType: number) => {
  return handleApiRequest(async () => {
    const res: SelfServiceData = await proxy!.$axios.post("/self/item/getSelfServiceItemList", {
      data: { itemType: itemType, terminalType: Number(terminalType) }, //筛选条件
      page: { pageSize: 6600, currentPage: 1 }, //分页条件
    });

    if (!res?.dataList || res?.dataList.length === 0) {
      proxy?.$message.error('数据加载失败')
      return res
    }

    return res;
  }, '获取微件数据失败')
}

const getNavigationList = async () => {
  if (proxy) {
    return await proxy.$axios.post("/self/homePageInfo/getNavigationList", {
      tempId: tempId.value,
    });
  } else {
    console.error('Proxy is null');
    return null;
  }
}

const updateSelfServiceItem = async (itemData: any) => {
  if (proxy) {
    return await proxy.$axios.post(
      "/self/item/updateSelfServiceItem",
      itemData
    );
  } else {
    console.error('Proxy is null');
    return null;
  }
}

/** end **/

// 展开节点
const onExpand: TreeProps['onExpand'] = (onExpandedKeys, info) => {
  console.log("onExpand", onExpandedKeys, info);
  // if not set autoExpandParent to false, if children expanded, parent can not collapse.
  // or, you can remove all expanded children keys.
  expandedKeys.value = onExpandedKeys.map(String); // Ensure all keys are strings
  autoExpandParent.value = false;
}

// 选中节点，添加组件进入画布
const onCheck: TreeProps['onCheck'] = (checked, info) => {
  if (typeof info.node.eventKey !== 'string') {
    console.error('Invalid eventKey:', info.node.eventKey);
    return;
  }
  const onCheckedKeys = Array.isArray(checked) ? checked : checked.checked;
  console.log("checkedKeys", onCheckedKeys);
  console.log("info", info);
  //临时记录选中模块 in store
  store.commit("dnd/PUSH_CHECKEDKEYS", onCheckedKeys);

  let _keys = info.node.eventKey.split("-");
  let _classId = Number(_keys[1]);
  let _arr = _keys[2].split("_");
  let _index = Number(_arr[0]);
  let _key = _arr[1];
  if (!_key) return;
  //console.log(_keys);
  //if (!checkedKeys || checkedKeys.length == 0 || _key.length < 3) return;
  //console.log(state.activatedComponents);
  if (state.activatedComponents.find((item) => item.key === _key)) {
    showConfirm("list", _keys);
  } else {
    let _component = {
      ...state.components[_classId][_index],
      treeKey: info.node.eventKey,
    };
    if (state.activatedComponents && state.activatedComponents.length > 0) {
      let { height, ccs } = state.activatedComponents[
        state.activatedComponents.length - 1
      ];
      let _ccs = ccs.split("/").map(Number);
      //console.log(_ccs);
      if (
        _ccs[3] + state.components[_classId][_index].width <=
        gridColumn.value + 1 &&
        height <= gridRow.value + 1
      ) {
        _component.ccs =
          _ccs[0] +
          "/" +
          _ccs[3] +
          "/" +
          (_ccs[0] + state.components[_classId][_index].height) +
          "/" +
          (_ccs[3] + state.components[_classId][_index].width);
      } else if (
        _ccs[3] + state.components[_classId][_index].width >
        gridColumn.value + 1 &&
        _ccs[2] + state.components[_classId][_index].height <=
        gridRow.value + 1
      ) {
        _component.ccs =
          _ccs[2] +
          "/1" +
          "/" +
          (_ccs[2] + state.components[_classId][_index].height) +
          "/" +
          (state.components[_classId][_index].width + 1);
      } else {
        proxy?.$message.warning("已没有位置可以插入新组件！");
        checkedKeys.value = onCheckedKeys.filter(
          (item) => item !== info.node.eventKey
        );
        return;
      }
    } else
      _component.ccs =
        "1/1/" +
        (Number(state.components[_classId][_index].height) + 1) +
        "/" +
        (Number(state.components[_classId][_index].width) + 1);

    //console.log(_component);
    state.activatedComponents.push(_component);
  }

  //console.log(state.activatedComponents);
}

// 选中节点
const onSelect: TreeProps['onSelect'] = (selectedKeys, info) => {
  console.log(selectedKeys, info);
}

// 预览
const preview = () => {
  let _workbenchData = {
    contentId: contentId.value,
    activatedComponents: state.activatedComponents,
    oldContent: oldContent.value,
    checkedKeys: checkedKeys.value,
  };

  let workbenchData =
    JSON.parse(window.sessionStorage.getItem("activatedComponents") || "{}") || {};

  if (tempId.value) {
    workbenchData[tempId.value] = _workbenchData;
  } else workbenchData["tmp"] = _workbenchData;

  window.sessionStorage.setItem(
    "activatedComponents",
    JSON.stringify(workbenchData)
  );

  isPreviewModel.value = true;
}

// 取消预览
const cancel = () => {
  isPreviewModel.value = false;
}

const updateList = () => {
  editNavSenuSettingsModalVisible.value = false;
  getNavigationList().then((res) => {
    state.tabs = (res && Array.isArray(res.data) ? res.data : []) || [];
    tabsActiveKey.value = 0;
    navigationId.value = state.tabs[0] ? Number(state.tabs[0].id) : 0;

    getTempInfo({
      tempId: Number(tempId.value),
      navigationId: Number(navigationId.value),
    });
  });
}

// 显示确认框
const showConfirm = (type: string, keys: string[], actIndex: number = 0) => {
  if (proxy) {
    proxy.$confirm({
      title: "提示",
      content: "是否确认删除此组件？",
      onOk: () => {
        removeComponent(type, keys, actIndex);
      },
      onCancel: () => {
        store.commit("dnd/PUSH_CHECKEDKEYS", [keys.join("-")]);
      },
    });
  } else {
    console.error('Proxy is null');
  }
}

// 删除组件
const removeComponent = (type: string, keys: string[], actIndex: number = 0) => {
  //console.log(actIndex);
  let _arr = keys[2].split("_");
  if (type === "list") {
    state.activatedComponents = state.activatedComponents.filter(
      item => item.key !== _arr[1]
    );
  } else if (type === "component") {
    state.activatedComponents.splice(actIndex, 1);
  }

  store.commit("dnd/DELETE_CHECKEDKEYS", [keys.join("-")]);
}

// 更新组件列表
const updateComponentItem = (
  item: ComponentItem,
  minRowSpan: number,
  minColSpan: number,
  selfServiceData: SelfServiceDataItem
): ComponentItem => ({
  ...item,
  minWidth: minRowSpan,
  minHeight: minColSpan,
  width: minRowSpan,
  height: minColSpan,
  editTitle: false,
  positionX: 0,
  positionY: 0,
  selfServiceData
});

// 数据获取方法
const fetchComponentData = async () => {
  tempId.value = String(route.query.tempIdQuery) || "tmp";
  terminalType.value = Number(route.query.terminalTypeQuery) || 0;

  //获取组件列表
  await Promise.all([
    getSelfServiceItemList(0, terminalType.value), //其他类
    getSelfServiceItemList(1, terminalType.value), //容器类
  ])
    .then((res) => {
      if (!res) return;

      (res || []).map((item, index) => {
        let dataList: SelfServiceDataItem[] = item?.dataList || [];
        //console.log(dataList);

        //获取组件基本信息
        state.components[index] = (dataList || []).map((item) => {
          return {
            title: item.itemName,
            key: String(item.id),
            url: item.url,
            minWidth: 0,
            minHeight: 0,
            width: 0,
            height: 0,
            editTitle: false,
            positionX: 0,
            positionY: 0,
            selfServiceData: {} as SelfServiceDataItem,
            treeKey: '',
            ccs: '',
          };
        });

        //console.log(state.components);
        //console.log(1,MicroCards);
        //console.log(2,state.microParts);

        // PC端
        if (terminalType.value === 0) {
          //删除不存在的微件
          state.components[index] = state.components[index].filter(
            (item, index) => {
              const microCard: CardData = item.url && _MicroCards[item.url];
              if (microCard) {
                const { minRowSpan, minColSpan } = microCard.data();
                Object.assign(item, updateComponentItem(item, minRowSpan, minColSpan, dataList[index]));
              }
              return !!microCard;
            }
          );

          //获取已激活模板信息
          const workbenchData = JSON.parse(window.sessionStorage.getItem("activatedComponents") || "{}") || {} as Record<string, any>;
          if (workbenchData[tempId.value]) {
            const {
              contentId: _contentId,
              activatedComponents: _activatedComponents,
              oldContent: _oldContent,
              checkedKeys: _checkedKeys,
            } = workbenchData[tempId.value];
            contentId.value = _contentId || 0;
            state.activatedComponents = _activatedComponents;
            //checkedKeys in store
            store.commit("dnd/PUSH_CHECKEDKEYS", checkedKeys);
            oldContent.value = _oldContent;
          } else
            getTempInfo({
              tempId: tempId.value,
            });
        }
        // 移动端
        else if (terminalType.value === 1) {
          //删除不存在的微件
          state.components[index] = state.components[index].map((item) => {
            item.minWidth = 10;
            item.minHeight = 3;
            item.width = 10;
            item.height = 3;
            item.positionX = 0;
            item.positionY = 0;
            return item;
          });

          //获取已激活模板信息
          getNavigationList().then((res) => {
            state.tabs = res?.data || [];
            tabsActiveKey.value = 0;
            navigationId.value = state.tabs[0] ? Number(state.tabs[0].id) : 0;

            if (navigationId.value <= 0) {
              proxy?.$axios
                .post(
                  "/self/homePageInfo/saveNavigation",
                  state.tabs.map((item) => {
                    return { ...item, tempId: Number(tempId) };
                  })
                )
                .then(() => {
                  getNavigationList().then((res) => {
                    state.tabs = res?.data || [];
                    navigationId.value = state.tabs[0] ? Number(state.tabs[0].id) : -1;

                    if (state.tabs.length > 0)
                      getTempInfo({
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

            gridColumn.value = 10;
            gridScale.value = 30.3;
            gridPadding.value = 8;
          });
        }
      });
    })
    .catch((err) => {
      console.error('获取模板信息失败:', err)
      proxy?.$message.error('数据加载失败') // 新增错误提示
    });
};

// 生命周期
onMounted(async () => {
  // 初始化
  loading.value = true;
  try {

    // 获取组件数据
    await fetchComponentData();

    //设置树列表
    state.treeData = [
      {
        title: "其他类",
        key: "0-0",
        disabled: true,
        children: MicroCardsList.value,
      },
      {
        title: "容器类",
        key: "0-1",
        disabled: true,
        children: ContainersList.value,
      },
    ];

    //展开树列表
    expandedKeys.value = [
      "0-0",
      "0-1",
    ]

  } catch (err) {
    console.error('初始化失败:', err)
    proxy?.$message.error('初始化失败，请刷新重试')
  } finally {
    //结束加载
    loading.value = false;
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
  position: sticky;
  top: 0;
  overflow: auto;
  height: 100vh;
  padding: 10px;

  .title {
    font-size: 16px;
    font-weight: bold;
    line-height: 24px;
    margin-bottom: 10px;

    span {
      margin-right: 5px;
    }
  }

  .trigger {
    font-size: 16px;
    cursor: pointer;
    transition: color 0.3s;
  }

  .trigger:hover {
    color: #1890ff;
  }
}

.ant-layout-sider.fixedToLeft {
  position: fixed !important;
  margin-left: -200px;
}

.ant-layout-content {
  margin-top: 25px;
}

.ant-layout-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: #fff;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px 24px;

  form {
    justify-content: flex-end
  }

}
</style>
