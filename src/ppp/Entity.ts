import { blit, getFrameTime, RAYWHITE, Texture } from "../context";
import { MAP_HEIGHT, MAP_WIDTH, TILE_SIZE } from "./defs";
import Game from "./Game";

export default class Entity {

    x: number = 0;
    y: number = 0;
    w: number = 0;
    h: number = 0;
    dx: number = 0;
    dy: number = 0;
    isOnGround: boolean = false;
    texture: Texture | null = null;
    private flags: number = 0;
    move(game: Game) {
        this.dy += 1.5;
        this.dy = Math.max(-999, Math.min(18, this.dy));
        this.isOnGround = false;
        this.moveToWorld(game.map, this.dx, 0);
        this.moveToWorld(game.map, 0, this.dy);
        this.x = Math.min(Math.max(this.x, 0), MAP_WIDTH * TILE_SIZE);
        this.y = Math.min(Math.max(this.y, 0), MAP_HEIGHT * TILE_SIZE);
    }
    draw({camera}: Game) {
        blit(this.texture, this.x - camera[0], this.y - camera[1], RAYWHITE);
    }
    private moveToWorld(map: number[][], dx: number, dy: number) {
        const e = this;
        let mx, my, hit, adj;

        if (dx !== 0) {
            e.x += dx * 50 * getFrameTime();

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
            e.y += dy * 50 * getFrameTime();

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