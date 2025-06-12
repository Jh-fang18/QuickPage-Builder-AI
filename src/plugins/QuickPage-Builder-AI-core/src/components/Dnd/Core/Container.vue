<template>
  <div class="container pc" :style="{
    width: (props.gridScale + props.gridPadding) * props.gridColumn - 20 + 'px',
    gridTemplateColumns: getGridTemplateColumns,
    gridTemplateRows: getGridTemplateRows,
    gridTemplateAreas: getGridTemplateAreas,
  }">
    <div v-for="(item, index) of activatedComponents" :key="index" class="block animated"
      :style="{ top: item.positionY, left: item.positionX, gridArea: item.ccs }"
      @mousedown="mousedown($event, item, index)" :ref="el => { if (el) blockRefs['block' + index] = el }">
      <div class="title">
        <a href="javascript:void(0)" v-if="!item.editTitle" @click="item.editTitle = true">{{ item.title }}</a>
        <div class="form" v-if="item.editTitle">
          <a-input v-model="item.title" :placeholder="item.title" />
          <a href="javascript:void(0)" @click="item.editTitle = false" size="small">
            <close-circle-outlined />
          </a>
          <a href="javascript:void(0)" @click="saveTitle(item)" type="primary" size="small">
            <check-circle-outlined />
          </a>
        </div>
      </div>
      <div class="delete">
        <a href="javascript:void(0)" @click="showConfirm('component', item.treeKey.split('-'), index)">
          {{
            $t(`${langPrefix}.delete`)
          }}
        </a>
      </div>
      <div class="morph">
        <span class="up" @mousedown="moveTop($event, index)">上</span>
        <span class="right" @mousedown="moveRight($event, index)">右</span>
        <span class="down" @mousedown="moveDown($event, index)">下</span>
        <span class="left" @mousedown="moveLeft($event, index)">左</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// ======================
// 注意事项
// ======================
// grid长宽定义起始点为开始点，结束点为最后一格的下一个故需要+1


// 导入已有微件
import { ref, computed } from 'vue'
import { CloseCircleOutlined, CheckCircleOutlined } from '@ant-design/icons-vue';

const langPrefix = "management";

// 导入类型
import type {
  ComponentItem,
} from '../../../types/dnd'

// ======================
// 定义props
// ======================

const props = defineProps({
  activatedComponents: {
    type: Array as () => ComponentItem[],
    default: () => [],
  }, // 激活微件列表
  gridColumn: {
    type: Number,
    default: 24,
  }, // 网格宽度
  gridRow: {
    type: Number,
    default: 36,
  }, // 网格长度
  gridScale: {
    type: Number,
    default: 30,
  }, // 最小单位宽度
  gridPadding: {
    type: Number,
    default: 20,
  }, // 网格间距
});

// ======================
// 响应式状态
// ======================

const columnDifferences = ref(0);
const columnDeviationValue = ref(0);
const topMax = ref(0);
const rightMax = ref(0);
const downMax = ref(0);
const leftMax = ref(0);
const rowDifferences = ref(0);
const rowDeviationValue = ref(0);
const terminalType = ref(0);
const blockRefs = ref<Record<string, any>>({});


// ======================
// 计算属性
// ======================

// 计算网格列数
const getGridTemplateColumns = computed(() => {
  return Array(props.gridColumn).fill(`${props.gridScale}px`).join(' ');
});

// 计算网格行数
const getGridTemplateRows = computed(() => {
  return Array(props.gridRow).fill(`${props.gridScale}px`).join(' ');
});

// 计算网格区域
const getGridTemplateAreas = computed(() => {
  return Array.from({ length: props.gridRow }, (_, i) =>
    `'${Array.from({ length: props.gridColumn }, (_, j) => `g${i + 1}x${j + 1}`).join(' ')}'`
  ).join(' ');
});


/* ====================== 核心方法 ====================== */

// 保存标题
const saveTitle = (component: ComponentItem) => {
  if (!component) return;
  console.log(component);
  // component.editTitle = false;
  // let { title } = component;
  // component["selfServiceData"]["itemName"] = title;
  // this.updateSelfServiceItem(component["selfServiceData"]).then(() => {
  //   this.save();
  //   Promise.all([
  //     this.getSelfServiceItemList(0, terminalType.value),
  //     this.getSelfServiceItemList(1, terminalType.value),
  //   ]).then((res) => {
  //     if (!res) return;

  //     (res || []).map((item, index) => {
  //       let { dataList } = item;

  //       (dataList || []).map((jtem, jndex) => {
  //         this.components[index][jndex]["title"] = jtem.itemName;
  //       });
  //     });

  //     this.components = [this.components[0], this.components[1]];

  //     //console.log(this.components);
  //     //console.log(this.MicroCardsList);

  //     //获取树列表
  //     this.treeData = [
  //       {
  //         title: "其他类",
  //         key: "0-0",
  //         disabled: true,
  //         children: this.MicroCardsList,
  //       },
  //       {
  //         title: "容器类",
  //         key: "0-1",
  //         disabled: true,
  //         children: this.ContainersList,
  //       },
  //     ];
  //   });
  // });
}

// ======================
// 工具函数
// ======================

/**
 * 根据已激活模块的数组顺序，更新rowIndex
 */
const updateRowIndex = () => {
  props.activatedComponents.map((item, index) => {
    item.rowIndex = index;
  });
}

/** 
 * 当前元素位置信息转换成Number数组
 * @param ccs 元素位置String类型，如：1/1/3/3
 * @returns 元素位置Number数组
 */
const getComponentCcs = (ccs: string) => {
  return ccs.split("/").map((item) => Number(item));
}

/**
 * 根据元素获取当前行宽度，并返回Boolean，表示添加该元素后是否需要折行
 * @param currentComponent 当前元素
 * @returns Boolean 是否需要折行
 */
const getRowWidth = (currentComponent: ComponentItem): boolean => {
  let _rowWidth = 0; // 当前行宽度

  // 根据输入元素获取当前行宽度
  for (let i = currentComponent.rowIndex; i > 0; i--) {
    const _ccs = getComponentCcs(props.activatedComponents[i].ccs) // 当前元素位置
    const _pCcs =
      i !== 0
        ? getComponentCcs(props.activatedComponents[i - 1].ccs)
        : [0, 0, 0, 0]; // 上一个元素位置

    _rowWidth += props.activatedComponents[i].width
    if (_ccs[0] !== _pCcs[0]) break;
  }


  if (_rowWidth > props.gridColumn)
    return true;
  else
    return false;
}

