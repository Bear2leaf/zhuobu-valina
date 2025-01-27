import { vec4 } from "gl-matrix";
import { getFPS, getScreenWidth, KeyboardKey, rand, WHITE } from "../context";
import { PLAYER_SPEED, Side, Weapon } from "./defs";
import Entity from "./Entity";
import Game from "./Game";
import { calculateSlope, getAngle } from "./utils";

export default class Player extends Entity {
    radius: number = 24
    initPlayer({ entities, donkTexture }: Game) {
        if (!donkTexture) {
            throw new Error("donkTexture is not defined");
        }
        const player = this;
        player.texture = donkTexture;
        player.side = Side.SIDE_PLAYER;
        player.w = player.texture.width;
        player.h = player.texture.height;
        player.health = 5;
        player.x = getScreenWidth() / 2;
        player.y = getScreenWidth() / 2;
        entities.add(player);
    }
    doPlayer(game: Game) {
        const { keyboard, mouse, ammo, camera } = game;
        const player = this;
        if (player.health <= 0) {
            game.introTimeout = Math.max(0, game.introTimeout - 1);
            if (game.introTimeout === 0) {
                game.intro = true;
            }
            return;
        }
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
        player.angle = getAngle(player.x - camera[0], player.y - camera[1], mouse.x, mouse.y);
        if (player.reload === 0 && ammo[player.weaponType] > 0 && mouse.left) {
            this.fireDonkBullet(game);
            ammo[player.weaponType]--;
        }

        if (mouse.wheel < 0) {
            if (--player.weaponType < 0) {
                player.weaponType = Weapon.WPN_MAX - 1;
            }
            mouse.wheel = 0;
        }
        if (mouse.wheel > 0) {
            if (++player.weaponType >= Weapon.WPN_MAX) {
                player.weaponType = Weapon.WPN_PISTOL;
            }
            mouse.wheel = 0;
        }
        if (mouse.right) {
            if (player.weaponType === Weapon.WPN_PISTOL && ammo[Weapon.WPN_PISTOL] === 0) {
                ammo[Weapon.WPN_PISTOL] = 12;
            }
            mouse.right = false;
        }
    }
    private fireDonkBullet(game: Game) {
        switch (this.weaponType) {
            case Weapon.WPN_UZI:
                this.fireDonkUzi(game);
                break;
            case Weapon.WPN_SHOTGUN:
                this.fireDonkShotgun(game);
                break;
            default:
                this.fireDonkPistol(game);
                break
        }
    }
    private createDonkBullet(game: Game) {
        const { mouse, bulletTexture, bullets } = game;
        if (!bulletTexture) {
            throw new Error("bulletTexture is not defined");
        }
        const b = new Entity();
        bullets.add(b);
        b.x = this.x;
        b.y = this.y;
        b.texture = bulletTexture;
        b.w = b.texture.width;
        b.h = b.texture.height;
        b.texture = bulletTexture;
        b.health = getFPS() * 2;
        b.angle = this.angle;
        b.side = Side.SIDE_PLAYER;
        b.color = vec4.clone(WHITE);
        b.color[0] = 128;
        return b;

    }
    private fireDonkPistol(game: Game) {
        const { mouse, bulletTexture, bullets } = game;
        const b = this.createDonkBullet(game);
        calculateSlope(mouse.x, mouse.y, b.x - game.camera[0], b.y - game.camera[1], b);
        b.dx *= 16;
        b.dy *= 16;
        this.reload = 16;
    }
    private fireDonkUzi(game: Game) {
        const { mouse, bulletTexture, bullets } = game;
        const b = this.createDonkBullet(game);
        calculateSlope(mouse.x, mouse.y, this.x - game.camera[0], this.y - game.camera[1], b);
        b.dx *= 16;
        b.dy *= 16;
        b.side = Side.SIDE_PLAYER;
        this.reload = 4;

    }
    private fireDonkShotgun(game: Game) {
        const { mouse, bulletTexture } = game;
        const slope = { dx: 0, dy: 0 };
        calculateSlope(mouse.x, mouse.y, this.x - game.camera[0], this.y - game.camera[1], slope);
        slope.dx = this.x + (slope.dx * 128);
        slope.dy = this.y + (slope.dy * 128);
        let destX = 0, destY = 0;
        for (let i = 0; i < 8; i++) {
            const b = this.createDonkBullet(game);
            destX = slope.dx + (rand() % 24 - rand() % 24);
            destY = slope.dy + (rand() % 24 - rand() % 24);
            calculateSlope(destX, destY, b.x, b.y, b);
            b.dx *= 16;
            b.dy *= 16;
        }
        this.reload = getFPS() * 0.75;

    }
}
