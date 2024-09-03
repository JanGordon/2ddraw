import { button, canvas, container } from "kleinui/elements"
import { kleinTextNode, renderApp, styleGroup } from "kleinui"
import { keys } from "./keys"
import { drawGrid } from "./grid"

const controlSnapDistance = 10

class Vec2 {
    x: number
    y: number
    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }
}


const c = new canvas()
const ctx = c.getContext("2d")!


var mouseX = 0
var mouseY = 0
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
            ctx.ellipse(i.x, i.y, 3,3,0,0,360)
            ctx.stroke()
            if (mouseDown && selectedMode == "select") {
                if (near(mouseX, i.x, controlSnapDistance ) && near(mouseY, i.y, controlSnapDistance )) {
                    
                    draggingItems.push(i)
                    

                }
                if (draggingItems.includes(i)) {
                    if (i == c[0] && c.length > 1) {
                        var yOffsetToOtherControlPoint = i.y - c[1].y
                        var xOffsetToOtherControlPoint = i.x - c[1].x
                        i.x = mouseX
                        i.y = mouseY
                        c[1].x = mouseX - xOffsetToOtherControlPoint
                        c[1].y = mouseY - yOffsetToOtherControlPoint
                    } else {
                        i.x = mouseX
                        i.y = mouseY
                    }
                }
            }
        }
        
    }
}
c.addEventListener("mousedown", ()=>{
    mouseDown = true
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

var lastMouseX = 0
var lastMouseY = 0

function render() {
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height)

    drawGrid(ctx, 10)
    ctx.strokeStyle = "grey"

    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(mouseX, mouseY, 2, 2, 0, 0, 360)
    ctx.stroke()
    xCoordReadout.content = `${mouseX}`
    xCoordReadout.rerender()
    yCoordReadout.content = `${mouseY}`
    yCoordReadout.rerender()
    ctx.lineWidth = 1

    if (selectedTool) {
        var tG = toolGuides[selectedTool]
        tG.draw(ctx, tG.controlPoints)
    }
    lastMouseX = mouseX
    lastMouseY = mouseY
    requestAnimationFrame(render)
}

requestAnimationFrame(render)

c.addEventListener("mousemove", (self, e) => {
    var  ev = e as MouseEvent
    mouseX = ev.clientX
    mouseY = ev.clientY
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
    draw: new button("draw")
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
        controlPoints: [[new Vec2(40,140)], [new Vec2(500,140)]],
        draw: (ctx, controlPoints)=>{
            ctx.beginPath()
            ctx.moveTo(controlPoints[0][0].x, controlPoints[0][0].y)
            ctx.lineTo(controlPoints[1][0].x, controlPoints[1][0].y)
            ctx.stroke()
            drawControlPoints(ctx, controlPoints)
        }
    } as toolGuide,
    circle: {
        controlPoints: [[new Vec2(240,140), new Vec2(400,140)]],
        draw: (ctx, controlPoints)=>{
            var radius = Math.sqrt(Math.pow(controlPoints[0][0].x - controlPoints[0][1].x, 2) + Math.pow(controlPoints[0][0].y - controlPoints[0][1].y, 2))
            ctx.beginPath()
            ctx.ellipse(
                controlPoints[0][0].x,
                controlPoints[0][0].y,
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
    ).addStyle("display: flex; flex-direction: column; gap: 0.2em;")
    
   
)

renderApp(app, document.getElementById("app")!)

c.setAttribute("width", `${c.htmlNode.clientWidth}`)
c.setAttribute("height", `${c.htmlNode.clientHeight}`)
c.lightRerender()
resizeObserver.observe(c.htmlNode)

