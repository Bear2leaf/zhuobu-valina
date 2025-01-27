import { getFPS, getScreenWidth, KeyboardKey, loadTexture, rand } from "../context";
import { PLAYER_SPEED, Side, Weapon } from "./defs";
import Entity from "./Entity";
import Game from "./Game";
import { calculateSlope, getAngle } from "./utils";

export default class Player extends Entity {
    radius: number = 24
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
    doPlayer(game: Game) {
        const { keyboard, mouse, ammo } = game;
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
    private fireDonkPistol(game: Game) {
        const { mouse, donkBulletTexture, bullets } = game;
        const b = new Entity();
        bullets.add(b);
        b.x = this.x;
        b.y = this.y;
        b.texture = donkBulletTexture;
        b.health = getFPS() * 2;
        b.angle = this.angle;
        calculateSlope(mouse.x, mouse.y, this.x, this.y, b);
        b.dx *= 16;
        b.dy *= 16;
        b.side = Side.SIDE_PLAYER;
        this.reload = 16;
    }
    private fireDonkUzi(game: Game) {
        const { mouse, donkBulletTexture, bullets } = game;
        const b = new Entity();
        bullets.add(b);
        b.x = this.x;
        b.y = this.y;
        b.texture = donkBulletTexture
        b.health = getFPS() * 2;
        b.angle = this.angle;
        calculateSlope(mouse.x, mouse.y, this.x, this.y, b);
        b.dx *= 16;
        b.dy *= 16;
        b.side = Side.SIDE_PLAYER;
        this.reload = 4;

    }
    private fireDonkShotgun(game: Game) {
        const {mouse, donkBulletTexture} = game;
        const slope = { dx: 0, dy: 0 };
        calculateSlope(mouse.x, mouse.y, this.x, this.y, slope);
        slope.dx = this.x + (slope.dx * 128);
        slope.dy = this.y + (slope.dy * 128);
        let destX=0, destY=0;
        for (let i = 0; i < 8; i++) {
            const bullet = new Entity();
            bullet.texture = donkBulletTexture;
            bullet.x = this.x + rand() % 16 - rand() % 16;
            bullet.y = this.y + rand() % 16 - rand() % 16;
            
            bullet.health = getFPS() * 2;
            bullet.angle = this.angle;
            bullet.dx = slope.dx;
            bullet.dy = slope.dy;
            destX = slope.dx + (rand() % 24 - rand() % 24);
            destY = slope.dy + (rand() % 24 - rand() % 24);
            calculateSlope(destX, destY, bullet.x, bullet.y, bullet);
            bullet.dx *= 16;
            bullet.dy *= 16;
            bullet.side = Side.SIDE_PLAYER;
            game.bullets.add(bullet);
        }
        this.reload = getFPS() * 0.75;
        
    }
}
