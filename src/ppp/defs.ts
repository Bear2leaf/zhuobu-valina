import { getScreenHeight, getScreenWidth } from "../context";

export const MAX_TILES = 8;


export const TILE_SIZE = 64;

export const MAP_WIDTH = 40;
export const MAP_HEIGHT = 20;
export const PLATFORM_SPEED = 4;
export const MAP_RENDER_WIDTH = () => Math.ceil(getScreenWidth() / TILE_SIZE);
export const MAP_RENDER_HEIGHT = () => Math.ceil(getScreenHeight() / TILE_SIZE);
export const PLAYER_MOVE_SPEED = 6;

export enum EntityFlags {
    EF_NONE = 0,
    EF_WEIGHTLESS = 2 << 0,
    EF_SOLID = 2 << 1,
    EF_PUSH = 2 << 2,
}