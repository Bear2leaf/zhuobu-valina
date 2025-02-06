import { vec4 } from "gl-matrix";
import { getScreenWidth, getScreenHeight, rand, getFPS, RED, RAYWHITE } from "../context";
import { Side } from "./defs";
import Effect from "./Effect";
import Entity from "./Entity";
import Game from "./Game";
import Player from "./Player";
import { calculateSlope, getAngle } from "./utils";

export default class Enemy extends Entity {
    fireEnemyBullet({ player, bulletTexture, bullets }: Game) {
        if (!bulletTexture) {
            throw new Error("bulletTexture is not defined");
        }
        const b = new Entity
        b.side = Side.SIDE_ENEMY
        b.texture = bulletTexture
        b.w = b.texture.width
        b.h = b.texture.height
        b.x = this.x
        b.y = this.y
        b.health = getFPS() * 2;
        b.angle = getAngle(this.x, this.y, player.x, player.y)
        b.radius = 16;
        b.color = vec4.clone(RED)
        calculateSlope(player.x, player.y, b.x, b.y, b);
        b.dx *= 12;
        b.dy *= 12;
        bullets.add(b);

    }
    radius: number = 32
    die(game: Game): void {
        if (rand() % 2 === 0) {
            game.addRandomPowerup(this.x, this.y);
        }
        game.score += 10;
        this.addEnemyDeathEffect(game);
    }
    addEnemyDeathEffect({ effects, whiteSquare16 }: Game) {
        for (let i = 0; i < 128; i++) {
            const e = new Effect();
            e.x = this.x;
            e.y = this.y;
            e.dx = 400 - rand() % 800;
            e.dy = 400 - rand() % 800;
            e.dx /= 100;
            e.dy /= 100;
            e.texture = whiteSquare16;
            e.life = rand() % getFPS();

            e.color = [255, 128 + rand() % 128, 0, rand() % 255];
            effects.add(e);
        }
    }
}