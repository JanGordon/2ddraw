import { button, canvas, container, textInput } from "kleinui/elements"
import { kleinElementNode, kleinTextNode, renderApp, styleGroup } from "kleinui"
import { keys, registerKeybind } from "./keys"
import { drawGrid } from "./grid"
import { ellipticalPath, freePath, linePath, Part, parts, Path, setParts } from "./part"
import { near, near2d, Vec2 } from "./vec"
import { toolGuides, toolButtons, selectedTool } from "./guides"
import { modeButtons, selectedMode } from "./modes"
import { selectedShape, shapeButtons, shapeGenerators } from "./shapes"
import { buttonStyles, inputStyles } from "./styles"
import { collisionGroup, collisionGroups, physicsConfig } from "./physics"
import { darkTheme, lightTheme, setTheme, theme } from "./preferences"
import { dynamicStyleGroup } from "./theme"
import { openFile, openPrev, save, saveAs } from "./save"
import { get } from "idb-keyval"




const controlSnapDistance = 10

var gridMinorInterval = 20
var gridMajorInterval = 100



var posInWorld = new Vec2(0,0)
export var zoomFactor = 1



export function viewportToWorld(pos: Vec2) {
    return new Vec2(
        pos.x * zoomFactor + posInWorld.x,
        pos.y * zoomFactor + posInWorld.y
    )
}

export function worldToViewport(pos: Vec2) {
    return new Vec2(
        (pos.x - posInWorld.x) / zoomFactor,
        (pos.y - posInWorld.y) / zoomFactor
    )
}



export const c = new canvas().addStyle(`background-color: ${theme.gridTheme.bgColor};`)
export const ctx = c.getContext("2d")!

ctx.lineCap = "round"

export var pointerPos = new Vec2(0,0) // specifically position of pointer ignoring snapping
export var mousePos = new Vec2(0,0) // mouse position including snapping
export var mouseDown = false

c.addEventListener("wheel", (self, ev)=>{
    var e = ev as WheelEvent
    e.preventDefault()
    // world posiiton of mouse before zoom
    var befPos = viewportToWorld(pointerPos)
    //@ts-ignore
    zoomFactor -= e.wheelDelta/480
    // world position of mouse after zoom
    var aftPos = viewportToWorld(pointerPos)

    // move world by that differnce
    posInWorld.x += befPos.x - aftPos.x
    posInWorld.y += befPos.y - aftPos.y
})




ctx.strokeStyle = "red"

var defaultVec2 = new Vec2(0,0)

var draggingItems: Vec2[] = []

function drawControlPoints(ctx: CanvasRenderingContext2D, controlPoints: Vec2[][]) {
    for (let c of controlPoints) {
        for (let i of c) {
            ctx.beginPath()
            var vCoords = worldToViewport(i)
            ctx.ellipse(vCoords.x, vCoords.y, 1,1,0,0,360)
            ctx.stroke()
            if (mouseDown && selectedMode == "select") {
                if (near(mousePos.x, vCoords.x, controlSnapDistance ) && near(mousePos.y, vCoords.y, controlSnapDistance )) {
                    
                    draggingItems.push(i)
                    

                }
                if (draggingItems.includes(i)) {
                    if (i == c[0] && c.length > 1) {
                        
                        
                        for (let p = 1; p < c.length; p++) {
                            var yOffsetToOtherControlPoint = i.y - c[p].y
                            var xOffsetToOtherControlPoint = i.x - c[p].x
                            var newNeighbour = viewportToWorld(new Vec2(mousePos.x - xOffsetToOtherControlPoint, mousePos.y - yOffsetToOtherControlPoint))
                            c[p].x = newNeighbour.x
                            c[p].y = newNeighbour.y
                        }
                        var newI = viewportToWorld(mousePos)
                        i.x = newI.x
                        i.y = newI.y
                        
                    } else {
                        var newI = viewportToWorld(mousePos)
                        i.x = newI.x
                        i.y = newI.y
                    }
                }
            }
        }
        
    }
}

export var mouseDownPos = new Vec2(0,0)  // in world position
export var mouseDownPosV = new Vec2(0,0)  // in Viewport position
c.addEventListener("pointerdown", ()=>{
    mouseDownPos = viewportToWorld(mousePos)
    mouseDownPosV = mousePos
    if (selectedMode == "draw") {
        if (selectedTool) {
            toolGuides[selectedTool].handleStartDraw(toolGuides[selectedTool].controlPoints)

        } else {
            shapeGenerators[selectedShape].handleStartDraw(shapeGenerators[selectedShape].controlPoints)

        }
    }
    mouseDown = true
})
document.addEventListener("pointerup", ()=>{
    mouseDown = false
    draggingItems = []
})
document.addEventListener("touchend", ()=>{
    mouseDown = false
    draggingItems = []
})



