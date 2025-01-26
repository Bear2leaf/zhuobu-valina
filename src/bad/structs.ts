import { vec2, vec4 } from "gl-matrix";
import { KeyboardKey, Texture } from "../context";
import Entity from "./Entity";


export interface Delegate {
	logic(): void
	draw(): void
};


export type Mouse = {
	x: number
	y: number
	left: boolean
	right: boolean
	middle: boolean
	wheel: number
};

export type Effect = {
	x: number
	y: number
	dx: number
	dy: number
	life: number
	color: vec4
	texture: Texture
};

export type Stage = {
	score: number,
	targetterTexture: Texture | null,
	readonly entities: Set<Entity>,
	readonly bullets: Set<Entity>,
	readonly effects: Set<Effect>,
	readonly ammo: Set<number>,
	readonly camera: vec2,
};

export type Highscore = {
	name: string,
	recent: number,
	score: number
};

export type Highscores = Highscore[];