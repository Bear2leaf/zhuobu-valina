import { vec4 } from "gl-matrix";
import { addAudioBuffer, addImage, addText, beginDrawing, BLACK, blitRectRect, blitRotated, clearBackground, drawFPS, drawText, endDrawing, getFPS, getFrameTime, getMouse, getScreenHeight, getScreenWidth, getTime, GREEN, initContext, initDrawobjects, initPrograms, isKeyDown, isKeyUp, KeyboardKey, loadTexture, rand, RAYWHITE, Texture, WHITE } from "../context";
import Device from "../device/Device";
import Entity from "./Entity";
import { Effect, Highscores, Mouse } from "./structs";
import { getAngle, getDistance, normalizeColor } from "./utils";
import { Side, PLAYER_SPEED, Weapon } from "./defs";
import Player from "./Player";
import Enemy from "./Enemy";
import Item from "./Item";

function healthTouch(this: Item, other: Entity, game: Game) {
    if (other === game.player) {
        this.health = 0;
        game.player.health++;
    }

}
function uziTouch(this: Item, other: Entity, game: Game) {
    if (other === game.player) {
        this.health = 0;
        game.ammo[Weapon.WPN_UZI] += 25;
    }
}
function shotgunTouch(this: Item, other: Entity, game: Game) {
    if (other === game.player) {
        this.health = 0;
        game.ammo[Weapon.WPN_SHOTGUN] += 4;
    }
}
export default class Game {
    score = 0;
    private targetterTexture: Texture | null = null;
    private gridTexture: Texture | null = null;
    private enemySpawnTimer = 0
    donkBulletTexture: Texture | null = null;
    uziTexture: Texture | null = null;
    shotgunTexture: Texture | null = null;
    healthTexture: Texture | null = null;
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
    readonly player = new Player();
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
        await addImage("image/grid", device);
        await addImage("image/enemy01", device);
        await addImage("image/uzi", device);
        await addImage("image/shotgun", device);
        await addImage("image/health", device);
    }
    init() {
        this.targetterTexture = loadTexture("image/targetter");
        this.donkBulletTexture = loadTexture("image/donkBullet");
        this.gridTexture = loadTexture("image/grid");
        this.uziTexture = loadTexture("image/uzi");
        this.shotgunTexture = loadTexture("image/shotgun");
        this.healthTexture = loadTexture("image/health");
        this.initPlayer()
    }
    addRandomPowerup(x: number, y: number) {
        const r = rand() % 5;
        if (r === 0) {
            this.addHealthPowerup(x, y);
        } else if (r < 3) {
            this.addUziPowerup(x, y);
        } else {
            this.addShotgunPowerup(x, y);
        }
    }
    private addHealthPowerup(x: number, y: number) {
        const e = this.createPowerup(x, y);
        e.texture = this.healthTexture;
        this.entities.add(e);
        e.touch = healthTouch;
    }
    private addUziPowerup(x: number, y: number) {
        const e = this.createPowerup(x, y);
        e.texture = this.uziTexture;
        this.entities.add(e);
        e.touch = uziTouch;
    }
    private addShotgunPowerup(x: number, y: number) {
        const e = this.createPowerup(x, y);
        e.texture = this.shotgunTexture;
        this.entities.add(e);
        e.touch = shotgunTouch;
    }
    private createPowerup(x: number, y: number) {
        const e = new Item();
        e.x = x;
        e.y = y;
        e.health = getFPS() * 5;
        e.radius = 16;
        e.dx = -200 + (rand() % 400);
        e.dy = -200 + (rand() % 400);
        e.dx /= 100;
        e.dy /= 100;
        return e;
    }
    private initPlayer() {
        this.player.initPlayer(this);
    }
    private doPlayer() {
        this.player.doPlayer(this);
    }
    private doEntities() {
        for (const entity of this.entities) {
            entity.tick(this);
            this.touchOthers(entity);
            entity.x += entity.dx * getFrameTime() * 50;
            entity.y += entity.dy * getFrameTime() * 50;
            entity.reload = Math.max(entity.reload - 1, 0);
            if (entity === this.player) {
                entity.x = Math.min(Math.max(entity.x, entity.w / 2), getScreenWidth() - entity.w / 2);
                entity.y = Math.min(Math.max(entity.y, entity.h / 2), getScreenHeight() - entity.h / 2);
            }
            if (entity.health <= 0) {
                entity.die(this);
                this.entities.delete(entity);
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
        drawText(`Entities: ${this.entities.size}`, 10, 70, 20, WHITE);
        drawText(`Bullets: ${this.bullets.size}`, 10, 100, 20, WHITE);

        blitRotated(this.targetterTexture, this.mouse.x, this.mouse.y, getTime() / 1000, WHITE);

    }
    private drawWeaponInfo(name: string, weapon: Weapon, x: number, y: number) {
        let color = WHITE;
        if (this.player.weaponType === weapon) {
            color = GREEN;
        } else {
            color = WHITE;
        }
        drawText(`${name}: ${this.ammo[weapon]}`, x, y, 20, color);
    }
    private drawEntities() {
        for (const entity of this.entities) {
            blitRotated(entity.texture, entity.x, entity.y, (Math.PI / 180) * entity.angle, WHITE);
        }
    }
    private touchOthers(entity: Entity) {
        for (const other of this.entities) {
            if (entity === other) {
                continue;
            }
            const distance = getDistance(entity.x, entity.y, other.x, other.y);
            if (distance < entity.radius + other.radius) {
                entity.touch?.(other, this);
            }
        }
    }
    private doBullets() {
        for (const bullet of this.bullets) {
            bullet.x += bullet.dx * getFrameTime() * 10;
            bullet.y += bullet.dy * getFrameTime() * 10;
            if (--bullet.health <= 0) {
                this.bullets.delete(bullet);
            }

            this.bulletHitEntity(bullet);
        }
    }
    private bulletHitEntity(bullet: Entity) {
        for (const entity of this.entities) {
            if (entity.side === bullet.side || entity.side === Side.SIDE_NONE) {
                continue;
            }
            const distance = getDistance(entity.x, entity.y, bullet.x, bullet.y);
            if (distance < entity.radius + bullet.radius) {
                bullet.health = 0;
                entity.health--;
                return
            }
        }
    }
    private drawBullets() {
        for (const bullet of this.bullets) {
            blitRotated(this.donkBulletTexture, bullet.x, bullet.y, (Math.PI / 180) * bullet.angle, WHITE);
        }
    }
    private spawnEnemy() {
        let x = 0;
        let y = 0;
        if (--this.enemySpawnTimer <= 0) {
            switch (rand() % 4) {
                case 0:
                    x = -100;
                    y = rand() % getScreenHeight();
                    break;
                case 1:
                    x = getScreenWidth() + 100;
                    y = rand() % getScreenHeight();
                    break;
                case 2:
                    x = rand() % getScreenWidth();
                    y = -100;
                    break;
                case 3:
                    x = rand() % getScreenWidth();
                    y = getScreenHeight() + 100;
                    break;
            }
            this.addEnemy(x, y);
            this.enemySpawnTimer = getFPS() + (rand() % getFPS());
        }
    }
    addEnemy(x: number, y: number) {
        const enemy = new Enemy();
        enemy.texture = loadTexture("image/enemy01");
        enemy.side = Side.SIDE_ENEMY;
        enemy.w = enemy.texture.width;
        enemy.h = enemy.texture.height;
        enemy.health = 5;
        enemy.x = x;
        enemy.y = y;
        this.entities.add(enemy);
    }
    logic(): void {
        this.doPlayer()
        this.doEntities()
        this.doBullets()
        this.spawnEnemy();

    }
    draw(): void {
        this.drawGrid();
        this.drawEntities()
        this.drawBullets()
        this.drawHud();
    }
    prepareScene() {
        beginDrawing();
        clearBackground(normalizeColor(BLACK));

    }
    private drawGrid() {
        blitRectRect(this.gridTexture, { x: 0, y: 0, width: getScreenWidth(), height: getScreenHeight() }, { x: 0, y: 0, width: getScreenWidth(), height: getScreenHeight() });
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

        endDrawing();
    }

}