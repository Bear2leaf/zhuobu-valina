import { blit, blitRotated, BLUE, getFrameTime, getScreenHeight, getScreenWidth, getTime, KeyboardKey, loadTexture, WHITE } from "../context";
import { PLAYER_SPEED, Side } from "./defs";
import Entity from "./Entity";
import { Delegate, Mouse, Stage } from "./structs";
import { getAngle } from "./utils";

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
            camera: [0, 0],
            player: new Entity
        }
        this.inputText = ""
    }
    private initPlayer() {
        const { player } = this.stage;
        player.texture = loadTexture("image/donk");
        player.side = Side.SIDE_PLAYER;
        player.w = player.texture.width;
        player.h = player.texture.height;
        player.health = 5;
        player.x = getScreenWidth() / 2;
        player.y = getScreenWidth() / 2;
        this.stage.entities.add(player);
    }
    private doPlayer() {
        const { player } = this.stage;
        player.dx *= 0.85;
        player.dy *= 0.85;
        if (this.keyboard.has(KeyboardKey.KEY_W)) {
            player.dy = -1 * PLAYER_SPEED;
        }
        if (this.keyboard.has(KeyboardKey.KEY_S)) {
            player.dy = PLAYER_SPEED;
        }
        if (this.keyboard.has(KeyboardKey.KEY_A)) {
            player.dx = -1 * PLAYER_SPEED;
        }
        if (this.keyboard.has(KeyboardKey.KEY_D)) {
            player.dx = PLAYER_SPEED;
        }
        player.angle = getAngle(player.x, player.y, this.mouse.x, this.mouse.y);
    }
    private doEntities() {
        for (const entity of this.stage.entities) {
            entity.x += entity.dx * getFrameTime();
            entity.y += entity.dy * getFrameTime();
            if (entity === this.stage.player) {
                entity.x = Math.min(Math.max(entity.x, entity.w / 2), getScreenWidth() - entity.w / 2);
                entity.y = Math.min(Math.max(entity.y, entity.h / 2), getScreenHeight() - entity.h / 2);
            }
        }
    }
    private drawEntities() {
        for (const entity of this.stage.entities) {
            blitRotated(entity.texture, entity.x, entity.y, (Math.PI / 180) * entity.angle, WHITE);
        }
    }
    init() {
        this.initPlayer()
    }
    logic(): void {
        this.doPlayer()
        this.doEntities()
    }
    draw(): void {
        this.drawEntities()
        blitRotated(this.stage.targetterTexture, this.mouse.x, this.mouse.y, getTime() / 1000, WHITE);
    }
}