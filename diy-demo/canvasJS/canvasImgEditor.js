let canvasGlobalId = 1
const cursorTypeMap = {
  auto: 'auto', // 默认值，浏览器根据元素自动设置
  default: 'default', // 普通指针
  move: 'move', // 移动
  text: 'text', // 文本
  // 调整光标大小,分别表示向各个方向（东、东北、西北、北、东南、西南、南、西）调整大小的光标
  'e-resize': 'e-resize',
  'ne-resize': 'ne-resize',
  'nw-resize': 'nw-resize',
  'n-resize': 'n-resize',
  'se-resize': 'se-resize',
  'sw-resize': 'sw-resize',
  's-resize': 's-resize',
  'w-resize': 'w-resize',
  'w-resize': 'w-resize', // 基于纵轴左右调整
  's-resize': 's-resize', // 基于纵轴上下调整
  'nesw-resize': 'nesw-resize', // 基于纵轴东北-西南调整
  'nwse-resize': 'nwse-resize', // 基于纵轴西北-东南调整
}
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
  hoverActiveShapeId: -1, // 非绘图状态下，鼠标移动时hover的图形ID
  hoverActiveShapeType: '', // 非绘图状态下，鼠标移动时hover的图形类型
  supportKeyboardUndo: false // 是否支持键盘按键撤销
}
// 函数判断
const isFunction = (val) => {
  return typeof val === 'function'
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
    this.textElements = []; // 用于存储文本元素及其位置信息
    this.ellipses = []; // 存储所有圆/椭圆信息
    this.currentWidth = 2
    this.currentColor = '#FF0000'
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

    this.supportKeyboardUndo = options.supportKeyboardUndo || defaultConfig.supportKeyboardUndo // 是否支持键盘按键撤销

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
    this.inTextEdit = false // 是否处于文本编辑状态

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

    this.callbackObj = {} // 注册的事件对象


    this.loadCanvas(options);
    this.initMouseEvent()
    if (options.imgSrc) {
      this.loadImage(options.imgSrc);
    }

    // this.drawGradientArrow = this.drawGradientArrow.bind(this)
    // this.saveAction = this.saveAction.bind(this)
    // this.handleMouseDown = this.handleMouseDown.bind(this)
    // this.mergeCanvasImageData = this.mergeCanvasImageData.bind(this)
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
      const img = new Image();
      img.crossOrigin = 'Anonymous'; // 允许跨域访问
      if (src instanceof Blob) {
        src = URL.createObjectURL(blob);
      }
      img.src = src;
      this.canvasImgSrc = src
      img.onload = () => {
        console.log('img-width-height', img.width, img.height)

        if (this.imgPaintAuto) {
          // 图片宽高比不变，以大的一项铺满，另一方向auto
          const { width, height } = img
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
    this.currentTool = type
    if (this.currentTool !== 'text') {
      this.hideTextareaNode()
    }
    if(!['arrow', 'rect', 'circle'].includes(type)) {
      // 非可再编辑图像，需要关闭激活状态
      this.clearActiveShape()
    }
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
      this.handleArrowMouseDown()
    } else if (currentTool === 'scribble') {
      // 涂鸦
      this.currentOperationInfo = {
        type: 'scribble',
        id: canvasGlobalId++,
        list: []
      }
    } else if (currentTool === 'eraser') {
      // 橡皮擦
      this.currentOperationInfo = {
        type: 'eraser',
        id: canvasGlobalId++,
        list: []
      }
    } else if (currentTool === 'text') {
      this.handleTextMouseDown(this.startX, this.startY)
    } else if (currentTool === 'rect') {
      this.handleRectMouseDown()
    } else if (currentTool === 'circle') {
      this.handleCircleMouseDown(this.startX, this.startY)
    } else if (currentTool === 'mosaic') {
      this.currentOperationInfo = this.createMosaicInfo(this.startX, this.startY)
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
        this.handleArrowMouseMove(currentX, currentY)
      } else if (currentTool === 'scribble') {
        const newScribble = {
          startX: this.startX,
          startY: this.startY,
          endX: currentX,
          endY: currentY,
          width: this.currentWidth,
          color: this.currentColor
        }
        this.currentOperationInfo.list.push(newScribble)
        this.drawScribble(newScribble);
      } else if (currentTool === 'eraser') {
        const newEraser = {
          x: currentX,
          y: currentY,
          width: this.currentWidth,
          color: this.currentColor
        }
        this.currentOperationInfo.list.push(newEraser)
        this.drawEraser(newEraser);
      } else if (currentTool === 'rect') {
        this.handleRectMouseMove(currentX, currentY)
      } else if (currentTool === 'mosaic') {
        this.handleMasaic(currentX, currentY, e);
      } else if (currentTool === 'text') {
        this.handleTextMouseMove(currentX, currentY)
      } else if (currentTool === 'circle') {
        this.handleCircleMouseMove(currentX, currentY)
      } else if (currentTool === 'scale') {
        // 拖拽canvas
        this.handleScaleMouseMove(currentX, currentY, e)
      }
    });

    canvas.addEventListener('mouseup', (e) => {
      console.log('canvas-mouseUp');
      const { currentTool } = this
      if (currentTool === 'text') {
        this.handleTextMouseUp()
      } else if (this.isDrawing) {
        this.isDrawing = false;
        this.handleArrowMouseUp()
        this.handleScribbleSaveAction()
        this.handleEraserMouseUp()
        this.handleRectMouseUp()
        this.handleCircleMouseUp(e)
        this.saveAction(); // 保存当前操作xx
      }
      this.checkActiveShape()

    });

    canvas.addEventListener('mouseleave', () => {
      console.log('canvas-mouseLeave');
      if (this.isDrawing) {
        this.isDrawing = false;
        // 文本编辑状态，进入输入框，会触发mouseleave
        if (this.currentTool === 'text' && this.inTextEdit) {
          return
        }
        this.saveAction(); // 保存当前操作
      }
    });
    if(this.supportKeyboardUndo) {
      // 是否支持键盘按键撤销
      canvas.addEventListener('wheel', (e) => {
        isFunction(e.preventDefault) && e.preventDefault()
        this.handleMouseWheel(e)
      })
    }
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
   * 判断是否为双击事件
   *
   * @param {number} newClickTime 新的点击时间
   * @return {boolean} 
   * @memberof CanvasImgEditor
   */
  _isDoubleClick(newClickTime) {
    return newClickTime - this._lastClickTime < DBCLICK_TIME;
  }

  /**
   * 处理画箭头时的mouseDown事件
   *
   * @memberof CanvasImgEditor
   */
  handleArrowMouseDown() {
    const list = this.arrowList
    let selected = false
    if (list && list.length > 0) {
      let arrow = {}
      // 从后往前遍历，后面绘制的优先级高于前面被绘制的
      for (let len = list.length, i = len - 1; i >= 0; i--) {
        arrow = list[i]
        const { startX, startY, endX, endY, startPoint, endWidth } = arrow
        const { endPointWidth } = startPoint
        const halfEndPointWidth = endPointWidth / 2
        if (this.insideRect(startX - (endPointWidth), startY - 2, 4, 4, this.startX, this.startY)) {
          this.changeCurrentShapeOnMouseDown(arrow)
          this.resizeGradientArrow()
          this.setCurrentShapeId(arrow.id)
          this.redrawCanvas()

          this.currentOperationState = 'start'
          this.modifyCursor('move')
          this.currentOperationInfo = arrow
          selected = true
          break;
        } else if (this.insideRect(endX - halfEndPointWidth, endY - halfEndPointWidth, endPointWidth, endPointWidth, this.startX, this.startY)) {
          this.changeCurrentShapeOnMouseDown(arrow)
          this.resizeGradientArrow()
          this.setCurrentShapeId(arrow.id)
          this.redrawCanvas()

          this.currentOperationState = 'end'
          this.modifyCursor('move')
          this.currentOperationInfo = arrow
          selected = true
          break;
        } else if (this.isPointOnThickLine(this.startX, this.startY, startX, startY, endX, endY, endWidth)) {
          this.changeCurrentShapeOnMouseDown(arrow)
          this.resizeGradientArrow()
          this.setCurrentShapeId(arrow.id)
          this.redrawCanvas()
          this.currentOperationState = 'move'
          this.currentOperationInfo = arrow
          this.modifyCursor('move')
          selected = true
          break;
        }
      }
    }
    if (!selected) {
      // 正常绘制？ 绘制第二条线段时，不执行这块？？？
      const newArrow = {
        id: canvasGlobalId++,
        type: 'arrow',
        startX: this.startX,
        startY: this.startY,
        endX: this.startX,
        endY: this.startY,
        color: this.currentColor,
        startWidth: 1,
        endWidth: (this.currentWidth - 0) + 7,
        startPoint: { // 起点端点
          x: this.startX - (this.endPointWidth / 2),
          y: this.startY - (this.endPointWidth / 2),
          endPointWidth: this.endPointWidth,
          color: this.endPointColor
        },
        endPoint: { // 结束端点
          x: this.startX - (this.endPointWidth / 2),
          y: this.startY - (this.endPointWidth / 2),
          endPointWidth: this.endPointWidth,
          color: this.endPointColor
        },
      }
      this.currentOperationState = 'add'
      this.currentOperationInfo = newArrow
      this.arrowList.push(newArrow)
      this.setCurrentShapeId(this.currentOperationInfo.id)
    }
    this.beforeOperationInfo = JSON.parse(JSON.stringify(this.currentOperationInfo))
  }
  handleArrowMouseMove(currentX, currentY) {
    const { currentOperationState, currentOperationInfo } = this
    if (currentOperationState === 'move') {
      // 移动箭头
      const dx = currentX - this.startX
      const dy = currentY - this.startY

      // 更新线段的起点位置，将其向 dx 和 dy 的方向移动
      currentOperationInfo.startX += dx;
      currentOperationInfo.startY += dy;

      // 更新线段的终点位置，使其与起点保持相同的位移量
      currentOperationInfo.endX += dx;
      currentOperationInfo.endY += dy;
      this.getArrowEndPoint(this.currentOperationInfo, 'both')
      this.resizeGradientArrow(currentOperationInfo);
      // 更新完成后，重新设置起始位置
      this.startX = currentX
      this.startY = currentY
    } else if (currentOperationState === 'end') {
      // 调整箭头尾部位置
      this.currentOperationInfo.endX = currentX
      this.currentOperationInfo.endY = currentY
      this.getArrowEndPoint(this.currentOperationInfo, 'end')
      this.resizeGradientArrow(this.currentOperationInfo)
    } else if (currentOperationState === 'start') {
      // 调整箭头开头位置
      this.currentOperationInfo.startX = currentX
      this.currentOperationInfo.startY = currentY
      this.getArrowEndPoint(this.currentOperationInfo, 'start')
      this.resizeGradientArrow(this.currentOperationInfo)
    } else {
      // 正常绘制箭头
      this.currentOperationInfo.endX = currentX
      this.currentOperationInfo.endY = currentY
      this.getArrowEndPoint(this.currentOperationInfo, 'both')
      this.resizeGradientArrow(this.currentOperationInfo)
    }
  }

  // 处理箭头MouseUP
  handleArrowMouseUp() {
    if (this.currentTool === 'arrow') {
      const { beforeOperationInfo, currentOperationInfo } = this
      const { startX, startY, endX, endY } = currentOperationInfo
      if (this.currentOperationInfo && this.currentOperationState === 'add') {
        // 判断信息是否符合
        if (!(Math.abs(endX - startX) > 0 || Math.abs(endY - startY) > 0)) {
          this.arrowList.pop()
          this.currentOperationInfo = null
          this.setCurrentShapeId()
        }
      }
      // 鼠标点击，但没有额外操作，不计入历史栈
      if (currentOperationInfo
        && beforeOperationInfo.startX === startX
        && beforeOperationInfo.startY === startY
        && endX === beforeOperationInfo.endX
        && endY === beforeOperationInfo.endY) {
        this.currentOperationInfo = null
      }

    }
  }
  resizeGradientArrow(item) {
    this.redrawCanvas()
  }

  // 绘制渐变线条的箭头
  drawGradientArrow(item) {
    const { startX, startY, endX, endY, startWidth, endWidth, color } = item
    const { ctx } = this
    // 计算箭头尾部左右端点
    const angle = Math.atan2(endY - startY, endX - startX);
    const headLength = endWidth * 2;
    const rightX = endX - headLength * Math.cos(angle - Math.PI / 6)
    const rightY = endY - headLength * Math.sin(angle - Math.PI / 6)
    const leftX = endX - headLength * Math.cos(angle + Math.PI / 6)
    const leftY = endY - headLength * Math.sin(angle + Math.PI / 6)

    // const steps = 300; // 分段数量
    const steps = parseInt(Math.abs(endX - startX), 10); // 分段数量
    // 以箭头正中心值作为线段结束位置
    const dx = ((rightX + leftX + endX) / 3 - startX) / steps;
    const dy = ((rightY + leftY + endY) / 3 - startY) / steps;

    ctx.lineCap = 'round'; // 设置线条端点为圆形
    ctx.lineJoin = 'round'
    ctx.globalCompositeOperation = 'source-over';
    // 绘制箭头主线
    for (let i = 0; i < steps; i++) {
      const x1 = startX + i * dx;
      const y1 = startY + i * dy;
      const x2 = startX + (i + 1) * dx;
      const y2 = startY + (i + 1) * dy;

      const lineWidth = startWidth + (endWidth - startWidth) * (i / steps);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
    // ctx.closePath()
    ctx.fillStyle = color;
    ctx.fill();


    ctx.beginPath();
    // 终点
    ctx.moveTo(endX, endY);
    // 右侧点

    ctx.lineTo(rightX, rightY);
    // 左侧点

    ctx.lineTo(leftX, leftY);
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fill();

    if (this.checkCurrentShapeId(item.id)) {
      this.drawArrowEndPoint(item);
    }
  }

  // 绘制箭头首尾的端点
  drawArrowEndPoint(item) {
    const { startPoint, endPoint } = item
    const { ctx } = this
    // 绘制开始端点
    ctx.beginPath();
    ctx.fillStyle = startPoint.color;
    ctx.fillRect(startPoint.x, startPoint.y, startPoint.endPointWidth, startPoint.endPointWidth)
    ctx.fill();

    // 绘制结束端点
    ctx.beginPath();
    ctx.fillStyle = endPoint.color;
    ctx.fillRect(endPoint.x, endPoint.y, endPoint.endPointWidth, endPoint.endPointWidth)
    ctx.fill();
  }

  // 修改箭头的起始、结束端点
  getArrowEndPoint(item, type) {
    if (['start', 'both'].includes(type)) {
      item.startPoint.x = item.startX - (item.startPoint.endPointWidth / 2)
      item.startPoint.y = item.startY - (item.startPoint.endPointWidth / 2)
    }
    if (['end', 'both'].includes(type)) {
      item.endPoint.x = item.endX - (item.endPoint.endPointWidth / 2)
      item.endPoint.y = item.endY - (item.startPoint.endPointWidth / 2)
    }
  }

  // 判断鼠标是否在箭头收尾端点上
  isMouseNearArrowPoint(x, y, pointX, pointY, radius) {
    const dx = x - pointX
    const dy = y - pointY
    return dx * dx + dy * dy <= radius * radius
  }

  // 判断是否在线段上
  isPointOnThickLine(mx, my, x1, y1, x2, y2, lineWidth = 8) {
    // 计算线段的向量
    const dx = x2 - x1;
    const dy = y2 - y1;

    // 计算线段长度的平方
    const lengthSquared = dx * dx + dy * dy;

    // 计算点到线段起点的向量
    const t = ((mx - x1) * dx + (my - y1) * dy) / lengthSquared;

    // 计算垂直投影的位置
    const projectionX = x1 + t * dx;
    const projectionY = y1 + t * dy;

    // 计算点到线段的距离
    const distance = Math.hypot(mx - projectionX, my - projectionY);

    // 检查鼠标是否在带状区域内
    const withinSegment = t >= 0 && t <= 1;

    // 判断距离是否小于或等于线段的一半宽度
    return distance <= lineWidth / 2 && withinSegment;
  }
  redrawArrowList(item) {
    if (item) {
      this.drawGradientArrow(item)
    } else if (this.arrowList && this.arrowList.length) {
      this.arrowList.forEach(item => {
        this.drawGradientArrow(item)
      })
    }
  }



  // 重绘涂鸦
  redrawScribbleList(item) {
    if (item) {
      if (item.list?.length) {
        item.list.forEach(block => {
          this.drawScribble(block, false)
        })
      }
    } else if (this.scribbleList && this.scribbleList.length) {
      this.scribbleList.forEach(item => {
        if (item.list?.length) {
          item.list.forEach(block => {
            this.drawScribble(block, false)
          })
        }
      })
    }
  }
  // 重绘橡皮擦
  redrawEraserList(item) {
    if (item) {
      if (item.list?.length) {
        item.list.forEach(block => {
          this.drawEraser(block)
        })
      }
    } else if (this.eraserList && this.eraserList.length) {
      this.eraserList.forEach(item => {
        if (item.list?.length) {
          item.list.forEach(block => {
            this.drawEraser(block)
          })
        }
      })
    }
  }

  // 创建mosaicInfo
  createMosaicInfo(x, y) {
    const newInfo = {
      id: canvasGlobalId++,
      type: 'mosaic',
      list: [],
      startX: x,
      startY: y
    }
    this.mosaicList.push(newInfo)
    this.mosaicLastX = 0
    this.mosaicLastY = 0
    return newInfo
  }

  handleMasaic(pointX, pointY) {
    const { ratio, mosaicDimensions } = this
    const dimensions = mosaicDimensions * ratio;
    // 计算当前鼠标位置应该绘制的方块左上角坐标
    const gridX = Math.floor(pointX / dimensions) * dimensions;
    const gridY = Math.floor(pointY / dimensions) * dimensions;
    // 由于是两个canvas，为了获取准确的颜色，需要将canvas合并后再取颜色
    const imageData = this.mergeCanvasImageData(
      gridX,
      gridY,
      dimensions,
      dimensions
    );
    const { data } = imageData
    const rgba = [0, 0, 0, 0];
    let count = 0
    const { length } = data;
    for (let i = 0; i < length; i += 4) {
      rgba[0] += data[i];
      rgba[1] += data[i + 1];
      rgba[2] += data[i + 2];
      count++
    }
    rgba[0] = Math.floor(rgba[0] / count)
    rgba[1] = Math.floor(rgba[1] / count)
    rgba[2] = Math.floor(rgba[2] / count)

    const fill = `rgba(${rgba[0]},${rgba[1]},${rgba[2]},1)`
    const mosaicRect = {
      left: gridX,
      top: gridY,
      fill,
      dimensions
    };
    // 去重
    const listLen = this.currentOperationInfo.list.length
    if (listLen) {
      const lastGridInfo = this.currentOperationInfo.list[listLen - 1]
      if (lastGridInfo.left === mosaicRect.left
        && lastGridInfo.top === mosaicRect.top) {
        return
      }
    }

    this.currentOperationInfo.list.push(mosaicRect);
    this.redrawCanvas()
  }

  // 判断是否在矩形内
  insideRect(rectX, rectY, rectWidth, rectHeight, pointX, pointY) {
    return (pointX >= rectX && pointX <= rectX + rectWidth)
      && (pointY >= rectY && pointY <= rectY + rectHeight)
  }

  // 合并两个canvas并获取图像数据
  mergeCanvasImageData(x, y, width, height) {
    const { canvas, canvasImg } = this
    if (!this.mergedCanvas) {
      this.createMergedCanvas()
    }
    const { mergedCanvas, mergedCtx } = this
    // 先清空临时画布
    mergedCtx.clearRect(0, 0, mergedCanvas.width, mergedCanvas.height);
    // 绘制 canvas1 内容到临时画布
    mergedCtx.drawImage(canvasImg, 0, 0);
    // 绘制 canvas2 内容到临时画布
    mergedCtx.drawImage(canvas, 0, 0);
    // 获取合并后的图像数据
    return mergedCtx.getImageData(x, y, width, height);

  }

  // 创建合并canvas
  createMergedCanvas() {
    const { canvas } = this
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    this.mergedCanvas = tempCanvas
    this.mergedCtx = tempCanvas.getContext('2d');
  }

  // 绘制马赛克方块
  drawMosaic(mosaicRect) {
    const { ctx } = this
    ctx.fillStyle = mosaicRect.fill;
    ctx.fillRect(mosaicRect.left, mosaicRect.top, mosaicRect.dimensions, mosaicRect.dimensions);
  }

  // 重新绘制masaic
  redrawMosaicList(item) {
    if (item) {
      item.list.forEach(mosaicRect => {
        this.drawMosaic(mosaicRect)
      })
    } else {
      this.mosaicList.forEach(mosaicItem => {
        mosaicItem.list.forEach(mosaicRect => {
          this.drawMosaic(mosaicRect)
        })
      })
    }

  }

  // 涂鸦功能
  drawScribble(item, isNormal = true) {
    const { ctx } = this
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath();
    ctx.strokeStyle = item.color; // 选择线条颜色
    ctx.lineWidth = item.width; // 选择线条宽度
    ctx.moveTo(item.startX, item.startY);
    ctx.lineTo(item.endX, item.endY);
    ctx.stroke();
    ctx.fill()
    ctx.closePath();
    // ctx.restore()

    if (isNormal) {
      // 绘制完后，更新startX/Y
      this.startX = item.endX
      this.startY = item.endY
    }
  }
  // 涂鸦数据校验与保存
  handleScribbleSaveAction() {
    if (this.currentTool === "scribble") {
      if (this.currentOperationInfo) {
        if(this.currentOperationInfo.list.length) {
          this.scribbleList.push(JSON.parse(JSON.stringify(this.currentOperationInfo)))
        } else {
          this.currentOperationInfo = null
        }
      }
    }
  }

  // 橡皮檫
  drawEraser(item) {
    const { ctx } = this
    ctx.beginPath(); // 开始新的路径
    // 若考虑成绘制矩形，则可以做前后值的去重
    ctx.arc(item.x, item.y, item.width, 0, Math.PI * 2); // 以当前点为中心绘制一个小圆点
    ctx.fillStyle = item.color;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fill();
    ctx.closePath(); // 结束路径
  }
  // 橡皮檫数据校验与保存
  handleEraserMouseUp() {
    if (this.currentTool === "eraser") {
      if (this.currentOperationInfo) {
        // 橡皮檫有效性判断
        if(this.currentOperationInfo.list.length) {
          this.eraserList.push(JSON.parse(JSON.stringify(this.currentOperationInfo)))
        } else {
          this.currentOperationInfo = null
        }
       
      }
      // 恢复成绘制状态
      this.ctx.globalCompositeOperation = 'source-over';
    }
  }

  handleTextMouseDown(startX, startY, isDoubleClick = false) {
    if (this.inTextEdit || this.addNewText) {
      this.isDrawing = false
      this.onListenEnlargeState = 'add'
      this.inTextEdit = true
      return
    }
    if (!this.textareaNode) {
      this.createTextarea()
    }
    const selectedText = this.getTextAtPosition(startX, startY);
    if (selectedText) {
      this.currentOperationInfo = selectedText
      this.currentOperationState = 'selected'
      setTimeout(() => {
        // 长按300ms后，鼠标改为拖动样式
        if (this.currentOperationState === 'selected') {
          this.modifyCursor('move')
        }
      }, 300)
    } else {
      const newText = {
        id: canvasGlobalId++,
        type: 'text',
        text: '',
        color: this.currentColor,
        lineWidth: this.textFontWeight - 0,
        fontSize: this.textFontSize - 0,
        lineHeight: 1,
        maxWidth: this.canvasWidth,
        startX,
        startY,
        width: 2,
        height: this.textFontSize - 0
      }
      this.addNewText = true
      this.currentOperationState = 'add'
      this.currentOperationInfo = newText
      this.showTextareaNode()
      this.isDrawing = false
    }
  }

  handleTextMouseMove(currentX, currentY) {
    if (!this.isDrawing) {
      return
    }
    const { currentOperationInfo } = this
    if (this.currentOperationState === 'move' || this.currentOperationState === 'selected') {
      this.currentOperationState = 'move'
      if (this.canvasCursor !== 'move') {
        this.modifyCursor('move')
      }
      const dx = currentX - this.startX
      const dy = currentY - this.startY
      currentOperationInfo.startX += dx
      currentOperationInfo.startY += dy
      this.redrawCanvas()
      this.startX = currentX
      this.startY = currentY
    }
  }

  handleTextMouseUp() {
    console.log('handleTextMouseUp');
    const newClickTime = new Date().getTime();
    if (this.inTextEdit) {
      this.exitTextEditStatus()
      this.modifyCursor('auto')
    } else if (this.currentOperationState === 'selected') {
      if (this._isDoubleClick(newClickTime)) {
        this.currentOperationState = 'edit'
        this.handleTextEditAgainOrMove(this.currentOperationInfo, true)
      } else {
        // 选中但未拖动
        this.isDrawing = false
        this.modifyCursor('auto')
      }
      this._lastClickTime = newClickTime;
    } else if (this.currentOperationState === 'edit') {
      this.exitTextEditStatus()
    } else if (this.currentOperationState === 'add') {
      this.inTextEdit = true
    } else if (this.isDrawing || this.currentOperationState === 'move') {
      this.isDrawing = false
      this.saveAction()
    }
  }

  handleTextSaveAction() {
    if (this.currentTool === 'text' && !this.inTextEdit) {
      const newItem = JSON.parse(JSON.stringify(this.currentOperationInfo))
      const same = this.textList.find(item => item.id === newItem.id)
      if (!same && newItem.text) {
        this.textList.push(newItem)
      } else {
        const beforeTextInfo = this.beforeTextInfo || {}
        // 历史栈中文本去重
        const noChange = newItem.id === beforeTextInfo.id
          && newItem.text === beforeTextInfo.text
          && newItem.startX === beforeTextInfo.startX
          && newItem.startY === beforeTextInfo.startY
          && newItem.fontSize === beforeTextInfo.fontSize
          && newItem.color === beforeTextInfo.color
        if (noChange || newItem.text === '') {
          this.currentOperationInfo = null
        }
      }
    }
  }

  // 区分文本二次编辑还是移动，采用mousedown 和mouseup 模拟click事件
  handleTextEditAgainOrMove(selectedText, isDoubleClick) {
    const { ctx } = this
    if (isDoubleClick) {
      // 双击状态是编辑文本
      this.currentOperationInfo = selectedText
      this.currentOperationState = 'edit'
      this.showTextareaNode()

      this.beforeTextInfo = JSON.parse(JSON.stringify(selectedText)) // 记录下文本编辑前的状态，用于区分前后是否变化
      selectedText.colorBackup = selectedText.color
      selectedText.color = 'rgba(0,0,0, 0)'
      this.inTextEdit = true
      this.redrawCanvas()
      setTimeout(() => {
        this.textareaNode.focus()
      }, 300)
    } else {
      // 拖动文本
      this.currentOperationInfo = selectedText
      this.currentOperationState = 'move'
      this.modifyCursor('move')
    }
  }

  // 退出文本编辑状态
  exitTextEditStatus() {
    if (this.currentTool === 'text' && (this.inTextEdit)) {
      this.inTextEdit = false
      this.addNewText = false
      const beforeText = this.currentOperationInfo.text
      this.currentOperationInfo.text = this.textareaNode.value
      this.hideTextareaNode()
      if (this.currentOperationInfo.colorBackup) {
        this.currentOperationInfo.color = this.currentOperationInfo.colorBackup
        this.currentOperationInfo.colorBackup = null
      }
      if (beforeText === this.currentOperationInfo.text && beforeText === '') {
        // 前后文本都是空，不计入历史栈
        return
      }
      this.handleTextSaveAction()
      this.saveAction()
      this.redrawCanvas()
    }
  }

  redrawTextList(item) {
    if (item) {
      this.drawText(item)
    } else {
      this.textList.forEach(text => {
        this.drawText(text)
      })
    }

  }

  // 文本
  // drawText(item) {
  //   const { ctx } = this
  //   ctx.font = `${item.fontSize}px serif`
  //   // 设置文本的填充颜色
  //   ctx.fillStyle = item.color; // 文本填充颜色
  //   // 设置文本的描边颜色
  //   ctx.strokeStyle = item.color; // 文本描边颜色
  //   // 设置描边宽度
  //   ctx.lineWidth = item.lineWidth; // 描边宽度
  //   ctx.fillText(item.text, item.startX, item.startY, item.maxWidth);
  // }
  drawText(item, isHide = false) {
    this.ctx.globalCompositeOperation = 'source-over';
    const { ctx } = this
    ctx.font = `${item.fontSize}px serif`
    ctx.textBaseline = 'top';

    const metrics = this._getTextMetrics(item);
    let y = item.startY

    // 绘制边框
    // let borderColor = isHide ? 'rgba(0, 0, 0, 0)' : 'rgb(118, 118, 118)'
    // ctx.strokeStyle = borderColor;
    // ctx.lineWidth = 1;
    // ctx.strokeRect(item.startX - 1, item.startY - 1, metrics.width + 2, metrics.height + 2);

    // 绘制文本
    let fillColor = isHide ? 'rgba(0, 0, 0, 0)' : item.color
    metrics.lines.forEach((line) => {
      ctx.fillStyle = fillColor;
      ctx.fillText(line, item.startX, y);
      y += item.fontSize * item.lineHeight;
    });
    // 返回边框的宽高
    let width = metrics.width < 2 ? 2 : metrics.width
    return { width: width, height: metrics.height };
  }
  // 文本度量
  _getTextMetrics(item) {
    const { ctx } = this
    const lines = item.text.split('\n');
    const lineMetrics = lines.map(line => this._splitTextIntoLines(line, item));
    let allLineWidth = lineMetrics.map(line => ctx.measureText(line).width)
    const maxWidth = Math.max(...allLineWidth)
    const totalHeight = lineMetrics.length * item.fontSize * item.lineHeight;
    return { width: maxWidth, height: totalHeight, lines: lineMetrics.flat() };
  }
  // 将输入的文本换行
  _splitTextIntoLines(text, item) {
    const { ctx } = this
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (item.maxWidth && width > item.maxWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine += ' ' + word;
      }
    }
    lines.push(currentLine);
    return lines;
  }
  // 更新文本域宽高
  updateTextarea() {
    this.currentOperationInfo.text = this.textareaNode.value
    let { width, height } = this.drawText(this.currentOperationInfo, true)
    const ratio = this.getCanvasRatio()
    this.currentOperationInfo.width = width
    this.currentOperationInfo.height = height
    this.textareaNode.style.width = `${Math.ceil(width / ratio)}px`
    this.textareaNode.style.height = `${Math.ceil(height / ratio)}px`
  }
  // 设置字体大小
  setTextFontSize(fontSize) {
    this.textFontSize = fontSize - 0
  }

  // 设置字体宽度
  setTextFontWight(fontWight) {
    this.textFontWeight = fontWight
  }

  // 创建文本域
  createTextarea() {
    const container = this.canvasParent;
    const textarea = document.createElement('textarea');
    const ratio = this.getCanvasRatio()

    textarea.className = 'canvas-textarea';
    const textStyleObj = {
      position: 'absolute',
      padding: '0px',
      display: 'none',
      border: '1px bold #000',
      overflow: 'hidden',
      resize: 'none',
      outline: 'none',
      'border-radius': '0px',
      'background-color': 'transparent',
      appearance: 'none',
      'z-index': 99999,
      'white-space': 'pre',
      width: '2px',
      height: `${this.textFontSize}px`,
      transform: 'rotate(0deg)',
      'text-align': 'left',
      'line-height': 1,
      color: 'rgb(255, 52, 64)',
      'font-size': `${Math.ceil((this.textFontSize - 0) / ratio)}px`,
      'font-family': 'serif',
      'font-weight': 'normal',
      'transform-origin': 'left top',
      border: '1px solid light-dark(rgb(118, 118, 118), rgb(133, 133, 133));'
    }
    let styleStr = Object.keys(textStyleObj).map(item => {
      return `${item}:${textStyleObj[item]};`
    }).join('')
    textarea.setAttribute('style', styleStr);

    container.appendChild(textarea);
    this.textareaNode = textarea;

    // 处理 Enter 键，完成文本输入
    this.textareaNode.addEventListener('input', (e) => {
      if(this.textareaNode?.style.display === 'block') {
        this.updateTextarea()
        if (e.key === 'Enter') {
          this.textareaNode.style.height = `${this.currentOperationInfo.height + this.currentOperationInfo.fontSize - 0}px`
        }
      }
    });
  }
  showTextareaNode() {
    const { startX, startY, color, text, width, height, fontSize } = this.currentOperationInfo
    const ratio = this.getCanvasRatio()

    this.textareaNode.style.left = `${startX}px`
    this.textareaNode.style.top = `${startY}px`
    this.textareaNode.style.color = color
    this.textareaNode.style.fontSize = `${Math.ceil(fontSize / ratio)}px`
    this.textareaNode.style.width = `${Math.ceil(width / ratio)}px`
    this.textareaNode.style.height = `${Math.ceil(height / ratio)}px`
    this.textareaNode.style.display = 'block';
    this.textareaNode.value = text;
    setTimeout(() => {
      this.textareaNode.focus()
    }, 30)
  }

  hideTextareaNode() {
    if (this.textareaNode && this.textareaNode.style.display !== 'none') {
      this.textareaNode.style.display = 'none'
    }
  }

  // 获取文本
  getTextAtPosition(x, y) {
    // 从后往前遍历，找到最上面的文本
    const { textList, ctx } = this
    for (let i = textList.length - 1; i >= 0; i--) {
      const textObject = textList[i];
      const { startX, startY, width, height } = textObject
      if (this.insideRect(startX, startY, width, height, x, y)) {
        return textObject
      }
    }
    return null;
  }

  handleRectMouseDown() {
    this.rectOperationState = ''
    const { startX, startY } = this
    const list = this.rectList
    let selected = false
    if (list && list.length > 0) {
      let rect = null
      for (let len = list.length, i = len - 1; i >= 0; i--) {
        rect = list[i]
        // if (this.inArc(this.startX, this.startY, this.endPointRadius, rect.allPointList)) {
        //   this.rectOperationState = 'resize'
        //   this.currentOperationInfo = rect
        //   this.modifyCursor('e-resize')
        //   selected = true
        //   break;
        // }
        // eslint-disable-next-line no-loop-func
        const isNearKeyPoint = rect.endPointList.some((point, index) => {
          if (this.insideRect(point[0], point[1], rect.endPointWidth, rect.endPointWidth, startX, startY)) {
            this.indexChoosePoint = index
            return true
          }
          return false
        });
        if (isNearKeyPoint) {
          this.rectOperationState = 'resize'
          this.currentOperationInfo = rect
          this.setRectEndPointCursor(this.indexChoosePoint)
          this.changeCurrentShapeOnMouseDown(rect)
          this.setCurrentShapeId(rect.id)
          this.redrawCanvas()
          // this.modifyCursor('e-resize')
          selected = true
          break;
          // } else if (this.inShape(this.startX, this.startY, rect.allPointList)) {
        } else if (this.inLine(this.startX, this.startY, rect.pointList, rect)) {
          // 在矩形边上
          selected = true
          this.rectOperationState = 'move'
          this.currentOperationInfo = rect
          this.modifyCursor('move')
          this.changeCurrentShapeOnMouseDown(rect)
          this.setCurrentShapeId(rect.id)
          this.redrawCanvas()
          break
        }
      }
    }
    if (!selected) {
      this.rectOperationState = 'add'
      const newRect = {
        id: canvasGlobalId++,
        type: 'rect',
        startX: this.startX,
        startY: this.startY,
        width: 0,
        height: 0,
        color: this.currentColor,
        lineWidth: this.currentWidth,
        endPointColor: this.endPointColor,
        endPointWidth: this.endPointWidth,
        pointList: [
          [this.startX, this.startY],// 左上角
          [this.startX, this.startY],// 右上角
          [this.startX, this.startY],// 右下角
          [this.startX, this.startY],// 左下角
        ],
        endPointList: []
      }
      this.rectList.push(newRect)
      this.currentOperationInfo = newRect
      this.setCurrentShapeId(newRect.id)
    }
    this.beforeOperationInfo = JSON.parse(JSON.stringify(this.currentOperationInfo))
  }

  handleRectMouseMove(currentX, currentY) {
    if (this.rectOperationState === 'move') {
      // 修改矩形位置
      const dx = currentX - this.startX
      const dy = currentY - this.startY
      this.currentOperationInfo.startX += dx
      this.currentOperationInfo.startY += dy
      this.resizeRectWidthAndPoint(
        this.currentOperationInfo.pointList[2][0] + dx,
        this.currentOperationInfo.pointList[2][1] + dy
      )
      this.startX = currentX
      this.startY = currentY

    } else if (this.rectOperationState === 'resize') {
      this.stretch(currentX, currentY, this.currentOperationInfo)
    } else if (this.rectOperationState === 'add') {
      this.resizeRectWidthAndPoint(currentX, currentY)
    }

  }
  handleRectMouseUp() {
    if (this.currentTool === "rect") {
      if (this.rectOperationState === 'add') {
        // 判断新增矩形是否符合
        if (this.currentOperationInfo.width === 0 || this.currentOperationInfo.height === 0) {
          this.rectList.pop()
          this.setCurrentShapeId()
          this.currentOperationInfo = null
        } else {
          this.setRectEndPointCursor()
        }
      }
      // 重复点击则移除
      if (this.beforeOperationInfo && this.currentOperationInfo) {
        if (this.beforeOperationInfo.startX === this.currentOperationInfo.startX
          && this.beforeOperationInfo.startY === this.currentOperationInfo.startY
          && this.beforeOperationInfo.width === this.currentOperationInfo.width
          && this.beforeOperationInfo.height === this.currentOperationInfo.height
        ) {
          this.currentOperationInfo = null
        }
      }
    }
  }

  // 矩形
  drawRect(item) {
    const { ctx } = this
    const { width, height, pointList = [] } = item
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = item.lineWidth || 2;
    ctx.strokeStyle = item.color || 'black';
    const startX = pointList[0][0]
    const startY = pointList[0][1]
    item.startX = startX
    item.startY = startY

    ctx.strokeRect(item.startX, item.startY, item.width, item.height);

    // 获取端点信息
    this.getRectEndPointList(item)
    // 绘制矩形中4个边角点和4边的中间点
    // const isDrawEndPoint = (width > item.endPointWidth * 3) && (height > item.endPointWidth * 3)
    if (this.checkCurrentShapeId(item.id)) {
      this.drawRectEndPoint(item)
    }
  }

  redrawRectList(item) {
    if (item) {
      this.drawRect(item)
    } else if (this.rectList?.length) {
      this.rectList.forEach(item => {
        this.drawRect(item)
      })
    }
  }

  // 生成并绘制矩形的端点
  getRectEndPointList(rect, isDrawEndPoint) {
    const { width, height, endPointWidth, pointList } = rect
    const [startX, startY] = pointList[0]
    const endPointHalfWidth = endPointWidth / 2
    const iHalfWidth = Math.round(width / 2);
    const iHalfHeight = Math.round(height / 2);
    const aPointX = [
      startX - endPointHalfWidth, startX + iHalfWidth - endPointHalfWidth, startX + width - endPointHalfWidth,
      startX - endPointHalfWidth, startX + width - endPointHalfWidth,
      startX - endPointHalfWidth, startX + iHalfWidth - endPointHalfWidth, startX + width - endPointHalfWidth
    ];
    const aPointY = [
      startY - endPointHalfWidth, startY - endPointHalfWidth, startY - endPointHalfWidth,
      startY + iHalfHeight - endPointHalfWidth, startY + iHalfHeight - endPointHalfWidth,
      startY + height - endPointHalfWidth, startY + height - endPointHalfWidth, startY + height - endPointHalfWidth
    ];
    const endPointList = []
    for (let i = 0; i < 8; i++) {
      endPointList.push([aPointX[i], aPointY[i]])
    }
    rect.endPointList = endPointList
    if (isDrawEndPoint) {
      this.drawRectEndPoint(rect)
    }
  }
  drawRectEndPoint(rect) {
    const { ctx } = this
    const { endPointWidth, endPointColor } = rect
    rect?.endPointList.forEach((point) => {
      ctx.fillStyle = endPointColor;
      ctx.beginPath();
      ctx.fillRect(point[0], point[1], endPointWidth, endPointWidth)
      ctx.fill();
      ctx.closePath();
    })
  }

  setRectEndPointCursor() {
    const { indexChoosePoint } = this
    //   'w-resize': 'w-resize', // 基于纵轴左右调整
    // 's-resize': 's-resize', // 基于纵轴上下调整
    // 'nesw-resize': 'nesw-resize', // 基于纵轴东北-西南调整
    // 'nwse-resize': 'nwse-resize', // 基于纵轴西北-东南调整
    if ([1, 6].includes(indexChoosePoint)) {
      this.modifyCursor('s-resize')
    } else if ([3, 4].includes(indexChoosePoint)) {
      this.modifyCursor('w-resize')
    } else if ([0, 7].includes(indexChoosePoint)) {
      this.modifyCursor('nwse-resize')
    } else if ([2, 5].includes(indexChoosePoint)) {
      this.modifyCursor('nesw-resize')
    } else {
      this.modifyCursor('auto')
    }
  }

  checkRectPoint(list, currentX, currentY) {
    let selectedId = -1
    if (list && list.length > 0) {
      let rect = null
      for (let len = list.length, i = len - 1; i >= 0; i--) {
        rect = list[i]
        // eslint-disable-next-line no-loop-func
        const isNearKeyPoint = rect.endPointList.some((point, index) => {
          if (this.insideRect(point[0], point[1], rect.endPointWidth, rect.endPointWidth, currentX, currentY)) {
            this.indexChoosePoint = index
            return true
          }
          return false
        });
        if (isNearKeyPoint) {
          this.setRectEndPointCursor(this.indexChoosePoint)
          selectedId = rect.id
          break;
          // } else if (this.inShape(this.startX, this.startY, rect.allPointList)) {
        } else if (this.inLine(currentX, currentY, rect.pointList, rect)) {
          // 在矩形边上
          selectedId = rect.id
          this.modifyCursor('move')
          break
        }
      }
    }
    return {
      id: selectedId,
      type: 'rect'
    }
  }

  // 判断一个点是否在多边形内部
  // 这个算法基于射线交叉法，它通过计算从给定点出发的一条水平线与多边形边界的交点数来判断点是否在多边形内部。
  // 如果交点数为奇数，则认为点在多边形内部；如果交点数为偶数，则认为点在多边形外部。
  inShape(iPointX, iPointY, aPoint = []) {
    let bRet = false; // 初始化返回值为 false
    // 获取多边形顶点的数量
    const iLen = aPoint.length;
    // 遍历多边形的每条边
    for (let i = 0, j = iLen - 1; i < iLen; j = i++) {
      // 当前边的两个顶点
      const [x1, y1] = aPoint[i];
      const [x2, y2] = aPoint[j];

      // 判断当前边是否与水平线相交
      // 通过比较两点的 y 坐标是否在水平线的两侧
      if (((y1 > iPointY) !== (y2 > iPointY)) &&
        // 如果相交，则判断水平线与当前边的交点是否在点的左侧
        (iPointX < (x2 - x1) * (iPointY - y1) / (y2 - y1) + x1)) {
        bRet = !bRet; // 如果相交且在左侧，则翻转 bRet 的值
      }
    }

    return bRet; // 返回最终结果
  }

  // 判断一个点是否在圆形边界内
  // chooseEnabled 的作用是，点击时选中，浮动时不要选中，从而保证与交互设计一致
  inArc(iPointX, iPointY, iRadius, aPoint = [], chooseEnabled = true) {
    // 打印调试信息
    let bRet = false; // 初始化返回值为 false

    // 获取点集的长度
    const iLen = aPoint.length;

    // 遍历每个圆心点
    for (let i = 0; i < iLen; i++) {
      // 计算点到圆心的距离
      const iDistance = Math.sqrt(
        (iPointX - aPoint[i][0]) * (iPointX - aPoint[i][0]) +
        (iPointY - aPoint[i][1]) * (iPointY - aPoint[i][1])
      );

      // 判断距离是否小于等于半径
      if (iDistance < iRadius) {
        bRet = true; // 标记为在圆形边界内

        // 根据 chooseEnabled 的值决定是否选中
        if (chooseEnabled) {
          this.indexChoosePoint = i; // 选中当前圆心点
        }

        // 找到符合条件的第一个圆心点后，跳出循环
        break;
      }
    }
    return bRet; // 返回最终结果
  }

  //判断是否在边界线上
  inLine(px, py, aPoint = []) {
    let point = [px, py]
    // 提取出矩形的最小和最大 x、y 坐标来形成边界框  
    let minX = Math.min(aPoint[0][0], aPoint[1][0], aPoint[2][0], aPoint[3][0]);
    let maxX = Math.max(aPoint[0][0], aPoint[1][0], aPoint[2][0], aPoint[3][0]);
    let minY = Math.min(aPoint[0][1], aPoint[1][1], aPoint[2][1], aPoint[3][1]);
    let maxY = Math.max(aPoint[0][1], aPoint[1][1], aPoint[2][1], aPoint[3][1]);

    // 检查点是否在矩形的边界框内（但不包括内部）  
    // 注意：这里我们稍微放宽了条件，因为我们要包括边界上的点  
    if (point[0] < minX || point[0] > maxX || point[1] < minY || point[1] > maxY) {
      // 如果点不在边界框内（包括边界），则直接返回 false  
      return false;
    }

    // 现在检查点是否正好在矩形的某条边上  
    // 这需要比较点与矩形顶点的坐标  
    for (let i = 0; i < aPoint.length; i++) {
      const [x1, y1] = aPoint[i];
      const [x2, y2] = aPoint[(i + 1) % aPoint.length];

      // 检查点是否在由 (x1, y1) 和 (x2, y2) 定义的边上  
      // 这可以通过检查点的 y 坐标是否等于 y1 或 y2（对于水平边）  
      // 或者检查点的 x 坐标是否等于 x1 或 x2（对于垂直边）  
      // 并且同时检查另一个坐标是否在线段的对应坐标之间（包括端点）  
      if ((y1 === point[1] && point[0] >= Math.min(x1, x2) && point[0] <= Math.max(x1, x2)) ||
        (x1 === point[0] && point[1] >= Math.min(y1, y2) && point[1] <= Math.max(y1, y2))) {
        return true;
      }
    }

    // 如果点不在任何边上，则返回 false  
    return false;

    // 该方案存在异常，在矩形边的延长直线上也会被判断为在矩形边上
    // let isOnEdge = false;
    // for (let i = 0; i < aPoint.length; i++) {
    //   const p1 = aPoint[i];
    //   const p2 = aPoint[(i + 1) % aPoint.length];
    //   const x1 = p1[0];
    //   const y1 = p1[1];
    //   const x2 = p2[0];
    //   const y2 = p2[1];
    //   // 计算点到直线的距离
    //   const distance = Math.abs((y2 - y1) * px - (x2 - x1) * py + x2 * y1 - y2 * x1) / Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);
    //   // 如果点到某条边的距离小于等于0，说明点在这条边上
    //   if (distance <= 2) {
    //     isOnEdge = true;
    //     this.m_iInsertPos = i + 1;
    //     break;
    //   }
    // }
    // return isOnEdge;
  }

  // 修改鼠标效果
  modifyCursor(type) {
    const cssCursor = cursorTypeMap[type]
    if (cssCursor) {
      this.canvasCursor = cssCursor
      this.canvas.style.cursor = cssCursor
    }
  }

  //拉伸矩形
  stretch(iPointX, iPointY, item) {
    const { editType = 0, pointList = [] } = item
    if (editType === 0) {
      let changed = false
      if (this.indexChoosePoint === 0) {
        if (iPointX < pointList[2][0] && iPointY < pointList[2][1]) {
          pointList[0][0] = iPointX;
          pointList[0][1] = iPointY;
          pointList[3][0] = iPointX;
          pointList[1][1] = iPointY;
          changed = true
        }
      } else if (this.indexChoosePoint === 1) {
        if (iPointY < pointList[2][1]) {
          pointList[0][1] = iPointY;
          pointList[1][1] = iPointY;
          changed = true
        }
      } else if (this.indexChoosePoint === 2) {
        if (iPointX > pointList[3][0] && iPointY < pointList[3][1]) {
          pointList[1][0] = iPointX;
          pointList[1][1] = iPointY;
          pointList[2][0] = iPointX;
          pointList[0][1] = iPointY;
          changed = true
        }
      } else if (this.indexChoosePoint === 3) {
        if (iPointX < pointList[2][0]) {
          pointList[0][0] = iPointX;
          pointList[3][0] = iPointX;
          changed = true
        }
      } else if (this.indexChoosePoint === 4) {
        if (iPointX > pointList[0][0]) {
          pointList[1][0] = iPointX;
          pointList[2][0] = iPointX;
          changed = true
        }
      } else if (this.indexChoosePoint === 5) {
        if (iPointX < pointList[1][0] && iPointY > pointList[1][1]) {
          pointList[3][0] = iPointX;
          pointList[3][1] = iPointY;
          pointList[0][0] = iPointX;
          pointList[2][1] = iPointY;
          changed = true
        }
      } else if (this.indexChoosePoint === 6) {
        if (iPointY > pointList[1][1]) {
          pointList[2][1] = iPointY;
          pointList[3][1] = iPointY;
          changed = true
        }
      } else if (this.indexChoosePoint === 7) {
        if (iPointX > pointList[0][0] && iPointY > pointList[0][1]) {
          pointList[2][0] = iPointX;
          pointList[2][1] = iPointY;
          pointList[1][0] = iPointX;
          pointList[3][1] = iPointY;
          changed = true
        }
      }
      if (changed) {
        const width = pointList[2][0] - pointList[0][0]
        const height = pointList[2][1] - pointList[0][1]
        item.width = width
        item.height = height
        this.redrawCanvas()
      }

    }
  }

  // 圆按下鼠标时的处理
  handleCircleMouseDown(startX, startY) {
    const list = this.circleList
    let selected = false
    let circle = null
    if (list && list.length) {
      for (let i = 0, len = list.length; i < len; i++) {
        circle = list[i]
        // 检查鼠标是否靠近端点
        this.indexChoosePoint = -1
        // eslint-disable-next-line no-loop-func
        const isNearKeyPoint = circle.endPointList.some((point, index) => {
          if (this.insideRect(point.x, point.y, circle.endPointWidth, circle.endPointWidth, startX, startY)) {
            this.indexChoosePoint = index
            return true
          }
          return false
        });

        if (isNearKeyPoint) {
          this.currentOperationState = 'resize'
          this.currentOperationInfo = circle
          selected = true
          this.changeCurrentShapeOnMouseDown(circle)
          this.setCurrentShapeId(circle.id)
          this.redrawCanvas()
          this.setCircleEndPointCursor() // 设置鼠标样式
          break

        }
        const inCircleRing = this.isPointInEllipseRing(circle, startX, startY)
        if (inCircleRing) {
          selected = true
          this.currentOperationInfo = circle
          this.currentOperationState = 'move'
          this.modifyCursor('move')
          this.changeCurrentShapeOnMouseDown(circle)
          this.setCurrentShapeId(circle.id)
          this.redrawCanvas()
          break;
        }
      }
    }
    if (!selected) {
      const newCircle = {
        id: canvasGlobalId++,
        type: 'circle',
        startX,
        startY,
        radiusX: 0,
        radiusY: 0,
        color: this.currentColor,
        lineWidth: this.currentWidth,
        endPointFillColor: '#fff', // 端点内填充颜色
        endPointWidth: this.endPointWidth, // 端点宽度
        endPointList: [], // 端点位置
      }
      this.circleList.push(newCircle)
      this.currentOperationInfo = newCircle
      this.currentOperationState = 'add'
      this.setCurrentShapeId(this.currentOperationInfo.id)
    }
    this.beforeOperationInfo = JSON.parse(JSON.stringify(this.currentOperationInfo))

  }

  // 圆-拖动鼠标处理
  handleCircleMouseMove(currentX, currentY) {
    if (this.currentOperationInfo) {
      if (this.currentOperationState === 'resize') {
        const { indexChoosePoint } = this
        if ([4, 5, 6, 7].includes(indexChoosePoint)) {
          // 在四个边角，
          const rX = Math.abs(currentX - this.currentOperationInfo.startX)
          const rY = Math.abs(currentY - this.currentOperationInfo.startY)
          this.currentOperationInfo.radiusX = rX
          this.currentOperationInfo.radiusY = rY
        } else if ([0, 2].includes(indexChoosePoint)) {
          // 在上下两个点，修改rY
          this.currentOperationInfo.radiusY = Math.abs(currentY - this.currentOperationInfo.startY)
        } else if ([1, 3].includes(indexChoosePoint)) {
          // 左右两个点，修改rX
          this.currentOperationInfo.radiusX = Math.abs(currentX - this.currentOperationInfo.startX)
        }
        this.redrawCanvas()
      } else if (this.currentOperationState === 'move') {
        const dx = currentX - this.startX
        const dy = currentY - this.startY
        this.currentOperationInfo.startX += dx
        this.currentOperationInfo.startY += dy
        this.redrawCanvas()
        this.startX = currentX
        this.startY = currentY
      } else if (this.currentOperationState === 'add') {
        const dx = currentX - this.currentOperationInfo.startX
        const dy = currentY - this.currentOperationInfo.startY
        // ctx.ellipse 要求半径大于0
        if (dx > 0 && dy > 0) {
          this.currentOperationInfo.radiusX = dx
          this.currentOperationInfo.radiusY = dy
          this.redrawCanvas()
        }
      }
    }

  }

  handleCircleMouseUp() {
    if (this.currentTool === 'circle') {
      // 先判断当前图像是否符合
      if (this.currentOperationState === 'add' &&
        (this.currentOperationInfo.radiusX == 0
          || this.currentOperationInfo.radiusY === 0)) {
        // 是新增状态且半径为空的圆，需要剔除
        this.circleList.pop()
        this.setCurrentShapeId()
        this.currentOperationInfo = null
      } else {
        this.setCircleEndPointCursor() // 设置鼠标样式
      }
      // 若是重复点击，也一样不历史栈
      if (this.beforeOperationInfo && this.currentOperationInfo) {
        const noChange = this.currentOperationInfo.startX === this.beforeOperationInfo.startX
          && this.currentOperationInfo.startY === this.beforeOperationInfo.startY
          && this.currentOperationInfo.radiusX === this.beforeOperationInfo.radiusX
          && this.currentOperationInfo.radiusY === this.beforeOperationInfo.radiusY
        if (noChange) {
          this.currentOperationInfo = null
        }
      }
    }
  }

  drawCircle(circle) {
    const { ctx } = this
    ctx.beginPath();
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = circle.color
    ctx.lineWidth = circle.lineWidth
    ctx.ellipse(circle.startX, circle.startY, circle.radiusX, circle.radiusY, 0, 0, 2 * Math.PI);
    ctx.stroke();

    // 计算边上8个点
    const keyPoints = this.getCircleEndPoints(circle);
    circle.endPointList = keyPoints
    if (this.checkCurrentShapeId(circle.id)) {
      this.drawCirclePoint(circle)
    }

  }

  // 绘制圆的端点
  drawCirclePoint(circle) {
    const { ctx } = this
    // if (circle.radiusX > 3 * circle.endPointWidth && circle.radiusY > 3 * circle.endPointWidth) {
    circle.endPointList.forEach(point => {
      ctx.fillStyle = circle.endPointFillColor;
      ctx.beginPath();
      ctx.fillRect(point.x, point.y, circle.endPointWidth, circle.endPointWidth)
      ctx.fill();
      ctx.closePath();
    });
    // }
  }


  redrawCircleList(item) {
    if (item) {
      this.drawCircle(item)
    } else {
      this.circleList.forEach(circle => {
        this.drawCircle(circle)
      })
    }
  }

  // 计算关键点坐标
  getCircleEndPoints(circle) {
    const { startX, startY, radiusX, radiusY, endPointWidth } = circle
    const distance = endPointWidth / 2
    const points = [
      { x: startX - distance, y: startY - radiusY - distance }, // 上
      { x: startX + radiusX - distance, y: startY - distance }, // 右
      { x: startX - distance, y: startY + radiusY - distance }, // 下
      { x: startX - radiusX - distance, y: startY - distance }, // 左
      { x: startX - radiusX - distance, y: startY - radiusY - distance }, // 左上
      { x: startX + radiusX - distance, y: startY - radiusY - distance }, // 右上
      { x: startX + radiusX - distance, y: startY + radiusY - distance }, // 右下
      { x: startX - radiusX - distance, y: startY + radiusY - distance } // 左下
    ];
    return points;
  }

  // resize下设置圆的端点样式
  setCircleEndPointCursor() {
    const { indexChoosePoint } = this
    // 'w-resize': 'w-resize', // 基于纵轴左右调整
    // 's-resize': 's-resize', // 基于纵轴上下调整
    // 'nesw-resize': 'nesw-resize', // 基于纵轴东北-西南调整
    // 'nwse-resize': 'nwse-resize', // 基于纵轴西北-东南调整
    if ([0, 2].includes(indexChoosePoint)) {
      this.modifyCursor('s-resize')
    } else if ([1, 3].includes(indexChoosePoint)) {
      this.modifyCursor('w-resize')
    } else if ([4, 6].includes(indexChoosePoint)) {
      this.modifyCursor('nwse-resize')
    } else if ([5, 7].includes(indexChoosePoint)) {
      this.modifyCursor('nesw-resize')
    } else {
      this.modifyCursor('auto')
    }
  }

  // 鼠标点是否在圆边上
  isPointInEllipseRing(circle, mouseX, mouseY) {
    const { startX, startY, radiusX, radiusY, lineWidth } = circle
    const dx = mouseX - startX;
    const dy = mouseY - startY;

    // 对鼠标坐标进行标准化
    const normalizedX = dx / radiusX;
    const normalizedY = dy / radiusY;

    // 计算标准化后的距离
    const distance = Math.sqrt(normalizedX ** 2 + normalizedY ** 2);

    // 根据线宽计算边缘的内外距离
    const outerRadius = 1 + (lineWidth / 2) / Math.max(radiusX, radiusY);
    const innerRadius = 1 - (lineWidth / 2) / Math.max(radiusX, radiusY);

    // 判断距离是否在边缘范围内
    return distance >= innerRadius && distance <= outerRadius;
  }

  resizeRectWidthAndPoint(currentX, currentY) {
    const width = currentX - this.currentOperationInfo.startX;
    const height = currentY - this.currentOperationInfo.startY;
    // 计算右下角位置
    const rightBottomX = this.currentOperationInfo.startX + width
    const rightBottomY = this.currentOperationInfo.startY + height
    // 修改矩形四个角位置
    this.currentOperationInfo.pointList[0] = [this.currentOperationInfo.startX, this.currentOperationInfo.startY]// 左上角位置
    this.currentOperationInfo.pointList[1] = [rightBottomX, this.currentOperationInfo.startY]// 右上角位置
    this.currentOperationInfo.pointList[2] = [rightBottomX, rightBottomY]// 右下角位置
    this.currentOperationInfo.pointList[3] = [this.currentOperationInfo.startX, rightBottomY]// 左下角位置
    this.currentOperationInfo.width = width;
    this.currentOperationInfo.height = height;
    this.redrawCanvas()
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
    if (this.undoStack.length > 0) {
      const redoAction = this.undoStack.pop();
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
      this.redrawCanvas()
      this.onListenRedoState()
      this.onListenUndoState()
      this.onListenClearState()
    }
  }

  // 监听撤销状态
  onListenUndoState() {
    const state = this.actions.length > 0
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
    const state = this.undoStack.length > 0
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
    this.clearCanvas()
    this.actions = []
    this.redoAction = []
    this.undoStack = []
    Object.values(this.typeAndShapeMap).forEach(key => {
      this[key] = []
    })
    this.restoreScale()
    this.hideTextareaNode()
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
      if (this[funcName]) {
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
    let list = []
    let map = []
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

  // 保存图像（下载或者返回blob）
  download(isBlob = false, name = 'merged_image') {
    return new Promise((resove) => {
      // 先移除激活状态
      this.clearActiveShape()
      // 创建临时canvas，用于图像合并
      const mergedCanvas = document.createElement('canvas');
      mergedCanvas.width = this.canvasWidth;
      mergedCanvas.height = this.canvasHeight;
      const mergedCtx = mergedCanvas.getContext('2d');
      mergedCtx.drawImage(this.canvasImg, 0, 0);
      mergedCtx.drawImage(this.canvas, 0, 0);
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
    })

  }

  changeColor(val) {
    this.currentColor = val
  }

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
  // 另一种缩放方案，缩放canvas画布
  // 和通过样式调整canvas实现缩放的区别：需要重新计算其余图形位置，而样式缩放无需重新重新计算位置
  // drawScale() {
  //   const { ctx, ctxImg, scaleRadio, scaleOriginX, scaleOriginY, canvasWidth, canvasHeight, imgNode } = this
  //   console.log(' scaleRadio-----', scaleRadio);
  //   if (imgNode) {
  //     // 放大图片canvas
  //     ctxImg.clearRect(0, 0, canvasWidth, canvasHeight)
  //     ctxImg.save()
  //     ctxImg.translate(scaleOriginX, scaleOriginY); // 先平移
  //     ctxImg.scale(scaleRadio, scaleRadio);  // 缩放画布
  //     ctxImg.drawImage(imgNode, 0, 0, canvasWidth, canvasHeight);
  //     ctxImg.restore() // 恢复到之前的状态
  //   }
  //   this.clearCanvas()
  //   ctx.save()
  //   ctx.translate(scaleOriginX, scaleOriginY); // 先平移
  //   ctx.scale(scaleRadio, scaleRadio);  // 缩放画布
  //   // 图片缩放
  //   this.redrawCanvas()
  //   ctx.restore() // 恢复到之前的状态
  // }

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


  getCanvasRatio() {
    const originWidth = this.canvas.width;
    let cssWidth = originWidth
    if (this.canvas.style.width) {
      cssWidth = parseInt(this.canvas.style.width, 10);
    }
    return originWidth / cssWidth;
  }

  setCanvasRatio() {
    this.ratio = Math.ceil(this.getCanvasRatio())
  }

  // 事件回调
  registerCallback(callbackObj) {
    this.callbackObj.checkUndo = callbackObj.checkUndo || null
    if (this.callbackObj.checkUndo) {
      this.callbackObj.checkUndo(this.onListenUndoState(true))
    }
    this.callbackObj.checkRedo = callbackObj.checkRedo || null
    if (this.callbackObj.checkRedo) {
      this.callbackObj.checkRedo(this.onListenRedoState(true))
    }
    this.callbackObj.checkClear = callbackObj.checkClear || null
    if (this.callbackObj.checkClear) {
      this.callbackObj.checkClear(this.onListenClearState(true))
    }
    this.callbackObj.checkEnlarge = callbackObj.checkEnlarge || null
    if (this.callbackObj.checkEnlarge) {
      this.callbackObj.checkEnlarge(this.onListenEnlargeState(true))
    }
    this.callbackObj.checkReduce = callbackObj.checkReduce || null
    if (this.callbackObj.checkReduce) {
      this.callbackObj.checkReduce(this.onListenReduceState(true))
    }
    this.callbackObj.onClear = callbackObj.onClear || null
    this.callbackObj.toolTypeChange = callbackObj.toolTypeChange || null
  }

  // 检查当前点是否在圆边上或者圆的端点，若是则修改鼠标样式
  checkCirclePoint(list, currentX, currentY) {
    let cursorType = 'auto'
    let selectedId = -1
    let circle = null
    let isNearKeyPoint = false
    for (let i = 0, len = list.length; i < len; i++) {
      circle = list[i]
      // eslint-disable-next-line no-loop-func
      isNearKeyPoint = circle.endPointList.some((point, index) => {
        if (this.insideRect(point.x, point.y, circle.endPointWidth, circle.endPointWidth, currentX, currentY)) {
          this.indexChoosePoint = index
          return true
        }
        return false
      });
      if (isNearKeyPoint) {
        this.setCircleEndPointCursor()
        selectedId = circle.id
        break;

      }
      if (!isNearKeyPoint) {
        if (this.isPointInEllipseRing(circle, currentX, currentY)) {
          cursorType = 'move'
          selectedId = circle.id
          break
        }
      }
    }
    if (!isNearKeyPoint) {
      this.modifyCursor(cursorType)
    }
    return {
      id: selectedId,
      type: 'circle'
    }
  }
  checkArrowPoint(list, currentX, currentY) {
    let selectedId = -1
    if (list && list.length > 0) {
      let arrow = null
      // 从后往前遍历，后面绘制的优先级高于前面被绘制的
      for (let len = list.length, i = len - 1; i >= 0; i--) {
        arrow = list[i]
        if (this.insideRect(arrow.startX - 2, arrow.startY - 2, 4, 4, currentX, currentY)) {
          this.modifyCursor('move')
          selectedId = arrow.id
        } else if (this.insideRect(arrow.endX - 2, arrow.endY - 2, 4, 4, currentX, currentY)) {
          this.modifyCursor('move')
          selectedId = arrow.id
        } else if (this.isPointOnThickLine(currentX, currentY, arrow.startX, arrow.startY, arrow.endX, arrow.endY, arrow.endWidth)) {
          this.modifyCursor('move')
          selectedId = arrow.id

        }
      }
    }
    return {
      id: selectedId,
      type: 'arrow'
    }
  }
  // 处理鼠标hover
  handleElseMouseMove(currentX, currentY) {
    let selected = {}

    selected = this.checkCirclePoint(this.circleList, currentX, currentY)
    if (selected.id === -1) {
      selected = this.checkRectPoint(this.rectList, currentX, currentY)
    }
    if (selected.id === -1) {
      selected = this.checkArrowPoint(this.arrowList, currentX, currentY)
    }
    if (selected.id === -1) {
      selected = this.checkTextHover(this.textList, currentX, currentY)
    }

    const { id, type } = selected
    this.hoverActiveShapeId = id
    this.hoverActiveShapeType = type
  }
  checkTextHover(list, currentX, currentY) {
    let selectedId = -1
    const selectedText = this.getTextAtPosition(currentX, currentY)
    if (selectedText) {
      selectedId = selectedText.id
    }
    return {
      id: selectedId,
      type: 'text'
    }
  }


  // 设置当前激活的图形ID, 若不传，则表示无图形被激活
  setCurrentShapeId(id = -1) {
    this.currentShapeId = id
  }
  // 判断当前激活图像是否和自身相同
  checkCurrentShapeId(id) {
    return this.currentShapeId === id
  }
  // 判断当前是否存在激活的图像ID
  hasCurrentShapeID() {
    return this.currentShapeId > -1
  }
  // 激活图像检测，若无激活ID，则重绘，取消激活状态
  checkActiveShape() {
    if (!this.hasCurrentShapeID()) {
      this.redrawCanvas()
    }
  }
  // 当鼠标按下时，切换当前激活图像
  changeCurrentShapeOnMouseDown(shape) {
    this.redrawCanvas()
    this.setCurrentShapeId(shape.id)
  }
  // 清除当前激活状态
  clearActiveShape() {
    if(this.hasCurrentShapeID()) {
      this.setCurrentShapeId()
      this.redrawCanvas()
    }
  }
}

export default CanvasImgEditor;