var lastMousePos = new Vec2(0,0)

var engageSnapping = true
var snapToIntersections = false
var snapDistance = 7

function checkSnapPoints(): Vec2 {
    if (engageSnapping) {
        var worldPointerPos = viewportToWorld(pointerPos)
        if (snapToIntersections) {
            var nearestSnapPoint = new Vec2(
                Math.round(worldPointerPos.x / gridMinorInterval) * gridMinorInterval,
                Math.round(worldPointerPos.y / gridMinorInterval) * gridMinorInterval
            )
            if (near2d(pointerPos, nearestSnapPoint, snapDistance)) {
                return nearestSnapPoint
            }
        } else {
            var closestXSnapPoint = Math.round(worldPointerPos.x / gridMinorInterval) * gridMinorInterval
            var closestYSnapPoint = Math.round(worldPointerPos.y / gridMinorInterval) * gridMinorInterval
            
            var newPos = new Vec2(pointerPos.x, pointerPos.y)
            
            if (near(pointerPos.x, closestXSnapPoint, snapDistance)) {
                newPos.x = closestXSnapPoint
            }
            if (near(pointerPos.y, closestYSnapPoint, snapDistance)) {
                newPos.y = closestYSnapPoint
            }
            return newPos
    
        }
    }
    
    

    
    return pointerPos
}

function invertColor(hex: string) {
    if (hex.indexOf('#') === 0) {
        hex = hex.slice(1);
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color.');
    }
    // invert color components
    var r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16),
        g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16),
        b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
    // pad each with zeros and return
    return '#' + padZero(r) + padZero(g) + padZero(b);
}

function padZero(str: string, len?: number) {
    len = len || 2;
    var zeros = new Array(len).join('0');
    return (zeros + str).slice(-len);
}

function render() {

    var newMousePos = checkSnapPoints()
    mousePos.x = newMousePos.x
    mousePos.y = newMousePos.y
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height)
    ctx.fillStyle = theme.gridTheme.bgColor
    ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height)

    drawGrid(ctx, posInWorld, gridMinorInterval, gridMajorInterval)
    ctx.strokeStyle = "grey"
    
    

    

    var worldMousePos = viewportToWorld(mousePos)
    xCoordReadout.content = `${worldMousePos.x}`
    xCoordReadout.rerender()
    yCoordReadout.content = `${worldMousePos.y}`
    yCoordReadout.rerender()
    ctx.lineWidth = 1

    
    for (let i of parts) {
        if (i.visible) {
            i.draw(ctx)
            i.previewCtx.clearRect(0,0, i.previewCtx.canvas.width, i.previewCtx.canvas.height)
            i.previewCtx.fillStyle = theme.gridTheme.bgColor
            i.previewCtx.fillRect(0,0,i.previewCtx.canvas.width,i.previewCtx.canvas.height)
            i.draw(i.previewCtx)
        }
    }



    if (selectedTool) {
        var tG = toolGuides[selectedTool]
        tG.draw(ctx, tG.controlPoints)
        if (selectedMode == "select") {
            drawControlPoints(ctx, tG.controlPoints)
        }
    }

    if (selectedMode == "select") {
        for (let i of currentPart.paths) {
            ctx.strokeStyle = i.style.colour
            ctx.strokeStyle = invertColor(ctx.strokeStyle)
            ctx.fillStyle = ""
            ctx.lineWidth = 2
            drawControlPoints(ctx, i.controlPoints)
        }
    }


    ctx.lineWidth = 2
    ctx.strokeStyle = "red"

    ctx.beginPath()
    ctx.fillStyle = "red"
    ctx.ellipse(mousePos.x, mousePos.y, 3, 3, 0, 0, 360)
    ctx.fill()

    ctx.stroke()


    ctx.fillStyle = "black"

    ctx.strokeStyle = "black"


    ctx.beginPath()
    ctx.ellipse(pointerPos.x, pointerPos.y, 2, 2, 0, 0, 360)
    ctx.fill()

    ctx.stroke()


    lastMousePos.x = mousePos.x
    lastMousePos.y = mousePos.y
    requestAnimationFrame(render)
}





c.addEventListener("mousemove", (self, e) => {
    var  ev = e as MouseEvent
    pointerPos.x = ev.clientX
    pointerPos.y = ev.clientY
    if (mouseDown) {
        if (selectedMode == "move") {
            
            posInWorld.x = (mouseDownPos.x - zoomFactor * pointerPos.x)
            posInWorld.y = (mouseDownPos.y - zoomFactor * pointerPos.y)
            console.log(mouseDownPos, viewportToWorld(mousePos), pointerPos, posInWorld)
            yOffset.setValue(String(posInWorld.y)).applyLastChange()
            xOffset.setValue(String(posInWorld.x)).applyLastChange()
        
        } else if (selectedMode == "draw") {
            if (selectedTool) {
                toolGuides[selectedTool].handleDraw(toolGuides[selectedTool].controlPoints)

            } else {
                shapeGenerators[selectedShape].handleDraw(shapeGenerators[selectedShape].controlPoints)

            }
        }
    }
})

