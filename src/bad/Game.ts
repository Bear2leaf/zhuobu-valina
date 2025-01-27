import { vec4 } from "gl-matrix";
import { addAudioBuffer, addImage, addText, beginDrawing, BLACK, blitRotated, clearBackground, getFrameTime, getMouse, getScreenHeight, getScreenWidth, getTime, initContext, initDrawobjects, initPrograms, isKeyDown, isKeyUp, KeyboardKey, loadTexture, RAYWHITE, Texture, WHITE } from "../context";
import Device from "../device/Device";
import Entity from "./Entity";
import { Effect, Highscores, Mouse } from "./structs";
import { getAngle, normalizeColor } from "./utils";
import { Side, PLAYER_SPEED } from "./defs";
import Player from "./Player";

export default class Game {
    private score = 0;
    private targetterTexture: Texture | null = null;
    readonly entities = new Set<Entity>();
    private readonly bullets = new Set<Entity>();
    private readonly effects = new Set<Effect>();
    private readonly ammo = new Set();
    private readonly camera = [0, 0];
    private readonly player = new Player();
    private readonly highscores: Highscores
    readonly keyboard: Set<KeyboardKey> = new Set();
    readonly mouse: Mouse
    inputText: string = ""
    constructor() {
        this.highscores = [];
        this.mouse = {
            x: 0,
            y: 0,
            left: false,
            right: false,
            middle: false,
            wheel: 0
        }
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
        this.targetterTexture = loadTexture("image/targetter");
        this.initPlayer()
    }
    private initPlayer() {
        this.player.initPlayer(this);
    }
    private doPlayer() {
        this.player.doPlayer(this);
    }
    private doEntities() {
        for (const entity of this.entities) {
            entity.x += entity.dx * getFrameTime();
            entity.y += entity.dy * getFrameTime();
            if (entity === this.player) {
                entity.x = Math.min(Math.max(entity.x, entity.w / 2), getScreenWidth() - entity.w / 2);
                entity.y = Math.min(Math.max(entity.y, entity.h / 2), getScreenHeight() - entity.h / 2);
            }
        }
    }
    private drawEntities() {
        for (const entity of this.entities) {
            blitRotated(entity.texture, entity.x, entity.y, (Math.PI / 180) * entity.angle, WHITE);
        }
    }
    logic(): void {
        this.doPlayer()
        this.doEntities()
    }
    draw(): void {
        this.drawEntities()
        blitRotated(this.targetterTexture, this.mouse.x, this.mouse.y, getTime() / 1000, WHITE);
    }
    prepareScene() {
        beginDrawing();
        clearBackground(normalizeColor(BLACK));

    }
    private doMouseButtonDown(button: number) {
        if (button === 0) {
            this.mouse.left = true;
        } else if (button === 1) {
            this.mouse.right = true;
        }
    }
    private doMouseButtonUp(button: number) {
        if (button === 0) {
            this.mouse.left = false;
        } else if (button === 1) {
            this.mouse.right = false;
        }
    }
    doInput() {
        const { left, right, x, y, wheel } = getMouse();
        this.mouse.wheel = wheel;
        this.mouse.x = x;
        this.mouse.y = y;
        if (left) {
            this.doMouseButtonDown(0);
        } else {
            this.doMouseButtonUp(0);
        }
        if (right) {
            this.doMouseButtonDown(1);
        } else {
            this.doMouseButtonUp(1);
        }
        this.keyboard.clear();
        if (isKeyDown(KeyboardKey.KEY_W)) {
            this.keyboard.add(KeyboardKey.KEY_W);
        }
        if (isKeyDown(KeyboardKey.KEY_S)) {
            this.keyboard.add(KeyboardKey.KEY_S);
        }
        if (isKeyDown(KeyboardKey.KEY_A)) {
            this.keyboard.add(KeyboardKey.KEY_A);
        }
        if (isKeyDown(KeyboardKey.KEY_D)) {
            this.keyboard.add(KeyboardKey.KEY_D);
        }
        if (isKeyDown(KeyboardKey.KEY_C)) {
            this.keyboard.add(KeyboardKey.KEY_C);
        }
        if (isKeyDown(KeyboardKey.KEY_K)) {
            this.keyboard.add(KeyboardKey.KEY_K);
        }
    }
    presentScene() {

    }

}