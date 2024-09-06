import { button } from "kleinui/elements"
import { registerKeybind } from "./keys"
import { viewportToWorld, mousePos, currentPart, c } from "./main"
import { buttonStyles } from "./styles"
import { linePath, ellipticalPath } from "./part"
import { Vec2 } from "./vec"
import { selectedTool, setSelectedTool, toolButtons } from "./guides"

export const shapeButtons = {
    line: new button("line").setAttribute("title", "line (w)").addClass("selected"),
    circle: new button("circle").setAttribute("title", "circle (e)"),
    rectangle: new button("rectangle").setAttribute("title", "rectangle (r)")
}

type shapeGenerator = {
    handleDraw: (controlPoints: Vec2[][])=>void,
    handleStartDraw: (controlPoints: Vec2[][])=>void
}

export const shapeGenerators = {
    line: {
        handleStartDraw: (controlPoints)=>{
            var p = new linePath()
            p.controlPoints[0][0] = viewportToWorld(mousePos)

            p.controlPoints[1][0] = new Vec2(p.start.x ,p.start.y)
            currentPart.paths.push(p)
        },
        handleDraw: (controlPoints)=>{
            var c = currentPart.currentPath as linePath
            c.controlPoints[1][0] = viewportToWorld(mousePos)
  
        }
        
    } as shapeGenerator,
    circle: {
        centerControlPoints: (self)=>{
            self.controlPoints = [[viewportToWorld(new Vec2(c.htmlNode.width/2,c.htmlNode.height/2)), viewportToWorld(new Vec2(c.htmlNode.width/2+100,c.htmlNode.height/2))]]
        },
        handleStartDraw: (controlPoints)=>{
            var p = new ellipticalPath()
            console.log(controlPoints)
            p.controlPoints[0][0] = viewportToWorld(mousePos)
            p.controlPoints[0][1] = viewportToWorld(mousePos)
            p.controlPoints[1][0] = p.controlPoints[0][1]
            p.controlPoints[2][0] = p.controlPoints[0][1]

            currentPart.paths.push(p)
        },
        handleDraw: (controlPoints)=>{
            var p = currentPart.currentPath as ellipticalPath
            p.controlPoints[0][1] = viewportToWorld(mousePos)

        }
    } as shapeGenerator,
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

export var selectedShape = ""


console.log(buttonStyles)
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
    setSelectedTool("")
    selectedShape = shape
}

export function setSelectedShape(shape: string) {
    selectedShape = shape
}