import { vec4 } from "gl-matrix";
import { addAudioBuffer, addImage, addText, beginDrawing, BLACK, BlendMode, blitRectRect, blitRotated, BLUE, clearBackground, drawFPS, drawText, endDrawing, getFPS, getFrameTime, getMouse, getScreenHeight, getScreenWidth, getTime, GREEN, initContext, initDrawobjects, initPrograms, isKeyDown, isKeyUp, KeyboardKey, loadTexture, matRotateZ, matTranslate, popMatrix, pushMatrix, rand, RAYWHITE, RED, setBlendMode, Texture, WHITE, YELLOW } from "../context";
import Device from "../device/Device";
import Entity from "./Entity";
import { Highscores } from "./structs";
import { calculateSlope, getAngle, getDistance, normalizeColor } from "./utils";
import { Side, PLAYER_SPEED, Weapon, ARENA_WIDTH, ARENA_HEIGHT } from "./defs";
import Player from "./Player";
import Enemy from "./Enemy";
import Item from "./Item";
import Effect from "./Effect";

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
    bulletTexture: Texture | null = null;
    private enemySpawnTimer = 0
    uziTexture: Texture | null = null;
    shotgunTexture: Texture | null = null;
    healthTexture: Texture | null = null;
    whiteSquare16: Texture | null = null;
    donkTexture: Texture | null = null;
    enemy01Texture: Texture | null = null;
    enemy02Texture: Texture | null = null;
    enemy03Texture: Texture | null = null;
    intro = true;
    introTimeout = 0;
    readonly entities = new Set<Entity>();
    readonly bullets = new Set<Entity>();
    readonly effects = new Set<Effect>();
    readonly ammo: Record<Weapon, number> = {
        [Weapon.WPN_PISTOL]: 12,
        [Weapon.WPN_UZI]: 0,
        [Weapon.WPN_SHOTGUN]: 0,
        [Weapon.WPN_MAX]: 0
    };
    readonly camera = [0, 0];
    readonly player = new Player();
    readonly keyboard: Set<KeyboardKey> = new Set();
    readonly mouse: {
        x: number,
        y: number,
        left: boolean,
        right: boolean,
        middle: boolean,
        wheel: number
    }
    constructor() {
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
        await addImage("image/grid", device);
        await addImage("image/enemy01", device);
        await addImage("image/enemy02", device);
        await addImage("image/enemy03", device);
        await addImage("image/uzi", device);
        await addImage("image/shotgun", device);
        await addImage("image/health", device);
        await addImage("image/whiteSquare8", device);
        await addImage("image/whiteSquare16", device);
        await addImage("image/bullet", device);


    }
    init() {
        this.targetterTexture = loadTexture("image/targetter");
        this.gridTexture = loadTexture("image/grid");
        this.uziTexture = loadTexture("image/uzi");
        this.shotgunTexture = loadTexture("image/shotgun");
        this.healthTexture = loadTexture("image/health");
        this.bulletTexture = loadTexture("image/bullet");
        this.whiteSquare16 = loadTexture("image/whiteSquare16");
        this.donkTexture = loadTexture("image/donk");
        this.enemy01Texture = loadTexture("image/enemy01");
        this.enemy02Texture = loadTexture("image/enemy02");
        this.enemy03Texture = loadTexture("image/enemy03");
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
            entity.tick?.(this);
            this.touchOthers(entity);
            entity.x += entity.dx * getFrameTime() * 50;
            entity.y += entity.dy * getFrameTime() * 50;
            entity.reload = Math.max(entity.reload - 1, 0);
            if (entity === this.player) {
                entity.x = Math.min(Math.max(entity.x, -ARENA_WIDTH() + entity.w / 2), ARENA_WIDTH() - entity.w / 2);
                entity.y = Math.min(Math.max(entity.y, -ARENA_HEIGHT() + entity.h / 2), ARENA_HEIGHT() - entity.h / 2);
            }
            if (entity.health <= 0) {
                entity.die(this);
                this.entities.delete(entity);
            }
        }
    }
    private doCamera() {
        if (this.player.health > 0) {
            this.camera[0] = this.player.x - getScreenWidth() / 2;
            this.camera[1] = this.player.y - getScreenHeight() / 2;
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
        drawText(`Effects: ${this.effects.size}`, 10, 130, 20, WHITE);

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
            entity.draw(this);
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
                entity.health = Math.max(entity.health - 1, 0);
                return
            }
        }
    }
    private drawBullets() {
        for (const bullet of this.bullets) {
            blitRotated(bullet.texture, bullet.x - this.camera[0], bullet.y - this.camera[1], (Math.PI / 180) * bullet.angle, bullet.color);
        }
    }
    private spawnEnemy() {
        let x = 0;
        let y = 0;
        if (--this.enemySpawnTimer <= 0) {
            switch (rand() % 4) {
                case 0:
                    x = -100;
                    y = rand() % getScreenWidth();
                    break;
                case 1:
                    x = getScreenHeight() + 100;
                    y = rand() % getScreenWidth();
                    break;
                case 2:
                    x = rand() % getScreenHeight();
                    y = -100;
                    break;
                case 3:
                    x = rand() % getScreenHeight();
                    y = getScreenWidth() + 100;
                    break;
            }
            this.addEnemy(x, y);
            this.enemySpawnTimer = getFPS() + (rand() % getFPS());
        }
    }
    addEnemy(x: number, y: number) {
        const enemy = new Enemy();
        enemy.x = x;
        enemy.y = y;
        enemy.color = WHITE;
        this.entities.add(enemy);
        if (this.enemy01Texture === null) {
            throw new Error("enemy01Texture is not defined");
        }
        if (this.enemy02Texture === null) {
            throw new Error("enemy02Texture is not defined");
        }
        if (this.enemy03Texture === null) {
            throw new Error("enemy03Texture is not defined");
        }
        switch (rand() % 12) {
            case 0:
                enemy.texture = this.enemy02Texture;
                enemy.side = Side.SIDE_ENEMY;
                enemy.w = enemy.texture.width;
                enemy.h = enemy.texture.height;
                enemy.radius = 32;
                enemy.health = 25;
                enemy.tick = function (game: Game) {
                    const { player } = game;
                    const slope = { dx: 0, dy: 0 };

                    if (++this.angle >= 360) {
                        this.angle = 0;
                    }

                    if (player.health > 0) {
                        calculateSlope(player.x, player.y, this.x, this.y, slope);

                        slope.dx /= 10;
                        slope.dy /= 10;

                        this.dx += slope.dx;
                        this.dy += slope.dy;

                        this.dx = Math.max(Math.min(this.dx, 3), -3);
                        this.dy = Math.max(Math.min(this.dy, 3), -3);

                        this.reload = Math.max(this.reload - 1, 0);

                        if (this.reload <= 0 && getDistance(this.x, this.y, player.x, player.y) < getScreenHeight() / 2) {
                            this.fireEnemyBullet(game);

                            this.reload = getFPS() / 2;
                        }
                    }
                }
                break;
            case 1:
            case 2:
                enemy.texture = this.enemy03Texture;
                enemy.side = Side.SIDE_ENEMY;
                enemy.w = enemy.texture.width;
                enemy.h = enemy.texture.height;
                enemy.radius = 26;
                enemy.health = 1;
                enemy.tick = function (game: Game) {
                    const { player } = game;
                    const slope = {
                        dx: 0,
                        dy: 0
                    }

                    this.angle -= 5;

                    if (this.angle < 0) {
                        this.angle = 359;
                    }

                    if (player.health > 0) {
                        calculateSlope(player.x, player.y, this.x, this.y, slope);

                        slope.dx /= 10;
                        slope.dy /= 10;

                        this.dx += slope.dx;
                        this.dy += slope.dy;

                        this.dx = Math.max(Math.min(this.dx, 5), -5);
                        this.dy = Math.max(Math.min(this.dy, 5), -5);


                        this.reload = Math.max(this.reload - 1, 0);

                        if (this.reload <= 0 && getDistance(this.x, this.y, player.x, player.y) < getScreenHeight()) {
                            this.fireEnemyBullet(game);

                            this.reload = getFPS() * 3;
                        }
                    }
                }
                break;
            default:
                enemy.texture = this.enemy01Texture;
                enemy.side = Side.SIDE_ENEMY;
                enemy.w = enemy.texture.width;
                enemy.h = enemy.texture.height;
                enemy.radius = 32;
                enemy.health = 5;
                enemy.tick = function (game: Game) {
                    const { player } = game;
                    const { x, y } = this;
                    if (player.health > 0) {
                        this.angle = getAngle(x, y, player.x, player.y);
                        calculateSlope(player.x, player.y, x, y, this);
                        this.reload = Math.max(this.reload - 1, 0);
                        if (this.reload === 0 && getDistance(x, y, player.x, player.y) < getScreenHeight() / 2) {
                            this.fireEnemyBullet(game);
                            this.reload = getFPS() * 3;
                        }
                    }
                }
                break;
        }
    }
    logic(): void {

        if (this.intro) {
            if (this.keyboard.has(KeyboardKey.KEY_C)) {
                this.introTimeout = getFPS() * 2;
                this.intro = false;
                this.reset();
            }
            return;
        }
        this.doPlayer()
        this.doEntities()
        this.doBullets()
        this.spawnEnemy();
        this.doCamera();
        this.doEffects();

    }
    private doEffects() {
        for (const effect of this.effects) {
            effect.doEffect(this);
        }
    }
    draw(): void {
        if (this.intro) {
            pushMatrix();
            matTranslate(getScreenWidth() / 2, getScreenHeight() / 2, 0);
            pushMatrix();
            matRotateZ(Math.sin(getTime() / 1000) * 0.1);
            drawText("Donk", 0, -80, 40, YELLOW, "center");
            popMatrix();
            drawText("WASD to move", 0, 0, 20, WHITE, "center");
            drawText("Mouse to aim", 0, 30, 20, WHITE, "center");
            drawText("Left click to shoot", 0, 60, 20, WHITE, "center");
            drawText("Press C to Start", 0, 90, 20, RED, "center");
            popMatrix();
            return;
        }
        this.drawGrid();
        this.drawEntities()
        this.drawBullets()
        this.drawEffects();
        this.drawHud();
    }
    private drawEffects() {
        setBlendMode(BlendMode.Add);
        for (const effect of this.effects) {
            effect.draw(this);
        }
        setBlendMode(BlendMode.None);
    }
    prepareScene() {
        beginDrawing();
        clearBackground(normalizeColor(BLACK));

    }
    reset() {
        this.score = 0;
        this.entities.clear();
        this.bullets.clear();
        this.effects.clear();
        this.ammo[Weapon.WPN_PISTOL] = 12;
        this.ammo[Weapon.WPN_UZI] = 0;
        this.ammo[Weapon.WPN_SHOTGUN] = 0;
        this.player.initPlayer(this);
    }
    private drawGrid() {
        drawText(`Grid: ${getScreenWidth()}, ${getScreenHeight()}`, 10, 160, 20, WHITE);
        drawText(`Camera: ${this.camera[0]}, ${this.camera[1]}`, 10, 190, 20, WHITE);
        drawText(`Tex: ${this.gridTexture?.width}, ${this.gridTexture?.height}`, 10, 220, 20, WHITE);
        blitRectRect(this.gridTexture, { x: this.camera[0], y: this.camera[1], width: getScreenWidth(), height: getScreenHeight() }, { x: 0, y: 0, width: getScreenWidth(), height: getScreenHeight() });
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