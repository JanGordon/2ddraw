import { button, canvas, container, textInput } from "kleinui/elements"
import { kleinTextNode, renderApp, styleGroup } from "kleinui"
import { keys, registerKeybind } from "./keys"
import { drawGrid } from "./grid"
import { ellipticalPath, freePath, linePath, Part, Path } from "./part"



const controlSnapDistance = 10

var gridMinorInterval = 20
var gridMajorInterval = 100

export class Vec2 {
    x: number
    y: number
    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }
}

var posInWorld = new Vec2(0,0)
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

ctx.lineCap = "round"

var pointerPos = new Vec2(0,0) // specifically position of pointer ignoring snapping
export var mousePos = new Vec2(0,0) // mouse position including snapping
var mouseDown = false


function near(a: number, b: number, distance: number) {
    return (a == b || (b-a < distance && a-b < distance))
}

function near2d(a: Vec2, b: Vec2, distance: number) {
    // update to pythaggoras
    return near(a.x, b.x, distance) && near(a.y, b.y, distance)
}

function distance(a: Vec2, b: Vec2) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
}

function angle(v1: Vec2, v2: Vec2): number {
    // Calculate the dot product of the two vectors
    const dotProduct = v1.x * v2.x + v1.y * v2.y;

    // Calculate the magnitudes of the two vectors
    const magnitudeV1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const magnitudeV2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    // Calculate the cosine of the angle between the vectors
    const cosTheta = dotProduct / (magnitudeV1 * magnitudeV2);

    // Calculate the angle in radians
    const angleRadians = Math.acos(cosTheta);

    // Convert the angle to degrees (optional)
    const angleDegrees = angleRadians * 180 / Math.PI;

    return angleDegrees; // Or return angleRadians if you prefer
}

