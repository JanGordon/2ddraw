export function drawGrid(ctx: CanvasRenderingContext2D, interval: number) {
    ctx.lineWidth = 0.4
    ctx.strokeStyle = "lightgrey"
    for (let y = 0; y <= ctx.canvas.height; y+=interval) {
        
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(ctx.canvas.width, y)
        ctx.stroke()
    }
    for (let x = 0; x <= ctx.canvas.width; x+=interval) {
        
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, ctx.canvas.height)
        ctx.stroke()
    }
}