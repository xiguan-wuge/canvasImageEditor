import Arrow from './modules/arrow.js'
import Rect from './modules/rect.js'
import Circle from './modules/circle.js'
import Text from './modules/text.js'
import Scribble from './modules/scribble.js'
import Mosaic from './modules/mosaic.js'
import Eraser from './modules/eraser.js'

import {isFunction} from './utils.js'

import {cursorTypeMap} from './constant.js'

// 默认数据
const defaultConfig = {
  currentWidth: 2,
  endPointRadius: 6,
  indexChoosePoint: -1, // 被选中的图形的端点的索引
  endPointFillColor: "#FFFFFF",        //端点内部填充颜色
  currentColor: '#ff0000',
  m_szDrawColor: '#ff0000', //图形中线的颜色
  ratio: 1, // 分辨率
  textFontSize: 20,
  textFontWeight: 1,
  scaleOriginX: 0, // 平移的X偏移量
  scaleOriginY: 0, // 平移的Y偏移量
  scaleRadio: 1, // 缩放比例
  scaleChangeValue: 0.1, // 缩放时递增、减的比例
  scaleRadioMax: 2, // 最大缩放比例
  scaleRadioMin: 0.2,// 最小缩放比例
  scaleOffsetX: 0,
  scaleOffsetY: 0,
  currentShapeId: -1, // 当前激活的图形
  changeToolTypeAuto: true, // 是否允许在编辑过程中自动切换操作类型（通过鼠标点击圆、矩形、箭头、之间切换类型）
  clearCanBeUndo: false, // 清空是否允许再撤销
  hoverActiveShapeId: -1, // 非绘图状态下，鼠标移动时hover的图形ID
  hoverActiveShapeType: '', // 非绘图状态下，鼠标移动时hover的图形类型
}

const DBCLICK_TIME = 300; // 双击时间间隔
class CanvasImgEditor {
  constructor(options) {
    this.canvasId = options.canvasId;
    this.canvas = null;
    this.ctx = null;
    this.ctxImg = null;
    this.canvasWidth = 0;
    this.canvasHeight = 0;
    this.canvasParent = null;
    this.canvasImg = null;
    this.canvasImgSrc = ''; // 图片链接

    this.isDrawing = false;
    this.startX = 0
    this.startY = 0;
    this.currentTool = options?.currentTool || 'arrow'; // 默认工具为画箭头
    // 是否允许在编辑过程中自动切换操作类型（通过鼠标点击圆、矩形、箭头、之间切换类型）
    this.changeToolTypeAuto = options?.changeToolTypeAuto !== undefined ? options?.changeToolTypeAuto : defaultConfig.changeToolTypeAuto
    this.hoverActiveShapeId = defaultConfig.hoverActiveShapeId // 非绘图状态下，鼠标移动时hover的图形ID
    this.hoverActiveShapeType = defaultConfig.hoverActiveShapeType // 非绘图状态下，鼠标移动时hover的图形类型
    this.actions = []; // 用于存储操作的历史记录
    this.undoStack = []; // 用于存储撤销的操作
    this.undoState = false // 当前撤销状态，是否允许撤销，默认false
    this.redoState = false // 当前是否允许取消撤销，默认false
    this.clearState = false // 当前是否允许复原，默认false
    this.clearCanBeUndo = options?.clearCanBeUndo !== undefined ? options?.clearCanBeUndo : defaultConfig.clearCanBeUndo // 清空操作是否允许撤销
    this.clearCanBeUndoState = false // 是否清空了，是否能撤销
    this.clearCanBeRedoState = false // 是否能执行因清空撤销后的取消撤销
    this.textElements = []; // 用于存储文本元素及其位置信息
    this.ellipses = []; // 存储所有圆/椭圆信息
    this.currentWidth = 2
    this.currentColor = 'red'
    this.canvasCursor = 'default' // 鼠标样式
    this.endPointRadius = 6 // 默认端点半径
    this.endPointFillColor = "#FFFFFF";        //端点内部填充颜色
    this.indexChoosePoint = -1 // 被选中的图形的端点的索引
    this.m_szDrawColor = this.currentColor;  //图形中线的颜色
    this.ratio = 1 // 分辨率
    this._lastClickTime = new Date().getTime()
    this.imgNode = null
    this.endPointWidth = 4 // 默认端点宽度
    this.endPointColor = '#fff' // 默认端点填充颜色
    this.imgPaintAuto = options.imgPaintAuto || false
    this.imgPaintAutoBgColor = options.imgPaintAutoBgColor || 'blue'
    this.outsideClickAllowList = options.outsideClickAllowList || []

    this.typeAndShapeMap = {
      'arrow': 'arrowList',
      'scribble': 'scribbleList',
      'eraser': 'eraserList',
      'mosaic': 'mosaicList',
      'text': 'textList',
      'rect': 'rectList',
      'circle': 'circleList',
    }

    // 箭头信息
    this.currentOperationState = 'add' // 当前操作状态，默认是新增
    this.currentOperationInfo = null // 当前操作的信息
    this.beforeOperationInfo = null // 当前操作信息的初始备份
    this.currentShapeId = defaultConfig.currentShapeId // 当前激活的图像ID，设置
    this.arrowList = [] // 已绘制的箭头列表

    // 涂鸦信息
    this.scribbleList = []

    // 橡皮擦
    this.eraserList = []

    // 马赛克
    this.mosaicList = []
    this.mosaicDimensions = this.currentWidth // 马赛克块大小
    this.mergedCanvas = null // 用于合并的canvas
    this.mergedCtx = null // 用于合并的canvas 上下文

    // 文本
    this.textList = []
    this.textareaNode = null
    this.textFontSize = 20
    this.textFontWeight = 1

    // 矩形
    this.rectList = []
    this.rectOperationState = ''

    // 圆
    this.circleList = []

    // 缩放
    this.scaleOriginX = 0 // 平移的X偏移量
    this.scaleOriginY = 0 // 平移的Y偏移量
    this.scaleRadio = 1 // 缩放比例
    this.scaleChangeValue = options?.scaleChangeValue || 0.1 // 缩放时递增、减的比例
    this.scaleRadioMax = options?.scaleRadioMax || 2 // 最大缩放比例
    this.scaleRadioMin = options?.scaleRadioMin || 0.2 // 最小缩放比例
    this.scaleOffsetX = 0
    this.scaleOffsetY = 0
    this.enlargeState = true
    this.reduceState = true
    this.scaleBackup = {} // 缩放数据备份
    this.scaleState = false // 是否缩放了，清空时候判断

    this.callbackObj = {} // 注册的事件对象



    this.loadCanvas(options);
    this.initMouseEvent()
    if (options.imgSrc) {
      this.loadImage(options.imgSrc);
    }
    this.modules = {}
    this._register(new Arrow(this))
    this._register(new Rect(this))
    this._register(new Circle(this))
    this._register(new Text(this))
    this._register(new Scribble(this))
    this._register(new Mosaic(this))
    this._register(new Eraser(this))
  }

