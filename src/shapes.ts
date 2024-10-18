import { button, container, textInput } from "kleinui/elements"
import { registerKeybind } from "./keys"
import { viewportToWorld, mousePos, currentPart, c } from "./main"
import { buttonStyles, inputStyles } from "./styles"
import { linePath, ellipticalPath, ngonPath } from "./part"
import { Vec2 } from "./vec"
import { selectedTool, setSelectedTool, toolButtons } from "./guides"

var ngonSides = 3

export const shapeButtons = {
    line: new button("line").setAttribute("title", "line (w)").addClass("selected"),
    circle: new button("circle").setAttribute("title", "circle (e)"),
    rectangle: new button("rectangle").setAttribute("title", "rectangle (r)"),
    ngon: new container(
        "n-agon:",
        new textInput().setValue("3").setAttribute("type", "number").addEventListener("change", (self)=>{
            ngonSides = parseInt(self.htmlNode.value)
        }),
    ).addToStyleGroup(inputStyles).setAttribute("title", "Minor grid interval - distance between minor grid lines, measured in px")
}

type shapeGenerator = {
    handleDraw: (controlPoints: Vec2[][])=>void,
    handleStartDraw: (controlPoints: Vec2[][])=>void
}

export const shapeGenerators = {
    line: {
        handleStartDraw: (controlPoints)=>{
            var p = new linePath()
            p.controlPoints[0][0] = currentPart.viewportToPart(mousePos)

            p.controlPoints[1][0] = new Vec2(p.start.x ,p.start.y)
            currentPart.addPath(p)
        },
        handleDraw: (controlPoints)=>{
            var c = currentPart.currentPath as linePath
            c.controlPoints[1][0] = currentPart.viewportToPart(mousePos)
  
        }
        
    } as shapeGenerator,
    circle: {
        centerControlPoints: (self)=>{
            self.controlPoints = [[currentPart.viewportToPart(new Vec2(c.htmlNode.width/2,c.htmlNode.height/2)), currentPart.viewportToPart(new Vec2(c.htmlNode.width/2+100,c.htmlNode.height/2))]]
        },
        handleStartDraw: (controlPoints)=>{
            var p = new ellipticalPath()
            console.log(controlPoints)
            p.controlPoints[0][0] = currentPart.viewportToPart(mousePos)
            p.controlPoints[0][1] = currentPart.viewportToPart(mousePos)
            p.controlPoints[1][0] = p.controlPoints[0][1]
            p.controlPoints[2][0] = p.controlPoints[0][1]

            currentPart.addPath(p)
        },
        handleDraw: (controlPoints)=>{
            var p = currentPart.currentPath as ellipticalPath
            p.controlPoints[0][1] = currentPart.viewportToPart(mousePos)

        },
        
    } as shapeGenerator,
    ngon: {
        handleStartDraw: (controlPoints)=>{
            var p = new ngonPath()
            p.controlPoints[0][0] = currentPart.viewportToPart(mousePos)
            console.log(`center: X:${p.controlPoints[0][0].x} Y:${p.controlPoints[0][0].y}`)
            var radius = 20
            for (let i = 0; i < ngonSides; i++) {
                var a = 360 / ngonSides * i
                p.controlPoints[0][i+1] = new Vec2(0,0)
                p.controlPoints[0][i+1].x = Math.sin(a * (Math.PI/180)) * radius + p.controlPoints[0][0].x
                p.controlPoints[0][i+1].y = Math.cos(a * (Math.PI/180)) * radius + p.controlPoints[0][0].y
            }
            
            currentPart.addPath(p)
        },
        handleDraw: (controlPoints)=>{
            var c = currentPart.currentPath as ngonPath
            c.controlPoints[0][1] = currentPart.viewportToPart(mousePos)
            var radius = Math.sqrt(Math.pow(c.controlPoints[0][0].x - c.controlPoints[0][1].x, 2) + Math.pow(c.controlPoints[0][0].y - c.controlPoints[0][1].y, 2))
            console.log(radius)
            for (let i = 0; i < ngonSides; i++) {
                var a = 360 / ngonSides * i
                c.controlPoints[0][i+1].x = Math.sin(a * (Math.PI/180)) * radius + c.controlPoints[0][0].x
                c.controlPoints[0][i+1].y = Math.cos(a * (Math.PI/180)) * radius + c.controlPoints[0][0].y
            }
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
        console.log("selecting", i[0])
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