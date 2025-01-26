import { KeyboardKey } from "../context";
import { Delegate, Mouse } from "./structs";

export default class App implements Delegate {
    readonly keyboard: Set<KeyboardKey>
    readonly mouse: Mouse
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
        this.inputText = ""
    }
    logic(): void {
    }
    draw(): void {
    }
}