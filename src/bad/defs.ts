

export const SCREEN_WIDTH = () =>   1280
export const SCREEN_HEIGHT = () =>  720

export const ARENA_WIDTH = () =>   (SCREEN_WIDTH() * 5)
export const ARENA_HEIGHT = () =>  (SCREEN_HEIGHT() * 5)

export const MAX_NAME_LENGTH =        32
export const MAX_LINE_LENGTH =        1024
export const MAX_SCORE_NAME_LENGTH =  16

export const FPS =  60

export const GRID_SIZE =  64

export const GRID_RENDER_WIDTH =   (SCREEN_WIDTH() / GRID_SIZE)
export const GRID_RENDER_HEIGHT =  ((SCREEN_HEIGHT() / GRID_SIZE) + 1)

export const MAX_KEYBOARD_KEYS =  350
export const MAX_MOUSE_BUTTONS =  6

export const MAX_SND_CHANNELS =  16

export const NUM_HIGHSCORES =  8

export const PLAYER_SPEED =  120

export const GLYPH_WIDTH =   18
export const GLYPH_HEIGHT =  29

export enum TextAlignment
{
	TEXT_LEFT,
	TEXT_CENTER,
	TEXT_RIGHT
};

export enum Weapon
{
	WPN_PISTOL,
	WPN_UZI,
	WPN_SHOTGUN,
	WPN_MAX
};

export enum Side
{
	SIDE_NONE,
	SIDE_PLAYER,
	SIDE_ENEMY
};

export enum Sound
{
	SND_PISTOL,
	SND_UZI,
	SND_SHOTGUN,
	SND_ENEMY_BULLET,
	SND_AMMO,
	SND_POINTS,
	SND_ENEMY_HIT,
	SND_DONK_HIT,
	SND_ENEMY_DIE,
	SND_DONK_DIE,
	SND_MAX
};

export enum AudioChannel
{
	CH_ANY = -1,
	CH_DONK,
	CH_ITEM,
	CH_ENEMY_BULLET,
	CH_HIT
};
