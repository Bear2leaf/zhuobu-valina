import { beginDrawing, blit, BLUE, clearBackground, drawFPS, drawText, drawTexture, endDrawing, getFPS, getFrameTime, getScreenHeight, getScreenWidth, initWindow, isKeyDown, isKeyUp, KeyboardKey, loadTexture, RAYWHITE, Texture } from "../context";

const PLAYER_SPEED = 200;
const ENEMY_SPEED = 80;
const PLAYER_BULLET_SPEED = 300;
const ENEMY_BULLET_SPEED = 300;
const PLAYER_COOLDOWN = 8;
const ENEMY_SPAWN_COOLDOWN = 120;
const SIDE_PLAYER = 0;
const SIDE_ALIEN = 1;


function collision(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) {
    return Math.max(x1, x2) < Math.min(x1 + w1, x2 + w2) && Math.max(y1, y2) < Math.min(y1 + h1, y2 + h2);
}

type Entity = {
    texture: Texture | null;
    w: number;
    h: number;
    x: number;
    y: number;
    dx: number;
    dy: number;
    side: typeof SIDE_PLAYER | typeof SIDE_ALIEN;
    health: number;
    reload: number;
}
export default class Game {
    private playerTexture: Texture | null = null;
    private playerBulletTexture: Texture | null = null;
    private enemyBulletTexture: Texture | null = null;
    private enemyTexture: Texture | null = null;
    private backgroundTexture: Texture | null = null;
    private explosionTexture: Texture | null = null;
    private readonly keyboard = new Set<KeyboardKey>();
    private readonly player: Entity = {
        texture: null,
        w: 0,
        h: 0,
        x: 0,
        y: 0,
        dx: 0,
        dy: 0,
        side: SIDE_PLAYER,
        health: 0,
        reload: 0
    }
    private readonly bullets: Set<Entity> = new Set();
    private readonly fighters: Set<Entity> = new Set();
    private enemySpwanTimer = 0;
    private stageResetTimer = 120;
    init() {
        initWindow(800, 450, "Shooter 01");
        this.playerTexture = loadTexture("image/player");
        this.playerBulletTexture = loadTexture("image/playerBullet");
        this.enemyBulletTexture = loadTexture("image/alienBullet");
        this.enemyTexture = loadTexture("image/enemy");
        this.backgroundTexture = loadTexture("image/background");
        this.explosionTexture = loadTexture("image/explosion");
        this.initPlayer();
    }
    private initPlayer() {
        const { playerTexture } = this;
        if (!playerTexture) {
            throw new Error("Player texture is not loaded");
        }
        this.player.x = 100;
        this.player.y = 100;
        this.player.w = playerTexture.width;
        this.player.h = playerTexture.height;
        this.player.health = 1;
        this.player.reload = 0;
        this.player.texture = playerTexture;
        this.fighters.add(this.player);
    }

    doInput() {
        this.keyboard.clear();
        if (isKeyDown(KeyboardKey.KEY_UP)) {
            this.keyboard.add(KeyboardKey.KEY_UP);
        }
        if (isKeyDown(KeyboardKey.KEY_DOWN)) {
            this.keyboard.add(KeyboardKey.KEY_DOWN);
        }
        if (isKeyDown(KeyboardKey.KEY_LEFT)) {
            this.keyboard.add(KeyboardKey.KEY_LEFT);
        }
        if (isKeyDown(KeyboardKey.KEY_RIGHT)) {
            this.keyboard.add(KeyboardKey.KEY_RIGHT);
        }
        if (isKeyDown(KeyboardKey.KEY_C)) {
            this.keyboard.add(KeyboardKey.KEY_C);
        }

    }
    prepareScene() {
        beginDrawing();
        clearBackground(RAYWHITE);
    }
    private doPlayer() {
        if (this.player.health === 0) {
            return;
        }
        const keyboard = this.keyboard;
        this.player.dy = 0;
        if (keyboard.has(KeyboardKey.KEY_UP)) {
            this.player.dy += -PLAYER_SPEED;
        }
        if (keyboard.has(KeyboardKey.KEY_DOWN)) {
            this.player.dy += PLAYER_SPEED;
        }
        this.player.dx = 0;
        if (keyboard.has(KeyboardKey.KEY_LEFT)) {
            this.player.dx += -PLAYER_SPEED;
        }
        if (keyboard.has(KeyboardKey.KEY_RIGHT)) {
            this.player.dx += PLAYER_SPEED;
        }

        if (keyboard.has(KeyboardKey.KEY_C) && this.player.reload <= 0) {
            this.fireBullet();
        }

    }
    private spawnEnemies() {
        const { enemyTexture } = this;
        if (!enemyTexture) {
            throw new Error("Enemy texture is not loaded");
        }
        if (this.enemySpwanTimer <= 0) {
            this.enemySpwanTimer = ENEMY_SPAWN_COOLDOWN;
            const enemy: Entity = {
                texture: enemyTexture,
                x: getScreenWidth(),
                y: Math.random() * (getScreenHeight() - enemyTexture.height),
                w: enemyTexture.width,
                h: enemyTexture.height,
                dx: ENEMY_SPEED * -1,
                dy: 0,
                side: SIDE_ALIEN,
                health: 1,
                reload: getFPS() * (1 + (this.rand() % 3))
            }
            this.fighters.add(enemy);
        }
        this.enemySpwanTimer--;
    }
    private rand() {
        return Math.floor(Math.random() * (-1 >>> 0));
    }

