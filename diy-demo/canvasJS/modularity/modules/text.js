import Base from "./base.js"
import {
  canvasGlobalIdAdd,
  insideRect
} from '../utils.js'

export default class Text extends Base {
  constructor(parent) {
    super()
    this.name = 'text'
    this.setParent(parent)
    this.inTextEdit = false
    this.addNewText = false
  }

  /**
   * 鼠标按下时，文本处理：
   *  1. 判断是否退出文本编辑
   *  2. 文本新增/再次编辑
   * @param {number} startX 鼠标X位置
   * @param {number} startY 鼠标Y位置
   * @returns 
   */
  handleTextMouseDown(startX, startY) {
    const parent = this.getParent()
    if (this.inTextEdit || this.addNewText) {
      parent.isDrawing = false
      this.inTextEdit = true
      return
    }
    if (!parent.textareaNode) {
      this.createTextarea()
    }
    const selectedText = this.getTextAtPosition(startX, startY);
    if (selectedText) {
      parent.currentOperationInfo = selectedText
      parent.currentOperationState = 'selected'
      setTimeout(() => {
        // 长按300ms后，鼠标改为拖动样式
        if (parent.currentOperationState === 'selected') {
          parent.modifyCursor('move')
        }
      }, 300)
    } else {
      const newText = {
        id: canvasGlobalIdAdd(),
        type: 'text',
        text: '',
        color: parent.currentColor,
        lineWidth: parent.textFontWeight - 0,
        fontSize: parent.textFontSize - 0,
        lineHeight: 1,
        maxWidth: parent.canvasWidth,
        startX,
        startY,
        width: 2,
        height: parent.textFontSize - 0
      }
      this.addNewText = true
      parent.currentOperationState = 'add'
      parent.currentOperationInfo = newText
      this.showTextareaNode()
      parent.isDrawing = false
    }
  }

  /**
   * 鼠标拖动时，拖动文本
   * @param {number} currentX 鼠标X位置
   * @param {number} currentY 鼠标Y位置
   * @returns 
   */
  handleTextMouseMove(currentX, currentY) {
    const parent = this.getParent()
    if (!parent.isDrawing) {
      return
    }
    const { currentOperationInfo } = parent
    if (parent.currentOperationState === 'move' || parent.currentOperationState === 'selected') {
      parent.currentOperationState = 'move'
      if (parent.canvasCursor !== 'move') {
        parent.modifyCursor('move')
      }
      const dx = currentX - parent.startX
      const dy = currentY - parent.startY
      currentOperationInfo.startX += dx
      currentOperationInfo.startY += dy
      parent.redrawCanvas()
      parent.startX = currentX
      parent.startY = currentY
    }
  }

  /**
   * 鼠标抬起时，判断文本编辑
   */
  handleTextMouseUp() {
    const parent = this.getParent()
    const newClickTime = new Date().getTime();
    if (this.inTextEdit) {
      this.exitTextEditStatus()
      parent.modifyCursor('auto')
    } else if (parent.currentOperationState === 'selected') {
      if (parent._isDoubleClick(newClickTime)) {
        parent.currentOperationState = 'edit'
        this.handleTextEditAgainOrMove(parent.currentOperationInfo, true)
      } else {
        // 选中但未拖动
        parent.isDrawing = false
        parent.modifyCursor('auto')
      }
      parent._lastClickTime = newClickTime;
    } else if (parent.currentOperationState === 'edit') {
      this.exitTextEditStatus()
    } else if (parent.currentOperationState === 'add') {
      this.inTextEdit = true
    } else if (parent.isDrawing || parent.currentOperationState === 'move') {
      parent.isDrawing = false
      parent.saveAction()
    }
  }

  /**
   * 校验文本的有效性
   */
  handleTextSaveAction() {
    const parent = this.getParent()
    if (parent.currentTool === 'text' && !this.inTextEdit) {
      const newItem = JSON.parse(JSON.stringify(parent.currentOperationInfo))
      const same = parent.textList.find(item => item.id === newItem.id)
      if (!same && newItem.text) {
        parent.textList.push(newItem)
      } else {
        const beforeTextInfo = parent.beforeTextInfo || {}
        // 历史栈中文本去重
        const noChange = newItem.id === beforeTextInfo.id
          && newItem.text === beforeTextInfo.text
          && newItem.startX === beforeTextInfo.startX
          && newItem.startY === beforeTextInfo.startY
          && newItem.fontSize === beforeTextInfo.fontSize
          && newItem.color === beforeTextInfo.color
        if (noChange || newItem.text === '') {
          parent.currentOperationInfo = null
        }
      }
    }
  }