  /**
   * 功能模块注册
   * @param {*} component 主要注册是功能实例
   */
  _register(component) {
    this.modules[component.getName()] = component
  }

  /**
   * 处理canvas加载和父级判断
   *
   * @param {Object} options
   * @return {*} 
   * @memberof CanvasImgEditor
   */
  loadCanvas(options) {
    this.canvas = document.getElementById(options.canvasId);
    if (!this.canvas) {
      return;
    }
    this.canvasWidth = this.canvas.width;
    this.canvasHeight = this.canvas.height;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (options.parentId) {
      this.canvasParent = document.getElementById(options.parentId);
      if (this.canvasParent) {
        this.canvasParent.style.position = 'relative';
        this.canvasParent.style.overflow = 'hidden';
      }
    }
    this.setCanvasRatio()
  }

  /**
   * 处理图片加载，Blob流处理
   *
   * @param {*} src
   * @memberof CanvasImgEditor
   */
  loadImage(src) {
    if (src && this.canvasParent) {
      if (!this.canvasImg) {
        this.canvasImg = document.createElement('canvas');
        this.canvasImg.width = this.canvasWidth;
        this.canvasImg.height = this.canvasHeight;
        this.canvasParent.appendChild(this.canvasImg);
      }

      this.ctxImg = this.canvasImg.getContext('2d', { willReadFrequently: true });

      this.canvas.style.position = 'absolute';
      this.canvas.style.zIndex = 1;
      const img = new window.Image();
      img.crossOrigin = 'Anonymous'; // 允许跨域访问
      let srcPath = src
      if (srcPath instanceof Blob) {
        srcPath = URL.createObjectURL(srcPath);
      }
      img.src = srcPath;
      this.canvasImgSrc = srcPath
      img.onload = () => {
        console.log('img-width-height', img.width, img.height)
        console.log('this.imgPaintAuto', this.imgPaintAuto)
        if (this.imgPaintAuto) {
          console.log('保持图片宽高比不变');
          // 图片宽高比不变，以大的一项铺满，另一方向auto
          const { width, height } = img
          console.log('图片原始宽高', width, height);
          let paintWidth = 0
          let paintHeight = 0
          let paintX = 0
          let paintY = 0
          if (width >= height) {
            paintWidth = this.canvasWidth
            paintX = 0
            paintHeight = this.canvasHeight / (width / this.canvasWidth)
            paintY = (this.canvasHeight - paintHeight) / 2
          } else {
            paintHeight = this.canvasHeight
            paintY = 0
            paintWidth = this.canvasWidth / (height / this.canvasHeight)
            paintX = (this.canvasWidth - paintWidth) / 2
          }
          console.log('paintWidth——————paintHeight',paintWidth, paintHeight);
          this.ctxImg.fillStyle = this.imgPaintAutoBgColor
          this.ctxImg.fillRect(0, 0, this.canvasWidth, this.canvasHeight)
          this.ctxImg.drawImage(img, paintX, paintY, paintWidth, paintHeight);
        } else {
          // 百分百铺满
          this.ctxImg.drawImage(img, 0, 0, this.canvasWidth, this.canvasHeight);
        }

        this.imgNode = img
      };
      img.onerror = (e) => {
        console.log('图片加载失败', e);
      };
    }
  }

