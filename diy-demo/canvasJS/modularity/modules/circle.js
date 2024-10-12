import Base from "./base.js"
import {
  canvasGlobalIdAdd,
  insideRect,
  isPointInEllipseRing
} from '../utils.js'

export default class Circle extends Base {
  constructor(parent) {
    super()
    this.name = 'circle'
    this.setParent(parent)
  }

  /**
   * 按下鼠标时圆的处理
   * @param {number} startX 鼠标按下时X轴位置
   * @param {number} startY 鼠标按下时Y轴位置
   */
  handleCircleMouseDown(startX, startY) {
    const parent = this.getParent()
    const {circleList} = parent
    let selected = false
    let circle = null
    if (circleList?.length) {
      for (let i = 0, len = circleList.length; i < len; i++) {
        circle = circleList[i]
        // 检查鼠标是否靠近端点
        parent.indexChoosePoint = -1
        // eslint-disable-next-line no-loop-func
        const isNearKeyPoint = circle.endPointList.some((point, index) => {
          if (insideRect(point.x, point.y, circle.endPointWidth, circle.endPointWidth, startX, startY)) {
            parent.indexChoosePoint = index
            return true
          }
          return false
        });

        if (isNearKeyPoint) {
          parent.currentOperationState = 'resize'
          parent.currentOperationInfo = circle
          selected = true
          parent.changeCurrentShapeOnMouseDown(circle)
          parent.setCurrentShapeId(circle.id)
          parent.redrawCanvas()
          this.setCircleEndPointCursor() // 设置鼠标样式
          break

        }
        const inCircleRing = isPointInEllipseRing(circle, startX, startY)
        if (inCircleRing) {
          selected = true
          parent.currentOperationInfo = circle
          parent.currentOperationState = 'move'
          parent.modifyCursor('move')
          parent.changeCurrentShapeOnMouseDown(circle)
          parent.setCurrentShapeId(circle.id)
          parent.redrawCanvas()
          break;
        }
      }
    }
    if (!selected) {
      const newCircle = {
        id: canvasGlobalIdAdd(),
        type: 'circle',
        startX,
        startY,
        radiusX: 0,
        radiusY: 0,
        color: parent.currentColor,
        lineWidth: parent.currentWidth,
        endPointFillColor: '#fff', // 端点内填充颜色
        endPointWidth: parent.endPointWidth, // 端点宽度
        endPointList: [], // 端点位置
      }
      parent.circleList.push(newCircle)
      parent.currentOperationInfo = newCircle
      parent.currentOperationState = 'add'
      parent.setCurrentShapeId(parent.currentOperationInfo.id)
    }
    parent.beforeOperationInfo = JSON.parse(JSON.stringify(parent.currentOperationInfo))

  }

  /**
   * 圆-拖动鼠标处理
   * @param {number} currentX 当前鼠标X轴位置
   * @param {number} currentY 当前鼠标Y轴位置
   */
  handleCircleMouseMove(currentX, currentY) {
    const parent = this.getParent()
    if (parent.currentOperationInfo) {
      if (parent.currentOperationState === 'resize') {
        const { indexChoosePoint } = parent
        if ([4, 5, 6, 7].includes(indexChoosePoint)) {
          // 在四个边角，
          const rX = Math.abs(currentX - parent.currentOperationInfo.startX)
          const rY = Math.abs(currentY - parent.currentOperationInfo.startY)
          parent.currentOperationInfo.radiusX = rX
          parent.currentOperationInfo.radiusY = rY
        } else if ([0, 2].includes(indexChoosePoint)) {
          // 在上下两个点，修改rY
          parent.currentOperationInfo.radiusY = Math.abs(currentY - parent.currentOperationInfo.startY)
        } else if ([1, 3].includes(indexChoosePoint)) {
          // 左右两个点，修改rX
          parent.currentOperationInfo.radiusX = Math.abs(currentX - parent.currentOperationInfo.startX)
        }
        parent.redrawCanvas()
      } else if (parent.currentOperationState === 'move') {
        const dx = currentX - parent.startX
        const dy = currentY - parent.startY
        parent.currentOperationInfo.startX += dx
        parent.currentOperationInfo.startY += dy
        parent.redrawCanvas()
        parent.startX = currentX
        parent.startY = currentY
      } else if (parent.currentOperationState === 'add') {
        const dx = currentX - parent.currentOperationInfo.startX
        const dy = currentY - parent.currentOperationInfo.startY
        // ctx.ellipse 要求半径大于0
        if (dx > 0 && dy > 0) {
          parent.currentOperationInfo.radiusX = dx
          parent.currentOperationInfo.radiusY = dy
          parent.redrawCanvas()
        }
      }
    }

  }

