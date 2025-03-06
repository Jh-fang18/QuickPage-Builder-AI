<template>
  <div class="container pc" :style="{
    width: (this.gridScale + this.gridPadding) * this.gridColumn - 20 + 'px',
    gridTemplateColumns: getGridTemplateColumns,
    gridTemplateRows: getGridTemplateRows,
    gridTemplateAreas: getGridTemplateAreas,
  }">
    <div v-for="(item, index) of activatedComponents" :key="index" class="block animated"
      :style="{ top: item.positionY, left: item.positionX, gridArea: item.ccs }"
      @mousedown="mousedown($event, item, index)" :ref="'block' + index">
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

<script>
import { CloseCircleOutlined, CheckCircleOutlined } from '@ant-design/icons-vue';
const langPrefix = "management";

export default {
  name: "Container",
  props: {
    activatedComponents: {
      type: Array,
      default: () => [],
    }, //激活组件列表
    gridColumn: {
      type: Number,
      default: 24,
    }, //网格宽度
    gridRow: {
      type: Number,
      default: 36,
    }, //网格长度
    gridScale: {
      type: Number,
      default: 30,
    }, //最小单位宽度
    gridPadding: {
      type: Number,
      default: 20,
    }, //网格间距
  },
  data() {
    return {
      langPrefix,
      tabsActiveKey: "",
      confirmLoading: false,
      oldContent: "[]", //原始内容
      navigationId: "", //移动端菜单id
      tabs: [], //tabs内容
      contentId: 0, //内容信息ID
      tempId: 0, //模板ID
      columnDifferences: 0, //宽度鼠标点击位置与实际空间边缘差数
      columnDeviationValue: 0, //宽度偏差值
      topMax: 0, //顶部最大边界
      rightMax: 0, //右边最大边界
      downMax: 0, //底部最大边界
      leftMax: 0, //左边最大边界
      rowDifferences: 0, //长度鼠标点击位置与实际空间边缘差数
      rowDeviationValue: 0, //长度偏差值
    };
  },
  computed: {
    getGridTemplateColumns() {
      let _str = "";
      for (let i = 0; i < this.gridColumn; i++)
        _str = _str + this.gridScale + "px" + " ";
      return _str;
    },
    getGridTemplateRows() {
      let _str = "";
      for (let i = 0; i < this.gridRow; i++)
        _str = _str + this.gridScale + "px" + " ";
      return _str;
    },
    getGridTemplateAreas() {
      let _str = "";
      for (let i = 0; i < this.gridRow; i++) {
        _str = _str + "'";
        for (let j = 0; j < this.gridColumn; j++) {
          _str = _str + "g" + (i + 1) + "x" + (j + 1) + " ";
        }
        _str = _str + "' ";
      }
      return _str;
    },
  },
  methods: {
    saveTitle(component) {
      component.editTitle = false;
      let { title } = component;
      component["selfServiceData"]["itemName"] = title;
      this.updateSelfServiceItem(component["selfServiceData"]).then(() => {
        this.save();
        Promise.all([
          this.getSelfServiceItemList(0, this.terminalType),
          this.getSelfServiceItemList(1, this.terminalType),
        ]).then((res) => {
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
              children: this.MicroCardsList,
            },
            {
              title: "容器类",
              key: "0-1",
              disabled: true,
              children: this.ContainersList,
            },
          ];
        });
      });
    },
    //校准插入点后元素占位,不包括点击元素本身
    judageLocation(lastComponents, extraComponents) {
      let _lastComponents = JSON.parse(JSON.stringify(lastComponents));
      let _extraComponents = JSON.parse(JSON.stringify(extraComponents));

      //判断是否有元素平移
      console.log("---------last----------");
      if (_lastComponents.length > 0) {
        //平移同行元素
        _lastComponents.map((item) => {
          let _lastComponentsCcs = item.ccs
            .split("/")
            .map((item) => Number(item));

          let _columnStart = this.activatedComponents[item.rowIndex - 1].ccs
            .split("/")
            .map((item) => Number(item))[3];

          this.$refs["block" + item.rowIndex][0].style.gridArea =
            _lastComponentsCcs[0] +
            "/" +
            _columnStart +
            "/" +
            _lastComponentsCcs[2] +
            "/" +
            (_columnStart + item.width);

          this.activatedComponents[item.rowIndex].ccs = this.$refs[
            "block" + item.rowIndex
          ][0].style.gridArea;
        });

        //平移完成故清空
        _lastComponents = [];
      }

      //判断是否有元素下移
      console.log("---------extra----------");
      if (_extraComponents.length > 0) {
        let _fristComponent = _extraComponents[0];
        let _fristCcs = _extraComponents[0].ccs
          .split("/")
          .map((item) => Number(item));
        let _prevComponent = this.activatedComponents[
          _fristComponent.rowIndex - 1
        ];
        let _prevCcs = _prevComponent.ccs
          .split("/")
          .map((item) => Number(item));
        let _rowCcs = [0, 0, 0, 0];
        let _accident = [];

        //若第一个元素已超出Grid高度则直接删除
        if (_prevCcs[2] + _fristComponent.height > this.gridRow + 1) {
          this.activatedComponents.splice(
            _fristComponent.rowIndex,
            _extraComponents.length
          );
          return;
        }

        //获取上一行元素最大长度
        //console.log('_fristComponent', _fristComponent);
        for (let i = _fristComponent.rowIndex - 1; i >= 0; i--) {
          let _ccs = this.activatedComponents[i].ccs
            .split("/")
            .map((item) => Number(item));
          let _prevCcs =
            i !== 0
              ? this.activatedComponents[i - 1].ccs
                .split("/")
                .map((item) => Number(item))
              : [0, 0, 0, 0];
          //console.log('_ccs', this.activatedComponents[i]);
          //console.log('_prevCcs', this.activatedComponents[i - 1]);
          if (_rowCcs[2] < _ccs[2]) _rowCcs = _ccs;

          if (_ccs[0] !== _prevCcs[0]) break;
        }

        //console.log('_rowCcs', _rowCcs);

        if (_rowCcs[2] === 0) _rowCcs = _prevCcs;

        //折行第一个元素必移动位置
        this.$refs["block" + _fristComponent.rowIndex][0].style.gridArea =
          _rowCcs[2] +
          "/1/" +
          (_rowCcs[2] + _fristComponent.height) +
          "/" +
          (_fristComponent.width + 1 < this.gridColumn + 1
            ? _fristComponent.width + 1
            : this.gridColumn + 1);
        this.activatedComponents[_fristComponent.rowIndex].ccs = this.$refs[
          "block" + _fristComponent.rowIndex
        ][0].style.gridArea;

        //位置已变
        _fristCcs = this.activatedComponents[_fristComponent.rowIndex].ccs
          .split("/")
          .map((item) => Number(item));
        //位置已移动，故清除
        _extraComponents.splice(0, 1);

        //行累计宽度
        let _lastWidth = 0;

        //设置之后的元素位置
        _extraComponents = _extraComponents.filter((item) => {
          if (_fristCcs[3] + item.width + _lastWidth <= this.gridColumn + 1) {
            item.ccs =
              _rowCcs[2] +
              "/1/" +
              (_rowCcs[2] + item.height) +
              "/" +
              1 +
              item.width;
            _lastComponents.push(item);
          }

          _lastWidth = item.width + _lastWidth;

          return _fristCcs[3] + _lastWidth > this.gridColumn + 1;
        });

        _extraComponents = _extraComponents.filter((item) => {
          if (
            _rowCcs[2] +
            this.activatedComponents[_fristComponent.rowIndex].height +
            item.height >
            this.gridRow + 1
          ) {
            _accident.push(item);
          }

          return (
            _rowCcs[2] +
            this.activatedComponents[_fristComponent.rowIndex].height +
            item.height <=
            this.gridRow + 1
          );
        });

        console.log("_accident", _accident);
        if (_accident.length > 0)
          this.activatedComponents.splice(
            _accident[0].rowIndex,
            _accident.length
          );

        this.judageLocation(_lastComponents, _extraComponents);
      }
      console.log("---------end----------");
    },
    focusComponent(key) {
      this.activatedComponents.map((item, index) => {
        if (item.key === key) {
          this.$refs["block" + index][0].style.borderColor = " red";
          this.$refs["block" + index][0].style.zIndex = 999;
        } else {
          this.$refs["block" + index][0].style.borderColor = " #979797";
          this.$refs["block" + index][0].style.zIndex = 0;
        }
      });
    },
    sortComponent() {
      this.activatedComponents.sort((x, y) => {
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
    },
    moveTop(e, index) {
      let oBlock = this.$refs["block" + index][0]; //获取当前点击组件
      //let gDiv = oBlock.parentElement; //获取点击元素的父级元素
      let disY = e.clientY - 0;
      let oTop = 0;

      oBlock.style.borderColor = " red";
      oBlock.style.zIndex = 999;

      document.onmousemove = (e) => {
        if (oTop === "$") return;
        let top = e.clientY - disY;
        if (oTop < top) {
          //减去一个gridPadding才是组件的大小
          let _rminHeight =
            this.activatedComponents[index].minHeight *
            (this.gridScale + this.gridPadding) -
            this.gridPadding;
          let _cHeight = oBlock.offsetHeight + (oTop - top);
          if (_cHeight >= _rminHeight) {
            oBlock.style.height = _cHeight + "px";
            oBlock.style.top = top + "px";
          } else {
            oBlock.style.height = _rminHeight + "px";
            top = "$";
          }
        } else {
          oBlock.style.height = oBlock.offsetHeight - (top - oTop) + "px";
          oBlock.style.top = top + "px";
        }

        oTop = top;
      };
      document.onmouseup = () => {
        //需加上一个gridPadding才是计算高度
        let _height = Math.ceil(
          (oBlock.offsetHeight + this.gridPadding) /
          (this.gridScale + this.gridPadding)
        ),
          _top = Math.ceil(
            oBlock.offsetTop / (this.gridScale + this.gridPadding)
          );

        if (oTop === "$") {
          _top = _top + 1;
        } else {
          //超过边界，固定为1
          if (_top <= 0) _top = 1;
        }

        let _componentCcs = this.activatedComponents[index].ccs
          .split("/")
          .map((item) => Number(item));
        let _rowCcs = [0, 0, 0, 0];
        let _gridArea = oBlock.style.gridArea
          .split("/")
          .map((item) => Number(item));

        //获取上一行元素最大长度
        for (let i = index - 1; i >= 0; i--) {
          let _ccs = this.activatedComponents[i].ccs
            .split("/")
            .map((item) => Number(item));
          let _prevCcs =
            i !== 0
              ? this.activatedComponents[i - 1].ccs
                .split("/")
                .map((item) => Number(item))
              : [_gridArea[0], _gridArea[1], 1, 1];
          if (_rowCcs[2] < _ccs[2]) _rowCcs = _ccs;
          if (_ccs[0] !== _prevCcs[0]) break;
        }

        // console.log('_gridArea[0]', _gridArea[0]);
        // console.log('_height', _height);
        if (_rowCcs[2] === _gridArea[0]) _gridArea[0] = _rowCcs[2];
        else _gridArea[0] = _top;
        _gridArea[2] = _gridArea[0] + _height;
        //console.log(_gridArea);
        oBlock.style.gridArea = _gridArea.join("/");
        oBlock.style.height = "100%"; //必须设回百分比，不然grid-area无法奇效
        oBlock.style.top = "0"; //必须设为0，不然无法恢复正确位置
        this.activatedComponents[index].ccs = oBlock.style.gridArea;
        this.activatedComponents[index].height = _gridArea[2] - _gridArea[0];

        let _extraComponents = [];

        for (let i = index + 1; i < this.activatedComponents.length; i++) {
          let _ccs = this.activatedComponents[i].ccs
            .split("/")
            .map((item) => Number(item));
          if (_componentCcs[0] !== _ccs[0]) {
            _extraComponents.push({
              ...this.activatedComponents[i],
              rowIndex: i,
            });
            console.log("_extraComponents", this.activatedComponents[i]);
          }
        }

        this.focusComponent(this.activatedComponents[index].key);
        this.judageLocation([], _extraComponents);

        //清空事件
        document.onmousemove = null;
        document.onmousedown = null;
        document.onmouseup = null;
      };
    },
    moveRight(e, index) {
      let oBlock = this.$refs["block" + index][0]; //获取当前点击组件
      let disX = e.clientX - 0;
      let oLeft = 0;

      oBlock.style.borderColor = " red";
      oBlock.style.zIndex = 999;

      document.onmousemove = (e) => {
        let left = e.clientX - disX;
        if (oLeft < left) {
          oBlock.style.width = oBlock.offsetWidth - (oLeft - left) + "px";
        } else {
          let _rminWidth =
            this.activatedComponents[index].minWidth *
            (this.gridScale + this.gridPadding) -
            this.gridPadding;
          let _cWidth = oBlock.offsetWidth + (left - oLeft);
          oBlock.style.width =
            _cWidth < _rminWidth ? _rminWidth : _cWidth + "px";
        }

        oLeft = left;
      };
      document.onmouseup = () => {
        let _width = Math.ceil(
          oBlock.offsetWidth / (this.gridScale + this.gridPadding)
        );
        let _gridArea = oBlock.style.gridArea
          .split("/")
          .map((item) => Number(item));
        //console.log('_gridArea', _gridArea);
        //超过边界，固定为最大宽度
        _gridArea[3] =
          _gridArea[1] + _width < this.gridColumn + 1
            ? _gridArea[1] + _width
            : this.gridColumn + 1;
        oBlock.style.gridArea = _gridArea.join("/");
        oBlock.style.width = "100%"; //必须设回百分比，不然grid-area无法奇效
        this.activatedComponents[index].ccs = oBlock.style.gridArea;
        this.activatedComponents[index].width = _gridArea[3] - _gridArea[1];
        //console.log(this.activatedComponents[index]);
        let _componentCcs = this.activatedComponents[index].ccs
          .split("/")
          .map((item) => Number(item));
        let _lastComponents = [];
        let _extraComponents = [];
        let _lastWidth = 0;

        for (let i = index + 1; i < this.activatedComponents.length; i++) {
          let _ccs = this.activatedComponents[i].ccs
            .split("/")
            .map((item) => Number(item));

          if (
            _componentCcs[0] === _ccs[0] &&
            _componentCcs[3] + this.activatedComponents[i].width + _lastWidth <=
            this.gridColumn + 1
          ) {
            _lastComponents.push({
              ...this.activatedComponents[i],
              rowIndex: i,
            });
            //console.log('_lastComponents', this.activatedComponents[i]);
          } else {
            _extraComponents.push({
              ...this.activatedComponents[i],
              rowIndex: i,
            });
            //console.log('_extraComponents', this.activatedComponents[i]);
          }

          _lastWidth = this.activatedComponents[i].width + _lastWidth;
        }

        this.focusComponent(this.activatedComponents[index].key);
        this.judageLocation(_lastComponents, _extraComponents);

        //清空事件
        document.onmousemove = null;
        document.onmousedown = null;
        document.onmouseup = null;
      };
    },
    moveDown(e, index) {
      let oBlock = this.$refs["block" + index][0]; //获取当前点击组件
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
            this.activatedComponents[index].minHeight *
            (this.gridScale + this.gridPadding) -
            this.gridPadding;
          let _cHeight = oBlock.offsetHeight + (top - oTop);
          oBlock.style.height =
            _cHeight < _rminHeight ? _rminHeight : _cHeight + "px";
        }

        oTop = top;
      };
      document.onmouseup = () => {
        let _height = Math.ceil(
          oBlock.offsetHeight / (this.gridScale + this.gridPadding)
        );
        let _gridArea = oBlock.style.gridArea
          .split("/")
          .map((item) => Number(item));
        _gridArea[2] =
          _gridArea[0] + _height < this.gridRow + 1
            ? _gridArea[0] + _height
            : this.gridRow + 1;
        oBlock.style.gridArea = _gridArea.join("/");
        oBlock.style.height = "100%"; //必须设回百分比，不然grid-area无法奇效
        this.activatedComponents[index].ccs = oBlock.style.gridArea;
        this.activatedComponents[index].height = _height;

        let _componentCcs = this.activatedComponents[index].ccs
          .split("/")
          .map((item) => Number(item));
        let _extraComponents = [];
        let _rowCcs = [0, 0, 0, 0];

        //获取当前行元素最大长度(向下)
        for (let i = index + 1; i < this.activatedComponents.length; i++) {
          let _ccs = this.activatedComponents[i].ccs
            .split("/")
            .map((item) => Number(item));
          if (_componentCcs[0] === _ccs[0] && _componentCcs[2] < _ccs[2]) {
            _rowCcs = _ccs;
          } else break;
        }
        //获取当前行元素最大长度(向上)
        for (let i = index - 1; i >= 0; i--) {
          let _ccs = this.activatedComponents[i].ccs
            .split("/")
            .map((item) => Number(item));
          if (_componentCcs[0] === _ccs[0] && _componentCcs[2] < _ccs[2]) {
            _rowCcs = _ccs;
          } else break;
        }

        if (_rowCcs[2] === 0) _rowCcs = _componentCcs;

        for (let i = index; i < this.activatedComponents.length; i++) {
          let _ccs = this.activatedComponents[i].ccs
            .split("/")
            .map((item) => Number(item));
          let _prevCcs =
            i !== 0
              ? this.activatedComponents[i - 1].ccs
                .split("/")
                .map((item) => Number(item))
              : [0, 0, 0, 0];

          //console.log('_ccs', this.activatedComponents[i]);

          if (_componentCcs[0] !== _ccs[0]) {
            if (
              _componentCcs[2] === _rowCcs[2] &&
              _componentCcs[3] > _ccs[1] &&
              _componentCcs[1] < _ccs[3]
            ) {
              //在拖动项下方的元素都算折行
              console.log(1, this.activatedComponents[i]);
              _extraComponents.push({
                ...this.activatedComponents[i],
                rowIndex: i,
              });
            } else if (
              _ccs[0] !== _prevCcs[0] &&
              _ccs[3] > _rowCcs[3] &&
              _prevCcs[3] + this.activatedComponents[i].width >
              this.gridColumn + 1
            ) {
              //宽度大于拖动元素起始点才算折行项
              console.log(2, this.activatedComponents[i]);
              _extraComponents.push({
                ...this.activatedComponents[i],
                rowIndex: i,
              });
            } else if (_ccs[0] !== _prevCcs[0] && _prevCcs[0] !== _rowCcs[0]) {
              //第三行开始无条件进入折行数组
              _extraComponents.push({
                ...this.activatedComponents[i],
                rowIndex: i,
              });
            }
            //console.log('_extraComponents', this.activatedComponents[i]);
          }
        }

        this.focusComponent(this.activatedComponents[index].key);
        this.judageLocation([], _extraComponents);

        //清空事件
        document.onmousemove = null;
        document.onmousedown = null;
        document.onmouseup = null;
      };
    },
    moveLeft(e, index) {
      let oBlock = this.$refs["block" + index][0]; //获取当前点击组件
      //let gDiv = oBlock.parentElement; //获取点击元素的父级元素
      let disX = e.clientX - 0;
      let oLeft = 0;

      oBlock.style.borderColor = "red";
      oBlock.style.zIndex = 999;

      document.onmousemove = (e) => {
        if (oLeft === "$") return;
        let left = e.clientX - disX;
        if (oLeft < left) {
          //减去一个gridPadding才是组件的大小
          let _rminWidth =
            this.activatedComponents[index].minWidth *
            (this.gridScale + this.gridPadding) -
            this.gridPadding;
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
          (oBlock.offsetWidth + this.gridPadding) /
          (this.gridScale + this.gridPadding)
        ),
          _left = Math.ceil(
            oBlock.offsetLeft / (this.gridScale + this.gridPadding)
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
            ? this.activatedComponents[index - 1].ccs
              .split("/")
              .map((item) => Number(item))
            : [_gridArea[0], _gridArea[1], 1, 1];

        //判断是否换行
        if (
          _prevCcs[0] === _gridArea[0] &&
          _prevCcs[3] + _width <= this.gridColumn + 1
        ) {
          if (_prevCcs[3] === _gridArea[1]) _gridArea[1] = _prevCcs[3];
          else _gridArea[1] = _left;
          _gridArea[3] = _gridArea[1] + _width;
        } else {
          _gridArea[0] = _prevCcs[2];
          _gridArea[1] = _left;
          _gridArea[2] = _prevCcs[2] + this.activatedComponents[index].height;
          _gridArea[3] =
            _left + _width < this.gridColumn + 1
              ? _left + _width
              : this.gridColumn + 1;
        }

        console.log(_gridArea);

        oBlock.style.gridArea = _gridArea.join("/");
        oBlock.style.width = "100%"; //必须设回百分比，不然grid-area无法奇效
        oBlock.style.left = "0"; //必须设为0，不然无法恢复正确位置
        this.activatedComponents[index].ccs = oBlock.style.gridArea;
        this.activatedComponents[index].width = _gridArea[3] - _gridArea[1];

        let _componentCcs = this.activatedComponents[index].ccs
          .split("/")
          .map((item) => Number(item));
        let _lastComponents = [];
        let _extraComponents = [];
        let _lastWidth = 0;

        for (let i = index + 1; i < this.activatedComponents.length; i++) {
          let _ccs = this.activatedComponents[i].ccs
            .split("/")
            .map((item) => Number(item));

          if (
            _componentCcs[0] === _ccs[0] &&
            _componentCcs[3] + this.activatedComponents[i].width + _lastWidth <=
            this.gridColumn + 1
          ) {
            _lastComponents.push({
              ...this.activatedComponents[i],
              rowIndex: i,
            });
            //console.log('_lastComponents', this.activatedComponents[i]);
          } else {
            _extraComponents.push({
              ...this.activatedComponents[i],
              rowIndex: i,
            });
            //console.log('_extraComponents', this.activatedComponents[i]);
          }

          _lastWidth = this.activatedComponents[i].width + _lastWidth;
        }

        this.focusComponent(this.activatedComponents[index].key);
        this.judageLocation(_lastComponents, _extraComponents);

        //清空事件
        document.onmousemove = null;
        document.onmousedown = null;
        document.onmouseup = null;
      };
    },
    getPosition(e, gDiv) {
      let _positions = "";
      let _y = e.clientY - gDiv.offsetTop - this.rowDeviationValue;
      let _x = e.clientX - gDiv.offsetLeft - this.columnDeviationValue;

      //设置边界值
      if (this.topMax && e.clientY - gDiv.offsetTop <= this.topMax)
        _y = this.topMax;
      if (this.rightMax && e.clientX - gDiv.offsetLeft >= this.rightMax)
        _x = this.rightMax - this.columnDeviationValue;
      if (this.downMax && e.clientY - gDiv.offsetTop >= this.downMax)
        _y = this.downMax - this.rowDeviationValue;
      if (this.leftMax && e.clientX - gDiv.offsetLeft <= this.leftMax)
        _x = this.leftMax;

      // console.log(_y);
      // console.log(_x);
      // console.log(e.clientX);
      // console.log(gDiv.offsetLeft);
      // console.log('rowDeviationValue', this.rowDeviationValue);
      // console.log('_yy', e.clientY - gDiv.offsetTop);

      //找出当前点击格子, 出现未知值时固定为1

      for (let i = 0; i < this.gridRow; i++) {
        if (
          _y >= i * (this.gridScale + this.gridPadding) &&
          _y < (i + 1) * (this.gridScale + this.gridPadding)
        ) {
          for (let j = 0; j < this.gridColumn; j++) {
            if (
              _x >= j * (this.gridScale + this.gridPadding) &&
              _x < (j + 1) * (this.gridScale + this.gridPadding)
            ) {
              _positions =
                "g" +
                (i + 1 - this.rowDifferences > 0
                  ? i + 1 - this.rowDifferences
                  : 1) +
                "x" +
                (j + 1 - this.columnDifferences > 0
                  ? j + 1 - this.columnDifferences
                  : 1);
              break;
            }
          }
          break;
        }
      }

      // console.log('_positions', _positions);
      return _positions;
    },
    mousedown(e, component, index) {
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
      let _componentIndex = index; //在激活组件数组中索引
      //获取点击元素的父级元素，移动端直接抓取tabs
      //console.log(e.path);
      let gDiv =
        this.terminalType === "1"
          ? this.$refs.tabs
          : e.path
            ? e.path[1]
            : oDiv.parentElement;
      let disX = e.clientX - 0;
      let disY = e.clientY - 0;
      oDiv.style.borderColor = " red";
      oDiv.style.zIndex = 999;

      document.onmousedown = (e) => {
        //因每次点击位置不同，故初始化差值
        this.columnDifferences = 0;
        this.rowDifferences = 0;
        this.columnDeviationValue = 0;
        this.rowDeviationValue = 0;
        this.leftMax = 0;
        this.topMax = 0;
        this.downMax = 0;
        this.rightMax = 0;

        let _positions = this.getPosition(e, gDiv)
          .replace("g", "")
          .split("x")
          .map((item) => Number(item));
        //console.log('first', _positions);
        this.rowDifferences = _positions[0] - _componentCcs[0];
        //console.log('rowDifferences', this.rowDifferences);
        this.rowDeviationValue =
          e.clientY -
          gDiv.offsetTop -
          (_positions[0] - 1) * (this.gridScale + this.gridPadding);
        this.columnDifferences = _positions[1] - _componentCcs[1];
        //console.log('columnDifferences', this.columnDifferences);
        this.columnDeviationValue =
          e.clientX -
          gDiv.offsetLeft -
          (_positions[1] - 1) * (this.gridScale + this.gridPadding);
        //console.log('columnDeviationValue', this.columnDeviationValue);

        this.topMax =
          e.clientY -
          gDiv.offsetTop -
          (_componentCcs[0] - 1) * (this.gridScale + this.gridPadding);
        this.rightMax =
          e.clientX -
          gDiv.offsetLeft +
          (this.gridColumn + 1 - _componentCcs[3]) *
          (this.gridScale + this.gridPadding);
        this.downMax =
          e.clientY -
          gDiv.offsetTop +
          (this.gridRow + 1 - _componentCcs[2]) *
          (this.gridScale + this.gridPadding);
        //console.log('downMax', this.rightMax);
        this.leftMax =
          e.clientX -
          gDiv.offsetLeft -
          (_componentCcs[1] - 1) * (this.gridScale + this.gridPadding);
      };

      document.onmousemove = (e) => {
        let left = e.clientX - disX;
        let top = e.clientY - disY;
        let _axis = oDiv.style.gridArea.split("/").map((item) => Number(item));

        //上边界
        let _topBoundary =
          0 +
          _axis[0] * (this.gridScale + this.gridPadding) -
          (this.gridScale + this.gridPadding);
        if (top < -_topBoundary) top = -_topBoundary;

        //右边界
        let _rightBoundary =
          this.gridColumn * (this.gridScale + this.gridPadding) -
          (_axis[3] - 1) * (this.gridScale + this.gridPadding);
        if (left > _rightBoundary) left = _rightBoundary;

        //下边界
        let _bottomBoundary =
          this.gridRow * (this.gridScale + this.gridPadding) -
          (_axis[2] - 1) * (this.gridScale + this.gridPadding);
        if (top > _bottomBoundary) top = _bottomBoundary;

        //左边界
        let _leftBoundary =
          0 +
          _axis[1] * (this.gridScale + this.gridPadding) -
          (this.gridScale + this.gridPadding);
        if (left < -_leftBoundary) left = -_leftBoundary;

        oDiv.style.left = left + "px";
        oDiv.style.top = top + "px";
        component.positionX = left;
        component.positionY = top;
      };

      document.onmouseup = (e) => {
        let _positions = this.getPosition(e, gDiv);
        //console.log('second', _positions);
        //console.log(e.target);
        if (_positions && _positions.split("x")[1] != "NaN") {
          this.changeBlock(_positions, oDiv, _component);
          //console.log(_component);
          let _focusComponent = {};
          let _lastComponents = [];
          let _extraComponents = [];
          let _componentCcs = _component.ccs
            .split("/")
            .map((item) => Number(item));
          //console.log('componentCcs', _componentCcs);

          //替换位置逻辑，现已左上角顶点落点为判断条件
          this.activatedComponents.map((item, i) => {
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

            this.activatedComponents.splice(
              _focusComponent.rowIndex,
              0,
              _component
            );
            this.activatedComponents.splice(
              _componentIndex > _focusComponent.rowIndex
                ? _componentIndex + 1
                : _componentIndex,
              1
            );

            oDiv = this.$refs["block" + _focusComponent.rowIndex][0];

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
              i < this.activatedComponents.length;
              i++
            ) {
              let _lastCcs = this.activatedComponents[i].ccs
                .split("/")
                .map((item) => Number(item));
              if (
                _componentCcs[0] <= _lastCcs[0] &&
                _lastCcs[0] <= _componentCcs[2]
              ) {
                if (
                  _componentCcs[3] +
                  this.activatedComponents[i].width +
                  _lastWidth <=
                  this.gridColumn + 1
                )
                  _lastComponents.push({
                    ...this.activatedComponents[i],
                    rowIndex: i,
                  });
                else
                  _extraComponents.push({
                    ...this.activatedComponents[i],
                    rowIndex: i,
                  });
                _lastWidth = this.activatedComponents[i].width + _lastWidth;
              } else {
                _extraComponents.push({
                  ...this.activatedComponents[i],
                  rowIndex: i,
                });
              }
            }
          }

          this.sortComponent();
          this.focusComponent(_component.key);
          this.judageLocation(_lastComponents, _extraComponents);
        }

        //清空事件
        document.onmousemove = null;
        document.onmousedown = null;
        document.onmouseup = null;
      };
    },
    changeBlock(blockName, oDiv, component) {
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
        (_row < this.gridRow + 1 ? _row : this.gridRow + 1) +
        "/" +
        (_column < this.gridColumn + 1 ? _column : this.gridColumn + 1);

      component.ccs = oDiv.style.gridArea;
      //console.log('area', oDiv.style.gridArea);
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
  components: {
    CloseCircleOutlined,
    CheckCircleOutlined
  }
};
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