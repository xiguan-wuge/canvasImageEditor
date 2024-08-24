'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function _arrayWithHoles(r) {
  if (Array.isArray(r)) return r;
}
function _classCallCheck(a, n) {
  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
}
function _defineProperties(e, r) {
  for (var t = 0; t < r.length; t++) {
    var o = r[t];
    o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o);
  }
}
function _createClass(e, r, t) {
  return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", {
    writable: !1
  }), e;
}
function _iterableToArrayLimit(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e,
      n,
      i,
      u,
      a = [],
      f = !0,
      o = !1;
    try {
      if (i = (t = t.call(r)).next, 0 === l) {
        if (Object(t) !== t) return;
        f = !1;
      } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
    } catch (r) {
      o = !0, n = r;
    } finally {
      try {
        if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
      } finally {
        if (o) throw n;
      }
    }
    return a;
  }
}
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _slicedToArray(r, e) {
  return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
}
function _toPrimitive(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
  }
}

var canvasGlobalId = 1;
var cursorTypeMap = {
  auto: 'auto',
  default: 'default',
  move: 'move',
  text: 'text',
  'e-resize': 'e-resize',
  'ne-resize': 'ne-resize',
  'nw-resize': 'nw-resize',
  'n-resize': 'n-resize',
  'se-resize': 'se-resize',
  'sw-resize': 'sw-resize',
  's-resize': 's-resize',
  'w-resize': 'w-resize'
};
var CanvasImgEditor = function () {
  function CanvasImgEditor(options) {
    _classCallCheck(this, CanvasImgEditor);
    this.canvasId = options.canvasId;
    this.canvas = null;
    this.ctx = null;
    this.ctxImg = null;
    this.canvasWidth = 0;
    this.canvasHeight = 0;
    this.canvasParent = null;
    this.canvasImg = null;
    this.isDrawing = false;
    this.startX = 0;
    this.startY = 0;
    this.currentTool = 'arrow';
    this.actions = [];
    this.undoStack = [];
    this.textElements = [];
    this.ellipses = [];
    this.currentWidth = 2;
    this.currentColor = 'red';
    this.canvasRectInfo = null;
    this.canvasCursor = 'default';
    this.endPointRadius = 6;
    this.endPointFillColor = "#FFFFFF";
    this.indexChoosePoint = -1;
    this.m_iIndexHoverPoint = -1;
    this.m_szDrawColor = this.currentColor;
    this.ratio = 1;
    this.typeAndShapeMap = {
      'arrow': 'arrowList',
      'scribble': 'scribbleList',
      'eraser': 'eraserList',
      'mosaic': 'mosaicList',
      'text': 'textList',
      'rect': 'rectList'
    };
    this.arrowOperationState = 'add';
    this.currentOperationInfo = null;
    this.arrowList = [];
    this.scribbleList = [];
    this.eraserList = [];
    this.mosaicList = [];
    this.mosaicDimensions = 10;
    this.textList = [];
    this.textareaNode = null;
    this.rectList = [];
    this.rectOperationState = '';
    this.loadCanvas(options);
    this.initMoveEvent();
    if (options.imgSrc) {
      this.loadImage(options.imgSrc);
    }
    this.drawGradientArrow = this.drawGradientArrow.bind(this);
    this.saveAction = this.saveAction.bind(this);
  }
  return _createClass(CanvasImgEditor, [{
    key: "loadCanvas",
    value: function loadCanvas(options) {
      console.log('options', options);
      this.canvas = document.getElementById(options.canvasId);
      console.log('canvas', this.canvas);
      if (!this.canvas) {
        return;
      }
      console.log('2');
      this.canvasWidth = this.canvas.width;
      this.canvasHeight = this.canvas.height;
      this.ctx = this.canvas.getContext('2d', {
        willReadFrequently: true
      });
      if (options.parentId) {
        this.canvasParent = document.getElementById(options.parentId);
        if (this.canvasParent) {
          this.canvasParent.style.position = 'relative';
        }
      }
      this.setCanvasRatio();
      console.log('this.canvasParent', this.canvasParent);
    }
  }, {
    key: "loadImage",
    value: function loadImage(src) {
      var _this = this;
      if (src && this.canvasParent) {
        this.canvasImg = document.createElement('canvas');
        console.log('11', this.canvasImg);
        this.canvasImg.width = this.canvasWidth;
        this.canvasImg.height = this.canvasHeight;
        this.canvasParent.appendChild(this.canvasImg);
        this.ctxImg = this.canvasImg.getContext('2d', {
          willReadFrequently: true
        });
        this.canvas.style.position = 'absolute';
        this.canvas.style.zIndex = 1;
        var img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = src;
        img.onload = function () {
          _this.ctxImg.drawImage(img, 0, 0, _this.canvasWidth, _this.canvasHeight);
        };
      }
    }
  }, {
    key: "initMoveEvent",
    value: function initMoveEvent() {
      var _this2 = this;
      var canvas = this.canvas;
      var ctx = this.ctx;
      canvas.addEventListener('mousedown', function (e) {
        ctx.globalCompositeOperation = 'source-over';
        _this2.isDrawing = true;
        _this2.startX = e.offsetX;
        _this2.startY = e.offsetY;
        console.log('mousedown', _this2.currentTool, e.offsetX, e.offsetY);
        var currentTool = _this2.currentTool;
        _this2.currentOperationInfo = null;
        _this2.arrowOperationState = '';
        if (currentTool === 'arrow') {
          _this2.currentOperationInfo = null;
          var list = _this2.arrowList;
          var selected = false;
          if (list && list.length > 0) {
            var arrow = null;
            for (var len = list.length, i = len - 1; i >= 0; i--) {
              arrow = list[i];
              console.log('arrow-item', arrow);
              if (_this2.isPointOnThickLine(_this2.startX, _this2.startY, arrow.startX, arrow.startY, arrow.endX, arrow.endY)) {
                console.log('在箭头线段上');
                _this2.arrowOperationState = 'move';
                _this2.currentOperationInfo = arrow;
                selected = true;
              } else if (_this2.isMouseNearArrowPoint(_this2.startX, _this2.startY, arrow.startX, arrow.startY, 6)) {
                _this2.arrowOperationState = 'start';
                _this2.canvas.style.cursor = 'move';
                _this2.currentOperationInfo = arrow;
                selected = true;
                console.log('箭头起点');
              } else if (_this2.isMouseNearArrowPoint(_this2.startX, _this2.startY, arrow.endX, arrow.endY, 6)) {
                _this2.arrowOperationState = 'end';
                _this2.canvas.style.cursor = 'move';
                _this2.currentOperationInfo = arrow;
                console.log('箭头尾部');
                selected = true;
              }
            }
            console.log('1111', selected);
          } else if (selected === false) {
            console.log('这是新增箭头');
            _this2.arrowOperationState = 'add';
            _this2.currentOperationInfo = {
              id: canvasGlobalId++,
              type: 'arrow',
              startX: _this2.startX,
              startY: _this2.startY,
              endX: _this2.startX,
              endY: _this2.startY,
              color: _this2.currentColor,
              startWidth: _this2.currentWidth - 0,
              endWidth: _this2.currentWidth - 0 + 7
            };
          }
          console.log('selected', selected);
          console.log('mouseDown', _this2.arrowOperationState);
          console.log('his.currentOperationInfo', _this2.currentOperationInfo);
        } else if (currentTool === 'scribble') {
          _this2.currentOperationInfo = {
            type: 'scribble',
            id: canvasGlobalId++,
            list: []
          };
        } else if (currentTool === 'eraser') {
          _this2.currentOperationInfo = {
            type: 'eraser',
            id: canvasGlobalId++,
            list: []
          };
        } else if (currentTool === 'text') {
          var newText = {
            id: canvasGlobalId++,
            text: "Hello world--".concat(canvasGlobalId),
            color: 'red',
            lineWidth: 2,
            maxWidth: _this2.canvasWidth,
            startX: _this2.startX,
            startY: _this2.startY
          };
          _this2.currentOperationInfo = newText;
          console.log('text---position', _this2.startX, _this2.startY);
          _this2.drawText(newText);
        } else if (currentTool === 'rect') {
          _this2.rectOperationState = '';
          var _list = _this2.rectList;
          var _selected = false;
          if (_list && _list.length > 0) {
            var rect = null;
            for (var _len = _list.length, _i = _len - 1; _i >= 0; _i--) {
              rect = _list[_i];
              if (_this2.inArc(_this2.startX, _this2.startY, _this2.endPointRadius, rect.allPointList)) {
                console.log("\u5728\u77E9\u5F62\u8FB9\u89D2\uFF0C \u53EF\u4EE5\u6839\u636E\u7AEF\u70B9\u7D22\u5F15\u5224\u65AD\u662F\u5728\u54EA\u4E2A\u70B9:".concat(_this2.indexChoosePoint));
                _this2.rectOperationState = 'resize';
                _this2.currentOperationInfo = rect;
                _this2.modifyCursor('e-resize');
                _selected = true;
                break;
              } else if (_this2.inShape(_this2.startX, _this2.startY, rect.allPointList)) {
                console.log('在矩形内部');
                _selected = true;
                _this2.rectOperationState = 'move';
                _this2.currentOperationInfo = rect;
                _this2.modifyCursor('move');
                break;
              }
            }
            console.log('矩形选中状态', _selected);
          } else if (!_selected) {
            console.log('添加矩形');
            _this2.rectOperationState = 'add';
            var newRect = {
              id: canvasGlobalId++,
              type: 'rect',
              startX: _this2.startX,
              startY: _this2.startY,
              width: 0,
              height: 0,
              color: _this2.currentColor,
              lineWidth: _this2.currentWidth,
              pointList: [[_this2.startX, _this2.startY], [_this2.startX, _this2.startY], [_this2.startX, _this2.startY], [_this2.startX, _this2.startY]]
            };
            _this2.rectList.push(newRect);
            _this2.currentOperationInfo = newRect;
          }
        } else if (currentTool === 'mosaic') {
          _this2.currentOperationInfo = _this2.createMosaicInfo(_this2.startX, _this2.startY);
        }
      });
      canvas.addEventListener('mousemove', function (e) {
        if (!_this2.isDrawing) return;
        var currentX = e.offsetX;
        var currentY = e.offsetY;
        var currentTool = _this2.currentTool;
        if (currentTool === 'arrow') {
          var currentOperationInfo = _this2.currentOperationInfo,
            arrowOperationState = _this2.arrowOperationState;
          _this2.reDrawCanvas();
          if (arrowOperationState === 'move') {
            console.log('move');
            var dx = currentX - _this2.startX;
            var dy = currentY - _this2.startY;
            currentOperationInfo.startX += dx;
            currentOperationInfo.startY += dy;
            currentOperationInfo.endX += dx;
            currentOperationInfo.endY += dy;
            _this2.drawGradientArrow(currentOperationInfo.startX, currentOperationInfo.startY, currentOperationInfo.endX, currentOperationInfo.endY, currentOperationInfo.startWidth, currentOperationInfo.endWidth, currentOperationInfo.color);
            _this2.startX = currentX;
            _this2.startY = currentY;
          } else if (arrowOperationState === 'end') {
            _this2.drawGradientArrow(currentOperationInfo.startX, currentOperationInfo.startY, currentX, currentY, currentOperationInfo.startWidth, currentOperationInfo.endWidth, currentOperationInfo.color);
          } else if (arrowOperationState === 'start') {
            _this2.drawGradientArrow(currentX, currentY, currentOperationInfo.endX, currentOperationInfo.endY, currentOperationInfo.startWidth, currentOperationInfo.endWidth, currentOperationInfo.color);
          } else {
            _this2.drawGradientArrow(_this2.startX, _this2.startY, currentX, currentY, currentOperationInfo.startWidth, currentOperationInfo.endWidth, currentOperationInfo.color);
          }
        } else if (currentTool === 'scribble') {
          var newScribble = {
            startX: _this2.startX,
            startY: _this2.startY,
            endX: currentX,
            endY: currentY,
            width: 2,
            color: _this2.currentColor
          };
          _this2.currentOperationInfo.list.push(newScribble);
          _this2.drawScribble(newScribble);
        } else if (currentTool === 'eraser') {
          var newEraser = {
            x: currentX,
            y: currentY,
            width: 10,
            color: _this2.currentColor
          };
          _this2.currentOperationInfo.list.push(newEraser);
          _this2.drawEraser(newEraser);
        } else if (currentTool === 'rect') {
          if (_this2.rectOperationState === 'move') {
            var _dx = currentX - _this2.startX;
            var _dy = currentY - _this2.startY;
            _this2.currentOperationInfo.startX += _dx;
            _this2.currentOperationInfo.startY += _dy;
            _this2.resizeRectWidthAndPoint(_this2.currentOperationInfo.pointList[2][0] + _dx, _this2.currentOperationInfo.pointList[2][1] + _dy);
            _this2.startX = currentX;
            _this2.startY = currentY;
          } else if (_this2.rectOperationState === 'resize') {
            console.log('mousemove-rect-resize');
            _this2.stretch(currentX, currentY, _this2.currentOperationInfo);
          } else if (_this2.rectOperationState === 'add') {
            console.log('mousemove-rect-add');
            _this2.resizeRectWidthAndPoint(currentX, currentY);
          }
        } else if (currentTool === 'mosaic') {
          _this2.handleMasaic(currentX, currentY);
        }
      });
      canvas.addEventListener('mouseup', function () {
        if (_this2.isDrawing) {
          _this2.isDrawing = false;
          _this2.handleArrowSaveAction();
          _this2.handleScribbleSaveAction();
          _this2.handleEraserSaveAction();
          _this2.handleRectSaveAction();
          _this2.saveAction();
          var currentTool = _this2.currentTool;
          if (currentTool === 'arrow') {
            console.log("\u7BAD\u5934\u7684\u4E24\u7AEF\u70B9\uFF1A(".concat(_this2.currentOperationInfo.startX, ",").concat(_this2.currentOperationInfo.startY, ")-(").concat(_this2.currentOperationInfo.endX, ",").concat(_this2.currentOperationInfo.endY, ")"));
          }
        }
      });
      canvas.addEventListener('mouseleave', function () {
        if (_this2.isDrawing) {
          _this2.isDrawing = false;
          _this2.saveAction();
        }
      });
    }
  }, {
    key: "drawGradientArrow",
    value: function drawGradientArrow(fromX, fromY, toX, toY) {
      var startWidth = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
      var endWidth = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 8;
      var color = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 'red';
      var ctx = this.ctx;
      var steps = 300;
      var dx = (toX - fromX) / steps;
      var dy = (toY - fromY) / steps;
      ctx.lineCap = 'round';
      ctx.globalCompositeOperation = 'source-over';
      for (var i = 0; i < steps; i++) {
        var x1 = fromX + i * dx;
        var y1 = fromY + i * dy;
        var x2 = fromX + (i + 1) * dx;
        var y2 = fromY + (i + 1) * dy;
        var lineWidth = startWidth + (endWidth - startWidth) * (i / steps);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
      var angle = Math.atan2(toY - fromY, toX - fromX);
      var headLength = endWidth * 2;
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
      ctx.lineTo(toX, toY);
      ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
      ctx.strokeStyle = color;
      ctx.lineWidth = endWidth;
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(fromX, fromY, 5, 0, Math.PI * 2, true);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(toX, toY, 5, 0, Math.PI * 2, true);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      var currentOperationInfo = this.currentOperationInfo;
      currentOperationInfo.startX = fromX;
      currentOperationInfo.startY = fromY;
      currentOperationInfo.endX = toX;
      currentOperationInfo.endY = toY;
      currentOperationInfo.startWidth = startWidth;
      currentOperationInfo.endWidth = endWidth;
      currentOperationInfo.color = color;
    }
  }, {
    key: "isMouseNearArrowPoint",
    value: function isMouseNearArrowPoint(x, y, pointX, pointY, radius) {
      console.log('isMouseNearArrowPoint-current*******', x, y);
      console.log('isMouseNearArrowPoint-point', pointX, pointY);
      var dx = x - pointX;
      var dy = y - pointY;
      console.log('dx', dx);
      console.log('dy', dy);
      return dx * dx + dy * dy <= radius * radius;
    }
  }, {
    key: "isPointOnThickLine",
    value: function isPointOnThickLine(mx, my, x1, y1, x2, y2) {
      var lineWidth = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 8;
      var dx = x2 - x1;
      var dy = y2 - y1;
      var lengthSquared = dx * dx + dy * dy;
      var t = ((mx - x1) * dx + (my - y1) * dy) / lengthSquared;
      var projectionX = x1 + t * dx;
      var projectionY = y1 + t * dy;
      var distance = Math.hypot(mx - projectionX, my - projectionY);
      var withinSegment = t >= 0 && t <= 1;
      return distance <= lineWidth / 2 && withinSegment;
    }
  }, {
    key: "handleArrowSaveAction",
    value: function handleArrowSaveAction() {
      if (this.currentTool === 'arrow') {
        if (this.currentOperationInfo && this.arrowOperationState === 'add') {
          this.arrowList.push(JSON.parse(JSON.stringify(this.currentOperationInfo)));
        }
      }
    }
  }, {
    key: "createMosaicInfo",
    value: function createMosaicInfo(x, y) {
      var newInfo = {
        id: canvasGlobalId++,
        type: 'mosaic',
        list: [],
        startX: x,
        startY: y
      };
      this.mosaicList.push(newInfo);
      return newInfo;
    }
  }, {
    key: "handleMasaic",
    value: function handleMasaic(x, y) {
      var ratio = this.ratio,
        mosaicDimensions = this.mosaicDimensions,
        ctx = this.ctx;
      var dimensions = mosaicDimensions * ratio;
      var pointer = {
        x: x,
        y: y
      };
      console.log('dimensions', dimensions);
      console.log('pointer', pointer);
      var imageData = ctx.getImageData(parseInt(pointer.x, 10), parseInt(pointer.y, 10), dimensions, dimensions);
      console.log('imageData', imageData);
      var rgba = [0, 0, 0, 0];
      var length = imageData.data.length / 4;
      for (var i = 0; i < length; i++) {
        rgba[0] += imageData.data[i * 4];
        rgba[1] += imageData.data[i * 4 + 1];
        rgba[2] += imageData.data[i * 4 + 2];
        rgba[3] += imageData.data[i * 4 + 3];
      }
      console.log('rgba', rgba);
      var fill = "rgba(".concat(Number.parseInt(rgba[0] / length, 10), ",").concat(Number.parseInt(rgba[1] / length, 10), ",").concat(Number.parseInt(rgba[2] / length, 10), ",0.5)");
      console.log('fill', fill);
      var mosaicRect = {
        left: pointer.x,
        top: pointer.y,
        fill: fill,
        dimensions: dimensions
      };
      this.currentOperationInfo.list.push(mosaicRect);
      this.reDrawCanvas();
    }
  }, {
    key: "drawMosaic",
    value: function drawMosaic(mosaicRect) {
      var ctx = this.ctx;
      ctx.fillStyle = mosaicRect.fill;
      ctx.fillRect(mosaicRect.left, mosaicRect.top, mosaicRect.dimensions, mosaicRect.dimensions);
    }
  }, {
    key: "redrawMosaicList",
    value: function redrawMosaicList() {
      var _this$mosaicList,
        _this3 = this;
      (_this$mosaicList = this.mosaicList) === null || _this$mosaicList === void 0 ? void 0 : _this$mosaicList.forEach(function (mosaicItem) {
        mosaicItem === null || mosaicItem === void 0 ? void 0 : mosaicItem.list.forEach(function (mosaicRect) {
          _this3.drawMosaic(mosaicRect);
        });
      });
    }
  }, {
    key: "drawScribble",
    value: function drawScribble(item) {
      var isNormal = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var ctx = this.ctx;
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.moveTo(item.startX, item.startY);
      ctx.lineTo(item.endX, item.endY);
      ctx.strokeStyle = item.color;
      ctx.lineWidth = item.width;
      ctx.stroke();
      ctx.closePath();
      if (isNormal) {
        this.startX = item.endX;
        this.startY = item.endY;
      }
    }
  }, {
    key: "drawEraser",
    value: function drawEraser(item) {
      var ctx = this.ctx;
      ctx.beginPath();
      ctx.arc(item.x, item.y, item.width, 0, Math.PI * 2);
      ctx.fillStyle = item.color;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fill();
      ctx.closePath();
    }
  }, {
    key: "handleScribbleSaveAction",
    value: function handleScribbleSaveAction() {
      if (this.currentTool === "scribble") {
        if (this.currentOperationInfo) {
          this.scribbleList.push(JSON.parse(JSON.stringify(this.currentOperationInfo)));
          console.log('handleArrowSaveAction---this.scribbleList', this.scribbleList);
        }
      }
    }
  }, {
    key: "handleEraserSaveAction",
    value: function handleEraserSaveAction() {
      if (this.currentTool === "eraser") {
        if (this.currentOperationInfo) {
          this.eraserList.push(JSON.parse(JSON.stringify(this.currentOperationInfo)));
          console.log('handleArrowSaveAction---this.eraserList', this.eraserList);
        }
        this.ctx.globalCompositeOperation = 'source-over';
      }
    }
  }, {
    key: "drawText",
    value: function drawText(item) {
      var ctx = this.ctx;
      ctx.fillStyle = item.color;
      ctx.strokeStyle = item.color;
      ctx.lineWidth = item.lineWidth;
      ctx.strokeText(item.text, item.startX, item.startY, item.maxWidth);
    }
  }, {
    key: "createTextarea",
    value: function createTextarea() {
      var container = this.canvasParent;
      var textarea = document.createElement('textarea');
      textarea.className = 'canvas-textarea';
      textarea.setAttribute('style', 'position: absolute; padding: 0px; display: none; border: 1px dotted red; overflow: hidden; resize: none; outline: none; border-radius: 0px; background-color: transparent; appearance: none; z-index: 99999; white-space: pre; left: 296.495px; top: 153.467px; width: 74px; height: 21px; transform: rotate(0deg); color: rgb(255, 52, 64); font-size: 18.2292px; font-family: &quot;Times New Roman&quot;; font-weight: normal; text-align: left; line-height: 1.26; transform-origin: left top;');
      textarea.setAttribute('wrap', 'off');
      container.appendChild(textarea);
      this.textareaNode = textarea;
    }
  }, {
    key: "drawRect",
    value: function drawRect(item) {
      console.log('drawRect');
      var ctx = this.ctx;
      var width = item.width,
        height = item.height,
        _item$editType = item.editType,
        editType = _item$editType === void 0 ? 0 : _item$editType,
        _item$pointList = item.pointList,
        pointList = _item$pointList === void 0 ? [] : _item$pointList;
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = item.lineWidth || 2;
      ctx.strokeStyle = item.color || 'black';
      var startX = pointList[0][0];
      var startY = pointList[0][1];
      item.startX = startX;
      item.startY = startY;
      ctx.strokeRect(item.startX, item.startY, item.width, item.height);
      if (width > 30 && height > 30) {
        var iHalfWidth = Math.round(width / 2);
        var iHalfHeight = Math.round(height / 2);
        if (editType === 0) {
          var aPointX = [startX, startX + iHalfWidth, startX + width, startX, startX + width, startX, startX + iHalfWidth, startX + width];
          var aPointY = [startY, startY, startY, startY + iHalfHeight, startY + iHalfHeight, startY + height, startY + height, startY + height];
          var allPointList = [];
          for (var i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.arc(aPointX[i], aPointY[i], this.endPointRadius, 0, 360, false);
            ctx.fillStyle = this.m_szDrawColor;
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.strokeStyle = this.endPointFillColor;
            ctx.arc(aPointX[i], aPointY[i], this.endPointRadius + 1, 0, 360, false);
            ctx.closePath();
            ctx.stroke();
            allPointList.push([aPointX[i], aPointY[i]]);
          }
          item.allPointList = allPointList;
        }
      }
    }
  }, {
    key: "inShape",
    value: function inShape(iPointX, iPointY, aPoint) {
      var bRet = false;
      var iLen = aPoint.length;
      for (var i = 0, j = iLen - 1; i < iLen; j = i++) {
        var _aPoint$i = _slicedToArray(aPoint[i], 2),
          x1 = _aPoint$i[0],
          y1 = _aPoint$i[1];
        var _aPoint$j = _slicedToArray(aPoint[j], 2),
          x2 = _aPoint$j[0],
          y2 = _aPoint$j[1];
        if (y1 > iPointY !== y2 > iPointY && iPointX < (x2 - x1) * (iPointY - y1) / (y2 - y1) + x1) {
          bRet = !bRet;
        }
      }
      return bRet;
    }
  }, {
    key: "inArc",
    value: function inArc(iPointX, iPointY, iRadius) {
      var aPoint = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
      var chooseEnabled = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
      console.log('inArc-x-y', iPointX, iPointY);
      console.log('inArc-aPoint', aPoint);
      var bRet = false;
      var iLen = aPoint.length;
      for (var i = 0; i < iLen; i++) {
        console.log("\u70B9".concat(i, ":(").concat(aPoint[i][0], ",").concat(aPoint[i][1], ")"));
        console.log("\u70B9".concat(i, "\u5230\u5706\u5FC3\u7684\u8DDD\u79BB:"), aPoint[i]);
        console.log("\u8BA1\u7B97\u7ED3\u679C:", iPointX - aPoint[i][0], iPointY - aPoint[i][1]);
        var iDistance = Math.sqrt((iPointX - aPoint[i][0]) * (iPointX - aPoint[i][0]) + (iPointY - aPoint[i][1]) * (iPointY - aPoint[i][1]));
        console.log('半径：', iRadius);
        if (iDistance < iRadius) {
          bRet = true;
          if (chooseEnabled) {
            this.indexChoosePoint = i;
          } else {
            this.m_iIndexHoverPoint = i;
          }
          break;
        } else {
          this.m_iIndexHoverPoint = -1;
        }
      }
      return bRet;
    }
  }, {
    key: "inLine",
    value: function inLine(px, py) {
      var aPoint = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
      var isOnEdge = false;
      for (var i = 0; i < aPoint.length; i++) {
        var p1 = aPoint[i];
        var p2 = aPoint[(i + 1) % aPoint.length];
        var x1 = p1[0];
        var y1 = p1[1];
        var x2 = p2[0];
        var y2 = p2[1];
        var distance = Math.abs((y2 - y1) * px - (x2 - x1) * py + x2 * y1 - y2 * x1) / Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
        if (distance <= 2) {
          isOnEdge = true;
          this.m_iInsertPos = i + 1;
          break;
        }
      }
      return isOnEdge;
    }
  }, {
    key: "modifyCursor",
    value: function modifyCursor(type) {
      var cssCursor = cursorTypeMap[type];
      if (cssCursor) {
        this.canvasCursor = cssCursor;
        this.canvas.style.cursor = cssCursor;
      }
    }
  }, {
    key: "stretch",
    value: function stretch(iPointX, iPointY, item) {
      console.log('stretch', this.indexChoosePoint);
      var _item$editType2 = item.editType,
        editType = _item$editType2 === void 0 ? 0 : _item$editType2,
        _item$pointList2 = item.pointList,
        pointList = _item$pointList2 === void 0 ? [] : _item$pointList2;
      if (editType === 0) {
        var changed = false;
        if (this.indexChoosePoint === 0) {
          if (iPointX < pointList[2][0] && iPointY < pointList[2][1]) {
            pointList[0][0] = iPointX;
            pointList[0][1] = iPointY;
            pointList[3][0] = iPointX;
            pointList[1][1] = iPointY;
            changed = true;
          }
        } else if (this.indexChoosePoint === 1) {
          if (iPointY < pointList[2][1]) {
            pointList[0][1] = iPointY;
            pointList[1][1] = iPointY;
            changed = true;
          }
        } else if (this.indexChoosePoint === 2) {
          if (iPointX > pointList[3][0] && iPointY < pointList[3][1]) {
            pointList[1][0] = iPointX;
            pointList[1][1] = iPointY;
            pointList[2][0] = iPointX;
            pointList[0][1] = iPointY;
            changed = true;
          }
        } else if (this.indexChoosePoint === 3) {
          if (iPointX < pointList[2][0]) {
            pointList[0][0] = iPointX;
            pointList[3][0] = iPointX;
            changed = true;
          }
        } else if (this.indexChoosePoint === 4) {
          if (iPointX > pointList[0][0]) {
            pointList[1][0] = iPointX;
            pointList[2][0] = iPointX;
            changed = true;
          }
        } else if (this.indexChoosePoint === 5) {
          if (iPointX < pointList[1][0] && iPointY > pointList[1][1]) {
            pointList[3][0] = iPointX;
            pointList[3][1] = iPointY;
            pointList[0][0] = iPointX;
            pointList[2][1] = iPointY;
            changed = true;
          }
        } else if (this.indexChoosePoint === 6) {
          if (iPointY > pointList[1][1]) {
            pointList[2][1] = iPointY;
            pointList[3][1] = iPointY;
            changed = true;
          }
        } else if (this.indexChoosePoint === 7) {
          if (iPointX > pointList[0][0] && iPointY > pointList[0][1]) {
            pointList[2][0] = iPointX;
            pointList[2][1] = iPointY;
            pointList[1][0] = iPointX;
            pointList[3][1] = iPointY;
            changed = true;
          }
        }
        console.log('changed', changed, pointList);
        if (changed) {
          var width = pointList[2][0] - pointList[0][0];
          var height = pointList[2][1] - pointList[0][1];
          console.log('w, h', width, height);
          item.width = width;
          item.height = height;
          console.log('s-x, y', item.startX, item.startY);
          this.reDrawCanvas();
        }
      }
    }
  }, {
    key: "resizeRectWidthAndPoint",
    value: function resizeRectWidthAndPoint(currentX, currentY) {
      var width = currentX - this.currentOperationInfo.startX;
      var height = currentY - this.currentOperationInfo.startY;
      var rightBottomX = this.currentOperationInfo.startX + width;
      var rightBottomY = this.currentOperationInfo.startY + height;
      this.currentOperationInfo.pointList[0] = [this.currentOperationInfo.startX, this.currentOperationInfo.startY];
      this.currentOperationInfo.pointList[1] = [rightBottomX, this.currentOperationInfo.startY];
      this.currentOperationInfo.pointList[2] = [rightBottomX, rightBottomY];
      this.currentOperationInfo.pointList[3] = [this.currentOperationInfo.startX, rightBottomY];
      this.currentOperationInfo.width = width;
      this.currentOperationInfo.height = height;
      this.reDrawCanvas();
    }
  }, {
    key: "handleRectSaveAction",
    value: function handleRectSaveAction() {
      var _this4 = this;
      if (this.currentTool === "rect" && this.rectOperationState === 'add') {
        if (this.currentOperationInfo) {
          var sameItem = this.rectList.find(function (item) {
            return item.id === _this4.currentOperationInfo.id;
          });
          if (!sameItem) {
            this.rectList.push(JSON.parse(JSON.stringify(this.currentOperationInfo)));
          }
          console.log('handleArrowSaveAction---this.eraserList', this.rectList);
        }
      }
    }
  }, {
    key: "saveAction",
    value: function saveAction() {
      if (this.currentOperationInfo) {
        this.actions.push(JSON.parse(JSON.stringify(this.currentOperationInfo)));
      }
      console.log('saveaction-this.actions', this.actions);
      console.log('saveAction-this.arrowList', this.arrowList);
      this.undoStack = [];
      this.modifyCursor('auto');
    }
  }, {
    key: "undo",
    value: function undo() {
      if (this.actions.length > 0) {
        var lastAction = this.actions.pop();
        console.log('this.actions', this.actions);
        this.undoStack.push(lastAction);
        var sameIdAction = this.actions.filter(function (item) {
          return item.id === lastAction.id;
        });
        console.log('sameIdAction', sameIdAction);
        var typeAndShapeMap = this.typeAndShapeMap;
        var type = lastAction.type,
          id = lastAction.id;
        var list = [];
        if (typeAndShapeMap[type] && this[typeAndShapeMap[type]]) {
          list = this[typeAndShapeMap[type]];
        }
        if (!list || !list.length) {
          return;
        }
        if (sameIdAction.length) {
          var index = list.findIndex(function (item) {
            return item.id === id;
          });
          if (index > -1) {
            list.splice(index, 1, sameIdAction[sameIdAction.length - 1]);
          }
        } else {
          var _index = list.findIndex(function (item) {
            return item.id == lastAction.id;
          });
          if (_index > -1) {
            list.splice(_index, 1);
          }
        }
        this.reDrawCanvas();
      }
    }
  }, {
    key: "redo",
    value: function redo() {
      if (this.undoStack.length > 0) {
        var redoAction = this.undoStack.pop();
        this.actions.push(redoAction);
        var typeAndShapeMap = this.typeAndShapeMap;
        var type = redoAction.type,
          id = redoAction.id;
        var list = [];
        if (typeAndShapeMap[type] && this[typeAndShapeMap[type]]) {
          list = this[typeAndShapeMap[type]];
        }
        if (!Array.isArray(list)) {
          return;
        }
        var index = list.findIndex(function (item) {
          return item.id === id;
        });
        if (index > -1) {
          list.splice(index, 1, redoAction);
        } else {
          list.push(redoAction);
        }
        this.reDrawCanvas();
      }
    }
  }, {
    key: "clear",
    value: function clear() {
      var _this5 = this;
      this.clearCanvas();
      this.actions = [];
      this.redoAction = [];
      this.undoStack = [];
      Object.values(this.typeAndShapeMap).forEach(function (key) {
        _this5[key] = [];
      });
    }
  }, {
    key: "reDrawCanvas",
    value: function reDrawCanvas() {
      var _this6 = this;
      this.clearCanvas();
      if (this.arrowList && this.arrowList.length) {
        this.arrowList.forEach(function (item) {
          _this6.currentOperationInfo = item;
          _this6.drawGradientArrow(item.startX, item.startY, item.endX, item.endY, item.startWidth, item.endWidth, item.color);
        });
      }
      if (this.scribbleList && this.scribbleList.length) {
        this.scribbleList.forEach(function (item) {
          var _item$list;
          if ((_item$list = item.list) !== null && _item$list !== void 0 && _item$list.length) {
            item.list.forEach(function (block) {
              _this6.drawScribble(block, false);
            });
          }
        });
      }
      if (this.eraserList && this.eraserList.length) {
        this.eraserList.forEach(function (item) {
          var _item$list2;
          if ((_item$list2 = item.list) !== null && _item$list2 !== void 0 && _item$list2.length) {
            item.list.forEach(function (block) {
              _this6.drawEraser(block);
            });
          }
        });
      }
      if (this.rectList && this.rectList.length) {
        this.rectList.forEach(function (item) {
          _this6.drawRect(item);
        });
      }
      this.redrawMosaicList();
    }
  }, {
    key: "clearCanvas",
    value: function clearCanvas() {
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
  }, {
    key: "download",
    value: function download() {
      var mergedCanvas = document.createElement('canvas');
      mergedCanvas.width = this.canvasWidth;
      mergedCanvas.height = this.canvasHeight;
      var mergeCtx = mergedCanvas.getContext('2d');
      mergeCtx.drawImage(this.canvasImg, 0, 0);
      mergeCtx.drawImage(this.canvas, 0, 0);
      mergedCanvas.toBlob(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'merged_image.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }
  }, {
    key: "changeColor",
    value: function changeColor(val) {
      this.currentColor = val;
    }
  }, {
    key: "changeStrokeWidth",
    value: function changeStrokeWidth(val) {
      this.currentWidth = val;
    }
  }, {
    key: "enlarge",
    value: function enlarge() {
      var rect = this.canvas.getBoundingClientRect();
      this.canvasWidth = rect.width * 2;
      this.canvasHeight = rect.height * 2;
    }
  }, {
    key: "reduce",
    value: function reduce() {
      var rect = this.canvas.getBoundingClientRect();
      this.canvasWidth = rect.width;
      this.canvasHeight = rect.height;
    }
  }, {
    key: "getCanvasRatio",
    value: function getCanvasRatio() {
      var originWidth = this.canvas.width;
      var cssWidth = originWidth;
      if (this.canvas.style.width) {
        cssWidth = parseInt(this.canvas.style.width, 10);
      }
      return originWidth / cssWidth;
    }
  }, {
    key: "setCanvasRatio",
    value: function setCanvasRatio() {
      this.ratio = Math.ceil(this.getCanvasRatio());
      console.log('setCanvasRatio', this.ratio);
    }
  }]);
}();

exports.default = CanvasImgEditor;
//# sourceMappingURL=index.js.map