  /**
   * 设置当前操作类型
   *
   * @param {string} type 当前操作的类型
   * @memberof CanvasImgEditor
   */
  setCurrentToolType(type) {
    this.saveText()
    this.currentTool = type
    
  }

  /**
   * 状态变更前，确保文本保存了
   */
  saveText() {
    this.modules.text?.exitTextEditStatus()
  }

  /**
   * 鼠标点击可编辑图形时，自动修改当前操作类型
   *
   * @memberof CanvasImgEditor
   */
  setCurrentToolTypeByAuto() {
    const { hoverActiveShapeId, hoverActiveShapeType, currentTool } = this
    if (hoverActiveShapeId > -1 && hoverActiveShapeType && hoverActiveShapeType !== currentTool) {
      this.setCurrentToolType(hoverActiveShapeType)
      this.setCurrentShapeId()
      this.redrawCanvas()
      isFunction(this.callbackObj.toolTypeChange) && this.callbackObj.toolTypeChange(hoverActiveShapeType)
    }
  }

  /**
   * 鼠标按下事件处理逻辑
   *
   * @param {MouseEvent} e 鼠标按下对象
   * @memberof CanvasImgEditor
   */
  handleMouseDown(e) {
    if (this.changeToolTypeAuto) {
      // 若运行自动切换可编辑图形类型，则鼠标按下后切换类型
      this.setCurrentToolTypeByAuto()
    }

    const { ctx, currentTool } = this
    this._lastClickTime = new Date().getTime();
    ctx.globalCompositeOperation = 'source-over'
    this.isDrawing = true;
    this.startX = e.offsetX;
    this.startY = e.offsetY;
    console.log('mousedown', this.currentTool, e.offsetX, e.offsetY);

    if (currentTool !== 'text') {
      this.currentOperationInfo = null
      this.currentOperationState = ''
    }

    if (currentTool === 'arrow') {
      this.modules.arrow.handleArrowMouseDown()
    } else if (currentTool === 'scribble') {
      this.modules.scribble.handleScribbleMouseDown()
    } else if (currentTool === 'eraser') {
      this.modules.eraser.handleEraserMouseDown()
    } else if (currentTool === 'text') {
      this.modules.text.handleTextMouseDown(this.startX, this.startY, e)
    } else if (currentTool === 'rect') {
      this.modules.rect.handleRectMouseDown()
    } else if (currentTool === 'circle') {
      this.modules.circle.handleCircleMouseDown(this.startX, this.startY)
    } else if (currentTool === 'mosaic') {
      this.modules.mosaic.handleMosaicMouseDown(this.startX, this.startY)
    } else if (currentTool === 'scale') {
      this.handleScaleMouseDown(e)
    }
  }

