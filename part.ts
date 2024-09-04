import { mousePos, Vec2 } from "./main"



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
        ctx.ellipse(this.center.x, this.center.y, this.radius, this.radius, 0, this.startAngle, this.endAngle)
        ctx.stroke()
    }
}

export class freePath implements Path {
    controlPoints: Vec2[][] = [[]]
    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        for (let s = 1; s < this.controlPoints.length; s++) {
            ctx.moveTo(this.controlPoints[s-1][0].x, this.controlPoints[s-1][0].y)
            ctx.lineTo(this.controlPoints[s][0].x, this.controlPoints[s][0].y)
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
        ctx.moveTo(this.start.x, this.start.y)
        ctx.lineTo(this.end.x, this.end.y)
        ctx.stroke()
        
    }
}

export class Part {
    paths: Path[] = []
    draw(ctx: CanvasRenderingContext2D) {
        ctx.lineWidth = 3
        for (let p of this.paths) {
            p.draw(ctx)
        }
    }
}