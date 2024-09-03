import { mousePos, Vec2 } from "./main"



export interface Path {
    draw(ctx: CanvasRenderingContext2D): void
}


export class ellipticalPath implements Path {
    center: Vec2
    radius: number
    startAngle: number
    endAngle: number
    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        ctx.ellipse(this.center.x, this.center.y, this.radius, this.radius, 0, this.startAngle, this.endAngle)
        ctx.stroke()
    }
}

export class freePath implements Path {
    segments: Vec2[] = []
    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        for (let s = 1; s < this.segments.length; s++) {
            ctx.moveTo(this.segments[s-1].x, this.segments[s-1].y)
            ctx.lineTo(this.segments[s].x, this.segments[s].y)
        }
        ctx.stroke()
        
    }
}

export class linePath implements Path {
    start: Vec2
    end: Vec2
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