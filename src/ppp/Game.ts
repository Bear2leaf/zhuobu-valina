import { vec2 } from "gl-matrix";
import { addImage, addText, beginDrawing, blit, BLUE, clearBackground, drawText, endDrawing, getScreenHeight, getScreenWidth, isKeyDown, isKeyUp, KeyboardKey, LIGHTBLUE, loadText, loadTexture, RAYWHITE, Texture, WHITE } from "../context";
import Device from "../device/Device";
import { EntityFlags, MAP_HEIGHT, MAP_RENDER_HEIGHT, MAP_RENDER_WIDTH, MAP_WIDTH, MAX_TILES, PLATFORM_SPEED, PLAYER_MOVE_SPEED, TILE_SIZE } from "./defs";
import Entity from "./Entity";
import { calculateSlope } from "../bad/utils";

export default class Game {
    readonly entities = new Set<Entity>();
    readonly camera: vec2 = vec2.create();
    readonly map: number[][] = [];
    private readonly tiles: Texture[] = [];
    private readonly keyboard = new Set<KeyboardKey>();
    readonly player = new Entity();
    private pete: [Texture, Texture] = [null!, null!];
    pizzaTotal: number = 0;
    pizzaFound: number = 0;
    win: boolean = false;
    async load(device: Device) {
        await addText("font/NotoSansSC-Regular.json", device);
        await addText("glsl/line.vert.sk", device);
        await addText("glsl/line.frag.sk", device);
        await addText("glsl/text.vert.sk", device);
        await addText("glsl/text.frag.sk", device);
        await addText("glsl/sprite.vert.sk", device);
        await addText("glsl/sprite.frag.sk", device);
        await addImage("font/NotoSansSC-Regular", device);
        await addImage("image/block", device);
        await addImage("image/pete01", device);
        await addImage("image/pete02", device);
        await addImage("image/platform", device);
        await addImage("image/block", device);
        await addImage("image/pizza", device);
        await addText("data/map01.dat", device);
        await addText("data/ents01.dat", device);
        for (let i = 1; i < MAX_TILES; i++) {
            await addImage(`image/tile${i}`, device);
        }

    }
    init() {
        this.initMap()
        this.initPlayer();
        this.loadEnts();
    }
    private loadEnts() {
        const lines = loadText("data/ents01.dat").split("\n").map((line) => line.trim());
        for (const line of lines) {
            const attr = line.split(" ").map((s) => s);
            if (attr[0] === "BLOCK") {
                const [_, x, y] = attr;
                this.initBlock(x, y);
            } else if (attr[0] === "PLATFORM") {
                const [_, sx, sy, ex, ey] = attr;
                this.initPlatform(sx, sy, ex, ey);
            } else if (attr[0] === "PIZZA") {
                const [_, x, y] = attr;
                this.initPizza(x, y);
                this.pizzaTotal++;
            }
        }
    }
    private initPizza(x: string, y: string) {
        const ent = new Entity();
        ent.x = parseInt(x);
        ent.y = parseInt(y);
        ent.texture = loadTexture(`image/pizza`);
        if (!ent.texture) {
            throw new Error(`ent.texture is null: pizza`);
        }
        ent.w = ent.texture.width;
        ent.h = ent.texture.height;
        ent.flags = EntityFlags.EF_WEIGHTLESS;
        ent.touch = function (game, other) {
            if (this.health > 0 && other === game.player) {
                this.health = 0;
                game.pizzaFound++;
                if (game.pizzaFound === game.pizzaTotal) {
                    game.win = true;
                }
            }
        }
        ent.tick = function (game) {
            this.value += 0.1;
            this.y += Math.sin(this.value);
        }
        this.entities.add(ent);
    }
    private initPlatform(sx: string, sy: string, ex: string, ey: string) {
        const ent = new Entity();
        ent.x = parseInt(sx);
        ent.y = parseInt(sy);
        ent.sx = parseInt(sx);
        ent.sy = parseInt(sy);
        ent.ex = parseInt(ex);
        ent.ey = parseInt(ey);
        ent.tick = function (game) {
            if (Math.abs(this.x - this.sx) < PLATFORM_SPEED && Math.abs(this.y - this.sy) < PLATFORM_SPEED) {
                calculateSlope(this.ex, this.ey, this.x, this.y, this);

                this.dx *= PLATFORM_SPEED;
                this.dy *= PLATFORM_SPEED;
            }

            if (Math.abs(this.x - this.ex) < PLATFORM_SPEED && Math.abs(this.y - this.ey) < PLATFORM_SPEED) {
                calculateSlope(this.sx, this.sy, this.x, this.y, this);

                this.dx *= PLATFORM_SPEED;
                this.dy *= PLATFORM_SPEED;
            }
        }
        ent.texture = loadTexture(`image/platform`);
        if (!ent.texture) {
            throw new Error(`ent.texture is null: platform`);
        }
        ent.w = ent.texture.width;
        ent.h = ent.texture.height;
        ent.flags = EntityFlags.EF_SOLID + EntityFlags.EF_WEIGHTLESS + EntityFlags.EF_PUSH;
        this.entities.add(ent);
    }
    private initBlock(x: string, y: string) {
        const ent = new Entity();
        ent.x = parseInt(x);
        ent.y = parseInt(y);
        ent.texture = loadTexture(`image/block`);
        if (!ent.texture) {
            throw new Error(`ent.texture is null: block`);
        }
        ent.w = ent.texture.width;
        ent.h = ent.texture.height;
        ent.flags = EntityFlags.EF_SOLID + EntityFlags.EF_WEIGHTLESS;
        this.entities.add(ent);
    }