c.addEventListener("touchmove", (self, e) => {
    var  ev = e as TouchEvent
    pointerPos.x = ev.touches[0].clientX
    pointerPos.y = ev.touches[0].clientY
    if (mouseDown) {
        if (selectedMode == "move") {
            posInWorld.x = mouseDownPos.x - mousePos.x
            posInWorld.y = mouseDownPos.y - mousePos.y
            console.log(mouseDownPos, mousePos, posInWorld)
            yOffset.setValue(String(posInWorld.y)).applyLastChange()
            xOffset.setValue(String(posInWorld.x)).applyLastChange()
        
        } else if (selectedMode == "draw") {
            toolGuides[selectedTool].handleDraw(toolGuides[selectedTool].controlPoints)
        }
    }
})

const resizeObserver = new ResizeObserver(()=>{
    c.setAttribute("width", `${c.htmlNode.clientWidth}`)
    c.setAttribute("height", `${c.htmlNode.clientHeight}`)
    c.lightRerender()
})






export var currentPart = new Part()
parts.push(currentPart)
collisionGroups[0].addPart(currentPart)






var xCoordReadout = new kleinTextNode("0")
var yCoordReadout = new kleinTextNode("0")

var xOffset = new textInput().setValue(String(posInWorld.x)).addEventListener("change", ()=> {
    posInWorld.x = parseFloat(xOffset.htmlNode.value)
})
var yOffset = new textInput().setValue(String(posInWorld.y)).addEventListener("change", ()=> {
    posInWorld.y = parseFloat(yOffset.htmlNode.value)
})


const hrStyles = new styleGroup([
    [".hr", `
        width: 70%;
        height: 1px;
        background-color: rgb(153,153,153);
        margin: 0.2em 0;    
    `]
], "hr")

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
], "part-list-container")



export var partList = new container(
    ...parts.map((p)=>
        p.listNode.addEventListener("click", ()=>{selectPart(p)})
    )
).addClass("list")

export var partConfigs = menuList(
    "Part",
    parts.map((p)=>
        p.configNode
    )
).addStyle("width: 100%;")


export function createPart(): Part {
    
    var newPart = new Part()
    parts.push(newPart)
    partList.addChildren(
        newPart.listNode.addEventListener("click", ()=>{selectPart(newPart)})
    )
    partList.lightRerender()
    partConfigs.addChildren(
        newPart.configNode
    )
    
    partConfigs.lightRerender()
    collisionGroups[0].addPart(newPart)

    selectPart(newPart)
    return newPart
    
}

export function deletePart(p: Part) {
    
    setParts(parts.splice(parts.indexOf(p)))
    partList.removeChild(p.listNode)
    partList.lightRerender()
    partConfigs.removeChild(
        p.configNode
    )
    
    partConfigs.lightRerender()
    collisionGroups[0].removePart(p)

    selectPart(parts[parts.length-1])
    
}

export function deleteAllParts() {
    setParts([])
    partList.removeAllChildren()
    partList.lightRerender()
    partConfigs.removeAllChildren()
    partConfigs.lightRerender()
    collisionGroups[0].parts = []

}


export function selectPart(part: Part) {
    for (let i of parts) {
        i.listNode.removeClass("selected").applyLastChange()
        i.configNode.removeClass("visible").applyLastChange()
    }
    console.trace("selecting", part.name)
    part.listNode.addClass("selected").applyLastChange()
    part.configNode.addClass("visible").applyLastChange()
    
    currentPart = part
    for (let i of collisionGroups) {
        i.listener() // rerenders collision group lists
    }
}



export function menuList(title: string, items: kleinElementNode[]) {
    const dropIcon = new kleinTextNode("˅")
    return new container(
        new button(title,new container(dropIcon).addStyle("margin-left: auto;")).addEventListener("click", (self) => {
            if (self.hasClass("hidden")) {
                for (let i of self.parent!.children) {
                    if (i != self) {
                        i.addStyle("display: block;").applyLastChange()
                    }
                }
                self.removeClass("hidden").applyLastChange()
                dropIcon.content = "˅"
                dropIcon.rerender()
            } else {
                for (let i of self.parent!.children) {
                    if (i != self) {
                        i.addStyle("display: none;").applyLastChange()
                    }
                }
                self.addClass("hidden").applyLastChange()
                dropIcon.content = "˄"
                dropIcon.rerender()
            }
            
        }).addStyle("display: flex; padding: 0; border: none; background-color: transparent;"),
        ...items
    ).addStyle("display: flex; width: 100%; flex-direction: column; gap: 0.3em;")
}


