import { getScreenHeight, getScreenWidth } from "../context";

export const MAX_TILES = 8;


export const TILE_SIZE = 64;

export const MAP_WIDTH = 40;
export const MAP_HEIGHT = 20;

export const MAP_RENDER_WIDTH = () => Math.ceil(getScreenWidth() / TILE_SIZE);
export const MAP_RENDER_HEIGHT = () => Math.ceil(getScreenHeight() / TILE_SIZE);
export const PLAYER_MOVE_SPEED = 8;