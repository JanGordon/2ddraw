import { Vec2, worldToViewport } from "./main"

var worldWidth = 1000
var worldHeight = 1000

export function drawGrid(ctx: CanvasRenderingContext2D, interval: number) {
    ctx.lineWidth = 0.4
    ctx.strokeStyle = "lightgrey"
    for (let y = 0; y <= worldHeight; y+=interval) {
        var vStart = worldToViewport(new Vec2(0, y))
        var vEnd = worldToViewport(new Vec2(worldWidth, y))

        ctx.beginPath()
        ctx.moveTo(vStart.x, vStart.y)
        ctx.lineTo(vEnd.x, vEnd.y)
        ctx.stroke()
    }
    for (let x = 0; x <= worldWidth; x+=interval) {
        var vStart = worldToViewport(new Vec2(x, 0))
        var vEnd = worldToViewport(new Vec2(x, worldWidth))

        ctx.beginPath()
        ctx.moveTo(vStart.x, vStart.y)
        ctx.lineTo(vEnd.x, vEnd.y)
        ctx.stroke()
    }
}