/** 
 * 根据当前元素获取上一行第一个元素
 * @param currentComponent 当前元素
 * @returns 上一行第一个元素
*/
const getPrevRowFirstComponent = (currentComponent: ComponentItem): ComponentItem => {
  // 上一行元素
  let _prevRowComponent: ComponentItem = props.activatedComponents[currentComponent.rowIndex];

  // 上一行第一个元素
  let _prevRowFirstComponent: ComponentItem = props.activatedComponents[currentComponent.rowIndex];

  console.log("被查询元素", currentComponent);

  // 若行宽已超过最大宽度，则最后一个元素判断为折行，故上一行元素即为最后一个元素前一个元素
  if (getRowWidth(currentComponent)) {
    _prevRowComponent = props.activatedComponents[currentComponent.rowIndex - 1];
  } else {
    for (let i = currentComponent.rowIndex; i > 0; i--) {
      const _ccs = getComponentCcs(props.activatedComponents[i].ccs) // 当前元素位置
      const _pCcs =
        i !== 0
          ? getComponentCcs(props.activatedComponents[i - 1].ccs)
          : [0, 0, 0, 0]; // 上一个元素位置

      if (_ccs[0] !== _pCcs[0]) {
        _prevRowComponent = props.activatedComponents[i - 1];
        break
      }
    }
  }

  console.log("上一行元素", _prevRowComponent);

  for (let i = _prevRowComponent.rowIndex; i > 0; i--) {
    const _ccs = getComponentCcs(props.activatedComponents[i].ccs) // 当前元素位置
    const _pCcs =
      i !== 0
        ? getComponentCcs(props.activatedComponents[i - 1].ccs)  // 上一个元素位置
        : [0, 0, 0, 0];
    if (_ccs[0] !== _pCcs[0]) {
      _prevRowFirstComponent = props.activatedComponents[i];
      break
    }
  }

  console.log("上一行第一元素", _prevRowFirstComponent);

  return _prevRowFirstComponent;
}

/** 
 * 获取当前元素所在行元素最大长度
 * @param currentComponent 当前元素
 * @returns 当前行内元素最大长度
 */
const getRowMaxHeight = (currentComponent: ComponentItem): number[] => {
  const _currentComponentCcs = getComponentCcs(currentComponent.ccs); // 当前元素位置
  let _rowCcs = [0, 0, 0, 0]; // 本一行元素最大长度， 初始值
  let _fristRowIndex = currentComponent.rowIndex; // 当前元素rowIndex

  // 获取当前元素所在行的第一个元素的rowIndex
  // 若当前元素为第一行第一个元素，则无需执行此操作
  if (_currentComponentCcs[1] !== 1) {
    for (let i = currentComponent.rowIndex; i > 0; i--) {
      const _ccs = getComponentCcs(props.activatedComponents[i].ccs) // 当前元素位置
      const _pCcs =
        i !== 0
          ? getComponentCcs(props.activatedComponents[i - 1].ccs)
          : [0, 0, 0, 0]; // 上一个元素位置

      if (_ccs[0] !== _pCcs[0]) {
        _fristRowIndex = i;
        break;
      }
    }

    console.log("输入元素rowIndex", currentComponent.rowIndex);
  }

  console.log("输入元素所在行的第一个元素的rowIndex", _fristRowIndex);

  if (getComponentCcs(props.activatedComponents[_fristRowIndex].ccs)[1] !== 1) {

  }

  // 获取元素所在行最大长度
  // 拖动大小时，行内最后元素可能已成下行元素，故需排除
  for (let i = _fristRowIndex; i < props.activatedComponents.length - 1; i++) {
    const _ccs = getComponentCcs(props.activatedComponents[i].ccs) // 当前元素位置
    const _pCcs =
      i !== 0
        ? getComponentCcs(props.activatedComponents[i + 1].ccs)
        : [0, 0, 0, 0]; // 下一个元素位置

    // 折行元素不参与比较
    if (_rowCcs[2] < _ccs[2] && !getRowWidth(props.activatedComponents[i])) {
      _rowCcs = _ccs
    };

    if (_ccs[0] !== _pCcs[0]) break
  }

  return _rowCcs;
}

/** end **/

/**
 * 校准插入点后元素占位,不包括点击元素本身
 * ccs格式：1/1/3/3 表示起始行/起始列/结束行/结束列 实际宽度为结束列-起始列 故需+1
 * 元素长宽和grid长宽格式一致 无需加+1
 * @param lastComponents 平移元素，且其前必有下移元素
 * @param extraComponents 下移元素，包括拖动大小时已在下行元素，且其第一个元素一定在行头
 */
