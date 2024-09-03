(() => {
  // node_modules/uuid/dist/esm-browser/rng.js
  var getRandomValues;
  var rnds8 = new Uint8Array(16);
  function rng() {
    if (!getRandomValues) {
      getRandomValues = typeof crypto !== "undefined" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto);
      if (!getRandomValues) {
        throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
      }
    }
    return getRandomValues(rnds8);
  }

  // node_modules/uuid/dist/esm-browser/stringify.js
  var byteToHex = [];
  for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 256).toString(16).slice(1));
  }
  function unsafeStringify(arr, offset = 0) {
    return byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]];
  }

  // node_modules/uuid/dist/esm-browser/native.js
  var randomUUID = typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto);
  var native_default = {
    randomUUID
  };

  // node_modules/uuid/dist/esm-browser/v4.js
  function v4(options, buf, offset) {
    if (native_default.randomUUID && !buf && !options) {
      return native_default.randomUUID();
    }
    options = options || {};
    const rnds = options.random || (options.rng || rng)();
    rnds[6] = rnds[6] & 15 | 64;
    rnds[8] = rnds[8] & 63 | 128;
    if (buf) {
      offset = offset || 0;
      for (let i = 0; i < 16; ++i) {
        buf[offset + i] = rnds[i];
      }
      return buf;
    }
    return unsafeStringify(rnds);
  }
  var v4_default = v4;

  // lib.ts
  var styleGroup = class {
    constructor(styles, className) {
      this.members = [];
      this.checksum = 0;
      this.className = v4_default();
      this.styles = styles;
      if (className) {
        this.className = className;
      }
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
    node.htmlNode.style.cssText = computeStyles(node.styles);
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
    node.htmlNode.style.cssText = computeStyles(node.styles);
    for (let i of node.changes) {
      i();
    }
    node.changes = [];
    for (let i of node.onMountQueue) {
      i();
    }
    node.onMountQueue = [];
  }
  var appFrwkNode = class {
    constructor(children) {
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
      this.children = children;
      for (let i of children) {
        i.parent = this;
        this.changes.push(() => {
          i.render(this.htmlNode);
        });
      }
    }
    setFlag(key, val) {
      this.flag.set(key, val);
      return this;
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
    applyStyle(styles) {
      this.styles.push(styles);
      this.changes.push(() => {
        this.htmlNode.style.cssText += computeStyles([styles]);
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
    addChildren(children) {
      for (let i of children) {
        i.parent = this;
        this.children.push(i);
        this.changes.push(() => {
          i.render(this.htmlNode);
        });
      }
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
    renderNewChildren(children) {
      this.addChildren(children);
      computeDimensions(this, true);
      if (this.htmlNode) {
        for (let i of children) {
          i.render(this.htmlNode);
        }
      }
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
  function computeStyles(styles) {
    let styleString = "";
    for (let i of styles) {
      for (let rule of i) {
        styleString += rule;
      }
    }
    return styleString;
  }
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
  var resizeElement = document.createElement("div");
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
  function renderApp(node, target) {
    node.applyStyle(["width: 100%;", "height: 100%; overflow: hidden;"]);
    node.width = document.body.clientWidth;
    node.height = document.body.clientHeight;
    const onResize = () => {
      resizeElement.style.display = "none";
      node.width = document.body.clientWidth;
      node.height = document.body.clientHeight;
      node.updateDimensions();
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

  // elements.ts
  var container = class extends appFrwkNode {
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
  var textInput = class extends appFrwkNode {
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

  // examples/main.ts
  var c = new container([]);
  var styl = new styleGroup([
    [".f", `
        background-color: pink;
    `]
  ], "f");
  var app = new appFrwkNode([
    new textInput([]).addEventListener("click", (self) => {
      self.setValue("ey up there").applyLastChange();
    })
  ]);
  renderApp(app, document.body);
})();
