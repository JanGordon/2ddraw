import { Part } from "./part";

export class collisionGroup {
    parts: Part[] = []
    name: string = "New Group"
    constructor(name: string) {
        this.name = name
    }
}

export const collisionGroups: collisionGroup[] = [
    new collisionGroup("Main Collision Group")
]