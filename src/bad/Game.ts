import { vec4 } from "gl-matrix";
import { addAudioBuffer, addImage, addText, beginDrawing, BLACK, blitRotated, clearBackground, drawFPS, drawText, getFrameTime, getMouse, getScreenHeight, getScreenWidth, getTime, initContext, initDrawobjects, initPrograms, isKeyDown, isKeyUp, KeyboardKey, loadTexture, RAYWHITE, Texture, WHITE } from "../context";
import Device from "../device/Device";
import Entity from "./Entity";
import { Effect, Highscores, Mouse } from "./structs";
import { getAngle, normalizeColor } from "./utils";
import { Side, PLAYER_SPEED, Weapon } from "./defs";
import Player from "./Player";

export default class Game {
    private score = 0;
    private targetterTexture: Texture | null = null;
    donkBulletTexture: Texture | null = null;
    readonly entities = new Set<Entity>();
    readonly bullets = new Set<Entity>();
    private readonly effects = new Set<Effect>();
    readonly ammo: Record<Weapon, number> = {
        [Weapon.WPN_PISTOL]: 12,
        [Weapon.WPN_UZI]: 0,
        [Weapon.WPN_SHOTGUN]: 0,
        [Weapon.WPN_MAX]: 0
    };
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
        await addImage("image/donkBullet", device);
    }
    init() {
        this.targetterTexture = loadTexture("image/targetter");
        this.donkBulletTexture = loadTexture("image/donkBullet");
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
            entity.reload = Math.max(entity.reload - 1, 0);
            if (entity === this.player) {
                entity.x = Math.min(Math.max(entity.x, entity.w / 2), getScreenWidth() - entity.w / 2);
                entity.y = Math.min(Math.max(entity.y, entity.h / 2), getScreenHeight() - entity.h / 2);
            }
        }
    }
    private drawHud() {
        drawText(`HEALTH: ${this.player.health}`, 10, 10, 20, WHITE);
        drawText(`SCORE: ${this.score}`, 120, 10, 20, WHITE);
        this.drawWeaponInfo("PISTOL", Weapon.WPN_PISTOL, 220, 10);
        this.drawWeaponInfo("UZI", Weapon.WPN_UZI, 330, 10);
        this.drawWeaponInfo("SHOTGUN", Weapon.WPN_SHOTGUN, 400, 10);
        drawFPS(10, 40);
        blitRotated(this.targetterTexture, this.mouse.x, this.mouse.y, getTime() / 1000, WHITE);

    }
    private drawWeaponInfo(name: string, weapon: Weapon, x: number, y: number) {
        drawText(`${name}: ${this.ammo[weapon]}`, x, y, 20, WHITE);
    }
    private drawEntities() {
        for (const entity of this.entities) {
            blitRotated(entity.texture, entity.x, entity.y, (Math.PI / 180) * entity.angle, WHITE);
        }
    }
    private doBullets() {
        for (const bullet of this.bullets) {
            bullet.x += bullet.dx * getFrameTime() * 10;
            bullet.y += bullet.dy * getFrameTime() * 10;
            if (--bullet.health <= 0) {
                this.bullets.delete(bullet);
            }
        }
    }
    private drawBullets() {
        for (const bullet of this.bullets) {
            blitRotated(this.donkBulletTexture, bullet.x, bullet.y, (Math.PI / 180) * bullet.angle, WHITE);
        }
    }
    logic(): void {
        this.doPlayer()
        this.doEntities()
        this.doBullets()

    }
    draw(): void {
        this.drawEntities()
        this.drawBullets()
        this.drawHud();
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