  /**
   * 区分文本二次编辑还是移动，采用mousedown 和mouseup 模拟click事件
   * @param {object} 当前操作的文本信息 
   * @param {boolean} isDoubleClick 是否是文本编辑状态
   */
  handleTextEditAgainOrMove(selectedText, isDoubleClick) {
    const parent = this.getParent()
    if (isDoubleClick) {
      // 双击状态是编辑文本
      parent.currentOperationInfo = selectedText
      parent.currentOperationState = 'edit'
      this.showTextareaNode()

      parent.beforeTextInfo = JSON.parse(JSON.stringify(selectedText)) // 记录下文本编辑前的状态，用于区分前后是否变化
      selectedText.colorBackup = selectedText.color
      selectedText.color = 'rgba(0,0,0, 0)'
      this.inTextEdit = true
      parent.redrawCanvas()
      setTimeout(() => {
        parent.textareaNode.focus()
      }, 300)
    } else {
      // 拖动文本
      parent.currentOperationInfo = selectedText
      parent.currentOperationState = 'move'
      parent.modifyCursor('move')
    }
  }

  /**
   * 退出文本编辑状态
   * @returns 
   */
  exitTextEditStatus() {
    const parent = this.getParent()
    if (parent.currentTool === 'text' && (this.inTextEdit)) {
      this.inTextEdit = false
      this.addNewText = false
      const beforeText = parent.currentOperationInfo.text
      parent.currentOperationInfo.text = parent.textareaNode.value
      this.hideTextareaNode()
      if (parent.currentOperationInfo.colorBackup) {
        parent.currentOperationInfo.color = parent.currentOperationInfo.colorBackup
        parent.currentOperationInfo.colorBackup = null
      }
      if (beforeText === parent.currentOperationInfo.text && beforeText === '') {
        // 前后文本都是空，不计入历史栈
        return
      }
      this.handleTextSaveAction()
      parent.saveAction()
      parent.redrawCanvas()
    }
  }

  /**
   * 重会文本列表
   * @param {object} item 某一文本信息，非必传；若传入，则重绘当前文本；若不传，则重绘文本列表 
   */
  redrawTextList(item) {
    const parent = this.getParent()
    if (item) {
      this.drawText(item)
    } else {
      parent.textList.forEach(text => {
        this.drawText(text)
      })
    }
  }

  /**
   * 重绘文本
   * @param {object} item 某一文本信息 
   * @param {boolean} isHide 是否隐藏文本（绘制，但视觉上不显示）
   * @returns 
   */
  drawText(item, isHide = false) {
    const parent = this.getParent()
    const { ctx } = parent
    ctx.globalCompositeOperation = 'source-over';
    ctx.font = `${item.fontSize}px serif`
    ctx.textBaseline = 'top';

    const metrics = this.getTextMetrics(item);
    let y = item.startY

    // 绘制边框
    // const borderColor = isHide ? 'rgba(0, 0, 0, 0)' : 'rgb(118, 118, 118)'
    // ctx.strokeStyle = borderColor;
    // ctx.lineWidth = 1;
    // ctx.strokeRect(item.startX - 1, item.startY - 1, metrics.width + 2, metrics.height + 2);

    // 绘制文本
    const fillColor = isHide ? 'rgba(0, 0, 0, 0)' : item.color
    metrics.lines.forEach((line) => {
      ctx.fillStyle = fillColor;
      ctx.fillText(line, item.startX, y);
      y += item.fontSize * item.lineHeight;
    });
    // 返回边框的宽高
    const width = metrics.width < 2 ? 2 : metrics.width
    return { width, height: metrics.height };
  }
  
  /**
   * 文本度量, 根据canvas中绘制的文本，计算宽高
   * @param {object} item 文本信息
   * @returns {object} 返回当前文本的宽高和行数
   */
  getTextMetrics(item) {
    const parent = this.getParent()
    const { ctx } = parent
    const lines = item.text.split('\n');
    const lineMetrics = lines.map(line => this.splitTextIntoLines(line, item));
    const allLineWidth = lineMetrics.map(line => ctx.measureText(line).width)
    const maxWidth = Math.max(...allLineWidth)
    const totalHeight = lineMetrics.length * item.fontSize * item.lineHeight;
    return { width: maxWidth, height: totalHeight, lines: lineMetrics.flat() };
  }
  
