import { vec4 } from "gl-matrix";
import { addAudioBuffer, addImage, addText, beginDrawing, BLACK, clearBackground, getMouse, initContext, initDrawobjects, initPrograms, isKeyDown, isKeyUp, KeyboardKey, loadTexture, RAYWHITE, Texture } from "../context";
import Device from "../device/Device";
import App from "./App";
import Entity from "./Entity";
import { Highscores, Stage } from "./structs";
import { normalizeColor } from "./utils";

export default class Game {
    private readonly highscores: Highscores
    private readonly player: Entity
    private readonly self: Entity
    readonly app: App = new App();
    constructor() {
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
        await addImage("image/targetter", device);
        await addImage("image/donk", device);
    }
    init() {
        this.app.stage.targetterTexture = loadTexture("image/targetter");
        this.app.init();
    }
    prepareScene() {
        beginDrawing();
        clearBackground(normalizeColor(BLACK));

    }
    doInput() {
        getMouse(this.app.mouse);
        this.app.keyboard.clear();
        if (isKeyDown(KeyboardKey.KEY_W)) {
            this.app.keyboard.add(KeyboardKey.KEY_W);
        }
        if (isKeyDown(KeyboardKey.KEY_S)) {
            this.app.keyboard.add(KeyboardKey.KEY_S);
        }
        if (isKeyDown(KeyboardKey.KEY_A)) {
            this.app.keyboard.add(KeyboardKey.KEY_A);
        }
        if (isKeyDown(KeyboardKey.KEY_D)) {
            this.app.keyboard.add(KeyboardKey.KEY_D);
        }
        if (isKeyDown(KeyboardKey.KEY_C)) {
            this.app.keyboard.add(KeyboardKey.KEY_C);
        }
        if (isKeyDown(KeyboardKey.KEY_K)) {
            this.app.keyboard.add(KeyboardKey.KEY_K);
        }
    }
    presentScene() {

    }

}