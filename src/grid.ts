import { viewportToWorld, worldToViewport, zoomFactor } from "./main"
import { Vec2 } from "./vec"

export function drawGrid(ctx: CanvasRenderingContext2D, posInWorld: Vec2, interval: number, bigInterval: number) {
    ctx.strokeStyle = "lightgrey"

    
    

    var deadSpaceAtStartY = (posInWorld.y % interval)
    // world pos
    var startOfGridY = posInWorld.y - deadSpaceAtStartY

    
    for (let y = startOfGridY; y <= startOfGridY + ctx.canvas.height * zoomFactor + deadSpaceAtStartY; y+=interval) {
        var vStart = worldToViewport(new Vec2(posInWorld.x, y))
        var vEnd = worldToViewport(new Vec2(posInWorld.x + ctx.canvas.width* zoomFactor, y))
        if (y % bigInterval == 0) {
            ctx.lineWidth = 2
        } else {
            ctx.lineWidth = 0.4
        }
        ctx.beginPath()
        ctx.moveTo(vStart.x, vStart.y)
        ctx.lineTo(vEnd.x, vEnd.y)
        ctx.stroke()
    }

    var deadSpaceAtStartX = (posInWorld.x % interval)
    // world pos
    var startOfGridX = posInWorld.x - deadSpaceAtStartX

    for (let x = startOfGridX; x <= startOfGridX + ctx.canvas.width * zoomFactor + deadSpaceAtStartX; x+=interval) {
        var vStart = worldToViewport(new Vec2(x, posInWorld.y))
        var vEnd = worldToViewport(new Vec2(x, posInWorld.y + ctx.canvas.height* zoomFactor))
        if (x % bigInterval == 0) {
            ctx.lineWidth = 2
        } else {
            ctx.lineWidth = 0.4
        }
        ctx.beginPath()
        ctx.moveTo(vStart.x, vStart.y)
        ctx.lineTo(vEnd.x, vEnd.y)
        ctx.stroke()
    }
}