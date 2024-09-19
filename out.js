(() => {
  // node_modules/kleinui/lib.ts
  function elementToNode(el) {
    if (typeof el == "string") {
      return new kleinTextNode(el);
    }
    return el;
  }
  var styleGroup = class {
    constructor(styles, className) {
      this.members = [];
      this.checksum = 0;
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
    constructor(...children) {
      this.onMountQueue = [];
      this.nodeType = 0 /* basic */;
      this.styles = [];
      this.styleGroups = [];
      this.flag = /* @__PURE__ */ new Map([]);
      this.classes = [];
      this.changes = [];
      this.children = [];
      this.width = -1;
      this.height = -1;
      for (let i of children) {
        let p = elementToNode(i);
        p.parent = this;
        this.changes.push(() => {
          p.render(this.htmlNode);
        });
        this.children.push(p);
      }
    }
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
      this.nodeType = 1 /* text */;
      this.content = content;
    }
    render(target) {
      let n = document.createTextNode(this.content);
      this.textNode = n;
      target.appendChild(n);
    }
    rerender() {
      this.textNode.data = this.content;
    }
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
    constructor() {
      super(...arguments);
      this.name = "button";
    }
    render(target) {
      let element = document.createElement("button");
      renderBasics(this, element);
      target.appendChild(element);
    }
  };
  var container = class extends kleinElementNode {
    constructor() {
      super(...arguments);
      this.name = "container";
    }
    render(target) {
      let element = document.createElement("div");
      renderBasics(this, element);
      target.appendChild(element);
    }
  };
  var canvas = class extends kleinElementNode {
    constructor() {
      super(...arguments);
      this.name = "canvas";
      this.canvas = document.createElement("canvas");
    }
    render(target) {
      renderBasics(this, this.canvas);
      target.appendChild(this.canvas);
    }
    getContext(contextId, options) {
      return this.canvas.getContext(contextId, options);
    }
  };
  var unorderedList = class extends kleinElementNode {
    constructor() {
      super(...arguments);
      this.name = "unordered-list";
    }
    render(target) {
      let element = document.createElement("ul");
      renderBasics(this, element);
      target.appendChild(element);
    }
  };
  var listItem = class extends kleinElementNode {
    constructor() {
      super(...arguments);
      this.name = "list-item";
    }
    render(target) {
      let element = document.createElement("li");
      renderBasics(this, element);
      target.appendChild(element);
    }
  };
  var header1 = class extends kleinElementNode {
    constructor() {
      super(...arguments);
      this.name = "header1";
    }
    render(target) {
      let element = document.createElement("h1");
      renderBasics(this, element);
      target.appendChild(element);
    }
  };
  var header2 = class extends kleinElementNode {
    constructor() {
      super(...arguments);
      this.name = "header2";
    }
    render(target) {
      let element = document.createElement("h2");
      renderBasics(this, element);
      target.appendChild(element);
    }
  };
  var textInput = class extends kleinElementNode {
    constructor() {
      super(...arguments);
      this.name = "textInput";
    }
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

  // src/vec.ts
  var Vec2 = class {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
    copy() {
      return new Vec2(this.x, this.y);
    }
  };
  function near(a, b, distance) {
    return a == b || b - a < distance && a - b < distance;
  }
  function near2d(a, b, distance) {
    return near(a.x, b.x, distance) && near(a.y, b.y, distance);
  }

  // src/grid.ts
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

  // src/physics.ts
  var collisionGroup = class {
    constructor(name) {
      this.parts = [];
      this.name = "New Group";
      this.name = name;
    }
  };
  var collisionGroups = [
    new collisionGroup("Main Collision Group")
  ];

  // src/part.ts
  var ellipticalPath = class {
    constructor() {
      this.controlPoints = [[], [], []];
    }
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
      var cViewport = worldToViewport(this.center);
      ctx2.ellipse(cViewport.x, cViewport.y, this.radius, this.radius, 0, this.startAngle, this.endAngle);
      ctx2.stroke();
    }
  };
  var freePath = class {
    constructor() {
      this.controlPoints = [[]];
    }
    draw(ctx2) {
      ctx2.beginPath();
      for (let s = 1; s < this.controlPoints.length; s++) {
        var vStart = worldToViewport(this.controlPoints[s - 1][0]);
        var vEnd = worldToViewport(this.controlPoints[s][0]);
        ctx2.moveTo(vStart.x, vStart.y);
        ctx2.lineTo(vEnd.x, vEnd.y);
      }
      ctx2.stroke();
    }
  };
  var linePath = class {
    constructor() {
      this.controlPoints = [[], []];
    }
    get start() {
      return this.controlPoints[0][0];
    }
    get end() {
      return this.controlPoints[1][0];
    }
    draw(ctx2) {
      ctx2.beginPath();
      var vStart = worldToViewport(this.start);
      var vEnd = worldToViewport(this.end);
      ctx2.moveTo(vStart.x, vStart.y);
      ctx2.lineTo(vEnd.x, vEnd.y);
      ctx2.stroke();
    }
  };
  var ngonPath = class {
    constructor() {
      this.controlPoints = [[]];
    }
    draw(ctx2) {
      ctx2.beginPath();
      for (let i = 2; i < this.controlPoints[0].length; i++) {
        var vStart = worldToViewport(this.controlPoints[0][i - 1]);
        var vEnd = worldToViewport(this.controlPoints[0][i]);
        ctx2.moveTo(vStart.x, vStart.y);
        ctx2.lineTo(vEnd.x, vEnd.y);
      }
      var vStart = worldToViewport(this.controlPoints[0][this.controlPoints[0].length - 1]);
      var vEnd = worldToViewport(this.controlPoints[0][1]);
      ctx2.moveTo(vStart.x, vStart.y);
      ctx2.lineTo(vEnd.x, vEnd.y);
      ctx2.stroke();
    }
  };
  var parts = [];
  var visiblityStyles = new styleGroup([
    [".vis.hidden:before", `
        content: "";
        position: absolute;
        width: 100%;
        height: 2px;
        background-color: black;
        rotate: 45deg;
        top: 30%;
        transform-origin: 50% 50%;
        translate: 0 50%;
    `]
  ], "vis");
  var configStyles = new styleGroup([
    [".config.visible", `
        display: flex;
        flex-direction: column;
    `],
    [".config", `
        display: none;
        margin: 0.3em;
        padding: 0.3em;
        background-color: white;
        border-radius: 4px;
        border: 1px solid rgb(153, 153, 153);
    `]
  ], "config");
  var Part = class {
    constructor(name) {
      this.paths = [];
      this._name = "Part";
      this.recordingDraw = false;
      this.visible = true;
      this._name = name ? name : `Part ${parts.length + 1}`;
      var previewCanvas = new canvas();
      this.previewCtx = previewCanvas.getContext("2d");
      collisionGroups[0].parts.push(this);
      this.listNode = new container(this.name, previewCanvas.addStyle("position: absolute; z-index: 0; top: 0; left: 0; width: 100%; height: 100%;"), new button("\u{1F441}").addToStyleGroup(visiblityStyles).addStyle("margin-left: auto; background-color: transparent; height: min-content; padding: 0; position: relative; border: none; padding: 0;").addEventListener("click", (self) => {
        if (this.visible) {
          self.addClass("hidden").applyLastChange();
          this.visible = false;
        } else {
          self.removeClass("hidden").applyLastChange();
          this.visible = true;
        }
      })).addClass("item").addStyle("position: relative;");
      this.collisionGroupsNode = new container().addStyle(`
            display: flex;
            flex-direction: column;
        `);
      this.configNode = new container(new header1(this.name).addStyle("text-align: right; margin: 0; font-size: 1em;"), new header2("Simulation"), this.collisionGroupsNode).addToStyleGroup(configStyles);
    }
    get currentPath() {
      return this.paths[this.paths.length - 1];
    }
    get name() {
      return this._name;
    }
    set name(s) {
      this._name = s;
      this.listNode.children[0].content = s;
      this.listNode.children[0].rerender();
    }
    select() {
      this.collisionGroupsNode.removeAllChildren();
      this.collisionGroupsNode.children = collisionGroups.map((g) => {
        var getPartList = () => g.parts.map((p) => {
          if (p == this) {
            return new listItem(p.name + " (This part)").addStyle("font-weight: bold;");
          } else {
            return new listItem(p.name).addEventListener("click", () => {
              console.log("selected");
              selectPart(p);
            });
          }
        });
        var CGPartList = new unorderedList(...getPartList());
        return new container(new header2(g.name), new textInput().setAttribute("type", "checkbox").addEventListener("input", (self) => {
          if (self.htmlNode.checked) {
            for (let i of g.parts) {
              if (i == this) {
                return;
              }
            }
            g.parts.push(this);
            CGPartList.addChildren(new listItem(this.name + " (This part)").addStyle("font-weight: bold;"));
            CGPartList.lightRerender();
          } else {
            for (let i of g.parts) {
              if (i == this) {
                g.parts.splice(g.parts.indexOf(this));
                CGPartList.removeAllChildren();
                CGPartList.addChildren(...getPartList());
                CGPartList.lightRerender();
              }
            }
          }
        }), "- enable this part in the collision group", CGPartList);
      });
      this.collisionGroupsNode.lightRerender();
    }
    draw(ctx2) {
      ctx2.lineWidth = 3;
      for (let p of this.paths) {
        p.draw(ctx2);
      }
    }
  };

  // src/keys.ts
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

  // src/styles.ts
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
  var inputStyles = new styleGroup([
    [".inpt", `
        background-color: white;
        border: 1px solid rgb(153,153,153);
        border-radius: 4px; 
        padding: 0.3em 0.4em;
        box-sizing: border-box;
        width: 100%;
        font-weight: bolder;
    `],
    [".inpt input", `
        width: calc(100% - 0.8em);
    `]
  ], "inpt");

  // src/shapes.ts
  var ngonSides = 3;
  var shapeButtons = {
    line: new button("line").setAttribute("title", "line (w)").addClass("selected"),
    circle: new button("circle").setAttribute("title", "circle (e)"),
    rectangle: new button("rectangle").setAttribute("title", "rectangle (r)"),
    ngon: new container("n-agon:", new textInput().setValue("3").setAttribute("type", "number").addEventListener("change", (self) => {
      ngonSides = parseInt(self.htmlNode.value);
    })).addToStyleGroup(inputStyles).setAttribute("title", "Minor grid interval - distance between minor grid lines, measured in px")
  };
  var shapeGenerators = {
    line: {
      handleStartDraw: (controlPoints) => {
        var p = new linePath();
        p.controlPoints[0][0] = viewportToWorld2(mousePos2);
        p.controlPoints[1][0] = new Vec2(p.start.x, p.start.y);
        currentPart2.paths.push(p);
      },
      handleDraw: (controlPoints) => {
        var c2 = currentPart2.currentPath;
        c2.controlPoints[1][0] = viewportToWorld2(mousePos2);
      }
    },
    circle: {
      centerControlPoints: (self) => {
        self.controlPoints = [[viewportToWorld2(new Vec2(c.htmlNode.width / 2, c.htmlNode.height / 2)), viewportToWorld2(new Vec2(c.htmlNode.width / 2 + 100, c.htmlNode.height / 2))]];
      },
      handleStartDraw: (controlPoints) => {
        var p = new ellipticalPath();
        console.log(controlPoints);
        p.controlPoints[0][0] = viewportToWorld2(mousePos2);
        p.controlPoints[0][1] = viewportToWorld2(mousePos2);
        p.controlPoints[1][0] = p.controlPoints[0][1];
        p.controlPoints[2][0] = p.controlPoints[0][1];
        currentPart2.paths.push(p);
      },
      handleDraw: (controlPoints) => {
        var p = currentPart2.currentPath;
        p.controlPoints[0][1] = viewportToWorld2(mousePos2);
      }
    },
    ngon: {
      handleStartDraw: (controlPoints) => {
        var p = new ngonPath();
        p.controlPoints[0][0] = viewportToWorld2(mousePos2);
        console.log(`center: X:${p.controlPoints[0][0].x} Y:${p.controlPoints[0][0].y}`);
        var radius = 20;
        for (let i = 0; i < ngonSides; i++) {
          var a = 360 / ngonSides * i;
          p.controlPoints[0][i + 1] = new Vec2(0, 0);
          p.controlPoints[0][i + 1].x = Math.sin(a * (Math.PI / 180)) * radius + p.controlPoints[0][0].x;
          p.controlPoints[0][i + 1].y = Math.cos(a * (Math.PI / 180)) * radius + p.controlPoints[0][0].y;
        }
        currentPart2.paths.push(p);
      },
      handleDraw: (controlPoints) => {
        var c2 = currentPart2.currentPath;
        c2.controlPoints[0][1] = viewportToWorld2(mousePos2);
        var radius = Math.sqrt(Math.pow(c2.controlPoints[0][0].x - c2.controlPoints[0][1].x, 2) + Math.pow(c2.controlPoints[0][0].y - c2.controlPoints[0][1].y, 2));
        console.log(radius);
        for (let i = 0; i < ngonSides; i++) {
          var a = 360 / ngonSides * i;
          c2.controlPoints[0][i + 1].x = Math.sin(a * (Math.PI / 180)) * radius + c2.controlPoints[0][0].x;
          c2.controlPoints[0][i + 1].y = Math.cos(a * (Math.PI / 180)) * radius + c2.controlPoints[0][0].y;
        }
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
  console.log(buttonStyles);
  for (let i of Object.entries(shapeButtons)) {
    i[1].addToStyleGroup(buttonStyles).addEventListener("click", () => {
      selectShape(i[0]);
      console.log("selecting", i[0]);
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
    setSelectedTool("");
    selectedShape = shape;
  }
  function setSelectedShape(shape) {
    selectedShape = shape;
  }

  // src/guides.ts
  var selectedTool2;
  var freehandSegmentLength = 3;
  var currentPath;
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
  function closestPointOnLine(lineStart, lineEnd) {
    var mousePosWorld = viewportToWorld2(mousePos2);
    const lineVector = new Vec2(lineEnd.x - lineStart.x, lineEnd.y - lineStart.y);
    const cursorVector = new Vec2(mousePosWorld.x - lineStart.x, mousePosWorld.y - lineStart.y);
    const dotProduct = lineVector.x * cursorVector.x + lineVector.y * cursorVector.y;
    const lineMagnitudeSquared = lineVector.x * lineVector.x + lineVector.y * lineVector.y;
    const t = dotProduct / lineMagnitudeSquared;
    const clampedT = Math.max(0, Math.min(1, t));
    return new Vec2(lineStart.x + clampedT * lineVector.x, lineStart.y + clampedT * lineVector.y);
  }
  var toolGuides = {
    free: {
      controlPoints: [],
      draw: (c2, d) => {
      },
      centerControlPoints: () => {
      },
      handleStartDraw: () => {
        var p = new freePath();
        p.controlPoints = [[viewportToWorld2(mouseDownPos)]];
        currentPart2.paths.push(p);
        currentPath = p;
        console.log(currentPath);
      },
      handleDraw: () => {
        var lastSegment = currentPath.controlPoints[currentPath.controlPoints.length - 1][0];
        console.log(lastSegment);
        if (near2d(mousePos2, lastSegment, freehandSegmentLength)) {
        } else {
          currentPath.controlPoints.push([viewportToWorld2(mousePos2)]);
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
        currentPart2.paths.push(p);
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
        ctx2.ellipse(vCentreCoords.x, vCentreCoords.y, radius, radius, 0, 0, 360);
        ctx2.stroke();
      },
      handleStartDraw: (controlPoints) => {
        var p = new ellipticalPath();
        console.log(controlPoints);
        p.controlPoints[0] = [controlPoints[0][0], controlPoints[0][1]];
        p.controlPoints[1][0] = new Vec2(mousePos2.x, mousePos2.y);
        p.controlPoints[1][0] = new Vec2(mousePos2.x, mousePos2.y);
        p.controlPoints[2][0] = new Vec2(mousePos2.x, mousePos2.y);
        currentPart2.paths.push(p);
        currentPath = p;
        console.log(currentPath);
      },
      handleDraw: (controlPoints) => {
        var p = currentPath;
        p.controlPoints[2][0] = new Vec2(mousePos2.x, mousePos2.y);
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
    selectedTool2 = tool;
    setSelectedShape("");
  }
  function setSelectedTool(tool) {
    selectedTool2 = tool;
  }

  // src/modes.ts
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

  // src/main.ts
  var controlSnapDistance = 10;
  var gridMinorInterval = 20;
  var gridMajorInterval = 100;
  var posInWorld = new Vec2(0, 0);
  var zoomFactor = 1;
  function viewportToWorld2(pos) {
    return new Vec2(pos.x * zoomFactor + posInWorld.x, pos.y * zoomFactor + posInWorld.y);
  }
  function worldToViewport(pos) {
    return new Vec2((pos.x - posInWorld.x) / zoomFactor, (pos.y - posInWorld.y) / zoomFactor);
  }
  var c = new canvas();
  var ctx = c.getContext("2d");
  ctx.lineCap = "round";
  var pointerPos = new Vec2(0, 0);
  var mousePos2 = new Vec2(0, 0);
  var mouseDown = false;
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
          if (near(mousePos2.x, vCoords.x, controlSnapDistance) && near(mousePos2.y, vCoords.y, controlSnapDistance)) {
            draggingItems.push(i);
          }
          if (draggingItems.includes(i)) {
            if (i == c2[0] && c2.length > 1) {
              for (let p = 1; p < c2.length; p++) {
                var yOffsetToOtherControlPoint = i.y - c2[p].y;
                var xOffsetToOtherControlPoint = i.x - c2[p].x;
                var newNeighbour = viewportToWorld2(new Vec2(mousePos2.x - xOffsetToOtherControlPoint, mousePos2.y - yOffsetToOtherControlPoint));
                c2[p].x = newNeighbour.x;
                c2[p].y = newNeighbour.y;
              }
              var newI = viewportToWorld2(mousePos2);
              i.x = newI.x;
              i.y = newI.y;
            } else {
              var newI = viewportToWorld2(mousePos2);
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
    mouseDownPos = viewportToWorld2(mousePos2);
    if (selectedMode == "draw") {
      if (selectedTool2) {
        toolGuides[selectedTool2].handleStartDraw(toolGuides[selectedTool2].controlPoints);
      } else {
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
      var nearestSnapPoint = new Vec2(Math.round(worldPointerPos.x / gridMinorInterval) * gridMinorInterval, Math.round(worldPointerPos.y / gridMinorInterval) * gridMinorInterval);
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
    mousePos2.x = newMousePos.x;
    mousePos2.y = newMousePos.y;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawGrid(ctx, posInWorld, gridMinorInterval, gridMajorInterval);
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.fillStyle = "red";
    ctx.ellipse(mousePos2.x, mousePos2.y, 3, 3, 0, 0, 360);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.ellipse(pointerPos.x, pointerPos.y, 2, 2, 0, 0, 360);
    ctx.fill();
    ctx.stroke();
    var worldMousePos = viewportToWorld2(mousePos2);
    xCoordReadout.content = `${worldMousePos.x}`;
    xCoordReadout.rerender();
    yCoordReadout.content = `${worldMousePos.y}`;
    yCoordReadout.rerender();
    ctx.lineWidth = 1;
    if (selectedTool2) {
      var tG = toolGuides[selectedTool2];
      tG.draw(ctx, tG.controlPoints);
      if (selectedMode == "select") {
        drawControlPoints(ctx, tG.controlPoints);
      }
    }
    if (selectedMode == "select") {
      for (let i of currentPart2.paths) {
        drawControlPoints(ctx, i.controlPoints);
      }
    }
    for (let i of parts) {
      if (i.visible) {
        i.draw(ctx);
        i.previewCtx.clearRect(0, 0, i.previewCtx.canvas.width, i.previewCtx.canvas.height);
        i.draw(i.previewCtx);
      }
    }
    lastMousePos.x = mousePos2.x;
    lastMousePos.y = mousePos2.y;
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
  c.addEventListener("mousemove", (self, e) => {
    var ev = e;
    pointerPos.x = ev.clientX;
    pointerPos.y = ev.clientY;
    if (mouseDown) {
      if (selectedMode == "move") {
        posInWorld.x = mouseDownPos.x - mousePos2.x;
        posInWorld.y = mouseDownPos.y - mousePos2.y;
        console.log(mouseDownPos, mousePos2, posInWorld);
        yOffset.setValue(String(posInWorld.y)).applyLastChange();
        xOffset.setValue(String(posInWorld.x)).applyLastChange();
      } else if (selectedMode == "draw") {
        if (selectedTool2) {
          toolGuides[selectedTool2].handleDraw(toolGuides[selectedTool2].controlPoints);
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
        posInWorld.x = mouseDownPos.x - mousePos2.x;
        posInWorld.y = mouseDownPos.y - mousePos2.y;
        console.log(mouseDownPos, mousePos2, posInWorld);
        yOffset.setValue(String(posInWorld.y)).applyLastChange();
        xOffset.setValue(String(posInWorld.x)).applyLastChange();
      } else if (selectedMode == "draw") {
        toolGuides[selectedTool2].handleDraw(toolGuides[selectedTool2].controlPoints);
      }
    }
  });
  var resizeObserver = new ResizeObserver(() => {
    c.setAttribute("width", `${c.htmlNode.clientWidth}`);
    c.setAttribute("height", `${c.htmlNode.clientHeight}`);
    c.lightRerender();
  });
  var currentPart2 = new Part();
  parts.push(currentPart2);
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
  var partListStyles = new styleGroup([
    [".part-list-container > .list > .item", `
        width: 100%;
        aspect-ratio: 16 / 9;
        border: 1px solid rgb(153,153,153);
        border-radius: 3px;
        box-sizing: border-box;
        background-color: white;
        padding: 0.2em;
        display: flex;
    `],
    [".part-list-container > .list > .item.selected", `
        font-weight: bolder;
    `],
    [".part-list-container > .list", `
        width: 100%;
        
        display: flex;
        gap: 0.1em;
        flex-direction: column;
        box-sizing: border-box;
        
    `],
    [".part-list-container > button", `
        width: 100%;
        border: 1px solid black;
        border-radius: 3px;
        margin: 0.1em 0;
        box-sizing: border-box;
        background-color: white;

    `],
    [".part-list-container", `
        width: 100%;
    `]
  ], "part-list-container");
  var partList = new container(...parts.map((p) => p.listNode.addEventListener("click", () => {
    selectPart(p);
  }))).addClass("list");
  var partConfigs = new container(...parts.map((p) => p.configNode)).addStyle(`
    position: absolute;
    right: 0;
    top: 0;
`);
  function selectPart(part) {
    for (let i of parts) {
      i.listNode.removeClass("selected").applyLastChange();
      i.configNode.removeClass("visible").applyLastChange();
    }
    console.trace("selecting", part.name);
    part.listNode.addClass("selected").applyLastChange();
    part.configNode.addClass("visible").applyLastChange();
    part.select();
    currentPart2 = part;
  }
  function menuList(title, items) {
    const dropIcon = new kleinTextNode("\u02C5");
    return new container(new button(title, new container(dropIcon).addStyle("margin-left: auto;")).addEventListener("click", (self) => {
      if (self.hasClass("hidden")) {
        for (let i of self.parent.children) {
          if (i != self) {
            i.addStyle("display: block;").applyLastChange();
          }
        }
        self.removeClass("hidden").applyLastChange();
        dropIcon.content = "\u02C5";
        dropIcon.rerender();
      } else {
        for (let i of self.parent.children) {
          if (i != self) {
            i.addStyle("display: none;").applyLastChange();
          }
        }
        self.addClass("hidden").applyLastChange();
        dropIcon.content = "\u02C4";
        dropIcon.rerender();
      }
    }).addStyle("display: flex; padding: 0; border: none; background-color: transparent;"), ...items).addStyle("display: flex; width: 100%; flex-direction: column; gap: 0.3em;");
  }
  var app = new container(new container("x:", xCoordReadout, " y:", yCoordReadout).addStyle("position: absolute; bottom: 0; right: 0;"), c.addStyle("width: 100%; height: 100%; cursor: none;"), partConfigs, new container(new button("clear").addToStyleGroup(buttonStyles).addEventListener("click", () => {
    currentPart2.paths = [];
  }), menuList("Guides", Object.values(toolButtons)), menuList("Shapes", Object.values(shapeButtons)), menuList("Modes", Object.values(modeButtons)), menuList("Grid", [
    new container("Snap:", new textInput().setValue(snapDistance.toString()).setAttribute("type", "number").addEventListener("change", (self) => {
      snapDistance = parseInt(self.htmlNode.value);
    })).addToStyleGroup(inputStyles).setAttribute("title", "Snap distance - threshold needed to snap cursor to point"),
    new container("Major:", new textInput().setValue(gridMajorInterval.toString()).setAttribute("type", "number").addEventListener("change", (self) => {
      gridMajorInterval = parseInt(self.htmlNode.value);
    })).addToStyleGroup(inputStyles).setAttribute("title", "Major grid interval - distance between major grid lines, measured in px"),
    new container("Minor:", new textInput().setValue(gridMinorInterval.toString()).setAttribute("type", "number").addEventListener("change", (self) => {
      gridMinorInterval = parseInt(self.htmlNode.value);
    })).addToStyleGroup(inputStyles).setAttribute("title", "Minor grid interval - distance between minor grid lines, measured in px")
  ]), menuList("Parts", [new container(partList, new button("+").addEventListener("click", (self) => {
    var newPart = new Part();
    parts.push(newPart);
    partList.addChildren(newPart.listNode.addEventListener("click", () => {
      selectPart(newPart);
    }));
    partList.lightRerender();
    partConfigs.addChildren(newPart.configNode);
    partConfigs.lightRerender();
    selectPart(newPart);
  })).addToStyleGroup(partListStyles)])).addStyle("display: flex; width: 5em; height: calc(100% - 0.6em); padding: 0.3em; position: absolute; top: 0; flex-direction: column; align-items: center; gap: 0.2em;"), new container(xOffset, yOffset));
  renderApp(app, document.getElementById("app"));
  selectPart(currentPart2);
  c.setAttribute("width", `${c.htmlNode.clientWidth}`);
  c.setAttribute("height", `${c.htmlNode.clientHeight}`);
  c.lightRerender();
  resizeObserver.observe(c.htmlNode);
})();
