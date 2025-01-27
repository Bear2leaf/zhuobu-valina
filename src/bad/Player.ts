import { getScreenWidth, KeyboardKey, loadTexture } from "../context";
import { PLAYER_SPEED, Side } from "./defs";
import Entity from "./Entity";
import Game from "./Game";
import { getAngle } from "./utils";

export default class Player extends Entity {
    initPlayer({ entities }: Game) {

        const player = this;
        player.texture = loadTexture("image/donk");
        player.side = Side.SIDE_PLAYER;
        player.w = player.texture.width;
        player.h = player.texture.height;
        player.health = 5;
        player.x = getScreenWidth() / 2;
        player.y = getScreenWidth() / 2;
        entities.add(player);
    }
    doPlayer({ keyboard, mouse }: Game) {

        const player = this;
        player.dx *= 0.85;
        player.dy *= 0.85;
        if (keyboard.has(KeyboardKey.KEY_W)) {
            player.dy = -1 * PLAYER_SPEED;
        }
        if (keyboard.has(KeyboardKey.KEY_S)) {
            player.dy = PLAYER_SPEED;
        }
        if (keyboard.has(KeyboardKey.KEY_A)) {
            player.dx = -1 * PLAYER_SPEED;
        }
        if (keyboard.has(KeyboardKey.KEY_D)) {
            player.dx = PLAYER_SPEED;
        }
        player.angle = getAngle(player.x, player.y, mouse.x, mouse.y);
    }
}
