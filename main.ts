import { button, canvas, container, textInput } from "kleinui/elements"
import { kleinTextNode, renderApp, styleGroup } from "kleinui"
import { keys } from "./keys"
import { drawGrid } from "./grid"



const controlSnapDistance = 10

export class Vec2 {
    x: number
    y: number
    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }
}

var posInWorld = new Vec2(100,0)
var zoomFactor = 1

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



const c = new canvas()
const ctx = c.getContext("2d")!


var mousePos = new Vec2(0,0)
var mouseDown = false


function near(a: number, b: number, distance: number) {
    return (a == b || (b-a < distance && a-b < distance))
}

ctx.strokeStyle = "red"

var defaultVec2 = new Vec2(0,0)

var draggingItems: Vec2[] = []

function drawControlPoints(ctx: CanvasRenderingContext2D, controlPoints: Vec2[][]) {
    for (let c of controlPoints) {
        for (let i of c) {
            ctx.beginPath()
            var vCoords = worldToViewport(i)
            ctx.ellipse(vCoords.x, vCoords.y, 3,3,0,0,360)
            ctx.stroke()
            if (mouseDown && selectedMode == "select") {
                if (near(mousePos.x, vCoords.x, controlSnapDistance ) && near(mousePos.y, vCoords.y, controlSnapDistance )) {
                    
                    draggingItems.push(i)
                    

                }
                if (draggingItems.includes(i)) {
                    if (i == c[0] && c.length > 1) {
                        var yOffsetToOtherControlPoint = i.y - c[1].y
                        var xOffsetToOtherControlPoint = i.x - c[1].x
                        var newI = viewportToWorld(mousePos)
                        i.x = newI.x
                        i.y = newI.y
                        var newNeighbour = viewportToWorld(new Vec2(mousePos.x - xOffsetToOtherControlPoint, mousePos.y - yOffsetToOtherControlPoint))
                        c[1].x = newNeighbour.x
                        c[1].y = newNeighbour.y
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

var mouseDownPos = new Vec2(0,0)
c.addEventListener("mousedown", ()=>{
    mouseDown = true
    mouseDownPos = viewportToWorld(mousePos)
})
document.addEventListener("mouseup", ()=>{
    mouseDown = false
    draggingItems = []
})

document.addEventListener("keydown", (e)=>{
    if (e.key == "d") {
        selectMode("draw")
    }
    if (e.key == "s") {
        selectMode("select")
    }
})

var lastMousePos = new Vec2(0,0)


function render() {
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height)

    drawGrid(ctx, 10)
    ctx.strokeStyle = "grey"
    
    

    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(mousePos.x, mousePos.y, 2, 2, 0, 0, 360)
    ctx.stroke()

    var worldMousePos = viewportToWorld(mousePos)
    xCoordReadout.content = `${worldMousePos.x}`
    xCoordReadout.rerender()
    yCoordReadout.content = `${worldMousePos.y}`
    yCoordReadout.rerender()
    ctx.lineWidth = 1

    if (selectedTool) {
        var tG = toolGuides[selectedTool]
        tG.draw(ctx, tG.controlPoints)
    }
    lastMousePos.x = mousePos.x
    lastMousePos.y = mousePos.y
    requestAnimationFrame(render)
}

requestAnimationFrame(render)

c.addEventListener("mousemove", (self, e) => {
    var  ev = e as MouseEvent
    mousePos.x = ev.clientX
    mousePos.y = ev.clientY
    if (mouseDown && selectedMode == "move") {
        posInWorld.x = mouseDownPos.x - mousePos.x
        posInWorld.y = mouseDownPos.y - mousePos.y
        console.log(mouseDownPos, mousePos, posInWorld)
        yOffset.setValue(String(posInWorld.y)).applyLastChange()
        xOffset.setValue(String(posInWorld.x)).applyLastChange()

    }
})

const resizeObserver = new ResizeObserver(()=>{
    c.setAttribute("width", `${c.htmlNode.clientWidth}`)
    c.setAttribute("height", `${c.htmlNode.clientHeight}`)
    c.lightRerender()
})

const buttonStyles = new styleGroup([
    [".btn", `
        background-color: white;
        border: 1px solid rgb(153,153,153);
        border-radius: 4px; 
        padding: 0.3em 0.4em;
    `],
    [".btn.selected", `
        background-color: rgb(220,220,220);    
    `]
], "btn")


const modeButtons = {
    select: new button("select").addClass("selected"),
    draw: new button("draw"),
    move: new button("move")
}

var selectedMode = "select"


for (let i of Object.entries(modeButtons)) {
    i[1].addToStyleGroup(buttonStyles).addEventListener("click", ()=>{
        selectMode(i[0])
    })
}

function selectMode(mode: string) {
    for (let i of Object.values(modeButtons)) {
        i.removeClass("selected").applyLastChange()
    }
    modeButtons[mode].addClass("selected").applyLastChange()
    selectedMode = mode
}

const toolButtons = {
    line: new button("line"),
    circle: new button("circle")
}




type toolGuide = {
    controlPoints: Vec2[][],
    draw: (ctx: CanvasRenderingContext2D, controlPoints: Vec2[][])=>void
}


var selectedTool: string 

const toolGuides = {
    line: {
        controlPoints: [[viewportToWorld(new Vec2(40,140))], [viewportToWorld(new Vec2(500,140))]],
        draw: (ctx, controlPoints)=>{
            ctx.beginPath()
            var vCoords = worldToViewport(controlPoints[0][0])
            var vCoords1 = worldToViewport(controlPoints[1][0])

            ctx.moveTo(vCoords.x, vCoords.y)
            ctx.lineTo(vCoords1.x, vCoords1.y)
            ctx.stroke()
            drawControlPoints(ctx, controlPoints)
        }
    } as toolGuide,
    circle: {
        controlPoints: [[viewportToWorld(new Vec2(240,140)), viewportToWorld(new Vec2(400,140))]],
        draw: (ctx, controlPoints)=>{
            var vRadiusCoords = worldToViewport(controlPoints[0][1])

            var radius = Math.sqrt(Math.pow(controlPoints[0][0].x - controlPoints[0][1].x, 2) + Math.pow(controlPoints[0][0].y - controlPoints[0][1].y, 2))
            ctx.beginPath()
            var vCentreCoords = worldToViewport(controlPoints[0][0])
            ctx.ellipse(
                vCentreCoords.x,
                vCentreCoords.y,
                radius,
                radius,
                0,0,360
                
            )
            ctx.stroke()
            drawControlPoints(ctx, controlPoints)
        }
    } as toolGuide
}

for (let i of Object.entries(toolButtons)) {
    i[1].addToStyleGroup(buttonStyles).addEventListener("click", ()=>{
        selectTool(i[0])
    })
}

function selectTool(tool: string) {
    for (let i of Object.values(toolButtons)) {
        i.removeClass("selected").applyLastChange()
    }
    toolButtons[tool].addClass("selected").applyLastChange()
    toolGuides[tool].draw(ctx, toolGuides[tool].controlPoints)
    selectedTool = tool
}


var xCoordReadout = new kleinTextNode("0")
var yCoordReadout = new kleinTextNode("0")

var xOffset = new textInput().setValue(String(posInWorld.x)).addEventListener("change", ()=> {
    posInWorld.x = parseFloat(xOffset.htmlNode.value)
})
var yOffset = new textInput().setValue(String(posInWorld.y)).addEventListener("change", ()=> {
    posInWorld.y = parseFloat(yOffset.htmlNode.value)
})

const app = new container(
    new container("x:", xCoordReadout," y:" ,yCoordReadout).addStyle("position: absolute; top: 0; right: 0;"),
    c.addStyle("width: 100%; height: 100%; cursor: none;"),

    new container(
        new container(
            new button("clear").addToStyleGroup(buttonStyles).addEventListener("click", ()=> {
                ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height)
                // ctx.stroke()
            }), 
            ...Object.values(toolButtons)
        ).addStyle("display: flex; gap: 0.2em;"),
        new container(
            ...Object.values(modeButtons)
        ).addStyle("display: flex; gap: 0.2em;")
    ).addStyle("display: flex; flex-direction: column; gap: 0.2em;"),
    new container(
        xOffset,
        yOffset
    )
    
   
)

renderApp(app, document.getElementById("app")!)

c.setAttribute("width", `${c.htmlNode.clientWidth}`)
c.setAttribute("height", `${c.htmlNode.clientHeight}`)
c.lightRerender()
resizeObserver.observe(c.htmlNode)

