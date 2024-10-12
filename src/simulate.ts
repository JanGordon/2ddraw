import { parts } from "./part";
import { collisionGroup } from "./physics";
import { Vec2 } from "./vec";

var scaleFactor = 10 // 1 metre = 100px

var simulationSpeed = 25 //25hz

export function simulate(cg: collisionGroup) {
    // generate rigidbodies for parts
    for (let i of cg.parts) {
        i.rigidbody.generate()
        if (i.rigidbody.hasGravity) {
            i.rigidbody.force = new Vec2(0, i.rigidbody.mass * 10) //gravity
        } else {
            i.rigidbody.force = new Vec2(0,0)
            
        }
        i.rigidbody.velocity = new Vec2(0,0)
    }
    timing(simulationSpeed, (dt)=>{
        // console.log(dt)
        var ds = dt/1000 // delta seconds
        for (let i of cg.parts) {
            i.rigidbody.acceleration = new Vec2(i.rigidbody.force.x/i.rigidbody.mass, i.rigidbody.force.y/i.rigidbody.mass)
            i.rigidbody.velocity.x += i.rigidbody.acceleration.x * ds
            i.rigidbody.velocity.y += i.rigidbody.acceleration.y * ds
            i.pos.x += i.rigidbody.velocity.x * ds * scaleFactor
            i.pos.y += i.rigidbody.velocity.y * ds * scaleFactor
            console.log(i.pos, ds, i.rigidbody.velocity, i.rigidbody.acceleration, i.rigidbody.force)

        }
    })
    
}

export function stopSimulation(cg: collisionGroup) {
    shouldPause = true
    for (let i of cg.parts) {
        i.pos.x = i.startPos.x
        i.pos.y = i.startPos.y
    }
}

var shouldPause = false

function timing(frequency: number, simFn: (dt: number)=>void) {
    var beginTime = 0
    var currentTime = 0
    shouldPause = false

    if (this.isEnded) {
        startTime = 0
    }
    var frameIndex = beginTime*frequency
    var isPlaying = true
    var isEnded = false

    let renderFrame: (frameIndex: number)=> void
    
    var startTime = Date.now() 
    var realTime = 0
    renderFrame = (frame: number) => {
        var roundedFrameIndex = Math.round(frameIndex)
        
        if (shouldPause) {
            console.log("paused")
            this.shouldPause = false
            this.isPlaying = false
        } else {
            let targetTime = (frameIndex/frequency)*1000
            let dTime = (((Date.now()) - startTime) + beginTime*1000) - realTime
            simFn(dTime)
            realTime = ((Date.now()) - startTime) + beginTime*1000
            currentTime = (realTime+startTime*1000)/1000
            if (realTime < targetTime) {
                // console.log("slightly ahead! :", targetTime - realTime)
                setTimeout(()=>{
                    frameIndex= roundedFrameIndex+1
                    renderFrame(frameIndex)
                }, targetTime - realTime)
            } else {
                // console.log("slightly behind! :", realTime - targetTime)
                frameIndex += (realTime - targetTime)/frequency
                renderFrame(frameIndex)

            }
        }
    }
    renderFrame(0)
}