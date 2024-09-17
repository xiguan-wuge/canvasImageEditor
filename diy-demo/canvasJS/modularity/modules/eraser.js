import Base from "./base.js"
import {
  canvasGlobalIdAdd,
  insideRect,
  isPointInEllipseRing,
  isPointOnThickLine
} from '../utils.js'

export default class Eraser extends Base {
  constructor(parent) {
    super()
    this.name = 'eraser'
    this.setParent(parent)
  }

  handleEraserMouseDown() {
    const parent = this.getParent()
    parent.currentOperationInfo = {
      type: 'eraser',
      id: canvasGlobalIdAdd(),
      list: []
    }
  }

  handleEraserMouseMove(currentX, currentY){
    const parent = this.getParent()
    const newEraser = {
      x: currentX,
      y: currentY,
      width: parent.currentWidth,
      color: parent.currentColor
    }
    parent.currentOperationInfo.list.push(newEraser)
    this.drawEraser(newEraser);
  }

  handleEraserMouseUp() {
    const parent = this.getParent()
    if (parent.currentTool === "eraser") {
      if (parent.currentOperationInfo?.list?.length) {
        parent.eraserList.push(JSON.parse(JSON.stringify(parent.currentOperationInfo)))
      }
      if(parent.currentOperationInfo?.list?.length === 0) {
        parent.eraserList.pop()
        parent.currentOperationInfo = null
      }
      // 恢复成绘制状态
      parent.ctx.globalCompositeOperation = 'source-over';
    }
  }

  // 橡皮檫
  drawEraser(item) {
    const parent = this.getParent()
    const { ctx } = parent
    ctx.beginPath(); // 开始新的路径
    // 若考虑成绘制矩形，则可以做前后值的去重
    ctx.arc(item.x, item.y, item.width, 0, Math.PI * 2); // 以当前点为中心绘制一个小圆点
    ctx.fillStyle = item.color;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fill();
    ctx.closePath(); // 结束路径
  }

  // 重绘橡皮擦
  redrawEraserList(item) {
    const parent = this.getParent()
    if (item) {
      if (item.list?.length) {
        item.list.forEach(block => {
          this.drawEraser(block)
        })
      }
    } else if (parent?.eraserList?.length) {
      parent.eraserList.forEach(item => {
        if (item.list?.length) {
          item.list.forEach(block => {
            this.drawEraser(block)
          })
        }
      })
    }
  }
}