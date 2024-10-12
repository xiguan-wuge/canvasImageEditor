export const cursorTypeMap = {
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
  'w-resize': 'w-resize', // 基于纵轴左右调整
  's-resize': 's-resize', // 基于横轴上下调整
  'nesw-resize': 'nesw-resize', // 基于纵轴东北-西南调整
  'nwse-resize': 'nwse-resize', // 基于纵轴西北-东南调整
}
export default {
  cursorTypeMap
}