function closestPointOnLine(lineStart: Vec2, lineEnd: Vec2) {
    // Calculate the vector from lineStart to lineEnd
    const lineVector = new Vec2(lineEnd.x - lineStart.x, lineEnd.y - lineStart.y)

    // Calculate the vector from lineStart to the cursor
    const cursorVector = new Vec2(mousePos.x - lineStart.x, mousePos.y - lineStart.y)

    // Calculate the dot product of the two vectors
    const dotProduct = lineVector.x * cursorVector.x + lineVector.y * cursorVector.y;

    // Calculate the magnitude squared of the line vector
    const lineMagnitudeSquared = lineVector.x * lineVector.x + lineVector.y * lineVector.y;

    // Calculate the parameter t
    const t = dotProduct / lineMagnitudeSquared;

    // Clamp t to the range [0, 1] to ensure the closest point is on the line segment
    const clampedT = Math.max(0, Math.min(1, t));

    return new Vec2(lineStart.x + clampedT * lineVector.x, lineStart.y + clampedT * lineVector.y)
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
c.addEventListener("pointerdown", ()=>{
    mouseDownPos = viewportToWorld(mousePos)
    if (selectedMode == "draw") {
        if (selectedTool) {
            toolGuides[selectedTool].handleStartDraw(toolGuides[selectedTool].controlPoints)

        } else {
            console.log(shapeGenerators)
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

var engageSnapping = false
var snapToIntersections = false
var snapDistance = 7

function checkSnapPoints(): Vec2 {
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
    

    
    return pointerPos
}

function render() {

    var newMousePos = checkSnapPoints()
    mousePos.x = newMousePos.x
    mousePos.y = newMousePos.y
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height)

    drawGrid(ctx, posInWorld, gridMinorInterval, gridMajorInterval)
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
        if (selectedMode == "select") {
            drawControlPoints(ctx, tG.controlPoints)
        }
    }

    if (selectedMode == "select") {
        for (let i of currentPart.paths) {
            drawControlPoints(ctx, i.controlPoints)
        }
    }
    currentPart.draw(ctx)
    lastMousePos.x = mousePos.x
    lastMousePos.y = mousePos.y
    requestAnimationFrame(render)
}

requestAnimationFrame(render)



c.addEventListener("mousemove", (self, e) => {
    var  ev = e as MouseEvent
    pointerPos.x = ev.clientX
    pointerPos.y = ev.clientY
    if (mouseDown) {
        if (selectedMode == "move") {
            posInWorld.x = mouseDownPos.x - mousePos.x
            posInWorld.y = mouseDownPos.y - mousePos.y
            console.log(mouseDownPos, mousePos, posInWorld)
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

const buttonStyles = new styleGroup([
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
], "btn")


const modeButtons = {
    select: new button("select").setAttribute("title", "select (s)").addClass("selected"),
    draw: new button("draw").setAttribute("title", "draw (d)"),
    move: new button("move").setAttribute("title", "move (f)")
}

registerKeybind("s", ()=>{
    selectMode("select")
})
registerKeybind("d", ()=>{
    selectMode("draw")
})
registerKeybind("f", ()=>{
    selectMode("move")
})

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

const shapeButtons = {
    line: new button("line").setAttribute("title", "line (w)").addClass("selected"),
    circle: new button("circle").setAttribute("title", "circle (e)"),
    rectangle: new button("rectangle").setAttribute("title", "rectangle (r)")
}

type shapeGenerator = {
    handleDraw: (controlPoints: Vec2[][])=>void,
    handleStartDraw: (controlPoints: Vec2[][])=>void
}

const shapeGenerators = {
    line: {
        handleStartDraw: (controlPoints)=>{
            var p = new linePath()
            p.controlPoints[0][0] = new Vec2(mousePos.x, mousePos.y)

            p.controlPoints[1][0] = new Vec2(p.start.x ,p.start.y)
            currentPart.paths.push(p)
            currentPath = p
            console.log(currentPath)
        },
        handleDraw: (controlPoints)=>{
            var c = currentPath as linePath
            c.controlPoints[1][0].x = mousePos.x 
            c.controlPoints[1][0].y = mousePos.y
  
        }
        
    } as shapeGenerator,
    circle: {
        centerControlPoints: (self)=>{
            self.controlPoints = [[viewportToWorld(new Vec2(c.htmlNode.width/2,c.htmlNode.height/2)), viewportToWorld(new Vec2(c.htmlNode.width/2+100,c.htmlNode.height/2))]]
        },
        draw: (ctx, controlPoints)=>{

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
        },
        handleStartDraw: (controlPoints)=>{
            var p = new ellipticalPath()
            console.log(controlPoints)
            p.controlPoints[0][0] = new Vec2(mousePos.x, mousePos.y)
            p.controlPoints[0][1] = new Vec2(mousePos.x, mousePos.y)
            p.controlPoints[1][0] = p.controlPoints[0][1]
            p.controlPoints[2][0] = p.controlPoints[0][1]

            currentPart.paths.push(p)
            currentPath = p
            console.log(currentPath)
        },
        handleDraw: (controlPoints)=>{
            var p = currentPath as ellipticalPath
            p.controlPoints[0][1] = new Vec2(mousePos.x, mousePos.y)

        }
    } as toolGuide,
}

registerKeybind("w", ()=>{
    selectShape("line")
})
registerKeybind("e", ()=>{
    selectShape("circle")
})
registerKeybind("r", ()=>{
    selectShape("rectangle")
})

var selectedShape = ""


for (let i of Object.entries(shapeButtons)) {
    i[1].addToStyleGroup(buttonStyles).addEventListener("click", ()=>{
        selectShape(i[0])
    })
}

function selectShape(shape: string) {
    for (let i of Object.values(shapeButtons)) {
        i.removeClass("selected").applyLastChange()
    }
    for (let i of Object.values(toolButtons)) {
        i.removeClass("selected").applyLastChange()
    }
    shapeButtons[shape].addClass("selected").applyLastChange()
    selectedTool = ""
    selectedShape = shape
}



const toolButtons = {
    free: new button("free").setAttribute("title", "free (g)"),
    line: new button("line").setAttribute("title", "line (v)"),
    circle: new button("circle").setAttribute("title", "circle (c)")
}

registerKeybind("v", ()=>{
    selectTool("line")
})
registerKeybind("c", ()=>{
    selectTool("circle")
})
registerKeybind("g", ()=>{
    selectTool("free")
})




type toolGuide = {
    controlPoints: Vec2[][],
    draw: (ctx: CanvasRenderingContext2D, controlPoints: Vec2[][])=>void
    centerControlPoints: (self: toolGuide)=>void,
    handleDraw: (controlPoints: Vec2[][])=>void,
    handleStartDraw: (controlPoints: Vec2[][])=>void
}

var currentPart = new Part()



var selectedTool: string 

const freehandSegmentLength = 3
var currentPath: Path;

const toolGuides = {
    free: {
        controlPoints: [],
        draw: (c,d)=>{},
        centerControlPoints: ()=>{},
        handleStartDraw: ()=>{
            var p = new freePath()
            p.controlPoints = [[new Vec2(mouseDownPos.x, mouseDownPos.y)]]
            currentPart.paths.push(p)
            currentPath = p
            console.log(currentPath)
        },
        handleDraw: ()=>{
            var lastSegment = currentPath.controlPoints[currentPath.controlPoints.length-1][0]
            console.log(lastSegment)
            if (near2d(mousePos, lastSegment, freehandSegmentLength)) {
                // wait and dont update last segment 
            } else {
                (currentPath as freePath).controlPoints.push([new Vec2(mousePos.x, mousePos.y)])
            }
        }
    } as toolGuide,
    line: {
        centerControlPoints: (self)=>{
            self.controlPoints = [[viewportToWorld(new Vec2(c.htmlNode.width/2-50,c.htmlNode.height/2))], [viewportToWorld(new Vec2(c.htmlNode.width/2+50,c.htmlNode.height/2))]]
        },
        draw: (ctx, controlPoints)=>{
            ctx.beginPath()
            var vCoords = worldToViewport(controlPoints[0][0])
            var vCoords1 = worldToViewport(controlPoints[1][0])

            ctx.moveTo(vCoords.x, vCoords.y)
            ctx.lineTo(vCoords1.x, vCoords1.y)
            ctx.stroke()
        },
        handleStartDraw: (controlPoints)=>{
            var p = new linePath()
            p.controlPoints[0][0] = closestPointOnLine(controlPoints[0][0], controlPoints[1][0])
            p.controlPoints[1][0] = new Vec2(p.start.x ,p.start.y)
            currentPart.paths.push(p)
            currentPath = p
            console.log(currentPath)
        },
        handleDraw: (controlPoints)=>{
            currentPath.controlPoints[1][0] = closestPointOnLine(controlPoints[0][0], controlPoints[1][0])
            
        }
        
    } as toolGuide,
    circle: {
        centerControlPoints: (self)=>{
            self.controlPoints = [[viewportToWorld(new Vec2(c.htmlNode.width/2,c.htmlNode.height/2)), viewportToWorld(new Vec2(c.htmlNode.width/2+100,c.htmlNode.height/2))]]
        },
        draw: (ctx, controlPoints)=>{

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
        },
        handleStartDraw: (controlPoints)=>{
            var p = new ellipticalPath()
            console.log(controlPoints)
            p.controlPoints[0] = [controlPoints[0][0], controlPoints[0][1]]
            p.controlPoints[1][0] = new Vec2(mousePos.x, mousePos.y)
            p.controlPoints[1][0] = new Vec2(mousePos.x, mousePos.y)
            p.controlPoints[2][0] = new Vec2(mousePos.x, mousePos.y)
            currentPart.paths.push(p)
            currentPath = p
            console.log(currentPath)
        },
        handleDraw: (controlPoints)=>{
            var p = currentPath as ellipticalPath
            p.controlPoints[2][0] = new Vec2(mousePos.x, mousePos.y)
        }
    } as toolGuide,
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
    for (let i of Object.values(shapeButtons)) {
        i.removeClass("selected").applyLastChange()
    }
    toolGuides[tool].centerControlPoints(toolGuides[tool])
    toolButtons[tool].addClass("selected").applyLastChange()
    toolGuides[tool].draw(ctx, toolGuides[tool].controlPoints)
    selectedTool = tool
    selectedShape = ""

}


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

const app = new container(
    new container("x:", xCoordReadout," y:" ,yCoordReadout).addStyle("position: absolute; top: 0; right: 0;"),
    c.addStyle("width: 100%; height: 100%; cursor: none;"),

    new container(
            new button("clear").addToStyleGroup(buttonStyles).addEventListener("click", ()=> {
                ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height)
                // ctx.stroke()
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
    
   
)

renderApp(app, document.getElementById("app")!)

c.setAttribute("width", `${c.htmlNode.clientWidth}`)
c.setAttribute("height", `${c.htmlNode.clientHeight}`)
c.lightRerender()
resizeObserver.observe(c.htmlNode)