const judgeLocation = (lastComponents: ComponentItem[], transDistance: number, extraComponents: ComponentItem[]) => {
  // 复制对象，防止引用类型数据的修改导致原数据的变化
  let _lastComponents: ComponentItem[] = JSON.parse(JSON.stringify(lastComponents));
  let _extraComponents: ComponentItem[] = JSON.parse(JSON.stringify(extraComponents));
  let _transDistance = transDistance;

  //console.log("_lastComponents", _lastComponents);
  //console.log("_extraComponents", _extraComponents);

  // 按activatedComponents内索引更新rowIndex，效率有待提升
  updateRowIndex();

  // 判断是否有元素平移
  console.log("---------last----------");
  if (_lastComponents.length > 0) {
    // 起始行
    let _rowStart: number = 0;
    // 起始列
    let _columnStart: number = 0;

    _lastComponents.map((item) => {
      const _componentCcs = getComponentCcs(props.activatedComponents[item.rowIndex].ccs)
      _rowStart = _componentCcs[0]
      // 起始列等于未平移距离加上该元素起始列
      _columnStart = _componentCcs[1] + _transDistance;

      // 平移元素
      props.activatedComponents[item.rowIndex].ccs =
        _rowStart +
        "/" +
        _columnStart +
        "/" +
        (_rowStart + item.height) +
        "/" +
        (_columnStart + item.width);
    });

    // 平移完成故清空，避免重复平移，递归调用
    _lastComponents = [];
  }

  // 判断是否有元素下移
  console.log("---------extra----------");
  if (_extraComponents.length > 0) {
    // 获取需下移元素中的第一个元素，此时元素还未折行，数据仍是原数据
    const _fristComponent = _extraComponents[0];
    let _fristCcs = getComponentCcs(_fristComponent.ccs);

    // 第一元素列起点为1，无需下移，后续也不用处理，直接返回
    if (_fristCcs[1] === 1) return

    // 获取对应第一元素的上一个元素
    const _prevComponent = props.activatedComponents[
      _fristComponent.rowIndex - 1
    ];
    const _prevCcs = getComponentCcs(_prevComponent.ccs);

    // 若第一个元素已超出Grid高度则直接删除, 并返回
    if (_prevCcs[2] + _fristComponent.height > props.gridRow + 1) {
      props.activatedComponents.splice(
        _fristComponent.rowIndex,
        _extraComponents.length
      );
      return;
    }

    // 获取上一行最大长度的元素，判断该元素后是否有空间折行，为折行后的起始点，需通过上一行元素计算
    // 注意：上一行元素可能包括已折行元素，因为位置还未改变，但已成为折行元素，故需要从上一行元素中清除
    const _prevRowBestCcs = getRowMaxHeight(getPrevRowFirstComponent(_fristComponent));

    let _rowStart = _prevRowBestCcs[2];
    let _columnStart = 1;
    console.log('最大长度', _prevRowBestCcs);
    console.log('第一元素', _fristCcs);

    // 判断折行后的列起始位置
    // 若第一元素行起始点小于最大长度元素的行结束点，则折行元素列起始点为最大长度元素的列结束点
    // 否则为第一元素起始点为1
    // 注意_fristComponent的位置信息还未更新
    // if (
    //   _prevRowBestCcs[2] > _fristCcs[0]) {
    //   _rowStart = _fristCcs[0]
    //   _columnStart = _prevRowBestCcs[3];
    // }

    // 设置第一个元素位置
    props.activatedComponents[_fristComponent.rowIndex].ccs =
      _rowStart +
      "/" +
      _columnStart +
      "/" +
      (_rowStart + _fristComponent.height) +
      "/" +
      (_fristComponent.width + 1 < props.gridColumn + 1
        ? _columnStart + _fristComponent.width
        : props.gridColumn + 1);

    // 位置已变，第一元素数据已更新
    _fristCcs = getComponentCcs(props.activatedComponents[_fristComponent.rowIndex].ccs);

    // 位置已移动，故从原需下移列表中清除
    _extraComponents.splice(0, 1);

    // 判断是否还有需平移和下移元素
    if (_extraComponents.length === 0) return;

    // 行累计宽度, 默认为第一个元素宽度
    let _lastWidth = _fristCcs[3];
    console.log("_extraComponents", _extraComponents);
    // 设置之后的元素位置为平移元素，超过Grid宽度则仍为下一行元素
    _extraComponents = _extraComponents.filter((item) => {
      if (item.width + _lastWidth <= props.gridColumn) {
        _lastComponents.push(item);
      }

      _lastWidth += item.width;

      return _lastWidth > props.gridColumn;
    });

    judgeLocation(_lastComponents, _transDistance, _extraComponents);
  }
  console.log("---------end----------");
  // console.log('_lastComponents', _lastComponents);
  // console.log('_extraComponents', _extraComponents);
}

/** 
 * 微件聚焦
 * @param key 微件的key值
 */
const focusComponent = (key: string) => {
  props.activatedComponents.map((item, index) => {
    if (item.key === key) {
      blockRefs.value["block" + index].style.borderColor = " red";
      blockRefs.value["block" + index].style.zIndex = 999;
    } else {
      blockRefs.value["block" + index].style.borderColor = " #979797";
      blockRefs.value["block" + index].style.zIndex = 0;
    }
  });
}

/** 
 * 微件排序
 */
const sortComponent = () => {
  props.activatedComponents.sort((x, y) => {
    let _xCcs = x.ccs.split("/").map((item) => Number(item));
    let _yCcs = y.ccs.split("/").map((item) => Number(item));

    if (_xCcs[0] < _yCcs[0]) {
      return -1;
    } else if (_xCcs[0] > _yCcs[0]) {
      return 1;
    } else {
      if (_xCcs[1] < _yCcs[1]) return -1;
      else return 1;
    }
  });
}

/** 
 * 微件向上扩大
 * @param e 鼠标事件
 * @param index 微件索引
 */
const moveTop = (e: MouseEvent, index: number) => {
  const oBlock = blockRefs.value["block" + index]; // 获取当前点击微件
  let disY = e.clientY - 0; // 获取鼠标点击的位置
  let oTop: string | number = 0; // 初始化oTop，用于存储微件的top值

  oBlock.style.borderColor = " red"; // 设置边框颜色为红色
  oBlock.style.zIndex = 999; // 设置z-index为999

  // 控制微件高度
  document.onmousemove = (e) => {
    if (oTop === "$") return // 停止移动
    else oTop = Number(oTop);

    const gridUnit = props.gridScale + props.gridPadding; // 计算每个格子的宽度
    const minHeight = props.activatedComponents[index].minHeight * gridUnit - props.gridPadding; // 计算最小高度

    let top: string | number = e.clientY - disY;

    if (oTop < top) {
      const newHeight = oBlock.offsetHeight + (top - oTop);
      if (newHeight >= minHeight) {
        oBlock.style.height = `${newHeight}px`;
        oBlock.style.top = `${top}px`;
      } else {
        oBlock.style.height = `${minHeight}px`;
        top = "$"; // 标记停止移动
      }
    } else {
      oBlock.style.height = `${oBlock.offsetHeight - (top - oTop)}px`;
      oBlock.style.top = `${top}px`;
    }

    oTop = top;
  };

  // 松开后对微件后的元素进行处理
  document.onmouseup = () => {
    //需加上一个gridPadding才是计算高度
    let _height = Math.ceil(
      (oBlock.offsetHeight + props.gridPadding) /
      (props.gridScale + props.gridPadding)
    ),
      _top = Math.ceil(
        oBlock.offsetTop / (props.gridScale + props.gridPadding)
      );

    // 停止移动，将top值加1，防止出现0高度的情况
    if (oTop === "$") _top = _top + 1; else if (_top <= 0) _top = 1;

    let _gridArea = getComponentCcs(oBlock.style.gridArea)

    _gridArea[2] = _gridArea[0] + _height;
    // console.log(_gridArea);

    // 浏览器补丁
    oBlock.style.height = "100%"; // 必须设回百分比，不然grid-area无法起效
    oBlock.style.top = "0"; // 必须设为0，不然无法恢复正确位置

    // 更新元素状态
    props.activatedComponents[index].ccs = _gridArea.join("/"); // 更新元素大小
    props.activatedComponents[index].height = _gridArea[2] - _gridArea[0]; // 更新元素高度

    //======== 处理当前元素后的元素 ========//

    const _componentCcs = getComponentCcs(props.activatedComponents[index].ccs);
    let _extraComponents = [];

    for (let i = index + 1; i < props.activatedComponents.length; i++) {
      let _ccs = getComponentCcs(props.activatedComponents[i].ccs);
      if (_componentCcs[0] !== _ccs[0]) {
        _extraComponents.push({
          ...props.activatedComponents[i],
        });
        // console.log("_extraComponents", props.activatedComponents[i]);
      }
    }

    // 校准元素位置
    judgeLocation([], 0, _extraComponents);

    //清空事件
    document.onmousemove = null;
    document.onmousedown = null;
    document.onmouseup = null;
  };
}

