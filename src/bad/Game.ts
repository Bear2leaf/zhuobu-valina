import { vec4 } from "gl-matrix";
import { addAudioBuffer, addImage, addText, beginDrawing, clearBackground, initContext, initDrawobjects, initPrograms, KeyboardKey, RAYWHITE } from "../context";
import Device from "../device/Device";
import App from "./App";
import Entity from "./Entity";
import { Highscores, Stage } from "./structs";
import { normalizeColor } from "./utils";

export default class Game {
    private readonly stage: Stage
    private readonly highscores: Highscores
    private readonly player: Entity
    private readonly self: Entity
    readonly app: App = new App();
    constructor() {
        this.stage = {
            score: 0,
            entities: new Set(),
            bullets: new Set(),
            effects: new Set(),
            ammo: new Set(),
            camera: [0, 0]
        }
        this.highscores = [];
        this.player = new Entity();
        this.self = new Entity();
    }
    async load(device: Device) {
        await addText("font/NotoSansSC-Regular.json", device);
        await addText("glsl/line.vert.sk", device);
        await addText("glsl/line.frag.sk", device);
        await addText("glsl/text.vert.sk", device);
        await addText("glsl/text.frag.sk", device);
        await addText("glsl/sprite.vert.sk", device);
        await addText("glsl/sprite.frag.sk", device);
        await addImage("font/NotoSansSC-Regular", device);
    }
    init() {

    }
    prepareScene() {
        beginDrawing();
        clearBackground(normalizeColor(RAYWHITE));

    }
    doInput() {

    }
    presentScene() {

    }

}