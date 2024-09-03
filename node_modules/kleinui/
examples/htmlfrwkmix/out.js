(() => {
  // lib.ts
  function elementToNode(el) {
    if (typeof el == "string") {
      return new kleinTextNode(el);
    }
    return el;
  }
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
  function renderNode(node, target) {
    node.addStyle("width: 100%; overflow: hidden;");
    node.updateDimensions();
    target.style.overflow = "hidden";
    node.render(target);
  }

  // elements.ts
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

  // examples/htmlfrwkmix/main.ts
  var calendar = new container(new textInput().addEventListener("click", (self) => {
    self.setValue("ey up there").applyLastChange();
  })).addStyle("width: 100%; height: 100%;");
  renderNode(calendar, document.getElementById("calendar"));
})();
