import Entity from "./Entity";
import Game from "./Game";

export default class Item extends Entity {
    tick(game: Game): void {
        this.health--;
        this.dx *= 0.98;
        this.dy *= 0.98;
    }
}