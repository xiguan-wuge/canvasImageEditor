import Base from "./base.js"

import {
  canvasGlobalIdAdd,
  insideRect,
  isPointOnThickLine
} from '../utils.js'
/**
 * 绘制箭头
 * 将箭头相关的处理逻辑抽离到Arrow类中，
 * 为保证修改同一个实例，传入parentInstance,内部修改parentInstance
 */
export default class Arrow  extends Base {
  constructor(parent) {
    super()
    this.name = 'arrow'
    this.setParent(parent)
  }

  /**
   * 处理画箭头时的mouseDown事件
   */
  handleArrowMouseDown() {
    const parent = this.getParent()
    const list = parent.arrowList
    let selected = false
    if (list && list.length > 0) {
      let arrow = {}
      // 从后往前遍历，后面绘制的优先级高于前面被绘制的
      for (let len = list.length, i = len - 1; i >= 0; i--) {
        arrow = list[i]
        const { startX, startY, endX, endY, startPoint, endWidth } = arrow
        const { endPointWidth } = startPoint
        const halfEndPointWidth = endPointWidth / 2
        if (insideRect(startX - (endPointWidth), startY - 2, 4, 4, parent.startX, parent.startY)) {
          parent.changeCurrentShapeOnMouseDown(arrow)
          this.resizeGradientArrow()
          parent.setCurrentShapeId(arrow.id)
          parent.redrawCanvas()

          parent.currentOperationState = 'start'
          parent.modifyCursor('move')
          parent.currentOperationInfo = arrow
          selected = true
          break;
        } else if (insideRect(endX - halfEndPointWidth, endY - halfEndPointWidth, endPointWidth, endPointWidth, parent.startX, parent.startY)) {
          parent.changeCurrentShapeOnMouseDown(arrow)
          this.resizeGradientArrow()
          parent.setCurrentShapeId(arrow.id)
          parent.redrawCanvas()

          parent.currentOperationState = 'end'
          parent.modifyCursor('move')
          parent.currentOperationInfo = arrow
          selected = true
          break;
        } else if (isPointOnThickLine(parent.startX, parent.startY, startX, startY, endX, endY, endWidth)) {
          parent.changeCurrentShapeOnMouseDown(arrow)
          this.resizeGradientArrow()
          parent.setCurrentShapeId(arrow.id)
          parent.redrawCanvas()
          parent.currentOperationState = 'move'
          parent.currentOperationInfo = arrow
          parent.modifyCursor('move')
          selected = true
          break;
        }
      }
    }
    if (!selected) {
      // 正常绘制？ 绘制第二条线段时，不执行这块？？？
      const newArrow = {
        id: canvasGlobalIdAdd(),
        type: 'arrow',
        startX: parent.startX,
        startY: parent.startY,
        endX: parent.startX,
        endY: parent.startY,
        color: parent.currentColor,
        startWidth: 1,
        endWidth: (parent.currentWidth - 0) + 7,
        startPoint: { // 起点端点
          x: parent.startX - (parent.endPointWidth / 2),
          y: parent.startY - (parent.endPointWidth / 2),
          endPointWidth: parent.endPointWidth,
          color: parent.endPointColor
        },
        endPoint: { // 结束端点
          x: parent.startX - (parent.endPointWidth / 2),
          y: parent.startY - (parent.endPointWidth / 2),
          endPointWidth: parent.endPointWidth,
          color: parent.endPointColor
        },
      }
      parent.currentOperationState = 'add'
      parent.currentOperationInfo = newArrow
      parent.arrowList.push(newArrow)
      parent.setCurrentShapeId(parent.currentOperationInfo.id)
    }
    parent.beforeOperationInfo = JSON.parse(JSON.stringify(parent.currentOperationInfo))
  }

  /**
   * 鼠标拖动时，绘制箭头
   * @param {number} currentX 
   * @param {number} currentY 
   */
  handleArrowMouseMove(currentX, currentY) {
    const parent = this.getParent()
    const { currentOperationState, currentOperationInfo } = parent
    if (currentOperationState === 'move') {
      // 移动箭头
      const dx = currentX - parent.startX
      const dy = currentY - parent.startY

      // 更新线段的起点位置，将其向 dx 和 dy 的方向移动
      currentOperationInfo.startX += dx;
      currentOperationInfo.startY += dy;

      // 更新线段的终点位置，使其与起点保持相同的位移量
      currentOperationInfo.endX += dx;
      currentOperationInfo.endY += dy;
      this.getArrowEndPoint(parent.currentOperationInfo, 'both')
      this.resizeGradientArrow(currentOperationInfo);
      // 更新完成后，重新设置起始位置
      parent.startX = currentX
      parent.startY = currentY
    } else if (currentOperationState === 'end') {
      // 调整箭头尾部位置
      parent.currentOperationInfo.endX = currentX
      parent.currentOperationInfo.endY = currentY
      this.getArrowEndPoint(parent.currentOperationInfo, 'end')
      this.resizeGradientArrow(parent.currentOperationInfo)
    } else if (currentOperationState === 'start') {
      // 调整箭头开头位置
      parent.currentOperationInfo.startX = currentX
      parent.currentOperationInfo.startY = currentY
      this.getArrowEndPoint(parent.currentOperationInfo, 'start')
      this.resizeGradientArrow(parent.currentOperationInfo)
    } else {
      // 正常绘制箭头
      parent.currentOperationInfo.endX = currentX
      parent.currentOperationInfo.endY = currentY
      this.getArrowEndPoint(parent.currentOperationInfo, 'both')
      this.resizeGradientArrow(parent.currentOperationInfo)
    }
  }