  /**
   * 鼠标抬起时，判断当前绘制的圆的有效性
   */
  handleCircleMouseUp() {
    const parent = this.getParent()
    if (parent.currentTool === 'circle') {
      // 先判断当前图像是否符合
      if (parent.currentOperationState === 'add' &&
        (parent.currentOperationInfo.radiusX === 0
          || parent.currentOperationInfo.radiusY === 0)) {
        // 是新增状态且半径为空的圆，需要剔除
        parent.circleList.pop()
        parent.setCurrentShapeId()
        parent.currentOperationInfo = null
      } else {
        this.setCircleEndPointCursor() // 设置鼠标样式
      }
      // 若是重复点击，也一样不历史栈
      if (parent.beforeOperationInfo && parent.currentOperationInfo) {
        const noChange = parent.currentOperationInfo.startX === parent.beforeOperationInfo.startX
          && parent.currentOperationInfo.startY === parent.beforeOperationInfo.startY
          && parent.currentOperationInfo.radiusX === parent.beforeOperationInfo.radiusX
          && parent.currentOperationInfo.radiusY === parent.beforeOperationInfo.radiusY
        if (noChange) {
          parent.currentOperationInfo = null
        }
      }
    }
  }

  /**
   * 绘制圆
   * @param {object} circle 圆的信息
   */
  drawCircle(circle) {
    const parent = this.getParent()
    const { ctx } = parent
    ctx.beginPath();
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = circle.color
    ctx.lineWidth = circle.lineWidth
    ctx.ellipse(circle.startX, circle.startY, circle.radiusX, circle.radiusY, 0, 0, 2 * Math.PI);
    ctx.stroke();

    // 计算边上8个点
    const keyPoints = this.getCircleEndPoints(circle);
    circle.endPointList = keyPoints
    if (parent.checkCurrentShapeId(circle.id)) {
      this.drawCirclePoint(circle)
    }

  }

  /**
   * 绘制圆的端点
   * @param {object} circle 圆的信息
   */
  drawCirclePoint(circle) {
    const parent = this.getParent()
    const { ctx } = parent
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

  /**
   * 重新绘制圆/圆的列表
   * @param {object} item 某个圆的信息，非必填；若不传，则重新绘制整个圆列表
   */
  redrawCircleList(item) {
    const parent = this.getParent()
    if (item) {
      this.drawCircle(item)
    } else {
      parent.circleList.forEach(circle => {
        this.drawCircle(circle)
      })
    }
  }

  /**
   * 计算关键点坐标
   * @param {object} circle 圆的信息
   * @returns {array} 圆的8个端点位置信息
   */
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

  /**
   * resize下设置圆的端点样式
   */
  setCircleEndPointCursor() {
    const parent = this.getParent()
    const { indexChoosePoint } = parent
    // 'w-resize': 'w-resize', // 基于纵轴左右调整
    // 's-resize': 's-resize', // 基于横轴上下调整
    // 'nesw-resize': 'nesw-resize', // 基于纵轴东北-西南调整
    // 'nwse-resize': 'nwse-resize', // 基于纵轴西北-东南调整
    if ([0, 2].includes(indexChoosePoint)) {
      parent.modifyCursor('s-resize')
    } else if ([1, 3].includes(indexChoosePoint)) {
      parent.modifyCursor('w-resize')
    } else if ([4, 6].includes(indexChoosePoint)) {
      parent.modifyCursor('nwse-resize')
    } else if ([5, 7].includes(indexChoosePoint)) {
      parent.modifyCursor('nesw-resize')
    } else {
      parent.modifyCursor('auto')
    }
  }

  /**
   * 检查当前点是否在圆边上或者圆的端点，若是则修改鼠标样式
   * @param {array} list 已添加的圆列表信息
   * @param {number} currentX 鼠标X轴位置
   * @param {nummber} currentY 鼠标Y轴位置
   * @returns {object} s鼠标是否hover在圆上
   */
  checkCirclePoint(list, currentX, currentY) {
    const parent = this.getParent()
    let cursorType = 'auto'
    let selectedId = -1
    let circle = null
    let isNearKeyPoint = false
    for (let i = 0, len = list.length; i < len; i++) {
      circle = list[i]
      // eslint-disable-next-line no-loop-func
      isNearKeyPoint = circle.endPointList.some((point, index) => {
        if (insideRect(point.x, point.y, circle.endPointWidth, circle.endPointWidth, currentX, currentY)) {
          parent.indexChoosePoint = index
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
        if (isPointInEllipseRing(circle, currentX, currentY)) {
          cursorType = 'move'
          selectedId = circle.id
          break
        }
      }
    }
    if (!isNearKeyPoint) {
      parent.modifyCursor(cursorType)
    }
    return {
      id: selectedId,
      type: 'circle'
    }
  }
}