// 微件向右移动
const moveRight = (e: MouseEvent, index: number) => {
  const oBlock = blockRefs.value["block" + index]; //获取当前点击微件
  const oCcs = getComponentCcs(props.activatedComponents[index].ccs); //获取当前点击微件的ccs
  let _transDistance = 0; // 元素扩大距离
  let disX = e.clientX - 0;
  let oLeft: string | number = 0;

  oBlock.style.borderColor = " red";
  oBlock.style.zIndex = 999;

  // 控制微件宽度
  document.onmousemove = (e) => {
    if (oLeft === "$") return
    else oLeft = Number(oLeft);

    let left: string | number = e.clientX - disX;

    const _cWidth = oBlock.offsetWidth + (left - oLeft);

    if (oLeft < left) {
      oBlock.style.width = _cWidth + "px";
    } else {
      let _rminWidth =
        props.activatedComponents[index].minWidth *
        (props.gridScale + props.gridPadding) -
        props.gridPadding;
      if (_cWidth <= _rminWidth) {
        oBlock.style.width = _rminWidth + "px";
      } else if (_cWidth >= props.gridColumn * (props.gridScale + props.gridPadding)
        - props.gridPadding) {
        // 元素宽度超过最大宽度
        oBlock.style.width = props.gridColumn * (props.gridScale + props.gridPadding)
          - props.gridPadding + "px";
      } else {
        oBlock.style.width = _cWidth + "px";
      }
    }

    oLeft = left;
  };

  // 松开后对微件后的元素进行处理
  document.onmouseup = () => {
    const _width = Math.ceil(
      oBlock.offsetWidth / (props.gridScale + props.gridPadding)
    );
    const _gridArea = getComponentCcs(oBlock.style.gridArea);

    // 超过边界，固定为最大宽度
    _gridArea[3] =
      _gridArea[1] + _width < props.gridColumn + 1
        ? _gridArea[1] + _width
        : props.gridColumn + 1;

    // 浏览器补丁
    oBlock.style.width = "100%"; //必须设回百分比，不然grid-area无法起效

    // 更新元素状态
    props.activatedComponents[index].ccs = _gridArea.join("/");
    props.activatedComponents[index].width = _gridArea[3] - _gridArea[1];

    //======== 处理当前元素后的元素 ========//

    const _componentCcs =
      getComponentCcs(props.activatedComponents[index].ccs) // 当前元素的ccs，已经被变形
    let _lastComponents = []; // 需要平移的元素
    let _extraComponents = []; // 需下移的元素
    let _lastWidth = _componentCcs[3] - 1; // ccs格式为1/1/3/3 故需-1
    let _currentIndex = index;
    //需要减去变型元素前离开画布边缘的距离
    _transDistance = _gridArea[3] - (oCcs[3] - oCcs[1]) - 1 - (_gridArea[1] - 1);

    for (let i = _currentIndex + 1; i < props.activatedComponents.length; i++) {
      // 当前元素后的ccs
      let _ccs = getComponentCcs(props.activatedComponents[i].ccs);
      let _prevCcs = getComponentCcs(props.activatedComponents[i - 1].ccs)
      console.log('当前元素', _ccs);
      console.log('上一个元素', _prevCcs);
      // 若当前元素行起点小于拖动元素行终点，则为同一行元素
      if (_componentCcs[2] > _ccs[0]) {
        if (_ccs[0] < _prevCcs[2]) { // 当前元素行起点小于上一个元素行终点
          if (_componentCcs[1] !== _prevCcs[1] && _prevCcs[3] === _ccs[1]) // 上一个元素列终点等于当前元素列起点
            _lastWidth += props.activatedComponents[i].width;
          // 上一个元素为被拖动元素时，需要减去拖动距离
          else if (_componentCcs[1] === _prevCcs[1] && _prevCcs[3] - _transDistance === _ccs[1])
            _lastWidth += props.activatedComponents[i].width;
          else if (_prevCcs[3] > _ccs[1]) { // 上一个元素列终点大于当前元素列起点
            if (_componentCcs[1] !== _prevCcs[1] && _prevCcs[3] < _ccs[3]) // 上一个元素列终点大于当前元素列终点
              _lastWidth += _ccs[3] - _prevCcs[3]; // 累计宽度等于当前元素列终点减去上一个元素列终点
            if (_componentCcs[1] === _prevCcs[1] && _prevCcs[3] < _ccs[3])
              _lastWidth += props.activatedComponents[i].width
          }
          console.log('_lastWidth', _lastWidth);
        } else { // 当前元素行起点大于上一个元素行终点
          _lastWidth = _componentCcs[3] - 1; // 折行，重置累计宽度

          if (_componentCcs[3] - _transDistance === _ccs[1])
            _lastWidth += props.activatedComponents[i].width;
          console.log('_extraWidth', _lastWidth);
        }

        console.log('_transDistance', _transDistance);

        // 累计宽度大于当前元素起点，需要平移
        if (_lastWidth + 1 > _ccs[1] &&
          _lastWidth <= props.gridColumn) {
          _lastComponents.push({
            ...props.activatedComponents[i]
          });
          console.log('_lastComponents', props.activatedComponents[i]);
        }
      }
      // 下一行元素，添加到extraComponents
      else {
        _extraComponents.push({
          ...props.activatedComponents[i]
        });
        console.log('_extraComponents', props.activatedComponents[i]);
      }
    }


    if (_lastComponents.length > 0) {
      // 需使用未变型前的行头元素ccs
      let stance = getComponentCcs(_lastComponents[0].ccs)[1] - oCcs[3];

      for (let i = 1; i < _lastComponents.length; i++) {
        const _ccs = getComponentCcs(_lastComponents[i].ccs);
        let _stance = _ccs[1] - oCcs[3]
        if (_stance < stance) {
          stance = _stance;
        };
      }

      _transDistance -= stance;
      console.log("stance", stance);
    }


    // 校准元素位置
    if (_lastComponents.length > 0 || _extraComponents.length > 0)
      judgeLocation(_lastComponents, _transDistance, _extraComponents);

    // 清空事件
    document.onmousemove = null;
    document.onmousedown = null;
    document.onmouseup = null;
  };
}

