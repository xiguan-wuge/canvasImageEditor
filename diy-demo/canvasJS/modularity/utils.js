let canvasGlobalId = 1

/**
 * 全局id自增
 * @returns 
 */
export const canvasGlobalIdAdd = () => {
  return canvasGlobalId++
}

/**
 * 判断是否在矩形内
 * @param {number} rectX 矩形X坐标
 * @param {number} rectY 矩形Y坐标
 * @param {number} rectWidth 矩形宽度
 * @param {number} rectHeight 矩形高度
 * @param {number} pointX 鼠标X坐标
 * @param {number} pointY 鼠标Y坐标
 * @returns {boolean} 是否在矩形内
 */
export const insideRect = (rectX, rectY, rectWidth, rectHeight, pointX, pointY) => {
  return (pointX >= rectX && pointX <= rectX + rectWidth)
    && (pointY >= rectY && pointY <= rectY + rectHeight)
}

/**
 * 判断是否在线段上
 * @param {number} pointX 鼠标横坐标
 * @param {number} pointY 鼠标纵坐标
 * @param {number} x1 线段开始横坐标
 * @param {number} y1 线段开始纵坐标
 * @param {number} x2 线段结束横坐标
 * @param {number} y2 线段结束纵坐标
 * @param {number} lineWidth 线段宽度
 * @returns {boolean} 是否在线段内部
 */
export const isPointOnThickLine = (pointX, pointY, x1, y1, x2, y2, lineWidth = 8) => {
  // 计算线段的向量
  const dx = x2 - x1;
  const dy = y2 - y1;

  // 计算线段长度的平方
  const lengthSquared = dx * dx + dy * dy;

  // 计算点到线段起点的向量
  const t = ((pointX - x1) * dx + (pointY - y1) * dy) / lengthSquared;

  // 计算垂直投影的位置
  const projectionX = x1 + t * dx;
  const projectionY = y1 + t * dy;

  // 计算点到线段的距离
  const distance = Math.hypot(pointX - projectionX, pointY - projectionY);

  // 检查鼠标是否在带状区域内
  const withinSegment = t >= 0 && t <= 1;

  // 判断距离是否小于或等于线段的一半宽度
  return distance <= lineWidth / 2 && withinSegment;
}

/**
 * 判断是否在边界线上
 * @param {number} px 鼠标x轴位置
 * @param {*} py 鼠标y轴位置
 * @param {*} aPoint 端点
 * @returns {boolean} 是否在边界线上
 */
export const inLine = (px, py, aPoint = []) => {
  let isOnEdge = false;
  for (let i = 0; i < aPoint.length; i++) {
    const p1 = aPoint[i];
    const p2 = aPoint[(i + 1) % aPoint.length];
    const x1 = p1[0];
    const y1 = p1[1];
    const x2 = p2[0];
    const y2 = p2[1];
    // 计算点到直线的距离
    const distance = Math.abs((y2 - y1) * px - (x2 - x1) * py + x2 * y1 - y2 * x1) / Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);
    // 如果点到某条边的距离小于等于0，说明点在这条边上
    if (distance <= 2) {
      isOnEdge = true;
      break;
    }
  }
  return isOnEdge;
}

/**
* 鼠标点是否在圆边上
* @param {object} circle 圆的信息
* @param {number} mouseX 鼠标X轴位置
* @param {number} mouseY 鼠标Y轴位置
* @returns {boolean} 是否在圆边上
*/
export const isPointInEllipseRing = (circle, mouseX, mouseY) => {
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

/**
 * 函数判断
 * @param {*} val 
 * @returns {boolean} 是否为函数
 */
export const isFunction = (val) => {
  return typeof val === 'function'
}