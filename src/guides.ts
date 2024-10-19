import { button } from "kleinui/elements";
import { registerKeybind } from "./keys";
import { viewportToWorld, currentPart, mousePos, worldToViewport, mouseDownPos, c, ctx, zoomFactor } from "./main";
import { buttonStyles } from "./styles"
import { Path, freePath, linePath, ellipticalPath } from "./part";
import { near2d, Vec2 } from "./vec";
import { setSelectedShape, shapeButtons } from "./shapes";

export var selectedTool: string = "free" 

const freehandSegmentLength = 3
var currentPath: Path;


export const toolButtons = {
    free: new button("free").setAttribute("title", "free (g)").addClass("selected"),
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


function closestPointOnLine(lineStart: Vec2, lineEnd: Vec2) {

    var mousePosWorld = viewportToWorld(mousePos)
    // Calculate the vector from lineStart to lineEnd
    const lineVector = new Vec2(lineEnd.x - lineStart.x, lineEnd.y - lineStart.y)

    // Calculate the vector from lineStart to the cursor
    const cursorVector = new Vec2(mousePosWorld.x - lineStart.x, mousePosWorld.y - lineStart.y)

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


type toolGuide = {
    controlPoints: Vec2[][],
    draw: (ctx: CanvasRenderingContext2D, controlPoints: Vec2[][])=>void
    centerControlPoints: (self: toolGuide)=>void,
    handleDraw: (controlPoints: Vec2[][])=>void,
    handleStartDraw: (controlPoints: Vec2[][])=>void
}

export const toolGuides = {
    free: {
        controlPoints: [],
        draw: (c,d)=>{},
        centerControlPoints: ()=>{},
        handleStartDraw: ()=>{
            var p = new freePath()
            p.controlPoints = [[viewportToWorld(mousePos)]]
            currentPart.addPath(p)
            currentPath = p
            console.log(currentPath)
        },
        handleDraw: ()=>{
            var lastSegment = currentPath.controlPoints[currentPath.controlPoints.length-1][0]
            console.log(lastSegment)
            if (near2d(mousePos, lastSegment, freehandSegmentLength)) {
                // wait and dont update last segment 
            } else {
                (currentPath as freePath).controlPoints.push([viewportToWorld(mousePos)])
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
            currentPart.addPath(p)
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
            currentPart.addPath(p)
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
    setSelectedShape("")

}

export function setSelectedTool(tool: string) {
    selectedTool = tool
}