// 微件向下移动
const moveDown = (e: MouseEvent, index: number) => {
  const oBlock = blockRefs.value["block" + index]; //获取当前点击微件
  let disY = e.clientY - 0;
  let oTop = 0;

  oBlock.style.borderColor = " red";
  oBlock.style.zIndex = 999;

  document.onmousemove = (e) => {
    let top = e.clientY - disY;
    if (oTop < top) {
      oBlock.style.height = oBlock.offsetHeight - (oTop - top) + "px";
    } else {
      let _rminHeight =
        props.activatedComponents[index].minHeight *
        (props.gridScale + props.gridPadding) -
        props.gridPadding;
      let _cHeight = oBlock.offsetHeight + (top - oTop);
      oBlock.style.height =
        _cHeight < _rminHeight ? _rminHeight : _cHeight + "px";
    }

    oTop = top;
  };
  document.onmouseup = () => {
    let _height = Math.ceil(
      oBlock.offsetHeight / (props.gridScale + props.gridPadding)
    );
    let _gridArea = oBlock.style.gridArea
      .split("/")
      .map((item) => Number(item));
    _gridArea[2] =
      _gridArea[0] + _height < props.gridRow + 1
        ? _gridArea[0] + _height
        : props.gridRow + 1;
    oBlock.style.gridArea = _gridArea.join("/");
    oBlock.style.height = "100%"; //必须设回百分比，不然grid-area无法奇效
    props.activatedComponents[index].ccs = oBlock.style.gridArea;
    props.activatedComponents[index].height = _height;

    let _componentCcs = props.activatedComponents[index].ccs
      .split("/")
      .map((item) => Number(item));
    let _extraComponents = [];
    let _rowCcs = [0, 0, 0, 0];

    //获取当前行元素最大长度(向下)
    for (let i = index + 1; i < props.activatedComponents.length; i++) {
      let _ccs = props.activatedComponents[i].ccs
        .split("/")
        .map((item) => Number(item));
      if (_componentCcs[0] === _ccs[0] && _componentCcs[2] < _ccs[2]) {
        _rowCcs = _ccs;
      } else break;
    }
    //获取当前行元素最大长度(向上)
    for (let i = index - 1; i >= 0; i--) {
      let _ccs = props.activatedComponents[i].ccs
        .split("/")
        .map((item) => Number(item));
      if (_componentCcs[0] === _ccs[0] && _componentCcs[2] < _ccs[2]) {
        _rowCcs = _ccs;
      } else break;
    }

    if (_rowCcs[2] === 0) _rowCcs = _componentCcs;

    for (let i = index; i < props.activatedComponents.length; i++) {
      let _ccs = props.activatedComponents[i].ccs
        .split("/")
        .map((item) => Number(item));
      let _prevCcs =
        i !== 0
          ? props.activatedComponents[i - 1].ccs
            .split("/")
            .map((item) => Number(item))
          : [0, 0, 0, 0];

      //console.log('_ccs', props.activatedComponents[i]);

      if (_componentCcs[0] !== _ccs[0]) {
        if (
          _componentCcs[2] === _rowCcs[2] &&
          _componentCcs[3] > _ccs[1] &&
          _componentCcs[1] < _ccs[3]
        ) {
          //在拖动项下方的元素都算折行
          console.log(1, props.activatedComponents[i]);
          _extraComponents.push({
            ...props.activatedComponents[i],
            rowIndex: i,
          });
        } else if (
          _ccs[0] !== _prevCcs[0] &&
          _ccs[3] > _rowCcs[3] &&
          _prevCcs[3] + props.activatedComponents[i].width >
          props.gridColumn + 1
        ) {
          //宽度大于拖动元素起始点才算折行项
          console.log(2, props.activatedComponents[i]);
          _extraComponents.push({
            ...props.activatedComponents[i],
            rowIndex: i,
          });
        } else if (_ccs[0] !== _prevCcs[0] && _prevCcs[0] !== _rowCcs[0]) {
          //第三行开始无条件进入折行数组
          _extraComponents.push({
            ...props.activatedComponents[i],
            rowIndex: i,
          });
        }
        //console.log('_extraComponents', props.activatedComponents[i]);
      }
    }

    focusComponent(props.activatedComponents[index].key);
    judgeLocation([], 0, _extraComponents);

    //清空事件
    document.onmousemove = null;
    document.onmousedown = null;
    document.onmouseup = null;
  };
}

