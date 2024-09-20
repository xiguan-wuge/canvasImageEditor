import Base from "./base.js"
import {
  canvasGlobalIdAdd,
  insideRect,
  inLine
} from '../utils.js'

export default class Rect extends Base {
  constructor(parent) {
    super()
    this.name = 'rect'
    this.setParent(parent)
    this.rectOperationState = ''
  }

  /**
   * 鼠标按下时，判断是新增矩形或者编辑矩形
   */
  handleRectMouseDown() {
    const parent = this.getParent()
    this.rectOperationState = ''
    const { startX, startY, rectList } = parent
    let selected = false
    if (rectList?.length > 0) {
      let rect = null
      for (let len = rectList.length, i = len - 1; i >= 0; i--) {
        rect = rectList[i]
        const isNearKeyPoint = rect.endPointList.some((point, index) => {
          if (insideRect(point[0], point[1], rect.endPointWidth, rect.endPointWidth, startX, startY)) {
            this.indexChoosePoint = index
            return true
          }
          return false
        });
        if (isNearKeyPoint) {
          this.rectOperationState = 'resize'
          parent.currentOperationInfo = rect
          this.setRectEndPointCursor(parent.indexChoosePoint)
          parent.changeCurrentShapeOnMouseDown(rect)
          parent.setCurrentShapeId(rect.id)
          parent.redrawCanvas()
          selected = true
          break;
        } else if (inLine(startX, startY, rect.pointList, rect)) {
          // 在矩形边上
          selected = true
          this.rectOperationState = 'move'
          parent.currentOperationInfo = rect
          parent.modifyCursor('move')
          parent.changeCurrentShapeOnMouseDown(rect)
          parent.setCurrentShapeId(rect.id)
          parent.redrawCanvas()
          break
        }
      }
    }
    if (!selected) {
      this.rectOperationState = 'add'
      const newRect = {
        id: canvasGlobalIdAdd(),
        type: 'rect',
        startX: startX,
        startY: startY,
        width: 0,
        height: 0,
        color: parent.currentColor,
        lineWidth: parent.currentWidth,
        endPointColor: parent.endPointColor,
        endPointWidth: parent.endPointWidth,
        pointList: [
          [startX, startY],// 左上角
          [startX, startY],// 右上角
          [startX, startY],// 右下角
          [startX, startY],// 左下角
        ],
        endPointList: []
      }
      parent.rectList.push(newRect)
      parent.currentOperationInfo = newRect
      parent.setCurrentShapeId(newRect.id)
    }
    parent.beforeOperationInfo = JSON.parse(JSON.stringify(parent.currentOperationInfo))
  }
  
  /**
   * 鼠标拖动时，绘制矩形
   * @param {number} currentX 
   * @param {number} currentY 
   */
  handleRectMouseMove(currentX, currentY) {
    const parent = this.getParent()
    if (this.rectOperationState === 'move') {
      // 修改矩形位置
      const dx = currentX - parent.startX
      const dy = currentY - parent.startY
      parent.currentOperationInfo.startX += dx
      parent.currentOperationInfo.startY += dy
      this.resizeRectWidthAndPoint(
        parent.currentOperationInfo.pointList[2][0] + dx,
        parent.currentOperationInfo.pointList[2][1] + dy
      )
      parent.startX = currentX
      parent.startY = currentY

    } else if (this.rectOperationState === 'resize') {
      this.stretch(currentX, currentY, parent.currentOperationInfo)
    } else if (this.rectOperationState === 'add') {
      this.resizeRectWidthAndPoint(currentX, currentY)
    }

  }

  /**
   * 鼠标抬起时，判断矩形信息是否符合
   */
  handleRectMouseUp() {
    const parent = this.getParent()
    if (parent.currentTool === "rect") {
      if (this.rectOperationState === 'add') {
        // 判断新增矩形是否符合
        if (parent.currentOperationInfo.width === 0 || parent.currentOperationInfo.height === 0) {
          parent.rectList.pop()
          parent.setCurrentShapeId()
          parent.currentOperationInfo = null
        } else {
          this.setRectEndPointCursor()
        }
      }
      // 重复点击则移除
      if (parent.beforeOperationInfo && parent.currentOperationInfo) {
        if (parent.beforeOperationInfo.startX === parent.currentOperationInfo.startX
          && parent.beforeOperationInfo.startY === parent.currentOperationInfo.startY
          && parent.beforeOperationInfo.width === parent.currentOperationInfo.width
          && parent.beforeOperationInfo.height === parent.currentOperationInfo.height
        ) {
          parent.currentOperationInfo = null
        }
      }
    }
  }