    private initPlayer() {
        const player = this.player;
        this.pete[0] = loadTexture("image/pete01");
        this.pete[1] = loadTexture("image/pete02");
        player.texture = this.pete[0];
        if (!player.texture) {
            throw new Error("player.texture is null");
        }
        player.w = player.texture.width;
        player.h = player.texture.height;
        this.entities.add(player);

    }
    private doEntities() {
        for (const entity of this.entities) {
            if (entity.tick) {
                entity.tick(this);
            }
            if (entity.health <= 0) {
                this.entities.delete(entity);
            }
            entity.move(this);
        }
        for (const entity of this.entities) {
            if (entity.riding) {
                entity.x += entity.riding.dx;
                entity.push(this, entity.riding.dx, 0);
            }
            entity.x = Math.min(Math.max(entity.x, 0), MAP_WIDTH * TILE_SIZE);
            entity.y = Math.min(Math.max(entity.y, 0), MAP_HEIGHT * TILE_SIZE);
        }

    }
    private doPlayer() {
        this.player.dx = 0;
        if (this.keyboard.has(KeyboardKey.KEY_A)) {
            this.player.dx = -PLAYER_MOVE_SPEED;
            this.player.texture = this.pete[1];
        }

        if (this.keyboard.has(KeyboardKey.KEY_D)) {
            this.player.dx = PLAYER_MOVE_SPEED;
            this.player.texture = this.pete[0];
        }

        if (this.keyboard.has(KeyboardKey.KEY_I) && this.player.isOnGround) {
            this.player.riding = null;
            this.player.dy = -20;
        }

        if (this.keyboard.has(KeyboardKey.KEY_SPACE)) {
            this.player.x = this.player.y = 0;
            this.keyboard.delete(KeyboardKey.KEY_SPACE);
        }

    }
    private initMap() {
        this.map.length = 0;
        for (let y = 0; y < MAP_HEIGHT; y++) {
            this.map.push([]);
            for (let x = 0; x < MAP_WIDTH; x++) {
                this.map[y].push(0);
            }

        }
        this.loadTiles();
        this.loadMap();
    }
    private loadTiles() {
        for (let i = 1; i < MAX_TILES; i++) {
            this.tiles[i] = (loadTexture(`image/tile${i}`));
        }
    }
    private loadMap() {
        const dat = loadText("data/map01.dat").split("\n").map((line) => line.trim().split(" "));
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                this.map[y][x] = parseInt(dat[y][x]);
            }
        }
    }
    prepareScene() {
        beginDrawing();
        clearBackground(LIGHTBLUE);
    }
    doInput() {
        for (const key of Object.keys(KeyboardKey)) {
            const value = KeyboardKey[key as keyof typeof KeyboardKey];
            if (typeof value === "number" && isKeyDown(value)) {
                this.keyboard.add(value);
            } else if (typeof value === "number" && isKeyUp(value)) {
                this.keyboard.delete(value);
            }
        }
    }
    private doCamera() {
        this.camera[0] = this.player.x + this.player.w / 2 - getScreenWidth() / 2;
        this.camera[1] = this.player.y + this.player.h / 2 - getScreenHeight() / 2;

        this.camera[0] = Math.min(Math.max(this.camera[0], 0), MAP_WIDTH * TILE_SIZE - getScreenWidth());
        this.camera[1] = Math.min(Math.max(this.camera[1], 0), MAP_HEIGHT * TILE_SIZE - getScreenHeight());
    }
    logic() {
        this.doPlayer();
        this.doCamera();
        this.doEntities();
    }
    draw() {
        this.drawMap()
        this.drawEntities();
        this.drawHud();
    }
    private drawHud() {
        drawText(`Pizza: ${this.pizzaFound}/${this.pizzaTotal}`, 10, 10, 20, BLUE);
        if (this.win) {
            drawText("You Win!", getScreenWidth() / 2 - 64, getScreenHeight() / 2 - 16, 32, WHITE);
        }
    }
    private drawEntities() {
        for (const entity of this.entities) {
            entity.draw(this)
        }
    }
    private drawMap() {
        const x1 = (this.camera[0] % TILE_SIZE) * -1;
        const x2 = x1 + MAP_RENDER_WIDTH() * TILE_SIZE + (x1 === 0 ? 0 : TILE_SIZE);

        const y1 = (this.camera[1] % TILE_SIZE) * -1;
        const y2 = y1 + MAP_RENDER_HEIGHT() * TILE_SIZE + (y1 === 0 ? 0 : TILE_SIZE);

        let mx = Math.floor(this.camera[0] / TILE_SIZE);
        let my = Math.floor(this.camera[1] / TILE_SIZE);
        for (let y = y1; y < y2; y += TILE_SIZE) {
            for (let x = x1; x < x2; x += TILE_SIZE) {
                if (mx >= 0 && my >= 0 && mx < MAP_WIDTH && my < MAP_HEIGHT) {
                    const n = this.map[my][mx];

                    if (n > 0) {
                        blit(this.tiles[n], x, y, WHITE);
                    }
                }

                mx++;
            }
            mx = Math.floor(this.camera[0] / TILE_SIZE);

            my++;
        }
    }
    presentScene() {
        endDrawing();
    }

}