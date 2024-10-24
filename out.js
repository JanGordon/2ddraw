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
    const onResize = () => {
      resizeElement.style.display = "none";
      node.width = document.body.clientWidth;
      node.height = document.body.clientHeight;
      node.updateDimensions();
      if (resizeListener) {
        resizeListener();
      }
    };
    var doit;
    addEventListener("resize", () => {
      resizeElement.style.display = "flex";
      clearTimeout(doit);
      doit = setTimeout(onResize, 100);
    });
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

  // src/theme.ts
  var dynamicStyles = /* @__PURE__ */ new Map([]);
  function dynamicStyleGroup(styles, className) {
    var sT = new styleGroup(styles(), className);
    dynamicStyles.set(className, [sT, styles]);
    return sT;
  }
  function updateDynamicStyleGroup(styleName) {
    var sT = dynamicStyles.get(styleName);
    if (sT?.length == 2) {
      sT[0].styles = sT[1]();
      var ss = document.head.querySelector("#" + sT[0].className);
      if (ss) {
        ss.innerHTML = sT[0].getCss();
      }
    } else {
      console.error("no style group named", styleName);
    }
  }
  function updateAllDynamicStyles() {
    for (let i of dynamicStyles.keys()) {
      updateDynamicStyleGroup(i);
    }
  }

  // node_modules/idb-keyval/dist/index.js
  function promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.oncomplete = request.onsuccess = () => resolve(request.result);
      request.onabort = request.onerror = () => reject(request.error);
    });
  }
  function createStore(dbName, storeName) {
    const request = indexedDB.open(dbName);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    const dbp = promisifyRequest(request);
    return (txMode, callback) => dbp.then((db) => callback(db.transaction(storeName, txMode).objectStore(storeName)));
  }
  var defaultGetStoreFunc;
  function defaultGetStore() {
    if (!defaultGetStoreFunc) {
      defaultGetStoreFunc = createStore("keyval-store", "keyval");
    }
    return defaultGetStoreFunc;
  }
  function get(key, customStore = defaultGetStore()) {
    return customStore("readonly", (store) => promisifyRequest(store.get(key)));
  }
  function set(key, value, customStore = defaultGetStore()) {
    return customStore("readwrite", (store) => {
      store.put(value, key);
      return promisifyRequest(store.transaction);
    });
  }

  // src/preferences.ts
  var lightTheme = {
    gridTheme: {
      minorColor: "lightgrey",
      majorColor: "lightgrey",
      minorWidth: 0.4,
      majorWidth: 2,
      bgColor: "white"
    },
    buttonTheme: {
      borderRadius: 4,
      borderColor: "rgb(153,153,153)",
      fontSize: 1,
      bgColor: "white",
      textColor: "black",
      fgColor: "black",
      selectedBgColor: "rgb(220, 220, 220)"
    },
    textTheme: {
      textColor: "black"
    }
  };
  var darkTheme = {
    gridTheme: {
      minorColor: "rgb(10,10,10)",
      majorColor: "rgb(25,25,25)",
      minorWidth: 0.2,
      majorWidth: 2,
      bgColor: "rgb(36,36,36)"
    },
    buttonTheme: {
      borderRadius: 4,
      borderColor: "rgb(153,153,153)",
      fontSize: 1,
      bgColor: "rgb(36,36,36)",
      textColor: "white",
      fgColor: "white",
      selectedBgColor: "rgb(63,63,63)"
    },
    textTheme: {
      textColor: "white"
    }
  };
  function setTheme(t) {
    theme = t;
    set("theme", t);
    console.log("set", t);
    updateAllDynamicStyles();
  }
  var theme = darkTheme;
  console.log(theme);

  // src/grid.ts
  function drawGrid(ctx2, posInWorld2, interval, bigInterval) {
    var deadSpaceAtStartY = posInWorld2.y % interval;
    var startOfGridY = posInWorld2.y - deadSpaceAtStartY;
    for (let y = startOfGridY; y <= startOfGridY + ctx2.canvas.height * zoomFactor + deadSpaceAtStartY; y += interval) {
      var vStart = worldToViewport(new Vec2(posInWorld2.x, y));
      var vEnd = worldToViewport(new Vec2(posInWorld2.x + ctx2.canvas.width * zoomFactor, y));
      if (y % bigInterval == 0) {
        ctx2.lineWidth = theme.gridTheme.majorWidth;
        ctx2.strokeStyle = theme.gridTheme.majorColor;
      } else {
        ctx2.lineWidth = theme.gridTheme.minorWidth;
        ctx2.strokeStyle = theme.gridTheme.minorColor;
      }
      ctx2.beginPath();
      ctx2.moveTo(vStart.x, vStart.y);
      ctx2.lineTo(vEnd.x, vEnd.y);
      ctx2.stroke();
    }
    var deadSpaceAtStartX = posInWorld2.x % interval;
    var startOfGridX = posInWorld2.x - deadSpaceAtStartX;
    for (let x = startOfGridX; x <= startOfGridX + ctx2.canvas.width * zoomFactor + deadSpaceAtStartX; x += interval) {
      var vStart = worldToViewport(new Vec2(x, posInWorld2.y));
      var vEnd = worldToViewport(new Vec2(x, posInWorld2.y + ctx2.canvas.height * zoomFactor));
      if (x % bigInterval == 0) {
        ctx2.lineWidth = theme.gridTheme.majorWidth;
        ctx2.strokeStyle = theme.gridTheme.majorColor;
      } else {
        ctx2.lineWidth = theme.gridTheme.minorWidth;
        ctx2.strokeStyle = theme.gridTheme.minorColor;
      }
      ctx2.beginPath();
      ctx2.moveTo(vStart.x, vStart.y);
      ctx2.lineTo(vEnd.x, vEnd.y);
      ctx2.stroke();
    }
  }

  // src/styles.ts
  var buttonStyles = dynamicStyleGroup(() => [
    [".btn", `
        background-color: ${theme.buttonTheme.bgColor};
        border: 1px solid ${theme.buttonTheme.borderColor};
        border-radius: ${theme.buttonTheme.borderRadius}px; 
        padding: 0.3em 0.4em;
        color: ${theme.buttonTheme.textColor};
        width: 100%;
        font-weight: bolder;
    `],
    [".btn.selected", `
        background-color: ${theme.buttonTheme.selectedBgColor};    
    `]
  ], "btn");
  var pathBtnStyles = dynamicStyleGroup(() => [
    [".path-btn", `
        background-color: ${theme.buttonTheme.bgColor};
        border: 1px solid ${theme.buttonTheme.borderColor};
        border-radius: ${theme.buttonTheme.borderRadius}px; 
        padding: 0.3em 0.4em;
        color: ${theme.buttonTheme.textColor};
        width: min-content;
        font-weight: bolder;
    `],
    [".path-btn.selected", `
        background-color: ${theme.buttonTheme.selectedBgColor};    
    `]
  ], "path-btn");
  var inputStyles = dynamicStyleGroup(() => [
    [".inpt", `
        background-color: ${theme.buttonTheme.bgColor};
        border: 1px solid ${theme.buttonTheme.borderColor};
        border-radius: ${theme.buttonTheme.borderRadius}px; 
        padding: 0.3em 0.4em;
        color: ${theme.buttonTheme.textColor};
        width: calc(100% - 0.8em);
        font-weight: bolder;
    `],
    [".inpt input", `
        width: calc(100% - 0.8em);
        border: 1px solid ${theme.buttonTheme.borderColor};
        background-color: ${theme.buttonTheme.bgColor};
        color: ${theme.buttonTheme.textColor};
    `]
  ], "inpt");

  // src/rigidbody.ts
  var rigidbody = class {
    constructor(p) {
      this.outofdate = false;
      this.hasGravity = true;
      this.force = new Vec2(0, 0);
      this.acceleration = new Vec2(0, 0);
      this.velocity = new Vec2(0, 0);
      this.mass = 10;
      this.physicsPosOffset = new Vec2(0, 0);
      this.rotation = 0;
      this.privatePart = p;
    }
    calculateCG() {
      for (let i of this.privatePart.paths) {
        i;
      }
    }
    generate() {
      for (let i of this.privatePart.paths) {
      }
    }
  };

  // src/rerender.ts
  function rerender(p) {
    if (p.htmlNode) {
      p.lightRerender();
    }
  }

  // src/part.ts
  var previousStyle = {
    colour: "black",
    width: 10
  };
  function setPathStyle(ctx2, style) {
    ctx2.strokeStyle = style.colour;
    ctx2.lineWidth = style.width / zoomFactor;
    previousStyle = style;
  }
  var ellipticalPath = class {
    constructor() {
      this.name = "ellipse";
      this.style = { ...previousStyle };
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
    draw(ctx2, p) {
      setPathStyle(ctx2, this.style);
      ctx2.beginPath();
      var cViewport = p.partToViewport(this.center);
      ctx2.ellipse(cViewport.x, cViewport.y, this.radius, this.radius, 0, this.startAngle, this.endAngle);
      ctx2.stroke();
    }
  };
  var freePath = class {
    constructor() {
      this.name = "free";
      this.style = { ...previousStyle };
      this.controlPoints = [[]];
    }
    draw(ctx2, p) {
      setPathStyle(ctx2, this.style);
      ctx2.lineJoin = "round";
      ctx2.lineCap = "round";
      ctx2.beginPath();
      var vStart = p.partToViewport(this.controlPoints[0][0]);
      ctx2.moveTo(vStart.x, vStart.y);
      for (let s = 0; s < this.controlPoints.length; s++) {
        var vEnd = p.partToViewport(this.controlPoints[s][0]);
        ctx2.lineTo(vEnd.x, vEnd.y);
      }
      ctx2.stroke();
    }
  };
  var linePath = class {
    constructor() {
      this.name = "line";
      this.style = { ...previousStyle };
      this.controlPoints = [[], []];
    }
    get start() {
      return this.controlPoints[0][0];
    }
    get end() {
      return this.controlPoints[1][0];
    }
    draw(ctx2, p) {
      setPathStyle(ctx2, this.style);
      ctx2.beginPath();
      var vStart = p.partToViewport(this.start);
      var vEnd = p.partToViewport(this.end);
      ctx2.moveTo(vStart.x, vStart.y);
      ctx2.lineTo(vEnd.x, vEnd.y);
      ctx2.stroke();
    }
  };
  var ngonPath = class {
    constructor() {
      this.name = "ngon";
      this.style = { ...previousStyle };
      this.controlPoints = [[]];
    }
    draw(ctx2, p) {
      setPathStyle(ctx2, this.style);
      ctx2.beginPath();
      for (let i = 2; i < this.controlPoints[0].length; i++) {
        var vStart = p.partToViewport(this.controlPoints[0][i - 1]);
        var vEnd = p.partToViewport(this.controlPoints[0][i]);
        ctx2.moveTo(vStart.x, vStart.y);
        ctx2.lineTo(vEnd.x, vEnd.y);
      }
      var vStart = p.partToViewport(this.controlPoints[0][this.controlPoints[0].length - 1]);
      var vEnd = p.partToViewport(this.controlPoints[0][1]);
      ctx2.moveTo(vStart.x, vStart.y);
      ctx2.lineTo(vEnd.x, vEnd.y);
      ctx2.stroke();
    }
  };
  var pathMap = /* @__PURE__ */ new Map([
    ["free", () => new freePath()],
    ["elliptical", () => new ellipticalPath()],
    ["line", () => new linePath()],
    ["ngon", () => new ngonPath()]
  ]);
  function setParts(ps) {
    parts = ps;
  }
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
    `]
  ], "config");
  var Part = class {
    constructor(name) {
      this.pos = viewportToWorld2(new Vec2(0, 0));
      this.startPos = viewportToWorld2(new Vec2(0, 0));
      this.rigidbody = new rigidbody(this);
      this.paths = [];
      this._name = "Part";
      this.pathListNode = new container();
      this.pathConfigContainer = new container();
      this.recordingDraw = false;
      this.visible = true;
      this._name = name ? name : `Part ${parts.length + 1}`;
      var previewCanvas = new canvas();
      this.previewCtx = previewCanvas.getContext("2d");
      this.listNode = new container(this.name, previewCanvas.addStyle(`position: absolute; z-index: 0; top: 0; left: 0; width: 100%; height: 100%;`), new button("\u{1F441}").addToStyleGroup(visiblityStyles).addStyle("margin-left: auto; background-color: transparent; height: min-content; padding: 0; position: relative; border: none; padding: 0;").addEventListener("click", (self) => {
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
      this.configNode = new container(new header1(this.name).addStyle("text-align: right; margin: 0; margin-right: 4px; font-size: 1em;"), new header2("Paths"), this.pathListNode, this.pathConfigContainer, new container("Has Gravity", new textInput().setAttribute("type", "checkbox").setAttribute("checked", "").addEventListener("change", (self) => {
        this.rigidbody.hasGravity = self.htmlNode.checked;
        console.log(this.rigidbody.hasGravity);
      }))).addToStyleGroup(configStyles);
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
    pathConfig() {
      if (this.selectedPath) {
        return new container(new container("Colour: ", new textInput().setAttribute("type", "color").setValue(this.selectedPath.style.colour).addEventListener("change", (self) => {
          this.selectedPath.style.colour = self.htmlNode.value;
        })), new container("Width: ", new textInput().setAttribute("type", "number").setValue(this.selectedPath.style.width.toString()).addEventListener("change", (self) => {
          this.selectedPath.style.width = parseFloat(self.htmlNode.value);
        })));
      } else {
        return new container("select a path to alter style");
      }
    }
    addPath(p) {
      this.paths.push(p);
      for (let i of this.pathListNode.children) {
        i.removeClass("selected").applyLastChange();
      }
      this.selectedPath = p;
      this.pathListNode.addChildren(new button(p.name).addToStyleGroup(pathBtnStyles).addClass("selected").addEventListener("click", (self) => {
        for (let i of self.parent.children) {
          i.removeClass("selected").applyLastChange();
        }
        self.addClass("selected").applyLastChange();
        this.selectedPath = p;
        this.pathConfigContainer.removeAllChildren();
        this.pathConfigContainer.addChildren(this.pathConfig());
        rerender(this.pathConfigContainer);
      }));
      this.pathConfigContainer.removeAllChildren();
      this.pathConfigContainer.addChildren(this.pathConfig());
      rerender(this.pathConfigContainer);
      rerender(this.pathListNode.parent);
    }
    worldToPart(pos) {
      return new Vec2(pos.x - this.pos.x, pos.y - this.pos.y);
    }
    partToWorld(pos) {
      return new Vec2(pos.x + this.pos.x, pos.y + this.pos.y);
    }
    partToViewport(pos) {
      return worldToViewport(this.partToWorld(pos));
    }
    viewportToPart(pos) {
      return this.worldToPart(viewportToWorld2(pos));
    }
    draw(ctx2) {
      ctx2.lineWidth = 3;
      for (let p of this.paths) {
        p.draw(ctx2, this);
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

  // src/shapes.ts
  var ngonSides = 3;
  var shapeButtons = {
    line: new button("line").setAttribute("title", "line (w)"),
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
        p.controlPoints[0][0] = currentPart2.viewportToPart(mousePos2);
        p.controlPoints[1][0] = new Vec2(p.start.x, p.start.y);
        currentPart2.addPath(p);
      },
      handleDraw: (controlPoints) => {
        var c2 = currentPart2.currentPath;
        c2.controlPoints[1][0] = currentPart2.viewportToPart(mousePos2);
      }
    },
    circle: {
      centerControlPoints: (self) => {
        self.controlPoints = [[currentPart2.viewportToPart(new Vec2(c.htmlNode.width / 2, c.htmlNode.height / 2)), currentPart2.viewportToPart(new Vec2(c.htmlNode.width / 2 + 100, c.htmlNode.height / 2))]];
      },
      handleStartDraw: (controlPoints) => {
        var p = new ellipticalPath();
        console.log(controlPoints);
        p.controlPoints[0][0] = currentPart2.viewportToPart(mousePos2);
        p.controlPoints[0][1] = currentPart2.viewportToPart(mousePos2);
        p.controlPoints[1][0] = p.controlPoints[0][1];
        p.controlPoints[2][0] = p.controlPoints[0][1];
        currentPart2.addPath(p);
      },
      handleDraw: (controlPoints) => {
        var p = currentPart2.currentPath;
        p.controlPoints[0][1] = currentPart2.viewportToPart(mousePos2);
      }
    },
    ngon: {
      handleStartDraw: (controlPoints) => {
        var p = new ngonPath();
        p.controlPoints[0][0] = currentPart2.viewportToPart(mousePos2);
        console.log(`center: X:${p.controlPoints[0][0].x} Y:${p.controlPoints[0][0].y}`);
        var radius = 20;
        for (let i = 0; i < ngonSides; i++) {
          var a = 360 / ngonSides * i;
          p.controlPoints[0][i + 1] = new Vec2(0, 0);
          p.controlPoints[0][i + 1].x = Math.sin(a * (Math.PI / 180)) * radius + p.controlPoints[0][0].x;
          p.controlPoints[0][i + 1].y = Math.cos(a * (Math.PI / 180)) * radius + p.controlPoints[0][0].y;
        }
        currentPart2.addPath(p);
      },
      handleDraw: (controlPoints) => {
        var c2 = currentPart2.currentPath;
        c2.controlPoints[0][1] = currentPart2.viewportToPart(mousePos2);
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
  var selectedTool2 = "free";
  var freehandSegmentLength = 3;
  var currentPath;
  var toolButtons = {
    free: new button("free").setAttribute("title", "free (g)").addClass("selected"),
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
        p.controlPoints = [[viewportToWorld2(mousePos2)]];
        currentPart2.addPath(p);
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
        currentPart2.addPath(p);
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
        currentPart2.addPath(p);
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
    select: new button("select").setAttribute("title", "select (s)"),
    draw: new button("draw").setAttribute("title", "draw (d)").addClass("selected"),
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
  var selectedMode = "draw";
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

  // src/simulate.ts
  var scaleFactor = 10;
  var simulationSpeed = 25;
  function simulate(cg) {
    for (let i of cg.parts) {
      i.rigidbody.generate();
      if (i.rigidbody.hasGravity) {
        i.rigidbody.force = new Vec2(0, i.rigidbody.mass * 10);
      } else {
        i.rigidbody.force = new Vec2(0, 0);
      }
      i.rigidbody.velocity = new Vec2(0, 0);
    }
    timing(simulationSpeed, (dt) => {
      var ds = dt / 1e3;
      for (let i of cg.parts) {
        i.rigidbody.acceleration = new Vec2(i.rigidbody.force.x / i.rigidbody.mass, i.rigidbody.force.y / i.rigidbody.mass);
        i.rigidbody.velocity.x += i.rigidbody.acceleration.x * ds;
        i.rigidbody.velocity.y += i.rigidbody.acceleration.y * ds;
        i.pos.x += i.rigidbody.velocity.x * ds * scaleFactor;
        i.pos.y += i.rigidbody.velocity.y * ds * scaleFactor;
        console.log(i.pos, ds, i.rigidbody.velocity, i.rigidbody.acceleration, i.rigidbody.force);
      }
    });
  }
  function stopSimulation(cg) {
    shouldPause = true;
    for (let i of cg.parts) {
      i.pos.x = i.startPos.x;
      i.pos.y = i.startPos.y;
    }
  }
  var shouldPause = false;
  function timing(frequency, simFn) {
    var beginTime = 0;
    var currentTime = 0;
    shouldPause = false;
    if (this.isEnded) {
      startTime = 0;
    }
    var frameIndex = beginTime * frequency;
    var isPlaying = true;
    var isEnded = false;
    let renderFrame;
    var startTime = Date.now();
    var realTime = 0;
    renderFrame = (frame) => {
      var roundedFrameIndex = Math.round(frameIndex);
      if (shouldPause) {
        console.log("paused");
        this.shouldPause = false;
        this.isPlaying = false;
      } else {
        let targetTime = frameIndex / frequency * 1e3;
        let dTime = Date.now() - startTime + beginTime * 1e3 - realTime;
        simFn(dTime);
        realTime = Date.now() - startTime + beginTime * 1e3;
        currentTime = (realTime + startTime * 1e3) / 1e3;
        if (realTime < targetTime) {
          setTimeout(() => {
            frameIndex = roundedFrameIndex + 1;
            renderFrame(frameIndex);
          }, targetTime - realTime);
        } else {
          frameIndex += (realTime - targetTime) / frequency;
          renderFrame(frameIndex);
        }
      }
    };
    renderFrame(0);
  }

  // src/physics.ts
  var collisionGroup = class {
    constructor(name) {
      this.parts = [];
      this.name = "New Group";
      this.collide = true;
      this.name = name;
    }
    addPart(p) {
      this.parts.push(p);
    }
    removePart(p) {
      this.parts.splice(this.parts.indexOf(p));
    }
    rerender() {
      this.listener();
    }
    simulate() {
      simulate(this);
    }
  };
  var collisionGroups = [
    new collisionGroup("Main Collision Group")
  ];
  function cgListItem(title, items) {
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
  var CGStyles = new styleGroup([
    ["li.this-part::after", `
        content: " (This part)";

    `],
    ["li.this-part", `
        font-weight: bold;

    `],
    ["li", `
        list-style-type: "";
    `],
    [".cg", `
        margin-left: 3px;
    `]
  ], "cg");
  function getCollisionGroupNode(group) {
    const pList = new container().addToStyleGroup(CGStyles);
    var rF = () => {
      pList.removeAllChildren();
      pList.addChildren(new textInput().setAttribute("type", "checkbox").setAttribute("checked", "").addEventListener("input", (self) => {
        group.collide = self.htmlNode.checked;
      }));
      console.log(parts);
      for (let i of parts) {
        var input = new textInput().setAttribute("type", "checkbox").setAttribute(group.parts.includes(i) ? "checked" : "placeholder", "").addEventListener("input", () => {
          if (input.htmlNode.checked) {
            for (let p of group.parts) {
              if (i == p) {
                return;
              }
            }
            group.addPart(i);
          } else {
            group.removePart(i);
          }
        });
        if (i == currentPart2) {
          pList.addChildren(new listItem(input, i.name).addClass("this-part"));
        } else {
          pList.addChildren(new listItem(input, i.name));
        }
      }
      console.log("rendered", group.parts, group);
      if (pList.htmlNode) {
        pList.lightRerender();
      }
    };
    group.listener = rF;
    rF();
    return cgListItem(new textInput().addEventListener("change", (self) => {
      group.name = self.htmlNode.value;
    }).addEventListener("click", (self, e) => {
      e.stopImmediatePropagation();
    }).setAttribute("value", group.name).addStyle("text-overflow: ellipsis; width: min-content; white-space: nowrap; overflow: hidden; border: none; background-color: transparent;"), [pList]);
  }
  var collisionGroupsNodeContainer = new container(...collisionGroups.map((g) => getCollisionGroupNode(g))).addStyle("margin: 3px;");
  var simulating = false;
  var physicsConfig = menuList2("Physics", [
    collisionGroupsNodeContainer,
    new button("+").addToStyleGroup(buttonStyles).addEventListener("click", () => {
      collisionGroups.push(new collisionGroup("Group " + (collisionGroups.length + 1)));
      collisionGroupsNodeContainer.addChildren(getCollisionGroupNode(collisionGroups[collisionGroups.length - 1]));
      collisionGroupsNodeContainer.lightRerender();
    }),
    new button("Simulate").addToStyleGroup(buttonStyles).addEventListener("click", (self) => {
      if (simulating == false) {
        for (let i of collisionGroups) {
          i.simulate();
          self.children[0].content = "Stop Simulation";
          simulating = true;
          self.children[0].rerender();
        }
      } else {
        for (let i of collisionGroups) {
          stopSimulation(i);
          self.children[0].content = "Simulate";
          simulating = false;
          self.children[0].rerender();
        }
      }
    })
  ]);

  // src/save.ts
  function savePart(p) {
    return {
      name: p.name,
      pos: p.pos,
      startPos: p.startPos,
      rigidbody: {
        mass: p.rigidbody.mass,
        hasGravity: p.rigidbody.hasGravity
      },
      paths: p.paths.map((path) => {
        return {
          controlPoints: path.controlPoints,
          style: path.style,
          type: path.name
        };
      })
    };
  }
  function loadPart(p) {
    var pr = createPart();
    pr.name = p.name;
    for (let v of p.paths) {
      console.log(v.type);
      var pConstructor = pathMap.get(v.type);
      if (pConstructor) {
        var path = pConstructor();
        path.controlPoints = v.controlPoints;
        path.style = v.style;
        pr.addPath(path);
      } else {
        console.error("invalid path type: ", v.type);
      }
    }
    pr.pos = p.pos;
    pr.startPos = p.startPos;
    pr.rigidbody = new rigidbody(pr);
    pr.rigidbody.mass = p.rigidbody.mass;
    pr.rigidbody.hasGravity = p.rigidbody.hasGravity;
    return pr;
  }
  async function saveAs() {
    const options = {
      types: [
        {
          description: "Draw Files",
          accept: {
            "text/plain": [".drw"]
          }
        }
      ]
    };
    console.log("here");
    var fileHandle = await window.showSaveFilePicker(options);
    const writable = await fileHandle.createWritable();
    var toWrite = {
      parts: parts.map(savePart)
    };
    console.log(toWrite);
    await writable.write(JSON.stringify(toWrite));
    await writable.close();
    set("prev", fileHandle);
  }
  async function save() {
    var fileHandle = await get("prev");
    if (!fileHandle) {
      saveAs();
      return;
    }
    console.log("saving to", fileHandle.name);
    const writable = await fileHandle.createWritable();
    var toWrite = {
      parts: parts.map(savePart)
    };
    console.log(toWrite);
    await writable.write(JSON.stringify(toWrite));
    await writable.close();
  }
  async function openFile() {
    var [fileHandle] = await window.showOpenFilePicker();
    const file = await fileHandle.getFile();
    const saveObject = JSON.parse(await file.text());
    console.log(saveObject);
    deleteAllParts();
    for (let p of saveObject.parts) {
      parts.push(loadPart(p));
    }
  }
  async function openPrev() {
    var fileHandle = await get("prev");
    if (!fileHandle) {
      return;
    }
    if (await fileHandle.queryPermission() == "denied") {
      await fileHandle.requestPermission();
      if (await fileHandle.queryPermission() == "denied") {
        return;
      }
    }
    const file = await fileHandle.getFile();
    const saveObject = JSON.parse(await file.text());
    console.log(saveObject);
    deleteAllParts();
    for (let p of saveObject.parts) {
      parts.push(loadPart(p));
    }
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
  var c = new canvas().addStyle(`background-color: ${theme.gridTheme.bgColor};`);
  var ctx = c.getContext("2d");
  ctx.lineCap = "round";
  var pointerPos = new Vec2(0, 0);
  var mousePos2 = new Vec2(0, 0);
  var mouseDown = false;
  c.addEventListener("wheel", (self, ev) => {
    var e = ev;
    e.preventDefault();
    var befPos = viewportToWorld2(pointerPos);
    zoomFactor -= e.wheelDelta / 480;
    var aftPos = viewportToWorld2(pointerPos);
    posInWorld.x += befPos.x - aftPos.x;
    posInWorld.y += befPos.y - aftPos.y;
  });
  ctx.strokeStyle = "red";
  var defaultVec2 = new Vec2(0, 0);
  var draggingItems = [];
  function drawControlPoints(ctx2, controlPoints) {
    for (let c2 of controlPoints) {
      for (let i of c2) {
        ctx2.beginPath();
        var vCoords = worldToViewport(i);
        ctx2.ellipse(vCoords.x, vCoords.y, 1, 1, 0, 0, 360);
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
  var mouseDownPos2 = new Vec2(0, 0);
  var mouseDownPosV = new Vec2(0, 0);
  c.addEventListener("pointerdown", () => {
    mouseDownPos2 = viewportToWorld2(mousePos2);
    mouseDownPosV = mousePos2;
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
  var engageSnapping = true;
  var snapToIntersections = false;
  var snapDistance = 7;
  function checkSnapPoints() {
    if (engageSnapping) {
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
    }
    return pointerPos;
  }
  function invertColor(hex) {
    if (hex.indexOf("#") === 0) {
      hex = hex.slice(1);
    }
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
      throw new Error("Invalid HEX color.");
    }
    var r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16), g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16), b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
    return "#" + padZero(r) + padZero(g) + padZero(b);
  }
  function padZero(str, len) {
    len = len || 2;
    var zeros = new Array(len).join("0");
    return (zeros + str).slice(-len);
  }
  function render() {
    var newMousePos = checkSnapPoints();
    mousePos2.x = newMousePos.x;
    mousePos2.y = newMousePos.y;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = theme.gridTheme.bgColor;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawGrid(ctx, posInWorld, gridMinorInterval, gridMajorInterval);
    ctx.strokeStyle = "grey";
    var worldMousePos = viewportToWorld2(mousePos2);
    xCoordReadout.content = `${worldMousePos.x}`;
    xCoordReadout.rerender();
    yCoordReadout.content = `${worldMousePos.y}`;
    yCoordReadout.rerender();
    ctx.lineWidth = 1;
    for (let i of parts) {
      if (i.visible) {
        i.draw(ctx);
        i.previewCtx.clearRect(0, 0, i.previewCtx.canvas.width, i.previewCtx.canvas.height);
        i.previewCtx.fillStyle = theme.gridTheme.bgColor;
        i.previewCtx.fillRect(0, 0, i.previewCtx.canvas.width, i.previewCtx.canvas.height);
        i.draw(i.previewCtx);
      }
    }
    if (selectedTool2) {
      var tG = toolGuides[selectedTool2];
      tG.draw(ctx, tG.controlPoints);
      if (selectedMode == "select") {
        drawControlPoints(ctx, tG.controlPoints);
      }
    }
    if (selectedMode == "select") {
      for (let i of currentPart2.paths) {
        ctx.strokeStyle = i.style.colour;
        ctx.strokeStyle = invertColor(ctx.strokeStyle);
        ctx.fillStyle = "";
        ctx.lineWidth = 2;
        drawControlPoints(ctx, i.controlPoints);
      }
    }
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
    lastMousePos.x = mousePos2.x;
    lastMousePos.y = mousePos2.y;
    requestAnimationFrame(render);
  }
  c.addEventListener("mousemove", (self, e) => {
    var ev = e;
    pointerPos.x = ev.clientX;
    pointerPos.y = ev.clientY;
    if (mouseDown) {
      if (selectedMode == "move") {
        posInWorld.x = mouseDownPos2.x - zoomFactor * pointerPos.x;
        posInWorld.y = mouseDownPos2.y - zoomFactor * pointerPos.y;
        console.log(mouseDownPos2, viewportToWorld2(mousePos2), pointerPos, posInWorld);
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
        posInWorld.x = mouseDownPos2.x - mousePos2.x;
        posInWorld.y = mouseDownPos2.y - mousePos2.y;
        console.log(mouseDownPos2, mousePos2, posInWorld);
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
  collisionGroups[0].addPart(currentPart2);
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
        box-sizing: border-box;

    `],
    [".part-list-container", `
        width: 100%;
    `]
  ], "part-list-container");
  var partList = new container(...parts.map((p) => p.listNode.addEventListener("click", () => {
    selectPart3(p);
  }))).addClass("list");
  var partConfigs = menuList2("Part", parts.map((p) => p.configNode)).addStyle("width: 100%;");
  function createPart() {
    var newPart = new Part();
    parts.push(newPart);
    partList.addChildren(newPart.listNode.addEventListener("click", () => {
      selectPart3(newPart);
    }));
    partList.lightRerender();
    partConfigs.addChildren(newPart.configNode);
    partConfigs.lightRerender();
    collisionGroups[0].addPart(newPart);
    selectPart3(newPart);
    return newPart;
  }
  function deletePart2(p) {
    setParts(parts.splice(parts.indexOf(p)));
    partList.removeChild(p.listNode);
    partList.lightRerender();
    partConfigs.removeChild(p.configNode);
    partConfigs.lightRerender();
    collisionGroups[0].removePart(p);
    selectPart3(parts[parts.length - 1]);
  }
  function deleteAllParts() {
    setParts([]);
    partList.removeAllChildren();
    partList.lightRerender();
    partConfigs.removeAllChildren();
    partConfigs.lightRerender();
    collisionGroups[0].parts = [];
  }
  function selectPart3(part) {
    for (let i of parts) {
      i.listNode.removeClass("selected").applyLastChange();
      i.configNode.removeClass("visible").applyLastChange();
    }
    console.trace("selecting", part.name);
    part.listNode.addClass("selected").applyLastChange();
    part.configNode.addClass("visible").applyLastChange();
    currentPart2 = part;
    for (let i of collisionGroups) {
      i.listener();
    }
  }
  function menuList2(title, items) {
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
  var generalStyles = dynamicStyleGroup(() => [
    ["*", `
        color: ${theme.textTheme.textColor};
    `]
  ], "general");
  var app = new container(new container("x:", xCoordReadout, " y:", yCoordReadout).addStyle("position: absolute; bottom: 0; right: 0;"), c.addStyle("width: 100%; height: 100%; cursor: none;"), new container(partConfigs, physicsConfig).addStyle(`
        position: absolute;
        right: 0;
        top: 0;
        margin: 0.3em;
        width: 13em;
        overflow: hidden;
    `), new container(new button("save").addToStyleGroup(buttonStyles).addEventListener("click", save), new button("save as").addToStyleGroup(buttonStyles).addEventListener("click", saveAs), new button("open").addToStyleGroup(buttonStyles).addEventListener("click", openFile), menuList2("Preferences", [
    menuList2("style", [
      menuList2("grid", [
        new button("width").addToStyleGroup(buttonStyles)
      ])
    ]),
    menuList2("themes", [
      new button("dark").addToStyleGroup(buttonStyles).addEventListener("click", () => {
        setTheme(darkTheme);
      }),
      new button("light").addToStyleGroup(buttonStyles).addEventListener("click", () => {
        setTheme(lightTheme);
      }),
      new button("+").addToStyleGroup(buttonStyles)
    ])
  ]), new container().addToStyleGroup(hrStyles), new button("clear").addToStyleGroup(buttonStyles).addEventListener("click", () => {
    if (confirm("Are you sure you want to clear this part's paths?")) {
      currentPart2.paths = [];
    }
  }), menuList2("Guides", Object.values(toolButtons)), menuList2("Shapes", Object.values(shapeButtons)), menuList2("Modes", Object.values(modeButtons)), menuList2("Grid", [
    new container("Snap:", new textInput().setAttribute("checked", "").setAttribute("type", "checkbox").addEventListener("change", (self) => {
      console.log(self.htmlNode.checked);
      engageSnapping = self.htmlNode.checked;
    }).addStyle("width: min-content; margin: none;"), new textInput().setValue(snapDistance.toString()).setAttribute("type", "number").addEventListener("change", (self) => {
      snapDistance = parseInt(self.htmlNode.value);
    })).addToStyleGroup(inputStyles).setAttribute("title", "Snap distance - threshold needed to snap cursor to point"),
    new container("Major:", new textInput().setValue(gridMajorInterval.toString()).setAttribute("type", "number").addEventListener("change", (self) => {
      gridMajorInterval = parseInt(self.htmlNode.value);
    })).addToStyleGroup(inputStyles).setAttribute("title", "Major grid interval - distance between major grid lines, measured in px"),
    new container("Minor:", new textInput().setValue(gridMinorInterval.toString()).setAttribute("type", "number").addEventListener("change", (self) => {
      gridMinorInterval = parseInt(self.htmlNode.value);
    })).addToStyleGroup(inputStyles).setAttribute("title", "Minor grid interval - distance between minor grid lines, measured in px")
  ]), menuList2("Parts", [new container(partList, new button("+").addToStyleGroup(buttonStyles).addEventListener("click", createPart)).addToStyleGroup(partListStyles)])).addStyle("display: flex; width: 5em; height: calc(100% - 0.6em); padding: 0.3em; position: absolute; top: 0; flex-direction: column; align-items: center; gap: 0.2em;"), new container(xOffset, yOffset)).addToStyleGroup(generalStyles);
  (async () => {
    var t = await get("theme");
    setTheme(t ? t : darkTheme);
    c.addStyle(`background-color: ${theme.gridTheme.bgColor};`);
    renderApp(app, document.getElementById("app"));
    selectPart3(currentPart2);
    c.setAttribute("width", `${c.htmlNode.clientWidth}`);
    c.setAttribute("height", `${c.htmlNode.clientHeight}`);
    c.lightRerender();
    resizeObserver.observe(c.htmlNode);
    openPrev();
    requestAnimationFrame(render);
  })();
})();
