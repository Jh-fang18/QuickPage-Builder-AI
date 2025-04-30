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
              {{ $t(`${langPrefix}.preview`) }}</a-button>
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
              {{ $t(`${langPrefix}.preview`) }}</a-button>
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
import { Modal } from 'ant-design-vue'
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
// const editNavSenuSettingsModalVisible = ref(false)
const expandedKeys = ref([""])
const autoExpandParent = ref(true)
const gridColumn = ref(24)
const gridRow = ref(36)
const gridScale = ref(30)
const gridPadding = ref(20)
const oldContent = ref("[]")
const tabsActiveKey = ref(0)


// ======================
// 计算属性
// ======================

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


// ======================
// 响应式状态
// ======================

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

// ======================
// 保存相关操作
// ======================

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


// ======================
// 获取页面输数据相关 
// ======================

// 获取页面数据
const getTempInfo = (data: { tempId: string | number; navigationId?: number }) => {
  return handleApiRequest(async () => {
    const res: TempInfoData = await proxy!.$axios.post("/self/homePageInfo/getTempInfo", data);

    // res内容判断，如果没有数据或者提示错误，直接返回
    if (!res?.tempId && !res?.dataList) {
      proxy?.$message.error('没有TempId数据加载失败')
      return null
    }

    const { content: _content, id: _contentId } = res!.dataList || {};

    return {
      contentId: _contentId || 0,
      activatedComponents: JSON.parse(_content) as ComponentItem[] || [],
      oldContent: _content || "[]"
    }
  }, '获取页面数据失败');
}

// 获取微件数据
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