// 微件向左移动
const moveLeft = (e, index) => {
  let oBlock = blockRefs.value["block" + index]; //获取当前点击微件
  //let gDiv = oBlock.parentElement; //获取点击元素的父级元素
  let disX = e.clientX - 0;
  let oLeft = 0;

  oBlock.style.borderColor = "red";
  oBlock.style.zIndex = 999;

  document.onmousemove = (e) => {
    if (oLeft === "$") return;
    let left = e.clientX - disX;
    if (oLeft < left) {
      //减去一个gridPadding才是微件的大小
      let _rminWidth =
        props.activatedComponents[index].minWidth *
        (props.gridScale + props.gridPadding) -
        props.gridPadding;
      let _cWidth = oBlock.offsetWidth + (oLeft - left);
      if (_cWidth >= _rminWidth) {
        oBlock.style.width = _cWidth + "px";
        oBlock.style.left = left + "px";
      } else {
        oBlock.style.width = _rminWidth + "px";
        left = "$";
      }
    } else {
      oBlock.style.width = oBlock.offsetWidth - (left - oLeft) + "px";
      oBlock.style.left = left + "px";
    }

    oLeft = left;
  };
  document.onmouseup = () => {
    //需加上一个gridPadding才是计算宽度
    let _width = Math.ceil(
      (oBlock.offsetWidth + props.gridPadding) /
      (props.gridScale + props.gridPadding)
    ),
      _left = Math.ceil(
        oBlock.offsetLeft / (props.gridScale + props.gridPadding)
      );
    if (oLeft === "$") {
      _left = _left + 1;
    } else {
      //超过边界，固定为1
      if (_left <= 0) _left = 1;
      //_left = 0;
    }

    let _gridArea = oBlock.style.gridArea
      .split("/")
      .map((item) => Number(item));
    let _prevCcs =
      index - 1 >= 0
        ? props.activatedComponents[index - 1].ccs
          .split("/")
          .map((item) => Number(item))
        : [_gridArea[0], _gridArea[1], 1, 1];

    //判断是否换行
    if (
      _prevCcs[0] === _gridArea[0] &&
      _prevCcs[3] + _width <= props.gridColumn + 1
    ) {
      if (_prevCcs[3] === _gridArea[1]) _gridArea[1] = _prevCcs[3];
      else _gridArea[1] = _left;
      _gridArea[3] = _gridArea[1] + _width;
    } else {
      _gridArea[0] = _prevCcs[2];
      _gridArea[1] = _left;
      _gridArea[2] = _prevCcs[2] + props.activatedComponents[index].height;
      _gridArea[3] =
        _left + _width < props.gridColumn + 1
          ? _left + _width
          : props.gridColumn + 1;
    }

    console.log(_gridArea);

    oBlock.style.gridArea = _gridArea.join("/");
    oBlock.style.width = "100%"; //必须设回百分比，不然grid-area无法奇效
    oBlock.style.left = "0"; //必须设为0，不然无法恢复正确位置
    props.activatedComponents[index].ccs = oBlock.style.gridArea;
    props.activatedComponents[index].width = _gridArea[3] - _gridArea[1];

    let _componentCcs = props.activatedComponents[index].ccs
      .split("/")
      .map((item) => Number(item));
    let _lastComponents = [];
    let _extraComponents = [];
    let _lastWidth = 0;

    for (let i = index + 1; i < props.activatedComponents.length; i++) {
      let _ccs = props.activatedComponents[i].ccs
        .split("/")
        .map((item) => Number(item));

      if (
        _componentCcs[0] === _ccs[0] &&
        _componentCcs[3] + props.activatedComponents[i].width + _lastWidth <=
        props.gridColumn + 1
      ) {
        _lastComponents.push({
          ...props.activatedComponents[i],
          rowIndex: i,
        });
        //console.log('_lastComponents', props.activatedComponents[i]);
      } else {
        _extraComponents.push({
          ...props.activatedComponents[i],
          rowIndex: i,
        });
        //console.log('_extraComponents', props.activatedComponents[i]);
      }

      _lastWidth = props.activatedComponents[i].width + _lastWidth;
    }

    focusComponent(props.activatedComponents[index].key);
    judgeLocation(_lastComponents, 0, _extraComponents);

    //清空事件
    document.onmousemove = null;
    document.onmousedown = null;
    document.onmouseup = null;
  };
}

// 获取微件位置
const getPosition = (e, gDiv) => {
  let _positions = "";
  let _y = e.clientY - gDiv.offsetTop - rowDeviationValue.value;
  let _x = e.clientX - gDiv.offsetLeft - columnDeviationValue.value;

  //设置边界值
  if (topMax.value && e.clientY - gDiv.offsetTop <= topMax.value)
    _y = topMax.value;
  if (rightMax.value && e.clientX - gDiv.offsetLeft >= rightMax.value)
    _x = rightMax.value - columnDeviationValue.value;
  if (downMax.value && e.clientY - gDiv.offsetTop >= downMax.value)
    _y = downMax.value - rowDeviationValue.value;
  if (leftMax.value && e.clientX - gDiv.offsetLeft <= leftMax.value)
    _x = leftMax.value;

  // console.log(_y);
  // console.log(_x);
  // console.log(e.clientX);
  // console.log(gDiv.offsetLeft);
  // console.log('rowDeviationValue', rowDeviationValue.value);
  // console.log('_yy', e.clientY - gDiv.offsetTop);

  //找出当前点击格子, 出现未知值时固定为1

  for (let i = 0; i < props.gridRow; i++) {
    if (
      _y >= i * (props.gridScale + props.gridPadding) &&
      _y < (i + 1) * (props.gridScale + props.gridPadding)
    ) {
      for (let j = 0; j < props.gridColumn; j++) {
        if (
          _x >= j * (props.gridScale + props.gridPadding) &&
          _x < (j + 1) * (props.gridScale + props.gridPadding)
        ) {
          _positions =
            "g" +
            (i + 1 - rowDifferences.value > 0
              ? i + 1 - rowDifferences.value
              : 1) +
            "x" +
            (j + 1 - columnDifferences.value > 0
              ? j + 1 - columnDifferences.value
              : 1);
          break;
        }
      }
      break;
    }
  }

  // console.log('_positions', _positions);
  return _positions;
}

