import { vec4 } from "gl-matrix"
import { Side } from "./defs"
import { Texture, WHITE } from "../context"

export default class Entity {
    side: number
    x: number
    y: number
    w: number
    h: number
    radius: number
    dx: number
    dy: number
    health: number
    reload: number
    angle: number
    weaponType: number
    texture: Texture | null
    color: vec4
    constructor() {
        this.side = Side.SIDE_NONE
        this.x = 0
        this.y = 0
        this.w = 0
        this.h = 0
        this.radius = 0
        this.dx = 0
        this.dy = 0
        this.health = 0
        this.reload = 0
        this.angle = 0
        this.weaponType = 0
        this.texture = null
        this.color = WHITE
    }
    tick(): void {

    }
    touch(other: Entity): void {

    }
    die(): void {

    }
}