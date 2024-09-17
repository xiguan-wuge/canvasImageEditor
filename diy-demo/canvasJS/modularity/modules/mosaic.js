import Base from "./base.js"
import {
  canvasGlobalIdAdd,
  insideRect,
  isPointInEllipseRing,
  isPointOnThickLine
} from '../utils.js'

export default class Circle extends Base {
  constructor(parent) {
    super()
    this.name = 'mosaic'
    this.setParent(parent)
  }

  handleMosaicMouseDown(startX, startY) {
    const parent = this.getParent()
    parent.currentOperationInfo = this.createMosaicInfo(startX, startY)
  }

  /**
   * 鼠标拖动时，计算方块内马赛克颜色和去重
   * @param {number} pointX 鼠标X轴位置
   * @param {number} pointY 鼠标Y轴位置
   * @returns 
   */
  handleMasaicMouseMove(pointX, pointY) {
    const parent = this.getParent()
    const { ratio, mosaicDimensions } = parent
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
    const listLen = parent.currentOperationInfo.list.length
    if (listLen) {
      const lastGridInfo = parent.currentOperationInfo.list[listLen - 1]
      if (lastGridInfo.left === mosaicRect.left
        && lastGridInfo.top === mosaicRect.top) {
        return
      }
    }

    parent.currentOperationInfo.list.push(mosaicRect);
    parent.redrawCanvas()
  }

  handleMosaicMouseUp() {
    const parent = this.getParent()
    if(parent.currentTool === 'mosaic') {
      // 若list为空，则表示鼠标没有拖动，无效马赛克信息，需要销毁
      if(parent.currentOperationInfo?.list.length === 0) {
        parent.mosaicList.pop()
        parent.currentOperationInfo = null
      }
    }
  }


  /**
   * 创建mosaicInfo
   * @param {number} x 鼠标X轴位置
   * @param {number} y 鼠标Y轴位置
   * @returns {object} 新的马赛克信息
   */
  createMosaicInfo(x, y) {
    const parent = this.getParent()
    const newInfo = {
      id: canvasGlobalIdAdd(),
      type: 'mosaic',
      list: [],
      startX: x,
      startY: y
    }
    parent.mosaicList.push(newInfo)
    parent.mosaicLastX = 0
    parent.mosaicLastY = 0
    return newInfo
  }

  /**
   * 合并两个canvas并获取图像数据
   * @param {number} x canvas X轴起始位置
   * @param {number} y canvas Y轴起始位置
   * @param {number} width canvas 宽度
   * @param {number} height canvas 高度
   * @returns {object} canvas图像数据
   */
  mergeCanvasImageData(x, y, width, height) {
    const parent = this.getParent()
    const { canvas, canvasImg } = parent
    if (!parent.mergedCanvas) {
      parent.createMergedCanvas()
    }
    const { mergedCanvas, mergedCtx } = parent
    // 先清空临时画布
    mergedCtx.clearRect(0, 0, mergedCanvas.width, mergedCanvas.height);
    // 绘制 canvas1 内容到临时画布
    mergedCtx.drawImage(canvasImg, 0, 0);
    // 绘制 canvas2 内容到临时画布
    mergedCtx.drawImage(canvas, 0, 0);
    // 获取合并后的图像数据
    return mergedCtx.getImageData(x, y, width, height);
  }


  /**
   * 绘制马赛克方块
   * @param {object} mosaicRect 马赛克方块信息
   */
  drawMosaic(mosaicRect) {
    const parent = this.getParent()
    const { ctx } = parent
    ctx.fillStyle = mosaicRect.fill;
    ctx.fillRect(mosaicRect.left, mosaicRect.top, mosaicRect.dimensions, mosaicRect.dimensions);
  }

  /**
   * 重新绘制masaic
   * @param {object} item 某一马赛克信息，非必传。若传入，则绘制单挑马赛克；若不传，则重绘所有马赛克 
   */
  redrawMosaicList(item) {
    const parent = this.getParent()
    if (item) {
      item.list.forEach(mosaicRect => {
        this.drawMosaic(mosaicRect)
      })
    } else {
      parent.mosaicList.forEach(mosaicItem => {
        mosaicItem.list.forEach(mosaicRect => {
          this.drawMosaic(mosaicRect)
        })
      })
    }

  }

}