// 鼠标按下
const mousedown = (e, component, index) => {
  let oDiv = e.target; //获取点击的目标元素

  if (
    oDiv.className === "title" ||
    oDiv.className === "delete" ||
    oDiv.className === "form" ||
    oDiv.className === "morph" ||
    oDiv.parentElement.className === "title" ||
    oDiv.parentElement.className === "form" ||
    oDiv.parentElement.className === "delete" ||
    oDiv.parentElement.className === "morph"
  )
    return;

  let _component = component; //被点击元素相关属性
  let _componentCcs = _component.ccs.split("/").map((item) => Number(item));
  //console.log('component', _component);
  let _componentIndex = index; //在激活微件数组中索引
  //获取点击元素的父级元素，移动端直接抓取tabs
  //console.log(e.path);
  let gDiv =
    terminalType.value === "1"
      ? blockRefs.value.tabs
      : e.path
        ? e.path[1]
        : oDiv.parentElement;
  let disX = e.clientX - 0;
  let disY = e.clientY - 0;
  oDiv.style.borderColor = " red";
  oDiv.style.zIndex = 999;

  document.onmousedown = (e) => {
    //因每次点击位置不同，故初始化差值
    columnDifferences.value = 0;
    rowDifferences.value = 0;
    columnDeviationValue.value = 0;
    rowDeviationValue.value = 0;
    leftMax.value = 0;
    topMax.value = 0;
    downMax.value = 0;
    rightMax.value = 0;

    let _positions = getPosition(e, gDiv)
      .replace("g", "")
      .split("x")
      .map((item) => Number(item));
    //console.log('first', _positions);
    rowDifferences.value = _positions[0] - _componentCcs[0];
    //console.log('rowDifferences', rowDifferences.value);
    rowDeviationValue.value =
      e.clientY -
      gDiv.offsetTop -
      (_positions[0] - 1) * (props.gridScale + props.gridPadding);
    columnDifferences.value = _positions[1] - _componentCcs[1];
    //console.log('columnDifferences', columnDifferences.value);
    columnDeviationValue.value =
      e.clientX -
      gDiv.offsetLeft -
      (_positions[1] - 1) * (props.gridScale + props.gridPadding);
    //console.log('columnDeviationValue', columnDeviationValue.value);

    topMax.value =
      e.clientY -
      gDiv.offsetTop -
      (_componentCcs[0] - 1) * (props.gridScale + props.gridPadding);
    rightMax.value =
      e.clientX -
      gDiv.offsetLeft +
      (props.gridColumn + 1 - _componentCcs[3]) *
      (props.gridScale + props.gridPadding);
    downMax.value =
      e.clientY -
      gDiv.offsetTop +
      (props.gridRow + 1 - _componentCcs[2]) *
      (props.gridScale + props.gridPadding);
    //console.log('downMax', rightMax.value);
    leftMax.value =
      e.clientX -
      gDiv.offsetLeft -
      (_componentCcs[1] - 1) * (props.gridScale + props.gridPadding);
  };

  document.onmousemove = (e) => {
    let left = e.clientX - disX;
    let top = e.clientY - disY;
    let _axis = oDiv.style.gridArea.split("/").map((item) => Number(item));

    //上边界
    let _topBoundary =
      0 +
      _axis[0] * (props.gridScale + props.gridPadding) -
      (props.gridScale + props.gridPadding);
    if (top < -_topBoundary) top = -_topBoundary;

    //右边界
    let _rightBoundary =
      props.gridColumn * (props.gridScale + props.gridPadding) -
      (_axis[3] - 1) * (props.gridScale + props.gridPadding);
    if (left > _rightBoundary) left = _rightBoundary;

    //下边界
    let _bottomBoundary =
      props.gridRow * (props.gridScale + props.gridPadding) -
      (_axis[2] - 1) * (props.gridScale + props.gridPadding);
    if (top > _bottomBoundary) top = _bottomBoundary;

    //左边界
    let _leftBoundary =
      0 +
      _axis[1] * (props.gridScale + props.gridPadding) -
      (props.gridScale + props.gridPadding);
    if (left < -_leftBoundary) left = -_leftBoundary;

    oDiv.style.left = left + "px";
    oDiv.style.top = top + "px";
    component.positionX = left;
    component.positionY = top;
  };

  document.onmouseup = (e) => {
    let _positions = getPosition(e, gDiv);
    //console.log('second', _positions);
    //console.log(e.target);
    if (_positions && _positions.split("x")[1] != "NaN") {
      changeBlock(_positions, oDiv, _component);
      //console.log(_component);
      let _focusComponent = {};
      let _lastComponents = [];
      let _extraComponents = [];
      let _componentCcs = _component.ccs
        .split("/")
        .map((item) => Number(item));
      //console.log('componentCcs', _componentCcs);

      //替换位置逻辑，现已左上角顶点落点为判断条件
      props.activatedComponents.map((item, i) => {
        let _ccs = item.ccs.split("/").map((item) => Number(item));

        if (
          _component.key !== item.key &&
          _componentCcs[0] >= _ccs[0] &&
          _componentCcs[0] < _ccs[2] &&
          _componentCcs[1] >= _ccs[1] &&
          _componentCcs[1] < _ccs[3]
        ) {
          //console.log('get', index);
          let _ccs = item.ccs.split("/").map((item) => Number(item));
          if (
            Math.abs(_ccs[2] - _componentCcs[0]) /
            Math.min(...[item.height, _component.height]) >=
            0.7 &&
            Math.abs(_ccs[3] - _componentCcs[1]) /
            Math.min(...[item.width, _component.width]) >=
            0.7
          )
            _focusComponent = { ...item, rowIndex: i };
        }
      });

      //console.log('_focusComponent', _focusComponent);

      //定位
      if (Object.keys(_focusComponent).length > 0) {
        let _focusComponentCcs = _focusComponent.ccs
          .split("/")
          .map((item) => Number(item));
        //console.log('focusRowCcs', _focusComponentCcs);
        //定位拖动元素
        oDiv.style.gridArea =
          _focusComponentCcs[0] +
          "/" +
          _focusComponentCcs[1] +
          "/" +
          (_focusComponentCcs[0] + _component.height) +
          "/" +
          (_focusComponentCcs[1] + _component.width);

        _component.ccs = oDiv.style.gridArea;

        //console.log('focus', _focusComponent);

        props.activatedComponents.splice(
          _focusComponent.rowIndex,
          0,
          _component
        );
        props.activatedComponents.splice(
          _componentIndex > _focusComponent.rowIndex
            ? _componentIndex + 1
            : _componentIndex,
          1
        );

        oDiv = blockRefs.value["block" + _focusComponent.rowIndex][0];

        //获取插入元素新的位置信息
        _componentCcs = _component.ccs
          .split("/")
          .map((item) => Number(item));
        //console.log('_componentCcs', _componentCcs);

        //行累计宽度
        let _lastWidth = 0;
        //获取插入后同行元素和不同行元素
        for (
          let i =
            (_componentIndex > _focusComponent.rowIndex
              ? _focusComponent.rowIndex
              : _focusComponent.rowIndex - 1) + 1;
          i < props.activatedComponents.length;
          i++
        ) {
          let _lastCcs = props.activatedComponents[i].ccs
            .split("/")
            .map((item) => Number(item));
          if (
            _componentCcs[0] <= _lastCcs[0] &&
            _lastCcs[0] <= _componentCcs[2]
          ) {
            if (
              _componentCcs[3] +
              props.activatedComponents[i].width +
              _lastWidth <=
              props.gridColumn + 1
            )
              _lastComponents.push({
                ...props.activatedComponents[i],
                rowIndex: i,
              });
            else
              _extraComponents.push({
                ...props.activatedComponents[i],
                rowIndex: i,
              });
            _lastWidth = props.activatedComponents[i].width + _lastWidth;
          } else {
            _extraComponents.push({
              ...props.activatedComponents[i],
              rowIndex: i,
            });
          }
        }
      }

      sortComponent();
      focusComponent(_component.key);
      judgeLocation(_lastComponents, 0, _extraComponents);
    }

    //清空事件
    document.onmousemove = null;
    document.onmousedown = null;
    document.onmouseup = null;
  };
}

