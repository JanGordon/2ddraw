import { Part } from "./part";
import { Vec2 } from "./vec";

export class rigidbody {
    outofdate = false
    private privatePart: Part
    hasGravity = true
    force: Vec2 = new Vec2(0,0) // at cg
    acceleration: Vec2 = new Vec2(0,0)
    velocity: Vec2 = new Vec2(0,0)
    mass: number = 10 //kg
    physicsPosOffset = new Vec2(0,0)
    rotation = 0
    constructor(p: Part) {
        this.privatePart = p
    }
    calculateCG() {
        for (let i of this.privatePart.paths) {
            i
        }
    }
    generate() {
        for (let i of this.privatePart.paths) {
            
        }
    }
}

class ellipseRigidbody {
    
}