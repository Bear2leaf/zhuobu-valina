import { vec4 } from "gl-matrix";
import { beginDrawing, BlendMode, blit, blitRect, blitRectRect, BLUE, clearBackground, drawFPS, drawLine, drawText, drawTexture, endDrawing, getFPS, getFrameTime, getScreenHeight, getScreenWidth, initAudio, initWindow, isKeyDown, isKeyUp, KeyboardKey, loadSound, loadTexture, playMusic, playSound, popMatrix, pushMatrix, matScale, rand, RAYWHITE, Rectangle, setBlendMode, stopMusic, Texture, WHITE, YELLOW, getTime, matTranslate, matRotateZ, addAudioBuffer, addImage, addText } from "../context";
import Device from "../device/Device";

enum Note {
    C = 147,
    D = 165,
    E = 175,
    F = 196,
    G = 220,

}
const soundDefaultC = `7,3,140,1,232,3,8,,9,1,139,3,,4611,1403,34215,256,4,1316,255,,,,1,,1,7,255#${Note.C}`;
const soundDefaultD = `7,3,140,1,232,3,8,,9,1,139,3,,4611,1403,34215,256,4,1316,255,,,,1,,1,7,255#${Note.D}`;
const soundDefaultE = `7,3,140,1,232,3,8,,9,1,139,3,,4611,1403,34215,256,4,1316,255,,,,1,,1,7,255#${Note.E}`;
const soundDefaultF = `7,3,140,1,232,3,8,,9,1,139,3,,4611,1403,34215,256,4,1316,255,,,,1,,1,7,255#${Note.F}`;
const soundDefaultG = `7,3,140,1,232,3,8,,9,1,139,3,,4611,1403,34215,256,4,1316,255,,,,1,,1,7,255#${Note.G}`;


const PLAYER_SPEED = 200;
const ENEMY_SPEED = 80;
const PLAYER_BULLET_SPEED = 300;
const ENEMY_BULLET_SPEED = 300;
const PLAYER_COOLDOWN = 8;
const ENEMY_SPAWN_COOLDOWN = 120;
const SIDE_PLAYER = 0;
const SIDE_ALIEN = 1;
const MAX_STARS = 500;

function collision(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) {
    return Math.max(x1, x2) < Math.min(x1 + w1, x2 + w2) && Math.max(y1, y2) < Math.min(y1 + h1, y2 + h2);
}

