import { addImage, addText, beginDrawing, beginFramebuffer, BLACK, blit, blitRect, blitRectRect, BLUE, clearBackground, createFrameBuffer, drawFPS, drawLine, drawText, endDrawing, endFramebuffer, Framebuffer, getScreenHeight, RAYWHITE, Rectangle, Texture, TRANSPARENT, WHITE } from "../context";
import { blitAtlasImage, blitAtlasImageRotated, blitAtlasImageScaled } from "./atlas";
import Device from "../device/Device";
import { addAtlas, getAtlasImage, initAtlas } from "./atlas";

export default class Game {
    async load(device: Device) {
        await addText("font/NotoSansSC-Regular.json", device);
        await addText("glsl/line.vert.sk", device);
        await addText("glsl/line.frag.sk", device);
        await addText("glsl/text.vert.sk", device);
        await addText("glsl/text.frag.sk", device);
        await addText("glsl/sprite.vert.sk", device);
        await addText("glsl/sprite.frag.sk", device);
        await addImage("font/NotoSansSC-Regular", device);
        await addAtlas(device);
    }
    init() {
        initAtlas();
    }
    prepareScene() {
        beginDrawing();
        clearBackground(RAYWHITE);
    }
    doInput() {
    }
    logic() {
    }
    draw() {
        drawLine(50, 0, 50, getScreenHeight(), BLUE);
        drawLine(150, 0, 150, getScreenHeight(), BLUE);
        drawLine(900, 0, 900, getScreenHeight(), BLUE);
        drawLine(1000, 0, 1000, getScreenHeight(), BLUE);
        drawLine(0, 50, 1280, 50, BLUE);
        drawLine(0, 150, 1280, 150, BLUE);
        drawLine(0, 250, 1280, 250, BLUE);
        drawLine(0, 450, 1280, 450, BLUE);
        
        drawTiles();

        drawTallSpinner();

        drawAlphaSpheres();

        drawColourCubes();

        drawScaledSprites();
    }



    presentScene() {
        endDrawing();
    }

}

let tileAngle = 0;
let tallAngle = 0;
const tallAtlasImage = "atlas/tall/long";
const sphereAtlasImages = ["atlas/spheres/smallRed", "atlas/spheres/smallGreen", "atlas/spheres/smallGrey", "atlas/spheres/smallCyan"];
const tiles = [
    "atlas/tiles/1",
    "atlas/tiles/7",
]
function drawTiles() {
    tileAngle += 1;
    blitAtlasImage(tiles[0], 50, 50);

    blitAtlasImage(tiles[1], 150, 50);
    blitAtlasImageRotated("atlas/tiles/7", 250, 50, WHITE, tileAngle);
}

function drawTallSpinner() {
    tallAngle += 1;
    blitAtlasImageRotated(tallAtlasImage, 150, 250, WHITE, tallAngle);

    blitAtlasImageRotated(tallAtlasImage, 300, 250, WHITE, tallAngle + 20);

    blitAtlasImageRotated(tallAtlasImage, 450, 250, WHITE, tallAngle + 40);

    blitAtlasImageRotated(tallAtlasImage, 600, 250, WHITE, tallAngle + 60);

    blitAtlasImageRotated(tallAtlasImage, 750, 250, WHITE, tallAngle + 80);
}

function drawAlphaSpheres() {
    blitAtlasImage(sphereAtlasImages[0], 50, 150, WHITE);

    blitAtlasImage(sphereAtlasImages[1], 100, 150, [255, 255, 255, 192]);

    blitAtlasImage(sphereAtlasImages[2], 150, 150, [255, 255, 255, 128]);

    blitAtlasImage(sphereAtlasImages[3], 200, 150, [255, 255, 255, 64]);

}
const cube = "atlas/cubes/bigGrey";

function drawColourCubes() {

    blitAtlasImage(cube, 50, 450, [255, 255, 255, 255]);


    blitAtlasImage(cube, 150, 450, [255, 0, 0, 255]);


    blitAtlasImage(cube, 250, 450, [255, 128, 0, 255]);


    blitAtlasImage(cube, 350, 450, [255, 255, 0, 255]);


    blitAtlasImage(cube, 450, 450, [128, 255, 0, 255]);


    blitAtlasImage(cube, 550, 450, [0, 255, 0, 255]);


    blitAtlasImage(cube, 650, 450, [0, 255, 128, 255]);


    blitAtlasImage(cube, 750, 450, [0, 255, 255, 255]);

}

function drawScaledSprites() {
    blitAtlasImageScaled(cube, 700, 50, 32, 32);

    blitAtlasImageScaled(cube, 800, 50, 128, 32);

    blitAtlasImageScaled(cube, 1000, 50, 32, 128);
    {
        const [_, { width, height }] = getAtlasImage(tiles[0]);
        blitAtlasImageScaled(tiles[0], 900, 250, width * 3, height * 3);
    }
    {

        const [_, { width, height }] = getAtlasImage(tiles[1]);
        blitAtlasImageScaled(tiles[1], 900, 450, width * 4, height * 4);
    }

}