let generalStyles = dynamicStyleGroup(()=>[
    ["*", `
        color: ${theme.textTheme.textColor};
    `]
], "general")

const app = new container(
    new container("x:", xCoordReadout," y:" ,yCoordReadout).addStyle("position: absolute; bottom: 0; right: 0;"),
    c.addStyle("width: 100%; height: 100%; cursor: none;"),
    new container(
        partConfigs,
        physicsConfig,
    ).addStyle(`
        position: absolute;
        right: 0;
        top: 0;
        margin: 0.3em;
        width: 13em;
        overflow: hidden;
    `),
    
    new container(
            new button("save").addToStyleGroup(buttonStyles).addEventListener("click", save), 
            new button("save as").addToStyleGroup(buttonStyles).addEventListener("click", saveAs),
            new button("open").addToStyleGroup(buttonStyles).addEventListener("click", openFile),
            menuList("Preferences", [
                menuList("style", [
                    menuList("grid", [
                        new button("width").addToStyleGroup(buttonStyles),

                    ])
                ]),
                menuList("themes", [
                    new button("dark").addToStyleGroup(buttonStyles).addEventListener("click", ()=>{
                        setTheme(darkTheme)
                    }),
                    new button("light").addToStyleGroup(buttonStyles).addEventListener("click", ()=>{
                        setTheme(lightTheme)
                    }),
                    new button("+").addToStyleGroup(buttonStyles),
                ])
            ]),
            new container().addToStyleGroup(hrStyles),
            new button("clear").addToStyleGroup(buttonStyles).addEventListener("click", ()=> {
                if (confirm("Are you sure you want to clear this part's paths?")) {
                    currentPart.paths = []

                }
                // ctx.stroke()
            }), 
            // new container().addToStyleGroup(hrStyles),
            menuList("Guides", Object.values(toolButtons)),
            // new container().addToStyleGroup(hrStyles),
            menuList("Shapes", Object.values(shapeButtons)),
            // new container().addToStyleGroup(hrStyles),
            menuList("Modes", Object.values(modeButtons)),
            menuList("Grid", [
                new container(
                    "Snap:",
                    new textInput().setAttribute("checked", "").setAttribute("type", "checkbox").addEventListener("change", (self)=>{
                        console.log(self.htmlNode.checked)
                        engageSnapping = self.htmlNode.checked
                        
                    }).addStyle("width: min-content; margin: none;"),
                    new textInput().setValue(snapDistance.toString()).setAttribute("type", "number").addEventListener("change", (self)=>{
                        snapDistance = parseInt(self.htmlNode.value)
                    }),
                ).addToStyleGroup(inputStyles).setAttribute("title", "Snap distance - threshold needed to snap cursor to point"),
                new container(
                    "Major:",
                    new textInput().setValue(gridMajorInterval.toString()).setAttribute("type", "number").addEventListener("change", (self)=>{
                        gridMajorInterval = parseInt(self.htmlNode.value)
                    }),
                ).addToStyleGroup(inputStyles).setAttribute("title", "Major grid interval - distance between major grid lines, measured in px"),
                new container(
                    "Minor:",
                    new textInput().setValue(gridMinorInterval.toString()).setAttribute("type", "number").addEventListener("change", (self)=>{
                        gridMinorInterval = parseInt(self.htmlNode.value)
                    }),
                ).addToStyleGroup(inputStyles).setAttribute("title", "Minor grid interval - distance between minor grid lines, measured in px"),
            ]),
            menuList("Parts", 
                [new container(
                    partList,
                    new button("+").addToStyleGroup(buttonStyles).addEventListener("click", createPart)
                ).addToStyleGroup(partListStyles)]
            )
            
    ).addStyle("display: flex; width: 5em; height: calc(100% - 0.6em); padding: 0.3em; position: absolute; top: 0; flex-direction: column; align-items: center; gap: 0.2em;"),
    new container(
        xOffset,
        yOffset
    )
    
   
).addToStyleGroup(generalStyles);


(async ()=>{
    var t = await get("theme")
    setTheme(t ? t : darkTheme)

    c.addStyle(`background-color: ${theme.gridTheme.bgColor};`)
    renderApp(app, document.getElementById("app")!)
selectPart(currentPart)


c.setAttribute("width", `${c.htmlNode.clientWidth}`)
c.setAttribute("height", `${c.htmlNode.clientHeight}`)
c.lightRerender()
resizeObserver.observe(c.htmlNode)

openPrev()
requestAnimationFrame(render)
})()