  /**
   * 修改矩形的宽高和端点位置
   * @param {number} currentX 鼠标X轴位置
   * @param {nummber} currentY 鼠标Y轴位置
   */
  resizeRectWidthAndPoint(currentX, currentY) {
    const parent = this.getParent()
    const width = currentX - parent.currentOperationInfo.startX;
    const height = currentY - parent.currentOperationInfo.startY;
    // 计算右下角位置
    const rightBottomX = parent.currentOperationInfo.startX + width
    const rightBottomY = parent.currentOperationInfo.startY + height
    // 修改矩形四个角位置
    parent.currentOperationInfo.pointList[0] = [parent.currentOperationInfo.startX, parent.currentOperationInfo.startY]// 左上角位置
    parent.currentOperationInfo.pointList[1] = [rightBottomX, parent.currentOperationInfo.startY]// 右上角位置
    parent.currentOperationInfo.pointList[2] = [rightBottomX, rightBottomY]// 右下角位置
    parent.currentOperationInfo.pointList[3] = [parent.currentOperationInfo.startX, rightBottomY]// 左下角位置
    parent.currentOperationInfo.width = width;
    parent.currentOperationInfo.height = height;
    parent.redrawCanvas()
  }

  /**
   * 拉伸矩形
   * @param {nummber} iPointX 鼠标X轴位置
   * @param {nummber} iPointY 鼠标Y轴位置
   * @param {Object} item 矩形信息
   */
  stretch(iPointX, iPointY, item) {
    const parent = this.getParent()
    const { indexChoosePoint } = parent
    const { editType = 0, pointList = [] } = item
    if (editType === 0) {
      let changed = false
      if (indexChoosePoint === 0) {
        if (iPointX < pointList[2][0] && iPointY < pointList[2][1]) {
          pointList[0][0] = iPointX;
          pointList[0][1] = iPointY;
          pointList[3][0] = iPointX;
          pointList[1][1] = iPointY;
          changed = true
        }
      } else if (indexChoosePoint === 1) {
        if (iPointY < pointList[2][1]) {
          pointList[0][1] = iPointY;
          pointList[1][1] = iPointY;
          changed = true
        }
      } else if (indexChoosePoint === 2) {
        if (iPointX > pointList[3][0] && iPointY < pointList[3][1]) {
          pointList[1][0] = iPointX;
          pointList[1][1] = iPointY;
          pointList[2][0] = iPointX;
          pointList[0][1] = iPointY;
          changed = true
        }
      } else if (indexChoosePoint === 3) {
        if (iPointX < pointList[2][0]) {
          pointList[0][0] = iPointX;
          pointList[3][0] = iPointX;
          changed = true
        }
      } else if (indexChoosePoint === 4) {
        if (iPointX > pointList[0][0]) {
          pointList[1][0] = iPointX;
          pointList[2][0] = iPointX;
          changed = true
        }
      } else if (indexChoosePoint === 5) {
        if (iPointX < pointList[1][0] && iPointY > pointList[1][1]) {
          pointList[3][0] = iPointX;
          pointList[3][1] = iPointY;
          pointList[0][0] = iPointX;
          pointList[2][1] = iPointY;
          changed = true
        }
      } else if (indexChoosePoint === 6) {
        if (iPointY > pointList[1][1]) {
          pointList[2][1] = iPointY;
          pointList[3][1] = iPointY;
          changed = true
        }
      } else if (indexChoosePoint === 7) {
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
        parent.redrawCanvas()
      }

    }
  }

  /**
   * 设置矩形端点的鼠标样式
   */
  setRectEndPointCursor() {
    const parent = this.getParent()
    const { indexChoosePoint } = parent
    //   'col-resize': 'col-resize', // 基于纵轴左右调整
    // 'row-resize': 'row-resize', // 基于纵轴上下调整
    // 'nesw-resize': 'nesw-resize', // 基于纵轴东北-西南调整
    // 'nwse-resize': 'nwse-resize', // 基于纵轴西北-东南调整
    if ([1, 6].includes(indexChoosePoint)) {
      parent.modifyCursor('row-resize')
    } else if ([3, 4].includes(indexChoosePoint)) {
      parent.modifyCursor('col-resize')
    } else if ([0, 7].includes(indexChoosePoint)) {
      parent.modifyCursor('nwse-resize')
    } else if ([2, 5].includes(indexChoosePoint)) {
      parent.modifyCursor('nesw-resize')
    } else {
      parent.modifyCursor('auto')
    }
  }

  /**
   * 鼠标拖动时，判断是否在矩形上
   * @param {Array} list 已添加的矩形信息
   * @param {number} currentX 鼠标X轴信息
   * @param {number} currentY 鼠标Y轴信息
   * @returns {boolean} 是否在矩形上
   */
  checkRectPoint(list, currentX, currentY) {
    const parent = this.getParent()
    let selectedId = -1
    if (list && list.length > 0) {
      let rect = null
      for (let len = list.length, i = len - 1; i >= 0; i--) {
        rect = list[i]
        // eslint-disable-next-line no-loop-func
        const isNearKeyPoint = rect.endPointList.some((point, index) => {
          if (insideRect(point[0], point[1], rect.endPointWidth, rect.endPointWidth, currentX, currentY)) {
            parent.indexChoosePoint = index
            return true
          }
          return false
        });
        if (isNearKeyPoint) {
          this.setRectEndPointCursor(this.indexChoosePoint)
          selectedId = rect.id
          break;
        } else if (inLine(currentX, currentY, rect.pointList, rect)) {
          // 在矩形边上
          selectedId = rect.id
          parent.modifyCursor('move')
          break
        }
      }
    }
    return {
      id: selectedId,
      type: 'rect'
    }
  }
}