  /**
   * 初始化鼠标事件,包含 
   * 鼠标事件：mouseDown|mouseMove | mouseUp | mouseLeave
   * 拖拽事件：drag | dragStart
   * 滚轮事件：wheel
   * 键盘事件：keydown 监听文本输入和回车
   *
   * @memberof CanvasImgEditor
   */
  initMouseEvent() {
    const { canvas } = this
    canvas.addEventListener('mousedown',
      e => this.handleMouseDown(e)
    );

    canvas.addEventListener('mousemove', (e) => {
      const currentX = e.offsetX;
      const currentY = e.offsetY;
      const { currentTool } = this

      // 鼠标houver处理
      if (!this.isDrawing) {
        this.handleElseMouseMove(currentX, currentY, e)
        return
      }
      // 绘图move
      if (currentTool === 'arrow') {
        this.modules.arrow.handleArrowMouseMove(currentX, currentY)
      } else if (currentTool === 'scribble') {
        this.modules.scribble.handleScribbleMouseMove(currentX, currentY)
      } else if (currentTool === 'eraser') {
        this.modules.eraser.handleEraserMouseMove(currentX, currentY)
      } else if (currentTool === 'rect') {
        this.modules.rect.handleRectMouseMove(currentX, currentY)
      } else if (currentTool === 'mosaic') {
        this.modules.mosaic.handleMasaicMouseMove(currentX, currentY, e);
      } else if (currentTool === 'text') {
        this.modules.text.handleTextMouseMove(currentX, currentY)
      } else if (currentTool === 'circle') {
        this.modules.circle.handleCircleMouseMove(currentX, currentY)
      } else if (currentTool === 'scale') {
        // 拖拽canvas
        this.handleScaleMouseMove(currentX, currentY, e)
      }
    });

    canvas.addEventListener('mouseup', (e) => {
      console.log('canvas-mouseUp');
      const { currentTool } = this
      if (currentTool === 'text') {
        this.modules.text.handleTextMouseUp(e)
      } else if (this.isDrawing) {
        this.isDrawing = false;
        this.modules.arrow.handleArrowMouseUp()
        this.modules.scribble.handleScribbleMouseUp()
        this.modules.eraser.handleEraserMouseUp()
        this.modules.rect.handleRectMouseUp()
        this.modules.mosaic.handleMosaicMouseUp()
        this.modules.circle.handleCircleMouseUp(e)
        this.saveAction(); // 保存当前操作xx
      }
      this.checkActiveShape()

    });

    canvas.addEventListener('mouseleave', () => {
      console.warn('canvas-mouseLeave');
      if (this.isDrawing) {
        this.isDrawing = false;
        // 文本编辑状态，进入输入框，会触发mouseleave
        if (this.currentTool === 'text' && this.modules.text && this.modules.text.inTextEdit) {
          return
        }
        this.saveAction(); // 保存当前操作
      }
    });
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault()
      // 编辑状态中，禁用缩放
      if(this.isDrawing || this.modules?.text.inTextEdit) {
        return 
      }
      this.handleMouseWheel(e)
    })
    canvas.addEventListener('drag', (e) => {
      e.preventDefault();
      return false;
    })
    canvas.addEventListener('dragStart', (e) => {
      e.preventDefault();
      return false;
    })
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        console.log('键盘撤销触发');
        this.undo()
      }
    });
  }


  /**
   * 设置是否在编辑状态中
   * @param {boolean} val 是否在编辑状态中，默认false 
   */
  setIsDrawing(val=false) {
    this.isDrawing = val
  }

  /**
   * 判断是否为双击事件
   *
   * @param {number} newClickTime 新的点击时间
   * @return {boolean} 
   * @memberof CanvasImgEditor
   */
  _isDoubleClick(newClickTime) {
    return newClickTime - this._lastClickTime < DBCLICK_TIME;
  }

  // 创建用于合并使用的canvas
  createMergedCanvas() {
    const { canvas } = this
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    this.mergedCanvas = tempCanvas
    this.mergedCtx = tempCanvas.getContext('2d');
  }

  // 设置字体大小
  setTextFontSize(fontSize) {
    this.textFontSize = fontSize - 0
  }

  // 设置字体宽度
  setTextFontWight(fontWight) {
    this.textFontWeight = fontWight - 0
  }

  // 修改鼠标效果
  modifyCursor(type) {
    const cssCursor = cursorTypeMap[type]
    if (cssCursor) {
      this.canvasCursor = cssCursor
      this.canvas.style.cursor = cssCursor
    }
  }

  saveAction() {
    if (this.currentOperationInfo) {
      // 过滤无效保存
      this.actions.push(JSON.parse(JSON.stringify(this.currentOperationInfo)));
      this.undoStack = []; // 每次新的操作会清空撤销栈
      // 将鼠标样式切换回默认
      this.modifyCursor('auto')
      this.onListenUndoState()
      this.onListenClearState()
    }

    console.log('saveaction-this.actions', this.actions);
    // 打印当前操作类型的list
    console.log(`saveAction-this.${this.typeAndShapeMap[this.currentTool]}`, this[this.typeAndShapeMap[this.currentTool]]);
  }

  undo() {
    this.saveText()
    
    if(this.clearCanBeUndo) {
      // 删除能被撤销
      // 先判断常规撤销
      if(this.actions.length) {
        const lastAction = this.actions[this.length -1]
        if(Array.isArray(lastAction)) {
          // 撤销的是清空
          console.log('撤销的是清空');
        } else {
          // 常规撤销
          this.normalUndo()
        }
      } else if(this.undoStack.length) {
        // 清空撤销
        const lastAction = this.undoStack.pop()
        if(Array.isArray(lastAction)) {
          this.actions = lastAction
          this.undoStack.push(JSON.parse(JSON.stringify(lastAction)));
          this.clearCanBeUndoState = false
          console.log('删除被撤销-this.actions',this.actions);
          this.resetTypeListFromClear()
          console.log('this.circleList', this.circleList);
          
          this.redrawCanvas()
          this.checkScaleUndo()
          this.onListenUndoState()
          this.onListenRedoState()
          this.onListenClearState()
          this.onListenEnlargeState()
          this.onListenReduceState()
        }
      }
    } else {
      // 常规撤销
      this.normalUndo()
    }
  }

  /**
   * 常规撤销（不能撤销清空）
   */
  normalUndo() {
    if (this.actions.length > 0) {
      const lastAction = this.actions.pop();
      console.log('this.actions', this.actions);
      this.undoStack.push(lastAction);

      const sameIdAction = this.actions.filter(item => {
        return item.id === lastAction.id
      })
      const { typeAndShapeMap } = this
      const { type, id } = lastAction
      let list = []

      if (typeAndShapeMap[type] && this[typeAndShapeMap[type]]) {
        list = this[typeAndShapeMap[type]]
      }
      if (!list || !list.length) {
        return
      }
      if (sameIdAction.length) {
        // lastAction是修改
        const index = list.findIndex(item => item.id === id)
        if (index > -1) {
          list.splice(index, 1, sameIdAction[sameIdAction.length - 1])
        }
      } else {
        // lastAction是新增项, 删除同ID信息
        const index = list.findIndex(item => item.id === lastAction.id)
        if (index > -1) {
          list.splice(index, 1)
        }
      }
      // 避免重复入栈，销毁当前操作信息
      this.currentOperationInfo = null
      this.redrawCanvas()
      this.onListenUndoState()
      this.onListenRedoState()
      this.onListenClearState()
    }
  }

  redo() {
    this.saveText()
    if (this.undoStack.length > 0) {
      const redoAction = this.undoStack.pop();
      if(Array.isArray(redoAction)) {
        this.clearCanBeRedoState = true
        this.clear()
        this.clearCanBeRedoState = false
      } else {
        this.actions.push(redoAction);

        const { typeAndShapeMap } = this
        const { type, id } = redoAction
        let list = []

        if (typeAndShapeMap[type] && this[typeAndShapeMap[type]]) {
          list = this[typeAndShapeMap[type]]
        }
        if (!Array.isArray(list)) {
          return
        }
        const index = list.findIndex(item => item.id === id)
        if (index > -1) {
          list.splice(index, 1, redoAction)
        } else {
          list.push(redoAction)
        }
      }
      
      this.redrawCanvas()
      this.onListenRedoState()
      this.onListenUndoState()
      this.onListenClearState()
      if(this.clearCanBeUndo) {
        this.onListenEnlargeState()
        this.onListenReduceState()
      }
    }
  }

  /**
   * 因撤销清空，重置已绘制类型的list
   */
  resetTypeListFromClear() {
    const uniqueShapeList = this.getUniqueShapeList()
    let typeList = ''
    uniqueShapeList.forEach(item => {
      typeList = `${item.type}List`
      if(this[typeList]) {
        this[typeList].push(item)
      }
    })
  }

  // 监听撤销状态
  onListenUndoState() {
    const state = this.actions.length > 0 || this.clearCanBeUndoState
    if (this.undoState !== state) {
      this.undoState = state
      if (isFunction(this.callbackObj.checkUndo)) {
        this.callbackObj.checkUndo(this.undoState)
      }
    }
    return state
  }

  // 监听取消撤销状态
  onListenRedoState() {
    const state = this.undoStack.length > 0 && !this.clearCanBeUndoState
    if (this.redoState !== state) {
      this.redoState = state
      if (isFunction(this.callbackObj.checkRedo)) {
        this.callbackObj.checkRedo(this.redoState)
      }
    }
    return state
  }

  // 监听复原状态
  onListenClearState(isImmediate) {
    const state = this.actions.length > 0
    if (this.clearState !== state) {
      this.clearState = state
      if (isFunction(this.callbackObj.checkClear) && !isImmediate) {
        this.callbackObj.checkClear(this.clearState)
      }
    }
    return state
  }

  /**
   * 监听放大
   * @param {Boolean} isImmediate 是否立即监听放大
   * @returns Boolean 是否允许继续放大
   */
  onListenEnlargeState(isImmediate) {
    const state = this.scaleRadio >= this.scaleRadioMax
    if (this.enlargeState !== state) {
      this.enlargeState = state
      if (isFunction(this.callbackObj.checkEnlarge) && !isImmediate) {
        this.callbackObj.checkEnlarge(state)
      }
    }
    return state
  }

  /**
   * 监听缩小状态
   * @param {Boolean} isImmediate  是否立即执行监听
   * @returns 是否允许继续缩小
   */
  onListenReduceState(isImmediate) {
    const state = this.scaleRadio <= this.scaleRadioMin
    if (this.reduceState !== state) {
      this.reduceState = state
      if (isFunction(this.callbackObj.checkEnlarge) && !isImmediate) {
        this.callbackObj.checkReduce(state)
      }
    }
    return state
  }

  // 复原
  clear() {
    this.saveText()
    this.clearCanvas()
    if(this.clearCanBeUndo) {
      // if(this.clearCanBeRedoState) {
      //   // 由取消撤销引起的清空
      //   this.clearCanBeRedoState = false
        
      // }  else {
        // 清空允许撤销
        this.undoStack.push(JSON.parse(JSON.stringify(this.actions)))
        this.clearCanBeUndoState = true
        this.currentOperationInfo = null
        this.setCurrentShapeId()
        this.actions = []
        Object.values(this.typeAndShapeMap).forEach(key => {
          this[key] = []
        })
        this.setScaleBackup()
        
      // }
      
      this.restoreScale()

    } else {
      this.actions = []
      this.redoAction = []
      this.undoStack = []
      this.currentOperationInfo = null // 清空当前操作数据，以免重绘时将最后一项又绘制上去
      Object.values(this.typeAndShapeMap).forEach(key => {
        this[key] = []
      })
      this.restoreScale()
    }
    this.onListenUndoState()
    this.onListenRedoState()
    this.onListenClearState()
  }

  

  // 恢复默认配置
  resetConfig() {
    Object.keys(defaultConfig).forEach(key => {
      this[key] = defaultConfig[key]
    })
  }

  // 重新绘制canvas
  redrawCanvas() {
    this.clearCanvas()
    const uniqueShapeList = this.getUniqueShapeList()
    if (this.currentOperationInfo && this.currentOperationInfo.id) {
      const index = uniqueShapeList.findIndex(item => item.id === this.currentOperationInfo.id)
      if (index > -1) {
        uniqueShapeList.splice(index, 1)
      }
      uniqueShapeList.push(this.currentOperationInfo) // 
    }
    let funcName = ''
    let type = ''
    uniqueShapeList.forEach(item => {
      type = item.type
      type = `${type.charAt(0).toUpperCase()}${type.slice(1)}`
      funcName = `redraw${type}List`
      if (this.modules && this.modules[item.type] && this.modules[item.type][funcName]) {
        this.modules[item.type][funcName](item)
      } else if (this[funcName]) {
        this[funcName](item)
      }
    })
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight); // 清除画布
  }

  // 对历史栈中的图像去重，保留历史栈顺序
  getUniqueShapeList() {
    const { actions } = this
    const list = []
    const map = []
    let item = null
    for (let len = actions.length, i = len - 1; i >= 0; i--) {
      item = actions[i]
      if (!map[item.id]) {
        map[item.id] = true
        list.unshift(item)
      }
    }
    return list
  }

  /**
   * 图片下载
   * @param {Boolean} isBlob  是否返回blob格式
   * @param {String} name 下载图片时的文件名
   * @returns 
   */
  download(isBlob = false, name = 'merged_image') {
    this.saveText()
    if(this.hasCurrentShapeID()) {
      // 若存在编辑状态，取消编辑状态
      this.setCurrentShapeId()
      this.checkActiveShape()
    }
    return new Promise((resove) => {
      const mergedCanvas = document.createElement('canvas');
      mergedCanvas.width = this.canvasWidth;
      mergedCanvas.height = this.canvasHeight;
      const mergedCtx = mergedCanvas.getContext('2d');
      mergedCtx.drawImage(this.canvasImg, 0, 0);
      mergedCtx.drawImage(this.canvas, 0, 0);
      if(mergedCanvas.toBlob) {
        // 导出合并后的canvas为图片
        mergedCanvas.toBlob((blob) => {
          if (isBlob) {
            resove(blob)
          } else {
            const url = URL.createObjectURL(blob);
            console.log('下载的图片链接', url);
            const a = document.createElement('a');
            a.href = url;
            const fileName = name
            a.download = fileName; // 可以指定文件名
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url); // 释放URL对象
            resove()
          }

        });
      } else {
        console.log(2222);
        // 获取 base64 编码的字符串  
        const dataURL = mergedCanvas.toDataURL('image/png');  
          
        // 移除 URL 的前缀，只保留编码后的数据部分  
        const base64Data = dataURL.replace(/^data:image\/(png|jpeg);base64,/, "");  
          
        // 将 base64 字符串解码为二进制数据  
        const binaryString = atob(base64Data);  
          
        // 将二进制数据转换为 Uint8Array  
        const {length} = binaryString;  
        const bytes = new Uint8Array(length);  
        for (let i = 0; i < length; i++) {  
          bytes[i] = binaryString.charCodeAt(i);  
        }  
          
        // 创建 Blob 对象  
        const blob = new Blob([bytes], { type: 'image/png' }); 
        if (isBlob) {
          resove(blob)
        } else {
          const url = URL.createObjectURL(blob);
          console.log('下载的图片链接', url);
          const a = document.createElement('a');
          a.href = url;
          const fileName = name
          a.download = fileName; // 可以指定文件名
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url); // 释放URL对象
          resove()
        }
      }
      
    })

  }

  /**
   * 设置当前颜色值
   * @param {string} val 颜色值
   */
  changeColor(val) {
    this.currentColor = val
  }

  /**
   * 设置当前宽度 / 马赛克方块宽度
   * @param {number | string} val 宽度
   */
  changeStrokeWidth(val) {
    this.currentWidth = val - 0
    this.mosaicDimensions = val - 0
  }

  // 滚轮进行缩放
  handleMouseWheel(e) {
    let newScaleRadio = this.scaleRadio
    if (e.deltaY > 0) {
      if (this.scaleRadio < this.scaleRadioMax) {
        newScaleRadio = (this.scaleRadio * 10 + this.scaleChangeValue * 10) / 10
      }

    } else if (this.scaleRadio > this.scaleRadioMin) {
      newScaleRadio = (this.scaleRadio * 10 - this.scaleChangeValue * 10) / 10
    }
    this.translateCanvas(e.offsetX, e.offsetY, newScaleRadio)
    this.onListenEnlargeState()
    this.onListenReduceState()
  }

  // 缩放canvas， true-放大，false-缩小，默认放大
  scale(isEnlarge = true) {
    this.currentTool = 'scale'
    let newScaleRadio = this.scaleRadio
    let scaleDisable = false
    if (isEnlarge && this.scaleRadio < this.scaleRadioMax) {
      newScaleRadio = (this.scaleRadio * 10 + this.scaleChangeValue * 10) / 10
    } else if (isEnlarge === false && this.scaleRadio > this.scaleRadioMin) {
      newScaleRadio = (this.scaleRadio * 10 - this.scaleChangeValue * 10) / 10
    } else {
      console.log('不满足缩放要求');
      scaleDisable = true
    }
    if (!scaleDisable) {
      const offsetX = this.canvas.width / 2;
      const offsetY = this.canvas.height / 2;
      this.translateCanvas(offsetX, offsetY, newScaleRadio)
      // this.drawScale()
    }
    this.onListenEnlargeState()
    this.onListenReduceState()
  }

  translateCanvas(offsetX, offsetY, newScaleRadio, isRestore = false) {
    if (isRestore) {
      this.scaleOffsetX = 0
      this.scaleOffsetY = 0
      this.setCanvasScaleStyle(this.scaleOffsetX, this.scaleOffsetY, 1)
      this.scaleRadio = newScaleRadio
    } else {
      const translateData = this.getTranslateData(offsetX, offsetY, newScaleRadio);
      this.scaleOffsetX += translateData.x
      this.scaleOffsetY += translateData.y
      this.setCanvasScaleStyle(this.scaleOffsetX, this.scaleOffsetY, newScaleRadio)
      this.scaleRadio = newScaleRadio
    }

  }

  // 设置canvas缩放样式
  setCanvasScaleStyle(offsetX, offsetY, scale) {
    const cssObj = {
      transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale}, ${scale})`,
      'transform-origin': '0 0'
    }
    // Object.hasOwnProperty()
    Object.keys(cssObj).forEach(key => {
      this.canvas.style[key] = cssObj[key]
      this.canvasImg.style[key] = cssObj[key]
    })
  }

  /**
   * 重置缩放
   */
  restoreScale() {
    if (this.scaleRadio !== 1) {
      const newScaleRadio = 1
      const offsetX = this.canvas.width / 2;
      const offsetY = this.canvas.height / 2;
      this.translateCanvas(offsetX, offsetY, newScaleRadio, true)
      this.onListenEnlargeState()
      this.onListenReduceState()
    }
  }

  /**
   * 设置缩放备份
   */
  setScaleBackup() {
    // 缩放信息备份
    this.scaleBackup = {
      scaleOriginX:this.scaleOriginX,
      scaleOriginY:this.scaleOriginY,
      scaleRadio: this.scaleRadio,
      scaleOffsetX: this.scaleOffsetX,
      scaleOffsetY: this.scaleOffsetY 
    }
    // 是否需要缩放
    this.scaleState = this.scaleOriginX !== 0
      || this.scaleOriginY !== 0
      || this.scaleRadio !== 1
      || this.scaleOffsetX !== 0
      || this.scaleOffsetY !== 0
  }

  /**
   * 缩放撤销
   */
  checkScaleUndo() {
    if(this.scaleState) {
      Object.keys(this.scaleBackup).forEach(key => {
        this[key] = this.scaleBackup[key]
      })
      this.setCanvasScaleStyle(this.scaleOffsetX, this.scaleOffsetY, this.scaleRadio)

      this.scaleState = false
      this.scaleBackup = {}
    }
  }

  /**
   * 鼠标拖动时，缩放的处理
   * @param {*} e 
   */
  handleScaleMouseDown(e) {
    this.scaleOffsetXCopy = this.scaleOffsetX
    this.scaleOffsetYCopy = this.scaleOffsetY
    this.scaleMouseDownX = e.x
    this.scaleMouseDownY = e.y
    this.modifyCursor('move')
  }

  // canvas拖动
  handleScaleMouseMove(currentX, currentY, e) {
    this.scaleOffsetX = this.scaleOffsetXCopy + e.x - this.scaleMouseDownX;
    this.scaleOffsetY = this.scaleOffsetYCopy + e.y - this.scaleMouseDownY;
    this.setCanvasScaleStyle(this.scaleOffsetX, this.scaleOffsetY, this.scaleRadio)
  }

  //以鼠标为缩放中心，计算canvas缩放后需要位移的量
  getTranslateData(offsetX, offsetY, newScale) {
    const { scaleRadio, canvasWidth, canvasHeight } = this
    const newWidth = canvasWidth * newScale;
    const newHeight = canvasHeight * newScale;
    const diffWidth = canvasWidth * scaleRadio - newWidth;
    const diffHeight = canvasHeight * scaleRadio - newHeight;
    const xRatio = offsetX / canvasWidth;
    const yRatio = offsetY / canvasHeight;
    return { x: diffWidth * xRatio, y: diffHeight * yRatio };
  }

  /**
   * 获取canvas 比例：cssWidth / canvas.width
   * @returns {number} 比例
   */
  getCanvasRatio() {
    const originWidth = this.canvas.width;
    let cssWidth = originWidth
    if (this.canvas.style.width) {
      cssWidth = parseInt(this.canvas.style.width, 10);
    }
    return originWidth / cssWidth;
  }

  /**
   * 设置canvas比例
   */
  setCanvasRatio() {
    this.ratio = Math.ceil(this.getCanvasRatio())
  }

  /**
   * 事件回调 注册
   * @param {object} callbackObj 回调对象
   */
  registerCallback(callbackObj) {
    // 可撤销监听
    this.callbackObj.checkUndo = callbackObj.checkUndo || null
    if (this.callbackObj.checkUndo) {
      this.callbackObj.checkUndo(this.onListenUndoState(true))
    }
    // 可取消撤销监听
    this.callbackObj.checkRedo = callbackObj.checkRedo || null
    if (this.callbackObj.checkRedo) {
      this.callbackObj.checkRedo(this.onListenRedoState(true))
    }
    // 可清空监听
    this.callbackObj.checkClear = callbackObj.checkClear || null
    if (this.callbackObj.checkClear) {
      this.callbackObj.checkClear(this.onListenClearState(true))
    }
    // 可放大监听
    this.callbackObj.checkEnlarge = callbackObj.checkEnlarge || null
    if (this.callbackObj.checkEnlarge) {
      this.callbackObj.checkEnlarge(this.onListenEnlargeState(true))
    }
    // 可缩小监听
    this.callbackObj.checkReduce = callbackObj.checkReduce || null
    if (this.callbackObj.checkReduce) {
      this.callbackObj.checkReduce(this.onListenReduceState(true))
    }
    // 监听图像操作类型变化
    this.callbackObj.toolTypeChange = callbackObj.toolTypeChange || null
  }

  /**
   * 处理鼠标hover
   * @param {number} currentX  鼠标X轴位置
   * @param {number} currentY 鼠标Y轴位置
   */
  handleElseMouseMove(currentX, currentY) {
    let selected = {}

    selected = this.modules.circle.checkCirclePoint(this.circleList, currentX, currentY)
    if (selected.id === -1) {
      selected = this.modules.rect.checkRectPoint(this.rectList, currentX, currentY)
    }
    if (selected.id === -1) {
      selected = this.modules.arrow.checkArrowPoint(this.arrowList, currentX, currentY)
    }
    if (selected.id === -1) {
      selected = this.modules.text.checkTextHover(this.textList, currentX, currentY)
    }

    const { id, type } = selected
    this.hoverActiveShapeId = id
    this.hoverActiveShapeType = type
  }

  /**
   * 设置当前激活的图形ID, 若不传，则表示无图形被激活
   * @param {number} id 图像ID
   */
  setCurrentShapeId(id = -1) {
    this.currentShapeId = id
  }
  
  /**
   * 判断当前激活图像是否和自身相同
   * @param {number} id 新图像ID
   * @returns {boolean} 是否相同
   */
  checkCurrentShapeId(id) {
    return this.currentShapeId === id
  }
  
  /**
   * 判断当前是否存在激活的图像ID
   * @returns {boolean} 是否存在相同ID
   */
  hasCurrentShapeID() {
    return this.currentShapeId > -1
  }
  
  /**
   * 激活图像检测，若无激活ID，则重绘，取消激活状态
   */
  checkActiveShape() {
    if (!this.hasCurrentShapeID()) {
      this.redrawCanvas()
    }
  }
  
  /**
   * 当鼠标按下时，切换当前激活图像
   * @param {object} shape 可再次编辑的图像信息
   */
  changeCurrentShapeOnMouseDown(shape) {
    this.redrawCanvas()
    this.setCurrentShapeId(shape.id)
  }
}

export default CanvasImgEditor;
