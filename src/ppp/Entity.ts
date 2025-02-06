import { collision } from "../bad/utils";
import { blit, getFrameTime, RAYWHITE, Texture } from "../context";
import { EntityFlags, MAP_HEIGHT, MAP_WIDTH, TILE_SIZE } from "./defs";
import Game from "./Game";

export default class Entity {
    x: number = 0;
    y: number = 0;
    sx: number = 0;
    sy: number = 0;
    ex: number = 0;
    ey: number = 0;
    w: number = 0;
    h: number = 0;
    dx: number = 0;
    dy: number = 0;
    health: number = 1;
    value: number = 0;
    isOnGround: boolean = false;
    texture: Texture | null = null;
    flags: EntityFlags = EntityFlags.EF_NONE;
    riding: Entity | null = null;
    tick?: (game: Game) => void;
    move(game: Game) {
        if (!(this.flags & EntityFlags.EF_WEIGHTLESS)) {
            this.dy += 1.5;
            this.dy = Math.max(-999, Math.min(18, this.dy));
        }
        if (this.riding && this.riding.dy > 0) {
            this.dy = this.riding.dy + 1;
        }

        this.riding = null;

        this.isOnGround = false;

        this.x += this.dx;
        this.push(game, this.dx, 0);

        this.y += this.dy;
        this.push(game, 0, this.dy);
    }
    push(game: Game, dx: number, dy: number) {
        this.moveToWorld(game.map, dx, dy);
        this.moveToEntities(game, dx, dy);

    }
    touch?(game: Game, other: Entity): void;
    draw({ camera }: Game) {
        blit(this.texture, this.x - camera[0], this.y - camera[1], RAYWHITE);
    }
    private moveToEntities(game: Game, dx: number, dy: number) {
        const entities = game.entities;
        const e = this;
        for (const other of entities) {
            if (this !== other && collision(this.x, this.y, this.w, this.h, other.x, other.y, other.w, other.h)) {
                if (other.flags & EntityFlags.EF_SOLID) {
                    if (dy !== 0) {

                        const adj = dy > 0 ? -e.h : other.h;

                        e.y = other.y + adj;

                        e.dy = 0;

                        if (dy > 0) {
                            e.isOnGround = true;

                            e.riding = other;
                        }
                    }
                    if (dx !== 0) {
                        const adj = dx > 0 ? -e.w : other.w;

                        e.x = other.x + adj;

                        e.dx = 0;
                    }

                } else if (e.flags & EntityFlags.EF_PUSH) {
                    other.x += e.dx;
                    other.push(game, e.dx, 0);

                    other.y += e.dy;
                    other.push(game, 0, e.dy);
                }
                if (e.touch) {
                    e.touch(game, other);
                }
            }

        }
    }
    private moveToWorld(map: number[][], dx: number, dy: number) {
        const e = this;
        let mx, my, hit, adj;

        if (dx !== 0) {

            mx = dx > 0 ? (e.x + e.w) : e.x;
            mx /= TILE_SIZE;

            my = (e.y / TILE_SIZE);

            hit = 0;

            mx = Math.floor(mx);
            my = Math.floor(my);
            if (!this.isInsideMap(mx, my) || map[my][mx] !== 0) {
                hit = 1;
            }

            my = (e.y + e.h - 1) / TILE_SIZE;
            mx = Math.floor(mx);
            my = Math.floor(my);
            if (!this.isInsideMap(mx, my) || map[my][mx] !== 0) {
                hit = 1;
            }

            if (hit) {
                adj = dx > 0 ? -e.w : TILE_SIZE;

                e.x = (mx * TILE_SIZE) + adj;
                e.dx = 0;
            }
        }

        if (dy !== 0) {

            my = dy > 0 ? (e.y + e.h) : e.y;
            my /= TILE_SIZE;

            mx = e.x / TILE_SIZE;

            hit = 0;

            mx = Math.floor(mx);
            my = Math.floor(my);
            if (!this.isInsideMap(mx, my) || map[my][mx] !== 0) {
                hit = 1;
            }

            mx = (e.x + e.w - 1) / TILE_SIZE;

            mx = Math.floor(mx);
            my = Math.floor(my);
            if (!this.isInsideMap(mx, my) || map[my][mx] !== 0) {
                hit = 1;
            }
            if (hit) {
                adj = dy > 0 ? -e.h : TILE_SIZE;

                e.y = (my * TILE_SIZE) + adj;

                e.dy = 0;

                e.isOnGround = dy > 0;
            }
        }
    }
    private isInsideMap(x: number, y: number) {
        return x >= 0 && y >= 0 && x < MAP_WIDTH && y < MAP_HEIGHT;
    }
}