  /**
   * 处理箭头MouseUP
   */
  handleArrowMouseUp() {
    const parent = this.getParent()
    if (parent.currentTool === 'arrow') {
      const { beforeOperationInfo, currentOperationInfo } = parent
      const { startX, startY, endX, endY } = currentOperationInfo
      if (parent.currentOperationInfo && parent.currentOperationState === 'add') {
        // 判断信息是否符合
        if (!(Math.abs(endX - startX) > 0 || Math.abs(endY - startY) > 0)) {
          parent.arrowList.pop()
          parent.currentOperationInfo = null
          parent.setCurrentShapeId()
        }
      }
      // 鼠标点击，但没有额外操作，不计入历史栈
      if (currentOperationInfo
        && beforeOperationInfo.startX === startX
        && beforeOperationInfo.startY === startY
        && endX === beforeOperationInfo.endX
        && endY === beforeOperationInfo.endY) {
          parent.currentOperationInfo = null
      }

    }
  }

  /**
   * 修改箭头的起始、结束端点
   * @param {Object} item 箭头信息
   * @param {String} type 箭头端点类型：start-开始位置 end-结束位置 move-开始结束位置都要修改
   */
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

  /**
   * 重新绘制箭头
   */
  resizeGradientArrow() {
    const parent = this.getParent()
    parent.redrawCanvas()
  }

  /**
   * 重新绘制对应箭头
   * @param {Object} arrowInfo 箭头信息
   */
  redrawArrowList(arrowInfo) {
    const parent = this.getParent()
    if (arrowInfo) {
      this.drawGradientArrow(arrowInfo)
    } else if (parent.arrowList && parent.arrowList.length) {
      parent.arrowList.forEach(arrowInfo => {
        this.drawGradientArrow(arrowInfo)
      })
    }
  }

  /**
   * 绘制渐变线条的箭头
   * @param {object} item 箭头信息
   */
  drawGradientArrow(item) {
    const parent = this.getParent()
    const { startX, startY, endX, endY, startWidth, endWidth, color } = item
    const { ctx } = parent
    // 计算箭头尾部左右端点
    const angle = Math.atan2(endY - startY, endX - startX);
    const headLength = endWidth * 2;
    const rightX = endX - headLength * Math.cos(angle - Math.PI / 6)
    const rightY = endY - headLength * Math.sin(angle - Math.PI / 6)
    const leftX = endX - headLength * Math.cos(angle + Math.PI / 6)
    const leftY = endY - headLength * Math.sin(angle + Math.PI / 6)

    const steps = 600; // 分段数量
    // 以箭头正中心值作为线段结束位置
    const dx = ((rightX + leftX + endX) / 3 - startX) / steps;
    const dy = ((rightY + leftY + endY) / 3 - startY) / steps;

    ctx.lineCap = 'round'; // 设置线条端点为圆形
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

    if (parent.checkCurrentShapeId(item.id)) {
      this.drawArrowEndPoint(item);
    }
  }

  /**
   * 绘制箭头首尾的端点
   * @param {object} item 箭头信息
   */
  drawArrowEndPoint(item) {
    const parent = this.getParent()
    const { startPoint, endPoint } = item
    const { ctx } = parent
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

  /**
   * 鼠标hover时，判断是否在箭头上
   * @param {Array} list 已添加的箭头信息列表
   * @param {Number} currentX 鼠标X位置
   * @param {Number} currentY 鼠标Y位置
   * @returns {Boolean} 是否在箭头上
   */
  checkArrowPoint(list, currentX, currentY) {
    const parent = this.getParent()
    let selectedId = -1
    if (list && list.length > 0) {
      let arrow = null
      // 从后往前遍历，后面绘制的优先级高于前面被绘制的
      for (let len = list.length, i = len - 1; i >= 0; i--) {
        arrow = list[i]
        const {endPointWidth} = arrow.startPoint
        const halfEndPointWidth = endPointWidth/2
        if (insideRect(arrow.startX - halfEndPointWidth, arrow.startY - halfEndPointWidth, endPointWidth, endPointWidth, currentX, currentY)) {
          parent.modifyCursor('move')
          selectedId = arrow.id
        } else if (insideRect(arrow.endX - halfEndPointWidth, arrow.endY - halfEndPointWidth, endPointWidth, endPointWidth, currentX, currentY)) {
          parent.modifyCursor('move')
          selectedId = arrow.id
        } else if (isPointOnThickLine(currentX, currentY, arrow.startX, arrow.startY, arrow.endX, arrow.endY, arrow.endWidth)) {
          parent.modifyCursor('move')
          selectedId = arrow.id
        }
      }
    }
    return {
      id: selectedId,
      type: 'arrow'
    }
  }
}