    private fireAlienBullet(e: Entity) {
        const { enemyBulletTexture: bulletTexture } = this;
        if (!bulletTexture) {
            throw new Error("Bullet texture is not loaded");
        }
        if (e.side !== SIDE_ALIEN || e.reload > 0 || this.player.health === 0) {
            return;
        }
        const slope = this.calculateSlope(this.player.x + this.player.w, this.player.y + this.player.h / 2, e.x + e.w / 2, e.y + e.h / 2);
        const bullet: Entity = {
            texture: bulletTexture,
            x: e.x,
            y: e.y + e.h / 2 - bulletTexture.height / 2,
            w: bulletTexture.width,
            h: bulletTexture.height,
            dx: slope.dx * ENEMY_BULLET_SPEED,
            dy: slope.dy * ENEMY_BULLET_SPEED,
            side: SIDE_ALIEN,
            health: 1,
            reload: 0
        }
        this.bullets.add(bullet);
        e.reload = this.rand() % getFPS() * 2;
    }
    private doFighters() {
        const delta = getFrameTime();
        for (const fighter of this.fighters) {
            if (fighter.health === 0) {
                this.fighters.delete(fighter);
                continue;
            }
            if (fighter !== this.player && fighter.x < -fighter.w) {
                fighter.health = 0;
                continue;
            }
            this.fireAlienBullet(fighter);
            fighter.x += fighter.dx * delta;
            fighter.y += fighter.dy * delta;
            fighter.reload--;
        }
    }
    private doBullets() {

        const delta = getFrameTime();
        for (const bullet of this.bullets) {

            if (bullet.health === 0) {
                this.bullets.delete(bullet);
                continue;
            }
            bullet.x += bullet.dx * delta;
            bullet.y += bullet.dy * delta;

            if (this.bulletHitFighter(bullet) || bullet.x > getScreenWidth() || bullet.x < -bullet.w || bullet.y > getScreenHeight() || bullet.y < -bullet.h) {
                bullet.health = 0;
            }
        }
    }
    private bulletHitFighter(b: Entity) {
        for (const fighter of this.fighters) {
            if (b.side !== fighter.side && collision(b.x, b.y, b.w, b.h, fighter.x, fighter.y, fighter.w, fighter.h)) {
                fighter.health = 0;
                return true;
            }
        }
        return false;
    }
    private fireBullet() {
        const { playerBulletTexture: bulletTexture } = this;
        if (!bulletTexture) {
            throw new Error("Bullet texture is not loaded");
        }
        {
            const bullet: Entity = {
                texture: this.playerBulletTexture,
                x: this.player.x,
                y: this.player.y + this.player.h / 2 - bulletTexture.height / 2 - 10,
                w: bulletTexture.width,
                h: bulletTexture.height,
                dx: PLAYER_BULLET_SPEED,
                dy: 0,
                side: SIDE_PLAYER,
                health: 1,
                reload: 0
            }

            this.bullets.add(bullet);
        }
        {
            const bullet: Entity = {
                texture: this.playerBulletTexture,
                x: this.player.x,
                y: this.player.y + this.player.h / 2 - bulletTexture.height / 2 + 10,
                w: bulletTexture.width,
                h: bulletTexture.height,
                dx: PLAYER_BULLET_SPEED,
                dy: 0,
                side: SIDE_PLAYER,
                health: 1,
                reload: 0
            }

            this.bullets.add(bullet);
        }
        this.player.reload = PLAYER_COOLDOWN;
    }
    private clipPlayer() {
        const { player } = this;
        if (player.x < 0) {
            player.x = 0;
        }
        if (player.y < 0) {
            player.y = 0;
        }
        if (player.x + player.w > getScreenWidth()) {
            player.x = getScreenWidth() - player.w;
        }
        if (player.y + player.h > getScreenHeight()) {
            player.y = getScreenHeight() - player.h;
        }
    }
    private calculateSlope(x1: number, y1: number, x2: number, y2: number) {
        const steps = Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
        if (steps === 0) {
            return { dx: 0, dy: 0 };
        }
        return { dx: (x1 - x2) / steps, dy: (y1 - y2) / steps };
    }
    private resetStage() {
        this.bullets.clear();
        this.fighters.clear();
        this.initPlayer();
        this.enemySpwanTimer = 0;
        this.stageResetTimer = getFPS() * 2;
    }
    update() {
        this.doPlayer();
        this.doFighters();
        this.doBullets();
        this.spawnEnemies();
        this.clipPlayer();
        if (this.player.health === 0 && --this.stageResetTimer <= 0) {
            this.resetStage();
        }
        drawFPS(10, 10);
        drawText("Press C to fire", 10, 30, 20, BLUE);
        drawText(`Bullets: ${this.bullets.size}`, 10, 50, 20, BLUE);
        drawText(`Fighters: ${this.fighters.size}`, 10, 70, 20, BLUE);
    }
    draw() {
        for (const bullet of this.bullets) {
            blit(bullet.texture, bullet.x, bullet.y);
        }
        for (const fighter of this.fighters) {
            blit(fighter.texture, fighter.x, fighter.y);
        }
    }
    presentScene() {
        endDrawing();
    }
}