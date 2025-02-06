import { vec4 } from "gl-matrix";
import { BlendMode, blit, setBlendMode, Texture, WHITE } from "../context";
import Game from "./Game";

export default class Effect {
    x: number = 0;
    y: number = 0;
    dx: number = 0;
    dy: number = 0;
    color: vec4 = WHITE;
    texture: Texture | null = null;
    life = 0;
    doEffect({ effects }: Game) {
        this.x += this.dx;
        this.y += this.dy;
        this.color[3] = Math.max(0, this.color[3] - 1);
        if (--this.life <= 0) {
            effects.delete(this);
        }
    }
    draw({ camera }: Game) {
        blit(this.texture, this.x - camera[0], this.y - camera[1], this.color);
    }
}