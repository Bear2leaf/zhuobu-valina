import { loadTexture, getScreenWidth, getScreenHeight, rand } from "../context";
import { Side } from "./defs";
import Entity from "./Entity";
import Game from "./Game";
import { calculateSlope, getAngle } from "./utils";

export default class Enemy extends Entity {
    radius: number = 32
    tick({player}: Game): void {
        this.angle = getAngle(this.x, this.y, player.x, player.y);
        calculateSlope(player.x, player.y, this.x, this.y, this);
    }
    die(game: Game): void {
        if (rand() % 2 === 0) {
            game.addRandomPowerup(this.x, this.y);
        }
        game.score += 10;
    }
}