import { button, canvas, container } from "kleinui/elements"
import { currentPart, mousePos, worldToViewport } from "./main"
import { Vec2 } from "./vec"
import { kleinTextNode, styleGroup } from "kleinui"


export interface Path {
    controlPoints: Vec2[][]
    draw(ctx: CanvasRenderingContext2D): void
}


export class ellipticalPath implements Path {
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
    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        var cViewport = worldToViewport(this.center)
        ctx.ellipse(cViewport.x, cViewport.y, this.radius, this.radius, 0, this.startAngle, this.endAngle)
        ctx.stroke()
    }
}

export class freePath implements Path {
    controlPoints: Vec2[][] = [[]]
    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        for (let s = 1; s < this.controlPoints.length; s++) {
            var vStart = worldToViewport(this.controlPoints[s-1][0])
            var vEnd = worldToViewport(this.controlPoints[s][0])
            ctx.moveTo(vStart.x, vStart.y)
            ctx.lineTo(vEnd.x, vEnd.y)
        }
        ctx.stroke()
        
    }
}

export class linePath implements Path {
    controlPoints: Vec2[][] = [[],[]]
    get start() {
        return this.controlPoints[0][0]
    }
    get end() {
        return this.controlPoints[1][0]
    }
    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        var vStart = worldToViewport(this.start)
        var vEnd = worldToViewport(this.end)
        ctx.moveTo(vStart.x, vStart.y)
        ctx.lineTo(vEnd.x, vEnd.y)
        ctx.stroke()
        
    }
}

export class ngonPath implements Path {
    controlPoints: Vec2[][] = [[]]
    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        for (let i = 2; i < this.controlPoints[0].length; i++) {
            var vStart = worldToViewport(this.controlPoints[0][i-1])
            var vEnd = worldToViewport(this.controlPoints[0][i])
            ctx.moveTo(vStart.x, vStart.y)
            ctx.lineTo(vEnd.x, vEnd.y)
        }
        var vStart = worldToViewport(this.controlPoints[0][this.controlPoints[0].length-1])
        var vEnd = worldToViewport(this.controlPoints[0][1])
        ctx.moveTo(vStart.x, vStart.y)
        ctx.lineTo(vEnd.x, vEnd.y)
        
        ctx.stroke()
        
    }
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


export class Part {
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

    constructor(name?: string) {
        this._name = name ? name : `Part ${parts.length+1}`
        var previewCanvas = new canvas()
        this.previewCtx = previewCanvas.getContext("2d")!
        this.listNode = new container(
            this.name,
            previewCanvas.addStyle("position: absolute; z-index: 0; top: 0; left: 0; width: 100%; height: 100%;"),

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

        
    }
    draw(ctx: CanvasRenderingContext2D) {
        ctx.lineWidth = 3
        for (let p of this.paths) {
            p.draw(ctx)
        }
    }
    recordingDraw = false
    visible = true
    listNode: container
}