// 数据获取方法
const fetchComponentData = async () => {
  // 设置路由参数
  if (route.query.tempIdQuery || route.query.terminalTypeQuery) {
    catchRouterData();
  }

  //获取组件列表
  await Promise.all([
    getSelfServiceItemList(0, terminalType.value), //其他类
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

          // 抓取路由参数tempId
          if (!tempId.value)
            catchRouterData();

          // 从sessionStorage中获取已激活组件数据
          const workbenchData: Record<string, any> = JSON.parse(window.sessionStorage.getItem("activatedComponents") || "{}");

          if (workbenchData[tempId.value]) {
            const {
              contentId: _contentId = 0,
              activatedComponents: _activatedComponents = [],
              oldContent: _oldContent = '[]',
              checkedKeys: _checkedKeys,
            } = workbenchData[tempId.value];

            // 更新state.activatedComponents
            activatedComponents(_contentId, _activatedComponents, _oldContent, _checkedKeys);
          }
          else
            getTempInfo({
              tempId: tempId.value,
            }).then((res) => {
              if (res) {
                const { contentId: _contentId = 0, activatedComponents: _activatedComponents = [], oldContent: _oldContent = '[]' } = res;

                // 更新state.activatedComponents
                activatedComponents(_contentId, _activatedComponents, _oldContent);

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

              }
            });

          // 设置画布高度
          if (state.activatedComponents && state.activatedComponents.length > 0) {
            let _gridRow = state.activatedComponents[
              state.activatedComponents.length - 1
            ]["ccs"]
              .split("/")
              .map((item) => Number(item))[2];
            gridRow.value = _gridRow < 36 ? 36 : _gridRow;
          }
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

// const updateSelfServiceItem = async (itemData: any) => {
//   if (proxy) {
//     return await proxy.$axios.post(
//       "/self/item/updateSelfServiceItem",
//       itemData
//     );
//   } else {
//     console.error('Proxy is null');
//     return null;
//   }
// }
/** end **/


// ======================
//  component相关操作
//  注意：以下部分函数会直接修改外部变量state.activatedComponents，而不是返回新的数组。
// ======================

/**
 * 添加组件到画布
 * 注意: 直接修改外部变量state.activatedComponents
 * @param component 要添加的组件
 */
const addComponent = (component: ComponentItem) => {
  if (!component) return;
  state.activatedComponents.push(component);
}

/**
 * 移除组件
 * 注意: 直接修改外部变量state.activatedComponents
 * @param type 组件类型
 * @param keys 组件key
 * @param actIndex 组件索引
 */
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

/**
 * 获取已激活模板信息
 * 注意: 直接修改外部变量state.activatedComponents
 * @param contentId 
 * @param activatedComponents 
 * @param oldContent
 * @param checkedKeys
 */
const activatedComponents = (_contentId: number, _activatedComponents: ComponentItem[], _oldContent: string, _checkedKeys?: Parameters<Exclude<TreeProps["onCheck"], undefined>>[0]) => {
  //勾选已选中微件
  if (_checkedKeys) {
    addCheckedKeys(_checkedKeys);
  }

  contentId.value = _contentId;
  oldContent.value = _oldContent;
  state.activatedComponents = _activatedComponents;
}
/** end */


// ======================
// Tree 组件操作方法
//  注意：以下部分函数会直接修改外部变量checkedKeys，而不是返回新的数组。
//  注意：以下部分函数会直接修改外部变量expandedKeys，而不是返回新的数组。
// ======================

/** 
 * 添加选中节点的key到选中列表中，也可保持当前选中节点的key
 * 注意：此函数会直接修改外部变量checkedKeys
 * @param checked 当前选中状态
 * @param info 被点击的节点信息
 */
const addCheckedKeys = (checked: Parameters<Exclude<TreeProps['onCheck'], undefined>>[0], info?: Parameters<Exclude<TreeProps['onCheck'], undefined>>[1]) => {
  if (!checked) return;

  const onCheckedKeys = Array.isArray(checked) ? checked : checked.checked;
  checkedKeys.value = [...onCheckedKeys, ...(info?.node?.eventKey ? [info.node.eventKey] : [])];
}

/** 
 * 从选中列表中删除指定节点的key
 * 注意：此函数会直接修改外部变量checkedKeys
 * @param checked 当前选中状态
 * @param info 节点信息
 */
const deleteCheckedKeys: TreeProps['onCheck'] = (checked, info) => {
  if (!checked || !info?.node?.eventKey) return;

  const onCheckedKeys = Array.isArray(checked) ? checked : checked.checked;
  checkedKeys.value = [...onCheckedKeys.filter(
    (item) => item !== info.node.eventKey
  )];
}

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
    console.error('Invalid eventKey type:', info.node.eventKey);
    return;
  }

  if (!info.node.eventKey.includes("-")) {
    console.error('Invalid eventKey format:', info.node.eventKey);
    return;
  }

  // prefix: 微件类型 classIdStr: 容器类型 componentInfo: 组件索引_组件key
  const [prefix, classIdStr, componentInfo] = info.node.eventKey.split("-");
  const [indexStr, componentKey] = componentInfo.split("_");
  if (!componentKey) return; // 没有componentKey，直接返回

  // tree数据私有化
  const _keys = [prefix, classIdStr, componentInfo]
  const _key = componentKey || '';
  const _classId = Number(classIdStr) || 0;
  const _index = Number(indexStr) || 0;

  //console.log(state.activatedComponents);
  if (state.activatedComponents.find((item) => item.key === _key)) {
    showComponentExistConfirm("list", _keys, checked, info); // 微件已存在，提示是否删除
    return;
  } else {
    const _component = {
      ...state.components[_classId][_index],
      treeKey: info.node.eventKey,
    };

    if (state.activatedComponents && state.activatedComponents.length > 0) { // 画布不为空
      // 获取最后一个组件的高度和ccs
      const { ccs } = state.activatedComponents[
        state.activatedComponents.length - 1
      ];
      console.log(ccs);
      // 分割ccs字符串并转换为数字数组, 格式: [x, y, height, width], 相对grid-area: [grid-row-start / grid-column-start / grid-row-end / grid-column-end]
      const aCss = ccs.split("/").map(Number);

      if ( // 判断在最后一个微件的同一行里是否有位置可以插入新微件
        aCss[0] + _component.height <= gridRow.value + 1 && // 高度和小于画布
        aCss[3] + _component.width <= gridColumn.value + 1 // 宽度和小于画布
      ) {
        _component.ccs =
          aCss[0] +
          "/" +
          aCss[3] +
          "/" +
          (aCss[0] + _component.height) +
          "/" +
          (aCss[3] + _component.width);
      } else if ( // 判断在最后一个微件的同一行后是否有位置可以插入新微件
        aCss[0] + _component.height <= gridRow.value + 1 &&
        aCss[3] + _component.width > gridColumn.value + 1
      ) {
        // 找到最后行中组件的最大高度
        const maxHeight = state.activatedComponents.reduce((prev: number, curr: ComponentItem) => {
          if (!curr.ccs) return prev;
          return Math.max(prev, Number(curr.ccs.split("/")[2]));
        }, 0)

        _component.ccs =
          maxHeight +
          "/1" +
          "/" +
          (maxHeight + _component.height) +
          "/" +
          (_component.width + 1);
      } else {
        proxy?.$message.warning("已没有位置可以插入新组件！");
        deleteCheckedKeys(checked, info); // 从选中列表中删除指定节点的key
        return;
      }
    } else // 画布为空，直接插入第一个组件
      _component.ccs =
        "1/1/" +
        (_component.height + 1) +
        "/" +
        (_component.width + 1);

    //console.log(_component);
    addComponent(_component); // 添加组件到画布
    setWorkbenchData(tempId.value, contentId.value, state.activatedComponents, oldContent.value, checkedKeys.value); // 保存已激活模板信息到sessionStorage
  }

  //console.log(state.activatedComponents);
}

// 选中节点
const onSelect: TreeProps['onSelect'] = (selectedKeys, info) => {
  console.log(selectedKeys, info);
}
/** end */


// ======================
// 预览相关方法
// ======================

// 预览
const preview = () => {
  setWorkbenchData(
    tempId.value,
    contentId.value,
    state.activatedComponents,
    oldContent.value,
    checkedKeys.value
  );

  isPreviewModel.value = true;
}

// 取消预览
const cancel = () => {
  isPreviewModel.value = false;
}
/** end */

// const updateList = () => {
//   editNavSenuSettingsModalVisible.value = false;
//   getNavigationList().then((res) => {
//     state.tabs = (res && Array.isArray(res.data) ? res.data : []) || [];
//     tabsActiveKey.value = 0;
//     navigationId.value = state.tabs[0] ? Number(state.tabs[0].id) : 0;

//     getTempInfo({
//       tempId: Number(tempId.value),
//       navigationId: Number(navigationId.value),
//     });
//   });
// }

// 显示确认框
const showComponentExistConfirm = (type: string, keys: string[], checked: Parameters<Exclude<TreeProps['onCheck'], undefined>>[0], info: Parameters<Exclude<TreeProps['onCheck'], undefined>>[1], actIndex: number = 0) => {
  // 添加当前选中节点的key到选中列表中
  addCheckedKeys(checked, info);

  Modal.confirm({
    title: "提示",
    content: "是否确认删除此组件？",
    onOk: () => {
      removeComponent(type, keys, actIndex);
      deleteCheckedKeys(checked, info)
    },
  });
}

// 表单提交失败回调
const onFinishFailed = (errorInfo: any) => {
  console.log('Failed:', errorInfo);
};

/**
 * 设置已激活模板信息存入sessionStorage
 * @param _tempId 模板id
 * @param _contentId 内容id
 * @param _activatedComponents 已激活组件
 * @param _oldContent 旧内容
 * @param _checkedKeys 选中的keys
 */
const setWorkbenchData = (_tempId: string, _contentId: number, _activatedComponents: ComponentItem[], _oldContent: string, _checkedKeys?: Parameters<Exclude<TreeProps["onCheck"], undefined>>[0]) => {
  const _workbenchData = {
    contentId: _contentId,
    activatedComponents: _activatedComponents,
    oldContent: _oldContent,
    checkedKeys: _checkedKeys,
  };

  const workbenchData =
    JSON.parse(window.sessionStorage.getItem("activatedComponents") || "{}") || {};

  if (_tempId) workbenchData[_tempId] = _workbenchData;
  else workbenchData["tmp"] = _workbenchData;

  window.sessionStorage.setItem(
    "activatedComponents",
    JSON.stringify(workbenchData)
  );
}

// ======================
// 顶层变量赋值相关操作
// 注意：以下函数会直接修改外部变量，而不是返回新的数组。
// ======================

/** 
 * 从路由获取tempId和terminalType。
 * 注意：此函数会直接修改这两个外部变量，而不是返回新的数组。
 */
const catchRouterData = () => {
  tempId.value = String(route.query.tempIdQuery || "tmp");
  terminalType.value = Number(route.query.terminalTypeQuery || 0);
  // console.log(tempId.value, terminalType.value);
}
/** end */


// 生命周期
onMounted(async () => {
  // 初始化
  loading.value = true;

  try {
    // 获取组件数据
    await fetchComponentData();

    // 设置树列表
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

    // 展开树列表
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
  z-index: 999;
  background: #fff;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px 24px;

  form {
    justify-content: flex-end
  }

}
</style>
