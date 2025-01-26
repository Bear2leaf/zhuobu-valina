import { blit, BLUE, KeyboardKey, WHITE } from "../context";
import { Delegate, Mouse, Stage } from "./structs";

export default class App implements Delegate {
    readonly keyboard: Set<KeyboardKey>
    readonly mouse: Mouse
    readonly stage: Stage
    inputText: string
    constructor() {
        this.keyboard = new Set<KeyboardKey>()
        this.mouse = {
            x: 0,
            y: 0,
            left: false,
            right: false,
            middle: false,
            wheel: 0
        }
        this.stage = {
            score: 0,
            targetterTexture: null,
            entities: new Set(),
            bullets: new Set(),
            effects: new Set(),
            ammo: new Set(),
            camera: [0, 0]
        }
        this.inputText = ""
    }
    logic(): void {
    }
    draw(): void {
        blit(this.stage.targetterTexture, this.mouse.x, this.mouse.y, WHITE, true)
    }
}