// 交换位置
const changeBlock = (blockName, oDiv, component) => {
  component.positionX = 0;
  component.positionY = 0;
  //console.log(blockName);
  let _cs = blockName
    .replace("g", "")
    .split("x")
    .map((item) => Number(item));
  //console.log('_cs', _cs);
  let _row = _cs[0] + component.height;
  let _column = _cs[1] + component.width;
  //设置元素大小位置
  oDiv.style.gridArea =
    _cs[0] +
    "/" +
    _cs[1] +
    "/" +
    (_row < props.gridRow + 1 ? _row : props.gridRow + 1) +
    "/" +
    (_column < props.gridColumn + 1 ? _column : props.gridColumn + 1);

  component.ccs = oDiv.style.gridArea;
  //console.log('area', oDiv.style.gridArea);
}

// 确认信息
const showConfirm = (type, keys, actIndex) => {
  this.$confirm({
    title: "提示",
    content: "是否确认删除此微件？",
    onOk: () => {
      this.removeComponent(type, keys, actIndex);
    },
    onCancel: () => {
      this.$store.commit("dnd/PUSH_CHECKEDKEYS", [keys.join("-")]);
    },
  });
}

// 删除微件
const removeComponent = (type, keys, actIndex) => {
  //console.log(actIndex);
  let _arr = keys[2].split("_");
  if (type === "list") {
    props.activatedComponents = props.activatedComponents.filter(
      (item) => item.key != _arr[1]
    );
  } else if (type === "component") {
    props.activatedComponents.splice(actIndex, 1);
  }

  this.$store.commit("dnd/DELETE_CHECKEDKEYS", [keys.join("-")]);
}
</script>

<style scoped>
.container {
  position: relative;
  display: grid;
  background-color: #f3f3f3;
  /*grid-template-areas: none;*/
  margin: 0 auto;
}

.container.mobile {
  width: 383px;
  grid-row-gap: 8px;
  grid-column-gap: 8px;
  /* 网格 */
  background-image: -webkit-linear-gradient(white 8px, transparent 0),
    -webkit-linear-gradient(90deg, white 8px, transparent 0);
  background-image: -moz-linear-gradient(white 8px, transparent 0),
    -moz-linear-gradient(90deg, white 8px, transparent 0);
  background-image: -o-linear-gradient(white 8px, transparent 0),
    -o-linear-gradient(90deg, white 8px, transparent 0);
  background-image: linear-gradient(white 8px, transparent 0),
    linear-gradient(90deg, white 8px, transparent 0);
  background-size: 38.3px 38.3px;
  background-position: -8px -8px;
}

.container.pc {
  grid-row-gap: 20px;
  grid-column-gap: 20px;
  /* 网格 */
  background-image: -webkit-linear-gradient(white 20px, transparent 0),
    -webkit-linear-gradient(90deg, white 20px, transparent 0);
  background-image: -moz-linear-gradient(white 20px, transparent 0),
    -moz-linear-gradient(90deg, white 20px, transparent 0);
  background-image: -o-linear-gradient(white 20px, transparent 0),
    -o-linear-gradient(90deg, white 20px, transparent 0);
  background-image: linear-gradient(white 20px, transparent 0),
    linear-gradient(90deg, white 20px, transparent 0);
  background-size: 50px 50px;
  background-position: -20px -20px;
}

.block {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  justify-items: center;
  align-items: center;
  align-content: center;
  user-select: none;
  background: #fff;
  border: 1px dashed #979797;
  background: rgba(255, 255, 255, 0.4);

  .title {
    position: absolute;
    top: 10px;
    left: 0;
    padding: 0 20px;
    width: 100%;
    color: #4285f4;

    .form a {
      padding-right: 5px;
    }
  }

  .delete {
    position: absolute;
    display: none;
    bottom: 10px;
    right: 20px;
  }

  .morph {
    span {
      display: block;
      position: absolute;
      width: 30px;
      height: 31px;
      text-indent: -999px;
      overflow: hidden;
      cursor: pointer;
    }

    span:before {
      display: block;
      content: "";
      width: 5px;
      height: 5px;
      background-color: #979797;
      margin: 13px auto;
    }

    span.up {
      top: -16px;
      left: 50%;
      margin-left: -15px;
    }

    span.right {
      top: 50%;
      right: -16px;
      margin-top: -16px;
    }

    span.down {
      bottom: -16px;
      left: 50%;
      margin-left: -15px;
    }

    span.left {
      top: 50%;
      left: -15px;
      margin-top: -16px;
    }
  }
}

.block:hover .delete {
  display: block;
}
</style>
