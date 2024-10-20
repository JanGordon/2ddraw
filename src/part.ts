import { button, canvas, container, header1, header2, listItem, textInput, unorderedList } from "kleinui/elements"
import { currentPart, menuList, mousePos, selectPart, viewportToWorld, worldToViewport, zoomFactor } from "./main"
import { Vec2 } from "./vec"
import { kleinTextNode, styleGroup } from "kleinui"
import { collisionGroups } from "./physics"
import { buttonStyles, pathBtnStyles } from "./styles"
import { rigidbody } from "./rigidbody"
import { theme } from "./preferences"
import { rerender } from "./rerender"


var previousStyle = {
    colour: "black",
    width: 10,
}

export type pathStyle = typeof previousStyle


function setPathStyle(ctx: CanvasRenderingContext2D, style: pathStyle) {
    ctx.strokeStyle = style.colour
    ctx.lineWidth = style.width / zoomFactor
    previousStyle = style
}


export interface Path {
    name: string
    style: pathStyle
    controlPoints: Vec2[][] 
    draw(ctx: CanvasRenderingContext2D, p: Part): void
}


export class ellipticalPath implements Path {
    name = "ellipse"
    style = {...previousStyle}
    controlPoints: Vec2[][] = [[], [], []]
    get center() {
        return this.controlPoints[0][0]
    }
    get radius() {
        return Math.sqrt(Math.pow(this.controlPoints[0][0].x - this.controlPoints[0][1].x, 2) + Math.pow(this.controlPoints[0][0].y - this.controlPoints[0][1].y, 2))
    }
    get startAngle() {
        return 0
        return Math.atan((this.controlPoints[1][0].x-this.controlPoints[0][0].x)/(this.controlPoints[1][0].y+this.controlPoints[0][0].y)) * (180/Math.PI)
    }
    get endAngle() {
        return 360
        return Math.atan((this.controlPoints[2][0].x-this.controlPoints[0][0].x)/(this.controlPoints[2][0].y+this.controlPoints[0][0].y)) * (180/Math.PI)
    }
    draw(ctx: CanvasRenderingContext2D, p: Part) {
        setPathStyle(ctx, this.style)
        ctx.beginPath()
        var cViewport = p.partToViewport(this.center)
        ctx.ellipse(cViewport.x, cViewport.y, this.radius, this.radius, 0, this.startAngle, this.endAngle)
        ctx.stroke()
    }
}

export class freePath implements Path {
    name = "free"
    style = {...previousStyle}
    controlPoints: Vec2[][] = [[]]
    draw(ctx: CanvasRenderingContext2D, p: Part) {
        setPathStyle(ctx, this.style)
        ctx.lineJoin = "round"
        ctx.lineCap = "round"
        ctx.beginPath()
        var vStart = p.partToViewport(this.controlPoints[0][0])
        ctx.moveTo(vStart.x, vStart.y)
        for (let s = 0; s < this.controlPoints.length; s++) {
            var vEnd = p.partToViewport(this.controlPoints[s][0])
            
            ctx.lineTo(vEnd.x, vEnd.y)
        }
        ctx.stroke()
        
    }
}

export class linePath implements Path {
    name = "line"
    style = {...previousStyle}
    controlPoints: Vec2[][] = [[],[]]
    get start() {
        return this.controlPoints[0][0]
    }
    get end() {
        return this.controlPoints[1][0]
    }
    draw(ctx: CanvasRenderingContext2D, p: Part) {
        setPathStyle(ctx, this.style)

        ctx.beginPath()
        var vStart = p.partToViewport(this.start)
        var vEnd = p.partToViewport(this.end)
        ctx.moveTo(vStart.x, vStart.y)
        ctx.lineTo(vEnd.x, vEnd.y)
        ctx.stroke()
        
    }
}

export class ngonPath implements Path {
    name = "ngon"
    style = {...previousStyle}
    controlPoints: Vec2[][] = [[]]
    draw(ctx: CanvasRenderingContext2D, p: Part) {
        setPathStyle(ctx, this.style)

        ctx.beginPath()
        for (let i = 2; i < this.controlPoints[0].length; i++) {
            var vStart = p.partToViewport(this.controlPoints[0][i-1])
            var vEnd = p.partToViewport(this.controlPoints[0][i])
            ctx.moveTo(vStart.x, vStart.y)
            ctx.lineTo(vEnd.x, vEnd.y)
        }
        var vStart = p.partToViewport(this.controlPoints[0][this.controlPoints[0].length-1])
        var vEnd = p.partToViewport(this.controlPoints[0][1])
        ctx.moveTo(vStart.x, vStart.y)
        ctx.lineTo(vEnd.x, vEnd.y)
        
        ctx.stroke()
        
    }
}


export var pathMap = new Map<string, ()=>Path>([
    ["free", ()=>new freePath()],
    ["elliptical", ()=>new ellipticalPath()],
    ["line", ()=>new linePath()],
    ["ngon", ()=>new ngonPath()],
])



