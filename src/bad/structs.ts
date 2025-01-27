import { vec2, vec4 } from "gl-matrix";
import { KeyboardKey, Texture } from "../context";
import Entity from "./Entity";




export type Highscore = {
	name: string,
	recent: number,
	score: number
};

export type Highscores = Highscore[];