  /**
   * 将输入的文本，匹配规则后换行
   * @param {string} 输入框中的文本
   * @param {*} item 文本信息
   * @returns {array} 换行后的文本
   */
  splitTextIntoLines(text, item) {
    const parent = this.getParent()
    const { ctx } = parent
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const {width} = ctx.measureText(`${currentLine  } ${  word}`);
      if (item.maxWidth && width > item.maxWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine += ` ${  word}`;
      }
    }
    lines.push(currentLine);
    return lines;
  }
  
  /**
   * 更新文本域宽高
   */
  updateTextarea() {
    const parent = this.getParent()
    parent.currentOperationInfo.text = parent.textareaNode.value
    const { width, height } = this.drawText(parent.currentOperationInfo, true)
    // const ratio = parent.getCanvasRatio()
    parent.currentOperationInfo.width = width
    parent.currentOperationInfo.height = height
    // parent.textareaNode.style.width = `${Math.ceil(width / ratio)}px`
    // parent.textareaNode.style.height = `${Math.ceil(height / ratio)}px`
    parent.textareaNode.style.width = `${Math.ceil(width * parent.scaleRadio)}px`
    parent.textareaNode.style.height = `${Math.ceil(height * parent.scaleRadio)}px`
  }
  
  /**
   * 创建文本域
   */
  createTextarea() {
    const parent = this.getParent()
    const container = parent.canvasParent;
    const textarea = document.createElement('textarea');
    const ratio = parent.getCanvasRatio()

    textarea.className = 'canvas-textarea';
    const textStyleObj = {
      position: 'absolute',
      padding: '0px',
      display: 'none',
      overflow: 'hidden',
      resize: 'none',
      outline: 'none',
      'border-radius': '0px',
      'background-color': 'transparent',
      appearance: 'none',
      'z-index': 99999,
      'white-space': 'pre',
      width: '2px',
      height: `${parent.textFontSize*parent.scaleRadio}px`,
      transform: 'rotate(0deg)',
      'text-align': 'left',
      'line-height': 1,
      color: 'rgb(255, 52, 64)',
      'font-size': `${Math.ceil((parent.textFontSize - 0) / ratio)}px`,
      'font-family': 'serif',
      'font-weight': 'normal',
      'transform-origin': 'left top',
      border: '1px solid light-dark(rgb(118, 118, 118), rgb(133, 133, 133));'
    }
    const styleStr = Object.keys(textStyleObj).map(item => {
      return `${item}:${textStyleObj[item]};`
    }).join('')
    textarea.setAttribute('style', styleStr);

    container.appendChild(textarea);
    parent.textareaNode = textarea;

    // 处理 Enter 键，完成文本输入
    parent.textareaNode.addEventListener('input', (e) => {
      this.updateTextarea()
      if (e.key === 'Enter') {
        parent.textareaNode.style.height = `${parent.currentOperationInfo.height + parent.currentOperationInfo.fontSize - 0}px`
      }
    });
  }

  /**
   * 显示文本域
   */
  showTextareaNode() {
    const parent = this.getParent()
    const { startX, startY, color, text, width, height, fontSize } = parent.currentOperationInfo
    // const ratio = parent.getCanvasRatio()
    const {scaleRadio} = parent
    // textarea的定位值需要结合缩放和拖动偏移来计算
    let topValue = startX*scaleRadio
    topValue += parent.scaleOffsetX
    let leftValue = startY*scaleRadio
    leftValue +=parent.scaleOffsetY
    parent.textareaNode.style.left = `${topValue}px`
    parent.textareaNode.style.top = `${leftValue}px`
    parent.textareaNode.style.color = color
    // 宽高需要结合缩放比例进行计算
    const widthValue = Math.ceil(width * scaleRadio)
    const heightValue = Math.ceil(height * scaleRadio)
    const fontSizeValue = Math.ceil(fontSize * scaleRadio)
    // parent.textareaNode.style.fontSize = `${Math.ceil(fontSize / ratio)}px`
    // parent.textareaNode.style.width = `${Math.ceil(width / ratio)}px`
    // parent.textareaNode.style.height = `${Math.ceil(height / ratio)}px`
    parent.textareaNode.style.fontSize = `${fontSizeValue}px`
    parent.textareaNode.style.width = `${widthValue}px`
    parent.textareaNode.style.height = `${heightValue}px`
    parent.textareaNode.style.display = 'block';
    parent.textareaNode.value = text;
    setTimeout(() => {
      parent.textareaNode.focus()
    }, 30)
  }

  /**
   * 隐藏文本域
   */
  hideTextareaNode() {
    const parent = this.getParent()
    if (parent.textareaNode && parent.textareaNode.style.display !== 'none') {
      parent.textareaNode.style.display = 'none'
    }
  }

  /**
   * 根据鼠标位置，判断是否能获取对应文本
   * @param {number} x 鼠标X轴位置
   * @param {number} y 鼠标Y轴位置
   * @returns {object|null} 是否能获取对应文本。若为null，则表示获取失败
   */
  getTextAtPosition(x, y) {
    // 从后往前遍历，找到最上面的文本
    const parent = this.getParent()
    const { textList} = parent
    for (let i = textList.length - 1; i >= 0; i--) {
      const textObject = textList[i];
      const { startX, startY, width, height } = textObject
      if (insideRect(startX, startY, width, height, x, y)) {
        return textObject
      }
    }
    return null;
  }

  /**
   * 判断鼠标是否hover在文本上
   * @param {array} list 已添加的文本列表 
   * @param {number} currentX 鼠标X轴位置
   * @param {number} currentY 鼠标Y轴位置
   * @returns {object} 返回文本信息id(若匹配上)和文本类型
   */
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
}