type Explosion = {
    x: number;
    y: number;
    dx: number;
    dy: number;
    color: vec4;
}
type Debris = {
    x: number;
    y: number;
    dx: number;
    dy: number;
    rect: Rectangle;
    texture: Texture | null;
    life: number;
}
type Star = {
    x: number;
    y: number;
    speed: number;
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
    private pointsTexture: Texture | null = null;
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
    private readonly points: Set<Entity> = new Set();
    private readonly explosions: Set<Explosion> = new Set();
    private readonly debris: Set<Debris> = new Set();
    private readonly stars: Array<Star> = new Array(MAX_STARS);
    private readonly highScores: Array<number> = [];
    private enemySpwanTimer = 0;
    private start = false;
    private backgroundX = 0;
    private score = 0;
    private highScore = 0;
    private highScoreColor = WHITE;
    private outro = false;
    private intro = true;
    async load(device: Device) {
        await addText("font/NotoSansSC-Regular.json", device);
        await addText("glsl/line.vert.sk", device);
        await addText("glsl/line.frag.sk", device);
        await addText("glsl/text.vert.sk", device);
        await addText("glsl/text.frag.sk", device);
        await addText("glsl/sprite.vert.sk", device);
        await addText("glsl/sprite.frag.sk", device);
        await addImage("font/NotoSansSC-Regular", device);
        await addImage("image/player", device);
        await addImage("image/playerBullet", device);
        await addImage("image/alienBullet", device);
        await addImage("image/enemy", device);
        await addImage("image/background", device);
        await addImage("image/explosion", device);
        await addImage("image/points", device);
        await addAudioBuffer("music/Mercury.mp3", device);
    }
    init() {
        initWindow(800, 450, "Shooter 01");
        initAudio();
        this.playerTexture = loadTexture("image/player");
        this.playerBulletTexture = loadTexture("image/playerBullet");
        this.enemyBulletTexture = loadTexture("image/alienBullet");
        this.enemyTexture = loadTexture("image/enemy");
        this.backgroundTexture = loadTexture("image/background");
        this.explosionTexture = loadTexture("image/explosion");
        this.pointsTexture = loadTexture("image/points");
        this.resetStage();
        loadSound(soundDefaultC);
        loadSound(soundDefaultD);
        loadSound(soundDefaultE);
        loadSound(soundDefaultF);
        loadSound(soundDefaultG);
        // playMusic("Mercury.mp3");
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
        if (isKeyDown(KeyboardKey.KEY_K)) {
            this.keyboard.add(KeyboardKey.KEY_K);
        }

    }
    prepareScene() {
        beginDrawing();
        clearBackground(RAYWHITE);
    }
    private doPlayer() {
        const keyboard = this.keyboard;
        if (keyboard.has(KeyboardKey.KEY_K)) {
            if (this.intro) {
                this.intro = false;
                this.start = true;
            } else if (this.outro) {
                this.outro = false;
                this.start = true;
            }
        }
        if (this.player.health === 0) {
            return;
        }
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
                reload: getFPS() * (1 + (rand() % 3))
            }
            this.fighters.add(enemy);
        }
        this.enemySpwanTimer--;
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
        e.reload = rand() % getFPS() * 2;
        playSound(soundDefaultD);
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
                return;
            }
        }
    }
    private bulletHitFighter(b: Entity) {
        for (const fighter of this.fighters) {
            if (b.side !== fighter.side && collision(b.x, b.y, b.w, b.h, fighter.x, fighter.y, fighter.w, fighter.h)) {
                fighter.health = 0;

                this.addExplosions(fighter.x, fighter.y, 32);
                this.addDebris(fighter);
                if (fighter.side === SIDE_PLAYER) {
                    this.outro = true;
                    if (this.highScoreColor === YELLOW) {
                        this.highScores.unshift(this.highScore);
                        this.highScores.length = Math.min(this.highScores.length, 5);
                    }
                    playSound(soundDefaultC);
                } else if (fighter.side === SIDE_ALIEN) {
                    this.score++;
                    this.updateHighscore();
                    playSound(soundDefaultF);
                    this.addPointsPod(fighter.x + fighter.w / 2, fighter.y + fighter.h / 2);
                }
                return true;
            }
        }
        return false;
    }
    private drawHighScores() {
        if (this.outro) {
            pushMatrix()
            matTranslate(getScreenWidth() / 2, getScreenHeight() / 2 - 80, 1);
            const scale = 1.25 + Math.sin(getTime() / 1000) * 0.25;
            matScale(scale, scale, 1);
            matTranslate(0, -20, 0);
            drawText("High Scores", 0, 0, 20, WHITE, "center");
            popMatrix();
            drawText("Press K to restart", getScreenWidth() / 2, getScreenHeight() / 2 - 60, 20, WHITE, "center");
            let y = getScreenHeight() / 2 - 20;
            for (const score of this.highScores) {
                drawText(score.toString(), getScreenWidth() / 2, y, 20, WHITE, "center");
                y += 30;
            }
        }
    }
    private doPointsPods() {
        for (const point of this.points) {
            if (point.x < 0) {
                point.x = 0;
                point.dx = -point.dx;
            }
            if (point.x + point.w > getScreenWidth()) {
                point.x = getScreenWidth() - point.w;
                point.dx = -point.dx;
            }
            if (point.y < 0) {
                point.y = 0;
                point.dy = -point.dy;
            }
            if (point.y + point.h > getScreenHeight()) {
                point.y = getScreenHeight() - point.h;
                point.dy = -point.dy;
            }
            point.x += point.dx;
            point.y += point.dy;
            if (this.player.health !== 0 && collision(this.player.x, this.player.y, this.player.w, this.player.h, point.x, point.y, point.w, point.h)) {
                point.health = 0;
                this.score += 1;
                this.updateHighscore();
                playSound(soundDefaultG);
                if (--point.health <= 0) {
                    this.points.delete(point);
                }
            }
        }
    }
    private addPointsPod(x: number, y: number) {
        const { pointsTexture } = this;
        if (!pointsTexture) {
            throw new Error("Points texture is not loaded");
        }
        const point: Entity = {
            texture: pointsTexture,
            x,
            y,
            w: pointsTexture.width,
            h: pointsTexture.height,
            dx: (rand() % 10) - (rand() % 10),
            dy: (rand() % 10) - (rand() % 10),
            side: SIDE_ALIEN,
            health: 1,
            reload: 0
        }
        point.x -= point.w / 2;
        point.y -= point.h / 2;
        this.points.add(point);

    }
    private addExplosions(x: number, y: number, count: number) {
        for (let i = 0; i < count; i++) {
            const explosion: Explosion = {
                x: x + (rand() % 32) - (rand() % 32),
                y: y + (rand() % 32) - (rand() % 32),
                dx: (rand() % 10) - (rand() % 10),
                dy: (rand() % 10) - (rand() % 10),
                color: vec4.fromValues(0, 0, 0, 0)
            }
            explosion.dx /= 10;
            explosion.dy /= 10;
            switch (rand() % 4) {
                case 0:
                    explosion.color[0] = 255
                    break;
                case 1:
                    explosion.color[1] = 255
                    explosion.color[2] = 128
                    break;
                case 2:
                    explosion.color[0] = 255
                    explosion.color[1] = 255
                    break;
                default:
                    explosion.color[0] = 255
                    explosion.color[1] = 255
                    explosion.color[2] = 255
                    break;
            }
            explosion.color[3] = rand() % getFPS() * 3;
            this.explosions.add(explosion);
        }
    }
    private addDebris(e: Entity) {
        let d: Debris;
        let x, y, w, h;
        w = e.w / 2;
        h = e.h / 2;
        for (y = 0; y < e.h; y += h) {
            for (x = 0; x < e.w; x += w) {
                d = {
                    x: e.x + e.w / 2,
                    y: e.y + e.h / 2,
                    dx: (rand() % 5) - (rand() % 5),
                    dy: -(5 + (rand() % 12)),
                    rect: { x, y, width: w, height: h },
                    texture: e.texture,
                    life: getFPS() * 2
                }
                this.debris.add(d);
            }
        }
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
        playSound(soundDefaultE);
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
    private initStarfield() {
        for (let i = 0; i < MAX_STARS; i++) {
            this.stars[i] = this.stars[i] || { x: 0, y: 0, speed: 0 };
            this.stars[i].x = rand() % getScreenWidth();
            this.stars[i].y = rand() % getScreenHeight();
            this.stars[i].speed = 1 + (rand() % 8);
        }
    }
    private resetStage() {
        this.bullets.clear();
        this.fighters.clear();
        this.explosions.clear();
        this.debris.clear();
        this.points.clear();
        this.initStarfield();
        this.initPlayer();
        this.enemySpwanTimer = 0;
        this.start = false;
        this.score = 0;
        this.highScoreColor = WHITE;
        this.outro = false
    }
    private updateHighscore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreColor = YELLOW;
        }
    }
    update() {
        this.doBackground();
        this.doStarfield();
        this.doPlayer();
        if (this.intro) {
            return;
        }
        this.doFighters();
        this.doBullets();
        this.spawnEnemies();
        this.doPointsPods();
        this.clipPlayer();
        if (this.start) {
            this.resetStage();
        }
        this.doExplosions();
        this.doDebris();
    }

    doBackground() {
        if (--this.backgroundX < -getScreenWidth()) {
            this.backgroundX = 0;
        }
    }
    doStarfield() {
        for (let i = 0; i < MAX_STARS; i++) {
            this.stars[i].x -= this.stars[i].speed;
            if (this.stars[i].x < 0) {
                this.stars[i].x = getScreenWidth() + this.stars[i].x;
            }
        }
    }
    doExplosions() {
        for (const explosion of this.explosions) {
            explosion.x += explosion.dx;
            explosion.y += explosion.dy;
            if (--explosion.color[3] <= 0) {
                this.explosions.delete(explosion);
            }
        }
    }
    doDebris() {
        for (const debris of this.debris) {
            debris.x += debris.dx;
            debris.y += debris.dy;
            debris.dy += 0.5;
            if (--debris.life <= 0) {
                this.debris.delete(debris);
            }
        }
    }
    draw() {
        this.drawBackground();
        this.drawStarfield();
        if (this.intro) {
            this.drawIntro();
            return;
        }
        for (const bullet of this.bullets) {
            blit(bullet.texture, bullet.x, bullet.y);
        }
        for (const fighter of this.fighters) {
            blit(fighter.texture, fighter.x, fighter.y);
        }
        for (const point of this.points) {
            blit(point.texture, point.x, point.y);
        }
        this.drawDebris();
        this.drawExplosions();
        this.drawHud();
        this.drawHighScores();
    }
    private drawIntro() {
        pushMatrix()
        matTranslate(getScreenWidth() / 2, getScreenHeight() / 2 - 40, 0);
        const scale = 1.25 + Math.sin(getTime() / 1000) * 0.25;
        matScale(scale, scale, 1);
        matTranslate(0, -20, 0);
        drawText("Shooter 01", 0, 0, 40, WHITE, "center");
        popMatrix();
        pushMatrix();
        matTranslate(getScreenWidth() / 2, getScreenHeight() / 2 + 10, 0);
        drawText("Press K to start", 0, 0, 20, WHITE, "center");
        pushMatrix();
        matTranslate(0, 10, 0);
        pushMatrix();
        matRotateZ(Math.sin(getTime() / 1000) * 0.1);
        drawText("Foo", 0, -100, 20, YELLOW, "center");
        popMatrix();
        popMatrix();
        popMatrix();
    }

    private drawHud() {
        drawFPS(10, 10);
        drawText("Press C to fire", 10, 30, 20, WHITE);
        drawText(`Bullets: ${this.bullets.size}`, 10, 50, 20, WHITE);
        drawText(`Fighters: ${this.fighters.size}`, 10, 70, 20, WHITE);
        drawText(`PointsPods: ${this.points.size}`, 10, 90, 20, WHITE);
        drawText(`Score: ${this.score}`, getScreenWidth() - 10, 10, 20, WHITE, "right");
        drawText(`High Score: ${this.highScore}`, getScreenWidth() - 10, 30, 20, this.highScoreColor, "right");
    }

    private drawBackground() {
        if (!this.backgroundTexture) {
            throw new Error("Background texture is not loaded");
        }
        const src = { x: 0, y: 0, width: this.backgroundTexture.width, height: this.backgroundTexture.height };
        for (let x = this.backgroundX; x < getScreenWidth(); x += getScreenWidth()) {

            blitRectRect(this.backgroundTexture, src, { x, y: 0, width: getScreenWidth(), height: getScreenHeight() });
        }
    }
    private drawStarfield() {
        for (let i = 0; i < MAX_STARS; i++) {
            const c = 32 * this.stars[i].speed;
            const { x, y } = this.stars[i];
            drawLine(x, y, x + 3, y, vec4.fromValues(c, c, c, 255));
        }
    }
    private drawExplosions() {
        setBlendMode(BlendMode.Add);
        for (const explosion of this.explosions) {
            blit(this.explosionTexture, explosion.x, explosion.y, explosion.color);
        }
        setBlendMode(BlendMode.None);
    }
    private drawDebris() {
        for (const debris of this.debris) {
            blitRect(debris.texture, debris.rect, debris.x, debris.y);
        }
    }
    presentScene() {
        endDrawing();
    }
}