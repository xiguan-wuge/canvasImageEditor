import Base from "./base.js"
import {
  canvasGlobalIdAdd
} from '../utils.js'

export default class Scribble extends Base {
  constructor(parent) {
    super()
    this.name = 'scribble'
    this.setParent(parent)
  }

  /**
   * 涂鸦，初始化一段新的涂鸦信息
   */
  handleScribbleMouseDown() {
    const parent = this.getParent()
    parent.currentOperationInfo = {
      type: 'scribble',
      id: canvasGlobalIdAdd(),
      list: []
    }
    parent.scribbleList.push(parent.currentOperationInfo)
  }

  /**
   * 鼠标拖动时，绘制涂鸦
   * @param {number} currentX 鼠标X轴位置
   * @param {number} currentY 鼠标Y轴位置
   */
  handleScribbleMouseMove(currentX, currentY) {
    const parent = this.getParent()
    const newScribble = {
      startX: parent.startX,
      startY: parent.startY,
      endX: currentX,
      endY: currentY,
      width: parent.currentWidth,
      color: parent.currentColor
    }
    parent.currentOperationInfo.list.push(newScribble)
    this.drawScribble(newScribble);
  }

  /**
   * 鼠标抬起，判断当前涂鸦的有效性
   */
  handleScribbleMouseUp() {
    const parent = this.getParent()
    if (parent.currentTool === "scribble") {
      if (parent.currentOperationInfo && parent.currentOperationInfo?.length > 0) {
        parent.scribbleList.push(JSON.parse(JSON.stringify(parent.currentOperationInfo)))
      }
    }
  }

  /**
   * 涂鸦绘制
   * @param {object} item 涂鸦信息
   * @param {boolean} isMoving 是否为拖动中
   */
  drawScribble(item, isMoving = true) {
    const parent = this.getParent()
    const { ctx } = parent
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

    if (isMoving) {
      // 鼠标拖动状态下，绘制完后，更新startX/Y
      parent.startX = item.endX
      parent.startY = item.endY
    }
  }

  /**
   * 重绘涂鸦
   * @param {object} item 某一涂鸦信息，非必传。若传入，则表示绘制某一涂鸦；若不传，则重绘所有涂鸦
   */
  redrawScribbleList(item) {
    const parent = this.getParent()
    if (item) {
      if (item.list?.length) {
        item.list.forEach(block => {
          this.drawScribble(block, false)
        })
      }
    } else if (parent.scribbleList?.length) {
      parent.scribbleList.forEach(item => {
        if (item.list?.length) {
          item.list.forEach(block => {
            this.drawScribble(block, false)
          })
        }
      })
    }
  }

  
}