export class Vec2 {
    x: number
    y: number
    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    copy() {
        return new Vec2(this.x, this.y)
    }
}

export function near(a: number, b: number, distance: number) {
    return (a == b || (b-a < distance && a-b < distance))
}

export function near2d(a: Vec2, b: Vec2, distance: number) {
    // update to pythaggoras
    return near(a.x, b.x, distance) && near(a.y, b.y, distance)
}

export function distance(a: Vec2, b: Vec2) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
}

export function angle(v1: Vec2, v2: Vec2): number {
    // Calculate the dot product of the two vectors
    const dotProduct = v1.x * v2.x + v1.y * v2.y;

    // Calculate the magnitudes of the two vectors
    const magnitudeV1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const magnitudeV2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    // Calculate the cosine of the angle between the vectors
    const cosTheta = dotProduct / (magnitudeV1 * magnitudeV2);

    // Calculate the angle in radians
    const angleRadians = Math.acos(cosTheta);

    // Convert the angle to degrees (optional)
    const angleDegrees = angleRadians * 180 / Math.PI;

    return angleDegrees; // Or return angleRadians if you prefer
}