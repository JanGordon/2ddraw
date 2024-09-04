(() => {
  // node_modules/kleinui/lib.ts
  function elementToNode(el) {
    if (typeof el == "string") {
      return new kleinTextNode(el);
    }
    return el;
  }
  var styleGroup = class {
    members = [];
    checksum = 0;
    styles;
    className;
    constructor(styles, className) {
      this.styles = styles;
      this.className = className;
    }
    set(style) {
      this.styles.push(style);
      this.checksum++;
    }
    getCss() {
      var s = "";
      for (let i of this.styles) {
        s += `${i[0]} {${i[1]}}`;
      }
      return s;
    }
  };
  function rerenderBasics(node) {
    node.changes = [];
    node.htmlNode.style.cssText = node.styles.join("\n");
    node.updateDimensions();
    node.htmlNode.className = node.classes.join(" ");
    for (let i of node.styleGroups) {
      node.htmlNode.classList.add(i.className);
    }
    addStyleGroupStylesToDOM(node.styleGroups);
    for (let i of node.children) {
      if (i.htmlNode || i.textNode) {
        i.rerender();
      } else {
        i.render(node.htmlNode);
      }
    }
  }
  function renderBasics(node, element) {
    node.updateDimensionsBlindly();
    node.htmlNode = element;
    node.htmlNode.style.cssText = node.styles.join("\n");
    for (let i of node.changes) {
      i();
    }
    node.changes = [];
    for (let i of node.onMountQueue) {
      i();
    }
    node.onMountQueue = [];
  }
  var kleinElementNode = class {
    htmlNode;
    onMountQueue = [];
    nodeType = 0 /* basic */;
    styles = [];
    styleGroups = [];
    flag = /* @__PURE__ */ new Map([]);
    classes = [];
    changes = [];
    setFlag(key, val) {
      this.flag.set(key, val);
      return this;
    }
    setAttribute(key, val) {
      this.changes.push(() => {
        this.htmlNode.setAttribute(key, val);
      });
      return this;
    }
    getAttribute(key) {
      if (this.htmlNode) {
        return this.htmlNode.getAttribute(key);
      }
      return null;
    }
    addClass(className) {
      this.changes.push(() => {
        this.htmlNode.classList.add(className);
      });
      let index = this.classes.indexOf(className);
      if (index == -1) {
        this.classes.push(className);
      }
      return this;
    }
    hasClass(className) {
      if (this.htmlNode) {
        return this.htmlNode.classList.contains(className);
      }
      return false;
    }
    toggleClass(className) {
      this.changes.push(() => {
        this.htmlNode.classList.toggle(className);
      });
      let index = this.classes.indexOf(className);
      if (index == -1) {
        this.classes.push(className);
      } else {
        this.classes.splice(index);
      }
      return this;
    }
    removeClass(className) {
      this.changes.push(() => {
        this.htmlNode.classList.remove(className);
      });
      let index = this.classes.indexOf(className);
      if (index != -1) {
        this.classes.splice(index);
      }
      return this;
    }
    addStyle(style) {
      this.styles.push(style);
      this.changes.push(() => {
        this.htmlNode.style.cssText += style;
      });
      return this;
    }
    addToStyleGroup(group) {
      this.changes.push(() => {
        this.htmlNode.classList.add(group.className);
        addStyleGroupStylesToDOM([group]);
      });
      this.styleGroups.push(group);
      group.members.push(this);
      return this;
    }
    constructor(...children) {
      for (let i of children) {
        let p = elementToNode(i);
        p.parent = this;
        this.changes.push(() => {
          p.render(this.htmlNode);
        });
        this.children.push(p);
      }
    }
    addEventListener(event, callback) {
      if (this.htmlNode) {
        this.htmlNode.addEventListener(event, (e) => callback(this, e));
      } else {
        this.onMountQueue.push(() => {
          this.htmlNode.addEventListener(event, (e) => callback(this, e));
        });
      }
      return this;
    }
    children = [];
    addChildren(...children) {
      for (let i of children) {
        let p = elementToNode(i);
        p.parent = this;
        this.children.push(p);
        this.changes.push(() => {
          p.render(this.htmlNode);
        });
      }
    }
    removeAllChildren() {
      this.children = [];
      this.changes.push(() => {
        this.htmlNode.innerHTML = "";
      });
    }
    removeChild(child) {
      this.children.splice(this.children.indexOf(child));
      this.changes.push(() => {
        this.htmlNode.removeChild(child.htmlNode);
      });
    }
    parent;
    render(target) {
      let element = document.createElement("div");
      renderBasics(this, element);
      target.appendChild(element);
    }
    rerender() {
      rerenderBasics(this);
    }
    updateDimensions() {
      computeDimensions(this, true);
      this.updateDimensionsBlindly();
    }
    updateDimensionsBlindly() {
      const d = () => {
        if (this.width > 0) {
          this.htmlNode.style.width = this.width + "px";
        }
        if (this.height > 0) {
          this.htmlNode.style.height = this.height + "px";
        }
      };
      if (this.htmlNode) {
        d();
      } else {
        this.onMountQueue.push(d);
      }
      for (let i of this.children) {
        i.updateDimensionsBlindly();
      }
    }
    widthExpression;
    heightExpression;
    width = -1;
    // width in px
    height = -1;
    // width in px
    setWidth(expression, test) {
      if (test) {
      }
      this.widthExpression = expression;
      return this;
    }
    getWidth() {
      return this.width;
    }
    setHeight(expression) {
      this.heightExpression = expression;
      return this;
    }
    getHeight() {
      return this.height;
    }
    lightRerender() {
      this.updateDimensions();
      if (this.htmlNode) {
        for (let i of this.changes) {
          i();
        }
        this.changes = [];
      } else {
        console.error("I haven't been rendered yet");
      }
      for (let i of this.children) {
        if (i.nodeType == 1 /* text */) {
          if (!i.textNode) {
            i.render(this.htmlNode);
            i.changes = [];
          }
        } else {
          if (i.htmlNode) {
            i.lightRerender();
          } else {
            i.render(this.htmlNode);
            i.changes = [];
          }
        }
      }
    }
    applyLastChange() {
      if (this.changes.length > 0) {
        this.changes[this.changes.length - 1]();
      }
      this.changes.pop();
    }
  };
  function computeDimensions(rootNode, recursive) {
    let widthSharers = [];
    let totalWidthSharersLength = 0;
    let totalWidthNotSharersLength = 0;
    let heightSharers = [];
    let totalHeightSharersLength = 0;
    let totalHeightNotSharersLength = 0;
    let allDimensionSharers = [];
    for (let i of rootNode.children) {
      if (i.nodeType == 0 /* basic */) {
        i = i;
        var isDimensionsSharer = false;
        if (i.widthExpression != void 0) {
          let width = i.widthExpression(i);
          if (width.lengthOfShared == 0) {
            i.width = width.length;
            totalWidthNotSharersLength += width.length;
          } else {
            isDimensionsSharer = true;
            widthSharers.push(i);
            totalWidthSharersLength += width.lengthOfShared;
          }
        }
        if (i.heightExpression != void 0) {
          let height = i.heightExpression(i);
          if (height.lengthOfShared == 0) {
            i.height = height.length;
            totalHeightNotSharersLength += height.length;
          } else {
            isDimensionsSharer = true;
            heightSharers.push(i);
            totalHeightSharersLength += height.lengthOfShared;
          }
        }
        if (isDimensionsSharer) {
          allDimensionSharers.push(i);
        } else if (recursive) {
          computeDimensions(i, true);
        }
      }
    }
    let widthOfStandardSharedWidth = (rootNode.width - totalWidthNotSharersLength) / totalWidthSharersLength;
    for (let i of widthSharers) {
      i.width = i.widthExpression(i).lengthOfShared * widthOfStandardSharedWidth;
    }
    let heightOfStandardSharedHeight = (rootNode.height - totalHeightNotSharersLength) / totalHeightSharersLength;
    for (let i of heightSharers) {
      i.height = i.heightExpression(i).lengthOfShared * heightOfStandardSharedHeight;
    }
    if (recursive) {
      for (let i of allDimensionSharers) {
        computeDimensions(i, true);
      }
    }
  }
  var kleinTextNode = class extends kleinElementNode {
    constructor(content) {
      super();
      this.content = content;
    }
    textNode;
    render(target) {
      let n = document.createTextNode(this.content);
      this.textNode = n;
      target.appendChild(n);
    }
    rerender() {
      this.textNode.data = this.content;
    }
    nodeType = 1 /* text */;
    content;
  };
  var allStyleGroups = [];
  function addStyleGroupStylesToDOM(styleGroups) {
    for (let s of styleGroups) {
      var exists = false;
      for (let index = 0; index < allStyleGroups.length; index++) {
        if (s == allStyleGroups[index]) {
          if (s.checksum != allStyleGroups[index].checksum) {
            document.head.querySelector(`#${s.className}`).innerHTML = s.getCss();
          }
          exists = true;
        }
      }
      if (!exists) {
        let styleElement = document.createElement("style");
        styleElement.id = s.className;
        styleElement.innerHTML = s.getCss();
        document.head.appendChild(styleElement);
        allStyleGroups.push(s);
      }
    }
  }
  function renderApp(node, target, resizeListener) {
    const resizeElement = document.createElement("div");
    resizeElement.style.cssText = `
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 2;
        display: none;
        align-items: center;
        justify-content: center;
        font-size: larger;
        background-color: white;
    `;
    resizeElement.innerText = "Resizing";
    document.body.appendChild(resizeElement);
    node.addStyle("width: 100%; height: 100%; overflow: hidden;");
    node.width = document.body.clientWidth;
    node.height = document.body.clientHeight;
    node.updateDimensions();
    target.style.overflow = "hidden";
    node.render(target);
  }

  // node_modules/kleinui/elements.ts
  var button = class extends kleinElementNode {
    htmlNode;
    name = "button";
    render(target) {
      let element = document.createElement("button");
      renderBasics(this, element);
      target.appendChild(element);
    }
  };
  var container = class extends kleinElementNode {
    htmlNode;
    name = "container";
    render(target) {
      let element = document.createElement("div");
      renderBasics(this, element);
      target.appendChild(element);
    }
  };
  var canvas = class extends kleinElementNode {
    htmlNode;
    name = "canvas";
    canvas = document.createElement("canvas");
    render(target) {
      renderBasics(this, this.canvas);
      target.appendChild(this.canvas);
    }
    getContext(contextId, options) {
      return this.canvas.getContext(contextId, options);
    }
  };
  var textInput = class extends kleinElementNode {
    htmlNode;
    name = "textInput";
    render(target) {
      let element = document.createElement("input");
      element.type = "text";
      renderBasics(this, element);
      target.appendChild(element);
    }
    setValue(val) {
      this.changes.push(() => {
        this.htmlNode.value = val;
      });
      return this;
    }
  };

  // keys.ts
  var keys = /* @__PURE__ */ new Map([]);
  var keybinds = /* @__PURE__ */ new Map([]);
  document.addEventListener("keydown", (e) => {
    keys.set(e.key, true);
    if (keybinds.get(e.key)) {
      for (let i of keybinds.get(e.key)) {
        i();
      }
    }
  });
  document.addEventListener("keyup", (e) => {
    keys.set(e.key, false);
  });
  function registerKeybind(key, callback) {
    if (keybinds.get(key)) {
      keybinds.get(key).push(callback);
    } else {
      keybinds.set(key, [callback]);
    }
  }

  // grid.ts
  function drawGrid(ctx2, posInWorld2, interval, bigInterval) {
    ctx2.strokeStyle = "lightgrey";
    var deadSpaceAtStartY = posInWorld2.y % interval;
    var startOfGridY = posInWorld2.y - deadSpaceAtStartY;
    for (let y = startOfGridY; y <= startOfGridY + ctx2.canvas.height + deadSpaceAtStartY; y += interval) {
      var vStart = worldToViewport(new Vec2(posInWorld2.x, y));
      var vEnd = worldToViewport(new Vec2(posInWorld2.x + ctx2.canvas.width, y));
      if (y % bigInterval == 0) {
        ctx2.lineWidth = 2;
      } else {
        ctx2.lineWidth = 0.4;
      }
      ctx2.beginPath();
      ctx2.moveTo(vStart.x, vStart.y);
      ctx2.lineTo(vEnd.x, vEnd.y);
      ctx2.stroke();
    }
    var deadSpaceAtStartX = posInWorld2.x % interval;
    var startOfGridX = posInWorld2.x - deadSpaceAtStartX;
    for (let x = startOfGridX; x <= startOfGridX + ctx2.canvas.width + deadSpaceAtStartX; x += interval) {
      var vStart = worldToViewport(new Vec2(x, posInWorld2.y));
      var vEnd = worldToViewport(new Vec2(x, posInWorld2.y + ctx2.canvas.height));
      if (x % bigInterval == 0) {
        ctx2.lineWidth = 2;
      } else {
        ctx2.lineWidth = 0.4;
      }
      ctx2.beginPath();
      ctx2.moveTo(vStart.x, vStart.y);
      ctx2.lineTo(vEnd.x, vEnd.y);
      ctx2.stroke();
    }
  }

  // part.ts
  var ellipticalPath = class {
    controlPoints = [[], [], []];
    get center() {
      return this.controlPoints[0][0];
    }
    get radius() {
      return Math.sqrt(Math.pow(this.controlPoints[0][0].x - this.controlPoints[0][1].x, 2) + Math.pow(this.controlPoints[0][0].y - this.controlPoints[0][1].y, 2));
    }
    get startAngle() {
      return 0;
      return Math.atan((this.controlPoints[1][0].x - this.controlPoints[0][0].x) / (this.controlPoints[1][0].y + this.controlPoints[0][0].y)) * (180 / Math.PI);
    }
    get endAngle() {
      return 360;
      return Math.atan((this.controlPoints[2][0].x - this.controlPoints[0][0].x) / (this.controlPoints[2][0].y + this.controlPoints[0][0].y)) * (180 / Math.PI);
    }
    draw(ctx2) {
      ctx2.beginPath();
      ctx2.ellipse(this.center.x, this.center.y, this.radius, this.radius, 0, this.startAngle, this.endAngle);
      ctx2.stroke();
    }
  };
  var freePath = class {
    controlPoints = [[]];
    draw(ctx2) {
      ctx2.beginPath();
      for (let s = 1; s < this.controlPoints.length; s++) {
        ctx2.moveTo(this.controlPoints[s - 1][0].x, this.controlPoints[s - 1][0].y);
        ctx2.lineTo(this.controlPoints[s][0].x, this.controlPoints[s][0].y);
      }
      ctx2.stroke();
    }
  };
  var linePath = class {
    controlPoints = [[], []];
    get start() {
      return this.controlPoints[0][0];
    }
    get end() {
      return this.controlPoints[1][0];
    }
    draw(ctx2) {
      ctx2.beginPath();
      ctx2.moveTo(this.start.x, this.start.y);
      ctx2.lineTo(this.end.x, this.end.y);
      ctx2.stroke();
    }
  };
  var Part = class {
    paths = [];
    draw(ctx2) {
      ctx2.lineWidth = 3;
      for (let p of this.paths) {
        p.draw(ctx2);
      }
    }
  };

  // main.ts
  var controlSnapDistance = 10;
  var gridMinorInterval = 20;
  var gridMajorInterval = 100;
  var Vec2 = class {
    x;
    y;
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
  };
  var posInWorld = new Vec2(0, 0);
  var zoomFactor = 1;
  function viewportToWorld2(pos) {
    return new Vec2(
      pos.x * zoomFactor + posInWorld.x,
      pos.y * zoomFactor + posInWorld.y
    );
  }
  function worldToViewport(pos) {
    return new Vec2(
      (pos.x - posInWorld.x) / zoomFactor,
      (pos.y - posInWorld.y) / zoomFactor
    );
  }
  var c = new canvas();
  var ctx = c.getContext("2d");
  ctx.lineCap = "round";
  var pointerPos = new Vec2(0, 0);
  var mousePos = new Vec2(0, 0);
  var mouseDown = false;
  function near(a, b, distance) {
    return a == b || b - a < distance && a - b < distance;
  }
  function near2d(a, b, distance) {
    return near(a.x, b.x, distance) && near(a.y, b.y, distance);
  }
  function closestPointOnLine(lineStart, lineEnd) {
    const lineVector = new Vec2(lineEnd.x - lineStart.x, lineEnd.y - lineStart.y);
    const cursorVector = new Vec2(mousePos.x - lineStart.x, mousePos.y - lineStart.y);
    const dotProduct = lineVector.x * cursorVector.x + lineVector.y * cursorVector.y;
    const lineMagnitudeSquared = lineVector.x * lineVector.x + lineVector.y * lineVector.y;
    const t = dotProduct / lineMagnitudeSquared;
    const clampedT = Math.max(0, Math.min(1, t));
    return new Vec2(lineStart.x + clampedT * lineVector.x, lineStart.y + clampedT * lineVector.y);
  }
  ctx.strokeStyle = "red";
  var defaultVec2 = new Vec2(0, 0);
  var draggingItems = [];
  function drawControlPoints(ctx2, controlPoints) {
    for (let c2 of controlPoints) {
      for (let i of c2) {
        ctx2.beginPath();
        var vCoords = worldToViewport(i);
        ctx2.ellipse(vCoords.x, vCoords.y, 3, 3, 0, 0, 360);
        ctx2.stroke();
        if (mouseDown && selectedMode == "select") {
          if (near(mousePos.x, vCoords.x, controlSnapDistance) && near(mousePos.y, vCoords.y, controlSnapDistance)) {
            draggingItems.push(i);
          }
          if (draggingItems.includes(i)) {
            if (i == c2[0] && c2.length > 1) {
              var yOffsetToOtherControlPoint = i.y - c2[1].y;
              var xOffsetToOtherControlPoint = i.x - c2[1].x;
              var newI = viewportToWorld2(mousePos);
              i.x = newI.x;
              i.y = newI.y;
              var newNeighbour = viewportToWorld2(new Vec2(mousePos.x - xOffsetToOtherControlPoint, mousePos.y - yOffsetToOtherControlPoint));
              c2[1].x = newNeighbour.x;
              c2[1].y = newNeighbour.y;
            } else {
              var newI = viewportToWorld2(mousePos);
              i.x = newI.x;
              i.y = newI.y;
            }
          }
        }
      }
    }
  }
  var mouseDownPos = new Vec2(0, 0);
  c.addEventListener("pointerdown", () => {
    mouseDownPos = viewportToWorld2(mousePos);
    if (selectedMode == "draw") {
      if (selectedTool) {
        toolGuides[selectedTool].handleStartDraw(toolGuides[selectedTool].controlPoints);
      } else {
        console.log(shapeGenerators);
        shapeGenerators[selectedShape].handleStartDraw(shapeGenerators[selectedShape].controlPoints);
      }
    }
    mouseDown = true;
  });
  document.addEventListener("pointerup", () => {
    mouseDown = false;
    draggingItems = [];
  });
  document.addEventListener("touchend", () => {
    mouseDown = false;
    draggingItems = [];
  });
  var lastMousePos = new Vec2(0, 0);
  var snapToIntersections = false;
  var snapDistance = 7;
  function checkSnapPoints() {
    var worldPointerPos = viewportToWorld2(pointerPos);
    if (snapToIntersections) {
      var nearestSnapPoint = new Vec2(
        Math.round(worldPointerPos.x / gridMinorInterval) * gridMinorInterval,
        Math.round(worldPointerPos.y / gridMinorInterval) * gridMinorInterval
      );
      if (near2d(pointerPos, nearestSnapPoint, snapDistance)) {
        return nearestSnapPoint;
      }
    } else {
      var closestXSnapPoint = Math.round(worldPointerPos.x / gridMinorInterval) * gridMinorInterval;
      var closestYSnapPoint = Math.round(worldPointerPos.y / gridMinorInterval) * gridMinorInterval;
      var newPos = new Vec2(pointerPos.x, pointerPos.y);
      if (near(pointerPos.x, closestXSnapPoint, snapDistance)) {
        newPos.x = closestXSnapPoint;
      }
      if (near(pointerPos.y, closestYSnapPoint, snapDistance)) {
        newPos.y = closestYSnapPoint;
      }
      return newPos;
    }
    return pointerPos;
  }
  function render() {
    var newMousePos = checkSnapPoints();
    mousePos.x = newMousePos.x;
    mousePos.y = newMousePos.y;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawGrid(ctx, posInWorld, gridMinorInterval, gridMajorInterval);
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(mousePos.x, mousePos.y, 2, 2, 0, 0, 360);
    ctx.stroke();
    var worldMousePos = viewportToWorld2(mousePos);
    xCoordReadout.content = `${worldMousePos.x}`;
    xCoordReadout.rerender();
    yCoordReadout.content = `${worldMousePos.y}`;
    yCoordReadout.rerender();
    ctx.lineWidth = 1;
    if (selectedTool) {
      var tG = toolGuides[selectedTool];
      tG.draw(ctx, tG.controlPoints);
      if (selectedMode == "select") {
        drawControlPoints(ctx, tG.controlPoints);
      }
    }
    if (selectedMode == "select") {
      for (let i of currentPart.paths) {
        drawControlPoints(ctx, i.controlPoints);
      }
    }
    currentPart.draw(ctx);
    lastMousePos.x = mousePos.x;
    lastMousePos.y = mousePos.y;
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
  c.addEventListener("mousemove", (self, e) => {
    var ev = e;
    pointerPos.x = ev.clientX;
    pointerPos.y = ev.clientY;
    if (mouseDown) {
      if (selectedMode == "move") {
        posInWorld.x = mouseDownPos.x - mousePos.x;
        posInWorld.y = mouseDownPos.y - mousePos.y;
        console.log(mouseDownPos, mousePos, posInWorld);
        yOffset.setValue(String(posInWorld.y)).applyLastChange();
        xOffset.setValue(String(posInWorld.x)).applyLastChange();
      } else if (selectedMode == "draw") {
        if (selectedTool) {
          toolGuides[selectedTool].handleDraw(toolGuides[selectedTool].controlPoints);
        } else {
          shapeGenerators[selectedShape].handleDraw(shapeGenerators[selectedShape].controlPoints);
        }
      }
    }
  });
  c.addEventListener("touchmove", (self, e) => {
    var ev = e;
    pointerPos.x = ev.touches[0].clientX;
    pointerPos.y = ev.touches[0].clientY;
    if (mouseDown) {
      if (selectedMode == "move") {
        posInWorld.x = mouseDownPos.x - mousePos.x;
        posInWorld.y = mouseDownPos.y - mousePos.y;
        console.log(mouseDownPos, mousePos, posInWorld);
        yOffset.setValue(String(posInWorld.y)).applyLastChange();
        xOffset.setValue(String(posInWorld.x)).applyLastChange();
      } else if (selectedMode == "draw") {
        toolGuides[selectedTool].handleDraw(toolGuides[selectedTool].controlPoints);
      }
    }
  });
  var resizeObserver = new ResizeObserver(() => {
    c.setAttribute("width", `${c.htmlNode.clientWidth}`);
    c.setAttribute("height", `${c.htmlNode.clientHeight}`);
    c.lightRerender();
  });
  var buttonStyles = new styleGroup([
    [".btn", `
        background-color: white;
        border: 1px solid rgb(153,153,153);
        border-radius: 4px; 
        padding: 0.3em 0.4em;
        width: 100%;
        font-weight: bolder;
    `],
    [".btn.selected", `
        background-color: rgb(220,220,220);    
    `]
  ], "btn");
  var modeButtons = {
    select: new button("select").setAttribute("title", "select (s)").addClass("selected"),
    draw: new button("draw").setAttribute("title", "draw (d)"),
    move: new button("move").setAttribute("title", "move (f)")
  };
  registerKeybind("s", () => {
    selectMode("select");
  });
  registerKeybind("d", () => {
    selectMode("draw");
  });
  registerKeybind("f", () => {
    selectMode("move");
  });
  var selectedMode = "select";
  for (let i of Object.entries(modeButtons)) {
    i[1].addToStyleGroup(buttonStyles).addEventListener("click", () => {
      selectMode(i[0]);
    });
  }
  function selectMode(mode) {
    for (let i of Object.values(modeButtons)) {
      i.removeClass("selected").applyLastChange();
    }
    modeButtons[mode].addClass("selected").applyLastChange();
    selectedMode = mode;
  }
  var shapeButtons = {
    line: new button("line").setAttribute("title", "line (w)").addClass("selected"),
    circle: new button("circle").setAttribute("title", "circle (e)"),
    rectangle: new button("rectangle").setAttribute("title", "rectangle (r)")
  };
  var shapeGenerators = {
    line: {
      handleStartDraw: (controlPoints) => {
        var p = new linePath();
        p.controlPoints[0][0] = new Vec2(mousePos.x, mousePos.y);
        p.controlPoints[1][0] = new Vec2(p.start.x, p.start.y);
        currentPart.paths.push(p);
        currentPath = p;
        console.log(currentPath);
      },
      handleDraw: (controlPoints) => {
        var c2 = currentPath;
        c2.controlPoints[1][0].x = mousePos.x;
        c2.controlPoints[1][0].y = mousePos.y;
      }
    },
    circle: {
      centerControlPoints: (self) => {
        self.controlPoints = [[viewportToWorld2(new Vec2(c.htmlNode.width / 2, c.htmlNode.height / 2)), viewportToWorld2(new Vec2(c.htmlNode.width / 2 + 100, c.htmlNode.height / 2))]];
      },
      draw: (ctx2, controlPoints) => {
        var radius = Math.sqrt(Math.pow(controlPoints[0][0].x - controlPoints[0][1].x, 2) + Math.pow(controlPoints[0][0].y - controlPoints[0][1].y, 2));
        ctx2.beginPath();
        var vCentreCoords = worldToViewport(controlPoints[0][0]);
        ctx2.ellipse(
          vCentreCoords.x,
          vCentreCoords.y,
          radius,
          radius,
          0,
          0,
          360
        );
        ctx2.stroke();
        drawControlPoints(ctx2, controlPoints);
      },
      handleStartDraw: (controlPoints) => {
        var p = new ellipticalPath();
        console.log(controlPoints);
        p.controlPoints[0][0] = new Vec2(mousePos.x, mousePos.y);
        p.controlPoints[0][1] = new Vec2(mousePos.x, mousePos.y);
        p.controlPoints[1][0] = p.controlPoints[0][1];
        p.controlPoints[2][0] = p.controlPoints[0][1];
        currentPart.paths.push(p);
        currentPath = p;
        console.log(currentPath);
      },
      handleDraw: (controlPoints) => {
        var p = currentPath;
        p.controlPoints[0][1] = new Vec2(mousePos.x, mousePos.y);
      }
    }
  };
  registerKeybind("w", () => {
    selectShape("line");
  });
  registerKeybind("e", () => {
    selectShape("circle");
  });
  registerKeybind("r", () => {
    selectShape("rectangle");
  });
  var selectedShape = "";
  for (let i of Object.entries(shapeButtons)) {
    i[1].addToStyleGroup(buttonStyles).addEventListener("click", () => {
      selectShape(i[0]);
    });
  }
  function selectShape(shape) {
    for (let i of Object.values(shapeButtons)) {
      i.removeClass("selected").applyLastChange();
    }
    for (let i of Object.values(toolButtons)) {
      i.removeClass("selected").applyLastChange();
    }
    shapeButtons[shape].addClass("selected").applyLastChange();
    selectedTool = "";
    selectedShape = shape;
  }
  var toolButtons = {
    free: new button("free").setAttribute("title", "free (g)"),
    line: new button("line").setAttribute("title", "line (v)"),
    circle: new button("circle").setAttribute("title", "circle (c)")
  };
  registerKeybind("v", () => {
    selectTool("line");
  });
  registerKeybind("c", () => {
    selectTool("circle");
  });
  registerKeybind("g", () => {
    selectTool("free");
  });
  var currentPart = new Part();
  var selectedTool;
  var freehandSegmentLength = 3;
  var currentPath;
  var toolGuides = {
    free: {
      controlPoints: [],
      draw: (c2, d) => {
      },
      centerControlPoints: () => {
      },
      handleStartDraw: () => {
        var p = new freePath();
        p.controlPoints = [[new Vec2(mouseDownPos.x, mouseDownPos.y)]];
        currentPart.paths.push(p);
        currentPath = p;
        console.log(currentPath);
      },
      handleDraw: () => {
        var lastSegment = currentPath.controlPoints[currentPath.controlPoints.length - 1][0];
        console.log(lastSegment);
        if (near2d(mousePos, lastSegment, freehandSegmentLength)) {
        } else {
          currentPath.controlPoints.push([new Vec2(mousePos.x, mousePos.y)]);
        }
      }
    },
    line: {
      centerControlPoints: (self) => {
        self.controlPoints = [[viewportToWorld2(new Vec2(c.htmlNode.width / 2 - 50, c.htmlNode.height / 2))], [viewportToWorld2(new Vec2(c.htmlNode.width / 2 + 50, c.htmlNode.height / 2))]];
      },
      draw: (ctx2, controlPoints) => {
        ctx2.beginPath();
        var vCoords = worldToViewport(controlPoints[0][0]);
        var vCoords1 = worldToViewport(controlPoints[1][0]);
        ctx2.moveTo(vCoords.x, vCoords.y);
        ctx2.lineTo(vCoords1.x, vCoords1.y);
        ctx2.stroke();
      },
      handleStartDraw: (controlPoints) => {
        var p = new linePath();
        p.controlPoints[0][0] = closestPointOnLine(controlPoints[0][0], controlPoints[1][0]);
        p.controlPoints[1][0] = new Vec2(p.start.x, p.start.y);
        currentPart.paths.push(p);
        currentPath = p;
        console.log(currentPath);
      },
      handleDraw: (controlPoints) => {
        currentPath.controlPoints[1][0] = closestPointOnLine(controlPoints[0][0], controlPoints[1][0]);
      }
    },
    circle: {
      centerControlPoints: (self) => {
        self.controlPoints = [[viewportToWorld2(new Vec2(c.htmlNode.width / 2, c.htmlNode.height / 2)), viewportToWorld2(new Vec2(c.htmlNode.width / 2 + 100, c.htmlNode.height / 2))]];
      },
      draw: (ctx2, controlPoints) => {
        var radius = Math.sqrt(Math.pow(controlPoints[0][0].x - controlPoints[0][1].x, 2) + Math.pow(controlPoints[0][0].y - controlPoints[0][1].y, 2));
        ctx2.beginPath();
        var vCentreCoords = worldToViewport(controlPoints[0][0]);
        ctx2.ellipse(
          vCentreCoords.x,
          vCentreCoords.y,
          radius,
          radius,
          0,
          0,
          360
        );
        ctx2.stroke();
      },
      handleStartDraw: (controlPoints) => {
        var p = new ellipticalPath();
        console.log(controlPoints);
        p.controlPoints[0] = [controlPoints[0][0], controlPoints[0][1]];
        p.controlPoints[1][0] = new Vec2(mousePos.x, mousePos.y);
        p.controlPoints[1][0] = new Vec2(mousePos.x, mousePos.y);
        p.controlPoints[2][0] = new Vec2(mousePos.x, mousePos.y);
        currentPart.paths.push(p);
        currentPath = p;
        console.log(currentPath);
      },
      handleDraw: (controlPoints) => {
        var p = currentPath;
        p.controlPoints[2][0] = new Vec2(mousePos.x, mousePos.y);
      }
    }
  };
  for (let i of Object.entries(toolButtons)) {
    i[1].addToStyleGroup(buttonStyles).addEventListener("click", () => {
      selectTool(i[0]);
    });
  }
  function selectTool(tool) {
    for (let i of Object.values(toolButtons)) {
      i.removeClass("selected").applyLastChange();
    }
    for (let i of Object.values(shapeButtons)) {
      i.removeClass("selected").applyLastChange();
    }
    toolGuides[tool].centerControlPoints(toolGuides[tool]);
    toolButtons[tool].addClass("selected").applyLastChange();
    toolGuides[tool].draw(ctx, toolGuides[tool].controlPoints);
    selectedTool = tool;
    selectedShape = "";
  }
  var xCoordReadout = new kleinTextNode("0");
  var yCoordReadout = new kleinTextNode("0");
  var xOffset = new textInput().setValue(String(posInWorld.x)).addEventListener("change", () => {
    posInWorld.x = parseFloat(xOffset.htmlNode.value);
  });
  var yOffset = new textInput().setValue(String(posInWorld.y)).addEventListener("change", () => {
    posInWorld.y = parseFloat(yOffset.htmlNode.value);
  });
  var hrStyles = new styleGroup([
    [".hr", `
        width: 70%;
        height: 1px;
        background-color: rgb(153,153,153);
        margin: 0.2em 0;    
    `]
  ], "hr");
  var app = new container(
    new container("x:", xCoordReadout, " y:", yCoordReadout).addStyle("position: absolute; top: 0; right: 0;"),
    c.addStyle("width: 100%; height: 100%; cursor: none;"),
    new container(
      new button("clear").addToStyleGroup(buttonStyles).addEventListener("click", () => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      }),
      // new container().addToStyleGroup(hrStyles),
      "Guides",
      ...Object.values(toolButtons),
      // new container().addToStyleGroup(hrStyles),
      "Shapes",
      ...Object.values(shapeButtons),
      // new container().addToStyleGroup(hrStyles),
      "Modes",
      ...Object.values(modeButtons)
    ).addStyle("display: flex; padding: 0.3em; position: absolute; top: 0; flex-direction: column; align-items: center; gap: 0.2em;"),
    new container(
      xOffset,
      yOffset
    )
  );
  renderApp(app, document.getElementById("app"));
  c.setAttribute("width", `${c.htmlNode.clientWidth}`);
  c.setAttribute("height", `${c.htmlNode.clientHeight}`);
  c.lightRerender();
  resizeObserver.observe(c.htmlNode);
})();