export function setParts(ps: Part[]) {
    parts = ps
}
export var parts: Part[] = []

const visiblityStyles = new styleGroup([
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
], "vis")

const configStyles = new styleGroup([
    [".config.visible", `
        display: flex;
        flex-direction: column;
    `],
    [".config", `
        display: none;
    `]
], "config")

// we need to draw and store coordinates for paths in relative to part




export class Part {
    pos: Vec2 = viewportToWorld(new Vec2(0,0)) // position that part is drawn in (world space)
    startPos: Vec2 = viewportToWorld(new Vec2(0,0)) // starting position that part is drawn in (world space)
    rigidbody: rigidbody = new rigidbody(this)
    paths: Path[] = []

    get currentPath() {
        return this.paths[this.paths.length -1]
    }
    _name: string = "Part"
    get name() {
        return this._name
    }
    set name(s: string) {
        this._name = s;
        (this.listNode.children[0] as kleinTextNode).content = s
        this.listNode.children[0].rerender()
    }

    previewCtx: CanvasRenderingContext2D
    collisionGroupsNode: container
    pathListNode: container = new container()

    pathConfigContainer = new container()

    selectedPath: Path


    pathConfig() {
        if (this.selectedPath) {
            return new container(
                new container("Colour: ", new textInput().setAttribute("type", "color").setValue(this.selectedPath.style.colour).addEventListener("change", (self)=>{
                    this.selectedPath.style.colour = self.htmlNode.value
                })),
                new container("Width: ", new textInput().setAttribute("type", "number").setValue(this.selectedPath.style.width.toString()).addEventListener("change", (self)=>{
                    this.selectedPath.style.width = parseFloat(self.htmlNode.value)
                }))
            )
        } else {
            return new container("select a path to alter style")
        }
    }

    addPath(p:Path) {
        this.paths.push(p)
        for (let i of this.pathListNode.children) {
            i.removeClass("selected").applyLastChange()
        }
        this.selectedPath = p
        
        this.pathListNode.addChildren(
            new button(p.name).addToStyleGroup(pathBtnStyles).addClass("selected").addEventListener("click", (self)=>{
                for (let i of self.parent!.children) {
                    i.removeClass("selected").applyLastChange()
                }
                self.addClass("selected").applyLastChange()
                this.selectedPath = p
                this.pathConfigContainer.removeAllChildren()
                this.pathConfigContainer.addChildren(this.pathConfig())
                rerender(this.pathConfigContainer)
            })
        )

        this.pathConfigContainer.removeAllChildren()
        this.pathConfigContainer.addChildren(this.pathConfig())
        rerender(this.pathConfigContainer)
        rerender(this.pathListNode.parent!)
    }

    worldToPart(pos: Vec2) {
        return new Vec2(
            (pos.x - this.pos.x),
            (pos.y - this.pos.y)
        )
    }
    
    partToWorld(pos: Vec2) {
        return new Vec2(
            pos.x + this.pos.x,
            pos.y + this.pos.y
        )
    }

    partToViewport(pos: Vec2) {
        return worldToViewport(this.partToWorld(pos))
    }

    viewportToPart(pos: Vec2) {
        return this.worldToPart(viewportToWorld(pos))
    }

    constructor(name?: string) {
        this._name = name ? name : `Part ${parts.length+1}`
        var previewCanvas = new canvas()
        this.previewCtx = previewCanvas.getContext("2d")!


        



        this.listNode = new container(
            this.name,
            previewCanvas.addStyle(`position: absolute; z-index: 0; top: 0; left: 0; width: 100%; height: 100%;`),

            new button("👁")
                .addToStyleGroup(visiblityStyles)
                .addStyle("margin-left: auto; background-color: transparent; height: min-content; padding: 0; position: relative; border: none; padding: 0;")
                .addEventListener("click", (self)=>{
                    if (this.visible) {
                        self.addClass("hidden").applyLastChange()
                        this.visible = false
                    } else {
                        self.removeClass("hidden").applyLastChange()
                        this.visible = true
                    }
            }),

        ).addClass("item").addStyle("position: relative;")

        this.collisionGroupsNode = new container(
            
        ).addStyle(`
            display: flex;
            flex-direction: column;
        `)

        this.configNode = new container(
            new header1(this.name).addStyle("text-align: right; margin: 0; margin-right: 4px; font-size: 1em;"),
            new header2("Paths"),
            this.pathListNode,
            this.pathConfigContainer,
            new container(
                "Has Gravity",
                new textInput().setAttribute("type","checkbox").setAttribute("checked", "").addEventListener("change", (self)=>{
                    this.rigidbody.hasGravity = self.htmlNode.checked
                    console.log(this.rigidbody.hasGravity)
                }),
                
            ),
            
            
        ).addToStyleGroup(configStyles)
        


    }
    draw(ctx: CanvasRenderingContext2D) {
        ctx.lineWidth = 3
        for (let p of this.paths) {
            p.draw(ctx, this)
        }
    }
    recordingDraw = false
    visible = true
    listNode: container
    configNode: container
}


